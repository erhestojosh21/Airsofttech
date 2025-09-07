import React, { useEffect, useState } from "react";
import { FaStar, FaThumbsUp } from "react-icons/fa";
import { FaFlag } from "react-icons/fa";
import { GoAlert } from "react-icons/go";
import "./ProductReviews.css";

const ProductReviews = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalRatings, setTotalRatings] = useState(0);
    const [ratingCounts, setRatingCounts] = useState({});
    const [filter, setFilter] = useState("all");
    const [reportModal, setReportModal] = useState({
        isOpen: false,
        reviewId: null,
        reportType: "",
        message: ""
    });
    const userId = localStorage.getItem("userID");
    const [loggedInUsername, setLoggedInUsername] = useState(null);

    const fetchReviewsAndStatus = async () => {
        try {
            const reviewsRes = await fetch(`${process.env.REACT_APP_API_URL}/api/get-product-reviews/${productId}`);
            const reviewsData = await reviewsRes.json();

            // Calculate overall stats from the fetched reviews
            const total = reviewsData.reduce((sum, review) => sum + review.Rating, 0);
            const counts = reviewsData.reduce((acc, review) => {
                acc[review.Rating] = (acc[review.Rating] || 0) + 1;
                return acc;
            }, {});

            setAverageRating(reviewsData.length > 0 ? (total / reviewsData.length).toFixed(1) : 0);
            setTotalRatings(reviewsData.length);
            setRatingCounts(counts);

            let reviewsWithStatus = reviewsData.map(review => ({
                ...review,
                isReported: false,
                isLiked: false,
            }));

            if (userId && reviewsWithStatus.length > 0) {
                const ratingIds = reviewsWithStatus.map(review => review.RatingID).join(',');
                
                const [reportsRes, likesRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_API_URL}/api/user-reports?userId=${userId}&ratingIds=${ratingIds}`),
                    fetch(`${process.env.REACT_APP_API_URL}/api/user-likes?userId=${userId}&ratingIds=${ratingIds}`)
                ]);

                const reportsData = await reportsRes.json();
                const likesData = await likesRes.json();

                const reportedIdsSet = new Set(reportsData.reportedReviewIds);
                const likedIdsSet = new Set(likesData.likedReviewIds);

                reviewsWithStatus = reviewsWithStatus.map(review => ({
                    ...review,
                    isReported: reportedIdsSet.has(review.RatingID),
                    isLiked: likedIdsSet.has(review.RatingID),
                }));
            }
            setReviews(reviewsWithStatus);
        } catch (error) {
            console.error("Error fetching reviews and status:", error);
        }
    };

    // New useEffect to fetch the logged-in user's username
    useEffect(() => {
        const fetchLoggedInUsername = async () => {
            if (userId) {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/${userId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setLoggedInUsername(data.username);
                    } else {
                        console.error("Failed to fetch logged-in user's username.");
                        setLoggedInUsername(null);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setLoggedInUsername(null);
                }
            }
        };

        fetchLoggedInUsername();
        fetchReviewsAndStatus(); // Also call the main review fetch here
    }, [productId, userId]); // Dependency array to re-run on product or user change

    const handleReportSubmit = async () => {
        if (!reportModal.reportType) {
            alert("Please select a report type.");
            return;
        }

        try {
            if (!userId) {
                alert("You must be logged in to report a review.");
                setReportModal({ ...reportModal, isOpen: false });
                return;
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/report-review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: parseInt(userId),
                    ratingId: reportModal.reviewId,
                    reportType: reportModal.reportType,
                    reportReason: reportModal.message
                }),
            });

            if (response.ok) {
                alert("Report submitted successfully.");
                setReportModal({ isOpen: false, reviewId: null, reportType: "", message: "" });
                setReviews(prevReviews =>
                    prevReviews.map(review =>
                        review.RatingID === reportModal.reviewId
                            ? { ...review, isReported: true }
                            : review
                    )
                );
            } else {
                const data = await response.json();
                alert(data.error || "Failed to submit report.");
            }
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("An error occurred while submitting the report.");
        }
    };

    const handleToggleLike = async (ratingId) => {
        if (!userId) {
            alert("You must be logged in to like a review.");
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/toggle-like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: parseInt(userId), ratingId }),
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(prevReviews =>
                    prevReviews.map(review => {
                        if (review.RatingID === ratingId) {
                            return {
                                ...review,
                                isLiked: data.action === "liked",
                                HelpfulCount: data.action === "liked" ? review.HelpfulCount + 1 : review.HelpfulCount - 1,
                            };
                        }
                        return review;
                    })
                );
            } else {
                console.error("Failed to toggle like");
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const filteredReviews = filter === "all"
        ? reviews
        : reviews.filter((review) => review.Rating === parseInt(filter));

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="reviews-container">
            <h2>Customer Reviews</h2>
            <div className="rating-summary">
                <div className="average-rating">
                    <h3>{averageRating} out of 5</h3>
                    <div className="stars">
                        {[...Array(5)].map((_, i) => (
                            <FaStar key={i} color={i < Math.round(averageRating) ? "#FFD700" : "#ccc"} />
                        ))}
                    </div>
                    <p>{totalRatings} Ratings</p>
                </div>
                <div className="rating-bars">
                    {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="rating-bar" onClick={() => setFilter(star.toString())}>
                            <span className="star-label">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar key={i} color={i < star ? "#FFD700" : "#ccc"} />
                                ))}
                            </span>
                            <div className="bar">
                                <div
                                    className="filled-bar"
                                    style={{
                                        width: `${(ratingCounts[star] / totalRatings) * 100 || 0}%`
                                    }}
                                ></div>
                            </div>
                            <span>{ratingCounts[star] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="filter-buttons">
                <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>All</button>
                {[5, 4, 3, 2, 1].map((star) => (
                    <button
                        key={star}
                        onClick={() => setFilter(star.toString())}
                        className={filter === star.toString() ? "active" : ""}
                    >
                        {star} <FaStar />
                    </button>
                ))}
            </div>

            <div className="reviews-list">
                {filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => (
                        <div key={review.RatingID} className="review">
                            <div className="review-content">
                                <div className="review-header">
                                    <div className="review-profile">
                                        <div className="profile-image-container">
                                            <div className="profile-image"></div>
                                        </div>
                                        <div className="review-username-date">
                                            <h4>{review.username}</h4>
                                            <p className="user-review-date">{formatDate(review.CreatedAt)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="review-stars">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} color={i < review.Rating ? "#FFD700" : "#ccc"} />
                                    ))}
                                </div>
                                <p>{review.Review}</p>

                                <button
                                    className={`helpful-button ${review.isLiked ? 'liked' : ''}`}
                                    onClick={() => handleToggleLike(review.RatingID)}
                                    >
                                    <FaThumbsUp /> Helpful ({review.HelpfulCount})
                                </button>

                                {review.AdminReply && (
                                <div className="admin-reply">
                                    <p>Admin replies:</p>
                                    <p>{review.AdminReply}</p>
                                    <div className="review-username-date">
                                    <p className="user-review-date">{formatDate(review.ReplyCreatedAt)}</p>
                                    </div>
                                </div>
                                )}
                            </div>

                            <button
                                className="review-report-button"
                                onClick={() => setReportModal({ ...reportModal, isOpen: true, reviewId: review.RatingID })}
                                disabled={review.isReported}
                                style={{ cursor: review.isReported ? 'not-allowed' : 'pointer' }}
                                >
                                <FaFlag /> {review.isReported ? 'Reported' : 'Report'}
                            </button>
                        </div>
                    ))
                ) : (
                    <p>No reviews available for this rating.</p>
                )}
            </div>

            {reportModal.isOpen && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <GoAlert className="alert-icon" />
                        <h2>Why are you reporting this comment?</h2>
                        <p>Let Us know the reason for your report, it will be reviewed by our team to address the issue.</p>
                        <div className="modal-select-report">
                            <select
                                value={reportModal.reportType}
                                onChange={(e) => setReportModal({ ...reportModal, reportType: e.target.value })}
                            >
                                <option value="">Select a reason</option>
                                <option value="Inappropriate">Inappropriate</option>
                                <option value="Misleading">Misleading</option>
                                <option value="Spam">Spam</option>
                                <option value="Threat">Threat</option>
                                <option value="Others">Others</option>
                            </select>
                            {reportModal.reportType === "Others" && (
                                <textarea
                                    placeholder="Please provide more details..."
                                    value={reportModal.message}
                                    onChange={(e) => setReportModal({ ...reportModal, message: e.target.value })}
                                />
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="confirm-button" onClick={handleReportSubmit}>Submit</button>
                            <button className="cancel-button" onClick={() => setReportModal({ isOpen: false, reviewId: null, reportType: "", message: "" })}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductReviews;