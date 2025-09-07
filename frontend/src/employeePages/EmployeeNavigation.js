import React, { useEffect, useState, useRef, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { SiHomepage } from "react-icons/si";
import { MdStorage } from "react-icons/md";
import { BsCartCheckFill, BsSuitcaseLgFill, BsFileEarmarkEaselFill } from "react-icons/bs";
import { Gi3dMeeple } from "react-icons/gi";
import { FaHandshakeAngle, FaUserGroup } from "react-icons/fa6";
import { FaChartPie } from "react-icons/fa";
import { FaRegBell, FaUserCircle, FaChevronDown } from "react-icons/fa";
import { BiMessageSquareDetail } from "react-icons/bi";
import { MdRateReview } from "react-icons/md";

import "./EmployeeNavigation.css";
import { jwtDecode } from "jwt-decode";
import whitelogo from "../assets/EdgiLogo-white.png";
import TerminationModal from './TerminationModal';

const EmployeeNavigation = () => {
    const navigate = useNavigate();
    const [unreadOrderCount, setUnreadOrderCount] = useState(0);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);
    const [latestOrders, setLatestOrders] = useState([]);

    const userDropdownRef = useRef(null);
    const notificationsDropdownRef = useRef(null);

    const [username, setUsername] = useState(null);
    const [userRoleId, setUserRoleId] = useState(null);
    const [userPermissions, setUserPermissions] = useState([]);

    // New state for the termination modal
    const [showTerminationModal, setShowTerminationModal] = useState(false);

    // Initialize user details from token on component mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUsername(decoded.username);
                setUserRoleId(decoded.roleId);
                setUserPermissions(decoded.permissions || []);
            } catch (err) {
                console.error("Invalid token or decoding error:", err);
                localStorage.removeItem("token");
                localStorage.removeItem("username");
                navigate("/employee-login");
            }
        } else {
            navigate("/employee-login");
        }
    }, [navigate]);

    const hasPermission = useCallback((permissionName) => {
        return userPermissions.includes(permissionName);
    }, [userPermissions]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/employee-login");
        setIsUserDropdownOpen(false);
        setShowTerminationModal(false);
    }, [navigate]);

    // Function to check and update employee permissions
    const checkAndUpdatePermissions = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            handleLogout();
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/employee/permissions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.warn(`Permission check failed: ${errorData.message}`);
                // Instead of direct logout, show the termination modal if the reason is session invalidation
                if (response.status === 401 && errorData.message === "Invalid or expired token. Please log in again." || errorData.message === "Account terminated or token version mismatch.") {
                    
                } else {
                    handleLogout(); // For other non-OK responses, still log out
                }
                return;
            }

            const data = await response.json();
            setUserPermissions(data.permissions || []);
            console.log("Permissions updated:", data.permissions);

        } catch (error) {
            console.error("Failed to fetch and update employee permissions:", error);
            // handleLogout(); // Consider if network errors should also force a logout
        }
    }, [handleLogout]);

    // Effect to fetch unread order count and latest orders + check and update permissions
    useEffect(() => {
        const fetchAllData = async () => {
            await checkAndUpdatePermissions();

            const token = localStorage.getItem("token");
            if (!token) {
                return;
            }

            try {
                const unreadRes = await fetch(`${process.env.REACT_APP_API_URL}/orders/unread-count`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!unreadRes.ok) throw new Error(`HTTP error! status: ${unreadRes.status}`);
                const unreadData = await unreadRes.json();
                setUnreadOrderCount(unreadData.unreadCount);

                const latestOrdersRes = await fetch(`${process.env.REACT_APP_API_URL}/api/latest-orders`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!latestOrdersRes.ok) throw new Error(`HTTP error! status: ${latestOrdersRes.status}`);
                const latestOrdersData = await latestOrdersRes.json();
                setLatestOrders(latestOrdersData);

            } catch (err) {
                console.error("Failed to fetch notification data:", err);
            }
        };

        fetchAllData();
        const interval = setInterval(fetchAllData, 10000);
        return () => clearInterval(interval);
    }, [checkAndUpdatePermissions]);

    // Effect to handle clicks outside dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setIsUserDropdownOpen(false);
            }
            if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target)) {
                setIsNotificationsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleProfileClick = () => {
        navigate("/admin/profile");
        setIsUserDropdownOpen(false);
    };

    const toggleUserDropdown = () => {
        setIsUserDropdownOpen((prev) => !prev);
        setIsNotificationsDropdownOpen(false);
    };

    const toggleNotificationsDropdown = async () => {
        setIsNotificationsDropdownOpen((prev) => !prev);
        setIsUserDropdownOpen(false);

        if (!isNotificationsDropdownOpen && unreadOrderCount > 0) {
            const token = localStorage.getItem("token");
            try {
                await fetch(`${process.env.REACT_APP_API_URL}/orders/mark-all-as-read`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setUnreadOrderCount(0);
            } catch (error) {
                console.error("Error marking notifications as read:", error);
            }
        }
    };

    const formatNotificationDateTime = (dateString) => {
        const date = new Date(dateString);
        const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', optionsDate).replace(/(\d{2}) (\w{3}) (\d{4})/, '$1 $2, $3');
        const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
        const formattedTime = date.toLocaleTimeString('en-US', optionsTime);
        return `${formattedDate}, ${formattedTime}`;
    };

    return (
        <div>
            {/* Top Navigation */}
            <nav className="employee-top-nav">
                <div className="icons">
                    {/* Notifications Bell with Badge and Dropdown */}
                    <div className="notification-bell-container" ref={notificationsDropdownRef}>
                        <FaRegBell onClick={toggleNotificationsDropdown} />
                        {unreadOrderCount > 0 && (
                            <span className="notification-badge notification-bell-badge">{unreadOrderCount}</span>
                        )}
                        {isNotificationsDropdownOpen && (
                            <div className="notification-dropdown-menu">
                                <div className="notification-header">
                                    <p>Notifications</p>
                                    <div className="notification-footer">
                                        <button onClick={() => {
                                            navigate('/admin/orders?status=Processing');
                                            setIsNotificationsDropdownOpen(false);
                                        }}>
                                            View All Orders
                                        </button>
                                    </div>
                                </div>

                                {latestOrders.length > 0 ? (
                                    latestOrders.map((order) => (
                                        <div key={order.OrderID} className="notification-item" onClick={() => {
                                            navigate(`/admin/order-details/${order.OrderID}`);
                                            setIsNotificationsDropdownOpen(false);
                                        }}>
                                            <p className="notification-message">
                                                <span className="customer-name">{order.FullName}</span> placed an order
                                                (Total <span className="total-amount">₱{order.TotalAmount.toLocaleString()}</span>)
                                            </p>
                                            <p className="notification-products">
                                                {order.OrderItemsSummary}
                                            </p>
                                            <p className="notification-date-time">
                                                {formatNotificationDateTime(order.OrderDate)}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="notification-item no-notifications">No new orders</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="employee-username-dropdown-container" ref={userDropdownRef}>
                        <div className="employee-username" onClick={toggleUserDropdown}>
                            <FaUserCircle />
                            <div className="employee-username-info">
                                <p className="employee-username-text">{username}</p>
                                <p className="role-text">
                                    {userRoleId === 1 ? "Admin" : userRoleId === 2 ? "Manager" : "Employee"}
                                </p>
                            </div>
                            <div className="dropdown-icon">
                                <FaChevronDown />
                            </div>
                        </div>

                        {isUserDropdownOpen && (
                            <div className="dropdown-menu">
                                <button onClick={handleProfileClick} className="dropdown-item">Profile</button>
                                <button onClick={handleLogout} className="dropdown-item">Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content with Side Navigation */}
            <div className="main-container">
                <nav className="side-nav">
                    <div className="logo">
                        <img src={whitelogo} alt="logo" />
                        <p>EdGi Custom Works</p>
                    </div>

                    {/* Dashboard (generally accessible) */}
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) => isActive || window.location.pathname === "/admin" ? "nav-link active" : "nav-link"}
                    >
                        <div className="nav-item-content">
                            <SiHomepage className="navigation-icon" />
                            Dashboard
                        </div>
                    </NavLink>

                    {/* Products Section Header (only show if any product-related permission exists) */}
                    {(hasPermission('Product Management') || hasPermission('Requested Variants Management') || hasPermission('Order Management') || hasPermission('3d model Management')) && (
                        <div>
                            <h2>Products</h2>
                        </div>
                    )}

                    {/* Product Management */}
                    {hasPermission('Product Management') && (
                        <NavLink to="/admin/inventory" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                            <div className="nav-item-content">
                                <MdStorage className="navigation-icon" />
                                Product
                            </div>
                        </NavLink>
                    )}

                    {/* Requested Variants Management */}
                    {hasPermission('Requested Variants Management') && (
                        <NavLink to="/admin/request-variant-list" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                            <div className="nav-item-content">
                                <MdStorage className="navigation-icon" />
                                Requested Variants
                            </div>
                        </NavLink>
                    )}

                    {/* Order Management */}
                    {hasPermission('Order Management') && (
                        <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                            <div className="nav-item-content">
                                <BsCartCheckFill className="navigation-icon" />
                                Orders
                                {unreadOrderCount > 0 && <span className="notification-badge">{unreadOrderCount}</span>}
                            </div>
                        </NavLink>
                    )}

                    {/* 3D Model Management */}
                    {hasPermission('3d model Management') && (
                        <NavLink to="/admin/model-management" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                            <div className="nav-item-content">
                                <Gi3dMeeple className="navigation-icon" />
                                3D Models
                            </div>
                        </NavLink>
                    )}

                    {/* Accounts Section Header (only show if any account-related permission exists) */}
                    {(hasPermission('Hiring Employee') || hasPermission('Employee List Management') || hasPermission('Audit trail View') || hasPermission('Customer Management')) && (
                        <div>
                            <h2>Accounts</h2>
                        </div>
                    )}

                    {/* Product Review Management */}
                    {hasPermission('Product Review Management') && (
                        <NavLink to="/admin/product-review-list" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                            <div className="nav-item-content">
                                <MdRateReview className="navigation-icon" />
                                Product Reviews
                            </div>
                        </NavLink>
                    )}

                    {/* Customer Management */}
                    {hasPermission('Customer Management') && (
                        <NavLink to="/admin/user-management" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                            <div className="nav-item-content">
                                <FaUserGroup className="navigation-icon" />
                                Customers
                            </div>
                        </NavLink>
                    )}
                    {hasPermission('Chat Support') && (
                        <NavLink to="/admin/livechat" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                            <div className="nav-item-content">
                                <BiMessageSquareDetail className="navigation-icon" />
                                Live Chat
                            </div>
                            
                        </NavLink>
                    )}
                    {/* Hiring Employee */}
                    {hasPermission('Hiring Employee') && (
                        <NavLink to="/admin/hire" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                            <div className="nav-item-content">
                                <FaHandshakeAngle className="navigation-icon" />
                                Add Employee
                            </div>
                        </NavLink>
                    )}

                    {/* Employee List Management */}
                    {hasPermission('Employee List Management') && (
                        <NavLink to="/admin/employee-list" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                            <div className="nav-item-content">
                                <BsSuitcaseLgFill className="navigation-icon" />
                                Employee List
                            </div>
                        </NavLink>
                    )}

                    {/* Audit Trail View */}
                    {hasPermission('Audit trail View') && (
                        <NavLink to="/admin/audit-trail" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                            <div className="nav-item-content">
                                <BsFileEarmarkEaselFill className="navigation-icon" />
                                Audit Trail
                            </div>
                        </NavLink>
                    )}

                    
                </nav>

                {/* Page content goes here */}
                <div className="dashboard-content">
                    <Outlet />
                </div>
            </div>

            {/* Termination Modal */}
            <TerminationModal
                show={showTerminationModal}
                onConfirm={handleLogout} // When "OK" is clicked, log the user out
            />
        </div>
    );
};

export default EmployeeNavigation;