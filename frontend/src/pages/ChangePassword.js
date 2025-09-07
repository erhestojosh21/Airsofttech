import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./ChangePassword.css";
import logo from "../assets/EdgiLogo.jpg";

const ChangePassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOtpField, setShowOtpField] = useState(() => {
    return localStorage.getItem("showOtpField") === "true";
  });
  const [showNewPasswordField, setShowNewPasswordField] = useState(false);
  const [error, setError] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cooldown, setCooldown] = useState(() => {
    return parseInt(localStorage.getItem("otpCooldown")) || 0;
  });

  useEffect(() => {
    if (cooldown > 0) {
      localStorage.setItem("otpCooldown", cooldown);
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      localStorage.removeItem("otpCooldown");
    }
  }, [cooldown]);

  const handleRequestOtp = async () => {
    if (cooldown > 0) return;
  
    setCooldown(100);
    setShowOtpField(true);
    localStorage.setItem("showOtpField", "true"); // Store in localStorage
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/request-password-otp`, { email });
      alert(response.data.message);
    } catch (error) {
      alert(error.response?.data?.error || "Failed to send OTP");
    }
  };
  
  const handleVerifyOtp = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/verify-password-otp`, { email, otp });
      alert(response.data.message);
      setShowNewPasswordField(true);
      
      // Clear showOtpField when OTP is verified
      setShowOtpField(false);
      localStorage.removeItem("showOtpField");
    } catch (error) {
      alert(error.response?.data?.error || "Invalid or expired OTP");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/change-password`, { email, oldPassword, newPassword });
      alert(response.data.message);
      window.location.href = "/login";
    } catch (error) {
      alert(error.response?.data?.error || "Failed to change password");
    }
  };

  return (
    <div className="change-password-container">
      <img src={logo} alt="logo" className="plogo" />
      <h2>Change Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button onClick={handleRequestOtp} disabled={cooldown > 0}>
        {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Request OTP"}
      </button>

      {showOtpField && (
        <div>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button onClick={handleVerifyOtp}>Verify OTP</button>
        </div>
      )}

      {showNewPasswordField && (
        <div>
          <div className="password-container">
            <input
              type={showOldPassword ? "text" : "password"}
              placeholder="Enter Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <span className="eye-icon" onClick={() => setShowOldPassword(!showOldPassword)}>
              {showOldPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="password-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span className="eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {error && <p className="error-text">{error}</p>}
          <button onClick={handleChangePassword}>Change Password</button>
        </div>
      )}

      <footer className="footer">
        <p>
          If you encounter issues changing your password, please contact the administrator at 
          <a href="mailto:edgicustomworks100@gmail.com"> edgicustomworks100@gmail.com</a>
        </p>
      </footer>
    </div>
  );
};

export default ChangePassword;
