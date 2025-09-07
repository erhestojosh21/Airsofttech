import React, { useEffect, useState, useRef } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";

import "./Navigation.css";
import logo from "../assets/EdgiLogo-white.png";

import { FaUserCircle, FaChevronDown } from "react-icons/fa";
import { TiShoppingCart } from "react-icons/ti";

const Navigation = () => {
  const navigate = useNavigate();
  const [userID, setUserID] = useState(null);
  const [username, setUsername] = useState(null);

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    const storedUsername = localStorage.getItem("username");
    setUserID(storedUserID);
    setUsername(storedUsername);

    const handleStorageChange = () => {
      setUserID(localStorage.getItem("userID"));
      setUsername(localStorage.getItem("username"));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userID");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
    setIsUserDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="navigation-container">
      <div className="header-container">
        <title>EdGi Custom Works</title>

        <marquee>
          <span className="marquee-header">NO REFUND POLICY</span> – All sales are final; once an order is placed, it cannot be refunded. &nbsp;&nbsp;
          <span className="marquee-header">PRE-ORDER SYSTEM</span> – Items are produced or sourced after you place your order, so delivery may take additional time.
        </marquee>

        {/* Top Navigation */}
        <nav className="top-nav">
          <div className="CompanyName">
            <img className="logo" src={logo} alt="logo" />
          </div>

          <nav className="bottom-nav">
            <NavLink to="/homepage" className={({ isActive }) => (isActive || window.location.pathname === "/" ? "nav-link active" : "nav-link")}>
              HOME
            </NavLink>
            <NavLink to="/shop" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              SHOP
            </NavLink>
            <NavLink to="/model" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              3D ATTACHMENTS
            </NavLink>
            <NavLink to="/about-us" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              ABOUT US
            </NavLink>
          </nav>

          <div className="icons">
            {/* Cart */}
            <TiShoppingCart
              className="cart-icon"
              onClick={() => navigate(`/cart`)}
              style={{ cursor: "pointer" }}
            />

            {/* User Section */}
            {userID ? (
              <div className="username-dropdown-container" ref={userDropdownRef}>
                <div className="username" onClick={() => setIsUserDropdownOpen((prev) => !prev)}>
                  <FaUserCircle className="user-icon" />
                  <div className="username-info">
                    <p className="username-text">{username || "User"}</p>
                  </div>
                  <div className="dropdown-icon">
                    <FaChevronDown />
                  </div>
                </div>

                {isUserDropdownOpen && (
                  <div className="dropdown-menu">
                    <button onClick={() => { navigate("/user-profile/:userID"); setIsUserDropdownOpen(false); }} className="dropdown-item">
                      Profile
                    </button>
                    <button onClick={() => { navigate("/user-order"); setIsUserDropdownOpen(false); }} className="dropdown-item">
                      Orders
                    </button>
                    <button onClick={() => { navigate("/user-addresses"); setIsUserDropdownOpen(false); }} className="dropdown-item">
                      Addresses
                    </button>
                    <button onClick={handleLogout} className="dropdown-item">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="login-buttons">
                <button onClick={() => navigate("/signup")} className="landing-signup-button">
                  SIGN UP
                </button>
                <button onClick={() => navigate("/login")} className="landing-login-button">
                  LOGIN
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Dynamic Page Rendering */}
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Navigation;
