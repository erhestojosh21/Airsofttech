import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./OrderSuccessful.css";
import Logo from "../assets/EdgiLogo.png";

const OrderSuccessful = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderID, PayPalTransactionID, purchasedItems, totalAmount, shippingFee, finalTotal, finalTotalUSD } = location.state || {};


  if (!orderID || !PayPalTransactionID || !purchasedItems) {
    navigate("/");
    return null;
  }

  return (
    <div className="order-success-page">
      <h2>Thank you for your purchase!</h2>
      <p>Your order has been placed successfully.</p>

      <div className="order-summary">
        <img src={Logo} alt="Edgi Logo" className="reciept-logo" />
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> {orderID}</p>
        <p><strong>PayPal Transaction ID:</strong> {PayPalTransactionID}</p>

        <h3>Purchased Items</h3>
        <ul className="ordered-items">
          {purchasedItems.map((item) => (
            <li key={item.cartID}>
              <img src={item.image || "https://via.placeholder.com/50"} alt={item.productName} />
              <div>
                <p><strong>{item.productName || item.ProductName}</strong></p>
                <p>Variant: {item.variantName || item.RequestedVariantName}</p>
                <p>Quantity: {item.quantity}</p>
                <p>Price: ₱{Number(item.price ?? item.Price).toLocaleString()}</p>

              </div>
            </li>
          ))}
        </ul>

        {typeof totalAmount === "number" && (
          <h3>Total Item Price: ₱{totalAmount.toLocaleString()}</h3>
        )}

        
        {typeof shippingFee === "number" && (
          <h3>Shipping Fee: ₱{shippingFee.toLocaleString()}</h3>
        )}


        {typeof finalTotal === "number" && (
          <h3>Final Amount (with Shipping): ₱{finalTotal.toLocaleString()}</h3>
        )}

        {finalTotalUSD && (
          <h4 className="usd-style">Charged Amount: ${finalTotalUSD} USD via PayPal</h4>
        )}


        <button className="continue-shopping-btn" onClick={() => navigate("/shop")}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessful;
