import React, { useState, useEffect } from "react";
import axios from "axios";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const OTPModal = ({ email, onClose, onSuccess }) => {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(300);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [channel, setChannel] = useState("email"); // email or sms
  const [phone, setPhone] = useState(""); // will now store intl format
  const [tempUserId, setTempUserId] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Request OTP
  const requestOTP = async () => {
    if (channel === "sms" && !phone) {
      alert("Please enter a valid phone number.");
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/request-otp`,
        {
          email,
          channel,
          phone: channel === "sms" ? phone : undefined,
          first_name: "Test", 
          last_name: "User",
          username: "testuser123",
          password: "password123",
        }
      );
      setTempUserId(response.data.tempUserId);
      alert(`OTP sent via ${channel}`);
      setCountdown(100);
      setResendDisabled(true);
    } catch (error) {
      console.error("Request OTP error:", error);
      alert("Failed to send OTP.");
    }
  };

  // Verify OTP
  const verifyOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/verify-otp`,
        { email, otp, tempUserId }
      );
      if (response.data.message.includes("successful")) {
        alert("OTP Verified!");
        onSuccess();
      } else {
        alert("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      alert("OTP verification failed.");
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/resend-otp`, { 
        email, 
        channel, 
        phone: channel === "sms" ? phone : undefined 
      });
      setCountdown(100);
      setResendDisabled(true);
      alert("OTP Resent!");
    } catch (error) {
      console.error("Resend OTP error:", error);
      alert("Failed to resend OTP.");
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>OTP Verification</h2>

        {/* Delivery Option */}
        <div>
          <label>
            <input
              type="radio"
              value="email"
              checked={channel === "email"}
              onChange={(e) => setChannel(e.target.value)}
            />
            Email ({email})
          </label>
          <label style={{ marginLeft: "10px" }}>
            <input
              type="radio"
              value="sms"
              checked={channel === "sms"}
              onChange={(e) => setChannel(e.target.value)}
            />
            SMS
          </label>
        </div>

        {/* Phone input if SMS is chosen */}
        {channel === "sms" && (
          <div style={{ marginTop: "10px" }}>
            <PhoneInput
              placeholder="Enter phone number"
              value={phone}
              onChange={setPhone}
              defaultCountry="PH"   // you can change or remove this
              international
              required
            />
          </div>
        )}

        <button onClick={requestOTP} style={{ marginTop: "10px" }}>
          Request OTP
        </button>

        <form onSubmit={verifyOTP} style={{ marginTop: "20px" }}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button type="submit">Verify OTP</button>
        </form>

        <button onClick={resendOTP} disabled={resendDisabled}>
          {resendDisabled ? `Resend OTP in ${countdown}s` : "Resend OTP"}
        </button>

        <button onClick={onClose} style={{ marginTop: "10px" }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default OTPModal;
