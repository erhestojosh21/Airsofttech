import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import fileDownload from "js-file-download";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { jwtDecode } from "jwt-decode";
import { CiCircleAlert } from "react-icons/ci";
import { FaChevronLeft } from "react-icons/fa";
import "./OrdersDetails.css";
import { formatOrderDateTime } from '../utils/dateFormatter';
import { BsThreeDotsVertical } from "react-icons/bs";
import { VscVerified } from "react-icons/vsc";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCheckmarkDone } from "react-icons/io5";

const OrderDetails = () => {
    const { orderId } = useParams();
    const [orderDetails, setOrderDetails] = useState([]);
    const [userInfo, setUserInfo] = useState({});
    const [address, setAddress] = useState({});
    const [orderInfo, setOrderInfo] = useState({});
    
    const [isVerified, setIsVerified] = useState(false);
    const [shippingAt, setShippingAt] = useState(false);
    const [trackingUpdates, setTrackingUpdates] = useState([]);

    const [newStatus, setNewStatus] = useState("");
    const [newLocation, setNewLocation] = useState("");

    const [editingTrackingId, setEditingTrackingId] = useState(null);
    const [editedStatus, setEditedStatus] = useState("");

    const [editedLocation, setEditedLocation] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [deleteTrackingId, setDeleteTrackingId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [predefinedStatuses, setPredefinedStatuses] = useState([]);
    const [predefinedLocations, setPredefinedLocations] = useState([]);

    const [isFinished, setIsFinished] = useState(false);
    const [showFinishConfirm, setShowFinishConfirm] = useState(false);


    const [showAddLogisticPartnerForm, setShowAddLogisticPartnerForm] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [visibleActionsId, setVisibleActionsId] = useState(null);
    const toggleActions = (id) => {
        setVisibleActionsId(visibleActionsId === id ? null : id);
    };


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


    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}/mark-read`, {
            method: "PUT",
        });
    }, [orderId]);


    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/order-details/${orderId}`);
                const data = await res.json();
    
                if (data.length > 0) {
                    setOrderDetails(data);
                    setUserInfo({ fullName: data[0].FullName, username: data[0].username, email: data[0].email });
                    setAddress({
                        country: data[0].Country,
                        phone: data[0].PhoneNumber,
                        street: data[0].StreetAddress,
                        city: data[0].City,
                        state: data[0].StateProvince,
                        postalCode: data[0].PostalCode,
                        addressLine2: data[0].AddressLine2,
                        usedBy: data[0].AddressUsedBy,
                    });


                    setOrderInfo({
                        date: new Date(data[0].OrderDate).toLocaleString(),
                        paymentMethod: data[0].PaymentMethod,
                        transactionId: data[0].PayPalTransactionID || "N/A",
                        status: data[0].OrderStatus,
                        verifiedAt: data[0].VerifiedAt ? new Date(data[0].VerifiedAt).toLocaleString() : "Not Verified",
                        shippingAt: data[0].ShippingAt ? new Date(data[0].ShippingAt).toLocaleString() : "Not Shipped",
                        receivedAt: data[0].ReceivedAt ? new Date(data[0].ReceivedAt).toLocaleString() : "Not Received",
                        completedAt: data[0].CompletedAt ? new Date(data[0].CompletedAt).toLocaleString() : "Not Completed",
                        shippingCharge: data[0].ShippingCharge,
                        finalPrice: data[0].FinalPrice,
                      });
                      
    
                    setIsVerified(data[0].OrderStatus === "Verified");
                    if (data[0].OrderStatus === "Shipping") {
                        setShippingAt(true);
                    }
                }
            } catch (err) {
                console.error("Error fetching order details:", err);
            }
        };
    
        const fetchTrackingUpdates = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/order-tracking/${orderId}`);
                const data = await res.json();
                setTrackingUpdates(data);
            } catch (err) {
                console.error("Error fetching tracking updates:", err);
            }
        };
    
        const fetchPredefinedData = async () => {
            try {
                const statusRes = await fetch(`${process.env.REACT_APP_API_URL}/predefined-statuses`);
                const statusData = await statusRes.json();
                setPredefinedStatuses(statusData);

                const locationRes = await fetch(`${process.env.REACT_APP_API_URL}/predefined-locations`);
                const locationData = await locationRes.json();
                setPredefinedLocations(locationData);
            } catch (error) {
                console.error("Error fetching predefined data:", error);
            }
        };
    
        fetchOrderDetails();
        fetchTrackingUpdates();
        fetchPredefinedData();
    
    }, [orderId]);
    

    
    //Verify Order
    const handleVerifyOrder = () => {
        fetch(`${process.env.REACT_APP_API_URL}/verify-order/${orderId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                employeeId: employeeId,
                username: username
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    const verifiedTimestamp = new Date().toLocaleString();
                    setIsVerified(true);
                    setOrderInfo((prev) => ({
                        ...prev,
                        status: "Verified",
                        verifiedAt: verifiedTimestamp,
                    }));
                    setShowConfirmModal(false);
                } else {
                    alert("Failed to verify order.");
                }
            })
            .catch((err) => console.error("Error verifying order:", err));
    };
    


    //Start Shipping
    const handleStartShipping = () => {
        fetch(`${process.env.REACT_APP_API_URL}/start-shipping/${orderId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                employeeId: employeeId,
                username: username,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setShippingAt(true);
                    setOrderInfo((prev) => ({
                        ...prev,
                        status: "Shipping",
                    }));
                    
                } else {
                    alert("Failed to start shipping.");
                }
            })
            .catch((err) => console.error("Error starting shipping:", err));

            window.location.reload();
    };
    
    
    //Add Tracking Update
    const handleAddTrackingUpdate = () => {
        window.location.reload();
        if (!newStatus || !newLocation) {
            alert("Please fill in all fields.");
            return;
        }

        fetch(`${process.env.REACT_APP_API_URL}/add-tracking/${orderId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: newStatus,
                location: newLocation,
                employeeId: employeeId,
                username: username,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setTrackingUpdates([
                        ...trackingUpdates,
                        {
                            TrackingStatus: newStatus,
                            Location: newLocation,
                            TimeStamp: new Date().toLocaleString(),
                        },
                    ]);
                    setNewStatus("");
                    setNewLocation("");
                } else {
                    alert("Failed to add tracking update.");
                }
            })
            .catch((err) => console.error("Error adding tracking update:", err));
    };
    



    //Edit Tracking Update
    const handleEditTracking = (tracking) => {
        setEditingTrackingId(tracking.TrackingID);
        setEditedStatus(tracking.TrackingStatus);
        setEditedLocation(tracking.Location);
    };
    
    const handleSaveEditTracking = () => {
        fetch(`${process.env.REACT_APP_API_URL}/edit-tracking/${editingTrackingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: editedStatus,
                location: editedLocation,
                employeeId: employeeId,
                username: username,
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                setTrackingUpdates(trackingUpdates.map((update) =>
                    update.TrackingID === editingTrackingId
                        ? { ...update, TrackingStatus: editedStatus, Location: editedLocation }
                        : update
                ));
                setEditingTrackingId(null);
            } else {
                alert("Failed to update tracking.");
            }
        })
        .catch((err) => console.error("Error updating tracking:", err));
    };
    
    


    //Delete Tracking Update
    const handleDeleteTracking = (trackingId) => {
        setDeleteTrackingId(trackingId);
        setShowDeleteConfirm(true);
    };
    
    const confirmDeleteTracking = () => {
        fetch(`${process.env.REACT_APP_API_URL}/delete-tracking/${deleteTrackingId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                employeeId: employeeId,
                username: username,
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                setTrackingUpdates(trackingUpdates.filter(update => update.TrackingID !== deleteTrackingId));
                setShowDeleteConfirm(false);
            } else {
                alert("Failed to delete tracking update.");
            }
        })
        .catch((err) => console.error("Error deleting tracking:", err));
    };
    


    //Finish Order
    const handleFinishOrder = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/finish-order/${orderId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    employeeId: employeeId,
                    username: username,
                }),
            });
            const data = await res.json();
    
            if (data.success) {
                setOrderInfo((prev) => ({ ...prev, status: "Received" }));
                setIsFinished(true); // Disable adding new tracking updates
                
                setShowFinishConfirm(false); 
            } else {
                alert("Failed to update order.");
            }
        } catch (error) {
            console.error("Error finishing order:", error);
            alert("Error finishing order. Please try again.");
        }

        window.location.reload();
    };
    
    
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
            case "Cancelled":
                return "order-status-cancelled";
            default:
                return "";
        }
    };
    

    // Calculate Total Price
    const totalPrice = orderDetails.reduce((sum, item) => sum + item.Quantity * item.Price, 0);


    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Order Details (ID: ${orderId})`, 20, 20);

        // Section 1: Customer Information
        doc.setFontSize(12);
        doc.text("Customer Information", 20, 30);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Full Name: ${userInfo.fullName}`, 20, 40);
        doc.text(`Username: ${userInfo.username}`, 20, 50);

        // Section 2: Order Summary
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Order Summary", 20, 65);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const orderSummary = [
            ["Order Date", orderInfo.date],
            ["Payment Method", orderInfo.paymentMethod],
            ["Transaction ID", orderInfo.transactionId],
            ["Order Status", orderInfo.status],
            ["Verified At", orderInfo.verifiedAt || "N/A"],
            ["Shipping Started At", orderInfo.shippingAt || "N/A"],
            ["Received At", orderInfo.receivedAt || "N/A"],
            ["Completed At", orderInfo.completedAt || "N/A"],
        ];
        autoTable(doc, {
            startY: 70,
            head: [["Field", "Details"]],
            body: orderSummary,
            theme: "grid",
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        });

        // Section 3: Shipping Address
        let nextY = doc.lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Shipping Address", 20, nextY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const shippingAddress = [
            ["Recipient", address.usedBy],
            ["Street", address.street],
            ["City", `${address.city}, ${address.state}`],
            ["Postal Code", address.postalCode],
            ["Country", address.country],
            ["Phone", address.phone],
        ];
        if (address.addressLine2) {
            shippingAddress.splice(2, 0, ["Address Line 2", address.addressLine2]);
        }

        autoTable(doc, {
            startY: nextY + 5,
            head: [["Field", "Details"]],
            body: shippingAddress,
            theme: "grid",
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        });

        // Section 4: Ordered Items
        nextY = doc.lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Ordered Items", 20, nextY);

        autoTable(doc, {
            startY: nextY + 5,
            head: [["Product Name", "Variant", "Quantity", "Price", "Subtotal"]],
            body: orderDetails.map((item) => [
                item.ProductName,
                item.VariantName,
                item.Quantity,
                `Php ${item.Price.toFixed(2)}`,
                `Php ${(item.Quantity * item.Price).toFixed(2)}`,
            ]),
            theme: "grid",
            styles: { fontSize: 10 },
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        });

        // Section 5: Total Price
        nextY = doc.lastAutoTable.finalY + 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Total Price: Php ${totalPrice.toFixed(2)}`, 20, nextY);

        // Save PDF
        doc.save(`Order_${orderId}.pdf`);
    };

    

    return (
        <div className="order-details-container">
            <div className="inventory-details-title">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <FaChevronLeft /> Back
                </button>
            </div>
            <div className="order-titles">
                <h1>Order Details</h1>
            </div>

            <button onClick={handleDownloadPDF} className="download-button-pdf">
                Download as PDF
            </button>



        <div className="full-info">
            <div className="first-info">
                <div className="customer-info">
                    <div className="first-info-headers">
                        <p className="order-id">ORDER NO: <span>{orderId}</span></p>
                        <p className="username">{userInfo.username}</p>
                        <p className={getStatusClassName(orderInfo.status)}>{orderInfo.status}</p>
                    </div>
                    
                    <div className="customer-infos">
                        {/* Order Created */}
                        <div className="customer-info-item">
                            <p className="info-label">Order Created at</p>

                            <p>{formatOrderDateTime(orderInfo.date)}</p>
                        </div>

                        {/* Customer Name */}
                        <div className="customer-info-item">
                            <p className="info-label">Name</p>
                            <p>{userInfo.fullName}</p>
                        </div>

                        {/* Email */}
                        <div className="customer-info-item">
                            <p className="info-label">Email</p>
                            <p>{userInfo.email}</p>
                        </div>

                        {/* Contact No. */}
                        <div className="customer-info-item">
                            <p className="info-label">Contact No</p>
                            <p>{address.phone}</p>
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="delivery-address">
                        <h3 className="delivery-title">Delivery Address</h3>

                        <div className="info-row">
                            <div className="info-column">
                                <p><strong>Full Name:</strong></p>
                                <p>{address.usedBy}</p>
                            </div>
                            <div className="info-column">
                                <p><strong>Phone:</strong></p>
                                <p>{address.phone}</p>
                            </div>
                        </div>

                        <div className="single-column">
                            <p><strong>Street Address:</strong></p>
                            <p>{address.street}</p>
                        </div>

                        {address.addressLine2 && (
                            <div className="single-column">
                                <p><strong>Address Line 2:</strong></p>
                                <p>{address.addressLine2}</p>
                            </div>
                        )}

                        <div className="info-row">
                            <div className="info-column">
                                <p><strong>City:</strong></p>
                                <p>{address.city}, {address.state}</p>
                            </div>
                            <div className="info-column">
                                <p><strong>Postal Code:</strong></p>
                                <p>{address.postalCode}</p>
                            </div>
                        </div>

                        <div className="single-column">
                            <p><strong>Country:</strong></p>
                            <p>{address.country}</p>
                        </div>
                    </div>

                </div>


                {/* Order Items */}
                <div className="ordered-items">
                    <p className="ordered-tile">Ordered Item</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Qnty</th>
                                <th>Product</th>
                                <th>Unit Price</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderDetails.map((item) => (
                                <tr key={item.OrderItemID}>
                                    <td>{item.Quantity}</td>
                                    <td><span className="product-name">{item.ProductName} </span><br/> 
                                        <span className="variation-title">Variation:</span> {item.VariantName}
                                    </td>
                                    
                                    <td>₱{item.Price.toFixed(2)}</td>
                                    <td>₱{(item.Quantity * item.Price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <hr/>

                    {/* Display Total Price */}
                    <span className="total-price">
                        <p>
                            <span className="total-label">Total Price:</span>
                            <span className="total-amount">₱{(orderInfo.finalPrice !== undefined && orderInfo.finalPrice !== null ? orderInfo.finalPrice : 0).toFixed(2)}</span>
                        </p>
                    </span>
                    
                </div>


            </div>


            
            
            <div className="first-info">
            {/* Order Information */}
            <div className="order-info-summary">
                <h3>Status History</h3>
                <p><strong className="info-label">Order Created At:</strong> <br/>{formatOrderDateTime(orderInfo.date)}</p>
                <p><strong className="info-label">Payment Method:</strong> <br/>{orderInfo.paymentMethod}</p>
                <p><strong className="info-label">Transaction ID:</strong> <br/>{orderInfo.transactionId}</p>
                <p><strong className="info-label">Verified At:</strong> <br/>{formatOrderDateTime(orderInfo.verifiedAt)}</p>
                <p><strong className="info-label">Shipping Started At:</strong> <br/>{formatOrderDateTime(orderInfo.shippingAt)}</p>
                <p><strong className="info-label">Received At:</strong> <br/>{formatOrderDateTime(orderInfo.receivedAt)}</p>
                <p><strong className="info-label">Completed At:</strong> <br/>{formatOrderDateTime(orderInfo.completedAt)}</p>
                

                {/* Verify Order Button */}
                {!isVerified  && orderInfo.status !== "Shipping" && orderInfo.status !== "Received" && orderInfo.status !== "Completed" && (
                    <button onClick={() => setShowConfirmModal(true)} className="verify-button">
                        Verify Order
                    </button>
                )}  

                {/* Start Shipping Button */}
                {isVerified && !shippingAt && (
                    <button onClick={handleStartShipping} className="start-shipping-btn">
                        Start Shipping
                    </button>
                )}
                </div>

            


            {(orderInfo.status === "Completed") && (
                <div className="tracking-info">
                <div className="tracking-section">

                <h4>Tracking Information</h4>

                <table>
                        <thead>
                            <tr>
                                <th>Tracking Status</th>
                                <th style={{ textAlign: 'right' }}>Timestamp</th>
                                
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span className="tracking-location-labell">
                                        Parcel is out for delivery
                                    </span>
                                </td>
                                <td style={{ position: 'relative', textAlign: 'right' }}>
                                    <span className="timestamp-cell">
                                        {formatOrderDateTime(orderInfo.shippingAt)}
                                    </span>
                                </td>
                            </tr>
                            {trackingUpdates.map((update) => (
                                <tr key={update.TrackingID}>
                                    <td>
                                        <span className="tracking-status-label">
                                            {editingTrackingId === update.TrackingID ? (
                                                <input
                                                    type="text"
                                                    value={editedStatus}
                                                    onChange={(e) => setEditedStatus(e.target.value)}
                                                />
                                            ) : (
                                                update.TrackingStatus
                                            )}
                                        </span>

                                        <br />
                                        <span className="tracking-location-label">
                                            {editingTrackingId === update.TrackingID ? (
                                                <input
                                                    type="text"
                                                    value={editedLocation}
                                                    onChange={(e) => setEditedLocation(e.target.value)}
                                                />
                                            ) : (
                                                update.Location
                                            )}
                                        </span>
                                    </td>

                                    <td style={{ position: 'relative', textAlign: 'right' }}>
                                        <span className="timestamp-cell">{formatOrderDateTime(update.TimeStamp)}</span>
                                    </td>


                                </tr>
                            ))}

                            <tr>
                                <td>
                                    <span className="tracking-location-labell">
                                        Preparing to ship your parcel
                                    </span>
                                </td>
                                <td style={{ position: 'relative', textAlign: 'right' }}>
                                    <span className="timestamp-cell">
                                        {formatOrderDateTime(orderInfo.receivedAt)}
                                    </span>
                                </td>
                            </tr>

                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {(orderInfo.status === "Shipping" || orderInfo.status === "Received") && (
                
                <div className="tracking-section">
                    

                    {orderInfo.status !== "Received" &&(
                        <>
                            <h4>Order Tracking Update</h4>
                            <div className="input-group">
                                <select onChange={(e) => setNewStatus(e.target.value)}>
                                    <option value="">Select Logistic Partner</option>
                                    {predefinedStatuses.map((status) => (
                                        <option key={status.TrackingStatusID} value={status.TrackingStatus}>
                                            {status.TrackingStatus}
                                        </option>
                                    ))}
                                </select>


                                <input
                                    type="text"
                                    placeholder="Tracking Number"
                                    value={newLocation}
                                    onChange={(e) => setNewLocation(e.target.value)}
                                />
                                
                                <button className="add-update-button" onClick={handleAddTrackingUpdate} disabled={!newStatus || !newLocation}>Add Logistic Partner</button>
                                
                            </div>

                            
                        </>
                    )}
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Tracking Status</th>
                                <th style={{ textAlign: 'right' }}>Timestamp</th>

                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span className="tracking-location-labell">
                                        Parcel is out for delivery
                                    </span>
                                </td>
                                <td style={{ position: 'relative', textAlign: 'right' }}>
                                    <span className="timestamp-cell">
                                        {formatOrderDateTime(orderInfo.shippingAt)}
                                    </span>
                                </td>
                            </tr>

                            {trackingUpdates.map((update) => (
                                <tr key={update.TrackingID}>
                                    <td>
                                        <span className="tracking-status-label">
                                            {editingTrackingId === update.TrackingID ? (
                                                

                                                <select onChange={(e) => setEditedStatus(e.target.value)}>
                                                    <option value="">Select Logistic Partner</option>
                                                    {predefinedStatuses.map((status) => (
                                                        <option key={status.TrackingStatusID} value={status.TrackingStatus}>
                                                            {status.TrackingStatus}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                update.TrackingStatus
                                            )}
                                        </span>

                                        <br />
                                        <span className="tracking-location-label">
                                            {editingTrackingId === update.TrackingID ? (
                                                <input
                                                    type="text"
                                                    value={editedLocation}
                                                    onChange={(e) => setEditedLocation(e.target.value)}
                                                />
                                            ) : (
                                                update.Location
                                            )}
                                        </span>
                                    </td>

                                    <td style={{ position: 'relative', textAlign: 'right' }}>
                                        <span className="timestamp-cell">{formatOrderDateTime(update.TimeStamp)}</span>
                                    </td>


                                    <td style={{ position: 'relative', textAlign: 'right' }}> 
                                        <BsThreeDotsVertical
                                            style={{ cursor: 'pointer' }} 
                                            onClick={() => toggleActions(update.TrackingID)}
                                        />

                                        {/* Conditionally render the action buttons */}
                                        {visibleActionsId === update.TrackingID && (
                                            <div className="action-buttons-container">
                                                {editingTrackingId === update.TrackingID ? (
                                                    <button onClick={handleSaveEditTracking}>Save</button>
                                                ) : (
                                                    <button onClick={() => handleEditTracking(update)}>Edit</button>
                                                )}
                                                <button onClick={() => handleDeleteTracking(update.TrackingID)}>Delete</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}


                            {( orderInfo.status === "Received") && (
                            <tr>
                                <td>
                                    <span className="tracking-location-labell">
                                        Preparing to ship your parcel
                                    </span>
                                </td>
                                <td style={{ position: 'relative', textAlign: 'right' }}>
                                    <span className="timestamp-cell">
                                        {formatOrderDateTime(orderInfo.receivedAt)}
                                    </span>
                                </td>
                            </tr>
                            )}
                        </tbody>
                    </table>

                    

                    {/* Finish Order Button */}
                    {orderInfo.status === "Shipping" && (
                        <div className="finish-order-wrapper">
                        <button onClick={() => setShowFinishConfirm(true)} disabled={trackingUpdates.length === 0} className="finish-order-button">
                            Finish Shipping
                        </button>
                        </div>
                    )}

                    {/* Finish Order Confirmation Modal */}
                    {showFinishConfirm && (
                        <div className="modal-con">
                            <div className="modal-con-content">
                                <IoCheckmarkDone className="recieving-icon"/>
                                <h2>You want to finish shipping on this order?</h2>
                                <p>Order No. "{orderId}" will be marked as received, just wait to confirm by its tracking information. This action cannot be undone.</p>
                                <button onClick={handleFinishOrder} className="confirm-button">Confirm</button>
                                <button onClick={() => setShowFinishConfirm(false)} className="cancel-button">Cancel</button>
                            </div>
                        </div>
                    )}


                    {showDeleteConfirm && (
                        <div className="modal">
                            <div className="modal-content">
                                <CiCircleAlert className="alert-icon"/>
                                <p>Are you sure you want to delete this tracking update?</p>
                                <button onClick={confirmDeleteTracking} className="confirm-button">Confirm</button>
                                <button onClick={() => setShowDeleteConfirm(false)} className="cancel-button">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
                
            )}

            {showDeleteConfirm && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <RiDeleteBin6Line className="alert-icon"/>
                        <h2>You want to delete this tracking update?</h2>
                        <p>This specific tracking update will be deleted permanently. This action cannot be undone.</p>
                        <button onClick={confirmDeleteTracking} className="confirm-button">Confirm</button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="cancel-button">Cancel</button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-con">
                    <div className="modal-con-content">
                        <VscVerified className="verify-icon"/>
                        <h2>You want to verify this order?</h2>
                        <p>Order No. "{orderId}" will be verified to confirm that the order is in process. This action cannot be undone.</p>
                        <button onClick={handleVerifyOrder} className="confirm-button">Confirm</button>
                        <button onClick={() => setShowConfirmModal(false)} className="cancel-button">Cancel</button>
                    </div>
                </div>
            )}

            
            </div>
            </div>
        </div>
    );
};

export default OrderDetails;
