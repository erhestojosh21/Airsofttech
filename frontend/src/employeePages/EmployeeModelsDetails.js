import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";


const ModelViewer = ({ glbData, paused }) => {
  const model = useLoader(GLTFLoader, glbData);
  const ref = useRef();

  useFrame(() => {
    if (ref.current && !paused) {
      ref.current.rotation.y -= 0.003;
    }
  });

  return <primitive object={model.scene} scale={1.5} ref={ref} />;
};

const EmployeeModelsDetails = () => {
  const { id } = useParams();
  const [model, setModel] = useState(null);
  const [paused, setPaused] = useState(false); // For controlling spin

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/models/${id}`)
      .then((response) => setModel(response.data))
      .catch((error) => console.error("Error fetching model:", error));
  }, [id]);

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

        <div className="model-date">
          <p><b>Uploaded:</b> {new Date(model.UploadDate).toLocaleDateString()}</p>
          <p><b>Last Modified:</b> {new Date(model.LastModified).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeModelsDetails;
