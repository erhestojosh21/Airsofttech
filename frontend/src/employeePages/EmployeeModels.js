import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { CiCircleAlert } from "react-icons/ci";
import "./EmployeeModels.css";

const EmployeeModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingModelID, setEditingModelID] = useState(null);

  const [modelName, setModelName] = useState("");
  const [description, setDescription] = useState("");
  const [fileData, setFileData] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modelToDelete, setModelToDelete] = useState(null);


  // Fetch models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/models`);
        setModels(response.data);
        setError(null);
      } catch (error) {
        setError("Failed to fetch models. Please try again later.");
        console.error("Error fetching models:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Filter models by search term
  const filteredModels = models.filter((model) =>
    model.ModelName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission (add or edit model)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("ModelName", modelName);
    formData.append("Description", description);
    formData.append("FileSize", fileData ? fileData.size : 0);
    formData.append("CreatedBy", "Admin");

    if (fileData) formData.append("FileData", fileData);
    if (thumbnail) formData.append("Thumbnail", thumbnail);

    try {
      if (isEditing && editingModelID !== null) {
        // PUT request for updating the model
        await axios.put(`${process.env.REACT_APP_API_URL}/api/models/${editingModelID}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccessMessage("Model updated successfully.");
      } else {
        // POST request for adding a new model
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/models/upload`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setSuccessMessage(response.data.message);
      }

      setErrorMessage("");
      setShowModal(false);
      setIsEditing(false);
      setEditingModelID(null);

      // Refresh model list
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/models`);
      setModels(response.data);
    } catch (error) {
      console.error("Error saving model:", error);
      setErrorMessage("Failed to save model. Please try again.");
      setSuccessMessage("");
    }
  };

  // Handle model deletion
  const handleDelete = async (modelID) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/models/${modelID}`);
      setModels(models.filter((model) => model.ModelID !== modelID));
      setSuccessMessage("Model deleted successfully.");
    } catch (error) {
      setErrorMessage("Failed to delete model. Please try again.");
      console.error("Error deleting model:", error);
    }
  };

  const confirmDeleteModel = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/models/${modelToDelete}`);
      setModels(models.filter((model) => model.ModelID !== modelToDelete));
      setSuccessMessage("Model deleted successfully.");
    } catch (error) {
      setErrorMessage("Failed to delete model. Please try again.");
      console.error("Error deleting model:", error);
    } finally {
      setShowDeleteConfirm(false);
      setModelToDelete(null);
    }
  };
  

  // Handle editing a model
  const handleEdit = (model) => {
    setIsEditing(true);
    setEditingModelID(model.ModelID);
    setModelName(model.ModelName);
    setDescription(model.Description);
    setFileData(null);
    setThumbnail(null);
    setShowModal(true);
  };

  return (
    <div className="models-container">
      <div className="models-header">
        <h2>3D Models</h2>
        <div className="actions">
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          <button
            className="add-button"
            onClick={() => {
              setIsEditing(false);
              setModelName("");
              setDescription("");
              setFileData(null);
              setThumbnail(null);
              setShowModal(true);
            }}
          >
            + Add 3D View
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading models...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : filteredModels.length === 0 ? (
        <p>No models found.</p>
      ) : (
        <div className="models-grid">
          {filteredModels.map((model) => (
            <div key={model.ModelID} className="model-card">
              <Link to={`/admin/model-management-details/${model.ModelID}`} className="model-link">
                <img
                  src={`data:image/png;base64,${model.Thumbnail}`}
                  alt={model.ModelName}
                />
                <h3>{model.ModelName}</h3>
              </Link>
              <div className="action-models">
              <button onClick={() => handleEdit(model)} className="edit-button">
                Edit
              </button>
              <button
                  onClick={() => {
                    setModelToDelete(model.ModelID);
                    setShowDeleteConfirm(true);
                  }}
                  className="delete-button"
                >
                Delete
              </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? "Edit 3D Model" : "Add New 3D Model"}</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <input
                  type="text"
                  placeholder="Model Name"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="fileData">
                  {isEditing ? "Update Model File (optional)" : "Upload Model File"}
                </label>
                <input
                  type="file"
                  id="fileData"
                  accept=".fbx, .glb, .glTF, .obj, .usdz"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const allowedExtensions = ["fbx"];
                      const fileExtension = file.name.split(".").pop().toLowerCase();
                      if (!allowedExtensions.includes(fileExtension)) {
                        setErrorMessage("Only .fbx files are allowed for 3D models.");
                        e.target.value = null; // reset file input
                        setFileData(null);
                        return;
                      }
                      setErrorMessage("");
                      setFileData(file);
                    }
                  }}
                  {...(!isEditing && { required: true })}
                />
              </div>
              <div>
                <label htmlFor="thumbnail">
                  {isEditing ? "Update Thumbnail (optional)" : "Upload Thumbnail"}
                </label>
                <input
                  type="file"
                  id="thumbnail"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const allowedExtensions = ["png", "jpg", "jpeg", "webp"];
                      const fileExtension = file.name.split(".").pop().toLowerCase();
                      if (!allowedExtensions.includes(fileExtension)) {
                        setErrorMessage("Only PNG, JPG, JPEG, or WEBP files are allowed for thumbnails.");
                        e.target.value = null; // reset file input
                        setThumbnail(null);
                        return;
                      }
                      setErrorMessage("");
                      setThumbnail(file);
                    }
                  }}
                  {...(!isEditing && { required: true })}
                />
              </div>
              <div>
                <button type="submit">{isEditing ? "Update" : "Upload"}</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
            {successMessage && <p className="success-message">{successMessage}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-con">
          <div className="modal-con-content">
            <CiCircleAlert className="alert-icon" />
            <p>Are you sure you want to delete this model? This action cannot be undone.</p>
            <button onClick={confirmDeleteModel} className="confirm-button">Confirm</button>
            <button onClick={() => setShowDeleteConfirm(false)} className="cancel-button">Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeModels;
