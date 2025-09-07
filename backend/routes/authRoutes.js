const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { poolPromise, sql } = require("../db");

const router = express.Router();

// 🔒 Employee Login

/*
router.post("/employee-login", async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password" });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input("email", sql.VarChar, email)
            .query("SELECT * FROM Employees WHERE email = @email");

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.recordset[0];

        // ✅ Compare Hashed Password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // ✅ Generate JWT Token
        const token = jwt.sign(
            { employeeId: user.employeeId, roleId: user.roleId },
            secretKey,
            { expiresIn: "1h" }
        );

        res.json({ success: true, token, message: "✅ Login successful!" });

    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ error: "Server error while logging in" });
    }
});


*/
module.exports = router;
