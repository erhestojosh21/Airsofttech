import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Captcha from "../components/Captcha";
import "./Signup.css";
import Tooltip from './Tooltip';

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [tempUserId, setTempUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [usernameLimitLeft, setUsernameLimitLeft] = useState(30);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  
  const toggleModal = () => setIsOpen(!isOpen);

  const navigate = useNavigate();

  // Password validation function
  const evaluatePasswordStrength = (pwd) => {
    if (pwd.length < 8) return "Too Short";
    const strengthPoints =
      /[A-Z]/.test(pwd) +
      /[a-z]/.test(pwd) +
      /[0-9]/.test(pwd) +
      /[^A-Za-z0-9]/.test(pwd);
  
    switch (strengthPoints) {
      case 4:
        return "Strong";
      case 3:
        return "Moderate";
      default:
        return "Weak";
    }
  };
  
  const isStrongPassword = (pwd) => {
    const lengthCheck = pwd.length >= 8;
    const uppercaseCheck = /[A-Z]/.test(pwd);
    const lowercaseCheck = /[a-z]/.test(pwd);
    const specialCharCheck = /[^A-Za-z0-9]/.test(pwd);
    return lengthCheck && uppercaseCheck && lowercaseCheck && specialCharCheck;
  };

  // Handle user signup and request OTP
  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (!isStrongPassword(password)) {
      setErrorMessage(
        "Password must be at least 8 characters long and \n include uppercase, lowercase, and a special character like (! @ # $ % ^ & *)"
      );
      return;
    }

    if (!agreeToTerms) {
      setErrorMessage("You must agree to the Terms and Conditions to proceed.");
      return;
    }
    

    setErrorMessage("");
    setShowOtpModal(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/request-otp`, {
        first_name: firstName,
        last_name: lastName,
        email,
        username,
        password,
      });

      setTempUserId(response.data.tempUserId);
      startResendTimer();
    } catch (error) {
      setShowOtpModal(false);
      setErrorMessage(error.response?.data?.error || "Signup failed");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/verify-otp`,
        {
          email,
          otp,
          tempUserId,
        },
        { withCredentials: true } // This makes sure the cookie gets set
      );

      console.log(res.data.message); // Optional: "Signup successful & logged in!"
      setShowOtpModal(false); // Close modal
      navigate("/login");  // Redirect to homepage instead of /login
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "OTP verification failed");
    }
  };


  const handleResendOTP = async () => {
    if (cooldown > 0) return;

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/resend-otp`, {
        email,
      });
      alert(response.data.message);
      startResendTimer();
    } catch (error) {
      setErrorMessage(error.response?.data?.error || "Failed to resend OTP");
    }
  };

  const startResendTimer = () => {
    setResendDisabled(true);
    setCooldown(100);

    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };


  const handleNameChange = (setter) => (e) => {
    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
    const capitalizedValue = sanitizedValue
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
    setter(capitalizedValue);
  };

  const allowedDomains = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com"
];

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  const domain = email.split("@")[1].toLowerCase();
  return allowedDomains.includes(domain);
};


  return (
    <div className="signup-container">
      <title>EdGI Sign Up</title>
      
      <div className="signup-right">
      <h1 className="login-title">CREATE AN ACCOUNT</h1>
      <p>Have account already? <a href="/login">Log In</a></p>
        <form onSubmit={handleSignup}>

          <div className="name-fields">
            <input
              type="text"
              placeholder="First Name *"
              value={firstName}
              onChange={handleNameChange(setFirstName)}
              pattern="[A-Za-z\s]+"
              required
            />
            <input
              type="text"
              placeholder="Last Name *"
              value={lastName}
              onChange={handleNameChange(setLastName)}
              pattern="[A-Za-z\s]+"
              required
            />
          </div>

          <div className="email-username-fields">
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Username *"
            value={username}
            maxLength={30}
            onChange={(e) => {
              const val = e.target.value;
              setUsername(val);
              setUsernameLimitLeft(30 - val.length);
            }}
            required
          />
          {/*<p className="char-limit-msg">{usernameLimitLeft} characters left</p>*/}
          </div>

          {/* Password Field */}
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password *"
              value={password}
              onChange={(e) => {
                const val = e.target.value;
                setPassword(val);
                setPasswordStrength(evaluatePasswordStrength(val));
              }}
              required
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
            
          </div>
          

          {password && (
            <div className="password-strength-container">
              <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
               Password strength: {passwordStrength} 

               <Tooltip message={
                <>
                  <strong>Password must include:</strong>
                  <ul>
                    <li>Upper and lower case letters</li>
                    <li>Numbers (0-9)</li>
                    <li>Special characters (! @ # $ % ^ & *)</li>
                  </ul>
                </>
              } />
              </p>
              
            </div>
          )}

          {/* Confirm Password Field */}
          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password *"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span
              className="eye-icon"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {errorMessage && <p className="error">{errorMessage}</p>}

          <div className="captcha-container">
            <Captcha onVerify={setCaptchaVerified} />
          </div>

          <div className="terms-checkbox">
          
          
            <input
              type="checkbox"
              id="agreeToTerms"
              className="terms-checkbox-input"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              required
            />

          <label className="terms-label" htmlFor="agreeToTerms">
              I agree to the <a onClick={toggleModal}>Terms and Conditions</a>
            </label>  
          </div>


          <button type="submit" className="next-button" disabled={!captchaVerified}>
            Next
          </button>
        </form>
      </div>

      <div className="signup-left">
        
      </div>

      {isOpen && (
        <div className="terms-modal">
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Terms and Conditions</h2>
              <div className="modal-body">
                <p><strong>Effective Date:</strong> 25 April 2025</p>

                <p>
                  By creating an account or using our platform, you agree to the following Terms and Conditions. Please review carefully before proceeding.
                </p>

                <h4>I. Eligibility</h4>
                <p>
                  You must be at least 18 years old or the legal age in your jurisdiction to use this platform.
                </p>

                <h4>II. Personal Information & Address</h4>
                <p>
                  By using our platform, you consent to the collection, storage, and processing of your personal data, including your shipping address, in accordance with our Privacy Policy and applicable data protection laws such as GDPR, Republic Act 10173(Data Privacy Act of 2012), and Republic Act 8792(Electronic Commerce Act of 2000).
                </p>

                <h4>III. Product Availability & Pre-Orders</h4>
                <p>
                  Our airsoft products are primarily offered through a pre-order system. Estimated availability and shipping dates are subject to change due to manufacturing, logistics, or supplier delays. By placing a pre-order, you acknowledge and accept potential delays and agree to receive the product once available.
                </p>

                <h4>IV. Digital Transactions</h4>
                <p>
                  All transactions are securely processed via third-party payment gateways. By purchasing, use Paypal payment method.
                </p>

                <h4>V. No Refund Policy</h4>
                <p>
                  All sales, including pre-orders, are final. We do not offer refunds or cancellations unless required by law or explicitly stated in product terms.
                </p>

                <h4>VI. Account Responsibility</h4>
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>

                <h4>VII. Prohibited Conduct</h4>
                <p>
                  You agree not to engage in unlawful activities, provide false information, or attempt to interfere with the platform’s integrity or security.
                </p>

                <h4>VIII. Limitation of Liability</h4>
                <p>
                  The platform is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we are not liable for any direct, indirect, or consequential damages arising from your use of the platform.
                </p>

                <h4>IX. Updates to Terms</h4>
                <p>
                  We may modify these Terms and Conditions at any time. Continued use of the platform implies your acceptance of any updated terms.
                </p>

                <h4>X. Governing Law</h4>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of your country or state. Disputes shall be resolved in the jurisdiction's courts.
                </p>

                <h4>XI. Contact</h4>
                <p>
                  For any questions or concerns, please contact us at <a href="mailto:edgicustoms100@gmail.com">edgicustoms100@gmail.com</a>.
                </p>
              </div>

              <div className="modal-footer">
                <button className="modal-close" onClick={toggleModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* OTP Modal */}
      {showOtpModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal">
            <h3>Please Enter OTP</h3>
            <p>
              An OTP has been sent to your email: <strong>{email}</strong>
            </p>
            <input
              className="otp-input-single"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <div className="otp-resend-container">
              <p>
                Did not receive OTP?{" "}
                <span
                  className={`otp-resend-text ${
                    cooldown > 0 ? "disabled" : ""
                  }`}
                  onClick={handleResendOTP}
                >
                  Resend{cooldown > 0 ? ` (${cooldown}s)` : ""}
                </span>
              </p>
            </div>

            <button onClick={handleVerifyOtp} className="otp-button">
              Verify OTP
            </button>
            <button
              onClick={() => setShowOtpModal(false)}
              className="otp-close"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
