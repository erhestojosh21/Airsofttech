import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CheckoutPage.css";
import PayPalButton from "../components/PayPalButton";

const CheckoutPageR = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userID = localStorage.getItem("userID");
  const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID";

  const [selectedItems, setSelectedItems] = useState(location.state?.selectedItems || []);
  const [totalSelectedPrice, setTotalSelectedPrice] = useState(location.state?.totalSelectedPrice || 0);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [finalTotalUSD, setFinalTotalUSD] = useState(null);

  useEffect(() => {
  const estimateShipping = async () => {
    if (!defaultAddress) return;

    const destinationCountry = defaultAddress.Country?.toLowerCase();
    let fee = 0;

    if (destinationCountry === "philippines") {
      fee = 300; // flat fee
    } else {
      try {
        // Fetch conversion rate from Frankfurter API (USD → PHP)
        const response = await axios.get("https://api.frankfurter.app/latest", {
          params: {
            amount: 55, // $55
            from: "USD",
            to: "PHP",
          },
        });

        fee = response.data.rates.PHP || 55 * 56; // fallback ~56 PHP/USD
      } catch (error) {
        console.error("Currency conversion failed:", error);
        fee = 55 * 56; // fallback if API fails
      }
    }

    setShippingFee(fee);
    setFinalTotal(totalSelectedPrice + fee);
  };

  estimateShipping();
}, [defaultAddress, totalSelectedPrice]);

  useEffect(() => {
    const convertToUSD = async () => {
      try {
        const response = await axios.get(
          `https://api.frankfurter.app/latest?amount=${finalTotal}&from=PHP&to=USD`
        );
        const usd = response.data.rates.USD.toFixed(2);
        setFinalTotalUSD(usd);
      } catch (error) {
        console.error("Currency conversion failed:", error);
      }
    };

    if (finalTotal > 0) convertToUSD();
  }, [finalTotal]);

  useEffect(() => {
    if (!userID) {
      navigate("/login");
      return;
    }
    fetchDefaultAddress();
  }, [navigate, userID]);

  const fetchDefaultAddress = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/get-default-address?userID=${userID}`);
      const data = await response.json();
      if (data) {
        setDefaultAddress(data);
      } else {
        setShowAddressModal(true);
      }
    } catch (error) {
      console.error("Error fetching default address:", error);
      setShowAddressModal(true);
    }
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setSelectedItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.RequestedVariantID === id ? { ...item, quantity: newQuantity } : item
      );
      recalculateTotalPrice(updatedItems);
      return updatedItems;
    });
  };

  const removeItem = (id) => {
    const updatedItems = selectedItems.filter(item => item.RequestedVariantID !== id);
    setSelectedItems(updatedItems);
    recalculateTotalPrice(updatedItems);
  };

  const recalculateTotalPrice = (items) => {
    const newTotal = items.reduce((sum, item) => sum + (item.Price || 0), 0);
    setTotalSelectedPrice(newTotal);
  };

  const handlePaymentSuccess = async (details) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/place-order-r`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID,
          address: defaultAddress,
          items: selectedItems,
          totalAmount: totalSelectedPrice,
          shippingCharge: shippingFee,
          finalPrice: finalTotal,
          paymentStatus: "Paid",
          PayPalTransactionID: details.id,
          isRequestedCheckout: true
        }),
      });

      if (!response.ok) throw new Error("Order placement failed.");

      const data = await response.json();
      navigate("/order-successful", {
        state: {
          orderID: data.orderID,
          PayPalTransactionID: details.id,
          purchasedItems: selectedItems,
          totalAmount: totalSelectedPrice,
          shippingFee,
          finalTotal,
          finalTotalUSD,
        }
      });

    } catch (error) {
      console.error("Error placing order:", error);
    }
  };

  return (
    <div className="checkout-page">
      <h2>Requested Variant Checkout</h2>

      {defaultAddress && (
        <div className="default-address-box">
          <h3>Delivery Address</h3>
          <p><strong>{defaultAddress.FullName} (+{defaultAddress.PhoneNumber})</strong></p>
          <p>{defaultAddress.StreetAddress}, {defaultAddress.City}, {defaultAddress.StateProvince}, {defaultAddress.PostalCode}, {defaultAddress.Country}</p>
          <span className="default-badge">Default</span>
          <a className="change-address-btn" onClick={() => navigate("/user-addresses")}>Change</a>
        </div>
      )}

      <div className="cart-container">
        <h3>Requested Variant(s)</h3>
        {selectedItems.length === 0 ? (
          <p className="empty-message">No requested variants for checkout.</p>
        ) : (
          <table className="cart-table">
            <thead>
              <tr>
                <th className="product-col" style={{ width: "40%" }}>Product Details</th>
                <th className="price-col">Unit Price</th>
                <th className="quantity-col">Quantity</th>
                <th className="total-price-col">Total</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedItems.map((item) => (
                <tr key={item.RequestedVariantID}>
                  <td className="product-col">
                    <div className="product-name-cell">
                      <img
                        src={item.image || "https://placehold.co/100x100/A0A0A0/FFFFFF?text=No+Image"}
                        alt={item.ProductName}
                        className="product-thumbnail"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://placehold.co/100x100/A0A0A0/FFFFFF?text=No+Image";
                        }}
                      />
                      <div className="product-name-desc">
                        <h3>{item.ProductName}</h3>
                        <p><strong>Variant:</strong> {item.RequestedVariantName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="price-col">₱{Number(item.Price).toLocaleString()}</td>
                  <td className="quantity-col">
                    <div className="cart-quantity">
                      <button onClick={() => updateQuantity(item.RequestedVariantID, item.quantity - 1)}>-</button>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.RequestedVariantID, parseInt(e.target.value, 10))}
                      />
                      <button onClick={() => updateQuantity(item.RequestedVariantID, item.quantity + 1)}>+</button>
                    </div>
                  </td>
                  <td className="total-price-col">₱{(item.Price * item.quantity).toLocaleString()}</td>
                  <td className="actions-col">
                    <button className="delete-button" onClick={() => removeItem(item.RequestedVariantID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="payment-methods">
        <div className="total-computation">
          <p>Total Item(s) Price: ₱{totalSelectedPrice.toLocaleString()}</p>
          <p>Estimated Shipping Fee: ₱{shippingFee.toLocaleString()}</p>
          <h3 className="final-total">
            Final Total: ₱{finalTotal.toLocaleString()}
            {finalTotalUSD && <span className="usd-style"> (${finalTotalUSD} USD)</span>}
          </h3>
        </div>

        {PAYPAL_CLIENT_ID ? (
          <PayPalButton amount={finalTotal} onSuccess={handlePaymentSuccess} />
        ) : (
          <p className="error-message">Error: PayPal Client ID is missing.</p>
        )}
      </div>

      <div className="product-terms-container">
        <div className="product-terms">
          <h4>Terms and Conditions for Requested Variants:</h4>
          <p><strong>1. Custom Order:</strong> Requested variants are subject to availability and production timelines.</p>
          <p><strong>2. Full Payment:</strong> Required upfront for processing.</p>
          <p><strong>3. Shipping Fee:</strong> To be collected as cash on delivery.</p>
          <p><strong>4. Cancellation:</strong> Not allowed once order is submitted.</p>
        </div>
      </div>

      {showAddressModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>No Default Address</h3>
            <p>You have not set a default address. Please set one before proceeding to checkout.</p>
            <button
              className="modal-ok-btn"
              onClick={() => {
                setShowAddressModal(false);
                navigate("/user-addresses");
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPageR;