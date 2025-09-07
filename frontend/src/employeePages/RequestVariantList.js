import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5"; 
import "./RequestedVariantList.css";
// Make sure formatOrderDateTime is accessible, assuming it's in a utils folder
import { FaChevronRight } from "react-icons/fa";
import { formatOrderDateTime } from '../utils/dateFormatter'; 

const RequestedVariantList = () => {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]); 
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [searchTerm, setSearchTerm] = useState(""); 
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/requested-variants-list?status=${selectedStatus}`)
            .then((res) => res.json())
            .then((data) => {
                setRequests(data);
                setFilteredRequests(data); 
            })
            .catch((err) => console.error("Error fetching requested variants:", err));
    }, [selectedStatus]);

    useEffect(() => {
        const filtered = requests.filter((req) => {
            const search = searchTerm.toLowerCase();
            const statusText = getStatusText(req.Status).toLowerCase(); // Include status in search
            return (
                req.ProductName?.toLowerCase().includes(search) ||
                req.RequestedVariantName?.toLowerCase().includes(search) ||
                req.username?.toLowerCase().includes(search) ||
                new Date(req.RequestDate).toLocaleString().toLowerCase().includes(search) ||
                (req.Price === 0 || req.Price === undefined || req.Price === null ? 'tbd' : `₱${Number(req.Price).toLocaleString()}`).toLowerCase().includes(search) ||
                statusText.includes(search) // Search by status text
            );
        });
        setFilteredRequests(filtered);
    }, [searchTerm, requests]);

    // Helper function to get status text
    const getStatusText = (status) => {
        switch (status) {
            case 1:
                return "Approved";
            case 2:
                return "Rejected";
            case 0:
            case null: // Assuming null or 0 means pending
            default:
                return "Pending";
        }
    };

    // Helper function to get status class for styling
    const getStatusClassName = (status) => {
        switch (status) {
            case 1:
                return "status-approved";
            case 2:
                return "status-rejected";
            case 0:
            case null:
            default:
                return "status-pending";
        }
    };

    return (
        <div className="requested-variants-container">
            <h2 className="title-req">Requested Custom Variants ({selectedStatus})</h2>

            <div className="inventory-controls"> 
                <div className="left-controls">
                    {["All", "Pending", "Approved", "Rejected"].map((status) => (
                        <button
                            key={status}
                            className={`filter-btn ${selectedStatus === status ? "active" : ""}`}
                            onClick={() => setSelectedStatus(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="right-controls">
                    <div className="search-wrapper">
                        <IoSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by Product, Variant, Username, Date, or Status" // Updated placeholder
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
                        <th>ID</th>
                        <th>Requested Variant</th>
                        <th>Price</th>
                        <th>Username</th>
                        <th>Request Date</th>
                        <th>Status</th>
                        <th className="request-details">Details</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRequests.map((req) => (
                        <tr key={req.RequestedVariantID}>
                            <td className="id">#{req.RequestedVariantID}</td>
                            <td className="requested-variant-cell">
                                <span className="variant-name">{req.RequestedVariantName}</span>
                                <br />
                                <span className="product-name">
                                Product: {req.ProductName}
                                </span>  
                            </td>
                            <td>
                                {req.Price === 0 || req.Price === undefined || req.Price === null ? (
                                    <span className="tbd-price" title="To be determined">TBD</span>
                                ) : (
                                    `₱${Number(req.Price).toLocaleString()}`
                                )}
                            </td>
                            <td>{req.username}</td>
                            <td className="request-date">{formatOrderDateTime(req.RequestDate)}</td>
                            <td>
                                <p className={getStatusClassName(req.Status)}>
                                    {getStatusText(req.Status)}
                                </p>
                                
                            </td>
                            <td className="request-details">
                                <button onClick={() => navigate(`/admin/requested-variant/${req.RequestedVariantID}`)}> <FaChevronRight /> </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RequestedVariantList;