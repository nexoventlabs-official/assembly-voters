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

    // Replace all data atomically
    await VoterModel.deleteMany({});

    const BATCH_SIZE = 500;
    for (let i = 0; i < voters.length; i += BATCH_SIZE) {
      const batch = voters.slice(i, i + BATCH_SIZE).map((v) => ({
        sheetName: v.sheetName,
        row: v.row,
        name: v.name,
        email: v.email,
        mobile: v.mobile,
        optionalMobile: v.optionalMobile,
        partyName: v.partyName,
        assemblyName: v.assemblyName || v.sheetName,
        status: v.status,
        isDuplicate: v.isDuplicate,
      }));
      await VoterModel.insertMany(batch, { ordered: false });
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
