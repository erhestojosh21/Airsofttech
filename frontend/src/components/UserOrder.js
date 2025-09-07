import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./UserSidebar";

import OrderRating from "./OrderRating"; 
import "./UserOrder.css";

const UserOrder = () => {
  const userID = localStorage.getItem("userID");
  const navigate = useNavigate(); 
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!userID) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user-orders/${userID}`);
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };

    fetchOrders();
  }, [userID]);

  const completeOrder = async (orderID) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/complete-order/${orderID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      
      if (res.ok) {
        setOrders(prevOrders => prevOrders.map(order => 
          order.OrderID === orderID ? { ...order, OrderStatus: "Completed" } : order
        ));
      } else {
        console.error("Failed to complete order");
      }
    } catch (err) {
      console.error("Error completing order:", err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === "All" || order.OrderStatus === filter;
    const matchesSearch = searchQuery.toLowerCase() === "" ||
      order.items.some(item => 
        item.ProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.VariantName.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      new Date(order.OrderDate).toLocaleDateString().includes(searchQuery);
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      
      <div className="order-container">
        <Sidebar />
        <div className="order-content">
          <h1>My Orders</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by Product Name, Variation, or Date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="order-filters">
            {["All", "Processing", "Verified", "Shipping", "Received", "Completed"].map(status => (
              <button
                key={status}
                className={filter === status ? "filter-btn active" : "filter-btn"}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="order-list">
            {filteredOrders.map(order => (
              <div key={order.OrderID} className="order-card">
                <div className="order-header">
                  <h3>Order #{order.OrderID} - <span className={`status ${order.OrderStatus.toLowerCase()}`}>{order.OrderStatus}</span></h3>
                  <p className="order-date">{new Date(order.OrderDate).toLocaleString()}</p>
                  {(order.OrderStatus === "Shipping" || order.OrderStatus === "Received" || order.OrderStatus === "Completed") && (
                    <button className="view-routes-btn" onClick={() => navigate(`/tracking/${order.OrderID}`)}>
                      View Routes
                    </button>
                  )}
                </div>
                <p className="order-address">📍 {order.StreetAddress}, {order.City}, {order.StateProvince}, {order.PostalCode}, {order.Country}</p>
                <div className="order-items">
                  {order.items.map(item => (
                    <div key={item.OrderItemID} className="order-item">
                      <img src={item.Image} alt={item.ProductName} className="item-image" />
                      <div className="item-details">
                        <p className="item-name">{item.ProductName}</p>
                        <p className="item-variant">
                          Variation: {item.RequestedVariantID ? `[CUSTOM] ${item.VariantName}` : item.VariantName}
                        </p>

                        <p className="item-quantity">Qty: {item.Quantity}</p>
                      </div>
                      <p className="item-price">Php. {item.Price}</p>
                    </div>
                  ))}
                </div>
                
                
                <p className="order-total">
                  Total Price: <strong>Php. {order.TotalAmount + order.ShippingCharge}</strong> | {order.PaymentMethod}
                </p>

                {order.OrderStatus === "Received" && (
                  <button className="complete-order-btn" onClick={() => completeOrder(order.OrderID)}>
                    Complete Order
                  </button>
                )}
                {order.OrderStatus === "Completed" && (
                  <div className="rating-section">
                    {order.items.map(item => (
                      <button
                        key={item.OrderItemID}
                        className="rate-order-btn"
                        onClick={() => setSelectedOrder({ orderID: order.OrderID, productID: item.ProductID })}
                      >
                        Rate {item.ProductName} ⭐
                      </button>
                    ))}
                  </div>
                )}


              </div>
            ))}
          </div>
        </div>
      </div>
      {selectedOrder && (
        <OrderRating
          orderID={selectedOrder.orderID}
          productID={selectedOrder.productID} // Correctly passing the selected productID
          onClose={() => setSelectedOrder(null)}
        />
      )}



    </div>
  );
};

export default UserOrder;
