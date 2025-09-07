import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./InventoryDetails.css";
import { FaChevronLeft } from "react-icons/fa";
import { FaTrashAlt, FaPencilAlt } from "react-icons/fa";
import { GoAlert, GoQuestion } from "react-icons/go";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaSave, FaTimes } from "react-icons/fa";



const InventoryDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState({
        productName: "",
        categoryId: "",
        categoryName: "",
        image: null,
        description: "",
        isArchived: false,
        minPrice: null,
        maxPrice: null,
        totalProductSalesAmount: 0, // Add for total product sales amount
        totalProductSalesQuantity: 0, // Add for total product sales quantity
    });
    const [variants, setVariants] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);

    // Temporary states for editing
    const [editableProduct, setEditableProduct] = useState({});
    const [editableVariants, setEditableVariants] = useState([]); // This will hold variants during edit

    // Request guide states
    const [requestGuide, setRequestGuide] = useState("");
    const [editableRequestGuide, setEditableRequestGuide] = useState("");

    // Modal states
    const [showDeleteVariantModal, setShowDeleteVariantModal] = useState(false); // Renamed for clarity
    const [variantToDelete, setVariantToDelete] = useState(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showAddVariantModal, setShowAddVariantModal] = useState(false); // Renamed for clarity
    const [newVariant, setNewVariant] = useState({
        variantName: "",
        price: "",
        quantity: "",
        thresholdValue: "",
        availability: "In Stock", // Default availability for new variants
    });
    const [errorMessage, setErrorMessage] = useState(""); // For displaying general error messages

    const token = localStorage.getItem("token");
    let roleId = null;
    let username = null;
    let employeeId = null;

    if (token) {
        try {
            const decoded = jwtDecode(token);
            roleId = decoded.roleId;
            username = decoded.username;
            employeeId = decoded.employeeId;
        } catch (err) {
            console.error("Invalid token:", err);
            // Optionally redirect to login or show an error
        }
    }

    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/inventory-details/${productId}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Failed to fetch product details");
                }
                const data = await res.json();

                // Set main product details
                setProduct({
                    productName: data.ProductName,
                    categoryId: data.CategoryID,
                    categoryName: data.CategoryName,
                    image: data.Image,
                    description: data.Description || "", 
                    isArchived: data.IsArchived, 
                    minPrice: data.MinPrice, 
                    maxPrice: data.MaxPrice, 
                    requestGuide: data.RequestGuide || "",   
                    totalProductSalesAmount: data.TotalProductSalesAmount || 0, 
                    totalProductSalesQuantity: data.TotalProductSalesQuantity || 0, 
                });

                // Set variants
                setVariants(data.Variants || []);
                setEditableVariants(data.Variants || []); // Initialize editable variants

                setRequestGuide(data.RequestGuide || "");
                setEditableRequestGuide(data.RequestGuide || "");


            } catch (err) {
                console.error("Error fetching product details:", err);
                setErrorMessage(err.message || "Error fetching product details.");
            }
        };

        const fetchCategories = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/categories`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Failed to fetch categories");
                }
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error("Error fetching categories:", err);
                setErrorMessage(err.message || "Error fetching categories.");
            }
        };

        fetchProductDetails();
        fetchCategories();
    }, [productId]); // Depend on productId to refetch if it changes

    // DELETE PRODUCT
    const handleDeleteProduct = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-product/${productId}`, {
                method: "DELETE", // Changed from POST to DELETE for semantically correct action
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ username }), // Send only username for audit logging
            });

            if (response.ok) {
                alert("Product archived successfully.");
                navigate("/admin/inventory");
            } else {
                const errorData = await response.json();
                setErrorMessage(errorData.error || "Failed to archive product.");
            }
        } catch (error) {
            console.error("❌ Error archiving product:", error);
            setErrorMessage("Error archiving product.");
        } finally {
            setShowDeleteProductModal(false);
        }
    };

    const handleNewVariantChange = (e) => {
        setNewVariant({ ...newVariant, [e.target.name]: e.target.value });
    };

    const handleVariantChange = (index, field, value) => {
        const updatedVariants = [...editableVariants];
        updatedVariants[index][field] = value;
        setEditableVariants(updatedVariants);
    };

    const handleAddVariant = async () => {
        try {
            // No need to find availabilityID here, backend handles it if needed
            const response = await fetch(`${process.env.REACT_APP_API_URL}/add-variant`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productId,
                    variantName: newVariant.variantName,
                    price: parseFloat(newVariant.price), // Ensure price is a number

                    employeeId: employeeId,
                    username: username, // For audit logging
                }),
            });

            if (response.ok) {
                const addedVariant = await response.json();
                setVariants(prevVariants => [...prevVariants, addedVariant]); // Update main state
                setEditableVariants(prevEditableVariants => [...prevEditableVariants, addedVariant]); // Update editable state
                setShowAddVariantModal(false);
                setNewVariant({
                    variantName: "",
                    price: "",
                });
            } else {
                const error = await response.json();
                setErrorMessage(error.error || "Failed to add variant.");
            }
        } catch (error) {
            console.error("❌ Error adding variant:", error);
            setErrorMessage("Error adding variant.");
        }
    };

    const enterEditMode = () => {
        setEditableProduct({ ...product }); // Copy current product data
        setEditableVariants([...variants]); // Copy current variants
        setEditMode(true);
    };

    const confirmCancel = () => setShowCancelModal(true);
    const confirmSave = () => setShowSaveModal(true);

    const cancelEditMode = () => {
        setEditMode(false);
        setShowCancelModal(false);
        // Reset editable states to original product values
        setEditableProduct({ ...product });
        setEditableVariants([...variants]);
    };

    

    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append("productName", editableProduct.productName);
            formData.append("categoryId", editableProduct.categoryId);
            // categoryName is derived on backend, no need to send it if only categoryId is updated
            formData.append("description", editableProduct.description); // Send description
            formData.append("requestGuide", editableRequestGuide);
            formData.append("isArchived", editableProduct.isArchived); // Send isArchived status
            formData.append("username", username);

            if (editableProduct.newImage) {
                formData.append("image", editableProduct.newImage);
            }

            const productUpdateRes = await fetch(`${process.env.REACT_APP_API_URL}/update-product/${productId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!productUpdateRes.ok) {
                const errorData = await productUpdateRes.json();
                throw new Error(errorData.error || "Failed to update product details.");
            }

            // Update variants
            for (let variant of editableVariants) {
                const variantUpdateRes = await fetch(`${process.env.REACT_APP_API_URL}/update-variant/${variant.VariantID}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        variantName: variant.VariantName,
                        price: parseFloat(variant.Price), // Ensure number
                        quantity: parseInt(variant.Quantity), // Ensure number
                        thresholdValue: parseInt(variant.ThresholdValue), // Ensure number
                        username: username,
                    }),
                });
                if (!variantUpdateRes.ok) {
                    const errorData = await variantUpdateRes.json();
                    throw new Error(`Failed to update variant ${variant.VariantName}: ${errorData.error || ""}`);
                }
            }

            window.location.reload(); // Simple refresh for now


        } catch (error) {
            console.error("❌ Error saving changes:", error);
            setErrorMessage(error.message || "Error saving changes.");
        } finally {
            setShowSaveModal(false); // Close save modal
        }
    };

    const confirmDeleteVariant = (variant) => {
        setVariantToDelete(variant);
        setShowDeleteVariantModal(true);
    };

    const handleDeleteVariant = async () => {
        if (variantToDelete) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-variant/${variantToDelete.VariantID}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        username: username,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to delete variant.");
                }

                setEditableVariants(editableVariants.filter(v => v.VariantID !== variantToDelete.VariantID));
                setVariants(variants.filter(v => v.VariantID !== variantToDelete.VariantID)); // Also update main variants state
                setShowDeleteVariantModal(false);
                setVariantToDelete(null);
            } catch (error) {
                console.error("❌ Error deleting variant:", error);
                setErrorMessage(error.message || "Error deleting variant.");
            } finally {
                setShowDeleteVariantModal(false); // Close modal
                setVariantToDelete(null);
            }
        }
    };

    return (
        <div className="inventory-details">
            <div className="inventory-details-title">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <FaChevronLeft /> Back
                </button>
            </div>
            <div className="inventory-details-header">
                <div className="inventory-details-title">
                    <h1>Product Details</h1>
                </div>

                <div className="inventory-details-controls">
                    {!editMode && (
                        <>
                            <button className="edit-btn" onClick={enterEditMode}><FaPencilAlt /> Edit Mode</button>
                            {product.isArchived && (
                            <button className="delete-btn" onClick={() => setShowDeleteProductModal(true)}><FaTrashAlt /> Delete Product</button>
                            )}
                        </>
                    )}

                    {editMode && (
                        <>
                            <button onClick={confirmSave}> <FaSave /> Save</button>
                            <button onClick={confirmCancel}> <FaTimes /> Cancel</button>
                        </>
                    )}
                </div>
            </div>


            <div className="inventory-details-product-info">
                <div className="inventory-details-image-section">
                    <div className="inventory-details-image">
                    {editMode ? (
                        <>
                            <input type="file" accept="image/*" onChange={(e) => setEditableProduct({ ...editableProduct, newImage: e.target.files[0] })} />
                            {product.image && <img src={product.image} alt="Product Preview" className="product-preview" />}
                        </>
                    ) : (
                        product.image && <img src={product.image} alt="Product" className="product-preview" />
                    )}
                </div>
                </div>


                <div className="inventory-details-info">

                <div className="inventory-details-name">
                    {editMode ? (
                        <input type="text" name="productName" value={editableProduct.productName} onChange={(e) => setEditableProduct({ ...editableProduct, productName: e.target.value })} />
                    ) : (
                        <p>{product.productName}</p>
                    )}
                </div>

                    <div className="inventory-details-value">
                        <div className="inventory-details-price">
                            <label>Price Range: </label>
                            <span>
                                {product.minPrice !== null && product.maxPrice !== null
                                    ? `₱${product.minPrice} - ₱${product.maxPrice}`
                                    : "N/A"}
                            </span>
                        </div>

                    
                        <div className="inventory-details-price">
                            <label>Total Product Sales: </label>
                            <span>₱{product.totalProductSalesAmount?.toFixed(2) || "0.00"} ({product.totalProductSalesQuantity || 0} units)</span>
                        </div>
                        
                    </div>


                    <div className="inventory-details-category">
                        <label>Category: </label>
                         {editMode ? (
                            <select value={editableProduct.categoryId} onChange={(e) => setEditableProduct({ ...editableProduct, categoryId: e.target.value })}>
                                {categories.map(cat => (
                                    <option key={cat.CategoryID} value={cat.CategoryID}>
                                        {cat.CategoryName}
                                    </option>
                                 ))}
                            </select>
                        ) : (
                            <span>{categories.find(cat => cat.CategoryID === product.categoryId)?.CategoryName || "N/A"}</span>
                        )}
                    </div>

                    <div className="inventory-details-status">
                        <label>Status:</label>
                        {editMode ? (
                            <div className="radio-group"> 
                                <label>
                                    <input
                                        type="radio"
                                        name="archiveStatus"
                                        value="active"
                                        checked={!editableProduct.isArchived}
                                        onChange={() => setEditableProduct({ ...editableProduct, isArchived: false })}
                                    />
                                    Active
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="archiveStatus"
                                        value="archived"
                                        checked={editableProduct.isArchived}
                                        onChange={() => setEditableProduct({ ...editableProduct, isArchived: true })}
                                    />
                                    Archived
                                </label>
                            </div>
                        ) : (
                            <span className="StatusLabel">
                                {product.isArchived ? (
                                    <span className="status-archived">Archived</span>
                                ) : (
                                    <span className="status-active">Active</span>
                                )}
                            </span>
                        )}
                    </div>

                    <div className="inventory-details-description">
                        <label>Description:</label>
                        <br />
                        {editMode ? (
                            <textarea
                                value={editableProduct.description}
                                onChange={(e) => setEditableProduct({ ...editableProduct, description: e.target.value })}
                                rows="4"
                            ></textarea>
                        ) : (
                            <p>
                                {product.description || "No description provided."}
                            </p>
                        )}
                    </div>

                    
                    

                </div>
            </div>


            <div className="variant-list">
                <h3>Product Variants</h3>
                {editMode && <button className="add-variant-btn" onClick={() => setShowAddVariantModal(true)}>Add Variant</button>}

                <table>
                    <thead>
                        <tr>
                            <th className="indexes">#</th>
                            <th className="variant-name">Variant Name</th>
                            <th className="variant-price">Price</th>
                            <th>Sales (Amount)</th>
                            <th>Sales (Units)</th> 
                            {editMode && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {(editMode ? editableVariants : variants).map((variant, index) => (
                            <tr key={variant.VariantID || `new-${index}`}>
                                <td className="indexes">{index + 1}</td>
                                <td className="variant-name">
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={variant.VariantName}
                                            onChange={(e) => handleVariantChange(index, "VariantName", e.target.value)}
                                        />
                                    ) : (
                                        variant.VariantName
                                    )}
                                </td>
                                <td className="variant-price">
                                    {editMode ? (
                                        <>
                                            <p>₱</p>
                                            <input
                                                type="number"
                                                value={variant.Price}
                                                onChange={(e) => handleVariantChange(index, "Price", e.target.value)}
                                            />
                                        </>
                                    ) : (
                                        `₱${variant.Price}`
                                    )}
                                </td>
                                
                                
                                {/* New: Display variant sales */}
                                <td>₱{variant.TotalVariantSalesAmount?.toFixed(2) || "0.00"}</td>
                                <td>{variant.TotalVariantSalesQuantity || 0}</td>

                                {editMode && (
                                    <td>
                                        <button className="delete-variant-btn" onClick={() => confirmDeleteVariant(variant)}>Delete</button>
                                    </td>
                                )}
                            </tr>
                        ))}

                        
                        <tr>
                            <td></td>
                            <td></td>
                            <td className="total-variant-label">TOTAL SALES : </td>
                            <td className="total-variant"> ₱{product.totalProductSalesAmount?.toFixed(2) || "0.00"}</td>
                            <td className="total-variant">{product.totalProductSalesQuantity}</td>
                            {editMode && <td></td>}
                        </tr>
                        
                    </tbody>
                </table>

                <div className="inventory-details-request-guide">
                    <label>Request Guide:</label>
                    <br />
                    {editMode ? (
                        <>
                            
                            Describe your desire
                            <input
                                value={editableRequestGuide}
                                onChange={(e) => setEditableRequestGuide(e.target.value)}
                                rows="3"
                                placeholder="..."
                                className="request-guide-input"
                            ></input>
                            of this product.

                            <div className="request-guide-buttons">
                                {/* Conditionally render buttons */}
                                <span className="recommended-request">Recomended: </span>
                                {!editableRequestGuide.includes("color") && <button onClick={() => setEditableRequestGuide(prev => prev + 'color, ')}>Color</button>}
                                {!editableRequestGuide.includes("size") && <button onClick={() => setEditableRequestGuide(prev => prev + 'size, ')}>Size</button>}
                                {!editableRequestGuide.includes("handle") && <button onClick={() => setEditableRequestGuide(prev => prev + 'handle, ')}>Handle</button>}
                                {!editableRequestGuide.includes("power") && <button onClick={() => setEditableRequestGuide(prev => prev + 'power, ')}>Power</button>}
                                {!editableRequestGuide.includes("degree") && <button onClick={() => setEditableRequestGuide(prev => prev + 'degree, ')}>Degree</button>}
                            </div>
                        </>
                    ) : (
                        <p> Describe your desire <span className="request-guide">{requestGuide || "[No request guide provided.]"} </span> of this product.</p>
                    )}
                </div>

            </div>

            {showDeleteVariantModal && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <GoAlert className="alert-icon" />
                        <h2>You want to delete this variant?</h2>
                        <p>"{variantToDelete.VariantName}" will no longer exist on this product. This process cannot be undone.</p>
                        <button onClick={handleDeleteVariant} className="confirm-button">Yes, Delete</button>
                        <button onClick={() => setShowDeleteVariantModal(false)} className="cancel-button">No</button>
                    </div>
                </div>
            )}

            {showSaveModal && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <GoQuestion className="check-icon" />
                        <h2>You want to save these changes?</h2>
                        <p>"{product.productName}" will be updated.</p>
                        <button onClick={handleSave} className="confirm-button">Yes, Save</button>
                        <button onClick={() => setShowSaveModal(false)} className="cancel-button">No</button>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <GoAlert className="alert-icon" />
                        <h2>You want to discard changes?</h2>
                        <p>"{product.productName}" the changes will be discarded.</p>
                        <button onClick={cancelEditMode} className="confirm-button">Yes, Cancel</button>
                        <button onClick={() => setShowCancelModal(false)} className="cancel-button">No</button>
                    </div>
                </div>
            )}

            {showAddVariantModal && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <h3>Add New Variant</h3>
                        <label>Variant Name:</label>
                        <input type="text" name="variantName" value={newVariant.variantName} onChange={handleNewVariantChange} required />

                        <label>Price:</label>
                        <input type="number" name="price" value={newVariant.price} onChange={handleNewVariantChange} required />

                        <button onClick={handleAddVariant} className="confirm-button">Add Variant</button>
                        <button onClick={() => setShowAddVariantModal(false)} className="cancel-button">Cancel</button>
                    </div>
                </div>
            )}

            {showDeleteProductModal && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <RiDeleteBin6Line className="alert-icon" />
                        <h2>You want to delete this product?</h2>
                        <p>"{product.productName}" will be deleted with all its variants. This process cannot be undone.</p>
                        <button onClick={handleDeleteProduct} className="confirm-button">Yes, Delete</button>
                        <button onClick={() => setShowDeleteProductModal(false)} className="cancel-button">No</button>
                    </div>
                </div>
            )}

            {errorMessage && (
                <div className="modal-con">
                    <div className="modal-con-content error-modal">
                        <GoAlert className="alert-icon" />
                        <p>{errorMessage}</p>
                        <button onClick={() => setErrorMessage("")} className="confirm-button">OK</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InventoryDetails;