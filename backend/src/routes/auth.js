const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

// Telecaller accounts
const TELECALLERS = [
  { username: "Telecaller1", displayName: "Telecaller 1" },
  { username: "Telecaller2", displayName: "Telecaller 2" },
  { username: "Telecaller3", displayName: "Telecaller 3" },
  { username: "Telecaller4", displayName: "Telecaller 4" },
  { username: "Telecaller5", displayName: "Telecaller 5" },
  { username: "Telecaller6", displayName: "Telecaller 6" },
];
const TELECALLER_PASSWORD = process.env.TELECALLER_PASSWORD || "TamilNadu@2026";

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Admin login
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({ token, username, role: "admin" });
  }

  // Telecaller login
  const telecaller = TELECALLERS.find(
    (t) => t.username.toLowerCase() === username.toLowerCase()
  );
  if (telecaller && password === TELECALLER_PASSWORD) {
    const token = jwt.sign(
      { username: telecaller.username, role: "telecaller", displayName: telecaller.displayName },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({ token, username: telecaller.username, role: "telecaller", displayName: telecaller.displayName });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ valid: true, username: decoded.username, role: decoded.role });
  } catch {
    return res.status(401).json({ valid: false });
  }
});

module.exports = router;
