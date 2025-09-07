import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaStar, FaThumbsUp, FaFlag, FaArrowLeft } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import "./ProductReviewAdmin.css";


const token = localStorage.getItem("token");
let employeeId = null;

if (token) {
  try {
    const decoded = jwtDecode(token);
    employeeId = decoded.employeeId; // get employeeId from token
  } catch (err) {
    console.error("Invalid token:", err);
  }
}


const ProductReviewAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortOption, setSortOption] = useState("reported");

  const reviewRefs = useRef({});

  const [showReplyModal, setShowReplyModal] = useState(false);
  const [currentReply, setCurrentReply] = useState("");
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  // Extract highlight ID from query string
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("highlight");

  useEffect(() => {
    fetchProductAndReviews();
  }, [id]);

  useEffect(() => {
    if (highlightId && reviewRefs.current[highlightId]) {
      setTimeout(() => {
        reviewRefs.current[highlightId].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        reviewRefs.current[highlightId].classList.add("highlighted-review");
        setTimeout(() => {
          reviewRefs.current[highlightId]?.classList.remove("highlighted-review");
        }, 3000);
      }, 500);
    }
  }, [reviews, highlightId]);

  const fetchProductAndReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const productResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/get-product/${id}`);
      setProduct(productResponse.data);

      const reviewsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/get-product-reviews/${id}`
      );
      let reviewsData = reviewsResponse.data;

      if (reviewsData.length > 0) {
        const ratingIds = reviewsData.map((r) => r.RatingID).join(",");

        const reportsCountResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/reports-count?ratingIds=${ratingIds}`
        );
        const reportCounts = reportsCountResponse.data.reportCounts || {};

        reviewsData = reviewsData.map((review) => ({
          ...review,
          ReportCount: reportCounts[review.RatingID] || 0,
        }));
      }

      setReviews(reviewsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch product reviews.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/delete-review/${reviewId}`
        );
        setReviews(reviews.filter((review) => review.RatingID !== reviewId));
      } catch (err) {
        console.error("Error deleting review:", err);
        alert("Failed to delete the review.");
      }
    }
  };

  const handleReply = (reviewId, existingReply = "") => {
    setSelectedReviewId(reviewId);
    setCurrentReply(existingReply);
    setEditingReplyId(existingReply ? reviewId : null);
    setShowReplyModal(true);
  };


  const submitReply = async () => {
    try {
      if (editingReplyId) {
        // Update reply
        await axios.put(`${process.env.REACT_APP_API_URL}/api/review-replies/${editingReplyId}`, {
          ReplyText: currentReply,
        });
        setReviews(reviews.map(r =>
          r.RatingID === editingReplyId ? { ...r, AdminReply: currentReply } : r
        ));
      } else {
        // Add reply
        await axios.post(`${process.env.REACT_APP_API_URL}/api/review-replies`, {
          RatingID: selectedReviewId,
          EmployeeID: employeeId, 
          ReplyText: currentReply,
        });
        setReviews(reviews.map(r =>
          r.RatingID === selectedReviewId ? { ...r, AdminReply: currentReply } : r
        ));
      }
      setShowReplyModal(false);
      setCurrentReply("");
    } catch (err) {
      console.error("Error submitting reply:", err);
      alert("Failed to submit reply.");
    }
  };


  const handleDeleteReply = async (reviewId) => {
    if (window.confirm("Delete this reply?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/review-replies/${reviewId}`);
        setReviews(reviews.map(r =>
          r.RatingID === reviewId ? { ...r, AdminReply: null } : r
        ));
      } catch (err) {
        console.error("Error deleting reply:", err);
        alert("Failed to delete reply.");
      }
    }
  };


  const handleGoBack = () => {
    navigate(-1);
  };

  const totalRatings = reviews.length;
  const averageRating =
    totalRatings > 0
      ? (
          reviews.reduce((acc, review) => acc + review.Rating, 0) / totalRatings
        ).toFixed(1)
      : 0;

  const ratingCounts = {};
  for (let i = 1; i <= 5; i++) {
    ratingCounts[i] = reviews.filter((review) => review.Rating === i).length;
  }

  const filteredReviews = reviews
    .filter((review) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        review.username.toLowerCase().includes(searchLower) ||
        review.Review.toLowerCase().includes(searchLower);
      const matchesRating =
        ratingFilter === "all" || review.Rating === parseInt(ratingFilter);
      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      if (sortOption === "helpful") {
        return (b.HelpfulCount || 0) - (a.HelpfulCount || 0);
      }
      if (sortOption === "reported") {
        return (b.ReportCount || 0) - (a.ReportCount || 0);
      }
      return new Date(b.CreatedAt) - new Date(a.CreatedAt);
    });

  if (loading) {
    return <div className="product-admin-loading-container">Loading...</div>;
  }

  if (error) {
    return <div className="product-admin-error-container">{error}</div>;
  }

  if (!product) {
    return (
      <div className="product-admin-error-container">Product not found.</div>
    );
  }

  return (
    <div className="product-review-admin-wrapper">
      {/* Header */}
      <div className="admin-header-container">
        <button onClick={handleGoBack} className="admin-back-button">
          <FaArrowLeft />
        </button>
        <h3>Reviews for {product.ProductName}</h3>
      </div>

      {/* Product Info */}
      <div className="admin-product-info-box">
        {product.Image && (
          <img
            src={
              product.Image.startsWith("data:image")
                ? product.Image
                : `data:image/jpeg;base64,${product.Image}`
            }
            alt={product.ProductName}
            className="admin-product-image"
          />
        )}
        <div className="admin-product-details">
          <h4>{product.ProductName}</h4>
          <div className="admin-review-stats">
            <span className="admin-star-rating-display">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  color={i < Math.round(averageRating) ? "#facc15" : "#d1d5db"}
                />
              ))}
            </span>
            <span className="admin-review-count-text">
              {averageRating} average based on {totalRatings} reviews
            </span>
          </div>
        </div>
      </div>

      {/* Rating Summary */}
      <div className="rating-summary-section">
        <div className="rating-summary">
          <div className="average-rating-display">
            <h3>{averageRating} out of 5</h3>
            <p>{totalRatings} Ratings</p>
          </div>
          <div className="rating-bars">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="rating-bar">
                <span className="star-label">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} color={i < star ? "#FFD700" : "#ccc"} />
                  ))}
                </span>
                <div className="bar">
                  <div
                    className="filled-bar"
                    style={{
                      width: `${
                        (ratingCounts[star] / totalRatings) * 100 || 0
                      }%`,
                    }}
                  ></div>
                </div>
                <span>{ratingCounts[star] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="admin-controls-row">
        {/* Search */}
        <div className="admin-search-bar">
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <p className="admin-filters-title">Filtered by:</p>
        {/* Star Filter Dropdown */}
        <div>
          <select
            className="admin-filter-dropdown"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        {/* Sort Buttons */}
        <div>
          <select
            className="admin-sort-dropdown"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="newest">Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="reported">Most Reported</option>
          </select>
        </div>
      </div>

      {/* Review List */}
      <div className="admin-reviews-list">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <div
              key={review.RatingID}
              ref={(el) => (reviewRefs.current[review.RatingID] = el)}
              className="admin-review-item"
            >
              <div className="admin-review-header">
                <div className="admin-review-user-info">
                  <p
                    className="admin-review-user clickable-username"
                    onClick={() =>
                      navigate(`/admin/user-management/${review.user_tag}`)
                    }
                  >
                    {review.username}
                  </p>
                  <p className="admin-review-date">
                    {new Date(review.CreatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="admin-review-counts">
                  <div className="admin-helpful-count">
                    <FaThumbsUp />
                    <span>{review.HelpfulCount || 0}</span>
                  </div>
                  <div className="admin-report-count">
                    <FaFlag />
                    <span>{review.ReportCount || 0}</span>
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

              

              <div className="admin-reply-section">
                {review.AdminReply ? (
                  <div className="admin-reply-box">
                    <p>
                      <strong>Reply ({review.EmployeeUsername || "Admin"}):</strong>{" "}
                      {review.AdminReply}
                    </p>
                    <small>{new Date(review.ReplyCreatedAt).toLocaleDateString()}</small>
                    <div className="admin-reply-actions">
                      <button onClick={() => handleReply(review.RatingID, review.AdminReply)}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteReply(review.ReplyID)}>Delete</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => handleReply(review.RatingID)}>Reply</button>
                )}
              </div>

              <div className="admin-review-actions">
                <button
                  className="admin-delete-button"
                  onClick={() => handleDeleteReview(review.RatingID)}
                >
                  Delete
                </button>
              </div>

            </div>
          ))
        ) : (
          <p className="admin-no-reviews-found">
            No reviews found for this filter.
          </p>
        )}
      </div>

      {showReplyModal && (
      <div className="modal-con">
        <div className="modal-con-content">
          <h2>{editingReplyId ? "Edit Reply" : "Add Reply"}</h2>
          <textarea
            placeholder="Enter reply..."
            value={currentReply}
            onChange={(e) => setCurrentReply(e.target.value)}
          />
          <div>
            <button onClick={submitReply} className="confirm-button">
              {editingReplyId ? "Update Reply" : "Submit Reply"}
            </button>
            <button onClick={() => setShowReplyModal(false)} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default ProductReviewAdmin;
