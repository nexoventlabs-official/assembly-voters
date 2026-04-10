const express = require("express");
const {
  getVotersFromSheet,
  addVoter,
  updateVoterStatus,
  updateVoter,
  deleteVoterRow,
  getAllAcceptedVoters,
} = require("../lib/google-sheets");
const { connectDB, VoterModel } = require("../lib/mongodb");
const XLSX = require("xlsx");
const router = express.Router();

// GET /api/voters?assembly=xxx&status=xxx
router.get("/", async (req, res) => {
  try {
    const { assembly, status } = req.query;
    if (!assembly) {
      return res.status(400).json({ error: "Assembly parameter is required" });
    }

    let voters = await getVotersFromSheet(assembly);

    if (status && status !== "total") {
      voters = voters.filter((v) => {
        const voterStatus = v.status.toLowerCase() || "pending";
        return voterStatus === status.toLowerCase();
      });
    }

    res.json({ voters });
  } catch (error) {
    console.error("Error fetching voters:", error);
    res.status(500).json({ error: "Failed to fetch voters" });
  }
});

// GET /api/voters/all - from MongoDB
router.get("/all", async (req, res) => {
  try {
    await connectDB();

    let count = await VoterModel.countDocuments();
    if (count === 0) {
      // Auto-sync from Google Sheets
      const { getAllVoters } = require("../lib/google-sheets");
      const voters = await getAllVoters();
      if (voters.length > 0) {
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
      }
    }

    const voters = await VoterModel.find({}).lean();
    res.json({ voters, count: voters.length });
  } catch (error) {
    console.error("Error fetching all voters:", error);
    res.status(500).json({ error: "Failed to fetch voters" });
  }
});

// POST /api/voters - add voter
router.post("/", async (req, res) => {
  try {
    const { sheetName, name, email, mobile, optionalMobile, partyName, assemblyName } = req.body;

    if (!sheetName || !name) {
      return res.status(400).json({ error: "Sheet name and candidate name are required" });
    }

    const existingVoters = await getVotersFromSheet(sheetName);
    const normalize = (s) => (s || "").trim().toLowerCase();
    const isDuplicate = existingVoters.some(
      (v) => normalize(v.name) === normalize(name) && normalize(v.partyName) === normalize(partyName || "")
    );

    if (isDuplicate) {
      return res.status(409).json({
        error: "duplicate",
        message: "A candidate with the same name and party already exists in this assembly.",
      });
    }

    const cleanPhone = (val) => (val ? val.replace(/[^0-9]/g, "") : "");
    const cleanEmail = (val) => (val ? val.trim().toLowerCase().replace(/[.\s]+$/, "") : "");

    const sanitizedMobile = cleanPhone(mobile) || "N/A";
    const sanitizedOptionalMobile = cleanPhone(optionalMobile);
    const sanitizedEmail = cleanEmail(email) || "N/A";

    await addVoter(sheetName, {
      name,
      email: sanitizedEmail,
      mobile: sanitizedMobile,
      optionalMobile: sanitizedOptionalMobile,
      partyName: partyName || "",
      assemblyName: assemblyName || sheetName,
      status: "pending",
      isDuplicate: false,
    });

    // Also add to MongoDB
    await connectDB();
    const newRow = existingVoters.length + 3;
    await VoterModel.create({
      sheetName,
      row: newRow,
      name,
      email: sanitizedEmail,
      mobile: sanitizedMobile,
      optionalMobile: sanitizedOptionalMobile,
      partyName: partyName || "",
      assemblyName: assemblyName || sheetName,
      status: "pending",
      isDuplicate: false,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding voter:", error);
    res.status(500).json({ error: "Failed to add voter" });
  }
});

// PUT /api/voters/update
router.put("/update", async (req, res) => {
  try {
    const { sheetName, row, status, name, email, mobile, optionalMobile, partyName, assemblyName } = req.body;

    if (!sheetName || !row) {
      return res.status(400).json({ error: "Sheet name and row are required" });
    }

    await connectDB();

    if (status && !name) {
      await updateVoterStatus(sheetName, row, status);

      const mongoUpdate = {};
      if (status.toLowerCase() === "duplicate") {
        mongoUpdate.isDuplicate = true;
      } else {
        mongoUpdate.status = status;
      }
      await VoterModel.updateOne({ sheetName, row }, { $set: mongoUpdate });
    } else {
      await updateVoter(sheetName, row, {
        name,
        email: email || "",
        mobile,
        optionalMobile: optionalMobile || "",
        partyName: partyName || "",
        assemblyName: assemblyName || sheetName,
        status: status || "pending",
        isDuplicate: false,
      });

      await VoterModel.updateOne(
        { sheetName, row },
        {
          $set: {
            name,
            email: email || "",
            mobile,
            optionalMobile: optionalMobile || "",
            partyName: partyName || "",
            assemblyName: assemblyName || sheetName,
            status: status || "pending",
            isDuplicate: false,
          },
        }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating voter:", error);
    res.status(500).json({ error: "Failed to update voter" });
  }
});

// DELETE /api/voters/delete
router.delete("/delete", async (req, res) => {
  try {
    const { sheetName, row } = req.body;

    if (!sheetName || !row) {
      return res.status(400).json({ error: "Sheet name and row are required" });
    }

    await deleteVoterRow(sheetName, row);

    await connectDB();
    await VoterModel.deleteOne({ sheetName, row });
    await VoterModel.updateMany(
      { sheetName, row: { $gt: row } },
      { $inc: { row: -1 } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting voter:", error);
    res.status(500).json({ error: "Failed to delete voter" });
  }
});

// GET /api/voters/export
router.get("/export", async (req, res) => {
  try {
    const voters = await getAllAcceptedVoters();

    const assemblyMap = new Map();
    for (const v of voters) {
      const list = assemblyMap.get(v.assembly) || [];
      list.push(v);
      assemblyMap.set(v.assembly, list);
    }

    const wb = XLSX.utils.book_new();

    const allData = voters.map((v, i) => ({
      "S.No": i + 1,
      Assembly: v.assembly,
      Name: v.name,
      Email: v.email,
      Mobile: v.mobile,
      "Secondary Mobile": v.optionalMobile,
      Party: v.partyName,
    }));
    const allSheet = XLSX.utils.json_to_sheet(allData);
    allSheet["!cols"] = [
      { wch: 6 }, { wch: 25 }, { wch: 25 }, { wch: 28 },
      { wch: 16 }, { wch: 16 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, allSheet, "All Accepted");

    const sortedAssemblies = [...assemblyMap.keys()].sort();
    for (const assembly of sortedAssemblies) {
      const list = assemblyMap.get(assembly);
      const data = list.map((v, i) => ({
        "S.No": i + 1,
        Name: v.name,
        Email: v.email,
        Mobile: v.mobile,
        "Secondary Mobile": v.optionalMobile,
        Party: v.partyName,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 6 }, { wch: 25 }, { wch: 28 },
        { wch: 16 }, { wch: 16 }, { wch: 20 },
      ];
      const safeName = assembly.length > 31 ? assembly.substring(0, 31) : assembly;
      XLSX.utils.book_append_sheet(wb, ws, safeName);
    }

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const today = new Date().toISOString().split("T")[0];

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Accepted_Candidates_${today}.xlsx"`);
    res.send(buf);
  } catch (error) {
    console.error("Error exporting voters:", error);
    res.status(500).json({ error: "Failed to export" });
  }
});

module.exports = router;
