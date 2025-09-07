// Frontend (React)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./RequestedVariant.css";
import { CiCircleAlert } from "react-icons/ci";
import { FaChevronLeft, FaPencilAlt } from "react-icons/fa";
import { GoAlert, GoQuestion } from "react-icons/go";

// Helper function to format date strings
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date"; // Handle invalid date strings gracefully
    return date.toLocaleString();
};

const RequestedVariant = () => {
    const { id } = useParams();
    const [variant, setVariant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editableVariant, setEditableVariant] = useState(null);

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showPriceErrorModal, setShowPriceErrorModal] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchVariant = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/requested-variant/${id}`);
                if (!res.ok) throw new Error("Failed to fetch variant");
                const data = await res.json();
                setVariant(data);
            } catch (err) {
                console.error("❌ Error fetching variant detail:", err);
                setVariant(null);
            } finally {
                setLoading(false);
            }
        };
        fetchVariant();
    }, [id]);

    const enterEditMode = () => {
        setEditableVariant({ ...variant });
        setEditMode(true);
    };

    const confirmCancel = () => setShowCancelModal(true);
    const confirmSave = () => {
        if (editableVariant?.Status === 1 && (editableVariant?.Price === null || editableVariant?.Price <= 0)) {
            setShowPriceErrorModal(true);
        } else {
            setShowSaveModal(true);
        }
    };

    const cancelEditMode = () => {
        setEditMode(false);
        setShowCancelModal(false);
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/requested-variant-end/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    RequestedVariantName: editableVariant.RequestedVariantName,
                    Price: editableVariant.Price,
                    Status: editableVariant.Status,
                    Description: editableVariant.Description || null
                }),
            });
            if (!res.ok) throw new Error("Failed to update variant");
            const updatedData = await res.json();
            setVariant(updatedData);
            setEditMode(false);
            setShowSaveModal(false);
        } catch (err) {
            console.error("❌ Error updating variant:", err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditableVariant((prevVariant) => ({
            ...prevVariant,
            [name]:
                name === "Price"
                    ? parseFloat(value)
                    : name === "Status"
                        ? parseInt(value, 10)
                        : value,
        }));
    };

    const getStatusText = (status) => {
        switch (status) {
            case 1:
                return "Approved";
            case 2:
                return "Rejected";
            case 0:
            case null:
            default:
                return "Pending";
        }
    };

    const getStatusClassName = (status) => {
        switch (status) {
            case 1:
                return "status-approved";
            case 2:
                return "status-rejected";
            case 0:
            case null:
            default:
                return "status-pending";
        }
    };

    if (loading) return <div className="loading-state">Loading variant details...</div>;
    if (!variant) return <div className="not-found-state">Requested variant not found.</div>;

    return (
        <div className="requested-variant">
            <div className="requested-variant-title">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <FaChevronLeft /> Back
                </button>
            </div>

            <div className="requested-variant-header">
                <div className="requested-variant-title">
                    <h1>Variant Request Details</h1>
                </div>

                <div className="requested-variant-controls">
                    {!editMode && (
                        <button className="edit-btn" onClick={enterEditMode}>
                            <FaPencilAlt /> Edit Mode
                        </button>
                    )}

                    {editMode && (
                        <>
                            <button className="confirm-btn" onClick={confirmSave}>Save</button>
                            <button className="cancel-btn" onClick={confirmCancel}>Cancel</button>
                        </>
                    )}
                </div>
            </div>

            <div className="requested-variant-first-info">
                <div className="requested-variant-info">
                    <p>Requested Variant:</p>
                    <div className="requested-variant-name">
                        {editMode ? (
                            <input
                                type="text"
                                name="RequestedVariantName"
                                value={editableVariant?.RequestedVariantName || ""}
                                onChange={handleInputChange}
                                className="full-width-input"
                            />
                        ) : (
                            <p>{variant.RequestedVariantName}</p>
                        )}
                    </div>

                    <div className="requested-variant-price">
                        <label>Request Date: </label>
                        <span>{formatDate(variant.RequestDate)}</span>
                    </div>

                    <div className="requested-variant-price">
                        <label>Price: </label>
                        {editMode ? (
                            <>
                                <span className="price-currency">₱ - </span>
                                <input
                                    type="number"
                                    name="Price"
                                    value={editableVariant?.Price || ""}
                                    onChange={handleInputChange}
                                    className="price-input"
                                />
                            </>
                        ) : (
                            <span className="StatusLabel">
                                {variant.Price ? `₱${Number(variant.Price).toLocaleString()}` : "To Be Determined"}
                            </span>
                        )}
                    </div>

                    <div className="requested-variant-status">
                        <label>Status:</label>
                        {editMode ? (
                            <select
                                name="Status"
                                value={editableVariant?.Status || 0}
                                onChange={handleInputChange}
                                className="status-select"
                            >
                                <option value={0}>Pending</option>
                                <option value={1}>Approved</option>
                                <option value={2}>Rejected</option>
                            </select>
                        ) : (
                            <span className={`StatusLabel ${getStatusClassName(variant.Status)}`}>
                                {getStatusText(variant.Status)}
                            </span>
                        )}
                    </div>

                    {variant.ApprovedDate && (
                        <div className="requested-variant-status">
                            <label>Approved Date: </label>
                            <span>{formatDate(variant.ApprovedDate)}</span>
                        </div>
                    )}
                    {variant.RejectedDate && (
                        <div className="requested-variant-status">
                            <label>Rejected Date:</label>
                            <span>{formatDate(variant.RejectedDate)}</span>
                        </div>
                    )}

                    <div className="requested-variant-description">
                        <label>Description:</label>
                        {editMode ? (
                            <textarea
                                name="Description"
                                value={editableVariant?.Description || ""}
                                onChange={handleInputChange}
                                className="full-width-textarea"
                            />
                        ) : (
                            <p>{variant.Description || "No description provided."}</p>
                        )}
                    </div>
                </div>

                <div className="requested-variant-product-info">
                    <p >Product Information:</p>
                    <div className="requested-variant-image-section">
                        <div className="requested-variant-image">
                            <img
                                src={variant.Image || "https://via.placeholder.com/150"}
                                alt={variant.ProductName || "Product Image"}
                                className="product-preview"
                            />
                        </div>
                    </div>

                    <div className="requested-variant-product-name">
                        <p>{variant.ProductName}</p>
                    </div>

                    <div className="requested-variant-product-price">
                        <label>Base Price:</label>
                        <span>₱{variant.BasePrice?.toLocaleString() || "N/A"}</span>
                    </div>
                </div>
            </div>

            <div className="variant-list">
                <h3>Requester Information</h3>
                <table>
                    <thead>
                        <tr>
                            <th className="variant-name">Username</th>
                            <th className="variant-name">Full Name</th>
                            <th className="variant-name">Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="variant-name">{variant.username}</td>
                            <td className="variant-name">{variant.first_name} {variant.last_name}</td>
                            <td className="variant-name">{variant.email}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {showSaveModal && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <GoQuestion className="check-icon" />
                        <h2>You want to save these changes?</h2>
                        <p>The requested variant details will be updated.</p>
                        <button className="confirm-button" onClick={handleSave}>Confirm</button>
                        <button className="cancel-button" onClick={() => setShowSaveModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <GoAlert className="alert-icon" />
                        <h2>You want to discard changes?</h2>
                        <p>The changes to the requested variant will be discarded.</p>
                        <button className="confirm-button" onClick={cancelEditMode}>Confirm</button>
                        <button className="cancel-button" onClick={() => setShowCancelModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {showPriceErrorModal && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <CiCircleAlert className="alert-icon error" />
                        <p>Price must be greater than zero to approve the variant.</p>
                        <button className="confirm-button" onClick={() => setShowPriceErrorModal(false)}>Okay</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestedVariant;