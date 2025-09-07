import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const OTPVerification = () => {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(100);
  const [resendDisabled, setResendDisabled] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email; // Get email from navigation

  useEffect(() => {
    if (!email) {
      navigate("/signup"); // Redirect if email is missing
    }

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
  }, [email]);

  const verifyOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/verify-otp`, { email, otp });
      if (response.data.success) {
        alert("OTP Verified!");
        navigate("/homepage", { state: { username: response.data.username } }); // Navigate with username
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
      await axios.post(`${process.env.REACT_APP_API_URL}/resend-otp`, { email });
      setCountdown(100);
      setResendDisabled(true);
    } catch (error) {
      console.error("Resend OTP error:", error);
      alert("Failed to resend OTP.");
    }
  };

  return (
    <div>
      <h2>OTP Verification</h2>
      <p>Enter the OTP sent to {email}</p>
      <form onSubmit={verifyOTP}>
        <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
        <button type="submit">Verify OTP</button>
      </form>
      <button onClick={resendOTP} disabled={resendDisabled}>
        {resendDisabled ? `Resend OTP in ${countdown}s` : "Resend OTP"}
      </button>
    </div>
  );
};

export default OTPVerification;
