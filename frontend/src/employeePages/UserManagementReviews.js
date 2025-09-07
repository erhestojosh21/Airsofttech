import React from "react";
import { FaStar, FaThumbsUp, FaFlag } from "react-icons/fa";
import "./UserManagementDetails.css";

const UserManagementReviews = ({ reviews }) => {
  return (
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
  );
};

export default UserManagementReviews;
