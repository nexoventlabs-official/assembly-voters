const express = require("express");
const { getDashboardStats, getSheetNames, getAssemblyStats } = require("../lib/google-sheets");
const { connectDB, VoterModel } = require("../lib/mongodb");
const { getAllVoters } = require("../lib/google-sheets");
const router = express.Router();

function titleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

// GET /api/dashboard
router.get("/", async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// GET /api/sheets
router.get("/sheets", async (req, res) => {
  try {
    const sheetNames = await getSheetNames();
    res.json({ sheets: sheetNames });
  } catch (error) {
    console.error("Error fetching sheet names:", error);
    res.status(500).json({ error: "Failed to fetch sheet names" });
  }
});

// GET /api/assembly-stats?assembly=xxx
router.get("/assembly-stats", async (req, res) => {
  try {
    const { assembly } = req.query;
    if (!assembly) {
      return res.status(400).json({ error: "Assembly name is required" });
    }
    const stats = await getAssemblyStats(assembly);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching assembly stats:", error);
    res.status(500).json({ error: "Failed to fetch assembly stats" });
  }
});

// POST /api/sync
router.post("/sync", async (req, res) => {
  try {
    await connectDB();
    const voters = await getAllVoters();

    if (voters.length > 0) {
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
                  partyName: titleCase((v.partyName || "").trim()),
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
    }

    res.json({ success: true, count: voters.length, message: `Synced ${voters.length} voters to MongoDB` });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: "Failed to sync data" });
  }
});

module.exports = router;
