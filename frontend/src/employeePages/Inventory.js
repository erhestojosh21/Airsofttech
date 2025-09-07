import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { BsThreeDotsVertical } from "react-icons/bs"; 
import { IoSearch } from "react-icons/io5";
import { GoAlert, GoQuestion } from "react-icons/go";
import { FaSortAlphaDown, FaSortAlphaUp, FaSortNumericDown, FaSortNumericUp } from "react-icons/fa";
import { FiArchive } from "react-icons/fi";

import "./Inventory.css"; 

const ITEMS_PER_PAGE = 10;

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    productName: "",
    categoryId: "",
    categoryName: "",
    basePrice: "",
    image: null,
    description: "",
  });
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });

  const [visibleActionsId, setVisibleActionsId] = useState(null);
  const dropdownRef = useRef(null);

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveProductData, setArchiveProductData] = useState(null);

  const [filterStatus, setFilterStatus] = useState('active');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // State for Sorting
  const [sortColumn, setSortColumn] = useState(null); // 'ProductName', 'CategoryName', 'MinPrice'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let roleId = null;
  let username = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      roleId = decoded.roleId;
      username = decoded.username;
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setVisibleActionsId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch inventory and categories on initial load and when filterStatus changes
  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, [filterStatus]);

  // Combined effect for filtering, searching, and sorting
  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, inventory, selectedCategoryFilter, sortColumn, sortDirection]);

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/inventory?status=${filterStatus}`);
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const data = await res.json();
      setInventory(data);
      // No need to set filteredInventory here directly, as applyFiltersAndSort will run due to dependency
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  const fetchCategories = () => {
    fetch(`${process.env.REACT_APP_API_URL}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error fetching categories:", err));
  };

  // Renamed and combined the filtering, searching, and sorting logic
  const applyFiltersAndSort = () => {
    const term = searchTerm.toLowerCase();
    let currentFiltered = [...inventory]; // Start with a copy of the full inventory

    // Apply category filter
    if (selectedCategoryFilter) {
      currentFiltered = currentFiltered.filter(item => item.CategoryID === parseInt(selectedCategoryFilter));
    }

    // Apply search term filter
    currentFiltered = currentFiltered.filter((item) => {
      return (
        item.ProductName.toLowerCase().includes(term) ||
        item.CategoryName.toLowerCase().includes(term) ||
        (item.Description && item.Description.toLowerCase().includes(term)) ||
        `${item.MinPrice}`.includes(term) ||
        `${item.MaxPrice}`.includes(term)
      );
    });

    // Apply sorting
    if (sortColumn) {
      currentFiltered.sort((a, b) => {
        let valA, valB;

        switch (sortColumn) {
          case 'ProductName':
          case 'CategoryName':
            valA = a[sortColumn].toLowerCase();
            valB = b[sortColumn].toLowerCase();
            break;
          case 'MinPrice':
            valA = parseFloat(a.MinPrice);
            valB = parseFloat(b.MinPrice);
            break;
          // Add other sortable columns here if needed
          default:
            valA = a[sortColumn];
            valB = b[sortColumn];
        }

        if (valA < valB) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredInventory(currentFiltered);
    setCurrentPage(1); // Reset to first page after filter/sort/search
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      // If same column, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If new column, set column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProduct({ ...newProduct, image: file });
      setImagePreview(URL.createObjectURL(file)); // Fixed URL.URL.createObjectURL to URL.createObjectURL
    }
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;

    if (name === "categoryName") {
      if (value === "addNew") {
        navigate("/admin/category-manager");
        return;
      }

      const selectedCategory = categories.find((cat) => cat.CategoryName === value);
      setNewProduct({
        ...newProduct,
        categoryId: selectedCategory ? selectedCategory.CategoryID : "",
        categoryName: value,
      });
    } else {
      setNewProduct({ ...newProduct, [name]: value });
    }
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { variantName: "", price: "" }]);
  };

  const removeVariant = (index) => {
    const updated = [...variants];
    updated.splice(index, 1);
    setVariants(updated);
  };

  const handleSaveProduct = async () => {
    if (!newProduct.productName || !newProduct.categoryId || !newProduct.image) {
      return setErrorModal({
        show: true,
        message: "Please fill out all required fields and upload an image.",
      });
    }

    const formData = new FormData();
    formData.append("productName", newProduct.productName);
    formData.append("categoryId", newProduct.categoryId);
    formData.append("basePrice", newProduct.basePrice || 0);
    formData.append("image", newProduct.image);
    formData.append("categoryName", newProduct.categoryName);
    formData.append("description", newProduct.description);

    const formattedVariants = variants.map((variant) => ({
      variantName: variant.variantName || "Default",
      price: parseFloat(variant.price) || 0,
    }));

    formData.append("variants", JSON.stringify(formattedVariants));

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/add-product`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      setErrorModal({ show: true, message: "✅ Product added successfully!" });
      closeModal();
      fetchInventory();
    } catch (error) {
      console.error("Error adding product:", error);
      setErrorModal({ show: true, message: `❌ Failed to add product: ${error.message}` });
    }
  };

  const confirmArchiveUnarchive = (product) => {
    setArchiveProductData(product);
    setShowArchiveConfirm(true);
  };

  const executeArchiveUnarchive = async () => {
    if (!archiveProductData) return;

    const productId = archiveProductData.ProductID;
    const currentStatus = archiveProductData.IsArchived;
    const newStatus = !currentStatus;
    const actionText = newStatus ? "archive" : "unarchive";

    setShowArchiveConfirm(false);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/archive-product/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ archiveStatus: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${actionText} product`);
      }

      setErrorModal({ show: true, message: `✅ Product "${archiveProductData.ProductName}" ${actionText}d successfully!` });
      setVisibleActionsId(null);
      fetchInventory();
    } catch (error) {
      console.error(`Error ${actionText} product:`, error);
      setErrorModal({ show: true, message: `❌ Failed to ${actionText} product: ${error.message}` });
    } finally {
        setArchiveProductData(null);
    }
  };

  const closeModal = () => {
    setNewProduct({
      productName: "",
      categoryId: "",
      categoryName: "",
      basePrice: "",
      image: null,
      description: "",
    });
    setVariants([]);
    setImagePreview(null);
    setShowModal(false);
  };

  const toggleActions = (productId) => {
    setVisibleActionsId(visibleActionsId === productId ? null : productId);
  };

  const handleCategoryFilterChange = (e) => {
  const value = e.target.value;
  if (value === "addNew") {
    navigate("/admin/category-manager");
    // Optionally, reset the filter to 'All Categories' after navigating
    setSelectedCategoryFilter(''); // This prevents "addNew" from sticking in the dropdown
  } else {
    setSelectedCategoryFilter(value);
  }
};

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h2>Products</h2>
        <button className="add-product-btn" onClick={() => setShowModal(true)}>
          + Add Product
        </button>
      </div>

      <div className="inventory-controls">

        <div className="left-controls">
          <select
            className="filter-dropdown"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="active">Active Products</option>
          <option value="archived">Archived Products</option>
          <option value="all">All Products</option>
        </select>

        <select
          className="filter-dropdown"
          value={selectedCategoryFilter}
          onChange={handleCategoryFilterChange}
        >
          <option value=""> All Categories</option>
          {categories.map((category) => (
            <option key={category.CategoryID} value={category.CategoryID}>
              {category.CategoryName}
            </option>
          ))}
          <option value="addNew">+ Add New Category</option>
        </select>

        </div>

        <div className="right-controls">
          <div className="search-wrapper">
            <IoSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, category, or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th onClick={() => handleSort('ProductName')} className="sortable-header">
              Product Name
              {sortColumn === 'ProductName' && (
                sortDirection === 'asc' ? <FaSortAlphaUp className="sort-icon" /> : <FaSortAlphaDown className="sort-icon" />
              )}
            </th>
            <th onClick={() => handleSort('CategoryName')} className="sortable-header">
              Category
              {sortColumn === 'CategoryName' && (
                sortDirection === 'asc' ? <FaSortAlphaUp className="sort-icon" /> : <FaSortAlphaDown className="sort-icon" />
              )}
            </th>
            <th onClick={() => handleSort('MinPrice')} className="sortable-header">
              Price Range
              {sortColumn === 'MinPrice' && (
                sortDirection === 'asc' ? <FaSortNumericUp className="sort-icon" /> : <FaSortNumericDown className="sort-icon" />
              )}
            </th>
            <th>Variations</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedInventory.length > 0 ? (
            paginatedInventory.map((product, index) => (
              <tr key={product.ProductID}>
                <td className="indexes">{index + 1}</td>

                <td className="product-name-column">
                  <span className="product-name-cell">
                    {product.Image && (
                      <img
                        src={product.Image}
                        alt={product.ProductName}
                        className="product-thumbnail"
                      />
                    )}
                    <div>
                      {product.ProductName}
                      {product.Description && (
                        <p className="product-description-short">
                          {product.Description.length > 50
                            ? product.Description.substring(0, 50) + "..."
                            : product.Description}
                        </p>
                      )}
                    </div>
                  </span>
                </td>
                <td>{product.CategoryName}</td>
                <td>
                  {product.MinPrice === product.MaxPrice
                    ? `₱${product.MinPrice}`
                    : `₱${product.MinPrice} - ${product.MaxPrice}`}
                </td>
                <td>{product.NumberOfVariants}</td>
                <td>
                    {product.IsArchived ? (
                        <span className="status-archived">Archived</span>
                    ) : (
                        <span className="status-active">Active</span>
                    )}
                </td>
                <td style={{ position: 'relative', textAlign: 'right' }}>
                    <BsThreeDotsVertical
                        className="three-dots-icon"
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleActions(product.ProductID)}
                    />

                    {visibleActionsId === product.ProductID && (
                        <div className="inventory-dropdown-menu"> 
                            <button onClick={() => navigate(`/admin/inventory-details/${product.ProductID}`)}>
                                View
                            </button>
                            {!product.IsArchived ? (
                                <button onClick={() => confirmArchiveUnarchive(product)}>
                                    Archive
                                </button>
                            ) : (
                                <button onClick={() => confirmArchiveUnarchive(product)}>
                                    Unarchive
                                </button>
                            )}
                        </div>
                    )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No products found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
            ◀
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={i + 1 === currentPage ? "active-page" : ""}
              onClick={() => goToPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ▶
          </button>
        </div>
      )}

      {/* Modal for Add New Product */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">Add New Product</div>
            <div className="modal-body">
              <div className="image-input-row">
                <div className="image-upload">
                  <label htmlFor="productImage">
                    Drag image here <br /> or <br />
                    <span style={{ color: "#af4c4c", cursor: "pointer" }}>
                      Browse image
                    </span>
                  </label>
                  <input
                    type="file"
                    id="productImage"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  )}
                </div>

                <div className="product-input-group">
                  <input
                    type="text"
                    name="productName"
                    placeholder="Enter product name"
                    value={newProduct.productName}
                    onChange={handleProductChange}
                  />
                  <select
                    name="categoryName"
                    value={newProduct.categoryName}
                    onChange={handleProductChange}
                  >
                    <option value="">Select product category</option>
                    {categories.map((cat) => (
                      <option key={cat.CategoryID} value={cat.CategoryName}>
                        {cat.CategoryName}
                      </option>
                    ))}
                    <option value="addNew">+ Add New Category</option>
                  </select>
                  <textarea
                    name="description"
                    placeholder="Enter product description (optional)"
                    value={newProduct.description}
                    onChange={handleProductChange}
                    rows="4"
                    style={{ resize: "vertical" }}
                  ></textarea>
                </div>
              </div>

              <div>
                <h4>Variants</h4>
                <table className="variant-table">
                  <thead>
                    <tr>
                      <th>Variant Name</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            placeholder="Variant Name"
                            value={variant.variantName}
                            onChange={(e) =>
                              handleVariantChange(index, "variantName", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            placeholder="Price"
                            value={variant.price}
                            onChange={(e) =>
                              handleVariantChange(index, "price", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <button onClick={() => removeVariant(index)}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="add-variant-btn" onClick={addVariant}>
                  + Add Variant
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowCancelConfirm(true)}>
                Discard
              </button>
              <button className="save-btn" onClick={() => setShowSaveConfirm(true)}>
                Add Product
              </button>
            </div>
          </div>
          {showCancelConfirm && (
            <div className="modal-con">
              <div className="modal-con-content">
                <GoAlert className="alert-icon" />
                <h2>You want to discard the changes?</h2>
                <p>Adding new product will discard all unsaved changes.</p>
                <button onClick={() => { setShowCancelConfirm(false); closeModal(); }} className="confirm-button">Yes, Discard</button>
                <button onClick={() => setShowCancelConfirm(false)} className="cancel-button">No</button>
              </div>
            </div>
          )}

          {showSaveConfirm && (
            <div className="modal-con">
              <div className="modal-con-content">
                <GoQuestion className="check-icon" />
                <h2>Do you want to add this product?</h2>
                <button onClick={() => { setShowSaveConfirm(false); handleSaveProduct(); }} className="confirm-button">Yes, Add</button>
                <button onClick={() => setShowSaveConfirm(false)} className="cancel-button">No</button>
              </div>
            </div>
          )}

          {errorModal.show && (
            <div className="modal-con">
              <div className="modal-con-content">
                <p><strong>Message: </strong> {errorModal.message}</p>
                <button className="confirm-button" onClick={() => setErrorModal({ show: false, message: "" })}>
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Archive/Unarchive */}
      {showArchiveConfirm && archiveProductData && (
        <div className="modal-con">
          <div className="modal-con-content">
            <FiArchive className="alert-icon" />
            <h2>
              You want to{" "}
              {archiveProductData.IsArchived ? "unarchive" : "archive"} this product?
            </h2>
            <p>
              "{archiveProductData.ProductName}" will be{" "}
              {archiveProductData.IsArchived ? "unarchived" : "archived"} and
              will no longer be visible in the active product list.
            </p>
            <button
              onClick={executeArchiveUnarchive}
              className="confirm-button"
            >
              Yes,{" "}
              {archiveProductData.IsArchived ? "Unarchive" : "Archive"}
            </button>
            <button
              onClick={() => {
                setShowArchiveConfirm(false);
                setArchiveProductData(null);
              }}
              className="cancel-button"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;