import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Add useNavigate for redirection
import axios from "axios";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import "./ModelsByCategory.css";
import Footer from "../components/Footer";

// You can create a reusable ModelViewer component or just inline this logic
const ModelViewer = ({ glbData, paused }) => {
  const model = useLoader(GLTFLoader, glbData);
  const ref = useRef();

  useFrame(() => {
    if (ref.current && !paused) {
      ref.current.rotation.y -= 0.003;
    }
  });

  return <primitive object={model.scene} scale={1.2} ref={ref} />;
};

const ModelsByCategory = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [paused, setPaused] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    // Fetch models by category
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/models/category/${categoryId}`)
      .then((response) => {
        // Assume we only show the first model for this "details" view
        if (response.data && response.data.length > 0) {
          setModel(response.data[0]);
        } else {
          // If no models are found, you can redirect or show a message
          navigate("/products");
        }
      })
      .catch((error) => {
        console.error("Error fetching models by category:", error);
        navigate("/products");
      });

    // Fetch category name
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/categories/${categoryId}`)
      .then((response) => {
        setCategoryName(response.data.CategoryName || "Unknown Category");
      })
      .catch((error) => {
        console.error("Error fetching category name:", error);
        setCategoryName("Unknown Category");
      });
  }, [categoryId, navigate]);

  if (!model) return <p>Loading...</p>;

  return (
      <div className="model-detail-container">
        {/* Left Side: 3D Model Viewer */}
        <div className="model-viewer">
          {/* Pause Button in top-right */}
          <button className="pause-button" onClick={() => setPaused(!paused)}>
            {paused ? "▶" : "⏸"}
          </button>
  
          <Canvas>
            <ambientLight intensity={0.5} />
            <Environment preset="sunset" />
            <OrbitControls />
            <ModelViewer
              glbData={`data:model/glb;base64,${model.FileData}`}
              paused={paused}
            />
          </Canvas>
  
          
        </div>
  
        {/* Right Side: Model Details */}
        <div className="model-info">
          <h2>{model.ModelName}</h2>
          <p>{model.Description}</p>
        </div>
      </div>
    );
  };

export default ModelsByCategory;