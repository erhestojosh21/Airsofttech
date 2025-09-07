import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";

const EmployeeLogin = () => {
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
        // Attempt Employee Login
        const employeeResponse = await axios.post(`${process.env.REACT_APP_API_URL}/employee-login`, { username, password });

        if (employeeResponse.data.otpRequired) {
          setShowOTPModal(true);
        } else {
          //alert("Login successful!");
          localStorage.setItem("token", employeeResponse.data.token);
          navigate("/admin/dashboard");
        }
      } catch (employeeError) {
        setErrorMessage("**Error:** You have entered an incorrect username or password.");
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
      //alert(error.response?.data?.error || "OTP verification failed");

      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/verify-employee-otp`, { username, otp });

        //alert(response.data.message);
        localStorage.setItem("token", response.data.token);
        navigate("/admin/dashboard");
      } catch (error) {
        //alert(error.response?.data?.error || "OTP verification failed");
      }
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;

    

      try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/employee-login`, { username, password });
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
        //alert(error.response?.data?.error || "Failed to resend OTP");
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
      <title>edGi Login</title>
      <div className="login-image"></div>
      <div className="login-form-container">
        
        <h1 className="login-title">WELCOME BACK!</h1>
        <p>Employee Log In</p>
        
        <form onSubmit={handleLogin} className="login-form">
          {/* Error Message */}
          {errorMessage && <p className="error-message"><strong>Error:</strong> You have entered an incorrect username or password.</p>}
          
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

          <a>..</a>
          <button type="submit" className="login-button">LOG IN</button>
          
          
        </form>

        
      </div>

      {showOTPModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal">
            <h3>Please Enter OTP</h3>
            <p>An OTP has been sent to your email</p>

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

export default EmployeeLogin;
