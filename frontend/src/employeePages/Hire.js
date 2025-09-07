import React, { useState } from 'react';
import axios from 'axios';
import './Hire.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Hire = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    username: '',
    address: '',
  });

  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isStrongPassword = (pwd) => {
    const lengthCheck = pwd.length >= 8;
    const uppercaseCheck = /[A-Z]/.test(pwd);
    const lowercaseCheck = /[a-z]/.test(pwd);
    const specialCharCheck = /[^A-Za-z0-9]/.test(pwd);
    return lengthCheck && uppercaseCheck && lowercaseCheck && specialCharCheck;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage(''); // Clear message when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (!isStrongPassword(password)) {
      setMessage(
        'Password must be at least 8 characters and include uppercase, lowercase, and a special character such as (! @ # $ % ^ & *)'
      );
      return;
    }

    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/hire-validation`, submitData);
      setMessage(`✅ ${response.data.message}`);

      // Optionally reset form
      setFormData({
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: '',
        username: '',
        address: '',
      });
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(`${error.response.data.message}`);
      } else {
        setMessage('Error hiring employee');
      }
    }
  };

  return (
    <div>
      <div className="hire-container">
        <h2>Add Employee Account</h2>
        <h3 className="hire-subtitle">Employee Info</h3>
        {message && <p className="hire-message">{message}</p>}
        <form onSubmit={handleSubmit} className="hire-form">
          <div className="name-row">
            <input
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <textarea
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="textarea-address"
            rows={2}
          />

          {['phone', 'email'].map((field) => (
            <input
              key={field}
              name={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={formData[field]}
              onChange={handleChange}
              required
            />
          ))}

          <h3 className="hire-subtitle">Employee Account</h3>

          {['username'].map((field) => (
            <input
              key={field}
              name={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={formData[field]}
              onChange={handleChange}
              required
            />
          ))}

          {/* Password */}
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span className="eye-icon" onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="password-field">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <span className="eye-icon" onClick={() => setShowConfirmPassword((prev) => !prev)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit">Hire</button>
        </form>

        <div className="terms-section">
        <h4>Terms & Conditions</h4>
        <ul>
          <li>By hiring, you agree that all employee actions are subject to company policy.</li>
          <li>When an employee places an order, a notification will be sent to their registered email account.</li>
          <li>All employee accounts must maintain up-to-date contact details.</li>
          <li>Misuse of the employee system may result in account suspension or termination.</li>
        </ul>
      </div>
      </div>

      
    </div>
  );
};

export default Hire;
