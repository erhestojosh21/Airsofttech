import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaSave, FaTimes, FaKey, FaChevronLeft } from "react-icons/fa";
import { GoAlert, GoQuestion } from "react-icons/go";
import { LuKeyRound } from "react-icons/lu";
import "./EmployeeProfile.css";

const EmployeeProfile = () => {
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState(null);
  const [originalEmployeeData, setOriginalEmployeeData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // State for Change Password Modal
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpField, setShowOtpField] = useState(false);
  const [changePassMessage, setChangePassMessage] = useState("");
  const [otpSentUsername, setOtpSentUsername] = useState("");

  // States for specific confirmation modals
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

  const fetchEmployeeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }
      const decodedToken = jwtDecode(token);
      const employeeId = decodedToken.employeeId;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/employees/${employeeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEmployeeData(response.data);
      setOriginalEmployeeData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching employee data:", err);
      setError(err.response?.data?.message || "Failed to fetch profile data.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const handleEdit = () => {
    setIsEditMode(true);
    setEditedData({ ...employeeData });
  };

  const handleCancelEditMode = () => {
    setShowCancelConfirmModal(true); // Open the cancel confirmation modal
  };

  const confirmCancelAction = () => {
    setIsEditMode(false);
    setEmployeeData(originalEmployeeData);
    setEditedData({});
    setSuccessMessage(null);
    setError(null);
    setShowCancelConfirmModal(false); // Close modal after action
  };

  const handleSaveAttempt = (e) => {
    e.preventDefault(); // Prevent default form submission initially
    setShowSaveConfirmModal(true); // Open the save confirmation modal
  };

  const handleSaveLogic = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setShowSaveConfirmModal(false); // Close modal before starting save

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editedData.email && !emailRegex.test(editedData.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    const phoneRegex = /^\+?[0-9\s-]{7,20}$/;
    if (editedData.phone && !phoneRegex.test(editedData.phone)) {
      setError("Please enter a valid phone number.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token);
      const employeeId = decodedToken.employeeId;

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/employees/${employeeId}`,
        editedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEmployeeData(response.data);
      setOriginalEmployeeData(response.data);
      setIsEditMode(false);
      setSuccessMessage("Profile updated successfully!");
    } catch (err) {
      console.error("Error saving employee data:", err);
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // --- Change Password Logic ---
  const openChangePasswordModal = () => {
    setShowChangePasswordModal(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setOtp("");
    setShowOtpField(false);
    setChangePassMessage("");
    setOtpSentUsername(employeeData?.username || "");
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setChangePassMessage("");
  };

  const requestOtpForPasswordChange = async () => {
    setChangePassMessage("Sending OTP...");
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/employee-login`, {
        username: otpSentUsername,
        password: currentPassword,
      });

      if (response.data.otpRequired) {
        setShowOtpField(true);
        setChangePassMessage("OTP sent to your registered email! Please check.");
      }
    } catch (err) {
      console.error("Error requesting OTP:", err);
      setChangePassMessage(
        err.response?.data?.error || "Failed to send OTP. Please try again."
      );
      setShowOtpField(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePassMessage("Changing password...");

    if (newPassword !== confirmNewPassword) {
      setChangePassMessage("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setChangePassMessage("New password must be at least 8 characters long.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token);
      const employeeId = decodedToken.employeeId;

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/employee/change-password`,
        {
          employeeId: employeeId,
          username: otpSentUsername,
          currentPassword,
          newPassword,
          otp,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setChangePassMessage(response.data.message);
      setTimeout(() => {
        closeChangePasswordModal();
      }, 2000);
    } catch (err) {
      console.error("Error changing password:", err);
      setChangePassMessage(
        err.response?.data?.error || "Failed to change password. Please try again."
      );
    }
  };

  if (loading) {
    return <div className="employee-profile-container loading">Loading profile...</div>;
  }

  if (error && !employeeData) {
    return <div className="employee-profile-container error-message">Error: {error}</div>;
  }

  // Helper function to display access permissions with the new format
  const getAccessPermissionDisplay = () => {
    // If the employee is an Admin (roleId 1), display "Access to All" in a special way
    if (employeeData?.roleId === 1) {
      return (
        <div className="permissions-display">
          <p>Access to All</p>
        </div>
      );
    }
    // If not an Admin, and there are specific permissions
    else if (employeeData?.permissions && employeeData.permissions.length > 0) {
      return (
        <div className="permissions-display">
          <ul>
            {employeeData.permissions.map((permName) => (
              // Using permName directly as the key and content,
              // assuming you don't have an `allPermissions` array mapping
              // or that `permName` is already the display-ready string.
              <li key={permName}>{permName}</li>
            ))}
          </ul>
        </div>
      );
    } else {
      // Fallback if no specific permissions are found for non-admins
      return (
        <div className="permissions-display">
          <p>No specific access permissions assigned.</p>
        </div>
      );
    }
  };


  return (
    <div className="employee-profile-container">
      <div className="inventory-details-title"></div>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="employee-profile-first">
        <div className="cover-header"></div>
        <div className="employee-profile-header-content">
          <div className="employee-image-container">
            <div className="profile-image"></div>
          </div>
          <div className="employee-header-text">
            <h2 className="employee-full-name">
              {isEditMode ? (
                <>
                  <input
                    type="text"
                    name="firstName"
                    value={editedData.firstName || ""}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={editedData.lastName || ""}
                    onChange={handleChange}
                    placeholder="Last Name"
                    required
                  />
                </>
              ) : (
                `${employeeData?.firstName || ""} ${employeeData?.lastName || ""}`
              )}
            </h2>
            <p className="employee-role">
              {employeeData?.roleId === 1
                ? "Admin"
                : employeeData?.roleId === 2
                ? "Manager"
                : "Employee"}
            </p>
          </div>
          <div className="inventory-details-controls">
            {!isEditMode ? (
              <>
                <button type="button" onClick={handleEdit} className="edit-btn">
                  <FaEdit /> Edit Profile
                </button>
                <button
                  type="button"
                  onClick={openChangePasswordModal}
                  className="change-password-button"
                >
                  <FaKey /> Change Password
                </button>
              </>
            ) : (
              <>
                <button type="submit" onClick={handleSaveAttempt} className="save-button">
                  <FaSave /> Save Changes
                </button>
                <button type="button" onClick={handleCancelEditMode} className="cancel-button">
                  <FaTimes /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="employee-profile-info-section">
          {/* Employee Details Grid */}
          <div className="employee-profile-details-grid">
            <div className="employee-detail-item">
              <label>Employee ID:</label>
              <span>{employeeData?.employeeId || "N/A"}</span>
            </div>
            <div className="employee-detail-item">
              <label>Username:</label>
              {isEditMode ? (
                <input
                  type="text"
                  name="username"
                  value={editedData.username || ""}
                  onChange={handleChange}
                  required
                  readOnly // Username typically not editable from profile
                />
              ) : (
                <span>{employeeData?.username || "N/A"}</span>
              )}
            </div>
            <div className="employee-detail-item">
              <label>Email:</label>
              {isEditMode ? (
                <input
                  type="email"
                  name="email"
                  value={editedData.email || ""}
                  onChange={handleChange}
                  required
                />
              ) : (
                <span>{employeeData?.email || "N/A"}</span>
              )}
            </div>
            <div className="employee-detail-item">
              <label>Phone:</label>
              {isEditMode ? (
                <input
                  type="tel"
                  name="phone"
                  value={editedData.phone || ""}
                  onChange={handleChange}
                />
              ) : (
                <span>{employeeData?.phone || "N/A"}</span>
              )}
            </div>
            <div className="employee-detail-item">
              <label>Hire Date:</label>
              <span>
                {employeeData?.hireDate
                  ? new Date(employeeData.hireDate).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>

            <div className="employee-detail-item employee-address">
              <label>Address:</label>
              {isEditMode ? (
                <textarea
                  name="Address"
                  value={editedData.Address || ""}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              ) : (
                <span>{employeeData?.Address || "N/A"}</span>
              )}
            </div>

            {/* Access Permission Display with new structure */}
            <div className="employee-detail-item full-width"> {/* Added full-width for better display */}
              <label>Access Permission:</label>
              {getAccessPermissionDisplay()}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="modal-con">
          <div className="modal-con-content">
            <LuKeyRound className="alert-icon" />
            <h2>Change Password</h2>
            <form onSubmit={handleChangePassword}>
              {!showOtpField && (
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password:</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {changePassMessage && <p>{changePassMessage}</p>}

              {showOtpField && (
                <>
                  <div className="form-group">
                    <label htmlFor="otp">OTP:</label>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength="6"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password:</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmNewPassword">Confirm New Password:</label>
                    <input
                      type="password"
                      id="confirmNewPassword"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                {!showOtpField ? (
                  <button type="button" onClick={requestOtpForPasswordChange} className="confirm-button">
                    Send OTP
                  </button>
                ) : (
                  <button type="submit" className="confirm-button">
                    Confirm Change
                  </button>
                )}
                <button type="button" onClick={closeChangePasswordModal} className="cancel-button">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirmModal && (
        <div className="modal-con">
          <div className="modal-con-content">
            <GoQuestion className="check-icon" />
            <h2>You want to save these changes?</h2>
            <p>Your profile information will be updated.</p>
            <div className="modal-actions">
              <button onClick={handleSaveLogic} className="confirm-button">
                Yes, Save
              </button>
              <button onClick={() => setShowSaveConfirmModal(false)} className="cancel-button">
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmModal && (
        <div className="modal-con">
          <div className="modal-con-content">
            <GoAlert className="alert-icon" />
            <h2>You want to discard changes?</h2>
            <p>All unsaved changes to your profile will be discarded.</p>
            <div className="modal-actions">
              <button onClick={confirmCancelAction} className="confirm-button">
                Yes, Discard
              </button>
              <button onClick={() => setShowCancelConfirmModal(false)} className="cancel-button">
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;