import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Orders.css";
import { FaChevronRight } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import { formatOrderDateTime, formatOrderDateForSearch } from '../utils/dateFormatter'; 

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("All Orders");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 100;

    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    let roleId = null;
    let username = null;
    let employeeId = null;

    if (token) {
        try {
            const decoded = jwtDecode(token);
            roleId = decoded.roleId;
            username = decoded.username;
            employeeId = decoded.employeeId;
        } catch (err) {
            console.error("Invalid token:", err);
        }
    }

    // Effect to fetch orders based on selectedStatus
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/orders?status=${selectedStatus}`)
            .then((res) => res.json())
            .then((data) => {
                console.log("Fetched Orders:", data);
                // Assuming 'data' here is the array of orders
                setOrders(data);
            })
            .catch((err) => console.error("Error fetching orders:", err));
    }, [selectedStatus]); // Re-fetch when selectedStatus changes

    // Effect to filter orders based on search term
    useEffect(() => {
        const filtered = orders.filter((order) => {
            const search = searchTerm.toLowerCase();
            return (
                order.OrderID?.toString().includes(search) ||
                order.FullName?.toLowerCase().includes(search) ||
                order.StreetAddress?.toLowerCase().includes(search) ||
                order.PaymentMethod?.toLowerCase().includes(search) ||
                order.OrderStatus?.toLowerCase().includes(search) ||
                
                formatOrderDateForSearch(order.OrderDate).toLowerCase().includes(search) || 
                (order.PayPalTransactionID?.toLowerCase() || "").includes(search)
            );
        });
        setFilteredOrders(filtered);
        setCurrentPage(1); // Reset to first page on search or orders change
    }, [searchTerm, orders]); // Re-filter when search term or orders change

    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    const getStatusClassName = (status) => {
        switch (status) {
            case "Processing":
                return "order-status-processing";
            case "Verified":
                return "order-status-verified";
            case "Shipping":
                return "order-status-shipping";
            case "Received":
                return "order-status-received";
            case "Completed":
                return "order-status-completed";
            case "Cancelled": // Ensure Cancelled also has a style
                return "order-status-cancelled";
            default:
                return "";
        }
    };

    const getFilterButtonClassName = (status) => {
        if (selectedStatus === status) {
            return `filter-btn active filter-btn-${status.toLowerCase().replace(/\s/g, '-')}`; // Handle spaces for class names
        }
        return `filter-btn filter-btn-${status.toLowerCase().replace(/\s/g, '-')}`; // Handle spaces for class names
    };

    // Initialize statusCounts to match your API response keys
    const [statusCounts, setStatusCounts] = useState({
        "Processing": 0,
        "Verified": 0,
        "Shipping": 0,
        "Received": 0,
        "Completed": 0,
        "Cancelled": 0, // Make sure 'Cancelled' is included if the API returns it
        "All Orders": 0
    });

    // Effect to fetch and update status counts from dashboard summary
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/dashboard-summary`)
            .then(res => res.json())
            .then(data => {
                const counts = {
                    "Processing": data.orders.Processing || 0, // Use || 0 to handle undefined if API doesn't return it
                    "Verified": data.orders.Verified || 0,
                    "Shipping": data.orders.Shipping || 0,
                    "Received": data.orders.Received || 0,
                    "Completed": data.orders.Completed || 0,
                    "Cancelled": data.orders.Cancelled || 0, // Correctly map Cancelled count
                };
                // Sum all individual status counts for "All Orders"
                counts["All Orders"] = Object.values(counts).reduce((a, b) => a + b, 0);
                setStatusCounts(counts);
            })
            .catch(err => console.error("Failed to fetch dashboard summary:", err));
    }, []); // Empty dependency array, runs once on component mount

    return (
        <div>
            <div className="orders-container">
                <div className="orders-content">
                    <h2 className="title-man">Manage Orders ({selectedStatus})</h2>

                    <div className="order-filters">
                        {/* Ensure these statuses match your API and desired filters */}
                        {["All Orders", "Processing", "Verified", "Shipping", "Received", "Completed", ].map((status) => (
                            <button
                                key={status}
                                className={getFilterButtonClassName(status)}
                                onClick={() => setSelectedStatus(status)}
                            >
                                {status} <span className="filter-count">({statusCounts[status] || 0})</span>
                            </button>
                        ))}
                    </div>

                    <div className="top-controls">
                        <div className="search-wrapper">
                            <IoSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Customer Name, Address, Status, or Date"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-order-input"
                            />
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer Name</th>
                                <th>Street Address</th>
                                <th>Order Date</th>
                                <th>Total Amount</th>
                                <th>Status</th>
                                <th className="details-column">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentOrders.length > 0 ? (
                                currentOrders.map((order) => (
                                    <tr key={order.OrderID} className={order.IsRead != null && Number(order.IsRead) === 0 ? "unread-order" : "read-order"}>
                                        <td className="id">#{order.OrderID}</td>
                                        <td>{order.FullName}</td>
                                        <td>
                                            {order.StreetAddress.length > 30
                                            ? order.StreetAddress.substring(0, 30) + "..."
                                            : order.StreetAddress}
                                        </td>
                                        <td className="order-date-time">{formatOrderDateTime(order.OrderDate)}</td>
                                        <td><strong>₱{order.TotalAmount.toLocaleString()}</strong></td>

                                        <td className={getStatusClassName(order.OrderStatus)}><p>{order.OrderStatus}</p></td>
                                        
                                        <td className=".details-column">
                                            <button onClick={() => navigate(`/admin/order-details/${order.OrderID}`)}><FaChevronRight /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center" }}>No orders found for the current filter or search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Prev
                            </button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Orders;