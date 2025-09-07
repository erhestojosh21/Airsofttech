import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";

// Default marker fix (Leaflet icon issue in React)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const LocationPicker = ({ onLocationSelected, defaultPosition }) => {
  const [position, setPosition] = useState(defaultPosition || [14.5995, 120.9842]); // Manila default

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const coords = [e.latlng.lat, e.latlng.lng];
        setPosition(coords);
        onLocationSelected({ lat: coords[0], lng: coords[1] });
      },
    });
    return <Marker position={position} />;
  };

  return (
    <MapContainer center={position} zoom={15} style={{ height: "300px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker />
    </MapContainer>
  );
};

export default LocationPicker;
