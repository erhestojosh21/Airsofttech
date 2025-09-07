

import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./AddressMap.css";

// Fix for default marker icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const LocationMarker = ({ setLocation, initialPosition }) => {
  const [position, setPosition] = useState(initialPosition);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setLocation(e.latlng);
    },
    locationfound(e) {
      setPosition(e.latlng);
      setLocation(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (!initialPosition) {
      map.locate();
    }
  }, [map, initialPosition]);

  return position === null ? null : <Marker position={position}></Marker>;
};

const AddressMap = ({ onSelectLocation, onClose, initialAddress }) => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (initialAddress && initialAddress.latitude && initialAddress.longitude) {
      setPosition({
        lat: initialAddress.latitude,
        lng: initialAddress.longitude,
      });
    }
  }, [initialAddress]);

  const handleLocationSelected = async ({ lat, lng }) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      if (data) {
        onSelectLocation({
          lat,
          lng,
          address: data.address,
          display_name: data.display_name,
        });
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      alert("Could not fetch address for this location.");
    }
  };

  return (
    <div className="map-modal-overlay">
      <div className="map-modal-content">
        <button className="close-map-btn" onClick={onClose}>
          &times;
        </button>
        <MapContainer
          center={position || [14.5995, 120.9842]} // Default to Manila, Philippines
          zoom={13}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            setLocation={handleLocationSelected}
            initialPosition={position}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default AddressMap;