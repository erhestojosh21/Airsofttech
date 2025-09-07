import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductDetails.css";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import ProductReviews from "../components/ProductReviews";
import { IoMdSend } from "react-icons/io";
import Footer from "../components/Footer";

import { GoTriangleDown, GoTriangleUp } from "react-icons/go";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantOther, setVariantOther] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [userID, setUserID] = useState(null);
  const [showRequestBox, setShowRequestBox] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    type: "",
    onConfirm: null,
  });

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (storedUserID) setUserID(storedUserID);
  }, []);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/product/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Product not found');
        }
        return res.json();
      })
      .then((data) => {
        if (!data || !data.variants || data.variants.length === 0) {
          navigate('/products');
          return;
        }
        setProduct(data);
        setSelectedVariant(data.variants[0]);
      })
      .catch((error) => {
        console.error('Error fetching product:', error);
        navigate('/products'); // Redirect to product list if error occurs
      });
  }, [id, navigate]);

  const showModal = (message, type = "", onConfirm = null) => {
    setModal({ isOpen: true, message, type, onConfirm });
  };

  const closeModal = () => {
    setModal({ isOpen: false, message: "", type: "", onConfirm: null });
  };

  const confirmModalAction = () => {
    if (modal.onConfirm) modal.onConfirm();
    closeModal();
  };

  const handleAddToCart = async () => {
    if (!userID) {
      showModal("Please log in to add items to cart.", "error");
      navigate("/login");
      return;
    }

    // Prevents adding to cart if a custom variant is described
    if (variantOther.trim()) {
      showModal("Please use the 'Submit' button to request a custom variant.", "error");
      return;
    }

    // Only proceed if a standard variant is selected
    const variantIdToUse = selectedVariant?.variantID;
    if (!variantIdToUse) {
      showModal("Please select a variant to add to your cart.", "error");
      return;
    }

    const cartItem = {
      userID,
      productId: parseInt(id),
      variantId: variantIdToUse, // variantOther is no longer sent here
      quantity: parseInt(quantity),
    };

    const addToCartConfirmed = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cartItem),
        });

        const data = await response.json();
        if (response.ok) {
          showModal(
            `${product.name} (${selectedVariant.name}) added to cart!`,
            "success"
          );
        } else {
          showModal(`❌ Error: ${data.error}`, "error");
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        showModal("❌ Could not add to cart.", "error");
      }
    };

    showModal(
      `Add ${product.name} (${selectedVariant.name}) to your cart?`,
      "confirm",
      addToCartConfirmed
    );
  };

  const handleRequestOtherVariant = async () => {
    if (!userID) {
      showModal("Please log in to request a variant.", "error");
      navigate("/login");
      return;
    }

    const customRequest = variantOther.trim();

    if (!customRequest) {
      showModal("Please enter a custom variant request.", "error");
      return;
    }

    const requestItem = {
      userID,
      productId: parseInt(id),
      requestedVariant: customRequest,
      quantity: parseInt(quantity),
    };

    const confirmRequest = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/request-variant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestItem),
        });

        const data = await response.json();

        if (response.ok) {
          showModal(`Requested variant "${customRequest}" successfully added!`, "success");
          setVariantOther(""); // Reset textarea
        } else {
          showModal(`❌ Error: ${data.error}`, "error");
        }
      } catch (error) {
        console.error("Error requesting variant:", error);
        showModal("❌ Could not send variant request.", "error");
      }
    };

    showModal(`Send request for variant: "${customRequest}"?`, "confirm", confirmRequest);
  };

  // New handler for the "View Models in This Category" button
  const handleViewCategoryModels = () => {
    if (product?.categoryId) {
      navigate(`/models/category/${product.categoryId}`);
    } else {
      showModal("This product does not have an associated model category.", "error");
    }
  };

  if (!product) return <p>Loading...</p>;

  return (
    <div>
      <div className="product-details-container">
        <div className="product-image-section">
          <img
            src={selectedVariant?.image || product.image}
            alt={product.name}
            className="main-product-image"
          />
          
          {/* Button to view models of the same category */}
          {product.categoryId && (
            <button
              className="view-category-models-btn"
              onClick={handleViewCategoryModels}
            >
              View 3D Model
            </button>
          )}

          <p className="product-shop-description">{product.description}</p>
        </div>

        <div className="product-info">
          <h2 className="product-title">{product.name}</h2>

          <div className="product-rating">
            <span className="stars">
              {Array.from({ length: 5 }, (_, i) =>
                i < Math.round(product.averageRating) ? (
                  <AiFillStar key={i} className="star filled" />
                ) : (
                  <AiOutlineStar key={i} className="star" />
                )
              )}
            </span>
            <span className="rating-text">
              {product.averageRating} ({product.ratingCount}{" "}
              {product.ratingCount === 1 ? "review" : "reviews"})
            </span>
          </div>

          <p className="product-date-creation">Date to create: 5 - 7 day/s</p>

          <h3 className="product-price">
            <span style={{ fontSize: "24px"}}>₱</span>
            {selectedVariant?.price.toLocaleString() ||
              product.basePrice.toLocaleString()}
          </h3>

          

          <div className="variant-selection">
            <h4>Variations:</h4>
            <div className="variants-container">
              {product.variants.map((variant) => (
                <label
                  key={variant.variantID}
                  className={`variant-option ${
                    selectedVariant?.variantID === variant.variantID
                      ? "selected"
                      : ""
                  } ${variant.quantity === 0 ? "grayed-out" : ""}`}
                  onClick={() => {
                    if (variant.quantity > 0) {
                      setSelectedVariant(variant);
                      setVariantOther("");
                    }
                  }}
                >
                  <span className="variant-name">{variant.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="custom-variant">
            <div>
              <button
                className="expand-request-btn"
                onClick={() => setShowRequestBox(!showRequestBox)}
              >
                {showRequestBox ? (
                  <>
                    Hide Request Box <GoTriangleUp />
                  </>
                ) : (
                  <>
                    Request for a Custom Variant <GoTriangleDown />
                  </>
                )}

              </button>
            </div>

          
        </div>
        {showRequestBox && (
          <>
            <p className="request-label">Describe your desire <span className="request-guide">{product.requestGuide ? product.requestGuide : "request"}</span> of this product:</p>
              <div className="variant-request-form">
                
                <textarea
                  id="variantOther"
                  placeholder="Type your custom request here..."
                  value={variantOther}
                  onChange={(e) => setVariantOther(e.target.value)}
                  rows={3}
                  maxLength={150}
                  className="variant-textarea"
                />

                <button
                  className="request-other"
                  onClick={handleRequestOtherVariant}
                  disabled={!variantOther.trim()}
                >
                  <><IoMdSend /> Submit</>
                  
                </button>
              </div>
            </>

          )}


          <div className="quantity-container">
            <p>Quantity:</p>
            <button
              className="quantity-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </button>
            <input
              type="text"
              className="quantity-input"
              value={quantity}
              readOnly

              max="10"
              min="1"
            />
            <button
              className="quantity-btn"
              onClick={() =>
                setQuantity(
                  Math.min(10, quantity + 1)
                )
              }
            >
              +
            </button>
          </div>

          <div className="product-actions">
            <button
              className="buy-now"
              onClick={() => navigate("/cart")}
              style={{ cursor: "pointer" }}
            >
              View Cart
            </button>

            <button className="cart-now" onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
          
        </div>
      </div>

      <div className="product-terms-container">
        <div className="product-terms">
            <h4>Terms and Conditions for Pre-order Products:</h4>

                <p><strong>1. Reservation:</strong> By placing a pre-order, you're reserving the right to purchase the product before its official release.</p>

                <p><strong>2. Payment:</strong> Full payment is required at the time of placing the pre-order.</p>

                <p><strong>3. Shipping Charges (Cash on Delivery):</strong> Please note that shipping charges, if applicable, will be collected as cash on delivery upon arrival of your pre-ordered product.</p>

                <p><strong>4. Fulfillment:</strong> We'll make efforts to deliver within the estimated timeframe, but delays may occur.</p>

                <p><strong>5. Availability:</strong> If we can't fulfill the pre-order due to unforeseen circumstances, we reserve the right to cancel and provide a full refund.</p>

                <p><strong>6. Price:</strong> The listed price at the time of pre-order is the amount you'll pay. Price changes won't apply to existing pre-orders.</p>

                <p><strong>7. Shipping and Delay:</strong> Estimated shipping dates are subject to change without notice.</p>

                <p><strong>8. Non-transferable:</strong> Pre-orders are non-transferable.</p>
            </div>
      </div>

      {modal.isOpen && (
        <div className="modal-con">
          <div className="modal-con-content">
            <p>{modal.message}</p>
            {modal.type === "confirm" ? (
              <>
                <button onClick={confirmModalAction} className="confirm-button">
                  Confirm
                </button>
                <button onClick={closeModal} className="cancel-button">
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={closeModal} className="confirm-button">
                OK
              </button>
            )}
          </div>
        </div>
      )}

      <ProductReviews productId={id} />

      <footer className="footer-container">
        <Footer />
      </footer>
    </div>
  );
};

export default ProductDetails;