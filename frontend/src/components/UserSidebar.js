import React from "react";
import { NavLink } from "react-router-dom";
import "./UserSidebar.css";
import AOS from 'aos';
import 'aos/dist/aos.css';

const Sidebar = () => {
  AOS.init({ duration: 1000 });

  return (
    <div className="sidebar" >
      <h2>Profile Management</h2>
      <hr/> 
      <ul>
      <li>
          <NavLink to="/user-profile/:userID" activeClassName="active-link">
            User Profile
          </NavLink>
        </li>

        <li>
          <NavLink to="/user-order" activeClassName="active-link">
            My Purchase
          </NavLink>
        </li>
        <li>
          <NavLink to="/user-addresses" activeClassName="active-link">
            Addresses
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;