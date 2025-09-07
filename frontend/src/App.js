import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

//ENHANCED FAQ CHAT
import EnhancedFAQChat from "./components/EnhancedFAQChat";
import "leaflet/dist/leaflet.css";

//USER MANAGEMENT
import Navigation from "./pages/Navigation";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OTPVerification from "./pages/OTPVerification";
import ChangePassword from "./pages/ChangePassword";
import ProductDetails from "./components/ProductDetails"; 
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessful from "./components/OrderSuccesful";
import CartPage from "./pages/CartPage";
import Homepage from "./pages/Home";
import Products from "./components/Products";
import Model from "./components/Models";
import ModelsByCategory from "./components/ModelsByCategory";

import Shop from "./components/Shop";
import PopularProducts from "./components/PopularProducts";
import ModelDetails from "./components/ModelDetails";
import TermsModal from "./components/TermsModal";
import UserProfile from "./components/UserProfile";
import UserAddresses from "./components/UserAddresses";
import UserOrder from "./components/UserOrder";
import TrackingPage from "./components/TrackingPage";
import AboutUs from "./pages/AboutUs";
import RequestPage from "./pages/RequestPage";
import CheckoutPageR from "./pages/CheckoutPageR";


// Employee Pages
import EmployeeLogin from "./employeePages/EmployeeLogin";
import EmployeeDashboard from "./employeePages/Dashboard";
import EmployeeProfile from "./employeePages/EmployeeProfile";
import Inventory from "./employeePages/Inventory";
import InventoryDetails from "./employeePages/InventoryDetails";
import Orders from "./employeePages/Orders";
import OrderDetails from "./employeePages/OrdersDetails";
import CategoryManager from "./employeePages/CategoryManager";
import Hire from "./employeePages/Hire";
import EmployeeList from "./employeePages/EmployeeList";
import TerminatedEmployees from "./employeePages/TerminatedEmployees";
import UserManagement from "./employeePages/UserManagement";
import UserManagementDetails from "./employeePages/UserManagementDetails";
import AuditTrail from "./employeePages/AuditTrail";
import EmployeeNavigation from "./employeePages/EmployeeNavigation";
import Charts from "./employeePages/Charts/Charts";
import EmployeeModels from "./employeePages/EmployeeModels";
import EmployeeModelsDetails from "./employeePages/EmployeeModelsDetails";
import RequestVariantList from "./employeePages/RequestVariantList";
import RequestedVariant from "./employeePages/RequestedVariant";
import AdminLiveChat from "./employeePages/AdminLiveChat";
import ProductReviewList from "./employeePages/ProductReviewList";
import ProductReviewAdmin from "./employeePages/ProductReviewAdmin";
import ReportedComments from "./employeePages/ReportedComments";



//PROTECTED ROUTE FOR EMPLOYEES
import { jwtDecode } from "jwt-decode";


const PrivateRoute = ({ children, requiredPermissions }) => {
    const token = localStorage.getItem("token");

    // If no token, redirect to login
    if (!token) {
        return <Navigate to="/employee-login" />;
    }

    try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;

        // Check if the token has expired
        if (decoded.exp < now) {
            localStorage.removeItem("token");
            return <Navigate to="/employee-login" />;
        }

        // Extract permissions from the decoded token
        const userPermissions = decoded.permissions || []; // Ensure it's an array

        // If specific permissions are required for this route
        if (requiredPermissions && requiredPermissions.length > 0) {
            // Check if the user has AT LEAST ONE of the required permissions
            const hasRequiredPermission = requiredPermissions.some(
                (permission) => userPermissions.includes(permission)
            );

            if (!hasRequiredPermission) {
                return <Navigate to="/admin/unauthorized" />; // Redirect to an unauthorized page
            }
        }

        // If no specific permissions are required, or user has them, grant access
        return children;
    } catch (error) {
        console.error("Token decoding failed:", error);
        localStorage.removeItem("token");
        return <Navigate to="/employee-login" />;
    }
};




