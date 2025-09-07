import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import "./DashboardSummary.css";
// Importing icons for each status
import { GiCardboardBoxClosed } from "react-icons/gi"; // For Processing (re-purposed from Pending)
import { BiSolidLike } from "react-icons/bi"; // For Verified
import { FaTruckField } from "react-icons/fa6"; // For Shipping (re-purposed from To Shipped)
import { MdOutlineDownloadDone } from "react-icons/md"; // For Received (new icon)
import { IoMdDoneAll } from "react-icons/io"; // For Completed
import { MdCancel } from "react-icons/md"; // For Cancelled
import { CgUnsplash } from "react-icons/cg"; // For Products
import { PiSelectionBackgroundLight } from "react-icons/pi"; // For Categories


const DashboardSummary = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data from your backend API
    axios.get(`${process.env.REACT_APP_API_URL}/api/dashboard-summary`)
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []); // Empty dependency array means this effect runs once after the initial render

  // Display loading message while data is being fetched
  if (!data) return <p>Loading dashboard summary...</p>;

  return (
    <div className="summary-container">

      {/* Orders Summary Section */}
      <div className="order-summary-box">
        <div className="summary-header">
          <h3>Orders Summary</h3>
          {/* Link to view all orders */}
          <Link to="/admin/orders" className="view-all">View All</Link>
        </div>
        <div className="summary-flex">
          {/* Summary cards for each order status, using the correct status names */}
          <SummaryCard label="Processing Orders" value={data.orders.Processing} icon={<GiCardboardBoxClosed />} color="#f6ad55" />
          <SummaryCard label="Verified Orders" value={data.orders.Verified} icon={<BiSolidLike />} color="#d6bcfa" />
          <SummaryCard label="Shipping Orders" value={data.orders.Shipping} icon={<FaTruckField />} color="#b794f4" />
          <SummaryCard label="Received Orders" value={data.orders.Received} icon={<MdOutlineDownloadDone />} color="#4299e1" />
          <SummaryCard label="Completed Orders" value={data.orders.Completed} icon={<IoMdDoneAll />} color="#9f7aea" />
          {/*<SummaryCard label="Cancelled Orders" value={data.orders.Cancelled} icon={<MdCancel />} color="#ef4444" />*/}
        </div>
      </div>

      {/* Product Summary Section */}
      <div className="summary-box">
        <div className="summary-header">
          <h3>Product Summary</h3>
          {/* Link to view inventory */}
          <Link to="/admin/inventory" className="view-all">View All</Link>
        </div>
        <div className="summary-flex">
          {/* Summary cards for product and category counts */}
          <SummaryCard label="Number of Products" value={data.products.ProductCount} icon={<CgUnsplash />} color="#63b3ed" />
          <SummaryCard label="Number of Categories" value={data.products.CategoryCount} icon={<PiSelectionBackgroundLight />} color="#a0aec0" />
        </div>
      </div>
    </div>
  );
};

// Reusable SummaryCard component
const SummaryCard = ({ label, value, icon, color }) => (
  <div className="summary-card">
    <div className="icon-circle" style={{ backgroundColor: color }}>
      <span className="icon">{icon}</span>
    </div>
    <div className="summary-info">
      <h4>{value}</h4>
      <p>{label}</p>
    </div>
  </div>
);

export default DashboardSummary;