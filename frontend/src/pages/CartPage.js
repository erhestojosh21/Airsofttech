import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSortAlphaUp, FaSortAlphaDown, FaSortNumericUp, FaSortNumericDown } from "react-icons/fa"; // Importing sort icons
import "./CartPage.css";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const navigate = useNavigate();

  const userID = localStorage.getItem('userID');

  useEffect(() => {
    if (userID) {
      fetchCartItems();
    }
  }, [userID]);

  const fetchCartItems = () => {
    fetch(`${process.env.REACT_APP_API_URL}/cart/${userID}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCartItems(data);
        } else {
          setCartItems([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching cart items:", error);
        setCartItems([]);
      });
  };

  // ✅ Update quantity in cart
  const updateQuantity = (cartID, newQuantity) => {
    // Prevent quantity from going below 1 or above 50 (your specified max)
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > 50) newQuantity = 50;

    // Optimistically update UI
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartID === cartID ? { ...item, quantity: newQuantity } : item
      )
    );

    fetch(`${process.env.REACT_APP_API_URL}/cart/${cartID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQuantity }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to update quantity');
        }
        return res.json();
      })
      .catch((error) => {
        console.error("Error updating quantity:", error);
        // Revert UI on error or simply re-fetch to ensure data consistency
        fetchCartItems();
      });
  };

  // ✅ Remove item from cart
  const handleRemove = (cartID) => {
    fetch(`${process.env.REACT_APP_API_URL}/cart/${cartID}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to delete item');
        }
        return res.json();
      })
      .then(() => {
        setCartItems((prevItems) => prevItems.filter((item) => item.cartID !== cartID));
        setSelectedItems((prevSelected) => {
            const newSelected = new Set(prevSelected);
            newSelected.delete(cartID); // Also remove from selected if deleted
            return newSelected;
        });
      })
      .catch((error) => console.error("Error deleting item:", error));
  };

  // ✅ Select/Deselect all items (excluding sold-out items)
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const selectableItems = cartItems.filter(item => item.variantQuantity > 0);
      setSelectedItems(new Set(selectableItems.map(item => item.cartID)));
    } else {
      setSelectedItems(new Set());
    }
  };

  // ✅ Select/Deselect a single item
  const handleSelectItem = (cartID, isSoldOut) => {
    if (isSoldOut) return; // Prevent selection of sold-out items

    setSelectedItems((prevSelected) => {
      const newSelected = new Set(prevSelected);
      newSelected.has(cartID) ? newSelected.delete(cartID) : newSelected.add(cartID);
      return newSelected;
    });
  };

  const handleQuantityInputChange = (cartID, value) => {
    let newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) newQuantity = 1;
    if (newQuantity > 50) newQuantity = 50;

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.cartID === cartID ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // ✅ Calculate total selected items and total price
  const selectedCartItems = cartItems.filter((item) => selectedItems.has(item.cartID) && item.variantQuantity > 0);
  const totalSelectedItems = selectedCartItems.length;
  const totalSelectedPrice = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ✅ Checkout function with stock validation
  const handleCheckout = () => {
    if (totalSelectedItems === 0) {
      // In a real app, you'd use a custom modal instead of alert
      alert("Please select at least one item to checkout."); 
      return;
    }
    navigate('/checkout', {
      state: {
        selectedItems: selectedCartItems,
        totalSelectedPrice
      }
    });
  };

  return (
    <div>
      <div className="cart-container">
        <h2>Your Shopping Cart</h2>
        <p>PRE-ORDER PRODUCTS</p>
        <p><a href="/request">View Requested Product Variants</a></p>

        {cartItems.length === 0 ? (
          <p className="empty-cart-message">Your cart is empty.</p>
        ) : (
          <table className="cart-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    // Check if all selectable items are currently selected
                    checked={selectedItems.size > 0 && selectedItems.size === cartItems.filter(item => item.variantQuantity > 0).length}
                  />
                  <label className="select-all-label">All</label>
                </th>
                {/* Product Name Column */}
                <th className="sortable-header product-col">
                  Product Details
                </th>
                <th className="price-col">Unit Price</th>
                <th className="quantity-col">Quantity</th>
                <th className="total-price-col">Total Price</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => (
                <tr key={item.cartID} className={item.variantQuantity === 0 ? "sold-out" : ""}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.cartID)}
                      onChange={() => handleSelectItem(item.cartID, item.variantQuantity === 0)}
                      disabled={item.variantQuantity === 0} // Disable checkbox if sold out
                    />
                  </td>
                  <td className="product-col">
                    <span className="product-name-cell">
                      <img
                        src={item.image || "https://placehold.co/100x100/A0A0A0/FFFFFF?text=No+Image"}
                        alt={item.productName}
                        className="product-thumbnail"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/100x100/A0A0A0/FFFFFF?text=No+Image" }}
                      />
                      <div className="product-name-desc">
                        <h3>{item.productName}</h3>
                        <p><strong>Variation:</strong> {item.variantName || item.variantOther}</p>
                        {item.variantQuantity === 0 && <p className="sold-out-text">SOLD OUT</p>}
                      </div>
                    </span>
                  </td>
                  <td className="price-col">₱{item.price.toLocaleString()}</td>
                  <td className="quantity-col">
                    <div className="cart-quantity">
                      <button
                        onClick={() => updateQuantity(item.cartID, item.quantity - 1)}
                        disabled={item.quantity <= 1 || item.variantQuantity === 0}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={item.quantity}
                        onChange={(e) => handleQuantityInputChange(item.cartID, e.target.value)}
                        onBlur={() => updateQuantity(item.cartID, item.quantity)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateQuantity(item.cartID, item.quantity);
                        }}
                        disabled={item.variantQuantity === 0} // Disable input if sold out
                      />
                      <button
                        onClick={() => updateQuantity(item.cartID, item.quantity + 1)}
                        disabled={item.quantity >= 10 || item.variantQuantity === 0} // Disable button if max quantity or sold out
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="total-price-col">₱{(item.price * item.quantity).toLocaleString()}</td>
                  <td className="actions-col">
                    <button className="delete-button" onClick={() => handleRemove(item.cartID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ✅ Fixed Footer for Checkout */}
        <div className="checkout-footer">
          <div className="checkout-details">
            <span>Total Selected Items: <strong>{totalSelectedItems}</strong></span>
            <span>Total Price: <strong>₱{totalSelectedPrice.toLocaleString()}</strong></span>
          </div>
          <button
            className="checkout-button"
            disabled={totalSelectedItems === 0}
            onClick={handleCheckout}
          >
            CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
