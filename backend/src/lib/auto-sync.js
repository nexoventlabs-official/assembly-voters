const { connectDB, VoterModel } = require("./mongodb");
const { getAllVoters } = require("./google-sheets");

let isSyncing = false;
let lastSyncTime = null;
let lastSyncCount = 0;
let syncTimer = null;

async function runSync() {
  if (isSyncing) {
    console.log("[Auto-Sync] Skipped — sync already in progress");
    return;
  }

  isSyncing = true;
  const start = Date.now();
  console.log(`[Auto-Sync] Starting at ${new Date().toISOString()}`);

  try {
    await connectDB();
    const voters = await getAllVoters();

    if (voters.length === 0) {
      console.log("[Auto-Sync] No voters fetched from Google Sheets, skipping");
      isSyncing = false;
      return;
    }

    // Upsert to preserve voter _id (so CallStatus references stay valid)
    const BATCH_SIZE = 500;
    const seenKeys = new Set();
    for (let i = 0; i < voters.length; i += BATCH_SIZE) {
      const ops = voters.slice(i, i + BATCH_SIZE).map((v) => {
        const sheetName = (v.sheetName || "").trim();
        const row = v.row;
        seenKeys.add(`${sheetName}::${row}`);
        return {
          updateOne: {
            filter: { sheetName, row },
            update: {
              $set: {
                name: (v.name || "").trim(),
                email: (v.email || "").trim(),
                mobile: (v.mobile || "").trim(),
                optionalMobile: (v.optionalMobile || "").trim(),
                partyName: (v.partyName || "").trim(),
                assemblyName: (v.assemblyName || v.sheetName || "").trim(),
                status: v.status,
                isDuplicate: v.isDuplicate,
              },
            },
            upsert: true,
          },
        };
      });
      await VoterModel.bulkWrite(ops, { ordered: false });
    }

    // Remove voters no longer in the sheet
    const allVotersInDb = await VoterModel.find({}, { sheetName: 1, row: 1 }).lean();
    const toDelete = allVotersInDb
      .filter((v) => !seenKeys.has(`${v.sheetName}::${v.row}`))
      .map((v) => v._id);
    if (toDelete.length > 0) {
      await VoterModel.deleteMany({ _id: { $in: toDelete } });
    }

    lastSyncTime = new Date();
    lastSyncCount = voters.length;
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[Auto-Sync] Done — ${voters.length} candidates in ${elapsed}s`);
  } catch (error) {
    console.error("[Auto-Sync] Error:", error.message);
  } finally {
    isSyncing = false;
  }
}

function startAutoSync() {
  // Interval in minutes from env, default 5
  const intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || "5", 10);
  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[Auto-Sync] Scheduled every ${intervalMinutes} minutes`);

  // Run first sync after 10 seconds (let server start first)
  setTimeout(() => {
    runSync();
  }, 10000);

  // Then repeat on interval
  syncTimer = setInterval(() => {
    runSync();
  }, intervalMs);
}

function stopAutoSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log("[Auto-Sync] Stopped");
  }
}

function getSyncStatus() {
  return {
    isSyncing,
    lastSyncTime,
    lastSyncCount,
    intervalMinutes: parseInt(process.env.SYNC_INTERVAL_MINUTES || "5", 10),
  };
}

module.exports = { startAutoSync, stopAutoSync, runSync, getSyncStatus };
