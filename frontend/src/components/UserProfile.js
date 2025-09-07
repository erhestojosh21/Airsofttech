import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./UserSidebar";
import axios from "axios"; // Import axios
import { FaEdit, FaSave, FaTimes, FaKey } from "react-icons/fa";
import "./UserProfile.css";

const UserProfile = () => {
  const navigate = useNavigate();
  const [userID, setUserID] = useState(localStorage.getItem("userID"));
  const [userProfile, setUserProfile] = useState({
    first_name: "Loading...",
    last_name: "Loading...",
    username: "Loading...",
    email: "Loading...",
    createdAt: "Loading...",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!userID) {
      navigate("/login");
      return;
    }
    fetchUserProfile(userID);
  }, [userID]);

  const fetchUserProfile = async (userID) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/user/${userID}`);
      const data = await res.json();

      if (res.ok) {
        setUserProfile({
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
          email: data.email,
          user_tag: data.user_tag,
          createdAt:
            data.createdAt !== "Not Available"
              ? new Date(data.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Not Available",
        });
      } else {
        console.error("Failed to fetch user profile");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setEditedData({
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      username: userProfile.username,
    });
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditedData({});
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/user/${userID}`,
        editedData
      );

      if (response.status === 200) {
        setUserProfile((prevProfile) => ({
          ...prevProfile,
          ...editedData,
        }));
        setIsEditMode(false);
        setSuccessMessage("Profile updated successfully!");
        setErrorMessage(null);
      }
    } catch (err) {
      console.error("Error saving user data:", err);
      setErrorMessage(err.response?.data?.error || "Failed to update profile.");
      setSuccessMessage(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="user-profile-container">
      <Sidebar />
      <div className="user-profile-first">
        <div className="cover-header"></div>
        <div className="user-profile-header-content">
          <div className="user-image-container">
            <div className="profile-image"></div>
          </div>
          <div className="user-header-text">
            <h2 className="user-full-name">
                {userProfile.username}
            </h2>
            <p className="user-role">#{userProfile.user_tag}</p>
          </div>
          <div className="inventory-details-controls">
            {!isEditMode ? (
              <>
                <button type="button" onClick={handleEdit} className="edit-btn">
                  <FaEdit /> Edit Profile
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/change-password")}
                  className="change-password-button"
                >
                  <FaKey /> Change Password
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="save-button"
                >
                  <FaSave /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="cancel-button"
                >
                  <FaTimes /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="user-profile-info-section">
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <div className="user-profile-details-grid">
            <div className="user-detail-item">
              <label>Username:</label>
              {isEditMode ? (
                <input
                  type="text"
                  name="username"
                  value={editedData.username}
                  onChange={handleChange}
                  required
                />
              ) : (
                <span>{userProfile.username}</span>
              )}
            </div>
            <div className="user-detail-item">
              <label>First Name:</label>
              {isEditMode ? (
                <>
                  <input
                    type="text"
                    name="first_name"
                    value={editedData.first_name}
                    onChange={handleChange}
                    placeholder="First Name"
                    required
                  />
                </>
              ) : (
                <span>{userProfile.first_name}</span>
              )}
            </div>
            <div className="user-detail-item">
              <label>Last Name:</label>
              {isEditMode ? (
                <input
                  type="text"
                  name="last_name"
                  value={editedData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                  required
                />
              ) : (
                <span>{userProfile.last_name}</span>
              )}
            </div>
            <div className="user-detail-item">
              <label>Email Address:</label>
              <span>{userProfile.email}</span>
            </div>
            <div className="user-detail-item">
              <label>Account Created:</label>
              <span>{userProfile.createdAt}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;