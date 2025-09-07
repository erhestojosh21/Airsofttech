import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaEdit,
  FaSave,
  FaTimes,
  FaStar,
  FaThumbsUp,
  FaFlag,
  FaGavel,
} from "react-icons/fa";
import { GoQuestion, GoAlert } from "react-icons/go";
import "./UserManagementDetails.css";

const UserManagementDetails = () => {
  const { user_tag } = useParams();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState({
    first_name: "Loading...",
    last_name: "Loading...",
    username: "Loading...",
    email: "Loading...",
    createdAt: "Loading...",
    warnings_count: 0,
    banned_until: null,
  });
  const [userID, setUserID] = useState(null);

  // Edit state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Orders & Reviews state
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("orders");

  // Restriction modal state
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [restrictionLevel, setRestrictionLevel] = useState(1);
  const [restrictionReason, setRestrictionReason] = useState("");
  const [banUntil, setBanUntil] = useState("");

  // Confirmation modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [restrictionLogs, setRestrictionLogs] = useState([]);


  useEffect(() => {
    if (!user_tag) {
      navigate("/admin/user-management");
      return;
    }
    fetchUserProfile(user_tag);
  }, [user_tag]);

  const fetchUserProfile = async (tag) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/${tag}`);
      const data = await res.json();

      if (res.ok) {
        setUserProfile({
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
          email: data.email,
          user_tag: data.user_tag,
          warnings_count: data.warnings_count || 0,
          banned_until: data.banned_until,
          createdAt:
            data.createdAt !== "Not Available"
              ? new Date(data.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Not Available",
        });
        setUserID(data.userId);

        fetchUserOrders(data.userId);
        fetchUserReviews(data.userId);
        fetchUserRestrictionLogs(data.userId);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const fetchUserOrders = async (id) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user-orders/${id}`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const fetchUserReviews = async (id) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user-reviews/${id}`);
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  // --- EDIT HANDLERS ---
  const handleEdit = () => {
    setIsEditMode(true);
    setEditedData({
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      username: userProfile.username,
    });
  };

  const cancelEditMode = () => {
    setIsEditMode(false);
    setEditedData({});
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/users/${user_tag}`,
        editedData
      );

      if (response.status === 200) {
        setUserProfile((prevProfile) => ({
          ...prevProfile,
          ...editedData,
        }));
        setIsEditMode(false);
        setSuccessMessage("User updated successfully!");
        setErrorMessage(null);
      }
    } catch (err) {
      console.error("Error saving user data:", err);
      setErrorMessage(err.response?.data?.error || "Failed to update user.");
      setSuccessMessage(null);
    }
    setShowSaveModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // --- RESTRICTION HANDLERS ---

  const fetchUserRestrictionLogs = async (id) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user-restriction-log/${id}`);
      const data = await res.json();
      setRestrictionLogs(data);
    } catch (err) {
      console.error("Error fetching restriction logs:", err);
    }
  };



  const openRestrictionModal = () => {
    setRestrictionLevel(userProfile.warnings_count + 1);
    setShowRestrictionModal(true);
  };

  const submitRestriction = async () => {
    try {
      const payload = {
        userId: userID,
        reason: restrictionReason,
        level: restrictionLevel,
        bannedUntil: restrictionLevel === 3 ? banUntil : null,
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/api/restrict-user`, payload);

      setUserProfile((prev) => ({
        ...prev,
        warnings_count: restrictionLevel < 3 ? restrictionLevel : 3,
        banned_until: restrictionLevel === 3 ? banUntil : prev.banned_until,
      }));

      setSuccessMessage("Restriction applied successfully!");
      setRestrictionReason("");
      setBanUntil("");
    } catch (err) {
      console.error("Error applying restriction:", err);
      setErrorMessage("Failed to apply restriction.");
    }
    setShowRestrictionModal(false);
  };

  const isBanned = !!(userProfile?.banned_until || userProfile?.banned);

  const handleUnban = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/unban-user`, {
        userId: userID,
      });
      setUserProfile((prev) => ({
        ...prev,
        banned_until: null,
        banned: 0,
        warnings_count: 0,
      }));
      setSuccessMessage("User has been unbanned.");
      setErrorMessage(null);
    } catch (err) {
      console.error("Error unbanning user:", err);
      setErrorMessage("Failed to unban user.");
    }
  };

  // --- FILTER & SEARCH ---
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "All" || order.OrderStatus === filter;
    const matchesSearch =
      searchQuery.toLowerCase() === "" ||
      order.items.some(
        (item) =>
          item.ProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.VariantName.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      new Date(order.OrderDate).toLocaleDateString().includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  // --- ACTION BUTTONS ---
  const RestrictButton = (
    <button type="button" onClick={openRestrictionModal} className="ban-btn">
      <FaGavel /> Restrict
    </button>
  );

  const UnbanButton = (
    <button type="button" onClick={handleUnban} className="unban-btn">
      <FaGavel /> Unban
    </button>
  );

  return (
    <div className="user-management-container">
      {/* --- USER CARD --- */}
      <div className="user-management-card">
        <div className="user-management-cover"></div>
        <div className="user-management-header">
          <div className="user-management-image-wrapper">
            <div className="user-management-image"></div>
          </div>
          <div className="user-management-header-text">
            <h2 className="user-management-username">{userProfile.username}</h2>
            <p className="user-management-tag">#{userProfile.user_tag}</p>
          </div>

          <div className="inventory-details-controls">
            {!isEditMode ? (
              <>
                <button type="button" onClick={handleEdit} className="edit-btn">
                  <FaEdit /> Edit User
                </button>
                {isBanned ? UnbanButton : RestrictButton}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(true)}
                  className="save-btn"
                >
                  <FaSave /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="cancel-btn"
                >
                  <FaTimes /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <p>
          ⚠️ Warnings: {userProfile.warnings_count}{" "}
          {userProfile.banned_until && (
            <span>
              | 🚫 Banned until:{" "}
              {new Date(userProfile.banned_until).toLocaleDateString()}
            </span>
          )}
        </p>

        {/* --- USER INFO --- */}
        <div className="user-management-info">
          {successMessage && (
            <div className="user-management-success">{successMessage}</div>
          )}
          {errorMessage && (
            <div className="user-management-error">{errorMessage}</div>
          )}
          <div className="user-management-grid">
            <div className="user-management-item">
              <label>Username:</label>
              {isEditMode ? (
                <input
                  type="text"
                  name="username"
                  value={editedData.username}
                  onChange={handleChange}
                />
              ) : (
                <span>{userProfile.username}</span>
              )}
            </div>
            <div className="user-management-item">
              <label>First Name:</label>
              {isEditMode ? (
                <input
                  type="text"
                  name="first_name"
                  value={editedData.first_name}
                  onChange={handleChange}
                />
              ) : (
                <span>{userProfile.first_name}</span>
              )}
            </div>
            <div className="user-management-item">
              <label>Last Name:</label>
              {isEditMode ? (
                <input
                  type="text"
                  name="last_name"
                  value={editedData.last_name}
                  onChange={handleChange}
                />
              ) : (
                <span>{userProfile.last_name}</span>
              )}
            </div>
            <div className="user-management-item">
              <label>Email Address:</label>
              <span>{userProfile.email}</span>
            </div>
            <div className="user-management-item">
              <label>Account Created:</label>
              <span>{userProfile.createdAt}</span>
            </div>
          </div>
        </div>

        {/* --- SECTION TOGGLE --- */}
        <div className="section-toggle">
          <button
            className={activeSection === "orders" ? "active" : ""}
            onClick={() => setActiveSection("orders")}
          >
            User Orders
          </button>
          <button
            className={activeSection === "reviews" ? "active" : ""}
            onClick={() => setActiveSection("reviews")}
          >
            User Reviews
          </button>

          <button
            className={activeSection === "restrictions" ? "active" : ""}
            onClick={() => setActiveSection("restrictions")}
          >
            Restrictions
          </button>
        </div>

        {/* --- ORDERS --- */}
        {activeSection === "orders" && (
          <div className="order-content">
            <h2>User Orders</h2>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by Product, Variant, or Date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="order-filters">
              {["All", "Processing", "Verified", "Shipping", "Received", "Completed"].map(
                (status) => (
                  <button
                    key={status}
                    className={filter === status ? "filter-btn active" : "filter-btn"}
                    onClick={() => setFilter(status)}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
            <div className="order-list">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <div key={order.OrderID} className="order-card">
                    <div className="order-header">
                      <h3>
                        Order #{order.OrderID} -{" "}
                        <span className={`status ${order.OrderStatus.toLowerCase()}`}>
                          {order.OrderStatus}
                        </span>
                      </h3>
                      <p className="order-date">
                        {new Date(order.OrderDate).toLocaleString()}
                      </p>
                    </div>
                    <p className="order-address">
                      📍 {order.StreetAddress}, {order.City}, {order.StateProvince},{" "}
                      {order.PostalCode}, {order.Country}
                    </p>
                    <div className="order-items">
                      {order.items.map((item) => (
                        <div key={item.OrderItemID} className="order-item">
                          <img src={item.Image} alt={item.ProductName} className="item-image" />
                          <div className="item-details">
                            <p className="item-name">{item.ProductName}</p>
                            <p className="item-variant">
                              Variation:{" "}
                              {item.RequestedVariantID
                                ? `[CUSTOM] ${item.VariantName}`
                                : item.VariantName}
                            </p>
                            <p className="item-quantity">Qty: {item.Quantity}</p>
                          </div>
                          <p className="item-price">Php. {item.Price}</p>
                        </div>
                      ))}
                    </div>
                    <p className="order-total">
                      Total Price: <strong>Php. {order.TotalAmount + order.ShippingCharge}</strong>{" "}
                      | {order.PaymentMethod}
                    </p>
                  </div>
                ))
              ) : (
                <p>No orders found for this user.</p>
              )}
            </div>
          </div>
        )}

        {/* --- REVIEWS --- */}
        {activeSection === "reviews" && (
          <div className="reviews-content">
            <h2>User Reviews</h2>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.RatingID} className="admin-review-item">
                  <div className="admin-review-header">
                    <div className="admin-review-user-info">
                      <p className="admin-review-user">{review.username}</p>
                      <p className="admin-review-date">
                        {new Date(review.CreatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="admin-review-counts">
                      <div className="admin-helpful-count">
                        <FaThumbsUp /> <span>{review.LikeCount || 0}</span>
                      </div>
                      <div className="admin-report-count">
                        <FaFlag /> <span>{review.ReportCount || 0}</span>
                      </div>
                    </div>
                  </div>
                  <p className="admin-review-date">RATING ID: {review.RatingID}</p>
                  <span className="admin-star-rating">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        color={i < review.Rating ? "#facc15" : "#d1d5db"}
                      />
                    ))}
                  </span>
                  <p className="admin-review-text">{review.Review}</p>
                </div>
              ))
            ) : (
              <p>No reviews found for this user.</p>
            )}
          </div>
        )}

        {/* --- RESTRICTION LOGS --- */}
      {activeSection === "restrictions" && (
        <div className="restriction-log-content">
          <h2>User Restriction Log</h2>
          {restrictionLogs.length > 0 ? (
            <table className="restriction-log-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Actions/ Restriction Level</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {restrictionLogs.map((log) => (
                  <tr key={log.RestrictionLogID}>
                    <td>{new Date(log.CreatedAt).toLocaleString()}</td>
                    <td>{log.Action}</td>
                    <td>{log.Reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No restrictions found for this user.</p>
          )}
        </div>
      )}





      </div>

      


      {/* --- SAVE CONFIRMATION MODAL --- */}
      {showSaveModal && (
        <div className="modal-con">
          <div className="modal-con-content">
            <GoQuestion className="check-icon" />
            <h2>You want to save these changes?</h2>
            <p>"{userProfile.username}" will be updated.</p>
            <button onClick={handleSave} className="confirm-button">
              Yes, Save
            </button>
            <button onClick={() => setShowSaveModal(false)} className="cancel-button">
              No
            </button>
          </div>
        </div>
      )}

      {/* --- CANCEL CONFIRMATION MODAL --- */}
      {showCancelModal && (
        <div className="modal-con">
          <div className="modal-con-content">
            <GoAlert className="alert-icon" />
            <h2>You want to discard changes?</h2>
            <p>"{userProfile.username}" the changes will be discarded.</p>
            <button onClick={cancelEditMode} className="confirm-button">
              Yes, Cancel
            </button>
            <button onClick={() => setShowCancelModal(false)} className="cancel-button">
              No
            </button>
          </div>
        </div>
      )}

      {/* --- RESTRICTION MODAL --- */}
      {showRestrictionModal && (
        <div className="modal-con">
          <div className="modal-con-content">
            <GoAlert className="alert-icon" />
            <h2>
              Apply Restriction Level {restrictionLevel} for {userProfile.username}?
            </h2>
            <textarea
              placeholder="Enter reason..."
              value={restrictionReason}
              onChange={(e) => setRestrictionReason(e.target.value)}
            />
            {restrictionLevel === 3 && (
              <input
                type="datetime-local"
                value={banUntil}
                onChange={(e) => setBanUntil(e.target.value)}
              />
            )}
            <div>
              <button onClick={submitRestriction} className="confirm-button">
                Submit Restriction
              </button>
              <button
                onClick={() => setShowRestrictionModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementDetails;
