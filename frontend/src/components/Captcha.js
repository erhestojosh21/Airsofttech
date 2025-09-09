// src/components/Captcha.js
import React from "react";
import ReCAPTCHA from "react-google-recaptcha";

const Captcha = ({ onVerify }) => {
  const handleChange = async (token) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/verify-captcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      onVerify(data.success); // Tell Signup page whether captcha is verified
    } catch (err) {
      console.error("CAPTCHA verification error:", err);
      onVerify(false);
    }
  };

  return (
    <div className="captcha-wrapper">
      <ReCAPTCHA
        sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY} // <-- Replace with your actual site key
        onChange={handleChange}
      />
    </div>
  );
};

export default Captcha;
