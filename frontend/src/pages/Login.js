import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState(""); // State for error message
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); 

    try {
      // Attempt Customer Login
      const customerResponse = await axios.post(`${process.env.REACT_APP_API_URL}/login`, { username, password });

      if (customerResponse.data.otpRequired) {
        setShowOTPModal(true);
        setEmail(customerResponse.data.email);
        setTempUserId(customerResponse.data.tempUserId);
      } else {
        alert("Login successful.");
        localStorage.setItem("userID", customerResponse.data.userID);  
        localStorage.setItem("token", customerResponse.data.token);
        localStorage.setItem("username", customerResponse.data.username);
        window.dispatchEvent(new Event("storage")); 
        navigate("/home");
      }
    } catch (customerError) {
      console.log("Customer login failed:", customerError);
      const message =
        customerError.response?.data?.error ||
        customerError.response?.data?.message ||
        "You have entered an incorrect username or password.";
      setErrorMessage(message);
    }

  };
  

  const handleVerifyOTP = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/verify-login-otp`, { email, otp, tempUserId });

      //alert(response.data.message);
      localStorage.setItem("userID", response.data.userID);  //Store userID after OTP verification
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      window.dispatchEvent(new Event("storage"));  //Ensure updates across components
      navigate("/homepage");
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "OTP verification failed.";
      setErrorMessage(message);
    }

  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/resend-login-otp`, { email });
      //alert(response.data.message);

      setCooldown(100);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to resend OTP.";
      setErrorMessage(message);
    }

  };

  const handleLogout = () => {
    localStorage.removeItem("userID");  //Remove userID on logout
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.dispatchEvent(new Event("storage"));  //Ensure updates across components
    navigate("/login");
  };

  return (
    <div className="login-page">
    <div className="login-container">
      <title>EdGi Login</title>
      <div className="login-image"></div>
      <div className="login-form-container">
        
        <h1 className="login-title">WELCOME BACK!</h1>
        <p>No account? <a href="/signup">Sign up</a></p>
        
        <form onSubmit={handleLogin} className="login-form">
          {/* Error Message */}
          {errorMessage && <p className="error-message">{errorMessage}</p>}

          
          <label>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="login-input" />

          <label>Password:</label>
          <div className="password-container">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="login-input"
            />
            <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <a href="/change-password" className="forgot-password">Forget Password?</a>
          <button type="submit" className="login-button">LOG IN</button>
          
          
        </form>

        
      </div>

      {showOTPModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal">
            <h3>Please Enter OTP</h3>
            <p>An OTP has been sent to your email: {email}</p>
            {errorMessage && <p className="error-message">{errorMessage}</p>}


            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="otp-input-single"
              placeholder="Enter OTP"
            />

            <div className="otp-resend-container">
              <p>
                Did not receive OTP?{" "}
                <span 
                  className={`otp-resend-text ${cooldown > 0 ? "disabled" : ""}`} 
                  onClick={handleResendOTP}
                >
                  Resend{cooldown > 0 ? ` (${cooldown}s)` : ""}
                </span>
              </p>
            </div>

            <button onClick={handleVerifyOTP} className="otp-button">Verify OTP</button>
            <button onClick={() => setShowOTPModal(false)} className="otp-close">Cancel</button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Login;
