const express = require("express");
const { connectDB, VoterModel, CallStatusModel } = require("../lib/mongodb");
const router = express.Router();

// DEBUG: count endpoint
router.get("/debug-count", async (req, res) => {
  try {
    await connectDB();
    const total = await VoterModel.countDocuments({});
    const bjpCount = await VoterModel.countDocuments({ partyName: "Bharatiya Janata Party" });
    const bjpRegex = await VoterModel.countDocuments({ partyName: /bharatiya/i });
    const statuses = await VoterModel.aggregate([
      { $match: { partyName: /bharatiya/i } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    res.json({ total, bjpCount, bjpRegex, statuses });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/telecaller/candidates — list candidates with their call status for this telecaller
router.get("/candidates", async (req, res) => {
  try {
    await connectDB();
    const telecaller = req.user.username;
    const { assembly, party, callStatus, page = 1, limit = 50 } = req.query;

    // Build voter filter — show all candidates
    const voterFilter = {};
    if (assembly) voterFilter.assemblyName = assembly;
    if (party) voterFilter.partyName = party;

    const totalAll = await VoterModel.countDocuments({});
    const total = await VoterModel.countDocuments(voterFilter);

    let voters;
    if (limit === "all") {
      voters = await VoterModel.find(voterFilter)
        .sort({ assemblyName: 1, name: 1 })
        .lean();
    } else {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      voters = await VoterModel.find(voterFilter)
        .sort({ assemblyName: 1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    console.log(`[telecaller/candidates] filter=${JSON.stringify(voterFilter)} totalAll=${totalAll} totalFiltered=${total} fetched=${voters.length} limit=${limit}`);

    // Get call statuses for these voters by this telecaller
    const voterIds = voters.map((v) => v._id);
    const callStatuses = await CallStatusModel.find({
      voterId: { $in: voterIds },
      telecaller,
    })
      .sort({ calledAt: -1 })
      .lean();

    // Map latest status per voter
    const statusMap = {};
    for (const cs of callStatuses) {
      const key = cs.voterId.toString();
      if (!statusMap[key]) statusMap[key] = cs;
    }

    // Get all telecallers who have called these voters (for tags like T1, T2)
    const allCallStatuses = await CallStatusModel.find({
      voterId: { $in: voterIds },
    })
      .sort({ calledAt: -1 })
      .lean();

    const calledByMap = {};
    for (const cs of allCallStatuses) {
      const key = cs.voterId.toString();
      if (!calledByMap[key]) calledByMap[key] = new Set();
      calledByMap[key].add(cs.telecaller);
    }

    // Filter by call status if requested
    let result = voters.map((v) => ({
      ...v,
      callStatus: statusMap[v._id.toString()] || null,
      calledBy: calledByMap[v._id.toString()] ? Array.from(calledByMap[v._id.toString()]) : [],
    }));

    if (callStatus) {
      if (callStatus === "not_called") {
        result = result.filter((v) => !v.callStatus);
      } else {
        result = result.filter((v) => v.callStatus?.status === callStatus);
      }
    }

    res.json({ candidates: result, total, totalAll, page: parseInt(page), limit: parseInt(limit), filterUsed: voterFilter });
  } catch (error) {
    console.error("Error fetching telecaller candidates:", error);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

// POST /api/telecaller/call-status — log a call status
router.post("/call-status", async (req, res) => {
  try {
    await connectDB();
    const telecaller = req.user.username;
    const { voterId, status, notes } = req.body;

    if (!voterId || !status) {
      return res.status(400).json({ error: "voterId and status are required" });
    }

    const callStatus = new CallStatusModel({
      voterId,
      telecaller,
      status,
      notes: notes || "",
      calledAt: new Date(),
    });
    await callStatus.save();

    res.json({ success: true, callStatus });
  } catch (error) {
    console.error("Error saving call status:", error);
    res.status(500).json({ error: "Failed to save call status" });
  }
});

// PATCH /api/telecaller/call-status/notes — update notes on the latest call status
router.patch("/call-status/notes", async (req, res) => {
  try {
    await connectDB();
    const telecaller = req.user.username;
    const { voterId, notes } = req.body;

    if (!voterId) {
      return res.status(400).json({ error: "voterId is required" });
    }

    // Find the latest call status for this voter by this telecaller
    const latest = await CallStatusModel.findOne({ voterId, telecaller }).sort({ calledAt: -1 });

    if (!latest) {
      return res.status(404).json({ error: "No call status found for this voter" });
    }

    latest.notes = notes || "";
    await latest.save();

    res.json({ success: true, callStatus: latest });
  } catch (error) {
    console.error("Error updating notes:", error);
    res.status(500).json({ error: "Failed to update notes" });
  }
});

// GET /api/telecaller/stats — dashboard stats for this telecaller
router.get("/stats", async (req, res) => {
  try {
    await connectDB();
    const telecaller = req.user.username;

    const totalAccepted = await VoterModel.countDocuments({});

    // Get all call statuses by this telecaller
    const statusCounts = await CallStatusModel.aggregate([
      { $match: { telecaller } },
      { $sort: { calledAt: -1 } },
      {
        $group: {
          _id: "$voterId",
          latestStatus: { $first: "$status" },
          latestCalledAt: { $first: "$calledAt" },
        },
      },
      {
        $group: {
          _id: "$latestStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      totalCandidates: totalAccepted,
      totalCalled: 0,
      interested: 0,
      not_interested: 0,
      no_response: 0,
      switch_off: 0,
      wrong_number: 0,
      callback: 0,
      first_call_completed: 0,
      second_call_completed: 0,
      third_call_completed: 0,
      withdrawn: 0,
    };

    for (const s of statusCounts) {
      stats[s._id] = s.count;
      stats.totalCalled += s.count;
    }

    stats.notCalled = totalAccepted - stats.totalCalled;

    // Today's calls
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCalls = await CallStatusModel.countDocuments({
      telecaller,
      calledAt: { $gte: todayStart },
    });
    stats.todayCalls = todayCalls;

    // Recent calls (last 10)
    const recentCalls = await CallStatusModel.find({ telecaller })
      .sort({ calledAt: -1 })
      .limit(10)
      .populate("voterId", "name mobile assemblyName partyName")
      .lean();

    res.json({ stats, recentCalls });
  } catch (error) {
    console.error("Error fetching telecaller stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/telecaller/call-history/:voterId — call history for a candidate
router.get("/call-history/:voterId", async (req, res) => {
  try {
    await connectDB();
    const telecaller = req.user.username;
    const history = await CallStatusModel.find({
      voterId: req.params.voterId,
      telecaller,
    })
      .sort({ calledAt: -1 })
      .lean();

    res.json({ history });
  } catch (error) {
    console.error("Error fetching call history:", error);
    res.status(500).json({ error: "Failed to fetch call history" });
  }
});

// === ADMIN ROUTES ===

// GET /api/telecaller/admin/overview — all telecaller stats (admin only)
router.get("/admin/overview", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    await connectDB();

    const telecallerNames = ["Telecaller1", "Telecaller2", "Telecaller3", "Telecaller4", "Telecaller5", "Telecaller6"];
    const totalAccepted = await VoterModel.countDocuments({});

    const telecallerStats = [];

    for (const tc of telecallerNames) {
      const statusCounts = await CallStatusModel.aggregate([
        { $match: { telecaller: tc } },
        { $sort: { calledAt: -1 } },
        {
          $group: {
            _id: "$voterId",
            latestStatus: { $first: "$status" },
          },
        },
        {
          $group: {
            _id: "$latestStatus",
            count: { $sum: 1 },
          },
        },
      ]);

      const stats = {
        username: tc,
        displayName: tc.replace("Telecaller", "Telecaller "),
        totalCalled: 0,
        interested: 0,
        not_interested: 0,
        no_response: 0,
        switch_off: 0,
        wrong_number: 0,
        callback: 0,
        first_call_completed: 0,
        second_call_completed: 0,
        third_call_completed: 0,
        withdrawn: 0,
      };

      for (const s of statusCounts) {
        stats[s._id] = s.count;
        stats.totalCalled += s.count;
      }

      // Today's calls
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      stats.todayCalls = await CallStatusModel.countDocuments({
        telecaller: tc,
        calledAt: { $gte: todayStart },
      });

      telecallerStats.push(stats);
    }

    res.json({ telecallerStats, totalAccepted });
  } catch (error) {
    console.error("Error fetching admin telecaller overview:", error);
    res.status(500).json({ error: "Failed to fetch telecaller overview" });
  }
});

// GET /api/telecaller/admin/:telecaller/calls — detailed call logs for a telecaller (admin)
router.get("/admin/:telecaller/calls", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    await connectDB();
    const { telecaller } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await CallStatusModel.countDocuments({ telecaller });
    const calls = await CallStatusModel.find({ telecaller })
      .sort({ calledAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("voterId", "name mobile email assemblyName partyName")
      .lean();

    res.json({ calls, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error("Error fetching telecaller calls:", error);
    res.status(500).json({ error: "Failed to fetch calls" });
  }
});

module.exports = router;
