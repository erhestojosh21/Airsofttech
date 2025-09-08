require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto"); // For unique temp user ID
const router = express.Router();
const { pool, poolConnect } = require("./db");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const NodeCache = require("node-cache");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const helmet = require('helmet');
//const socketIo = require("socket.io");
//const http = require("http");


dotenv.config(); // Load environment variables from a .env file
const app = express();
// Configure storage for uploaded images
const memoryStorage = multer.memoryStorage();

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});

const memoryUpload = multer({ storage: multer.memoryStorage() });
const upload = multer({ storage: storage });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access it at your Railway URL: https://<your-project>.up.railway.app`);
});


app.use(helmet());
app.use(cookieParser());


app.use(express.json({ limit: "10mb" })); // Allow up to 10MB requests
app.use(express.urlencoded({ limit: "10mb", extended: true }));

/*
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});
*/

const productCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const secretKey = "Hakdomatigas0"; // Change this to a secure key
const authenticateToken = require('./middleware/authMiddleware')(pool, secretKey);
const tempUsers = {}; // Temporary storage for OTP & user data
const otpStore = {}; // OTP store for password reset



//PAYPAL DOTENV
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL;
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

async function generateAccessToken() {
  const response = await axios({
    url: `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    method: "post",
    data: "grant_type=client_credentials",
    auth: { username: PAYPAL_CLIENT_ID, password: PAYPAL_SECRET },
  });

  return response.data.access_token;
}


// Email Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "edgicustomworks100@gmail.com",
        pass: "wdlxvrciemwkzhsr",
    },
});

// Generate random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();





SIGN UP SERVER 


*/
const { body, validationResult } = require("express-validator");


// Sign Up Endpoint
app.post("/request-otp",
  [
    body("first_name").trim().escape().notEmpty().withMessage("First name is required"),
    body("last_name").trim().escape().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
    body("username").trim().escape().isLength({ min: 3 }).withMessage("Username must be at least 3 characters"),
    body("password").trim().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    await poolConnect;
    const { first_name, last_name, email, username, password } = req.body;

    try {
      const result = await pool
        .request()
        .input("email", sql.VarChar, email)
        .query("SELECT * FROM Users WHERE email = @email");

      if (result.recordset.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const userExists = await pool
        .request()
        .input("username", sql.VarChar, username)
        .query("SELECT 1 FROM Users WHERE username = @username");

      const employeeExists = await pool
        .request()
        .input("username", sql.VarChar, username)
        .query("SELECT 1 FROM Employees WHERE username = @username");

      if (userExists.recordset.length > 0 || employeeExists.recordset.length > 0) {
        return res.status(400).json({ error: "Username is already taken" });
      }

      const otp = generateOTP();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const tempUserId = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(password, 10);

      tempUsers[tempUserId] = {
        first_name,
        last_name,
        email,
        username,
        password: hashedPassword,
        otp,
        expiresAt,
      };

      console.log(`Generated OTP for ${email}: ${otp}`);

      await transporter.sendMail({
        from: "your-email@gmail.com",
        to: email,
        subject: "Sign Up OTP Code",
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <img src="https://scontent.fmnl30-3.fna.fbcdn.net/v/t39.30808-6/462146962_8553736841375910_5455853687705156246_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeFR9BRmzDBZuVnDqrf1WLWKwC8O9nDDwUbALw72cMPBRmFp3EqpAlPkP0kfM8cwtktg3aySIqavnVTkwufQ0fnk&_nc_ohc=rhh4Digyi1oQ7kNvgG-w_Oi&_nc_oc=AdjtLd240K83_aUsWDJpFLrqeL2hojchNJSAgLiU-2M2TMaalQ5EYzeVEqicZADBdns&_nc_zt=23&_nc_ht=scontent.fmnl30-3.fna&_nc_gid=AaRaU9ol_ei8fHv7aEK88_2&oh=00_AYFHQ-Tf7uQMYzJB8mE9oUYp6c_IwgGS60FwYy381rlHiA&oe=67D74537" alt="Logo" style="height: 50px; margin-right: 10px;">
                        
                    </div>
                    <h2 style="color: #333;">Sign Up Verification</h2>
                    <p style="font-size: 14px; color: #666;">Please use the following One Time Verification (OTP)</p>
                    <p style="font-size: 32px; font-weight: bold; color: darkred; letter-spacing: 5px;">${otp}</p>
                    <p style="font-size: 14px; color: #666;">This password is only valid for the next <strong>5 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666;">
                        If you did not request this email, please contact the administrator at 
                        <a href="mailto:edgicustomworks100@gmail.com" style="color: purple; text-decoration: none;">edgicustomworks100@gmail.com</a>
                    </p>
                </div>`,
      });

      res.json({ message: "OTP sent to email", tempUserId });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);


// OTP Verification and Insert User
// **Verify Signup OTP**
app.post("/verify-otp", async (req, res) => {
    const { email, otp, tempUserId } = req.body;

    // Validate request
    if (!tempUsers[tempUserId]) {
        return res.status(400).json({ error: "Invalid request" });
    }

    const { first_name, last_name, username, password, expiresAt, otp: storedOtp } = tempUsers[tempUserId];

    // Expired OTP check
    if (Date.now() > expiresAt) {
        delete tempUsers[tempUserId];
        return res.status(400).json({ error: "OTP expired" });
    }

    // OTP match check
    if (storedOtp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
    }

    try {
        const user_tag = generateRandomUserTag(6);

        // Insert new user
        await pool.request()
            .input("first_name", sql.VarChar, first_name)
            .input("last_name", sql.VarChar, last_name)
            .input("email", sql.VarChar, email)
            .input("username", sql.VarChar, username)
            .input("password", sql.VarChar, password)
            .input("user_tag", sql.VarChar, user_tag)
            .query(
                `INSERT INTO Users (first_name, last_name, email, username, password, user_tag)
                 VALUES (@first_name, @last_name, @email, @username, @password, @user_tag)`
            );

        // Retrieve new user's ID + Username
        const userResult = await pool
            .request()
            .input("email", sql.VarChar, email)
            .query("SELECT UserID, Username FROM Users WHERE email = @email");

        if (userResult.recordset.length === 0) {
            return res.status(500).json({ error: "User insertion failed" });
        }

        const { UserID, Username } = userResult.recordset[0];
        delete tempUsers[tempUserId]; // clear temp storage

        // Create JWT like login flow
        const token = jwt.sign({ email, UserID }, secretKey, { expiresIn: "1h" });

        // Set secure HttpOnly cookie
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: false,
            sameSite: "Strict",
            maxAge: 3600000
        });

        res.json({ message: "Signup successful & logged in!", userID: UserID, username: Username });
    } catch (error) {
        console.error("Signup OTP Verification Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});



/**
 * Generates a random string consisting of uppercase letters and numbers.
 * @param {number} length The desired length of the random string.
 * @returns {string} The generated random string.
 */
function generateRandomUserTag(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}



// Resend OTP
app.post("/resend-otp",
  [body("email").isEmail().normalizeEmail().withMessage("Invalid email")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;

    const tempUserId = Object.keys(tempUsers).find((id) => tempUsers[id].email === email);
    if (!tempUserId) {
      return res.status(400).json({ error: "No pending OTP request for this email" });
    }

    const otp = generateOTP();
    tempUsers[tempUserId].otp = otp;
    tempUsers[tempUserId].expiresAt = Date.now() + 5 * 60 * 1000;

    try {
      console.log(`Resent OTP for ${email}: ${otp}`);

      await transporter.sendMail({
        from: "your-email@gmail.com",
        to: email,
        subject: "Sign Up OTP Code",
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <img src="https://scontent.fmnl30-3.fna.fbcdn.net/v/t39.30808-6/462146962_8553736841375910_5455853687705156246_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeFR9BRmzDBZuVnDqrf1WLWKwC8O9nDDwUbALw72cMPBRmFp3EqpAlPkP0kfM8cwtktg3aySIqavnVTkwufQ0fnk&_nc_ohc=rhh4Digyi1oQ7kNvgG-w_Oi&_nc_oc=AdjtLd240K83_aUsWDJpFLrqeL2hojchNJSAgLiU-2M2TMaalQ5EYzeVEqicZADBdns&_nc_zt=23&_nc_ht=scontent.fmnl30-3.fna&_nc_gid=AaRaU9ol_ei8fHv7aEK88_2&oh=00_AYFHQ-Tf7uQMYzJB8mE9oUYp6c_IwgGS60FwYy381rlHiA&oe=67D74537" alt="Logo" style="height: 50px; margin-right: 10px;">
                        
                    </div>
                    <h2 style="color: #333;">Sign UpVerification</h2>
                    <p style="font-size: 14px; color: #666;">Please use the following One Time Verification (OTP)</p>
                    <p style="font-size: 32px; font-weight: bold; color: darkred; letter-spacing: 5px;">${otp}</p>
                    <p style="font-size: 14px; color: #666;">This password is only valid for the next <strong>5 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666;">
                        If you did not request this email, please contact the administrator at 
                        <a href="mailto:edgicustomworks100@gmail.com" style="color: purple; text-decoration: none;">edgicustomworks100@gmail.com</a>
                    </p>
                </div>`,
      });

      res.json({ message: "New OTP sent!" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  }
);



app.post("/verify-captcha", async (req, res) => {
    const { token } = req.body;
  
    if (!token) return res.status(400).json({ success: false, message: "No token provided" });
  
    try {
      const secretKey = "6LdKIhArAAAAADog7lvEQOXGt7m6gie5yWdTfKND"; // <-- Use your secret key from Google
      const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
  
      const response = await axios.post(verifyURL);
      const success = response.data.success;
  
      if (!success) {
        return res.status(403).json({ success: false, message: "Failed CAPTCHA verification" });
      }
  
      res.json({ success: true });
    } catch (err) {
      console.error("Captcha verification failed:", err);
      res.status(500).json({ success: false, message: "Captcha verification error" });
    }
  });





/*


LOGIN SERVER 


*/
const rateLimit = require("express-rate-limit");
const { request } = require("http");

// Limit repeated failed login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: "Too many login attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limit OTP resend to prevent abuse
const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // Max 3 resend requests per window
    message: { error: "Too many OTP requests. Please wait before trying again." },
    keyGenerator: (req) => req.body.email || req.ip, // Rate limit per email
    standardHeaders: true,
    legacyHeaders: false,
});

const verifyOtpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: { error: "Too many OTP verification attempts. Please try again later." },
    keyGenerator: (req) => req.body.email || req.ip,
});


// LOGIN (Return `UserID`)
app.post("/login", loginLimiter, async (req, res) => {
    await poolConnect;
    const { username, password } = req.body;

    try {
        const userResult = await pool.request()
            .input("username", sql.VarChar, username)
            .query("SELECT * FROM Users WHERE username = @username");

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ error: "You have entered an incorrect username or password." });
        }

        const user = userResult.recordset[0];

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ error: "You have entered an incorrect username or password." });
        }

        // Generate OTP
        const otp = generateOTP();
        otpStore[user.email] = { otp, expiresAt: Date.now() + 300000 };

        console.log(`Generated OTP for ${user.email}:`, otp);

        await transporter.sendMail({
            from: "your-email@gmail.com",
            to: user.email,
            subject: "Verify Your Login",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <img src="https://scontent.fmnl30-3.fna.fbcdn.net/v/t39.30808-6/462146962_8553736841375910_5455853687705156246_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeFR9BRmzDBZuVnDqrf1WLWKwC8O9nDDwUbALw72cMPBRmFp3EqpAlPkP0kfM8cwtktg3aySIqavnVTkwufQ0fnk&_nc_ohc=rhh4Digyi1oQ7kNvgG-w_Oi&_nc_oc=AdjtLd240K83_aUsWDJpFLrqeL2hojchNJSAgLiU-2M2TMaalQ5EYzeVEqicZADBdns&_nc_zt=23&_nc_ht=scontent.fmnl30-3.fna&_nc_gid=AaRaU9ol_ei8fHv7aEK88_2&oh=00_AYFHQ-Tf7uQMYzJB8mE9oUYp6c_IwgGS60FwYy381rlHiA&oe=67D74537" alt="Logo" style="height: 50px; margin-right: 10px;">
                        
                    </div>
                    <h2 style="color: #333;">Verify your login</h2>
                    <p style="font-size: 16px; color: #666;"><strong>Hello, ${user.username}</strong></p>
                    <p style="font-size: 14px; color: #666;">Please use the following One Time Verification (OTP)</p>
                    <p style="font-size: 32px; font-weight: bold; color: darkred; letter-spacing: 5px;">${otp}</p>
                    <p style="font-size: 14px; color: #666;">This password is only valid for the next <strong>5 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666;">
                        If you did not request this email, please contact the administrator at 
                        <a href="mailto:edgicustomworks100@gmail.com" style="color: purple; text-decoration: none;">edgicustomworks100@gmail.com</a>
                    </p>
                </div>
            `
        });

        res.json({ otpRequired: true, email: user.email, tempUserID: user.UserID });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
});


// **Verify Login OTP**
app.post("/verify-login-otp", verifyOtpLimiter, async (req, res) => {
    const { email, otp } = req.body;
  
    if (!otpStore[email] || otpStore[email].otp !== otp || Date.now() > otpStore[email].expiresAt) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
    }
  
    delete otpStore[email]; // Remove OTP after verification
  
    // Retrieve UserID from database
    const userResult = await pool
        .request()
        .input("email", sql.VarChar, email)
        .query("SELECT UserID, Username FROM Users WHERE email = @email");
  
    if (userResult.recordset.length === 0) {
        return res.status(400).json({ error: "User not found" });
    }
  
    const { UserID, Username } = userResult.recordset[0];
    const token = jwt.sign({ email, UserID }, secretKey, { expiresIn: "1h" });

    // Set token in an HttpOnly secure cookie
    res.cookie("authToken", token, {
        httpOnly: true,   // Prevents JavaScript access (XSS protection)
        secure: true,     // Only sent over HTTPS
        sameSite: "Strict", // Prevents CSRF attacks
        maxAge: 3600000   // 1 hour expiration
    });

    res.json({ message: "OTP Verified! Logging in...", userID: UserID, username: Username });
});


app.get("/protected-route", (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized. No token found." });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        res.json({ message: "Access granted", user: decoded });
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});


app.get("/protected-route", (req, res) => {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized. No token found." });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        res.json({ message: "Access granted", user: decoded });
    } catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
    }
});



const otpCooldownStore = {}; // Store cooldown timestamps

app.post("/resend-login-otp", otpLimiter, async (req, res) => {
    const { email } = req.body;

    // Check if email exists
    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    try {
        // Ensure the database connection is established
        await poolConnect;

        // Retrieve the username from the database
        const result = await pool
            .request()
            .input("email", email)
            .query("SELECT username FROM Users WHERE email = @email");

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const username = result.recordset[0].username; // Extract username

        // Check if the email has an active cooldown
        if (otpCooldownStore[email] && Date.now() < otpCooldownStore[email]) {
            const remainingTime = Math.ceil((otpCooldownStore[email] - Date.now()) / 1000);
            return res.status(400).json({ error: `Please wait ${remainingTime}s before requesting another OTP.` });
        }

        // Generate new OTP
        const otp = generateOTP();
        otpStore[email] = { otp, expiresAt: Date.now() + 300000 };
        otpCooldownStore[email] = Date.now() + 100000; // Set cooldown (100 seconds)

        console.log(`Resent OTP for ${email}:`, otp);

        await transporter.sendMail({
            from: "your-email@gmail.com",
            to: email,
            subject: "New OTP for Login Verification",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <img src="https://scontent.fmnl30-3.fna.fbcdn.net/v/t39.30808-6/462146962_8553736841375910_5455853687705156246_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeFR9BRmzDBZuVnDqrf1WLWKwC8O9nDDwUbALw72cMPBRmFp3EqpAlPkP0kfM8cwtktg3aySIqavnVTkwufQ0fnk&_nc_ohc=rhh4Digyi1oQ7kNvgG-w_Oi&_nc_oc=AdjtLd240K83_aUsWDJpFLrqeL2hojchNJSAgLiU-2M2TMaalQ5EYzeVEqicZADBdns&_nc_zt=23&_nc_ht=scontent.fmnl30-3.fna&_nc_gid=AaRaU9ol_ei8fHv7aEK88_2&oh=00_AYFHQ-Tf7uQMYzJB8mE9oUYp6c_IwgGS60FwYy381rlHiA&oe=67D74537" 
                            alt="Logo" style="height: 50px; margin-bottom: 20px;">
                    </div>
                    <h2 style="color: #333;">Verify your login</h2>
                    <p style="font-size: 16px; color: #666;"><strong>Hello, ${username}</strong></p>
                    <p style="font-size: 14px; color: #666;">Please use the following One Time Password (OTP) to verify your login:</p>
                    <p style="font-size: 32px; font-weight: bold; color: darkred; letter-spacing: 5px;">${otp}</p>
                    <p style="font-size: 14px; color: #666;">This OTP is only valid for the next <strong>5 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666;">
                        If you did not request this email, please contact the administrator at 
                        <a href="mailto:edgicustomworks100@gmail.com" style="color: purple; text-decoration: none;">edgicustomworks100@gmail.com</a>
                    </p>
                </div>
            `
        });

        res.json({ message: "OTP resent successfully." });
    } catch (error) {
        console.error("Error fetching username:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



app.post("/logout", (req, res) => {
    res.clearCookie("authToken");
    res.json({ message: "Logged out successfully" });
});







/*

FORGOT PASSWORD SERVER

*/

// Request OTP for Password Reset (with email validation)
app.post("/request-password-otp", async (req, res) => {
    await poolConnect;
    const { email } = req.body;

    try {
        // Check if the email exists in the database
        const userResult = await pool.request()
            .input("email", sql.VarChar, email)
            .query("SELECT * FROM Users WHERE email = @email");

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ error: "Email not found. Please check your email or sign up first." });
        }

        // Generate and store OTP
        const otp = generateOTP();
        otpStore[email] = { otp, expiresAt: Date.now() + 300000 }; // 5-minute expiration

        console.log(`Generated OTP for ${email}:`, otp);

        // Send OTP email
        await transporter.sendMail({
            from: "your-email@gmail.com",
            to: email,
            subject: "Password Reset OTP",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                        <img src="https://scontent.fmnl30-3.fna.fbcdn.net/v/t39.30808-6/462146962_8553736841375910_5455853687705156246_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeFR9BRmzDBZuVnDqrf1WLWKwC8O9nDDwUbALw72cMPBRmFp3EqpAlPkP0kfM8cwtktg3aySIqavnVTkwufQ0fnk&_nc_ohc=rhh4Digyi1oQ7kNvgG-w_Oi&_nc_oc=AdjtLd240K83_aUsWDJpFLrqeL2hojchNJSAgLiU-2M2TMaalQ5EYzeVEqicZADBdns&_nc_zt=23&_nc_ht=scontent.fmnl30-3.fna&_nc_gid=AaRaU9ol_ei8fHv7aEK88_2&oh=00_AYFHQ-Tf7uQMYzJB8mE9oUYp6c_IwgGS60FwYy381rlHiA&oe=67D74537" alt="Logo" style="height: 50px; margin-right: 10px;">
                        
                    </div>
                    <h2 style="color: #333;">Verify Password Reset</h2>
                    <p style="font-size: 16px; color: #666;"><strong></strong></p>
                    <p style="font-size: 14px; color: #666;">Please use the following One Time Verification (OTP)</p>
                    <p style="font-size: 32px; font-weight: bold; color: darkred; letter-spacing: 5px;">${otp}</p>
                    <p style="font-size: 14px; color: #666;">This password is only valid for the next <strong>5 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666;">
                        If you did not request this email, please contact the administrator at 
                        <a href="mailto:edgicustomworks100@gmail.com" style="color: purple; text-decoration: none;">edgicustomworks100@gmail.com</a>
                    </p>
                </div>
            `
        });

        res.json({ message: "OTP sent. Please check your email." });

    } catch (error) {
        console.error("Request OTP error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
});


// Verify OTP for Password Reset
app.post("/verify-password-otp", (req, res) => {
    const { email, otp } = req.body;

    if (!otpStore[email] || otpStore[email].otp !== otp || Date.now() > otpStore[email].expiresAt) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    delete otpStore[email]; // Remove OTP after verification

    res.json({ message: "OTP Verified! You can now change your password." });
});


// Backend: Change Password with Old Password Check
app.post("/change-password", async (req, res) => {
    await poolConnect;
    const { email, oldPassword, newPassword } = req.body;

    try {
        // Fetch user details
        const userResult = await pool.request()
            .input("email", sql.VarChar, email)
            .query("SELECT userId, password FROM Users WHERE email = @email");

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ error: "User not found." });
        }

        const { userId, password: hashedCurrentPassword } = userResult.recordset[0];

        // Compare oldPassword with hashedCurrentPassword
        const isMatch = await bcrypt.compare(oldPassword, hashedCurrentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: "Incorrect old password." });
        }

        // Fetch old passwords
        const oldPasswordsResult = await pool.request()
            .input("userId", sql.Int, userId)
            .query("SELECT password FROM OldPasswords WHERE userId = @userId");

        const oldPasswords = oldPasswordsResult.recordset.map(row => row.password);

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Prevent reusing old passwords
        for (let oldPass of oldPasswords) {
            if (await bcrypt.compare(newPassword, oldPass)) {
                return res.status(400).json({ error: "Password already in use. Please use a new password." });
            }
        }

        // Store current password in OldPasswords if not already stored
        if (!oldPasswords.includes(hashedCurrentPassword)) {
            await pool.request()
                .input("userId", sql.Int, userId)
                .input("password", sql.VarChar, hashedCurrentPassword)
                .query("INSERT INTO OldPasswords (userId, password, ChangedAt) VALUES (@userId, @password, GETDATE())");
        }

        // Update to new password
        await pool.request()
            .input("userId", sql.Int, userId)
            .input("newPassword", sql.VarChar, hashedNewPassword)
            .query("UPDATE Users SET password = @newPassword WHERE userId = @userId");

        res.json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
});













/*


ADDRESS SERVER 


*/

