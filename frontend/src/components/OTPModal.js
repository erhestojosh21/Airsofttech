import React, { useState, useEffect } from "react";
import axios from "axios";

const OTPModal = ({ email, onClose, onSuccess }) => {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(100);
  const [resendDisabled, setResendDisabled] = useState(true);

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

  const verifyOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/verify-login`, { email, otp });
      if (response.data.message === "OTP verified. Access granted.") {
        alert("OTP Verified!");
        onSuccess(); // Call success function to redirect
      } else {
        alert("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      alert("OTP verification failed.");
    }
  };

  const resendOTP = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/login`, { email });
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
        <p>Enter the OTP sent to {email}</p>
        <form onSubmit={verifyOTP}>
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
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default OTPModal;
