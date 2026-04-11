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

    const TC_ALLIANCE_STATS = {
      Telecaller1: "spa",
      Telecaller2: "nda",
      Telecaller3: "ntk",
      Telecaller4: "tvk",
    };
    const ALLIANCE_PARTIES_STATS = {
      spa: ["dravida munnetra kazhagam", "indian national congress", "desiya murpokku dravida kazhagam", "viduthalai chiruthaigal katchi", "communist party of india (marxist)", "communist party of india", "marumalarchi dravida munnetra kazhagam"],
      nda: ["all india anna dravida munnetra kazhagam", "bharatiya janata party", "pattali makkal katchi", "amma makkal munnettra kazagam"],
      ntk: ["ntk", "naam tamilar katchi", "naam tamilar"],
      tvk: ["tvk", "tamil vettri kazhagam", "tamilaga vettri kazhagam"],
    };

    let totalAccepted;
    const allianceKey = TC_ALLIANCE_STATS[telecaller];
    if (allianceKey && ALLIANCE_PARTIES_STATS[allianceKey]) {
      const partyRegexes = ALLIANCE_PARTIES_STATS[allianceKey].map(
        (p) => new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
      );
      totalAccepted = await VoterModel.countDocuments({ partyName: { $in: partyRegexes } });
    } else {
      totalAccepted = await VoterModel.countDocuments({});
    }

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

    const ALLIANCE_PARTIES = {
      spa: ["dravida munnetra kazhagam", "indian national congress", "desiya murpokku dravida kazhagam", "viduthalai chiruthaigal katchi", "communist party of india (marxist)", "communist party of india", "marumalarchi dravida munnetra kazhagam"],
      nda: ["all india anna dravida munnetra kazhagam", "bharatiya janata party", "pattali makkal katchi", "amma makkal munnettra kazagam"],
      ntk: ["ntk", "naam tamilar katchi", "naam tamilar"],
      tvk: ["tvk", "tamil vettri kazhagam", "tamilaga vettri kazhagam"],
    };
    const TC_ALLIANCE = {
      Telecaller1: "spa",
      Telecaller2: "nda",
      Telecaller3: "ntk",
      Telecaller4: "tvk",
    };

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

      // Assigned candidate count based on alliance
      const allianceKey = TC_ALLIANCE[tc];
      if (allianceKey && ALLIANCE_PARTIES[allianceKey]) {
        const partyRegexes = ALLIANCE_PARTIES[allianceKey].map(
          (p) => new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
        );
        stats.assignedCount = await VoterModel.countDocuments({
          partyName: { $in: partyRegexes },
        });
      } else {
        stats.assignedCount = totalAccepted;
      }

      telecallerStats.push(stats);
    }

    res.json({ telecallerStats, totalAccepted });
  } catch (error) {
    console.error("Error fetching admin telecaller overview:", error);
    res.status(500).json({ error: "Failed to fetch telecaller overview" });
  }
});

// GET /api/telecaller/admin/:telecaller/calls — deduplicated call logs (latest per candidate)
router.get("/admin/:telecaller/calls", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    await connectDB();
    const { telecaller } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregate: get latest call per candidate
    const pipeline = [
      { $match: { telecaller } },
      { $sort: { calledAt: -1 } },
      {
        $group: {
          _id: "$voterId",
          latestId: { $first: "$_id" },
          latestStatus: { $first: "$status" },
          latestNotes: { $first: "$notes" },
          latestCalledAt: { $first: "$calledAt" },
          callCount: { $sum: 1 },
        },
      },
      { $sort: { latestCalledAt: -1 } },
    ];

    const allGrouped = await CallStatusModel.aggregate(pipeline);
    const total = allGrouped.length;
    const paged = allGrouped.slice(skip, skip + parseInt(limit));

    // Populate voter info
    const voterIds = paged.map((g) => g._id);
    const voters = await VoterModel.find({ _id: { $in: voterIds } })
      .select("name mobile email assemblyName partyName")
      .lean();
    const voterMap = {};
    voters.forEach((v) => { voterMap[v._id.toString()] = v; });

    const calls = paged.map((g) => ({
      _id: g.latestId,
      voterId: voterMap[g._id.toString()] || null,
      voterObjectId: g._id,
      status: g.latestStatus,
      notes: g.latestNotes || "",
      calledAt: g.latestCalledAt,
      callCount: g.callCount,
    }));

    res.json({ calls, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error("Error fetching telecaller calls:", error);
    res.status(500).json({ error: "Failed to fetch calls" });
  }
});

// GET /api/telecaller/admin/:telecaller/candidate/:voterId — full call history for a candidate
router.get("/admin/:telecaller/candidate/:voterId", async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    await connectDB();
    const { telecaller, voterId } = req.params;

    const history = await CallStatusModel.find({ telecaller, voterId })
      .sort({ calledAt: -1 })
      .lean();

    const voter = await VoterModel.findById(voterId)
      .select("name mobile email assemblyName partyName")
      .lean();

    res.json({ voter, history });
  } catch (error) {
    console.error("Error fetching candidate call history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;