app.get("/user-profile/:userID", async (req, res) => {
    try {
      const { userID } = req.params;
      const result = await pool.request().input("userID", sql.Int, userID).query("SELECT username FROM Users WHERE userID = @userID");
      if (result.recordset.length > 0) {
        res.json(result.recordset[0]);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Fetch addresses by userID
  app.get("/api/user-addresses/:userID", async (req, res) => {
    try {
      const { userID } = req.params;
      const result = await pool.request().input("userID", sql.Int, userID).query("SELECT * FROM Addresses WHERE UserID = @userID");
      res.json(result.recordset);
    } catch (err) {
      console.error("Error fetching addresses:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  
  // Delete an address
  app.delete("/api/delete-address", async (req, res) => {
    try {
      const { addressID } = req.body;
      await pool.request().input("addressID", sql.Int, addressID).query("DELETE FROM Addresses WHERE AddressID = @addressID");
      res.json({ message: "Address deleted successfully" });
    } catch (err) {
      console.error("Error deleting address:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });


//Add Address
app.post("/add-address", async (req, res) => {
    const { userID, fullName, country, phoneNumber, streetAddress, addressLine2, city, stateProvince, postalCode } = req.body;

    if (!userID || isNaN(userID)) {
        return res.status(400).json({ error: "Invalid or missing userID" });
    }

    try {
        // Step 1: Set IsInUse = 0 for all existing addresses of the current user
        // This ensures that only one address is marked as 'in use' at any given time.
        await pool.request()
            .input("userID", sql.Int, userID)
            .query(`
                UPDATE Addresses
                SET IsInUse = 0
                WHERE UserID = @userID
            `);

        // Step 2: Insert the new address and set its IsInUse to 1
        // This new address will now be the primary 'in use' address for the user.
        await pool.request()
            .input("userID", sql.Int, userID)
            .input("fullName", sql.NVarChar, fullName)
            .input("country", sql.NVarChar, country)
            .input("phoneNumber", sql.NVarChar, phoneNumber)
            .input("streetAddress", sql.NVarChar, streetAddress)
            .input("addressLine2", sql.NVarChar, addressLine2)
            .input("city", sql.NVarChar, city)
            .input("stateProvince", sql.NVarChar, stateProvince)
            .input("postalCode", sql.NVarChar, postalCode)
            .query(`
                INSERT INTO Addresses (UserID, FullName, Country, PhoneNumber, StreetAddress, AddressLine2, City, StateProvince, PostalCode, IsInUse)
                VALUES (@userID, @fullName, @country, @phoneNumber, @streetAddress, @addressLine2, @city, @stateProvince, @postalCode, 1) -- Set IsInUse to 1 for the new address
            `);

        // Step 3: Fetch updated addresses and return them
        // The addresses are ordered to show the 'in use' address first.
        const result = await pool.request()
            .input("userID", sql.Int, userID)
            .query("SELECT * FROM Addresses WHERE UserID = @userID ORDER BY IsInUse DESC, AddressID DESC");

        res.status(201).json({ message: "Address added successfully", addresses: result.recordset });
    } catch (error) {
        console.error("Database error:", error.message);
        res.status(500).json({ error: error.message });
    }
});


  
  
// Update an address
app.put("/update-address", async (req, res) => {
    const { AddressID, Country, PhoneNumber, StreetAddress, City, StateProvince, PostalCode, AddressLine2, FullName } = req.body;

    if (!AddressID) {
        return res.status(400).json({ error: "Address ID is required" });
    }

    try {
        const result = await pool.request()
            .input("AddressID", sql.Int, AddressID)
            .input("Country", sql.NVarChar, Country)
            .input("PhoneNumber", sql.NVarChar, PhoneNumber)
            .input("StreetAddress", sql.NVarChar, StreetAddress)
            .input("City", sql.NVarChar, City)
            .input("StateProvince", sql.NVarChar, StateProvince)
            .input("PostalCode", sql.NVarChar, PostalCode)
            .input("AddressLine2", sql.NVarChar, AddressLine2)
            .input("FullName", sql.NVarChar, FullName)
            .query(`
                UPDATE Addresses 
                SET Country = @Country, PhoneNumber = @PhoneNumber, StreetAddress = @StreetAddress, 
                    City = @City, StateProvince = @StateProvince, PostalCode = @PostalCode, 
                    AddressLine2 = @AddressLine2, FullName = @FullName
                WHERE AddressID = @AddressID
            `);

        if (result.rowsAffected[0] > 0) {
            res.json({ message: "Address updated successfully" });
        } else {
            res.status(404).json({ error: "Address not found" });
        }
    } catch (err) {
        console.error("Database error:", err.message);
        res.status(500).json({ error: "Database error", details: err.message });
    }
});

  

  

  
  // Set an address as default
  app.post("/set-default-address", async (req, res) => {
    const { userID, addressID } = req.body;
  
    if (!userID || !addressID) {
      return res.status(400).json({ error: "User ID and Address ID are required" });
    }
  
    try {
      const pool = await poolConnect;
  
      // Check if the address exists
      const checkResult = await pool
        .request()
        .input("addressID", sql.Int, addressID)
        .query("SELECT IsInUse FROM addresses WHERE AddressID = @addressID");
  
      if (checkResult.recordset.length === 0) {
        return res.status(404).json({ error: "Address not found" });
      }
  
      if (checkResult.recordset[0].IsInUse === 1) {
        return res.json({ message: "This address is already set as default" });
      }
  
      // Remove default status from all user addresses
      await pool
        .request()
        .input("userID", sql.Int, userID)
        .query("UPDATE addresses SET IsInUse = 0 WHERE UserID = @userID");
  
      // Set the selected address as default
      await pool
        .request()
        .input("addressID", sql.Int, addressID)
        .query("UPDATE addresses SET IsInUse = 1 WHERE AddressID = @addressID");
  
      res.json({ message: "Address set as default successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error", details: err.message });
    }
  });
  
  
  

/*

USER ORDER SERVER

*/

//Profile GET
app.get("/user/:userID", async (req, res) => {
    try {
        const { userID } = req.params;

        const userResult = await pool
            .request()
            .input("userID", sql.Int, userID)
            .query(`
                SELECT userId, first_name, last_name, username, email, user_tag, 
                       CONVERT(VARCHAR, createdAt, 120) AS createdAt
                FROM Users
                WHERE userId = @userID
            `);

        if (userResult.recordset.length > 0) {
            const user = userResult.recordset[0];

            

            res.json({
                userId: user.userId,
                first_name: user.first_name || "N/A",
                last_name: user.last_name || "N/A",
                username: user.username || "N/A",
                email: user.email || "N/A",
                user_tag: user.user_tag || "N/A",
                createdAt: user.createdAt ? user.createdAt : "Not Available",
            });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        console.error("Error fetching user profile:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Edit User Profile
app.put("/user/:userID", async (req, res) => {
  try {
    const { userID } = req.params;
    const { first_name, last_name, username } = req.body;

    const userResult = await pool
      .request()
      .input("userID", sql.Int, userID)
      .input("first_name", sql.NVarChar, first_name)
      .input("last_name", sql.NVarChar, last_name)
      .input("username", sql.NVarChar, username)
      .query(`
        UPDATE Users
        SET first_name = @first_name, 
            last_name = @last_name, 
            username = @username
        WHERE userId = @userID
      `);

    if (userResult.rowsAffected[0] > 0) {
      res.status(200).json({ message: "User profile updated successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

  
// Fetch user orders
app.get("/api/user-orders/:userID", async (req, res) => {
  try {
    const { userID } = req.params;

    // Fetch orders
    const ordersResult = await pool
      .request()
      .input("userID", sql.Int, userID)
      .query(`
        SELECT o.OrderID, o.TotalAmount, o.ShippingCharge, o.PaymentMethod, o.OrderStatus, o.OrderDate, 
               o.PayPalTransactionID, o.VerifiedAt, o.ShippingAt, o.ReceivedAt, 
               o.CompletedAt, o.CancelledAt,
               a.StreetAddress, a.City, a.StateProvince, a.PostalCode, a.Country
        FROM Orders o
        JOIN Addresses a ON o.AddressID = a.AddressID
        WHERE o.UserID = @userID
        ORDER BY o.OrderDate DESC
      `);

    const orders = ordersResult.recordset;

    for (let order of orders) {
      const itemsResult = await pool
        .request()
        .input("orderID", sql.Int, order.OrderID)
        .query(`
          SELECT 
            oi.OrderItemID, oi.ProductID, oi.VariantID, oi.Quantity, oi.Price, oi.RequestedVariantID,
            p.ProductName, p.Image,
            pv.VariantName,
            rv.RequestedVariantName
          FROM OrderItems oi
          JOIN Products p ON oi.ProductID = p.ProductID
          LEFT JOIN ProductVariants pv ON oi.VariantID = pv.VariantID
          LEFT JOIN RequestedVariant rv ON oi.RequestedVariantID = rv.RequestedVariantID
          WHERE oi.OrderID = @orderID
        `);

      order.items = itemsResult.recordset.map(item => {
        const variantName = item.VariantID ? item.VariantName : item.RequestedVariantName || "Custom Variant";
        return {
          ...item,
          VariantName: variantName,
          Image: convertImageToBase64(item.Image),
        };
      });
    }

    res.json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



  

  app.put("/api/complete-order/:orderID", async (req, res) => {
    try {
      const { orderID } = req.params;
  
      await pool
        .request()
        .input("orderID", sql.Int, orderID)
        .query(`
          UPDATE Orders 
          SET OrderStatus = 'Completed', CompletedAt = GETDATE()
          WHERE OrderID = @orderID
        `);
  
      res.json({ message: "Order marked as completed" });
    } catch (err) {
      console.error("Error updating order status:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

  app.get("/api/order-tracking/:orderID", async (req, res) => {
    try {
      const { orderID } = req.params;
  
      const trackingResult = await pool
        .request()
        .input("orderID", sql.Int, orderID)
        .query(`
          SELECT TrackingID, OrderID, TrackingStatus, Location, TimeStamp
          FROM OrderTracking
          WHERE OrderID = @orderID
          ORDER BY TimeStamp ASC
        `);
  
      res.json(trackingResult.recordset);
    } catch (err) {
      console.error("Error fetching tracking data:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

  

  /*

  RATING SERVER

  */

  

  app.get("/api/get-product/:productID", async (req, res) => {
    const { productID } = req.params;
    // FIX: Convert the string productID to an integer
    const parsedProductID = parseInt(productID, 10);
 
    if (isNaN(parsedProductID)) {
        return res.status(400).json({ error: "Invalid product ID format." });
    }
 
    try {
        const result = await pool.request()
            // Use the parsed integer in your input
            .input("productID", sql.Int, parsedProductID)
            .query(`SELECT ProductName, Image FROM Products WHERE ProductID = @productID`);

        if (result.recordset.length > 0) {
            const product = result.recordset[0];

            if (product.Image) {
                product.Image = await convertImageToBase64(product.Image);
            }

            res.json(product);
        } else {
            res.status(404).json({ error: "Product not found" });
        }
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});
  

app.get("/api/get-product-reviews/:productID", async (req, res) => {
  const { productID } = req.params;
  const parsedProductID = parseInt(productID, 10);

  if (isNaN(parsedProductID)) {
    return res.status(400).json({ error: "Invalid product ID format." });
  }

  try {
    const result = await pool.request()
      .input("productID", sql.Int, parsedProductID)
      .query(`
        SELECT 
            r.RatingID, 
            r.Rating, 
            r.Review, 
            r.CreatedAt,
            u.username,
            u.user_tag,  
            COUNT(rl.LikeID) AS HelpfulCount,
            rr.ReplyID,
            rr.ReplyText AS AdminReply,
            rr.CreatedAt AS ReplyCreatedAt,
            e.username AS EmployeeUsername
        FROM Ratings r
        JOIN Users u ON r.UserID = u.userId
        LEFT JOIN RatingLikes rl ON r.RatingID = rl.RatingID
        LEFT JOIN ReviewReplies rr ON r.RatingID = rr.RatingID
        LEFT JOIN Employees e ON rr.EmployeeID = e.employeeId
        WHERE r.ProductID = @productID
        GROUP BY 
            r.RatingID, r.Rating, r.Review, r.CreatedAt,
            u.username, u.user_tag,
            rr.ReplyID, rr.ReplyText, rr.CreatedAt, e.username
        ORDER BY r.CreatedAt DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});



// Fetch all reported comments
app.get("/api/reported-comments", async (req, res) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        rr.ReportID,
        rr.RatingID,
        rr.ReportReason,      
        rr.ReportType,        
        rr.CreatedAt,
        ru.username AS ReporterUsername,
        ru.user_tag AS ReporterUserTag,  
        u.username,
        r.Rating,
        r.Review,
        r.ProductID
      FROM RatingReports rr
      JOIN Ratings r ON rr.RatingID = r.RatingID
      JOIN Users u ON r.UserID = u.userId
      JOIN Users ru ON rr.UserID = ru.userId
      ORDER BY rr.CreatedAt DESC;
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error fetching reported comments:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});


  app.post("/api/add-rating", async (req, res) => {
    const { userID, orderID, productID, rating, review } = req.body;

    if (!userID || !orderID || !productID || !rating) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const existingRating = await pool.request()
            .input("userID", sql.Int, userID)
            .input("orderID", sql.Int, orderID)
            .input("productID", sql.Int, productID)
            .query(`
                SELECT * FROM Ratings 
                WHERE UserID = @userID AND OrderID = @orderID AND ProductID = @productID
            `);

        if (existingRating.recordset.length > 0) {
            // Update existing rating
            await pool.request()
                .input("userID", sql.Int, userID)
                .input("orderID", sql.Int, orderID)
                .input("productID", sql.Int, productID)
                .input("rating", sql.Int, rating)
                .input("review", sql.NVarChar, review || null)
                .query(`
                    UPDATE Ratings 
                    SET Rating = @rating, Review = @review, CreatedAt = GETDATE()
                    WHERE UserID = @userID AND OrderID = @orderID AND ProductID = @productID
                `);
            
            res.status(200).json({ message: "Rating updated successfully" });
        } else {
            // Insert new rating
            await pool.request()
                .input("userID", sql.Int, userID)
                .input("orderID", sql.Int, orderID)
                .input("productID", sql.Int, productID)
                .input("rating", sql.Int, rating)
                .input("review", sql.NVarChar, review || null)
                .query(`
                    INSERT INTO Ratings (UserID, OrderID, ProductID, Rating, Review, CreatedAt)
                    VALUES (@userID, @orderID, @productID, @rating, @review, GETDATE())
                `);

            res.status(201).json({ message: "Rating submitted successfully" });
        }
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});


app.get("/api/get-rating/:orderID/:productID", async (req, res) => {
    const { orderID, productID } = req.params;
    const userID = req.query.userID; // Assume userID is passed as a query param

    if (!userID) {
        return res.status(400).json({ error: "User ID required" });
    }

    try {
        const result = await pool.request()
            .input("userID", sql.Int, userID)
            .input("orderID", sql.Int, orderID)
            .input("productID", sql.Int, productID)
            .query(`
                SELECT Rating, Review 
                FROM Ratings 
                WHERE UserID = @userID AND OrderID = @orderID AND ProductID = @productID
            `);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.json({ rating: null, review: "" });
        }
    } catch (error) {
        console.error("Error fetching rating:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});


//REPORTING REVIEW
app.post("/report-review", async (req, res) => {
    const { userId, ratingId, reportType, reportReason } = req.body;

    if (!userId || !ratingId || !reportType) {
        return res.status(400).json({ error: "Missing required fields: userId, ratingId, or reportType." });
    }

    try {
        // First, check if the user has already reported this review
        const checkExistingReport = await pool.request()
            .input("userId", sql.Int, userId)
            .input("ratingId", sql.Int, ratingId)
            .query(`
                SELECT ReportID FROM RatingReports
                WHERE UserID = @userId AND RatingID = @ratingId
            `);

        if (checkExistingReport.recordset.length > 0) {
            return res.status(409).json({ error: "You have already reported this review." });
        }

        // If no existing report, insert the new one
        await pool.request()
            .input("ratingId", sql.Int, ratingId)
            .input("userId", sql.Int, userId)
            .input("reportType", sql.NVarChar, reportType)
            .input("reportReason", sql.NVarChar, reportReason || null)
            .query(`
                INSERT INTO RatingReports (RatingID, UserID, ReportType, ReportReason)
                VALUES (@ratingId, @userId, @reportType, @reportReason)
            `);

        res.status(201).json({ message: "Review reported successfully." });

    } catch (error) {
        console.error("Error reporting review:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

//Check user reports
app.get("/api/user-reports", async (req, res) => {
    const { userId, ratingIds } = req.query;

    if (!userId || !ratingIds) {
        return res.status(400).json({ error: "Missing required query parameters: userId or ratingIds." });
    }

    try {
        const parsedRatingIds = ratingIds.split(',').map(id => parseInt(id, 10));
        if (parsedRatingIds.some(isNaN)) {
            return res.status(400).json({ error: "Invalid ratingIds format." });
        }

        const request = pool.request();
        request.input("userId", sql.Int, userId);

        const reportedReviewsResult = await request.query(`
            SELECT RatingID 
            FROM RatingReports 
            WHERE UserID = @userId AND RatingID IN (${parsedRatingIds.join(',')})
        `);

        const reportedIds = reportedReviewsResult.recordset.map(row => row.RatingID);
        res.json({ reportedReviewIds: reportedIds });

    } catch (error) {
        console.error("Error fetching user reports:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});



//REPORT COUNTS
app.get("/api/reports-count", async (req, res) => {
    const { ratingIds } = req.query;

    if (!ratingIds) {
        return res.status(400).json({ error: "Missing required query parameter: ratingIds." });
    }

    try {
        const parsedRatingIds = ratingIds.split(",").map((id) => parseInt(id, 10));
        if (parsedRatingIds.some(isNaN)) {
            return res.status(400).json({ error: "Invalid ratingIds format." });
        }

        const request = pool.request();

        const reportsCountResult = await request.query(`
            SELECT RatingID, COUNT(*) AS ReportCount
            FROM RatingReports
            WHERE RatingID IN (${parsedRatingIds.join(",")})
            GROUP BY RatingID
        `);

        // Convert result into an object { RatingID: count }
        const reportCounts = {};
        reportsCountResult.recordset.forEach((row) => {
            reportCounts[row.RatingID] = row.ReportCount;
        });

        res.json({ reportCounts });
    } catch (error) {
        console.error("Error fetching reports count:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});



//REVIEW LIKES
// New endpoint to toggle a like on a review
app.post("/api/toggle-like", async (req, res) => {
    const { userId, ratingId } = req.body;

    if (!userId || !ratingId) {
        return res.status(400).json({ error: "Missing required fields: userId or ratingId." });
    }

    try {
        const checkExistingLike = await pool.request()
            .input("userId", sql.Int, userId)
            .input("ratingId", sql.Int, ratingId)
            .query(`
                SELECT LikeID FROM RatingLikes
                WHERE UserID = @userId AND RatingID = @ratingId
            `);

        if (checkExistingLike.recordset.length > 0) {
            // If a like exists, remove it (unlike)
            await pool.request()
                .input("userId", sql.Int, userId)
                .input("ratingId", sql.Int, ratingId)
                .query(`
                    DELETE FROM RatingLikes
                    WHERE UserID = @userId AND RatingID = @ratingId
                `);
            res.status(200).json({ message: "Like removed successfully.", action: "unliked" });
        } else {
            // If no like exists, add one
            await pool.request()
                .input("userId", sql.Int, userId)
                .input("ratingId", sql.Int, ratingId)
                .query(`
                    INSERT INTO RatingLikes (UserID, RatingID, CreatedAt)
                    VALUES (@userId, @ratingId, GETDATE())
                `);
            res.status(201).json({ message: "Review liked successfully.", action: "liked" });
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});

// New endpoint to check which reviews a user has liked
app.get("/api/user-likes", async (req, res) => {
    const { userId, ratingIds } = req.query;

    if (!userId || !ratingIds) {
        return res.status(400).json({ error: "Missing required query parameters: userId or ratingIds." });
    }

    try {
        const parsedRatingIds = ratingIds.split(',').map(id => parseInt(id, 10));
        if (parsedRatingIds.some(isNaN)) {
            return res.status(400).json({ error: "Invalid ratingIds format." });
        }

        const request = pool.request();
        request.input("userId", sql.Int, userId);

        const likedReviewsResult = await request.query(`
            SELECT RatingID 
            FROM RatingLikes 
            WHERE UserID = @userId AND RatingID IN (${parsedRatingIds.join(',')})
        `);

        const likedIds = likedReviewsResult.recordset.map(row => row.RatingID);
        res.json({ likedReviewIds: likedIds });
    } catch (error) {
        console.error("Error fetching user likes:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});




// CREATE review reply
app.post("/api/review-replies", async (req, res) => {
  const { RatingID, EmployeeID, ReplyText } = req.body;

  if (!RatingID || !EmployeeID || !ReplyText) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const result = await pool.request()
      .input("RatingID", sql.Int, RatingID)
      .input("EmployeeID", sql.Int, EmployeeID)
      .input("ReplyText", sql.NVarChar, ReplyText)
      .query(`
        INSERT INTO ReviewReplies (RatingID, EmployeeID, ReplyText, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.ReplyID, INSERTED.RatingID, INSERTED.EmployeeID, INSERTED.ReplyText, INSERTED.CreatedAt, INSERTED.UpdatedAt
        VALUES (@RatingID, @EmployeeID, @ReplyText, GETDATE(), GETDATE())
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error("Error creating reply:", err);
    res.status(500).json({ message: "Failed to create reply" });
  }
});


// UPDATE review reply
app.put("/api/review-replies/:id", async (req, res) => {
  const { id } = req.params;
  const { ReplyText } = req.body;

  if (!ReplyText) {
    return res.status(400).json({ message: "Reply text is required" });
  }

  try {
    const result = await pool.request()
      .input("ReplyID", sql.Int, id)
      .input("ReplyText", sql.NVarChar, ReplyText)
      .query(`
        UPDATE ReviewReplies
        SET ReplyText = @ReplyText, UpdatedAt = GETDATE()
        OUTPUT INSERTED.ReplyID, INSERTED.RatingID, INSERTED.EmployeeID, INSERTED.ReplyText, INSERTED.CreatedAt, INSERTED.UpdatedAt
        WHERE ReplyID = @ReplyID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Reply not found" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error updating reply:", err);
    res.status(500).json({ message: "Failed to update reply" });
  }
});



// DELETE review reply
app.delete("/api/review-replies/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.request()
      .input("ReplyID", sql.Int, id)
      .query(`
        DELETE FROM ReviewReplies
        OUTPUT DELETED.ReplyID
        WHERE ReplyID = @ReplyID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Reply not found" });
    }

    res.json({ message: "Reply deleted successfully", replyId: id });
  } catch (err) {
    console.error("Error deleting reply:", err);
    res.status(500).json({ message: "Failed to delete reply" });
  }
});






/*


SHOP SERVER 


*/

// GET PRODUCTS
app.get("/products", async (req, res) => {
    await poolConnect;
    try {
        const { availability, category } = req.query;

        let query = `
            SELECT 
                p.ProductID, 
                p.ProductName, 
                p.BasePrice, 
                p.Image AS ProductImage, 
                v.VariantID, 
                v.VariantName, 
                v.Price, 
                v.Quantity, 
                a.AvailabilityStatus AS Availability,
                c.CategoryID,
                ISNULL(SUM(oi.Quantity), 0) AS totalOrders,
                ISNULL(ratings_agg.avgRating, 0) AS avgRating,
                ISNULL(ratings_agg.reviewCount, 0) AS reviewCount
            FROM Products p
            LEFT JOIN ProductVariants v ON p.ProductID = v.ProductID
            LEFT JOIN ProductAvailability a ON v.AvailabilityID = a.AvailabilityID
            LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
            -- CHANGE: Use INNER JOIN to only include products that have been sold
            INNER JOIN OrderItems oi ON p.ProductID = oi.ProductID
            INNER JOIN Orders o 
                ON oi.OrderID = o.OrderID
                -- FIX: Added logic to correctly count only completed orders.
                -- An order is considered complete if its status is 'Completed' OR
                -- the CompletedAt timestamp is not null. We also ensure it's not cancelled.
                AND (o.OrderStatus = 'Completed' OR o.CompletedAt IS NOT NULL)
                AND o.CancelledAt IS NULL
            LEFT JOIN (
                SELECT  
                    ProductID, 
                    AVG(Rating) AS avgRating, 
                    COUNT(RatingID) AS reviewCount
                FROM Ratings
                GROUP BY ProductID
            ) AS ratings_agg ON p.ProductID = ratings_agg.ProductID
            WHERE p.IsArchived = 0
        `;

        // Apply availability filter (if any)
        if (availability && availability !== "All") {
            const availabilityArray = availability.split(",").map(a => `'${a}'`);
            query += ` AND a.AvailabilityStatus IN (${availabilityArray.join(",")})`;
        }

        // Apply category filter (if specific categories are selected)
        if (category && category !== "All") {
            const categoryArray = category.split(",").map(c => `'${c}'`);
            query += ` AND c.CategoryID IN (${categoryArray.join(",")})`;
        }

        // Add GROUP BY and HAVING clauses to aggregate the data and filter for sold items
        query += `
            GROUP BY 
                p.ProductID, 
                p.ProductName, 
                p.BasePrice, 
                p.Image, 
                v.VariantID, 
                v.VariantName, 
                v.Price, 
                v.Quantity, 
                a.AvailabilityStatus,
                c.CategoryID,
                ratings_agg.avgRating,
                ratings_agg.reviewCount
            HAVING SUM(oi.Quantity) > 0
            ORDER BY p.ProductID;
        `;

        const result = await pool.request().query(query);

        if (result.recordset.length === 0) {
            return res.json([]);
        }

        const products = {};
        result.recordset.forEach(row => {
            if (!products[row.ProductID]) {
                products[row.ProductID] = {
                    id: row.ProductID,
                    name: row.ProductName,
                    basePrice: row.BasePrice,
                    image: row.ProductImage ? convertImageToBase64(row.ProductImage) : null,
                    categoryId: row.CategoryID,
                    availability: row.Availability,
                    variants: [],
                    totalOrders: row.totalOrders, 
                    avgRating: row.avgRating ? parseFloat(row.avgRating).toFixed(1) : 0,
                    reviewCount: row.reviewCount || 0,
                };
            }

            if (row.VariantID) {
                products[row.ProductID].variants.push({
                    id: row.VariantID,
                    name: row.VariantName,
                    color: row.Color,
                    material: row.Material,
                    boreSize: row.BoreSize,
                    power: row.Power,
                    price: row.Price,
                    quantity: row.Quantity,
                });
            }
        });

        res.json(Object.values(products));
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Server error while fetching products" });
    }
});



// Helper function to convert image buffer to Base64
const convertImageToBase64 = (imageBuffer) => {
    if (!imageBuffer) return null;
  
    // Convert image to base64 string
    const base64Image = imageBuffer.toString("base64");
  
    // Return as a data URL (PNG format)
    return `data:image/png;base64,${base64Image}`;
  };




// GET CATEGORIES
app.get("/filter-categories", async (req, res) => {
    await poolConnect;
    try {
        const result = await pool.request().query(`
            SELECT CategoryID AS id, CategoryName AS name 
            FROM Categories
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Server error while fetching categories" });
    }
});



// GET PRODUCT DETAILS BY ID
app.get("/product/:id", async (req, res) => {
    await poolConnect;
    const { id } = req.params;

    try {
        const result = await pool.request()
            .input("ProductID", id)
            .query(`
                SELECT
                    p.ProductID,
                    p.ProductName,
                    p.BasePrice,
                    p.Image AS ProductImage,
                    p.Description, 
                    p.CategoryID,
                    p.RequestGuide,
                    v.VariantID,
                    v.VariantName,
                    v.Price,
                    v.Quantity,
                    v.Image AS VariantImage,
                    a.AvailabilityStatus AS Availability,
                    (SELECT AVG(Rating) FROM Ratings WHERE ProductID = p.ProductID) AS AverageRating,
                    (SELECT COUNT(RatingID) FROM Ratings WHERE ProductID = p.ProductID) AS RatingCount
                FROM Products p
                LEFT JOIN ProductVariants v ON p.ProductID = v.ProductID
                LEFT JOIN ProductAvailability a ON v.AvailabilityID = a.AvailabilityID
                WHERE p.ProductID = @ProductID
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        const product = {
            id: result.recordset[0].ProductID,
            name: result.recordset[0].ProductName,
            basePrice: result.recordset[0].BasePrice,
            description: result.recordset[0].Description, // Make sure description is passed
            requestGuide: result.recordset[0].RequestGuide,
            image: result.recordset[0].ProductImage ? convertImageToBase64(result.recordset[0].ProductImage) : null,
            averageRating: result.recordset[0].AverageRating ? parseFloat(result.recordset[0].AverageRating).toFixed(1) : "No ratings yet",
            ratingCount: result.recordset[0].RatingCount || 0,
            categoryId: result.recordset[0].CategoryID, // <--- ADD THIS LINE
            variants: result.recordset.map(row => ({
                variantID: row.VariantID,
                name: row.VariantName,
                price: row.Price,
                quantity: row.Quantity,
                image: row.VariantImage ? convertImageToBase64(row.VariantImage) : null,
                availability: row.Availability
            })),
        };

        res.json(product);
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).json({ error: "Server error while fetching product details" });
    }
});



// POST REVIEW
app.get("/reviews/:productId", async (req, res) => {
    await poolConnect;
    const { productId } = req.params;

    // Convert the productId string to an integer
    const parsedProductId = parseInt(productId, 10);

    // Validate that the parsed ID is a valid number
    if (isNaN(parsedProductId)) {
        return res.status(400).json({ error: "Invalid Product ID." });
    }

    try {
        const result = await pool.request()
            .input("ProductID", sql.Int, parsedProductId) // Use the parsed integer
            .query(`
                SELECT r.RatingID, r.UserID, u.Username, r.Rating, r.Review, r.CreatedAt 
                FROM Ratings r
                JOIN Users u ON r.UserID = u.UserID
                WHERE r.ProductID = @ProductID
                ORDER BY r.CreatedAt DESC
            `);

        if (result.recordset.length === 0) {
            return res.json({ reviews: [], averageRating: 0, totalRatings: 0, ratingCounts: {} });
        }

        // Calculate rating summary
        const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRating = 0;

        result.recordset.forEach(review => {
            ratingCounts[review.Rating]++;
            totalRating += review.Rating;
        });

        const totalReviews = result.recordset.length;
        const averageRating = (totalRating / totalReviews).toFixed(1);

        res.json({
            reviews: result.recordset,
            averageRating,
            totalRatings: totalReviews,
            ratingCounts
        });

    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ error: "Database error", details: error.message });
    }
});



// Popular Products
app.get("/popular-products", async (req, res) => {
    await poolConnect;

    try {
        const query = `
            WITH ProductStats AS (
                SELECT 
                    p.ProductID, 
                    p.ProductName, 
                    p.Image,
                    -- The SUM(oi.Quantity) function correctly counts the total number of items sold.
                    ISNULL(SUM(oi.Quantity), 0) AS totalOrders,
                    ISNULL(ratings_agg.avgRating, 0) AS avgRating,
                    ISNULL(ratings_agg.reviewCount, 0) AS reviewCount,
                    MIN(v.Price) AS minPrice,
                    MAX(v.Price) AS maxPrice
                FROM Products p
                LEFT JOIN ProductVariants v ON p.ProductID = v.ProductID
                -- INNER JOIN ensures that only products with at least one sold item are included.
                INNER JOIN OrderItems oi ON p.ProductID = oi.ProductID
                INNER JOIN Orders o 
                    ON oi.OrderID = o.OrderID
                    -- The WHERE clause correctly filters for orders that have been successfully completed.
                    -- It excludes canceled orders.
                    AND (o.OrderStatus = 'Completed' OR o.CompletedAt IS NOT NULL)
                    AND o.CancelledAt IS NULL
                LEFT JOIN (
                    SELECT 
                        ProductID, 
                        AVG(Rating) AS avgRating, 
                        COUNT(RatingID) AS reviewCount
                    FROM Ratings
                    GROUP BY ProductID
                ) AS ratings_agg ON p.ProductID = ratings_agg.ProductID
                WHERE p.IsArchived = 0
                GROUP BY p.ProductID, p.ProductName, p.Image, ratings_agg.avgRating, ratings_agg.reviewCount
            )
            SELECT *
            FROM ProductStats
            ORDER BY (avgRating * 10 + totalOrders) DESC
            OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;
        `;

        const result = await pool.request().query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "No popular products found" });
        }

        const popularProducts = result.recordset.map(product => ({
            id: product.ProductID,
            name: product.ProductName,
            minPrice: product.minPrice,
            maxPrice: product.maxPrice,
            image: product.Image ? convertImageToBase64(product.Image) : null,
            totalOrders: product.totalOrders, // ✅ now only from valid completed orders
            avgRating: product.avgRating ? parseFloat(product.avgRating).toFixed(1) : "0.0",
            reviewCount: product.reviewCount || 0,
        }));

        res.json(popularProducts);
    } catch (error) {
        console.error("Error fetching popular products:", error);
        res.status(500).json({ error: "Server error while fetching popular products" });
    }
});







/*


CART SERVER


*/
// ✅ Get Product by ID (including variants)
app.get("/product/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const poolRequest = await pool;
        const productQuery = await poolRequest.request()
            .input("productId", id)
            .query(`
                SELECT * FROM Products WHERE productID = @productId;
                SELECT * FROM Variants WHERE productID = @productId;
            `);

        if (productQuery.recordsets[0].length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        const product = productQuery.recordsets[0][0];
        const variants = productQuery.recordsets[1];

        res.json({ ...product, variants });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});



//  Add to Cart
app.post("/cart", async (req, res) => {
    const { userID, productId, variantId, quantity } = req.body;
  
    if (!variantId) {
      return res.status(400).json({ error: "Variant ID is required for cart." });
    }
  
    try {
      const poolRequest = await pool;
  
      const existingItem = await poolRequest.request()
        .input("userID", userID)
        .input("productId", productId)
        .input("variantId", variantId)
        .query(`
          SELECT quantity FROM Cart 
          WHERE userID = @userID AND productID = @productId AND variantID = @variantId
        `);
  
      if (existingItem.recordset.length > 0) {
        // Update quantity
        await poolRequest.request()
          .input("userID", userID)
          .input("productId", productId)
          .input("variantId", variantId)
          .input("quantity", quantity)
          .query(`
            UPDATE Cart
            SET quantity = quantity + @quantity
            WHERE userID = @userID AND productID = @productId AND variantID = @variantId
          `);
      } else {
        // Insert new item
        await poolRequest.request()
          .input("userID", userID)
          .input("productId", productId)
          .input("variantId", variantId)
          .input("quantity", quantity)
          .query(`
            INSERT INTO Cart (UserID, ProductID, VariantID, Quantity, DateAdded)
            VALUES (@userID, @productId, @variantId, @quantity, GETDATE())
          `);
      }
  
      res.status(200).json({ message: "Item added to cart." });
    } catch (err) {
      console.error("Cart insert error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  




//  Fetch Cart Items
app.get("/cart/:userID", async (req, res) => {
    const { userID } = req.params;
    
    try {
        const cartItemsResult = await pool
            .request()
            .input("userID", sql.Int, userID)
            .query(`
                SELECT 
                    c.cartID, 
                    c.quantity, 
                    v.variantID, 
                    v.variantName, 
                    v.price, 
                    p.image, 
                    v.quantity AS variantQuantity,
                    p.productID, 
                    p.productName,
                    (c.quantity * v.price) AS subtotal
                FROM Cart c
                JOIN ProductVariants v ON c.variantID = v.variantID
                JOIN Products p ON v.productID = p.productID
                WHERE c.userID = @userID
            ORDER BY c.cartID DESC;

            `);
  
        // Convert images to Base64 format
        const cartItems = cartItemsResult.recordset.map((item) => ({
            ...item,
            image: convertImageToBase64(item.image), // Fix image conversion
        }));
  
        res.json(cartItems);
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ error: "Could not fetch cart" });
    }
});




// ✅ Update Cart Quantity
app.put("/cart/:cartID", async (req, res) => {
    const { cartID } = req.params;
    const { quantity } = req.body;

    try {
        const poolRequest = await pool;
        await poolRequest.request()
            .input("cartID", cartID)
            .input("quantity", quantity)
            .query(`
                UPDATE Cart 
                SET quantity = @quantity 
                WHERE cartID = @cartID
            `);

        res.json({ message: "Quantity updated" });
    } catch (error) {
        console.error("Error updating quantity:", error);
        res.status(500).json({ error: "Could not update quantity" });
    }
});


// ✅ Delete Item from Cart
app.delete("/cart/:cartID", async (req, res) => {
    const { cartID } = req.params;
    try {
        const poolRequest = await pool;
        await poolRequest.request()
            .input("cartID", cartID)
            .query(`DELETE FROM Cart WHERE cartID = @cartID`);

        res.json({ message: "Item removed from cart" });
    } catch (error) {
        console.error("Error deleting cart item:", error);
        res.status(500).json({ error: "Could not delete item" });
    }
});


// ✅ Edit Variant from Cart
app.get("/product/:productID/variants", async (req, res) => {
    const { productID } = req.params;

    try {
        const poolRequest = await pool;
        const result = await poolRequest.request()
            .input("productID", productID)
            .query(`
                SELECT VariantID, VariantName 
                FROM Variants 
                WHERE ProductID = @productID
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching variants:", error);
        res.status(500).json({ error: "Could not fetch variants" });
    }
});

// Fetch quantities of specific variants
app.post('/variants/quantities', async (req, res) => {
    const { variantIDs } = req.body;
    if (!Array.isArray(variantIDs) || variantIDs.length === 0) {
      return res.status(400).json({ error: 'Invalid variant IDs' });
    }
  
    try {
      const poolRequest = await pool;
      const quantitiesQuery = await poolRequest.request()
        .input('variantIDs', sql.TVP, createVariantIDTable(variantIDs))
        .query(`
          SELECT VariantID, Quantity
          FROM ProductVariants
          WHERE VariantID IN (SELECT VariantID FROM @variantIDs)
        `);
  
      const quantities = {};
      quantitiesQuery.recordset.forEach(row => {
        quantities[row.VariantID] = row.Quantity;
      });
  
      res.json(quantities);
    } catch (error) {
      console.error('Error fetching variant quantities:', error);
      res.status(500).json({ error: 'Could not fetch variant quantities' });
    }
  });
  
  

/*

REQUESTED VARIANT SERVER

*/

app.post("/request-variant", async (req, res) => {
    const { userID, productId, requestedVariant, quantity } = req.body;
  
    if (!requestedVariant || !userID || !productId) {
      return res.status(400).json({ error: "Missing required fields." });
    }
  
    try {
      const poolRequest = await pool;
  
      await poolRequest.request()
        .input("userID", userID)
        .input("productId", productId)
        .input("requestedVariant", requestedVariant)
        .input("quantity", quantity)
        .query(`
            INSERT INTO RequestedVariant (RequestedVariantName, UserID, ProductID, Quantity, RequestDate, Status)
            VALUES (@requestedVariant, @userID, @productId, @quantity, GETDATE(), 0)
        `);

  
      res.status(200).json({ message: "Requested variant added." });
    } catch (err) {
      console.error("Variant request error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

// Fetch all requested variants for a user
app.get("/requested-variants/:userID", async (req, res) => {
    const { userID } = req.params;

    try {
        const result = await pool
            .request()
            .input("userID", sql.Int, userID)
            .query(`
                SELECT 
                    rv.RequestedVariantID,
                    rv.RequestedVariantName,
                    rv.UserID,
                    rv.Price,
                    rv.Quantity,
                    rv.RequestDate,
                    rv.Status,
                    rv.ApprovedDate,
                    rv.RejectedDate,
                    p.productID,
                    p.ProductName,
                    p.image
                FROM RequestedVariant rv
                JOIN Products p ON rv.ProductID = p.ProductID
                WHERE rv.UserID = @userID
                ORDER BY rv.RequestDate DESC
            `);

        const variants = result.recordset.map((item) => ({
            ...item,
            image: convertImageToBase64(item.image),
        }));

        res.json(variants);
    } catch (error) {
        console.error("Error fetching requested variants:", error);
        res.status(500).json({ error: "Could not fetch requested variants" });
    }
});

// PUT route to update a requested variant's name
app.put("/requested-variant/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { RequestedVariantName } = req.body;

    if (!RequestedVariantName || typeof RequestedVariantName !== 'string') {
      return res.status(400).json({ error: "RequestedVariantName is required and must be a string." });
    }

    const result = await pool
      .request()
      .input("RequestedVariantID", sql.Int, id)
      .input("RequestedVariantName", sql.NVarChar, RequestedVariantName)
      .query(`
        UPDATE RequestedVariant
        SET RequestedVariantName = @RequestedVariantName
        WHERE RequestedVariantID = @RequestedVariantID
      `);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: "Requested variant name updated successfully." });
    } else {
      res.status(404).json({ error: "Requested variant not found or no changes made." });
    }
  } catch (error) {
    console.error("Error updating requested variant name:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE route to delete a requested variant
app.delete("/requested-variant/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool
      .request()
      .input("RequestedVariantID", sql.Int, id)
      .query(`
        DELETE FROM RequestedVariant
        WHERE RequestedVariantID = @RequestedVariantID
      `);

    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: "Requested variant deleted successfully." });
    } else {
      res.status(404).json({ error: "Requested variant not found." });
    }
  } catch (error) {
    console.error("Error deleting requested variant:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
  




/*

PAYPAL TRANSACTIONS SERVER

*/
  
// Checkout Address
app.get("/get-default-address", async (req, res) => {
    const { userID } = req.query;
    if (!userID) return res.status(400).json({ error: "User ID is required" });
  
    try {
      const poolRequest = await pool.request();
      const result = await poolRequest
        .input("userID", sql.Int, userID)
        .query("SELECT TOP 1 * FROM Addresses WHERE UserID = @userID AND IsInUse = 1");
  
      if (result.recordset.length > 0) {
        res.json(result.recordset[0]); // Return the first default address
      } else {
        res.json(null); // No default address found
      }
    } catch (error) {
      console.error("Error fetching default address:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

  app.post("/create-order", async (req, res) => {
    try {
      const phpAmount = req.body.amount;
  
      // Convert PHP → USD
      const rateResponse = await axios.get(
        `https://api.frankfurter.app/latest?amount=${phpAmount}&from=PHP&to=USD`
      );
      const usdAmount = rateResponse.data.rates.USD.toFixed(2);
  
      const accessToken = await generateAccessToken();
      const response = await axios.post(
        `${PAYPAL_BASE_URL}/v2/checkout/orders`,
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: usdAmount,
              },
            },
          ],
          application_context: {
            return_url: "http://localhost:3000/complete-order",
            cancel_url: "http://localhost:3000/cancel-order",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            brand_name: "Edgi Custom Works",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      res.json(response.data);
    } catch (error) {
      console.error("Create Order Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  
  


app.post("/capture-payment/:orderId", async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${req.params.orderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to capture payment" });
  }
});


app.post("/place-order", async (req, res) => {
    const {
        userID, address, items, totalAmount,
        shippingCharge, finalPrice, paymentStatus, PayPalTransactionID
    } = req.body;

    try {
        const poolRequest = await pool.request();

        // Fetch the default address if not provided in request
        let addressID = address?.addressID;
        if (!addressID) {
            const addressResult = await pool.request()
                .input("userID", sql.Int, userID)
                .query("SELECT TOP 1 AddressID FROM Addresses WHERE UserID = @userID AND IsInUse = 1");

            if (addressResult.recordset.length > 0) {
                addressID = addressResult.recordset[0].AddressID;
            } else {
                return res.status(400).json({ error: "No default address found for user." });
            }
        }

        // Generate unique 6-digit OrderID
        let orderID;
        let isUnique = false;
        while (!isUnique) {
            orderID = Math.floor(100000 + Math.random() * 900000); // 6-digit number
            const idCheck = await pool.request()
                .input("orderID", sql.Int, orderID)
                .query("SELECT OrderID FROM Orders WHERE OrderID = @orderID");

            if (idCheck.recordset.length === 0) {
                isUnique = true;
            }
        }

        // Insert into Orders
        await pool.request()
            .input("orderID", sql.Int, orderID)
            .input("userID", sql.Int, userID)
            .input("addressID", sql.Int, addressID)
            .input("totalAmount", sql.Decimal(10, 2), totalAmount)
            .input("shippingCharge", sql.Decimal(10, 2), shippingCharge || 0)
            .input("finalPrice", sql.Decimal(10, 2), finalPrice || totalAmount)
            .input("paymentMethod", sql.NVarChar(50), "PayPal")
            .input("orderStatus", sql.NVarChar(50), "Processing")
            .input("PayPalTransactionID", sql.NVarChar(255), PayPalTransactionID)
            .query(`
                INSERT INTO Orders (
                    OrderID, UserID, AddressID, TotalAmount, ShippingCharge, FinalPrice,
                    PaymentMethod, OrderStatus, OrderDate, PayPalTransactionID
                )
                VALUES (
                    @orderID, @userID, @addressID, @totalAmount, @shippingCharge, @finalPrice,
                    @paymentMethod, @orderStatus, GETDATE(), @PayPalTransactionID
                )
            `);

        // Insert items into OrderItems
        for (const item of items) {
            await pool.request()
                .input("orderID", sql.Int, orderID)
                .input("productID", sql.Int, item.productID)
                .input("variantID", sql.Int, item.variantID)
                .input("quantity", sql.Int, item.quantity)
                .input("price", sql.Decimal(10, 2), item.price)
                .query(`
                    INSERT INTO OrderItems (OrderID, ProductID, VariantID, Quantity, Price)
                    VALUES (@orderID, @productID, @variantID, @quantity, @price)
                `);
        }

        // Delete selected cart items (variant-specific)
        for (const item of items) {
            await pool.request()
                .input("userID", sql.Int, userID)
                .input("variantID", sql.Int, item.variantID)
                .query(`DELETE FROM Cart WHERE userID = @userID AND variantID = @variantID`);
        }

        res.json({ message: "Order placed successfully", orderID });

        // === EMAIL NOTIFICATIONS ===

        // Fetch employee emails (excluding terminated)
        const employeeResult = await pool.request().query(`
            SELECT email FROM Employees WHERE terminated = 0 AND email IS NOT NULL
        `);
        const employeeEmails = employeeResult.recordset.map(emp => emp.email);

        // Fetch username and email
        const userResult = await pool.request()
            .input("userID", sql.Int, userID)
            .query(`SELECT username, email FROM Users WHERE userID = @userID`);
        const username = userResult.recordset[0]?.username || "A customer";
        const userEmail = userResult.recordset[0]?.email || null;

        // Format items as HTML
        const itemsHTML = items.map(item => `
            <tr>
                <td>${item.productName}</td>
                <td>${item.variantName}</td>
                <td>${item.quantity}</td>
                <td>₱${item.price.toLocaleString()}</td>
                <td>₱${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
        `).join("");

        // Build full email HTML
        const emailHTML = `
            <h3>${username} placed an order</h3>
            <p><strong>Shipping Address:</strong><br>
            ${address.StreetAddress}, ${address.City}, ${address.StateProvince}, ${address.PostalCode}, ${address.Country}
            </p>
            <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
            </table>
            <p><strong>Total Items Price:</strong> ₱${totalAmount.toLocaleString()}</p>
            <p><strong>Shipping Charge:</strong> ₱${shippingCharge.toLocaleString()}</p>
            <p><strong>Final Price:</strong> ₱${finalPrice.toLocaleString()}</p>
        `;

        // Send email to employees
        if (employeeEmails.length > 0) {
            await transporter.sendMail({
                from: '"Edgi Custom Works" <edgicustomworks100@gmail.com>',
                to: employeeEmails.join(","),
                subject: `${username} placed an order`,
                html: `<h2>NEW ITEM PURCHASE NOTICE</h2>` + emailHTML
            });
        }

        // Send email to Customer
        if (userEmail) {
            await transporter.sendMail({
                from: '"Edgi Custom Works" <edgicustomworks100@gmail.com>',
                to: userEmail,
                subject: `${username} placed an order`,
                html: `<h2>THANK YOU FOR YOUR PURCHASE AT EDGI Custom Works</h2>` + emailHTML
            });
        }

    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ error: "Could not place order" });
    }
});




//Endpoint for Rquesting a variant
app.post("/place-order-r", async (req, res) => {
    const {
        userID,
        address,
        items,
        totalAmount,
        shippingCharge,
        finalPrice,
        paymentStatus,
        PayPalTransactionID
    } = req.body;

    try {
        await poolConnect;
        
        // 1. Get AddressID if not provided
        let addressID = address?.AddressID;
        if (!addressID) {
            const addressResult = await pool.request()
                .input("userID", sql.Int, userID)
                .query("SELECT TOP 1 AddressID FROM Addresses WHERE UserID = @userID AND IsInUse = 1");

            if (addressResult.recordset.length > 0) {
                addressID = addressResult.recordset[0].AddressID;
            } else {
                return res.status(400).json({ message: "Default address not found." });
            }
        }

        // 2. Generate unique 6-digit OrderID
        let orderID;
        let isUnique = false;
        while (!isUnique) {
            orderID = Math.floor(100000 + Math.random() * 900000);
            const idCheck = await pool.request()
                .input("orderID", sql.Int, orderID)
                .query("SELECT OrderID FROM Orders WHERE OrderID = @orderID");

            if (idCheck.recordset.length === 0) {
                isUnique = true;
            }
        }

        // 3. Insert into Orders table
        await pool.request()
            .input("orderID", sql.Int, orderID)
            .input("UserID", sql.Int, userID)
            .input("AddressID", sql.Int, addressID)
            .input("TotalAmount", sql.Decimal(18, 2), totalAmount)
            .input("ShippingCharge", sql.Decimal(18, 2), shippingCharge)
            .input("FinalPrice", sql.Decimal(18, 2), finalPrice)
            .input("PaymentMethod", sql.VarChar(50), "PayPal")
            .input("OrderStatus", sql.VarChar(50), "Processing")
            .input("PayPalTransactionID", sql.VarChar(255), PayPalTransactionID)
            .query(`
                INSERT INTO Orders (
                    OrderID, UserID, AddressID, TotalAmount, ShippingCharge, FinalPrice,
                    PaymentMethod, OrderStatus, OrderDate, PayPalTransactionID
                )
                VALUES (
                    @orderID, @UserID, @AddressID, @TotalAmount, @ShippingCharge, @FinalPrice,
                    @PaymentMethod, @OrderStatus, GETDATE(), @PayPalTransactionID
                )
            `);

        // 4. Insert into OrderItems for each item
        for (const item of items) {
            const productResult = await pool.request()
                .input("RequestedVariantID", sql.Int, item.RequestedVariantID)
                .query(`SELECT ProductID FROM RequestedVariant WHERE RequestedVariantID = @RequestedVariantID`);

            const productID = productResult.recordset[0]?.ProductID;
            if (!productID) {
                throw new Error(`ProductID not found for RequestedVariantID: ${item.RequestedVariantID}`);
            }

            await pool.request()
                .input("OrderID", sql.Int, orderID)
                .input("ProductID", sql.Int, productID)
                .input("RequestedVariantID", sql.Int, item.RequestedVariantID)
                .input("VariantID", sql.Int, null) // requested variant
                .input("Quantity", sql.Int, item.quantity)
                .input("Price", sql.Decimal(18, 2), item.Price)
                .query(`
                    INSERT INTO OrderItems (
                        OrderID, ProductID, VariantID, Quantity, Price, RequestedVariantID
                    )
                    VALUES (
                        @OrderID, @ProductID, @VariantID, @Quantity, @Price, @RequestedVariantID
                    )
                `);
        }

        // 5. Fetch employee emails
        const employeeResult = await pool.request()
            .query(`SELECT email FROM Employees WHERE terminated = 0 AND email IS NOT NULL`);
        const employeeEmails = employeeResult.recordset.map(emp => emp.email);

        // 6. Fetch username and email
        const userResult = await pool.request()
            .input("userID", sql.Int, userID)
            .query(`SELECT username, email FROM Users WHERE userID = @userID`);
        const username = userResult.recordset[0]?.username || "A customer";
        const userEmail = userResult.recordset[0]?.email || null;

        // 7. Format items HTML
        const itemsHTML = items.map(item => `
            <tr>
                <td>${item.productName}</td>
                <td>${item.variantName || "Custom Request"}</td>
                <td>${item.quantity}</td>
                <td>₱${item.Price.toLocaleString()}</td>
                <td>₱${(item.Price * item.quantity).toLocaleString()}</td>
            </tr>
        `).join("");

        const emailHTML = `
            <h3>${username} placed a custom variant order</h3>
            <p><strong>Shipping Address:</strong><br>
            ${address.StreetAddress}, ${address.City}, ${address.StateProvince}, ${address.PostalCode}, ${address.Country}
            </p>
            <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>${itemsHTML}</tbody>
            </table>
            <p><strong>Total Items Price:</strong> ₱${totalAmount.toLocaleString()}</p>
            <p><strong>Shipping Charge:</strong> ₱${shippingCharge.toLocaleString()}</p>
            <p><strong>Final Price:</strong> ₱${finalPrice.toLocaleString()}</p>
        `;

        // 8. Send email to employees
        await transporter.sendMail({
            from: '"Edgi Custom Works" <edgicustomworks100@gmail.com>',
            to: employeeEmails.join(","),
            subject: `${username} placed a custom variant order`,
            html: `<h2>NEW CUSTOM VARIANT ORDER</h2>` + emailHTML
        });

        // 9. Send email to customer
        if (userEmail) {
            await transporter.sendMail({
                from: '"Edgi Custom Works" <edgicustomworks100@gmail.com>',
                to: userEmail,
                subject: `Your custom variant order (${orderID})`,
                html: `<h2>THANK YOU FOR YOUR CUSTOM ORDER AT EDGI Custom Works</h2>` + emailHTML
            });
        }

        res.status(200).json({ message: "Requested variant order placed successfully", orderID });

    } catch (error) {
        console.error("Error placing custom order:", error);
        res.status(500).json({ message: "Failed to place custom order", error: error.message });
    }
});



app.delete("/delete-cart-items", async (req, res) => {
    const { cartItemIDs } = req.body;
    try {
        const poolRequest = await pool;
        for (const cartID of cartItemIDs) {
            await poolRequest.request()
                .input("cartID", cartID)
                .query(`DELETE FROM Cart WHERE cartID = @cartID`);
        }
        res.json({ message: "Cart items deleted after checkout" });
    } catch (error) {
        console.error("Error deleting cart items:", error);
        res.status(500).json({ error: "Could not delete cart items" });
    }
});


// Get single model by ID with validation
app.get("/api/models/:id", async (req, res) => {
    const id = parseInt(req.params.id);
  
    if (isNaN(id)) {
      return res.status(400).json({ error: "Validation failed for parameter 'ModelID'. Invalid number." });
    }
  
    try {
      const pool = await poolConnect;
      const result = await pool
        .request()
        .input("ModelID", sql.Int, id)
        .query(`SELECT ModelID, ModelName, Description, Thumbnail, FileData, FileSize, UploadDate, LastModified 
                FROM Models WHERE ModelID = @ModelID`);
  
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: "Model not found" });
      }
  
      let model = result.recordset[0];
  
      model.Thumbnail = model.Thumbnail ? Buffer.from(model.Thumbnail).toString("base64") : null;
      model.FileData = model.FileData ? Buffer.from(model.FileData).toString("base64") : null;
  
      res.json(model);
    } catch (err) {
      console.error("Error in /api/models/:id:", err);
      res.status(500).json({ error: err.message });
    }
  });


/*

3D MODEL SERVER

*/

// GET: Fetch all models
app.get("/api/models", async (req, res) => {
    try {
      const pool = await poolConnect;
      const result = await pool
        .request()
        .query("SELECT ModelID, ModelName, Description, Thumbnail FROM Models");
  
      const models = result.recordset.map((model) => ({
        ...model,
        Thumbnail: model.Thumbnail ? Buffer.from(model.Thumbnail).toString("base64") : null,
      }));
  
      res.json(models);
    } catch (err) {
      console.error("Error in /api/models:", err);
      res.status(500).json({ error: err.message });
    }
  });
  
  
  // POST: Upload new model
  app.post("/api/models/upload", memoryUpload.fields([
    { name: "FileData", maxCount: 1 },
    { name: "Thumbnail", maxCount: 1 },
  ]), async (req, res) => {
    await poolConnect;
  
    const {
      ModelName,
      Description,
      FileSize,
      CreatedBy,
    } = req.body;
  
    const fileData = req.files?.FileData?.[0];
    const thumbnail = req.files?.Thumbnail?.[0];
  
    try {
      const request = pool.request()
        .input("ModelName", sql.NVarChar, ModelName)
        .input("Description", sql.NVarChar, Description)
        .input("FileData", sql.VarBinary(sql.MAX), fileData?.buffer || null)
        .input("FileSize", sql.Int, parseInt(FileSize))
        .input("Thumbnail", sql.VarBinary(sql.MAX), thumbnail?.buffer || null)
        .input("CreatedBy", sql.NVarChar, CreatedBy)
        .input("UploadDate", sql.DateTime, new Date());
  
      await request.query(`
        INSERT INTO Models (
          ModelName, Description, FileData, FileSize, Thumbnail,
          CreatedBy, UploadDate
        )
        VALUES (
          @ModelName, @Description, @FileData, @FileSize, @Thumbnail,
          @CreatedBy, @UploadDate
        )
      `);
  
      res.status(201).json({ message: "Model uploaded successfully" });
    } catch (err) {
      console.error("❌ Upload error:", err);
      res.status(500).json({ error: "Failed to upload model" });
    }
  });



app.get("/api/models/category/:categoryId", async (req, res) => {
    try {
        const pool = await poolConnect;
        const categoryId = req.params.categoryId;

        const result = await pool
            .request()
            .input("CategoryID", sql.Int, categoryId)
            .query(`
                SELECT ModelID, ModelName, Description, Thumbnail, FileData
                FROM Models
                WHERE CategoryID = @CategoryID
            `);

        const models = result.recordset.map((model) => ({
            ...model,
            Thumbnail: model.Thumbnail ? Buffer.from(model.Thumbnail).toString("base64") : null,
            FileData: model.FileData ? Buffer.from(model.FileData).toString("base64") : null,
        }));

        res.json(models);
    } catch (err) {
        console.error("Error in /api/models/category/:categoryId:", err);
        res.status(500).json({ error: err.message });
    }
});
  
  
// PUT: Update a model
app.put("/api/models/:id", upload.fields([
    { name: "FileData", maxCount: 1 },
    { name: "Thumbnail", maxCount: 1 },
  ]), async (req, res) => {
    await poolConnect;
    const modelID = req.params.id;
    const {
      ModelName,
      Description,
      FileSize,
      CreatedBy
    } = req.body;
  
    const fileData = req.files?.FileData?.[0];
    const thumbnail = req.files?.Thumbnail?.[0];
  
    try {
      const request = pool.request()
        .input("ModelID", modelID)
        .input("ModelName", ModelName)
        .input("Description", Description)
        .input("FileSize", parseInt(FileSize))
        .input("LastModified", new Date());
  
      if (fileData) request.input("FileData", fileData.buffer);
      if (thumbnail) request.input("Thumbnail", thumbnail.buffer);
  
      let updateQuery = `
        UPDATE Models
        SET ModelName = @ModelName,
            Description = @Description,
            FileSize = @FileSize,
            LastModified = @LastModified
      `;
  
      if (fileData) updateQuery += `, FileData = @FileData`;
      if (thumbnail) updateQuery += `, Thumbnail = @Thumbnail`;
  
      updateQuery += ` WHERE ModelID = @ModelID`;
  
      await request.query(updateQuery);
  
      res.json({ message: "Model updated successfully" });
    } catch (err) {
      console.error("❌ Update error:", err);
      res.status(500).json({ error: "Failed to update model" });
    }
  });
  
  
  
// DELETE: Remove a model
app.delete("/api/models/:id", async (req, res) => {
    await poolConnect;
    const modelID = req.params.id;
  
    try {
      await pool.request()
        .input("ModelID", modelID)
        .query("DELETE FROM Models WHERE ModelID = @ModelID");
  
      res.json({ message: "Model deleted successfully" });
    } catch (err) {
      console.error("❌ Delete error:", err);
      res.status(500).json({ error: "Failed to delete model" });
    }
  });
  

/*

ADMIN SIDE

*/



// --- Endpoint 1: Initial Employee Login (Username/Password) ---
app.post("/employee-login", loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
    }

    try {
        const request = pool.request();
        request.input("username", sql.VarChar, username);

        const result = await request.query("SELECT employeeId, password, email, terminated FROM [dbo].[Employees] WHERE username = @username");

        if (result.recordset.length === 0) {
            console.log(`Login attempt for ${username}: Employee not found.`);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.recordset[0];
        console.log(`Login attempt for ${username}. DB terminated status: ${user.terminated}`);

        if (user.terminated === true || user.terminated === 1) {
            console.warn(`Blocked login for terminated employee: ${username} (at employee-login stage).`);
            return res.status(403).json({ error: "Your account is terminated. Please contact administration." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.log(`Login attempt for ${username}: Incorrect password.`);
            return res.status(401).json({ error: "You have entered an incorrect username or password." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[username] = { otp, expiresAt: Date.now() + 300000 };

        console.log(`Generated OTP for ${username}: ${otp}`);

        await transporter.sendMail({
            from: "your-email@gmail.com",
            to: user.email,
            subject: "Employee Login OTP",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
                    <h2 style="color: #333;">Verify your login</h2>
                    <p style="font-size: 16px; color: #666;"><strong>Hello, Employee</strong></p>
                    <p style="font-size: 14px; color: #666;">Please use the following One Time Password (OTP)</p>
                    <p style="font-size: 32px; font-weight: bold; color: darkred; letter-spacing: 5px;">${otp}</p>
                    <p style="font-size: 14px; color: #666;">This OTP is valid for the next <strong>5 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666;">
                        If you did not request this email, please contact the administrator at 
                        <a href="mailto:edgicustomworks100@gmail.com" style="color: purple; text-decoration: none;">edgicustomworks100@gmail.com</a>
                    </p>
                </div>
            `
        });

        res.json({ otpRequired: true, username });

    } catch (error) {
        console.error("❌ Employee Login Error:", error);
        res.status(500).json({ error: "Server error while logging in" });
    }
});

// --- Endpoint 2: Verify Employee OTP and Generate Token ---
app.post("/verify-employee-otp", verifyOtpLimiter, async (req, res) => {
    const { username, otp } = req.body;

    if (!username || !otp) {
        return res.status(400).json({ error: "Username and OTP are required." });
    }

    if (!otpStore[username] || otpStore[username].otp !== otp || Date.now() > otpStore[username].expiresAt) {
        console.log(`OTP verification failed for ${username}: Invalid or expired OTP.`);
        return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    delete otpStore[username];

    try {
        const request = pool.request();
        request.input("username", sql.VarChar, username);

        const employeeResult = await request
            .query("SELECT employeeId, roleId, tokenVersion FROM [dbo].[Employees] WHERE username = @username");

        if (employeeResult.recordset.length === 0) {
            console.log(`OTP verification for ${username}: Employee not found.`);
            return res.status(400).json({ error: "Employee not found" });
        }

        const employee = employeeResult.recordset[0];

        let permissions = [];
        if (employee.roleId === 1) {
            try {
                const allPermissionsResult = await pool.request()
                    .query(`SELECT PermissionName FROM [dbo].[Permissions];`);
                permissions = allPermissionsResult.recordset.map(row => row.PermissionName);
            } catch (err) {
                console.error("Error fetching all permissions for Admin during OTP verification:", err);
            }
        } else {
            try {
                const permissionsResult = await pool.request()
                    .input("employeeId", sql.Int, employee.employeeId)
                    .query(`
                        SELECT p.PermissionName
                        FROM [dbo].[EmployeePermissions] ep
                        INNER JOIN [dbo].[Permissions] p ON ep.PermissionID = p.PermissionID
                        WHERE ep.EmployeeID = @employeeId;
                    `);
                permissions = permissionsResult.recordset.map(row => row.PermissionName);
            } catch (err) {
                console.error("Error fetching employee permissions during OTP verification:", err);
            }
        }

        const token = jwt.sign(
            {
                employeeId: employee.employeeId,
                roleId: employee.roleId,
                username: username,
                tokenVersion: employee.tokenVersion,
                permissions: permissions
            },
            secretKey,
            // { expiresIn: "1h" }
        );

        console.log(`Successfully generated token for ${username}.`);
        res.json({ success: true, token, message: "OTP Verified! Logging in..." });
    } catch (err) {
        console.error('Error in /verify-employee-otp:', err);
        res.status(500).json({ message: 'Server error during OTP verification.' });
    }
});

// --- Endpoint 3: Get Employee Status (Called by frontend navigation) ---
app.get('/api/employee/status', authenticateToken, async (req, res) => {
    const employeeId = req.employee?.employeeId;

    if (!employeeId) {
        console.error('Logic error: authMiddleware passed, but employeeId is missing from req.employee.');
        return res.status(500).json({ message: 'Server error: Employee ID missing after authentication.' });
    }

    try {
        const request = pool.request();
        request.input('employeeId', sql.Int, employeeId);

        const result = await request.query(`
            SELECT terminated
            FROM [dbo].[Employees]
            WHERE employeeId = @employeeId;
        `);

        if (result.recordset.length === 0) {
            console.warn(`Employee ID ${employeeId} not found in DB during status check.`);
            return res.status(404).json({ message: 'Employee account not found.' });
        }

        const employee = result.recordset[0];
        
        console.log(`Backend: Status check for employee ID ${employeeId}.`);
        console.log(`Backend: Raw 'terminated' value from DB:`, employee.terminated);
        console.log(`Backend: Type of 'terminated' value:`, typeof employee.terminated);

        if (employee.terminated === true || employee.terminated === 1) {
            console.log(`Backend sending status: terminated for employee ID ${employeeId}.`);
            return res.json({ status: 'terminated' });
        } else {
            console.log(`Backend sending status: active for employee ID ${employeeId}.`);
            return res.json({ status: 'active' });
        }

    } catch (err) {
        console.error(`Error fetching employee status for ID ${employeeId}:`, err);
        res.status(500).json({ message: 'Server error while checking employee status.' });
    }
});


// Audit Trail Code
const logAudit = async ({ employeeId, username, action, tableName, recordId, details }) => {
    await pool.request()
        .input("EmployeeID", sql.Int, employeeId)
        .input("Username", sql.NVarChar, username)
        .input("Action", sql.NVarChar, action)
        .input("TableName", sql.NVarChar, tableName)
        .input("RecordID", sql.Int, recordId)
        .input("Details", sql.NVarChar(sql.MAX), details)
        .input("ActionTime", sql.DateTime, new Date())
        .query(`
            INSERT INTO EmployeeAuditTrail (EmployeeID, Username, Action, TableName, RecordID, Details, ActionTime)
            VALUES (@EmployeeID, @Username, @Action, @TableName, @RecordID, @Details, @ActionTime)
        `);
};


/*

EMPLOYEE PROFILE SERVER

*/

app.get("/api/employees/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  try {
    const request = pool.request();
    request.input("employeeId", sql.Int, employeeId);

    // Fetch employee details from the correct schema
    const employeeResult = await request.query(`
            SELECT employeeId, firstName, lastName, email, phone, hireDate, terminated, username, Address, roleId
            FROM [dbo].[Employees]
            WHERE employeeId = @employeeId
        `);

    if (employeeResult.recordset.length === 0) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const employee = employeeResult.recordset[0];

    // If the employee is an Admin (roleId = 1), they have all permissions
    if (employee.roleId === 1) {

      employee.permissions = ["Access to All"]; // This will be displayed as "Access to All"
    } else {
      // Fetch specific permissions for non-admin roles
      const permissionsResult = await pool.request()
        .input('employeeId', sql.Int, employeeId)
        .query(`
                    SELECT P.PermissionName
                    FROM EmployeePermissions EP
                    JOIN Permissions P ON EP.PermissionID = P.PermissionID
                    WHERE EP.EmployeeID = @employeeId;
                `);
      employee.permissions = permissionsResult.recordset.map(p => p.PermissionName);
    }

    res.json(employee);
  } catch (error) {
    console.error("Error fetching employee profile:", error);
    res.status(500).json({ message: "Server error while fetching profile." });
  }
});

// Endpoint to update an employee's profile
app.put("/api/employees/:employeeId", authenticateToken, async (req, res) => {
    const { employeeId } = req.params;
    const tokenEmployeeId = req.employee.employeeId; 
    const { firstName, lastName, email, phone, Address } = req.body;

    if (parseInt(employeeId) !== tokenEmployeeId && req.employee.roleId !== 1) { 
        return res.status(403).json({ message: "Forbidden: You can only update your own profile." });
    }

    if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required." });
    }

    try {
        const request = pool.request();
        request.input("employeeId", sql.Int, employeeId);
        request.input("firstName", sql.NVarChar, firstName);
        request.input("lastName", sql.NVarChar, lastName);
        request.input("email", sql.NVarChar, email);
        request.input("phone", sql.NVarChar, phone);
        request.input("Address", sql.NVarChar, Address);

        const result = await request.query(`
            UPDATE [dbo].[Employees]
            SET firstName = @firstName,
                lastName = @lastName,
                email = @email,
                phone = @phone,
                Address = @Address
            WHERE employeeId = @employeeId;

            SELECT employeeId, firstName, lastName, email, phone, hireDate, terminated, username, Address, roleId
            FROM [dbo].[Employees]
            WHERE employeeId = @employeeId;
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Employee not found after update." });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Error updating employee profile:", error);
        res.status(500).json({ message: "Server error while updating profile." });
    }
});

// New endpoint for changing password after OTP verification
app.post("/api/employee/change-password", authenticateToken, async (req, res) => {
    const { employeeId, username, currentPassword, newPassword, otp } = req.body;
    const tokenEmployeeId = req.employee.employeeId; 
    const tokenUsername = req.employee.username;

    if (parseInt(employeeId) !== tokenEmployeeId || username !== tokenUsername) {
        return res.status(403).json({ error: "Forbidden: You can only change your own password." });
    }

    if (!username || !currentPassword || !newPassword || !otp) {
        return res.status(400).json({ error: "Username, current password, new password, and OTP are required." });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    try {
        const request = pool.request();
        request.input("username", sql.VarChar, username);
        const result = await request.query("SELECT employeeId, password, terminated FROM [dbo].[Employees] WHERE username = @username");

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Employee not found." });
        }

        const user = result.recordset[0];

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Incorrect current password." });
        }

        if (!otpStore[username] || otpStore[username].otp !== otp || Date.now() > otpStore[username].expiresAt) {
            console.log(`OTP verification failed for ${username} during password change: Invalid or expired OTP.`);
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        delete otpStore[username];

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const updateRequest = pool.request();
        updateRequest.input("employeeId", sql.Int, user.employeeId);
        updateRequest.input("newPassword", sql.VarChar, hashedNewPassword);

        await updateRequest.query("UPDATE [dbo].[Employees] SET password = @newPassword WHERE employeeId = @employeeId");

        res.json({ message: "Password changed successfully!" });

    } catch (error) {
        console.error("Error changing employee password:", error);
        res.status(500).json({ error: "Server error while changing password." });
    }
});


/*

INVENTORY SERVER

*/
// Inventory Endpoint
app.get("/inventory", async (req, res) => {
    await poolConnect;
    try {
        const { status, sortColumn, sortDirection } = req.query; // Get status, sortColumn, sortDirection from query parameters

        let statusFilter = '';
        if (status === 'active') {
            statusFilter = 'WHERE p.IsArchived = 0';
        } else if (status === 'archived') {
            statusFilter = 'WHERE p.IsArchived = 1';
        }
        // If status is not provided or is 'all', no filter is applied

        // Define allowed sortable columns to prevent SQL injection
        const allowedSortColumns = [
            'ProductName',
            'CategoryName', // Allow sorting by CategoryName
            'MinPrice',
            'TotalQuantity',
            'Availability'
        ];

        let orderByClause = '';
        // Only apply sorting if sortColumn is provided and is an allowed column
        if (sortColumn && allowedSortColumns.includes(sortColumn)) {
            const direction = (sortDirection && sortDirection.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
            orderByClause = `ORDER BY ${sortColumn} ${direction}`;
        } else {
            // Default sorting if no valid sortColumn is provided
            orderByClause = `ORDER BY p.ProductName ASC`;
        }

        const result = await pool.request().query(`
            SELECT
                p.ProductID,
                p.ProductName,
                p.Description,
                c.CategoryName,
                c.CategoryID, -- It's good practice to select CategoryID if you're filtering by it
                COALESCE(MIN(v.Price), 0) AS MinPrice,
                COALESCE(MAX(v.Price), 0) AS MaxPrice,
                COALESCE(SUM(v.Quantity), 0) AS TotalQuantity,
                COALESCE(MIN(v.ThresholdValue), 0) AS MinThreshold,
                p.Image,
                p.IsArchived,
                COUNT(v.VariantID) AS NumberOfVariants,
                CASE
                    WHEN SUM(v.Quantity) IS NULL THEN 'No variants'
                    WHEN SUM(v.Quantity) = 0 THEN 'Out of stock'
                    WHEN SUM(v.Quantity) <= MIN(v.ThresholdValue) THEN 'Low stock'
                    ELSE 'In stock'
                END AS Availability
            FROM Products p
            LEFT JOIN ProductVariants v ON p.ProductID = v.ProductID
            INNER JOIN Categories c ON p.CategoryID = c.CategoryID
            ${statusFilter}
            GROUP BY p.ProductID, p.ProductName, p.Description, c.CategoryName, c.CategoryID, p.Image, p.IsArchived
            ${orderByClause};
        `);

        // Convert image blobs to base64 for each product
        const inventoryWithImages = result.recordset.map(product => {
            const imageBuffer = product.Image;
            const base64Image = imageBuffer ? `data:image/jpeg;base64,${imageBuffer.toString("base64")}` : null;
            return {
                ...product,
                Image: base64Image,
            };
        });

        res.json(inventoryWithImages);
    } catch (error) {
        console.error("❌ Backend Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});


// Archive Product Endpoint
app.put("/archive-product/:productId", async (req, res) => {
    await poolConnect;
    const { productId } = req.params;
    const { archiveStatus } = req.body; // Expecting true/false or 1/0

    if (archiveStatus === undefined || typeof archiveStatus !== 'boolean') {
        return res.status(400).json({ error: "Invalid archiveStatus provided. Must be true or false." });
    }

    // Decode JWT from headers for auditing
    const token = req.headers.authorization?.split(" ")[1];
    let decoded;
    try {
        decoded = jwt.decode(token);
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
    const username = decoded?.username || "Unknown";
    const employeeId = decoded?.employeeId || null;

    let productName = "Unknown Product"; 

    try {
        
        const productQuery = await pool.request()
            .input("ProductID", sql.Int, productId)
            .query(`SELECT ProductName FROM Products WHERE ProductID = @ProductID`);

        if (productQuery.recordset.length > 0) {
            productName = productQuery.recordset[0].ProductName;
        } else {
            
            return res.status(404).json({ error: "Product not found." });
        }
        

        const result = await pool.request()
            .input("ProductID", sql.Int, productId)
            .input("IsArchived", sql.Bit, archiveStatus)
            .query(`
                UPDATE Products
                SET IsArchived = @IsArchived
                WHERE ProductID = @ProductID;
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(400).json({ error: "Product status could not be changed (might already be in desired state)." });
        }
        

        // Audit product archive/unarchive
        const actionType = archiveStatus ? "Archive" : "Unarchive";
        await logAudit({
            employeeId,
            username,
            action: actionType,
            tableName: "Products",
            recordId: productId, // Keep recordId as ProductID for database linking
            details: `Product: "${productName}" - Status changed to ${archiveStatus ? 'Archived' : 'Active'}` // --- MODIFIED: Use product name here ---
        });

        res.json({ message: `Product "${productName}" ${actionType}d successfully.` }); // --- MODIFIED: Use product name in response ---
    } catch (error) {
        console.error(`❌ Error ${archiveStatus ? 'archiving' : 'unarchiving'} product:`, error);
        res.status(500).json({ error: "Server error" });
    }
});


// Add Product Endpoint
app.post("/add-product", upload.single("image"), async (req, res) => {
    await poolConnect;

    try {
        const { productName, categoryName, description } = req.body; // <--- ADDED 'description' here

        if (!productName || !categoryName) {
            return res.status(400).json({ error: "Missing required fields: productName or categoryName" });
        }

        // Decode JWT from headers
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.decode(token);
        const username = decoded?.username || "Unknown";
        const employeeId = decoded?.employeeId || null;

        // Resolve CategoryID using CategoryName
        const categoryQuery = await pool.request()
            .input("CategoryName", sql.NVarChar, categoryName)
            .query(`SELECT CategoryID FROM Categories WHERE CategoryName = @CategoryName`);

        if (categoryQuery.recordset.length === 0) {
            return res.status(400).json({ error: "Category not found" });
        }

        const categoryId = categoryQuery.recordset[0].CategoryID;

        const imagePath = req.file ? path.resolve(req.file.path).replace(/\\/g, "/") : null;

        const productResult = await pool.request()
            .input("ProductName", sql.NVarChar, productName)
            .input("CategoryID", sql.Int, categoryId)
            .input("Description", sql.NVarChar, description || null) // <--- ADDED input for Description
            .query(`
                INSERT INTO Products (ProductName, CategoryID, Image, Description)
                OUTPUT INSERTED.ProductID
                VALUES (@ProductName, @CategoryID,
                    ${imagePath ? `(SELECT * FROM OPENROWSET(BULK '${imagePath}', SINGLE_BLOB) AS ImageFile)` : 'NULL'},
                    @Description)
            `);

        const productId = productResult.recordset[0].ProductID;

        // Audit product creation
        await logAudit({
            employeeId,
            username,
            action: "Add",
            tableName: "Products",
            recordId: productId,
            details: `Product: ${productName}, Category: ${categoryName}, Description: ${description || 'N/A'}`
        });

        const variants = JSON.parse(req.body.variants || "[]");

        for (let variant of variants) {
            const variantResult = await pool.request()
                .input("ProductID", sql.Int, productId)
                .input("VariantName", sql.NVarChar, variant.variantName || "Default")
                .input("Price", sql.Decimal(10, 2), variant.price || 0)
                .query(`
                    INSERT INTO ProductVariants (ProductID, VariantName, Price, AvailabilityID)
                    OUTPUT INSERTED.VariantID
                    VALUES (@ProductID, @VariantName, @Price, 1)
                `);

            const variantId = variantResult.recordset[0].VariantID;

            // Audit variant creation
            await logAudit({
                employeeId,
                username,
                action: "Add",
                tableName: "ProductVariants",
                recordId: variantId,
                details: `Variant: ${variant.variantName}, Price: ${variant.price}`
            });
        }

        res.json({ message: "✅ Product and variants added successfully!" });
    } catch (error) {
        console.error("❌ Error adding product:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// DELETE and TRANSFER PRODUCT
app.delete("/delete-product/:productId", async (req, res) => {
    // Get the productId from the URL parameters
    const { productId } = req.params;
    // Get the username from the request body for audit logging
    const { username } = req.body;

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Check for a valid and un-terminated employee
        const employeeResult = await transaction
            .request()
            .input("Username", sql.NVarChar, username)
            .query("SELECT EmployeeID FROM Employees WHERE Username = @Username AND Terminated = 0");

        if (employeeResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(403).json({ message: "Invalid employee or unauthorized." });
        }

        const employeeId = employeeResult.recordset[0].EmployeeID;

        // Get product and variants for logging before deletion
        const productResult = await transaction
            .request()
            .input("ProductID", sql.Int, productId)
            .query("SELECT * FROM Products WHERE ProductID = @ProductID");

        if (productResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: "Product not found." });
        }

        // --- Core Logic: Transfer the Product ---
        // 1. Insert the product record into the DeleteProducts table
        await transaction
            .request()
            .input("ProductID", sql.Int, productId)
            .query(`
                INSERT INTO DeleteProducts (ProductID, ProductName, CategoryID, BasePrice, Image, Description, IsArchived, RequestGuide)
                SELECT ProductID, ProductName, CategoryID, BasePrice, Image, Description, IsArchived, RequestGuide
                FROM Products
                WHERE ProductID = @ProductID;
            `);

        // 2. Delete the product from the original Products table
        await transaction
            .request()
            .input("ProductID", sql.Int, productId)
            .query("DELETE FROM Products WHERE ProductID = @ProductID");

        // Commit the transaction to save all changes
        await transaction.commit();

        // Log the deletion to the audit table
        const productDetails = `Product: ${productResult.recordset[0].ProductName}`;
        await logAudit({
            employeeId,
            username,
            action: "Delete and Transfer",
            tableName: "Products",
            recordId: productId,
            details: productDetails,
        });

        res.status(200).json({ message: "Product deleted and transferred successfully." });
    } catch (error) {
        // Rollback the transaction on error
        await transaction.rollback();
        console.error("Error deleting and transferring product:", error);
        res.status(500).json({ message: "Server error deleting product." });
    }
});



//INVENTORY DETAILS
app.get("/inventory-details/:productId", async (req, res) => {
    await poolConnect;
    const { productId } = req.params;

    try {
        const productDetailsResult = await pool.request()
            .input("ProductID", sql.Int, productId)
            .query(`
                SELECT
                    p.ProductID,
                    p.ProductName,
                    c.CategoryID,
                    c.CategoryName,
                    p.Image,
                    p.Description,
                    p.IsArchived,
                    p.RequestGuide,
                    MIN(v.Price) AS MinPrice,
                    MAX(v.Price) AS MaxPrice
                FROM Products p
                INNER JOIN Categories c ON p.CategoryID = c.CategoryID
                LEFT JOIN ProductVariants v ON p.ProductID = v.ProductID
                WHERE p.ProductID = @ProductID
                GROUP BY
                    p.ProductID, p.ProductName, c.CategoryID, c.CategoryName, p.Image, p.Description, p.IsArchived, p.RequestGuide;
            `);

        if (productDetailsResult.recordset.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }

        const productData = productDetailsResult.recordset[0];

        // --- Fetch total sales for the product ---
        const productSalesResult = await pool.request()
            .input("ProductID", sql.Int, productId)
            .query(`
                SELECT
                    SUM(oi.Quantity * oi.Price) AS TotalProductSalesAmount,
                    SUM(oi.Quantity) AS TotalProductSalesQuantity
                FROM OrderItems oi
                INNER JOIN Orders o ON oi.OrderID = o.OrderID
                WHERE oi.ProductID = @ProductID AND o.OrderStatus = 'Completed'; -- Only count completed orders
            `);

        const totalProductSales = productSalesResult.recordset[0] || { TotalProductSalesAmount: 0, TotalProductSalesQuantity: 0 };


        // Fetch all variants for the product
        const variantsResult = await pool.request()
            .input("ProductID", sql.Int, productId)
            .query(`
                SELECT
                    v.VariantID,
                    v.VariantName,
                    v.Price,
                    v.Quantity,
                    v.ThresholdValue,
                    CASE
                        WHEN v.Quantity = 0 THEN 'Out of stock'
                        WHEN v.Quantity <= v.ThresholdValue THEN 'Low stock'
                        ELSE 'In stock'
                    END AS Availability
                FROM ProductVariants v
                WHERE v.ProductID = @ProductID;
            `);

        // --- Fetch sales for each variant ---
        const variantsWithSales = await Promise.all(variantsResult.recordset.map(async (variant) => {
            const variantSalesResult = await pool.request()
                .input("VariantID", sql.Int, variant.VariantID)
                .query(`
                    SELECT
                        SUM(oi.Quantity * oi.Price) AS TotalVariantSalesAmount,
                        SUM(oi.Quantity) AS TotalVariantSalesQuantity
                    FROM OrderItems oi
                    INNER JOIN Orders o ON oi.OrderID = o.OrderID
                    WHERE oi.VariantID = @VariantID AND o.OrderStatus = 'Completed'; -- Only count completed orders
                `);
            const salesData = variantSalesResult.recordset[0] || { TotalVariantSalesAmount: 0, TotalVariantSalesQuantity: 0 };
            return {
                ...variant,
                TotalVariantSalesAmount: salesData.TotalVariantSalesAmount,
                TotalVariantSalesQuantity: salesData.TotalVariantSalesQuantity
            };
        }));


        // Convert image blob to base64
        const imageBuffer = productData.Image;
        const base64Image = imageBuffer ? `data:image/jpeg;base64,${imageBuffer.toString("base64")}` : null;

        const responseData = {
            ...productData,
            Image: base64Image,
            TotalProductSalesAmount: totalProductSales.TotalProductSalesAmount,
            TotalProductSalesQuantity: totalProductSales.TotalProductSalesQuantity,
            Variants: variantsWithSales // Attach variants with their sales data
        };

        res.json(responseData);

    } catch (error) {
        console.error("❌ Backend Error (inventory-details):", error);
        res.status(500).json({ error: "Server error" });
    }
});


// Update Product - Added description and IsArchived
app.put("/update-product/:id", upload.single("image"), async (req, res) => {
    await poolConnect;
    const { productName, categoryId, description, isArchived, requestGuide, username } = req.body;
    const productId = req.params.id;
    const imageFile = req.file;

    try {
        // Fetch category information by CategoryID
        const categoryResult = await pool
            .request()
            .input("categoryId", sql.Int, categoryId)
            .query("SELECT CategoryName FROM Categories WHERE CategoryID = @categoryId");

        if (categoryResult.recordset.length === 0) {
            return res.status(400).json({ error: "Category does not exist!" });
        }

        const categoryName = categoryResult.recordset[0].CategoryName;
        const parsedIsArchived = isArchived === 'true' ? 1 : 0; // Convert string to bit

        // Get old product data to compare with the updated data
        const getOldData = await pool
            .request()
            .input("productId", sql.Int, productId)
            .query(`
                SELECT
                    p.ProductName,
                    p.CategoryID,
                    c.CategoryName,
                    p.Description, -- Fetch old description
                    p.RequestGuide, -- Fetch old RequestGuide
                    p.IsArchived   -- Fetch old IsArchived status
                FROM Products p
                INNER JOIN Categories c ON p.CategoryID = c.CategoryID
                WHERE p.ProductID = @productId
            `);

        const oldData = getOldData.recordset[0];
        if (!oldData) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Prepare query to update the product
        const request = pool
            .request()
            .input("productId", sql.Int, productId)
            .input("productName", sql.NVarChar, productName)
            .input("categoryId", sql.Int, categoryId)
            .input("description", sql.NVarChar, description) 
            .input("requestGuide", sql.NVarChar, requestGuide || null)
            .input("isArchived", sql.Bit, parsedIsArchived);

        let updateQuery = `
            UPDATE Products
            SET
                ProductName = @productName,
                CategoryID = @categoryId,
                Description = @description,
                RequestGuide = @requestGuide,
                IsArchived = @isArchived
        `;

        if (imageFile) {
            request.input("image", sql.VarBinary(sql.MAX), imageFile.buffer);
            updateQuery += `, Image = @image`;
        }

        updateQuery += ` WHERE ProductID = @productId`;
        await request.query(updateQuery);

        // Get EmployeeID from username
        const employeeResult = await pool
            .request()
            .input("Username", sql.NVarChar, username)
            .query("SELECT EmployeeID FROM Employees WHERE Username = @Username AND Terminated = 0");

        const employeeId = employeeResult.recordset.length > 0 ? employeeResult.recordset[0].EmployeeID : null;

        if (employeeId) {
            const detailChanges = [];

            // Log changes for product name
            if (oldData.ProductName !== productName) {
                detailChanges.push(`ProductName: '${oldData.ProductName}' → '${productName}'`);
            }

            // Log changes for category name
            if (oldData.CategoryID !== parseInt(categoryId)) {
                detailChanges.push(`Category: '${oldData.CategoryName}' → '${categoryName}'`);
            }

            // Log changes for description
            if (oldData.Description !== description) {
                detailChanges.push(`Description: '${oldData.Description || '[empty]'}' → '${description || '[empty]'}'`);
            }

            // Log changes for requestGuide
            if (oldData.RequestGuide !== requestGuide) {
                detailChanges.push(`RequestGuide: '${oldData.RequestGuide || '[empty]'}' → '${requestGuide || '[empty]'}'`);
            }


            // Log changes for archive status
            if (oldData.IsArchived !== parsedIsArchived) {
                detailChanges.push(`Archived Status: '${oldData.IsArchived ? 'Archived' : 'Active'}' → '${parsedIsArchived ? 'Archived' : 'Active'}'`);
            }

            // Log changes for image
            if (imageFile) {
                detailChanges.push(`Image: [Updated]`);
            }

            // If there are any changes, log them to the audit trail
            if (detailChanges.length > 0) {
                await logAudit({
                    employeeId,
                    username,
                    action: "Update",
                    tableName: "Products",
                    recordId: productId,
                    details: detailChanges.join("; ")
                });
            }
        }

        res.json({ message: "✅ Product updated and logged successfully!" });
    } catch (error) {
        console.error("❌ Error updating product:", error);
        res.status(500).json({ error: "Error updating product!" });
    }
});


// Add the getEmployeeId function
const getEmployeeId = async (username) => {
    try {
        const result = await pool
            .request()
            .input("Username", sql.NVarChar, username)
            .query("SELECT EmployeeID FROM Employees WHERE Username = @Username");

        if (result.recordset.length === 0) {
            throw new Error("Employee not found");
        }

        return result.recordset[0].EmployeeID;
    } catch (error) {
        console.error("Error fetching employee ID:", error);
        throw error;
    }
};

//Update Variant Information
app.put("/update-variant/:variantId", async (req, res) => {
    await poolConnect;
    const { variantId } = req.params;
    const { variantName, price, quantity, thresholdValue, username, availabilityId } = req.body;

    try {
        // Fetch the old variant data
        const oldVariant = await pool
            .request()
            .input("VariantID", sql.Int, variantId)
            .query("SELECT VariantName, Price, Quantity, ThresholdValue, AvailabilityID FROM ProductVariants WHERE VariantID = @VariantID");

        if (oldVariant.recordset.length === 0) {
            return res.status(404).json({ error: "Variant not found" });
        }

        const oldData = oldVariant.recordset[0];

        // Update the variant
        await pool.request()
            .input("VariantID", sql.Int, variantId)
            .input("VariantName", sql.NVarChar, variantName)
            .input("Price", sql.Decimal(10, 2), price)
            .input("Quantity", sql.Int, quantity)
            .input("ThresholdValue", sql.Int, thresholdValue)
            .input("AvailabilityID", sql.Int, availabilityId)
            .query(`
                UPDATE ProductVariants 
                SET VariantName = @VariantName,
                Price = @Price,
                Quantity = @Quantity,
                ThresholdValue = @ThresholdValue,
                AvailabilityID = 1
            WHERE VariantID = @VariantID;
            `);

        // Log the audit trail for the update
        const changes = [];
        if (oldData.VariantName !== variantName) {
            changes.push(`VariantName: '${oldData.VariantName}' → '${variantName}'`);
        }
        if (oldData.Price !== price) {
            changes.push(`Price: '${oldData.Price}' → '${price}'`);
        }
        if (oldData.Quantity !== quantity) {
            changes.push(`Quantity: '${oldData.Quantity}' → '${quantity}'`);
        }
        if (oldData.ThresholdValue !== thresholdValue) {
            changes.push(`ThresholdValue: '${oldData.ThresholdValue}' → '${thresholdValue}'`);
        }
        //if (oldData.AvailabilityID !== availabilityId) {
            //changes.push(`AvailabilityID: '${oldData.AvailabilityID}' → '${availabilityId}'`);
        //}

        if (changes.length > 0) {
            const employeeId = await getEmployeeId(username); // Fetch employee ID

            await logAudit({
                employeeId,
                username,
                action: "Update",
                tableName: "ProductVariants",
                recordId: variantId,
                details: changes.join("; ")
            });
        }

        res.json({ message: "✅ Variant updated and logged successfully" });
    } catch (error) {
        console.error("❌ Error updating variant:", error);
        res.status(500).json({ error: "Server error" });
    }
});





// Delete Variant
app.delete("/delete-variant/:variantId", async (req, res) => {
    await poolConnect;
    const { variantId } = req.params;
    const { username } = req.body; // Get the username from the body for logging

    try {
        // Fetch the variant data before deletion
        const variantData = await pool
            .request()
            .input("VariantID", sql.Int, variantId)
            .query("SELECT VariantName, Price, Quantity, ThresholdValue, AvailabilityID FROM ProductVariants WHERE VariantID = @VariantID");

        if (variantData.recordset.length === 0) {
            return res.status(404).json({ error: "Variant not found" });
        }

        const deletedVariant = variantData.recordset[0];

        // Delete the variant
        await pool.request()
            .input("VariantID", sql.Int, variantId)
            .query("DELETE FROM ProductVariants WHERE VariantID = @VariantID");

        // Log the audit trail for the delete
        await logAudit({
            employeeId: (await getEmployeeId(username)),
            username,
            action: "Delete",
            tableName: "ProductVariants",
            recordId: variantId,
            details: `Deleted variant: ${deletedVariant.VariantName}, Price: ${deletedVariant.Price}, Quantity: ${deletedVariant.Quantity}, ThresholdValue: ${deletedVariant.ThresholdValue}, AvailabilityID: ${deletedVariant.AvailabilityID}` // Use AvailabilityID here
        });

        res.json({ message: "✅ Variant deleted and logged successfully!" });
    } catch (error) {
        console.error("❌ Error deleting variant:", error);
        res.status(500).json({ error: "Server error" });
    }
});




app.post("/add-variant", async (req, res) => {
    const { productId, variantName, price, employeeId, username } = req.body;

    // Check if the required fields are provided
    if (!productId || !variantName || !price || !employeeId || !username) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const availabilityID = 1; // default value for "In Stock"
        const quantity = 0;
        const thresholdValue = 0;

        // Insert the new variant into the database
        const result = await pool
            .request()
            .input("ProductID", sql.Int, productId)
            .input("VariantName", sql.NVarChar, variantName)
            .input("Price", sql.Decimal(10, 2), price)

            .query(`
                INSERT INTO ProductVariants 
                    (ProductID, VariantName, Price) 
                OUTPUT INSERTED.VariantID
                VALUES (@ProductID, @VariantName, @Price)
            `);

        const variantId = result.recordset[0].VariantID;

        // Log the audit trail for the action
        const details = `Added new variant "${variantName}" with price ${price} to product ID ${productId}`;
        await logAudit({
            employeeId,
            username,
            action: "Add Variant",
            tableName: "ProductVariants",
            recordId: variantId,
            details
        });

        // Send the response back with the variant details
        res.status(201).json({
            VariantID: variantId,
            ProductID: productId,
            VariantName: variantName,
            Price: price,

        });
    } catch (error) {
        console.error("❌ Error adding variant:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});







/*

CATEGORY MANAGER SERVER

*/


//Fetch Categories
app.get("/categories", async (req, res) => {
    try {
        const result = await pool.request().query("SELECT * FROM Categories");
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Add New Category
app.post("/add-category", async (req, res) => {
    await poolConnect;
    const { categoryName, username } = req.body;

    try {
        const connection = await pool.connect();

        // Get employee info
        const employeeResult = await connection
            .request()
            .input("Username", sql.NVarChar, username)
            .query("SELECT EmployeeID FROM Employees WHERE Username = @Username AND Terminated = 0");

        if (employeeResult.recordset.length === 0) {
            return res.status(403).json({ message: "Invalid employee or unauthorized" });
        }

        const employeeId = employeeResult.recordset[0].EmployeeID;

        // Insert the category
        const result = await connection
            .request()
            .input("CategoryName", sql.NVarChar, categoryName)
            .query(`
                INSERT INTO Categories (CategoryName) 
                OUTPUT Inserted.CategoryID, Inserted.CategoryName 
                VALUES (@CategoryName)
            `);

        const newCategory = result.recordset[0];

        // Log audit
        await logAudit({
            employeeId,
            username,
            action: "Add",
            tableName: "Categories",
            recordId: newCategory.CategoryID,
            details: `Added category: ${newCategory.CategoryName}`,
        });

        res.json(newCategory);
    } catch (error) {
        console.error("❌ Error adding category:", error);
        res.status(500).json({ error: "Server error" });
    }
});


//Edit a Category Name
app.put("/edit-category/:id", async (req, res) => {
    const categoryId = req.params.id;
    const { categoryName, username } = req.body;

    if (!categoryName) {
        return res.status(400).json({ message: "Category name cannot be empty." });
    }

    try {
        const connection = await pool.connect();

        // Get employee info
        const employeeResult = await connection
            .request()
            .input("Username", sql.NVarChar, username)
            .query("SELECT EmployeeID FROM Employees WHERE Username = @Username AND Terminated = 0");

        if (employeeResult.recordset.length === 0) {
            return res.status(403).json({ message: "Invalid employee or unauthorized" });
        }

        const employeeId = employeeResult.recordset[0].EmployeeID;

        // Update category
        await connection
            .request()
            .input("categoryName", sql.NVarChar, categoryName)
            .input("categoryId", sql.Int, categoryId)
            .query("UPDATE Categories SET CategoryName = @categoryName WHERE CategoryID = @categoryId");

        // Log audit
        await logAudit({
            employeeId,
            username,
            action: "Edit",
            tableName: "Categories",
            recordId: categoryId,
            details: `Updated category name to "${categoryName}"`,
        });

        res.json({ message: "Category updated successfully!" });
    } catch (err) {
        console.error("Error updating category:", err);
        res.status(500).json({ message: "Failed to update category." });
    }
});


//Delete a Category
app.delete("/delete-category/:id", async (req, res) => {
    const categoryId = req.params.id;
    const { username } = req.body;

    try {
        const connection = await pool.connect();

        // Get employee info
        const employeeResult = await connection
            .request()
            .input("Username", sql.NVarChar, username)
            .query("SELECT EmployeeID FROM Employees WHERE Username = @Username AND Terminated = 0");

        if (employeeResult.recordset.length === 0) {
            return res.status(403).json({ message: "Invalid employee or unauthorized" });
        }

        const employeeId = employeeResult.recordset[0].EmployeeID;

        // Get current category name for logging
        const categoryResult = await connection
            .request()
            .input("categoryId", sql.Int, categoryId)
            .query("SELECT CategoryName FROM Categories WHERE CategoryID = @categoryId");

        if (categoryResult.recordset.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }

        const categoryName = categoryResult.recordset[0].CategoryName;

        // Delete category
        await connection
            .request()
            .input("categoryId", sql.Int, categoryId)
            .query("DELETE FROM Categories WHERE CategoryID = @categoryId");

        // Log audit
        await logAudit({
            employeeId,
            username,
            action: "Delete",
            tableName: "Categories",
            recordId: categoryId,
            details: `Deleted category: "${categoryName}"`,
        });

        res.json({ message: "Category deleted successfully!" });
    } catch (err) {
        console.error("Error deleting category:", err);
        res.status(500).json({ message: "Failed to delete category." });
    }
});




/* 

Notification bell

*/

app.get("/api/latest-orders", async (req, res) => {
    await poolConnect;
    try {
        const result = await pool.request().query(`
            SELECT TOP 5
                o.OrderID,
                u.first_name + ' ' + u.last_name AS FullName,
                o.OrderDate,
                o.TotalAmount,
                -- Get the first product name for the notification snippet
                STUFF((
                    SELECT ', ' + p.ProductName + ' (' + CONVERT(nvarchar(MAX), oi.Quantity) + ')'
                    FROM OrderItems oi
                    INNER JOIN Products p ON oi.ProductID = p.ProductID
                    WHERE oi.OrderID = o.OrderID
                    ORDER BY oi.OrderItemID
                    FOR XML PATH('')
                ), 1, 2, '') AS OrderItemsSummary
            FROM Orders o
            INNER JOIN Users u ON o.UserID = u.userId
            WHERE o.IsRead = 0 -- Assuming 'IsRead' column indicates unread orders
            ORDER BY o.OrderDate DESC;
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error fetching latest orders for notifications:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Endpoint to mark an order as read (Optional, but good for managing notifications)
app.post("/api/orders/:orderId/mark-as-read", async (req, res) => {
    const { orderId } = req.params;
    await poolConnect;
    try {
        await pool.request()
            .input('orderId', sql.Int, orderId)
            .query(`
                UPDATE Orders
                SET IsRead = 1
                WHERE OrderID = @orderId;
            `);
        res.status(200).json({ message: "Order marked as read." });
    } catch (error) {
        console.error("❌ Error marking order as read:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/*

ORDER MANAGEMENT SERVER

*/

//Orders List
app.get("/orders", async (req, res) => {
    const { status } = req.query; // Get status from query parameter
    await poolConnect;
    try {
        let query = `
            SELECT 
                o.OrderID, 
                u.first_name + ' ' + u.last_name AS FullName,
                u.email,
                a.StreetAddress,
                o.TotalAmount, 
                o.PaymentMethod, 
                o.OrderStatus, 
                o.OrderDate, 
                o.PayPalTransactionID,
                o.IsRead
            FROM Orders o
            INNER JOIN Users u ON o.UserID = u.userId
            INNER JOIN Addresses a ON o.AddressID = a.AddressID
        `;

        // Filter orders based on status
        if (status === "Cancelled") {
            query += ` WHERE o.OrderStatus = 'Cancelled'`;
        } else if (status && status !== "All Orders") {
            query += ` WHERE o.OrderStatus = '${status}'`;
        } else if (status === "All Orders") {
            query += ` WHERE o.OrderStatus != 'Cancelled'`; // Exclude cancelled orders
        }

        query += ` ORDER BY o.OrderDate DESC`;

        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error fetching orders:", error);
        res.status(500).json({ error: "Server error" });
    }
});


//Unread Order Count
app.get("/orders/unread-count", async (req, res) => {
    await poolConnect;
    try {
        const result = await pool.request()
            .query(`SELECT COUNT(*) AS UnreadCount FROM Orders WHERE IsRead = 0 AND OrderStatus != 'Cancelled'`);
        res.json({ unreadCount: result.recordset[0].UnreadCount });
    } catch (error) {
        console.error("❌ Error fetching unread count:", error);
        res.status(500).json({ error: "Server error" });
    }
});

//Mark Order as Read
app.put("/orders/:id/mark-read", async (req, res) => {
    const { id } = req.params;
    await poolConnect;
    try {
        await pool.request()
            .input("id", id)
            .query(`UPDATE Orders SET IsRead = 1 WHERE OrderID = @id`);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Failed to mark order as read:", error);
        res.status(500).json({ error: "Server error" });
    }
});




//Order Details
app.get("/order-details/:orderId", async (req, res) => {
    const { orderId } = req.params;
    await poolConnect;
    try {
        const result = await pool.request().query(`
            SELECT 
                o.OrderID,
                o.OrderDate,
                o.PaymentMethod,
                o.PayPalTransactionID,
                o.OrderStatus,
                o.VerifiedAt, 
                o.ShippingAt,       
                o.ReceivedAt,       
                o.CompletedAt,
                o.ShippingCharge,
                o.FinalPrice,    
                u.username,
                u.email,  
                u.first_name + ' ' + u.last_name AS FullName,
                a.Country,
                a.PhoneNumber,
                a.StreetAddress,
                a.City,
                a.StateProvince,
                a.PostalCode,
                a.AddressLine2,
                a.FullName AS AddressUsedBy,
                oi.OrderItemID,
                p.ProductName,
                -- If VariantID is null, use RequestedVariantName from RequestedVariant
                COALESCE(
                    v.VariantName,
                    '[CUSTOM] ' + rv.RequestedVariantName
                ) AS VariantName,
                oi.Quantity,
                oi.Price
            FROM OrderItems oi
            INNER JOIN Orders o ON oi.OrderID = o.OrderID
            INNER JOIN Users u ON o.UserID = u.userId
            INNER JOIN Addresses a ON o.AddressID = a.AddressID
            INNER JOIN Products p ON oi.ProductID = p.ProductID
            LEFT JOIN ProductVariants v ON oi.VariantID = v.VariantID
            LEFT JOIN RequestedVariant rv ON oi.RequestedVariantID = rv.RequestedVariantID
            WHERE o.OrderID = ${orderId}
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error fetching order details:", error);
        res.status(500).json({ error: "Server error" });
    }
});



app.put("/verify-order/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { employeeId, username } = req.body;
    await poolConnect;

    try {
        const transaction = pool.transaction();
        await transaction.begin();

        const orderItems = await transaction.request().query(`
            SELECT VariantID, Quantity 
            FROM OrderItems 
            WHERE OrderID = ${orderId}
        `);

        if (orderItems.recordset.length === 0) {
            return res.status(404).json({ success: false, message: "No order items found." });
        }

        for (const item of orderItems.recordset) {
            await transaction.request().query(`
                UPDATE ProductVariants 
                SET Quantity = Quantity - ${item.Quantity} 
                WHERE VariantID = ${item.VariantID} AND Quantity >= ${item.Quantity}
            `);
        }

        const updateOrder = await transaction.request().query(`
            UPDATE Orders 
            SET OrderStatus = 'Verified', VerifiedAt = GETDATE() 
            WHERE OrderID = ${orderId}
        `);

        if (updateOrder.rowsAffected[0] > 0) {
            // ✅ Fetch order, user, items, and address for email
            const result = await transaction.request().query(`
                SELECT 
                    u.username,
                    u.email,
                    a.StreetAddress, a.City, a.StateProvince, a.PostalCode, a.Country,
                    o.TotalAmount, o.ShippingCharge, o.FinalPrice,
                    p.ProductName, 
                    CASE
                        WHEN v.VariantName IS NULL THEN '[CUSTOM] ' + rv.RequestedVariantName
                        ELSE v.VariantName
                    END AS DisplayVariantName,
                    oi.Quantity,
                    oi.Price
                FROM Orders o
                JOIN Users u ON o.UserID = u.userId
                JOIN Addresses a ON o.AddressID = a.AddressID
                JOIN OrderItems oi ON oi.OrderID = o.OrderID
                JOIN Products p ON oi.ProductID = p.ProductID
                LEFT JOIN ProductVariants v ON oi.VariantID = v.VariantID
                LEFT JOIN RequestedVariant rv ON oi.RequestedVariantID = rv.RequestedVariantID
                WHERE o.OrderID = ${orderId}
            `);

            const data = result.recordset;
            const userEmail = data[0].email;
            const username = data[0].username;
            const address = data[0];
            const shippingCharge = data[0].ShippingCharge;
            const finalPrice = data[0].FinalPrice;
            const totalAmount = data[0].TotalAmount;

            const itemsHTML = data.map(item => `
                <tr>
                    <td>${item.ProductName}</td>
                    <td>${item.DisplayVariantName}</td>
                    <td>${item.Quantity}</td>
                    <td>₱${item.Price.toLocaleString()}</td>
                    <td>₱${(item.Price * item.Quantity).toLocaleString()}</td>
                </tr>
            `).join("");

            const emailHTML = `
                <h3>Hi ${username}, your order has been verified!</h3>
                <p><strong>Shipping Address:</strong><br>
                ${address.StreetAddress}, ${address.City}, ${address.StateProvince}, ${address.PostalCode}, ${address.Country}
                </p>
                <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Variant</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                <p><strong>Total Items Price:</strong> ₱${totalAmount.toLocaleString()}</p>
                <p><strong>Shipping Charge:</strong> ₱${shippingCharge.toLocaleString()}</p>
                <p><strong>Final Price:</strong> ₱${finalPrice.toLocaleString()}</p>
            `;

            // ✅ Send email to customer
            await transporter.sendMail({
                from: '"Edgi Custom Works" <edgicustomworks100@gmail.com>',
                to: userEmail,
                subject: "Your Order Has Been Verified",
                html: `<h2>ORDER UPDATE - VERIFIED</h2>` + emailHTML
            });

            // ✅ Audit Log
            const details = `Order ${orderId} has been verified and stock was updated.`;
            await logAudit({
                employeeId,
                username,
                action: "Verify Order",
                tableName: "Orders",
                recordId: parseInt(orderId),
                details
            });

            await transaction.commit();
            res.json({ success: true, message: "Order Verified, Stock Updated & Email Sent" });
        } else {
            await transaction.rollback();
            res.status(404).json({ success: false, message: "Order Not Found" });
        }
    } catch (error) {
        console.error("❌ Error verifying order and sending email:", error);
        res.status(500).json({ error: "Server error" });
    }
});



// Update ShippingAt timestamp
app.put("/start-shipping/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { employeeId, username } = req.body;
    const shippingAt = new Date();

    try {
        const transaction = await pool.request();

        // Update order status and shipping time
        await transaction.query(`
            UPDATE Orders 
            SET ShippingAt = '${shippingAt.toISOString()}', OrderStatus = 'Shipping' 
            WHERE OrderID = ${orderId}
        `);

        // Removed: Automatic insertion of 'Preparing to ship your parcel' tracking status
        // The tracking status should now be added manually via the /add-tracking endpoint.

        // ✅ Fetch order, user, items, and address for email
        const result = await transaction.query(`
            SELECT 
                u.username,
                u.email,
                a.StreetAddress, a.City, a.StateProvince, a.PostalCode, a.Country,
                o.TotalAmount, o.ShippingCharge, o.FinalPrice,
                p.ProductName, 
                CASE
                    WHEN v.VariantName IS NULL THEN '[CUSTOM] ' + rv.RequestedVariantName
                    ELSE v.VariantName
                END AS DisplayVariantName,
                oi.Quantity,
                oi.Price
            FROM Orders o
            JOIN Users u ON o.UserID = u.userId
            JOIN Addresses a ON o.AddressID = a.AddressID
            JOIN OrderItems oi ON oi.OrderID = o.OrderID
            JOIN Products p ON oi.ProductID = p.ProductID
            LEFT JOIN ProductVariants v ON oi.VariantID = v.VariantID
            LEFT JOIN RequestedVariant rv ON oi.RequestedVariantID = rv.RequestedVariantID
            WHERE o.OrderID = ${orderId}
        `);

        const data = result.recordset;
        const userEmail = data[0].email;
        const usernameCustomer = data[0].username;
        const address = data[0];
        const shippingCharge = data[0].ShippingCharge;
        const finalPrice = data[0].FinalPrice;
        const totalAmount = data[0].TotalAmount;

        const itemsHTML = data.map(item => `
            <tr>
                <td>${item.ProductName}</td>
                <td>${item.DisplayVariantName}</td>
                <td>${item.Quantity}</td>
                <td>₱${item.Price.toLocaleString()}</td>
                <td>₱${(item.Price * item.Quantity).toLocaleString()}</td>
            </tr>
        `).join("");

        const emailHTML = `
            <h3>Hi ${usernameCustomer}, your order is now being shipped!</h3>
            <p><strong>Shipping Address:</strong><br>
            ${address.StreetAddress}, ${address.City}, ${address.StateProvince}, ${address.PostalCode}, ${address.Country}
            </p>
            <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            <p><strong>Total Items Price:</strong> ₱${totalAmount.toLocaleString()}</p>
            <p><strong>Shipping Charge:</strong> ₱${shippingCharge.toLocaleString()}</p>
            <p><strong>Final Price:</strong> ₱${finalPrice.toLocaleString()}</p>
            <p><em>We'll update you as your parcel moves through our delivery network!</em></p>
        `;

        // ✅ Send email to customer
        await transporter.sendMail({
            from: '"Edgi Custom Works" <edgicustomworks100@gmail.com>',
            to: userEmail,
            subject: "Your Order Is Now Shipping!",
            html: `<h2>ORDER STATUS: SHIPPING ON PROCESS</h2>` + emailHTML
        });

        // ✅ Audit log
        const details = `Order ${orderId} marked as 'Shipping'.`;
        await logAudit({
            employeeId,
            username,
            action: "Start Shipping",
            tableName: "Orders",
            recordId: parseInt(orderId),
            details,
        });

        res.json({ success: true, shippingAt });
    } catch (err) {
        console.error("❌ Error starting shipping:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});




// Get tracking updates
app.get("/order-tracking/:orderId", async (req, res) => {
    const { orderId } = req.params;

    try {
        const result = await pool.request()
            .query(`SELECT * FROM OrderTracking WHERE OrderID = ${orderId} ORDER BY TimeStamp DESC`);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching tracking updates:", err);
        res.status(500).json({ error: err.message });
    }
});

// Add tracking update
app.post("/add-tracking/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { status, location, employeeId, username } = req.body;
    const timestamp = new Date();

    if (!status || !location || !employeeId || !username) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Insert tracking info
        await pool.request().query(`
            INSERT INTO OrderTracking (OrderID, TrackingStatus, Location, TimeStamp)
            VALUES (${orderId}, '${status}', '${location}', '${timestamp.toISOString()}')
        `);

        // Log audit
        const details = `Added tracking update '${status}' at '${location}' for order ${orderId}.`;
        await logAudit({
            employeeId,
            username,
            action: "Add Tracking Update",
            tableName: "OrderTracking",
            recordId: parseInt(orderId),
            details,
        });

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Error adding tracking update:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});


// Edit tracking update
app.put("/edit-tracking/:trackingId", async (req, res) => {
    const { trackingId } = req.params;
    const { status, location, employeeId, username } = req.body;

    if (!status || !location || !employeeId || !username) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Optionally fetch old values before update (optional for more detailed audit)
        // const oldData = await pool.request().query(`SELECT TrackingStatus, Location FROM OrderTracking WHERE TrackingID = ${trackingId}`);

        await pool.request().query(`
            UPDATE OrderTracking 
            SET TrackingStatus='${status}', Location='${location}' 
            WHERE TrackingID=${trackingId}
        `);

        const details = `Edited tracking update: Status='${status}', Location='${location}'`;

        await logAudit({
            employeeId,
            username,
            action: "Edit Tracking Update",
            tableName: "OrderTracking",
            recordId: parseInt(trackingId),
            details,
        });

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Error updating tracking:", err);
        res.status(500).json({ success: false });
    }
});


// Delete tracking update
app.delete("/delete-tracking/:trackingId", async (req, res) => {
    const { trackingId } = req.params;
    const { employeeId, username } = req.body;

    if (!employeeId || !username) {
        return res.status(400).json({ success: false, message: "Missing employee information for audit log." });
    }

    try {
        const result = await pool.request().query(`SELECT TrackingStatus, Location FROM OrderTracking WHERE TrackingID = ${trackingId}`);
        const existingTracking = result.recordset[0];

        await pool.request().query(`DELETE FROM OrderTracking WHERE TrackingID = ${trackingId}`);

        const details = existingTracking
            ? `Deleted tracking update: Status='${existingTracking.TrackingStatus}', Location='${existingTracking.Location}'`
            : `Deleted tracking update with ID ${trackingId}`;

        await logAudit({
            employeeId,
            username,
            action: "Delete Tracking Update",
            tableName: "OrderTracking",
            recordId: parseInt(trackingId),
            details,
        });

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Error deleting tracking:", err);
        res.status(500).json({ success: false });
    }
});




// Update Order Status
app.get("/predefined-statuses", async (req, res) => {
    try {
        const result = await pool.request().query("SELECT TrackingStatusID, TrackingStatus FROM PredefineTrackingStatus");
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching predefined statuses:", error);
        res.status(500).send("Server Error");
    }
});


// Update Order Status
app.get("/predefined-locations", async (req, res) => {
    try {
        const result = await pool.request().query("SELECT LocationID, Location FROM PredefineLocation");
        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching predefined locations:", error);
        res.status(500).send("Server Error");
    }
});

// Finish Order Tracking
app.post("/finish-order/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const timestamp = new Date().toISOString();
    const { employeeId, username } = req.body;

    if (!employeeId || !username) {
        return res.status(400).json({ success: false, message: "Missing employee information for audit log." });
    }

    try {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        // 1. Update order status to 'Received'
        const request1 = new sql.Request(transaction);
        await request1
            .input("OrderID", sql.Int, orderId)
            .input("OrderStatus", sql.VarChar, "Received")
            .input("ReceivedAt", sql.DateTime, timestamp)
            .query(`
                UPDATE Orders
                SET OrderStatus = @OrderStatus, ReceivedAt = @ReceivedAt
                WHERE OrderID = @OrderID
            `);

        // 2. Insert tracking update
        // (Assuming tracking insertion logic is handled elsewhere or intentionally omitted as per your original code)

        // 3. Fetch customer + order details for email
        const request3 = new sql.Request(transaction);
        const result = await request3.query(`
            SELECT 
                u.username,
                u.email,
                a.StreetAddress, a.City, a.StateProvince, a.PostalCode, a.Country,
                o.TotalAmount, o.ShippingCharge, o.FinalPrice,
                p.ProductName, 
                CASE
                    WHEN v.VariantName IS NULL THEN '[CUSTOM] ' + rv.RequestedVariantName
                    ELSE v.VariantName
                END AS DisplayVariantName,
                oi.Quantity,
                oi.Price
            FROM Orders o
            JOIN Users u ON o.UserID = u.userId
            JOIN Addresses a ON o.AddressID = a.AddressID
            JOIN OrderItems oi ON oi.OrderID = o.OrderID
            JOIN Products p ON oi.ProductID = p.ProductID
            LEFT JOIN ProductVariants v ON oi.VariantID = v.VariantID
            LEFT JOIN RequestedVariant rv ON oi.RequestedVariantID = rv.RequestedVariantID
            WHERE o.OrderID = ${orderId}
        `);

        const data = result.recordset;
        const userEmail = data[0].email;
        const usernameCustomer = data[0].username;
        const address = data[0];
        const shippingCharge = data[0].ShippingCharge;
        const finalPrice = data[0].FinalPrice;
        const totalAmount = data[0].TotalAmount;

        // Format order items into HTML
        const itemsHTML = data.map(item => `
            <tr>
                <td>${item.ProductName}</td>
                <td>${item.DisplayVariantName}</td>
                <td>${item.Quantity}</td>
                <td>₱${item.Price.toLocaleString()}</td>
                <td>₱${(item.Price * item.Quantity).toLocaleString()}</td>
            </tr>
        `).join("");

        const emailHTML = `
            <h3>Hi ${usernameCustomer}, your order has been marked as received!</h3>
            <p><strong>Shipping Address:</strong><br>
            ${address.StreetAddress}, ${address.City}, ${address.StateProvince}, ${address.PostalCode}, ${address.Country}
            </p>
            <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            <p><strong>Total Items Price:</strong> ₱${totalAmount.toLocaleString()}</p>
            <p><strong>Shipping Charge:</strong> ₱${shippingCharge.toLocaleString()}</p>
            <p><strong>Final Price:</strong> ₱${finalPrice.toLocaleString()}</p>
            <p><em>We hope you enjoyed shopping with Edgi Custom Works!</em></p>
        `;

        // 4. Send confirmation email to customer
        await transporter.sendMail({
            from: '"Edgi Custom Works" <edgicustomworks100@gmail.com>',
            to: userEmail,
            subject: "Order Received Confirmation - Thank You!",
            html: `<h2>ORDER SHIPPING COMPLETED</h2>` + emailHTML
        });

        // 5. Log audit trail
        const details = `Order ID ${orderId} has been updated to 'Received'. Tracking status set to 'Parcel is out for delivery'.`;
        await logAudit({
            employeeId,
            username,
            action: "Finish Order",
            tableName: "Orders",
            recordId: orderId,
            details,
        });

        await transaction.commit();
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error finishing order:", error);
        await transaction.rollback(); // Rollback in case of error
        res.status(500).json({ success: false, message: "Error finishing order." });
    }
});



/*

EMPLOYEE MANAGEMENT SERVER

*/
app.post('/hire', async (req, res) => {
    const {
      firstName,
      lastName,
      password,
      email,
      phone,
      username,
      address,
    } = req.body;
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const roleId = 3;
      const terminated = 0;
  
      const request = pool.request();
      await request
        .input('firstName', firstName)
        .input('lastName', lastName)
        .input('password', hashedPassword)
        .input('roleId', roleId)
        .input('email', email)
        .input('phone', phone)
        .input('terminated', terminated)
        .input('username', username)
        .input('address', address)
        .query(`
          INSERT INTO [dbo].[Employees]
          ([firstName], [lastName], [password], [roleId], [email], [phone], [hireDate], [terminated], [username], [Address])
          VALUES (@firstName, @lastName, @password, @roleId, @email, @phone, GETDATE(), @terminated, @username, @address)
        `);
  
      res.json({ message: 'Employee hired successfully' });
    } catch (err) {
      console.error('Error hiring employee:', err);
      res.status(500).json({ message: 'Failed to hire employee' });
    }
  });


app.post('/hire-validation', async (req, res) => {
    const { firstName, lastName, password, email, phone, username, address } = req.body;
  
    try {
      // Check if username or email exists in Users table
      const userCheck = await pool.request()
        .input('email', email)
        .input('username', username)
        .query(`
          SELECT * FROM Users
          WHERE email = @email OR username = @username
        `);
  
      if (userCheck.recordset.length > 0) {
        return res.status(400).json({ message: 'Username or Email already exists.' });
      }
  
      // Check if username or email exists in Employees table
      const employeeCheck = await pool.request()
        .input('email', email)
        .input('username', username)
        .query(`
          SELECT * FROM Employees
          WHERE email = @email OR username = @username
        `);
  
      if (employeeCheck.recordset.length > 0) {
        return res.status(400).json({ message: 'Username or Email already exists.' });
      }
  
      // If both checks pass, insert the new employee
      await pool.request()
        .input('firstName', firstName)
        .input('lastName', lastName)
        .input('password', password)
        .input('email', email)
        .input('phone', phone)
        .input('username', username)
        .input('address', address)
        .query(`
          INSERT INTO Employees (firstName, lastName, password, roleId, email, phone, hireDate, terminated, username, Address)
          VALUES (@firstName, @lastName, @password, 2, @email, @phone, GETDATE(), 0, @username, @address)
        `);
  
      res.status(200).json({ message: 'Employee hired successfully.' });
  
    } catch (err) {
      console.error('Error hiring employee:', err);
      res.status(500).json({ message: 'Server error while hiring employee.' });
    }
  });



  app.get('/employees/:id/permissions', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await poolConnect; // Ensure connection is established
        const result = await pool.request()
            .input('employeeId', sql.Int, id)
            .query(`
                SELECT
                    p.PermissionID,
                    p.PermissionName,
                    CASE WHEN ep.EmployeeID IS NOT NULL THEN 1 ELSE 0 END AS HasPermission
                FROM Permissions p
                LEFT JOIN EmployeePermissions ep ON p.PermissionID = ep.PermissionID AND ep.EmployeeID = @employeeId
                ORDER BY p.PermissionName;
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error(`❌ Error fetching permissions for employee ${id}:`, err);
        res.status(500).json({ message: 'Failed to fetch employee permissions' });
    }
});

// New endpoint to update an employee's specific permissions
app.put('/employees/:id/permissions', authenticateToken, async (req, res) => {
    const { id } = req.params; // Employee ID to update
    const { permissions, editorId, editorUsername } = req.body; // Array of PermissionIDs, and audit info

    if (!Array.isArray(permissions)) {
        return res.status(400).json({ success: false, message: 'Permissions must be an array.' });
    }
    if (!editorId || !editorUsername) {
        return res.status(400).json({ success: false, message: "Missing audit trail info." });
    }

    let transaction;
    try {
        await poolConnect;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // 1. Get current employee's username and tokenVersion for audit log and future token
        const targetEmployeeResult = await transaction.request()
            .input('employeeId', sql.Int, id)
            .query('SELECT username, tokenVersion FROM Employees WHERE employeeId = @employeeId');
        const targetEmployee = targetEmployeeResult.recordset[0];
        const targetUsername = targetEmployee?.username || "Unknown";
        const currentTokenVersion = targetEmployee?.tokenVersion || 0;

        // 2. Delete existing permissions for this employee
        await transaction.request()
            .input('employeeId', sql.Int, id)
            .query('DELETE FROM EmployeePermissions WHERE EmployeeID = @employeeId');

        // 3. Insert new permissions
        for (const permId of permissions) {
            const request = new sql.Request(transaction);
            await request
                .input('employeeId', sql.Int, id)
                .input('permissionId', sql.Int, permId)
                .query('INSERT INTO EmployeePermissions (EmployeeID, PermissionID) VALUES (@employeeId, @permissionId)');
        }

        // 4. Increment the tokenVersion for the employee to invalidate their current token
        await transaction.request()
            .input('employeeId', sql.Int, id)
            .input('newTokenVersion', sql.Int, currentTokenVersion + 1)
            .query('UPDATE Employees SET tokenVersion = @newTokenVersion WHERE employeeId = @employeeId');


        // 5. Log audit trail
        const details = `Updated granular permissions for employee ${targetUsername}. Invalidated existing tokens.`;
        await logAudit({
            employeeId: editorId,
            username: editorUsername,
            action: "Update Permissions",
            tableName: "EmployeePermissions",
            recordId: id,
            details: details,
            transaction: transaction
        });

        await transaction.commit();
        res.json({ success: true, message: 'Employee permissions updated successfully and tokens invalidated.' });

    } catch (err) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rbErr) {
                console.error("Rollback error:", rbErr);
            }
        }
        console.error(`❌ Error updating permissions for employee ${id}:`, err);
        res.status(500).json({ success: false, message: 'Failed to update employee permissions' });
    }
});


app.get('/api/employee/permissions', authenticateToken, async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided." });
    }

    try {
        const decoded = jwt.verify(token, secretKey); // Verify the token
        const employeeId = decoded.employeeId;

        await poolConnect;
        const request = pool.request();
        request.input("employeeId", sql.Int, employeeId);

        // Fetch employee's role and current tokenVersion
        const employeeResult = await request
            .query("SELECT roleId, tokenVersion FROM Employees WHERE employeeId = @employeeId");

        if (employeeResult.recordset.length === 0) {
            return res.status(404).json({ message: "Employee not found." });
        }

        const employee = employeeResult.recordset[0];

        // Check token version mismatch
        if (employee.tokenVersion !== decoded.tokenVersion) {
            // This is crucial: if tokenVersion in DB doesn't match token's, invalidate session
            return res.status(401).json({ message: "Your session has been updated. Please log in again to refresh permissions." });
        }

        let permissions = [];
        if (employee.roleId === 1) { // If Admin, get all permissions
            const allPermissionsResult = await pool.request()
                .query(`SELECT PermissionName FROM Permissions;`);
            permissions = allPermissionsResult.recordset.map(row => row.PermissionName);
        } else {
            // For non-admin, get specific assigned permissions
            const permissionsResult = await pool.request()
                .input("employeeId", sql.Int, employeeId)
                .query(`
                    SELECT p.PermissionName
                    FROM EmployeePermissions ep
                    INNER JOIN Permissions p ON ep.PermissionID = p.PermissionID
                    WHERE ep.EmployeeID = @employeeId;
                `);
            permissions = permissionsResult.recordset.map(row => row.PermissionName);
        }

        res.json({ permissions: permissions });

    } catch (err) {
        console.error('Error in /api/employee/permissions:', err);
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
        }
        res.status(500).json({ message: 'Server error when fetching employee permissions.' });
    }
});


//EMPLOYEE LIST
app.get('/employees', async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT employeeId,
            firstName,
            lastName,
            email,
            phone,
            username,
            Address,
            roleId, 
            hireDate,
            terminated
            FROM [dbo].[Employees]
            WHERE terminated = 0
        `);

        // Fetch permissions for each employee
        const employeesWithPermissions = await Promise.all(result.recordset.map(async (emp) => {
            const permissionsResult = await pool.request()
                .input('employeeId', sql.Int, emp.employeeId)
                .query(`
                    SELECT p.PermissionName
                    FROM EmployeePermissions ep
                    INNER JOIN Permissions p ON ep.PermissionID = p.PermissionID
                    WHERE ep.EmployeeID = @employeeId;
                `);
            // Store permissions as an array of names
            emp.permissions = permissionsResult.recordset.map(p => p.PermissionName);
            return emp;
        }));

        res.json(employeesWithPermissions);
    } catch (err) {
        console.error('Error fetching employees with permissions:', err);
        res.status(500).json({ message: 'Failed to fetch employees' });
    }
});
  


app.put('/employees/:id/role', async (req, res) => {
    const { id } = req.params; // ID of the employee whose role is being changed
    const { roleId, employeeId, username } = req.body; // The one performing the action

    if (!employeeId || !username) {
        return res.status(400).json({ success: false, message: "Missing audit trail info." });
    }

    try {
        // Update the employee's role
        await pool.request()
            .input('id', id)
            .input('roleId', roleId)
            .query('UPDATE Employees SET roleId = @roleId WHERE employeeId = @id');

        // Fetch target employee's username
        const targetEmployeeResult = await pool.request()
            .input('id', id)
            .query('SELECT username FROM Employees WHERE employeeId = @id');
        const targetUsername = targetEmployeeResult.recordset[0]?.username || "Unknown";

        // Fetch new role name
        const roleResult = await pool.request()
            .input('roleId', roleId)
            .query('SELECT roleName FROM Roles WHERE roleId = @roleId');
        const newRoleName = roleResult.recordset[0]?.roleName || "Unknown";

        // Prepare audit log details
        const details = `Changed role of ${targetUsername} to ${newRoleName}`;

        await logAudit({
            employeeId,
            username,
            action: "Change Role",
            tableName: "Employees",
            recordId: id,
            details,
        });

        res.send({ success: true, message: 'Role updated and logged successfully' });
    } catch (err) {
        console.error('❌ Error updating role:', err);
        res.status(500).send({ success: false, message: 'Failed to update role' });
    }
});

//UPDATE INFO
app.put('/employees/:id/update-info', async (req, res) => {
    const { id } = req.params;
    const { username, email, phone, address, firstName, lastName, editorId, editorUsername } = req.body;
  
    try {
      const existing = await pool.request()
        .query(`SELECT * FROM Employees WHERE (username = '${username}' OR email = '${email}') AND employeeId != ${id}`);
  
      if (existing.recordset.length > 0) {
        return res.status(400).json({ success: false, message: 'Username or email already exists.' });
      }
  
      await pool.request()
        .query(`UPDATE Employees 
                SET username = '${username}', email = '${email}', phone = '${phone}', 
                    Address = '${address}', firstName = '${firstName}', lastName = '${lastName}' 
                WHERE employeeId = ${id}`);
  
      await pool.request()
        .query(`INSERT INTO EmployeeAuditTrail (EmployeeID, Username, Action, TableName, RecordID, Details, ActionTime)
                VALUES (${editorId}, '${editorUsername}', 'Update', 'Employees', ${id}, 'Updated employee information', GETDATE())`);
  
      res.json({ success: true });
    } catch (err) {
      console.error('Update error:', err);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  

  
  // Terminate employee
app.put('/employees/:id/terminate', authenticateToken, async (req, res) => {
    const { id } = req.params; 
    const editorId = req.employee.employeeId; 
    const editorUsername = req.employee.username;

    if (!editorId || !editorUsername) {
        // This check is largely redundant if authenticateToken correctly populates req.employee
        return res.status(400).json({ success: false, message: "Authentication context missing for audit trail." });
    }


    let transaction;
    try {
        await poolConnect; // Ensure pool is connected
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // Get current employee's username and tokenVersion for audit log and to increment
        const targetEmployeeResult = await transaction.request()
            .input('employeeId', sql.Int, id)
            .query('SELECT username, tokenVersion FROM Employees WHERE employeeId = @employeeId');

        if (targetEmployeeResult.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Employee not found.' });
        }

        const targetEmployee = targetEmployeeResult.recordset[0];
        const targetUsername = targetEmployee?.username || "Unknown";
        const currentTokenVersion = targetEmployee?.tokenVersion || 0;

        // Set 'terminated' to 1 (as per your request, assuming 1 means terminated)
        await transaction.request()
            .input('employeeId', sql.Int, id)
            .input('newTokenVersion', sql.Int, currentTokenVersion + 1)
            .query('UPDATE Employees SET terminated = 1, tokenVersion = @newTokenVersion WHERE employeeId = @employeeId');


        // Audit log
        const details = `Account for employee ${targetUsername} has been terminated. Existing tokens invalidated.`;
        await logAudit({
            employeeId: editorId, 
            username: editorUsername, 
            action: "Account Termination",
            tableName: "Employees",
            recordId: id, 
            details,
            transaction: transaction 
        });

        await transaction.commit();
        res.json({ success: true, message: `Employee ${targetUsername} terminated successfully and session invalidated.` });
    } catch (err) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rbErr) {
                console.error("Rollback error:", rbErr);
            }
        }
        console.error(`❌ Error terminating employee ${id}:`, err);
        res.status(500).json({ success: false, message: 'Failed to terminate employee account' });
    }
});


  

//TERMINATED EMPLOYEES
app.get('/terminated-employees', async (req, res) => {
    try {
      const result = await pool.request()
        .query(`SELECT 
                  [employeeId],
                  [firstName],
                  [lastName],
                  [password],
                  [roleId],
                  [email],
                  [phone],
                  [hireDate],
                  [terminated],
                  [username],
                  [Address]
                FROM [dbo].[Employees]
                WHERE terminated = 1`);
      
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Error fetching terminated employees:', err);
      res.status(500).json({ message: 'Error fetching terminated Employees' });
    }
});
  

app.put('/rehire/:id', async (req, res) => {
    const { id } = req.params;
    const { employeeId, username } = req.body;

    if (!employeeId || !username) {
        return res.status(400).json({ success: false, message: "Missing audit trail info." });
    }

    try {
        // Rehire employee
        await pool.request()
            .input('id', id)
            .query('UPDATE Employees SET terminated = 0 WHERE employeeId = @id');

        // Get rehired employee's username
        const result = await pool.request()
            .input('id', id)
            .query('SELECT username FROM Employees WHERE employeeId = @id');
        const rehiredUsername = result.recordset[0]?.username || "Unknown";

        // Log audit
        const details = `Rehired employee ${rehiredUsername}`;
        await logAudit({
            employeeId,
            username,
            action: "Rehire Employee",
            tableName: "Employees",
            recordId: id,
            details,
        });

        res.send({ success: true, message: 'Employee rehired and logged.' });
    } catch (err) {
        console.error('❌ Error rehiring employee:', err);
        res.status(500).send({ success: false, message: 'Failed to rehire employee' });
    }
});






/*
 
USER MANAGEMENT SERVER

*/

app.get('/users', async (req, res) => {
    try {
      const result = await pool.request().query(`
        SELECT
          [userId],
          [first_name],
          [last_name],
          [username],
          [email],
          [createdAt],
          [banned],
          [user_tag],
          [warnings_count],
          [banned_until]
        FROM [dbo].[Users]
      `);
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ message: 'Error fetching users' });
    }
});

// GET user details by user_tag
app.get('/users/:user_tag', async (req, res) => {
  const { user_tag } = req.params;
  try {
    const result = await pool.request()
      .input('user_tag', user_tag)
      .query(`
        SELECT
          [userId],
          [first_name],
          [last_name],
          [username],
          [email],
          [createdAt],
          [banned],
          [user_tag],
          [warnings_count],
          [banned_until]
        FROM [dbo].[Users]
        WHERE [user_tag] = @user_tag
      `);
    
    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Error fetching user' });
  }
});


// ✅ Fetch all reviews of a user (with likes + reports count)
app.get("/api/user-reviews/:userId", async (req, res) => {
  const { userId } = req.params;
  const parsedUserId = parseInt(userId, 10);

  if (isNaN(parsedUserId)) {
    return res.status(400).json({ error: "Invalid user ID format." });
  }

  try {
    const result = await pool.request()
      .input("userId", sql.Int, parsedUserId)
      .query(`
        SELECT 
          r.RatingID,
          r.ProductID,
          r.Rating,
          r.Review,
          r.CreatedAt,
          p.ProductName,
          p.Image,
          (SELECT COUNT(*) FROM RatingLikes rl WHERE rl.RatingID = r.RatingID) AS LikeCount,
          (SELECT COUNT(*) FROM RatingReports rr WHERE rr.RatingID = r.RatingID) AS ReportCount
        FROM Ratings r
        JOIN Products p ON r.ProductID = p.ProductID
        WHERE r.UserID = @userId
        ORDER BY r.CreatedAt DESC
      `);

    // Convert product images to Base64 if needed
    const reviews = await Promise.all(result.recordset.map(async (review) => {
      if (review.Image) {
        review.Image = await convertImageToBase64(review.Image);
      }
      return review;
    }));

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});


// Get user restriction logs
app.get("/api/user-restriction-log/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.request()
      .input("UserID", sql.Int, userId)
      .query(`
        SELECT RestrictionLogID, UserID, Action, Reason, CreatedAt
        FROM [dbo].[UserRestrictionLog]
        WHERE UserID = @UserID
        ORDER BY CreatedAt DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching restriction log:", err);
    res.status(500).json({ error: "Failed to fetch restriction logs" });
  }
});



// Restrict User (Warnings & Banning)
app.post("/api/restrict-user", async (req, res) => {
  const { userId, reason, level, bannedUntil } = req.body;

  if (!userId || !reason || !level) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Log restriction action
    const action = level < 3 ? `${level}` : "banned";
    await pool.request()
      .input("UserID", sql.Int, userId)
      .input("Action", sql.NVarChar, action)
      .input("Reason", sql.NVarChar, reason)
      .query(`
        INSERT INTO [dbo].[UserRestrictionLog] ([UserID], [Action], [Reason], [CreatedAt])
        VALUES (@UserID, @Action, @Reason, GETDATE())
      `);

    if (level < 3) {
      // Warning
      await pool.request()
        .input("UserID", sql.Int, userId)
        .input("Level", sql.Int, level)
        .query(`
          UPDATE [dbo].[Users]
          SET warnings_count = @Level
          WHERE userId = @UserID
        `);
    } else {
      // Level 3 = Ban user with datetime
      await pool.request()
        .input("UserID", sql.Int, userId)
        .input("BannedUntil", sql.DateTime, bannedUntil ? new Date(bannedUntil) : null)
        .query(`
          UPDATE [dbo].[Users]
          SET warnings_count = 3,
              banned = 1,
              banned_until = @BannedUntil
          WHERE userId = @UserID
        `);
    }

    res.status(200).json({ message: "Restriction applied successfully." });
  } catch (err) {
    console.error("Error applying restriction:", err);
    res.status(500).json({ error: "Failed to apply restriction." });
  }
});


// Unban User
app.post("/api/unban-user", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    // Update user table
    await pool.request()
      .input("UserID", sql.Int, userId)
      .query(`
        UPDATE [dbo].[Users]
        SET banned = 0,
            banned_until = NULL,
            warnings_count = 0
        WHERE userId = @UserID
      `);

    // Log unban action
    await pool.request()
      .input("UserID", sql.Int, userId)
      .input("Action", sql.NVarChar, "unban")
      .input("Reason", sql.NVarChar, "Unbanned by admin")
      .query(`
        INSERT INTO [dbo].[UserRestrictionLog] ([UserID], [Action], [Reason], [CreatedAt])
        VALUES (@UserID, @Action, @Reason, GETDATE())
      `);

    res.status(200).json({ message: "User successfully unbanned." });
  } catch (err) {
    console.error("Error unbanning user:", err);
    res.status(500).json({ error: "Failed to unban user." });
  }
});



/*

Audit Trail

*/
app.get('/audit-trail', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 50;
        const offset = (page - 1) * pageSize;

        // Count total records for pagination info
        const countResult = await pool.request().query(`
            SELECT COUNT(*) AS TotalCount FROM [dbo].[EmployeeAuditTrail]
        `);
        const totalCount = countResult.recordset[0].TotalCount;

        const result = await pool.request().query(`
            SELECT 
                A.[AuditID],
                A.[EmployeeID],
                A.[Username],
                A.[Action],
                A.[TableName],
                A.[RecordID],
                CASE 
                    WHEN A.TableName = 'Users' THEN U.username
                    WHEN A.TableName = 'Products' THEN P.ProductName
                    WHEN A.TableName = 'Categories' THEN C.CategoryName
                    WHEN A.TableName = 'ProductVariants' THEN V.VariantName
                    WHEN A.TableName = 'Orders' THEN CONCAT('Order #', A.RecordID)
                    WHEN A.TableName = 'OrderTracking' THEN CONCAT('Order #', A.RecordID)
                    ELSE 'N/A'
                END AS RecordName,
                A.[Details],
                A.[ActionTime]
            FROM [dbo].[EmployeeAuditTrail] A
            LEFT JOIN [dbo].[Users] U ON A.TableName = 'Users' AND A.RecordID = U.userId
            LEFT JOIN [dbo].[Products] P ON A.TableName = 'Products' AND A.RecordID = P.ProductID
            LEFT JOIN [dbo].[Categories] C ON A.TableName = 'Categories' AND A.RecordID = C.CategoryID
            LEFT JOIN [dbo].[ProductVariants] V ON A.TableName = 'ProductVariants' AND A.RecordID = V.VariantID
            LEFT JOIN [dbo].[Orders] O ON A.TableName = 'Orders' AND A.RecordID = O.OrderID
            ORDER BY A.ActionTime DESC
            OFFSET ${offset} ROWS
            FETCH NEXT ${pageSize} ROWS ONLY
        `);

        // Send back both the data and total count
        res.json({
            totalCount,
            data: result.recordset
        });
    } catch (err) {
        console.error('Error fetching audit trail:', err);
        res.status(500).json({ message: 'Failed to fetch audit trail' });
    }
});




/*
DASHBOARD SERVER
*/

// GET Monthly Sales and Purchases
app.get("/api/dashboard-summary", async (req, res) => {
    try {
      const poolReq = pool.request();
  
      // Corrected SQL query to count based on the provided OrderStatus values
      const orders = await poolReq.query(`
        SELECT 
            COUNT(CASE WHEN OrderStatus = 'Processing' THEN 1 END) AS Processing,
            COUNT(CASE WHEN OrderStatus = 'Verified' THEN 1 END) AS Verified,
            COUNT(CASE WHEN OrderStatus = 'Shipping' THEN 1 END) AS Shipping,
            COUNT(CASE WHEN OrderStatus = 'Received' THEN 1 END) AS Received,
            COUNT(CASE WHEN OrderStatus = 'Completed' THEN 1 END) AS Completed,
            COUNT(CASE WHEN OrderStatus = 'Cancelled' THEN 1 END) AS Cancelled
        FROM Orders
      `);
  
      const products = await poolReq.query(`
        SELECT 
          (SELECT COUNT(*) FROM Products) AS ProductCount,
          (SELECT COUNT(*) FROM Categories) AS CategoryCount
      `);
  
      res.json({
        orders: orders.recordset[0],
        products: products.recordset[0],
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  

app.get("/chart-data", async (req, res) => {
    const { filter, month, year } = req.query;
    let groupBy = "", whereClause = "";

    // Determine GROUP BY and WHERE clauses based on the filter
    if (filter === "daily") {
      groupBy = "CONVERT(date, OrderDate)";
      if (month && year) {
        whereClause = `WHERE MONTH(OrderDate) = ${month} AND YEAR(OrderDate) = ${year}`;
      }
    } else if (filter === "weekly") {
      groupBy = "DATEPART(week, OrderDate)";
      whereClause = `WHERE YEAR(OrderDate) = ${year || new Date().getFullYear()}`;
    } else if (filter === "monthly") {
        groupBy = "MONTH(OrderDate)";
        whereClause = `WHERE YEAR(OrderDate) = ${year || new Date().getFullYear()}`;
    } else if (filter === "annually") { // New filter: Annually
        groupBy = "YEAR(OrderDate)";
        // For annual report, show data up to the selected year to display a trend
        whereClause = `WHERE YEAR(OrderDate) <= ${year || new Date().getFullYear()}`;
    } else { // Default to monthly if filter is unknown or not set
        groupBy = "MONTH(OrderDate)";
        whereClause = `WHERE YEAR(OrderDate) = ${year || new Date().getFullYear()}`;
    }

    try {
      // Fetch Sales and Purchase data
      const salesPurchase = await pool.request().query(`
        SELECT
          ${groupBy} AS Grouping,
          SUM(CASE WHEN OrderStatus NOT IN ('Cancelled') THEN TotalAmount ELSE 0 END) AS Sales,
          SUM(CASE WHEN OrderStatus = 'Purchase' THEN TotalAmount ELSE 0 END) AS Purchase
        FROM Orders
        ${whereClause}
        GROUP BY ${groupBy}
        ORDER BY Grouping
      `);

      // Fetch Order Summary data
      const orderSummary = await pool.request().query(`
        SELECT
          ${groupBy} AS Grouping,
          COUNT(OrderID) AS Ordered,
          SUM(CASE WHEN ReceivedAt IS NOT NULL THEN 1 ELSE 0 END) AS Delivered
        FROM Orders
        ${whereClause}
        GROUP BY ${groupBy}
        ORDER BY Grouping
      `);

      // Send the fetched data as JSON response
      res.json({
        salesPurchase: salesPurchase.recordset,
        orderSummary: orderSummary.recordset,
      });
    } catch (err) {
      console.error("Error fetching chart data:", err);
      res.status(500).json({ error: "Error fetching chart data" });
    }
});
  
  
  
  app.get('/most-sold-categories', async (req, res) => {
    try {
      const result = await pool.request().query(`
        SELECT 
          c.CategoryName,
          SUM(oi.Quantity) AS TotalSold
        FROM OrderItems oi
        JOIN Products p ON p.ProductID = oi.ProductID
        JOIN Categories c ON c.CategoryID = p.CategoryID
        JOIN Orders o ON o.OrderID = oi.OrderID
        WHERE o.OrderStatus = 'Completed'
        GROUP BY c.CategoryName
        ORDER BY TotalSold DESC
      `);
  
      res.json(result.recordset);
    } catch (err) {
      res.status(500).send(err.message);
    }
  });


/*

REQUESTED VARIANT MANAGER SERVER

*/

app.get("/requested-variants-list", async (req, res) => {
    const { status } = req.query;
    await poolConnect;

    try {
        let baseQuery = `
            SELECT 
                rv.RequestedVariantID,
                rv.RequestedVariantName,
                rv.RequestDate,
                rv.Price,
                rv.Status,
                rv.ApprovedDate,
                rv.RejectedDate,
                u.username,
                p.ProductName
            FROM RequestedVariant rv
            INNER JOIN Users u ON rv.UserID = u.userId
            INNER JOIN Products p ON rv.ProductID = p.ProductID
        `;

        let filterClause = "";
        if (status && status !== "All") {
            if (status === "Approved") {
                filterClause = "WHERE rv.Status = 1";
            } else if (status === "Rejected") {
                filterClause = "WHERE rv.Status = 2";
            } else if (status === "Pending") {
                filterClause = "WHERE rv.Status IS NULL OR rv.Status = 0";
            }
        }

        const finalQuery = `${baseQuery} ${filterClause} ORDER BY rv.RequestDate DESC`;

        const result = await pool.request().query(finalQuery);
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ Error fetching requested variants:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// Get requested variant details
app.get("/requested-variant/:id", async (req, res) => {
    await poolConnect;
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid RequestedVariantID" });
    }

    try {
        const result = await pool.request()
            .input("RequestedVariantID", sql.Int, id)
            .query(`
                SELECT 
                    rv.RequestedVariantID,
                    rv.RequestedVariantName,
                    rv.UserID,
                    rv.ProductID,
                    rv.Price,
                    rv.RequestDate,
                    rv.Status,
                    rv.ApprovedDate,
                    rv.RejectedDate,
                    rv.Description,
                    u.username,
                    u.first_name,
                    u.last_name,
                    u.email,
                    p.ProductName,
                    p.BasePrice,
                    p.Image
                FROM RequestedVariant rv
                LEFT JOIN Users u ON rv.UserID = u.UserID
                LEFT JOIN Products p ON rv.ProductID = p.ProductID
                WHERE rv.RequestedVariantID = @RequestedVariantID

            `);

        if (result.recordset.length > 0) {
            const variant = result.recordset[0];

            const base64Image = variant.Image
                ? `data:image/jpeg;base64,${variant.Image.toString("base64")}`
                : null;

            const formattedVariant = {
                ...variant,
                Image: base64Image,
            };

            res.json(formattedVariant);
        } else {
            res.status(404).json({ error: "Requested variant not found" });
        }
    } catch (error) {
        console.error("❌ Error fetching requested variant detail:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Update requested variant
app.put("/requested-variant-end/:id", async (req, res) => {
    await poolConnect;
    const id = parseInt(req.params.id, 10);
    // Destructure Description from req.body
    const { RequestedVariantName, Price, Status, Description } = req.body; 

    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid RequestedVariantID" });
    }

    // Include Description in the validation check
    if (RequestedVariantName === undefined || Price === undefined || Status === undefined || Description === undefined) {
        return res.status(400).json({ error: "Missing required fields in the request body" });
    }

    // Include Description in the type check
    if (typeof RequestedVariantName !== 'string' || typeof Price !== 'number' || typeof Status !== 'number' || typeof Description !== 'string') {
        return res.status(400).json({ error: "Incorrect data types for provided fields" });
    }

    // You can also add a check for Description if you want to ensure it's a string or null
    if (Description !== undefined && typeof Description !== 'string') {
        return res.status(400).json({ error: "Incorrect data type for Description" });
    }

    if (Status < 0 || Status > 2) {
        return res.status(400).json({ error: "Invalid Status value" });
    }

    try {
        let additionalFields = "";
    if (Status === 1) {
        additionalFields = ", ApprovedDate = GETUTCDATE(), RejectedDate = NULL";
    } else if (Status === 2) {
        additionalFields = ", RejectedDate = GETUTCDATE(), ApprovedDate = NULL";
    } else {
        additionalFields = ", ApprovedDate = NULL, RejectedDate = NULL";
    }

        const query = `
        UPDATE RequestedVariant
        SET
            RequestedVariantName = @RequestedVariantName,
            Price = @Price,
            Status = @Status,
            Description = @Description  -- Add Description to the UPDATE statement
            ${additionalFields}
        WHERE RequestedVariantID = @RequestedVariantID;

        SELECT
            rv.RequestedVariantID,
            rv.RequestedVariantName,
            rv.UserID,
            rv.ProductID,
            rv.Price,
            rv.RequestDate,
            rv.Status,
            rv.ApprovedDate,
            rv.RejectedDate,
            rv.Description,
            u.username,
            u.first_name,
            u.last_name,
            u.email,
            p.ProductName,
            p.BasePrice,
            p.Image
        FROM RequestedVariant rv
        LEFT JOIN Users u ON rv.UserID = u.UserID
        LEFT JOIN Products p ON rv.ProductID = p.ProductID
        WHERE rv.RequestedVariantID = @RequestedVariantID;
        `;

        const result = await pool.request()
        .input("RequestedVariantID", sql.Int, id)
        .input("RequestedVariantName", sql.NVarChar(255), RequestedVariantName)
        .input("Price", sql.Decimal(10, 2), Price)
        .input("Status", sql.Int, Status)
        .input("Description", sql.NVarChar(sql.MAX), Description)
        .query(query);

        if (result.rowsAffected[0] > 0) {
        const updatedVariant = result.recordset[0];
        const base64Image = updatedVariant.Image
            ? `data:image/jpeg;base64,${updatedVariant.Image.toString("base64")}`
            : null;

        res.json({ ...updatedVariant, Image: base64Image });
        } else {
        res.status(404).json({ error: "Requested variant not found for update" });
        }
    } catch (error) {
        console.error("❌ Error updating requested variant:", error);
        res.status(500).json({ error: "Server error during update" });
    }
});


/*

MESSAGING SERVER

*/

//KEYWORDS
const enhancedFaqs = [
  // Product & Inventory
  { keywords: ["product", "item", "airsoft", "gun", "rifle", "pistol"], answer: "We offer a wide range of airsoft guns, accessories, and gear. You can browse our catalog on the products page or search for specific items." },
  { keywords: ["stock", "available", "inventory", "in stock"], answer: "Product availability is shown on each item's page. If something is out of stock, you can sign up for restock notifications." },
  { keywords: ["price", "cost", "expensive", "cheap", "discount"], answer: "Our prices are competitive and we offer regular promotions. Check our products page for current pricing and any active discounts." },
  
  // Orders & Shipping
  { keywords: ["order", "purchase", "buy", "checkout"], answer: "You can place orders through our website. Add items to your cart and proceed to checkout. We accept major credit cards and PayPal." },
  { keywords: ["shipping", "delivery", "ship", "send"], answer: "We offer standard shipping (3-5 business days) and express shipping (1-2 days). International shipping is available to most countries." },
  { keywords: ["track", "tracking", "status", "where is my order"], answer: "Once your order ships, you'll receive a tracking number via email. You can also track orders in your account dashboard." },
  { keywords: ["cancel", "change order", "modify"], answer: "Orders can be cancelled or modified within 1 hour of placement. After that, please contact our support team for assistance." },
  
  // Returns & Refunds
  { keywords: ["return", "refund", "exchange"], answer: "We offer a 30-day return policy for unused items in original packaging. Returns are easy through your account dashboard." },
  { keywords: ["warranty", "defective", "broken", "damaged"], answer: "All airsoft guns come with a 1-year manufacturer warranty. If you receive a damaged item, contact us within 48 hours with photos." },
  
  // Account & Support
  { keywords: ["account", "login", "password", "profile"], answer: "You can manage your account, view orders, and update your profile in the account dashboard. Use the 'Forgot Password' link if you need to reset your password." },
  { keywords: ["payment", "card", "paypal", "billing"], answer: "We accept all major credit cards, PayPal, and Stripe payments. All transactions are secured with SSL encryption." },
  { keywords: ["contact", "support", "help", "phone", "email"], answer: "You can reach our support team through this chat, email us at support@airsofttech.com, or call us during business hours." },
  
  // General
  { keywords: ["hello", "hi", "hey", "greetings"], answer: "Hello! I'm here to help you with any questions about our products, orders, or account. What can I assist you with today?" },
  { keywords: ["thank", "thanks", "appreciate"], answer: "You're very welcome! Is there anything else I can help you with today?" },
  { keywords: ["bye", "goodbye", "see you"], answer: "Goodbye! Feel free to reach out anytime if you need assistance. Have a great day!" }
];

app.post('/api/chat', async (req, res) => {
  try {
    const { message, userID, username, sessionId } = req.body;
    let currentSessionId = sessionId;

    await poolConnect;
    
    // Create or get existing chat session for logged-in users
    if (userID && !currentSessionId) {
      const existingSession = await pool.request()
        .input('userID', sql.Int, userID)
        .query(`
          SELECT TOP 1 SessionID, Status
          FROM ChatSessions 
          WHERE UserID = @userID AND Status IN ('active', 'assigned', 'closed')
          ORDER BY StartTime DESC
        `);
      
      if (existingSession.recordset.length > 0) {
        currentSessionId = existingSession.recordset[0].SessionID;
        
        if (existingSession.recordset[0].Status === 'closed') {
          await pool.request()
            .input('sessionId', sql.Int, currentSessionId)
            .query(`
              UPDATE ChatSessions 
              SET Status = 'active', AssignedEmployeeID = NULL
              WHERE SessionID = @sessionId
            `);
          console.log('Reopened closed session:', currentSessionId);
        }
      } else {
        const newSession = await pool.request()
          .input('userID', sql.Int, userID)
          .input('username', sql.NVarChar, username)
          .query(`
            INSERT INTO ChatSessions (UserID, Username, Status, Priority, Category)
            OUTPUT INSERTED.SessionID
            VALUES (@userID, @username, 'active', 'normal', 'general')
          `);
        currentSessionId = newSession.recordset[0].SessionID;
      }
    }
    
    // Store user message if session exists
    if (currentSessionId && userID) {
      await pool.request()
        .input('sessionId', sql.Int, currentSessionId)
        .input('userID', sql.Int, userID)
        .input('username', sql.NVarChar, username)
        .input('message', sql.NVarChar, message)
        .query(`
          INSERT INTO ChatMessages (SessionID, SenderType, SenderID, SenderName, MessageText, MessageType, IsRead)
          VALUES (@sessionId, 'user', @userID, @username, @message, 'text', 0)
        `);
    }

    // --- Automatic Response Logic (Keyword-only) ---
    const msg = message.toLowerCase();
    let responseText;
    
    const matchedFaq = enhancedFaqs.find(faq => 
      faq.keywords.some(keyword => msg.includes(keyword))
    );
    
    if (matchedFaq) {
      // Found a keyword match, send the FAQ answer
      responseText = matchedFaq.answer;
      
      // Store the bot's response in the database
      if (currentSessionId && userID) {
        await pool.request()
          .input('sessionId', sql.Int, currentSessionId)
          .input('message', sql.NVarChar, responseText)
          .query(`
            INSERT INTO ChatMessages (SessionID, SenderType, SenderID, SenderName, MessageText, MessageType, IsRead)
            VALUES (@sessionId, 'bot', NULL, 'AI Assistant', @message, 'text', 1)
          `);
      }
    } else {
      // No keyword match, send a default message without storing a bot reply
      responseText = "Your message has been received. An agent will be with you shortly.";
    }
    // --- End of Automatic Response Logic ---

    // Log chat interactions for analytics
    console.log(`Chat: ${userID ? `User ${username} (${userID})` : 'Anonymous'} asked: "${message}"`);
    
    res.json({ 
      reply: responseText,
      timestamp: new Date().toISOString(),
      userID: userID || null,
      sessionId: currentSessionId
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      reply: "I'm sorry, I'm having technical difficulties right now. Please try again in a moment or contact our support team directly.",
      error: true
    });
  }
});

// Server-Sent Events endpoint for real-time chat updates
app.get('/api/chat/stream/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  let lastMessageId = 0;

  // Function to check for new messages
  const checkForNewMessages = async () => {
    try {
      await poolConnect;
      const result = await pool.request()
        .input('sessionId', sql.Int, sessionId)
        .input('lastMessageId', sql.Int, lastMessageId)
        .query(`
          SELECT MessageID, SenderType, SenderName, MessageText, Timestamp
          FROM ChatMessages 
          WHERE SessionID = @sessionId AND MessageID > @lastMessageId
          ORDER BY Timestamp ASC
        `);

      if (result.recordset.length > 0) {
        result.recordset.forEach(message => {
          res.write(`data: ${JSON.stringify({
            type: 'message',
            message: {
              MessageID: message.MessageID,
              SenderType: message.SenderType,
              SenderName: message.SenderName,
              MessageText: message.MessageText,
              Timestamp: message.Timestamp
            }
          })}\n\n`);
          lastMessageId = Math.max(lastMessageId, message.MessageID);
        });
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  };

  // Check for new messages every 1 second
  const interval = setInterval(checkForNewMessages, 1000);

  // Handle client disconnect
  req.on('close', () => {
    
    clearInterval(interval);
  });

  req.on('aborted', () => {
    
    clearInterval(interval);
  });
});

//ADMIN LIVE CHAT MANAGEMENT SYSTEM

// Get all active chat sessions for admin dashboard
app.get('/api/admin/chat-sessions', async (req, res) => {
  try {
    
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        cs.SessionID,
        cs.UserID,
        cs.Username,
        cs.StartTime,
        cs.Status,
        cs.AssignedEmployeeID,
        cs.Priority,
        cs.Category,
        e.username as AssignedEmployeeName,
        (
          SELECT COUNT(*) 
          FROM ChatMessages cm 
          WHERE cm.SessionID = cs.SessionID AND cm.IsRead = 0 AND cm.SenderType = 'user'
        ) as UnreadCount,
        (
          SELECT TOP 1 cm.MessageText 
          FROM ChatMessages cm 
          WHERE cm.SessionID = cs.SessionID 
          ORDER BY cm.Timestamp DESC
        ) as LastMessage,
        (
          SELECT TOP 1 cm.Timestamp 
          FROM ChatMessages cm 
          WHERE cm.SessionID = cs.SessionID 
          ORDER BY cm.Timestamp DESC
        ) as LastMessageTime
      FROM ChatSessions cs
      LEFT JOIN Employees e ON cs.AssignedEmployeeID = e.EmployeeID
      WHERE cs.Status IN ('active', 'assigned')
      ORDER BY cs.Priority DESC, cs.StartTime ASC
    `);
    
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Get messages for a specific chat session
app.get('/api/admin/chat-sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await poolConnect;
    
    const result = await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query(`
        SELECT 
          MessageID,
          SenderType,
          SenderID,
          SenderName,
          MessageText,
          MessageType,
          Timestamp,
          IsRead,
          IsEdited
        FROM ChatMessages 
        WHERE SessionID = @sessionId 
        ORDER BY Timestamp ASC
      `);
    
    // Mark admin messages as read
    await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query(`
        UPDATE ChatMessages 
        SET IsRead = 1 
        WHERE SessionID = @sessionId AND SenderType = 'user' AND IsRead = 0
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Send admin reply to user
app.post('/api/admin/chat-sessions/:sessionId/reply', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, employeeId, employeeName } = req.body;
    
    if (!message || !employeeId || !employeeName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await poolConnect;
    
    // Insert admin message
    await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .input('employeeId', sql.Int, employeeId)
      .input('employeeName', sql.NVarChar, employeeName)
      .input('message', sql.NVarChar, message)
      .query(`
        INSERT INTO ChatMessages (SessionID, SenderType, SenderID, SenderName, MessageText, MessageType, IsRead)
        VALUES (@sessionId, 'admin', @employeeId, @employeeName, @message, 'text', 1)
      `);
    
    // Update session assignment if not already assigned
    await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .input('employeeId', sql.Int, employeeId)
      .query(`
        UPDATE ChatSessions 
        SET AssignedEmployeeID = @employeeId, Status = 'assigned'
        WHERE SessionID = @sessionId AND AssignedEmployeeID IS NULL
      `);
    
    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error sending admin reply:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// Assign chat session to admin
app.post('/api/admin/chat-sessions/:sessionId/assign', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { employeeId } = req.body;
    
    await poolConnect;
    
    await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .input('employeeId', sql.Int, employeeId)
      .query(`
        UPDATE ChatSessions 
        SET AssignedEmployeeID = @employeeId, Status = 'assigned'
        WHERE SessionID = @sessionId
      `);
    
    res.json({ success: true, message: 'Session assigned successfully' });
  } catch (error) {
    console.error('Error assigning session:', error);
    res.status(500).json({ error: 'Failed to assign session' });
  }
});

// Close chat session
app.post('/api/admin/chat-sessions/:sessionId/close', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { employeeId, employeeName } = req.body;
    
    await poolConnect;
    
    // Add system message about session closure
    await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .input('employeeName', sql.NVarChar, employeeName || 'System')
      .query(`
        INSERT INTO ChatMessages (SessionID, SenderType, SenderID, SenderName, MessageText, MessageType, IsRead)
        VALUES (@sessionId, 'system', NULL, @employeeName, 'Chat session has been closed by admin.', 'system', 1)
      `);
    
    // Update session status
    await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query(`
        UPDATE ChatSessions 
        SET Status = 'closed', EndTime = GETDATE()
        WHERE SessionID = @sessionId
      `);
    
    res.json({ success: true, message: 'Session closed successfully' });
  } catch (error) {
    console.error('Error closing session:', error);
    res.status(500).json({ error: 'Failed to close session' });
  }
});

// Get chat statistics for admin dashboard
app.get('/api/admin/chat-stats', async (req, res) => {
  try {
    await poolConnect;
    
    const stats = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM ChatSessions WHERE Status = 'active') as ActiveSessions,
        (SELECT COUNT(*) FROM ChatSessions WHERE Status = 'assigned') as AssignedSessions,
        (SELECT COUNT(*) FROM ChatSessions WHERE Status = 'closed' AND CAST(EndTime as DATE) = CAST(GETDATE() as DATE)) as ClosedToday,
        (SELECT COUNT(*) FROM ChatMessages WHERE CAST(Timestamp as DATE) = CAST(GETDATE() as DATE)) as MessagesToday,
        (SELECT AVG(DATEDIFF(MINUTE, StartTime, ISNULL(EndTime, GETDATE()))) FROM ChatSessions WHERE Status IN ('closed', 'assigned')) as AvgSessionDuration
    `);
    
    res.json(stats.recordset[0]);
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({ error: 'Failed to fetch chat statistics' });
  }
});

