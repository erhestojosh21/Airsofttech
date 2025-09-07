import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./UserSidebar";
import Homepage from "../pages/Navigation";
import "./TrackingPage.css"; // Import styles for the tracking steps

const TrackingPage = () => {
  const { orderID } = useParams();
  const [trackingData, setTrackingData] = useState([]);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/order-tracking/${orderID}`);
        const data = await res.json();
        setTrackingData(data);
      } catch (err) {
        console.error("Error fetching tracking data:", err);
      }
    };

    fetchTrackingData();
  }, [orderID]);

  return (
    <div>
      
      <div className="tracking-container">
        <Sidebar />
        <div className="tracking-content">
          <h1>Tracking Order #{orderID}</h1>
          <div className="shipment-details">
            
          </div>
          <div className="tracking-chain">
            {trackingData.length > 0 ? (
              trackingData.map((track, index) => (
                <div key={track.TrackingID} className={`tracking-step ${index === trackingData.length - 1 ? "last-step" : ""}`}>
                  <div className="tracking-info">
                    <p className="tracking-time">{new Date(track.TimeStamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="tracking-date">{new Date(track.TimeStamp).toLocaleDateString()}</p>
                    <p className="tracking-status"><strong>{track.TrackingStatus}</strong></p>
                    <p className="tracking-location">{track.Location}</p>
                  </div>
                  {index < trackingData.length - 1 && <div className="tracking-connector"></div>}
                </div>
              ))
            ) : (
              <p className="no-tracking">No tracking updates available.</p>
            )}
          </div>
          <p>UPS Global Shipping Link:<a href="https://www.ups.com/us/en/home"> https://www.ups.com</a></p>
          <p>J&T Express Link:<a href="https://www.jtexpress.ph/"> https://www.jtexpress.ph</a></p>
          <p>LBC Express Link:<a href="https://www.lbcexpress.com/"> https://www.lbcexpress.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
