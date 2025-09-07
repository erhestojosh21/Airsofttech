import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEdit, FaTrashAlt, FaSave, FaTimes } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { GoAlert } from "react-icons/go"; // For alert icon in modal
import "./CartPage.css"; // Reuse styling
import { RiDeleteBin6Line } from "react-icons/ri"; 
import { GoQuestion } from "react-icons/go"; 

const RequestedPage = () => {
  const [variants, setVariants] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editedVariantName, setEditedVariantName] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [visibleActionsId, setVisibleActionsId] = useState(null);

  // States for Delete Confirmation Modal
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);

  // States for Save Confirmation Modal
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [variantToSave, setVariantToSave] = useState(null);

  // States for Cancel Confirmation Modal
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [variantToCancel, setVariantToCancel] = useState(null);

  const userID = localStorage.getItem("userID");
  const navigate = useNavigate();

  // Ref for handling clicks outside the dropdown
  // This ref should be on the dropdown menu itself, or its immediate container that should NOT trigger close
  const actionDropdownRef = useRef(null);
  // Ref for auto-focusing the edit input
  const editInputRef = useRef(null);

  useEffect(() => {
    if (userID) {
      fetchRequestedVariants();
    }
  }, [userID]);

  // Effect to handle clicks outside the dropdown menu
  useEffect(() => {
    function handleClickOutside(event) {
      // Only close if the click is outside the dropdown AND the three-dots icon itself
      if (
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target) &&
        !event.target.classList.contains("three-dots-icon")
      ) {
        // Added check for icon click
        setVisibleActionsId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Effect to auto-focus the input when editing mode is enabled
  useEffect(() => {
    if (editingVariantId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingVariantId]);

  const fetchRequestedVariants = () => {
    fetch(`${process.env.REACT_APP_API_URL}/requested-variants/${userID}`)
      .then((res) => res.json())
      .then((data) => {
        const withQuantities = data.map((v) => ({
          ...v,
          quantity: v.quantity || 1,
        }));
        setVariants(withQuantities);
        setSuccessMessage(null);
        setErrorMessage(null);
      })
      .catch((err) => {
        console.error("Failed to fetch requested variants:", err);
        setVariants([]);
        setErrorMessage("Failed to load requested variants.");
      });
  };

  const handleSelectItem = (id, status) => {
    if (status !== 1) return;

    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const approved = variants.filter((v) => v.Status === 1);
      setSelectedItems(new Set(approved.map((v) => v.RequestedVariantID)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleQuantityChange = (id, value) => {
    let newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
    if (newQuantity > 50) newQuantity = 50;

    setVariants((prev) =>
      prev.map((item) =>
        item.RequestedVariantID === id
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const updateQuantity = (id, newQuantity) => {
    setVariants((prev) =>
      prev.map((item) =>
        item.RequestedVariantID === id
          ? { ...item, quantity: Math.max(1, Math.min(50, newQuantity)) }
          : item
      )
    );
  };

  const selectedVariants = variants.filter(
    (v) => selectedItems.has(v.RequestedVariantID) && v.Status === 1
  );
  const totalPrice = selectedVariants.reduce(
    (sum, v) => sum + (v.Price || 0) * v.quantity,
    0
  );

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      alert("Please select at least one approved item to checkout.");
      return;
    }
    navigate("/checkout-request", {
      state: {
        selectedItems: selectedVariants,
        totalSelectedPrice: totalPrice,
        isRequestedCheckout: true,
      },
    });
  };

  // --- Action Handlers ---
  const toggleActions = (id, event) => {
    // Stop propagation to prevent immediate closing when three-dots icon is clicked
    event.stopPropagation();
    setVisibleActionsId(visibleActionsId === id ? null : id);
    setEditingVariantId(null); // Close edit mode if dropdown is toggled
  };

  const handleEditClick = (variant, event) => {
    event.stopPropagation(); // Prevent closing dropdown immediately
    setEditingVariantId(variant.RequestedVariantID);
    setEditedVariantName(variant.RequestedVariantName);
    setVisibleActionsId(null); // Close dropdown after selecting edit
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const saveEditedVariant = async (variantId) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/requested-variant/${variantId}`,
        { RequestedVariantName: editedVariantName }
      );
      if (response.status === 200) {
        setSuccessMessage("Variant updated successfully!");
        setErrorMessage(null);
        setVariants((prevVariants) =>
          prevVariants.map((v) =>
            v.RequestedVariantID === variantId
              ? { ...v, RequestedVariantName: editedVariantName }
              : v
          )
        );
        setEditingVariantId(null);
        setEditedVariantName("");
      }
    } catch (error) {
      console.error("Error updating variant name:", error);
      setErrorMessage(
        error.response?.data?.error || "Failed to update variant name."
      );
      setSuccessMessage(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingVariantId(null);
    setEditedVariantName("");
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleDeleteClick = (variant, event) => {
    event.stopPropagation(); // Prevent closing dropdown immediately
    setVisibleActionsId(null); // Close dropdown after clicking delete
    setVariantToDelete(variant);
    setShowDeleteConfirmation(true);
  };

  const confirmDeletion = async () => {
    if (!variantToDelete) return;
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/requested-variant/${variantToDelete.RequestedVariantID}`
      );
      if (response.status === 200) {
        setSuccessMessage("Variant deleted successfully!");
        setErrorMessage(null);
        setVariants((prevVariants) =>
          prevVariants.filter(
            (v) => v.RequestedVariantID !== variantToDelete.RequestedVariantID
          )
        );
        setSelectedItems((prevSelected) => {
          const newSelected = new Set(prevSelected);
          newSelected.delete(variantToDelete.RequestedVariantID);
          return newSelected;
        });
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
      setErrorMessage(
        error.response?.data?.error || "Failed to delete variant."
      );
      setSuccessMessage(null);
    } finally {
      setShowDeleteConfirmation(false);
      setVariantToDelete(null);
    }
  };

  const cancelDeletion = () => {
    setShowDeleteConfirmation(false);
    setVariantToDelete(null);
  };

  // --- Functions for Save Confirmation Modal ---
  const handleSaveClick = (variant) => {
    setVariantToSave(variant);
    setShowSaveConfirmation(true);
  };

  const confirmSave = () => {
    if (variantToSave) {
      saveEditedVariant(variantToSave.RequestedVariantID);
    }
    setShowSaveConfirmation(false);
    setVariantToSave(null);
  };

  const cancelSave = () => {
    setShowSaveConfirmation(false);
    setVariantToSave(null);
  };

  // --- Functions for Cancel Confirmation Modal ---
  const handleCancelClick = (variant) => {
    setVariantToCancel(variant);
    setShowCancelConfirmation(true);
  };

  const confirmCancel = () => {
    handleCancelEdit();
    setShowCancelConfirmation(false);
    setVariantToCancel(null);
  };

  const cancelConfirmation = () => {
    setShowCancelConfirmation(false);
    setVariantToCancel(null);
  };

  return (
    <div className="cart-container">
      <h2>Requested Product Variants</h2>
      <p>
        <a href="/cart">← Back to Cart</a>
      </p>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {variants.length === 0 ? (
        <p className="empty-cart-message">No requested variants yet.</p>
      ) : (
        <table className="cart-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    selectedItems.size > 0 &&
                    selectedItems.size ===
                      variants.filter((v) => v.Status === 1).length &&
                    variants.filter((v) => v.Status === 1).length > 0
                  }
                />
                <label className="select-all-label">All</label>
              </th>
              <th className="product-col">Product Details</th>
              <th className="price-col">Unit Price</th>
              <th className="quantity-col">Quantity</th>
              <th className="total-price-col">Total</th>
              <th className="request-date-col">Request Date</th>
              <th className="status-col">Status</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr
                key={variant.RequestedVariantID}
                className={variant.Status !== 1 ? "sold-out" : ""}
              >
                <td className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(variant.RequestedVariantID)}
                    onChange={() =>
                      handleSelectItem(variant.RequestedVariantID, variant.Status)
                    }
                    disabled={variant.Status !== 1}
                  />
                </td>
                <td className="product-col">
                  <span className="product-name-cell">
                    <img
                      src={
                        variant.image ||
                        "https://placehold.co/100x100/A0A0A0/FFFFFF?text=No+Image"
                      }
                      alt="Variant"
                      className="product-thumbnail"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/100x100/A0A0A0/FFFFFF?text=No+Image";
                      }}
                    />
                    <div className="product-name-desc">
                      <h3>{variant.ProductName}</h3>
                      {editingVariantId === variant.RequestedVariantID ? (
                        <input
                          type="text"
                          value={editedVariantName}
                          onChange={(e) => setEditedVariantName(e.target.value)}
                          className="edit-variant-input"
                          ref={editInputRef}
                        />
                      ) : (
                        <p>
                          <strong>Variant: </strong>
                          {variant.RequestedVariantName}
                        </p>
                      )}
                      {variant.Status !== 1 && (
                        <p className="sold-out-text">
                          {variant.Status === 2 ? "REJECTED" : "PENDING"}
                        </p>
                      )}
                    </div>
                  </span>
                </td>
                <td className="price-col">
                  {variant.Price === 0 ||
                  variant.Price === undefined ||
                  variant.Price === null
                    ? "TBD"
                    : `₱${Number(variant.Price).toLocaleString()}`}
                </td>
                <td className="quantity-col">
                  <div className="cart-quantity">
                    <button
                      onClick={() =>
                        updateQuantity(variant.RequestedVariantID, variant.quantity - 1)
                      }
                      disabled={variant.quantity <= 1 || variant.Status !== 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={variant.quantity}
                      onChange={(e) =>
                        handleQuantityChange(variant.RequestedVariantID, e.target.value)
                      }
                      onBlur={() =>
                        updateQuantity(variant.RequestedVariantID, variant.quantity)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          updateQuantity(variant.RequestedVariantID, variant.quantity);
                      }}
                      disabled={variant.Status !== 1}
                    />
                    <button
                      onClick={() =>
                        updateQuantity(variant.RequestedVariantID, variant.quantity + 1)
                      }
                      disabled={variant.quantity >= 10 || variant.Status !== 1}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="total-price-col">
                  {variant.Price
                    ? `₱${(variant.Price * variant.quantity).toLocaleString()}`
                    : "TBD"}
                </td>
                <td className="request-date-col">
                  {variant.RequestDate
                    ? new Date(variant.RequestDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="status-col">
                  <span
                    className={`status-badge ${
                      variant.Status === 1
                        ? "status-approved"
                        : variant.Status === 2
                        ? "status-rejected"
                        : "status-pending"
                    }`}
                  >
                    {variant.Status === 1
                      ? "Approved"
                      : variant.Status === 2
                      ? "Rejected"
                      : "Pending"}
                  </span>
                </td>
                <td
                  className="actions-col"
                  style={{ position: "relative", textAlign: "right" }}
                >
                  {editingVariantId === variant.RequestedVariantID ? (
                    <div className="action-buttons-group">
                      <button
                        onClick={() => handleSaveClick(variant)}
                        className="action-save-btn"
                      >
                        <FaSave /> Save
                      </button>
                      <button
                        onClick={() => handleCancelClick(variant)}
                        className="action-cancel-btn"
                      >
                        <FaTimes /> Discard
                      </button>
                    </div>
                  ) : (
                    <div className="action-buttons-group">
                      <button
                        onClick={(e) => handleEditClick(variant, e)}
                        className="action-edit-btn"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(variant, e)}
                        className="action-delete-btn"
                      >
                        <FaTrashAlt /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="checkout-footer">
        <div className="checkout-details">
          <span>
            Total Selected: <strong>{selectedItems.size}</strong>
          </span>
          <span>
            Total Price: <strong>₱{totalPrice.toLocaleString()}</strong>
          </span>
        </div>
        <button
          className="checkout-button"
          disabled={selectedItems.size === 0}
          onClick={handleCheckout}
        >
          CHECKOUT SELECTED
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && variantToDelete && (
        <div className="modal-con">
          <div className="modal-con-content">
            <RiDeleteBin6Line className="deletion-icon" />
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete the requested variant: <br />
              <strong>"{variantToDelete.RequestedVariantName}"</strong>?
            </p>
            <div className="modal-actions">
              <button onClick={confirmDeletion} className="confirm-button">
                Yes, Delete
              </button>
              <button onClick={cancelDeletion} className="cancel-button">
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirmation && (
        <div className="modal-con">
          <div className="modal-con-content">
            <GoQuestion className="check-icon" />
            <h2>Save Changes</h2>
            <p>Are you sure you want to save changes to the variant?</p>
            <div className="modal-actions">
              <button onClick={confirmSave} className="confirm-button">
                Yes, Save
              </button>
              <button onClick={cancelSave} className="cancel-button">
                No, Don't Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmation && (
        <div className="modal-con">
          <div className="modal-con-content">
            <GoAlert className="alert-icon" />
            <h2>Discard Changes</h2>
            <p>
              Are you sure you want to cancel editing? Unsaved changes will be lost.
            </p>
            <div className="modal-actions">
              <button onClick={confirmCancel} className="confirm-button delete">
                {" "}
                {/* Using 'delete' class for a more "negative" confirm */}
                Yes, Cancel
              </button>
              <button onClick={cancelConfirmation} className="cancel-button">
                No, Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestedPage;