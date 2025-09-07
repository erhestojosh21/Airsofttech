const express = require("express");
const { poolPromise, sql } = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 🏢 Get Employee List (Admin Only)
router.get("/", authMiddleware, async (req, res) => {
  if (req.employee.roleId !== 1) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Employees");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
