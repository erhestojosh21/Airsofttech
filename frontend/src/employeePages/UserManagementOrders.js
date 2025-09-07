import React from "react";
import "./UserManagementDetails.css";

const UserManagementOrders = ({ orders, filter, setFilter, searchQuery, setSearchQuery }) => {
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "All" || order.OrderStatus === filter;
    const matchesSearch =
      searchQuery.toLowerCase() === "" ||
      order.items.some(
        (item) =>
          item.ProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.VariantName.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      new Date(order.OrderDate).toLocaleDateString().includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="order-content">
      <h2>User Orders</h2>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by Product, Variant, or Date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="order-filters">
        {["All", "Processing", "Verified", "Shipping", "Received", "Completed"].map((status) => (
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
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.OrderID} className="order-card">
              <div className="order-header">
                <h3>
                  Order #{order.OrderID} -{" "}
                  <span className={`status ${order.OrderStatus.toLowerCase()}`}>
                    {order.OrderStatus}
                  </span>
                </h3>
                <p className="order-date">{new Date(order.OrderDate).toLocaleString()}</p>
              </div>
              <p className="order-address">
                📍 {order.StreetAddress}, {order.City}, {order.StateProvince},{" "}
                {order.PostalCode}, {order.Country}
              </p>
              <div className="order-items">
                {order.items.map((item) => (
                  <div key={item.OrderItemID} className="order-item">
                    <img src={item.Image} alt={item.ProductName} className="item-image" />
                    <div className="item-details">
                      <p className="item-name">{item.ProductName}</p>
                      <p className="item-variant">
                        Variation:{" "}
                        {item.RequestedVariantID ? `[CUSTOM] ${item.VariantName}` : item.VariantName}
                      </p>
                      <p className="item-quantity">Qty: {item.Quantity}</p>
                    </div>
                    <p className="item-price">Php. {item.Price}</p>
                  </div>
                ))}
              </div>
              <p className="order-total">
                Total Price: <strong>Php. {order.TotalAmount + order.ShippingCharge}</strong> |{" "}
                {order.PaymentMethod}
              </p>
            </div>
          ))
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default UserManagementOrders;
