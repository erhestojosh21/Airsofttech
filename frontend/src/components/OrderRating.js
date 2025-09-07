import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import "./OrderRating.css";

const OrderRating = ({ orderID, productID, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    if (!userID) return;

    const fetchProductDetails = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/get-product/${productID}`);
        const data = await res.json();
        if (res.ok) setProduct(data);
      } catch (err) {
        console.error("Error fetching product details:", err);
      }
    };

    const fetchExistingRating = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/get-rating/${orderID}/${productID}?userID=${userID}`);
        const data = await res.json();
        if (res.ok && data.rating !== null) {
          setRating(data.rating);
          setReview(data.review || "");
        } else {
          setRating(0); // Ensure rating resets for a new product
          setReview("");
        }
      } catch (err) {
        console.error("Error fetching existing rating:", err);
      }
    };

    fetchProductDetails();
    fetchExistingRating();
  }, [orderID, productID]); // Re-run when a new product is rated

  const handleSubmit = () => {
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    const userID = localStorage.getItem("userID");
    if (!userID) {
      alert("User not authenticated. Please log in.");
      return;
    }
    if (rating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }

    const requestBody = { userID, orderID, productID, rating, review };
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/add-rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      if (response.ok) {
        //alert(result.message);
        onClose(); // Ensure modal closes after rating submission
      } else {
        //alert(`Failed to submit rating: ${result.error}`);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      //alert("An error occurred. Please try again later.");
    }
    setLoading(false);
    setShowConfirm(false);
  };

  return (
    <div className="rating-modal">
      <div className="rating-content">
        <h2>Rate This Product</h2>
        {product && (
          <div className="product-info">
            <img src={product.Image} alt={product.ProductName} className="product-image" />
            <h3>{product.ProductName}</h3>
          </div>
        )}

        <div className="stars">
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
              <label key={ratingValue}>
                <input
                  type="radio"
                  name={`rating-${productID}`}
                  value={ratingValue}
                  onClick={() => setRating(ratingValue)}
                  style={{ display: "none" }}
                />
                <FaStar
                  className="star"
                  size={50}
                  color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                />
              </label>
            );
          })}
        </div>
        <textarea
          placeholder="Write your review here..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
        ></textarea>
        <div className="rating-buttons">
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
      {showConfirm && (
        <div className="rating-confirm-modal">
          <div className="rating-confirm-content">
            <p>Are you sure you want to submit your rating?</p>
            <button onClick={confirmSubmit}>Yes</button>
            <button onClick={() => setShowConfirm(false)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderRating;