function App() {
    const [userID, setUserID] = useState(localStorage.getItem("userID"));
    const [username, setUsername] = useState(localStorage.getItem("username"));
  
    useEffect(() => {
      const handleStorageChange = () => {
        setUserID(localStorage.getItem("userID"));
        setUsername(localStorage.getItem("username"));
      };
  
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }, []);
  

  
    // Component to conditionally render FAQ chat based on route
const ConditionalFAQChat = () => {
  const location = useLocation();

  // Don't show FAQ chat on admin/employee pages
  const isAdminRoute =
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/employee');

  // Don't show FAQ chat on cart, checkout, checkout-request, and requested-variant pages
  const isHiddenPage = 
    location.pathname.startsWith('/cart') ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/checkout-request') ||
    location.pathname.startsWith('/request');

  if (isAdminRoute || isHiddenPage) {
    return null;
  }

  return (
    <EnhancedFAQChat 
      userID={userID} 
      username={username}
    />
  );
};

    return (
      <Router>
       <div style={{ textAlign: "center" }}>
    {/* ✅ Enhanced FAQ Chat System - Customer Pages Only */}
    <ConditionalFAQChat />
          
  
          
          <Routes>
            
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="/" element={<Navigation />}>
              <Route index element={<Homepage />} />
              <Route path="homepage" element={<Homepage />} />
              <Route path="terms" element={<TermsModal />} />
              <Route path="otp-verification" element={<OTPVerification />} />
              <Route path="user-profile/:userID" element={<UserProfile />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="checkout-request" element={<CheckoutPageR />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="request" element={<RequestPage />} />
              <Route path="products" element={<Products />} />
              <Route path="model" element={<Model />} />
              <Route path="user-order" element={<UserOrder />} />
              <Route path="user-addresses" element={<UserAddresses />} />
              <Route path="tracking/:orderID" element={<TrackingPage />} />
              <Route path="shop" element={<Shop />} />
              <Route path="models/:id" element={<ModelDetails />} />
              <Route path="models/category/:categoryId" element={<ModelsByCategory />} />
              <Route path="about-us" element={<AboutUs />} />
            </Route>
  
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="order-successful" element={<OrderSuccessful />} />
            <Route path="popular-products" element={<PopularProducts />} />

  
            {/* Employee Pages  */}
            <Route path="/employee-login" element={<EmployeeLogin />} />
            <Route path="/admin" element={<PrivateRoute><EmployeeNavigation /></PrivateRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PrivateRoute><EmployeeDashboard /></PrivateRoute>} />
              <Route path="charts" element={<PrivateRoute><Charts /></PrivateRoute>} />
              <Route path="profile" element={<PrivateRoute><EmployeeProfile /></PrivateRoute>} />
  
              <Route path="inventory" element={<PrivateRoute requiredPermissions={['Product Management']}><Inventory /></PrivateRoute>} />
              <Route path="inventory-details/:productId" element={<PrivateRoute requiredPermissions={['Product Management']}><InventoryDetails /></PrivateRoute>} />
              <Route path="category-manager" element={<PrivateRoute requiredPermissions={['Product Management']}><CategoryManager /></PrivateRoute>} />
  
              <Route path="orders" element={<PrivateRoute requiredPermissions={['Order Management']}><Orders /></PrivateRoute>} />
              <Route path="order-details/:orderId" element={<PrivateRoute requiredPermissions={['Order Management']}><OrderDetails /></PrivateRoute>} />

              <Route path="model-management" element={<PrivateRoute requiredPermissions={['3d model Management']}><EmployeeModels /></PrivateRoute>} />
              <Route path="model-management-details/:id" element={<PrivateRoute requiredPermissions={['3d model Management']}><EmployeeModelsDetails /></PrivateRoute>} />

              <Route path="hire" element={<PrivateRoute requiredPermissions={['Hiring Employee']}><Hire /></PrivateRoute>} />
              <Route path="employee-list" element={<PrivateRoute requiredPermissions={['Employee List Management']}><EmployeeList /></PrivateRoute>} />
              <Route path="terminated-employees" element={<PrivateRoute requiredPermissions={['Employee List Management']}><TerminatedEmployees /></PrivateRoute>} />
  
              <Route path="audit-trail" element={<PrivateRoute requiredPermissions={['Audit trail View']}><AuditTrail /></PrivateRoute>} />
  
              <Route path="user-management" element={<PrivateRoute requiredPermissions={['Customer Management']}><UserManagement /></PrivateRoute>} />
              <Route path="user-management/:user_tag" element={<PrivateRoute requiredPermissions={['Customer Management']}><UserManagementDetails /></PrivateRoute>} />
              
              <Route path="product-review-list" element={<PrivateRoute requiredPermissions={['Product Review Management']}><ProductReviewList /></PrivateRoute>} />
              <Route path="product-reviews/:id" element={<PrivateRoute requiredPermissions={['Product Review Management']}><ProductReviewAdmin /></PrivateRoute>} />
              <Route path="reported-comments" element={<PrivateRoute requiredPermissions={['Product Review Management']}><ReportedComments /></PrivateRoute>} />

              <Route path="livechat" element={<PrivateRoute requiredPermissions={['Chat Support']}><AdminLiveChat /></PrivateRoute>} />
  
              <Route path="request-variant-list" element={<PrivateRoute requiredPermissions={['Requested Variants Management']}><RequestVariantList /></PrivateRoute>} />
              <Route path="requested-variant/:id" element={<PrivateRoute requiredPermissions={['Requested Variants Management']}><RequestedVariant /></PrivateRoute>} />
  
              <Route path="unauthorized" element={<div>Unauthorized Access.</div>} />
            </Route>
  
            <Route path="*" element={<div>Page Not Found</div>} />
          </Routes>
        </div>
      </Router>
    );
  }

export default App;
