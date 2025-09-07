import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import styles from "./CategoryManager.module.css";

const CategoryManager = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState("");
    const [editingCategory, setEditingCategory] = useState(null);
    const [editedName, setEditedName] = useState(""); // Store edited name before saving
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmAdd, setConfirmAdd] = useState(false);
    const [confirmEdit, setConfirmEdit] = useState(null);


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



    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/categories`);
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const handleAddCategory = () => {
        if (!newCategory.trim()) {
            alert("❌ Category name cannot be empty!");
            return;
        }
        setConfirmAdd(true);
    };

    const addCategory = async () => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/add-category`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ categoryName: newCategory, username }),
            });

            setNewCategory("");
            setConfirmAdd(false);
            fetchCategories();
        } catch (error) {
            console.error("Error adding category:", error);
        }
    };

    const handleEditCategory = (categoryId, categoryName) => {
        setEditingCategory(categoryId);
        setEditedName(categoryName);
    };

    const handleConfirmEdit = (categoryId) => {
        setConfirmEdit(categoryId);
    };

    const editCategory = async () => {
        if (!editedName.trim()) {
            alert("❌ Category name cannot be empty!");
            return;
        }

        try {
            await fetch(`${process.env.REACT_APP_API_URL}/edit-category/${confirmEdit}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ categoryName: editedName, username }),
            });

            setEditingCategory(null);
            setConfirmEdit(null);
            fetchCategories();
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    const deleteCategory = async () => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/delete-category/${confirmDelete}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            

            setConfirmDelete(null);
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    return (
        <div className={styles.categoryContainer}>
            <h2>📁 Manage Categories</h2>
            <button className={styles.backButton} onClick={() => navigate(-1)}>🔙 Back</button>

            <div className={styles.addCategory}>
                <input
                    type="text"
                    placeholder="Enter new category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                />
                <button className={styles.addBtn} onClick={handleAddCategory}>➕ Add</button>
            </div>

            <table className={styles.categoryTable}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Category Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((cat, index) => (
                        <tr key={cat.CategoryID}>
                            <td>{index + 1}</td>
                            <td>
                                {editingCategory === cat.CategoryID ? (
                                    <input
                                        type="text"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                    />
                                ) : (
                                    cat.CategoryName
                                )}
                            </td>
                            <td>
                                {editingCategory === cat.CategoryID ? (
                                    <>
                                        <button className={styles.saveBtn} onClick={() => handleConfirmEdit(cat.CategoryID)}>✅ Save</button>
                                        <button className={styles.cancelBtn} onClick={() => setEditingCategory(null)}>❌ Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button className={styles.editBtn} onClick={() => handleEditCategory(cat.CategoryID, cat.CategoryName)}>✏️ Edit</button>
                                        <button className={styles.deleteBtn} onClick={() => setConfirmDelete(cat.CategoryID)}>🗑 Delete</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Confirm Delete Modal */}
            {confirmDelete !== null && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <p>⚠️ Are you sure you want to delete this category?</p>
                        <div className={styles.modalButtons}>
                            <button className={styles.confirmBtn} onClick={deleteCategory}>✅ Yes, Delete</button>
                            <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>❌ Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Add Category Modal */}
            {confirmAdd && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <p>✅ Add category "{newCategory}"?</p>
                        <div className={styles.modalButtons}>
                            <button className={styles.confirmBtn} onClick={addCategory}>✅ Yes, Add</button>
                            <button className={styles.cancelBtn} onClick={() => setConfirmAdd(false)}>❌ Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Edit Category Modal */}
            {confirmEdit !== null && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <p>✅ Save changes for category?</p>
                        <div className={styles.modalButtons}>
                            <button className={styles.confirmBtn} onClick={editCategory}>✅ Yes, Save</button>
                            <button className={styles.cancelBtn} onClick={() => setConfirmEdit(null)}>❌ Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManager;
