import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Models.css";
import Footer from "../components/Footer";


const Models = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  // State for new model form
  const [modelName, setModelName] = useState("");
  const [description, setDescription] = useState("");
  const [fileData, setFileData] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  const filteredModels = models.filter((model) =>
    model.ModelName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submit to upload a new model
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("ModelName", modelName);
    formData.append("Description", description);
    formData.append("FileSize", fileData ? fileData.size : 0); // File size
    formData.append("CreatedBy", "Admin"); // You can replace this with actual user info

    if (fileData) formData.append("FileData", fileData);
    if (thumbnail) formData.append("Thumbnail", thumbnail);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/models/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccessMessage(response.data.message);
      setErrorMessage(""); // Clear any previous error messages
      setShowModal(false); // Close the modal after successful upload
    } catch (error) {
      console.error("Upload failed:", error);
      setErrorMessage("Upload failed. Please try again.");
      setSuccessMessage(""); // Clear any previous success messages
    }
  };

  return (
    <div className="models-page">
      
      <div className="models-container">
        <div className="models-header">
          <h2>3D Models</h2>
          <div className="actions">
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-model"
            />

            
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
              <Link to={`/models/${model.ModelID}`} key={model.ModelID} className="model-card">
                <img src={`data:image/png;base64,${model.Thumbnail}`} alt={model.ModelName} />
                <h3>{model.ModelName}</h3>
                <p>{model.Description.substring(0, 100)}{model.Description.length > 100 ? '...' : ''}</p>
              </Link>
            ))}
          </div>
        )}

        {/* Modal for adding a new model */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Add New 3D Model</h3>
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
    
    {/* File Input for Model File */}
    <div>
      <label htmlFor="fileData">Upload Model File</label>
      <input
        type="file"
        id="fileData"
        onChange={(e) => setFileData(e.target.files[0])}
        required
      />
    </div>

    {/* File Input for Thumbnail */}
    <div>
      <label htmlFor="thumbnail">Upload Thumbnail</label>
      <input
        type="file"
        id="thumbnail"
        onChange={(e) => setThumbnail(e.target.files[0])}
        required
      />
    </div>

      <div>
        <button type="submit">Upload</button>
        <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
      </div>
    </form>
                {successMessage && <p className="success-message">{successMessage}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}
              </div>
            </div>
          )}
        </div>


        <footer className="footer-container">
            <Footer />
            </footer>
    </div>
  );
};

export default Models;
