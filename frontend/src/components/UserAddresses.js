import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserAddresses.css";
import Sidebar from "./UserSidebar";
import { IoCloseOutline } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { GoQuestion } from "react-icons/go";
import { FaTrashAlt, FaPencilAlt } from "react-icons/fa";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import LocationPicker from "../utils/LocationPicker";

const UserAddresses = () => {
    const navigate = useNavigate();
    const [userID, setUserID] = useState(localStorage.getItem("userID"));
    const [addresses, setAddresses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editAddress, setEditAddress] = useState(null);
    const [confirmDeleteID, setConfirmDeleteID] = useState(null);
    const [confirmDefaultID, setConfirmDefaultID] = useState(null);
    const [originalAddress, setOriginalAddress] = useState(null);

    useEffect(() => {
        const handleStorageChange = () => {
            setUserID(localStorage.getItem("userID"));
        };
        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    useEffect(() => {
        if (!userID) {
            navigate("/login");
            return;
        }
        fetchAddresses(userID);
    }, [userID, navigate]);

    const fetchAddresses = async (id) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/user-addresses/${id}`);
            if (!res.ok) {
                throw new Error("Failed to fetch addresses");
            }
            const data = await res.json();
            const sorted = data.sort((a, b) => b.IsInUse - a.IsInUse);
            setAddresses(sorted);
        } catch (err) {
            console.error("Error fetching addresses:", err);
        }
    };

    const handleEditClick = (address) => {
        setEditAddress({ ...address });
        setOriginalAddress({ ...address });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditAddress(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        if (JSON.stringify(editAddress) === JSON.stringify(originalAddress)) {
            setIsEditModalOpen(false);
            return;
        }

        try {
            const updatedAddress = {
                AddressID: editAddress.AddressID,
                Country: editAddress.Country,
                PhoneNumber: editAddress.PhoneNumber,
                StreetAddress: editAddress.StreetAddress,
                City: editAddress.City,
                StateProvince: editAddress.StateProvince,
                PostalCode: editAddress.PostalCode,
                AddressLine2: editAddress.AddressLine2,
                FullName: editAddress.FullName,
                lat: editAddress.lat,
                lng: editAddress.lng,
            };

            const res = await fetch(`${process.env.REACT_APP_API_URL}/update-address`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedAddress),
            });

            const data = await res.json();
            if (res.ok) {
                fetchAddresses(userID);
                setIsEditModalOpen(false);
            } else {
                console.error("Update failed:", data.error);
                alert(`Failed to update address: ${data.error || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Error updating address:", err);
            alert(`Error updating address: ${err.message}`);
        }
    };

    const deleteAddress = async (addressID) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/delete-address`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ addressID }),
            });
            if (res.ok) {
                setAddresses(addresses.filter((addr) => addr.AddressID !== addressID));
            } else {
                const errorData = await res.json();
                console.error("Error deleting address:", errorData.error);
                alert(`Failed to delete address: ${errorData.error || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Error deleting address:", err);
            alert(`Error deleting address: ${err.message}`);
        }
    };

    const setDefaultAddress = (addressID) => {
        fetch(`${process.env.REACT_APP_API_URL}/set-default-address`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userID, addressID }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    fetchAddresses(userID);
                } else {
                    console.error("Failed to set default:", data.error);
                    window.location.reload();
                }
            })
            .catch((err) => {
                console.error("Error setting default address:", err);
                alert(`Error setting default address: ${err.message}`);
            });
    };

    const AddAddressForm = ({ onAddressAdded }) => {
        const [formData, setFormData] = useState({
            fullName: "",
            country: "",
            phoneNumber: "",
            streetAddress: "",
            addressLine2: "",
            city: "",
            stateProvince: "",
            postalCode: "",
            lat: null,
            lng: null,
        });
        const [suggestions, setSuggestions] = useState([]);
        const [showSuggestions, setShowSuggestions] = useState(false);
        const [mapCenter, setMapCenter] = useState([14.7176, 121.0401]); // Default to Quezon City, Philippines

        useEffect(() => {
            // Get user's current location on component mount
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
                        const data = await response.json();
                        if (data.address) {
                            const { country, city, town, village, state, postcode, road, house_number } = data.address;
                            setFormData(prev => ({
                                ...prev,
                                country: country || '',
                                city: city || town || village || '',
                                stateProvince: state || '',
                                postalCode: postcode || '',
                                streetAddress: house_number ? `${house_number} ${road}` : road || '',
                                lat: latitude,
                                lng: longitude,
                            }));
                            setMapCenter([latitude, longitude]);
                        }
                    } catch (error) {
                        console.error("Error fetching location data:", error);
                    }
                }, (error) => {
                    console.error("Geolocation error:", error);
                });
            }
        }, []);

        const fetchSuggestions = async (query, countryCode = '') => {
            if (query.length < 3) {
                setSuggestions([]);
                return;
            }
            let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
            if (countryCode) {
                url += `&countrycodes=${countryCode}`;
            }
            try {
                const response = await fetch(url);
                const data = await response.json();
                setSuggestions(data);
            } catch (error) {
                console.error("Error fetching address suggestions:", error);
                setSuggestions([]);
            }
        };

        const fetchCoordinates = async (address) => {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    setFormData(prev => ({ ...prev, lat: parseFloat(lat), lng: parseFloat(lon) }));
                    setMapCenter([parseFloat(lat), parseFloat(lon)]);
                }
            } catch (error) {
                console.error("Error fetching coordinates:", error);
            }
        };

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData({ ...formData, [name]: value });
            if (name === "streetAddress" || name === "country" || name === "city") {
                fetchSuggestions(value, formData.country);
                setShowSuggestions(true);
            }
        };

        useEffect(() => {
            const fullAddress = `${formData.streetAddress}, ${formData.city}, ${formData.country}`;
            const timeoutId = setTimeout(() => {
                if (formData.streetAddress || formData.city || formData.country) {
                    fetchCoordinates(fullAddress);
                }
            }, 1000); // Debounce API calls
            return () => clearTimeout(timeoutId);
        }, [formData.streetAddress, formData.city, formData.country]);

        const handlePhoneNumberChange = (value) => {
            setFormData({ ...formData, phoneNumber: value });
        };

        const handleSuggestionClick = (suggestion) => {
            const address = suggestion.address;
            const newFormData = {
                ...formData,
                streetAddress: address.house_number ? `${address.house_number} ${address.road || ''}` : address.road || suggestion.display_name.split(',')[0] || '',
                addressLine2: address.suburb || address.neighbourhood || '',
                city: address.city || address.town || address.village || address.municipality || '',
                stateProvince: address.state || address.province || '',
                country: address.country || '',
                postalCode: address.postcode || '',
                lat: parseFloat(suggestion.lat),
                lng: parseFloat(suggestion.lon),
            };
            setFormData(newFormData);
            setMapCenter([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
            setSuggestions([]);
            setShowSuggestions(false);
        };

        const handleBlur = () => {
            setTimeout(() => setShowSuggestions(false), 100);
        };

        const handleSubmit = async (e) => {
            e.preventDefault();

            if (!userID) {
                alert("Error: User ID missing. Please log in again.");
                return;
            }

            const addressData = {
                userID: parseInt(userID, 10),
                ...formData,
            };

            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/add-address`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(addressData),
                });

                const responseData = await response.json();

                if (response.ok) {
                    setIsModalOpen(false);
                    onAddressAdded();
                } else {
                    alert(`Failed to add address: ${responseData.error || "Unknown error"}`);
                }
            } catch (error) {
                alert(`Error adding address: ${error.message}`);
            }
        };
        
        const handleLocationSelected = (latlng) => {
            setFormData(prev => ({ ...prev, lat: latlng.lat, lng: latlng.lng }));
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`)
                .then(res => res.json())
                .then(data => {
                    if (data.address) {
                        const { country, city, town, village, state, postcode, road, house_number } = data.address;
                        setFormData(prev => ({
                            ...prev,
                            country: country || '',
                            city: city || town || village || '',
                            stateProvince: state || '',
                            postalCode: postcode || '',
                            streetAddress: house_number ? `${house_number} ${road}` : road || '',
                        }));
                    }
                })
                .catch(error => console.error("Error fetching reverse geocoding data:", error));
        };

        return (
            <div className="address-form-container">
                <div className="form-header">
                    <IoCloseOutline
                        className="address-form-close"
                        onClick={() => setIsModalOpen(false)}
                    />
                </div>
                <h2 className="form-title">Address Form</h2>
                <h2 className="form-subheader">
                    Please complete your address before ordering. This will be used to
                    track your order and will be automatically set as the default
                    delivery address.
                </h2>
                <form className="address-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Full Name"
                            onChange={handleChange}
                            value={formData.fullName}
                            required
                        />
                        <PhoneInput
                            className="phone-input"
                            placeholder="Enter phone number"
                            value={formData.phoneNumber}
                            onChange={handlePhoneNumberChange}
                            defaultCountry="PH"
                            required
                        />
                    </div>
                    <label className="section-label">Residence</label>
                    <div className="form-row address-icon-row">
                        <input
                            type="text"
                            name="streetAddress"
                            placeholder="Street Address"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={formData.streetAddress}
                            autoComplete="off"
                            required
                        />
                        <LocationPicker
                            center={mapCenter}
                            onLocationSelected={handleLocationSelected}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="suggestions-list">
                                {suggestions.map((suggestion) => (
                                    <li
                                        key={suggestion.place_id}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                    >
                                        {suggestion.display_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="form-row">
                        <input
                            type="text"
                            name="addressLine2"
                            placeholder="Apartment, Bldg, etc. (Optional)"
                            onChange={handleChange}
                            value={formData.addressLine2}
                        />
                    </div>
                    <div className="form-row">
                        <input
                            type="text"
                            name="country"
                            placeholder="Country"
                            onChange={handleChange}
                            value={formData.country}
                            required
                        />
                        <input
                            type="text"
                            name="city"
                            placeholder="City"
                            onChange={handleChange}
                            value={formData.city}
                            required
                        />
                        <input
                            type="text"
                            name="stateProvince"
                            placeholder="State/Province"
                            onChange={handleChange}
                            value={formData.stateProvince}
                            required
                        />
                        <input
                            type="text"
                            name="postalCode"
                            placeholder="Postal Code"
                            onChange={handleChange}
                            value={formData.postalCode}
                            required
                        />
                    </div>
                    <button type="submit" className="submit-btn">
                        Submit
                    </button>
                    <div className="terms-row">
                        <input type="checkbox" id="terms" required />
                        <label htmlFor="terms">
                            I agree to the terms and conditions of using this address for
                            order tracking and delivery.
                        </label>
                    </div>
                </form>
            </div>
        );
    };

    const EditAddressForm = ({
        editAddress,
        handleEditChange,
        handleSaveChanges,
        originalAddress,
    }) => {
        const [suggestions, setSuggestions] = useState([]);
        const [showSuggestions, setShowSuggestions] = useState(false);
        const [mapCenter, setMapCenter] = useState([editAddress.lat || 14.7176, editAddress.lng || 121.0401]);

        const fetchSuggestions = async (query, countryCode = '') => {
            if (query.length < 3) {
                setSuggestions([]);
                return;
            }
            let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
            if (countryCode) {
                url += `&countrycodes=${countryCode}`;
            }
            try {
                const response = await fetch(url);
                const data = await response.json();
                setSuggestions(data);
            } catch (error) {
                console.error("Error fetching address suggestions:", error);
                setSuggestions([]);
            }
        };

        const fetchCoordinates = async (address) => {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    setEditAddress(prev => ({ ...prev, lat: parseFloat(lat), lng: parseFloat(lon) }));
                    setMapCenter([parseFloat(lat), parseFloat(lon)]);
                }
            } catch (error) {
                console.error("Error fetching coordinates:", error);
            }
        };
        
        useEffect(() => {
            const fullAddress = `${editAddress.StreetAddress}, ${editAddress.City}, ${editAddress.Country}`;
            const timeoutId = setTimeout(() => {
                if (editAddress.StreetAddress || editAddress.City || editAddress.Country) {
                    fetchCoordinates(fullAddress);
                }
            }, 1000); // Debounce API calls
            return () => clearTimeout(timeoutId);
        }, [editAddress.StreetAddress, editAddress.City, editAddress.Country]);

        const handleChangeWithSuggestions = (e) => {
            handleEditChange(e);
            if (e.target.name === "StreetAddress" || e.target.name === "Country" || e.target.name === "City") {
                const query = e.target.name === "StreetAddress" ? e.target.value : editAddress.StreetAddress;
                fetchSuggestions(query, editAddress.Country);
                setShowSuggestions(true);
            }
        };

        const handlePhoneNumberChange = (value) => {
            handleEditChange({ target: { name: 'PhoneNumber', value } });
        };

        const handleSuggestionClick = (suggestion) => {
            const address = suggestion.address;
            const updatedFields = {
                StreetAddress: address.house_number ? `${address.house_number} ${address.road || ''}` : address.road || suggestion.display_name.split(',')[0] || '',
                AddressLine2: address.suburb || address.neighbourhood || '',
                City: address.city || address.town || address.village || address.municipality || '',
                StateProvince: address.state || address.province || '',
                Country: address.country || '',
                PostalCode: address.postcode || '',
                lat: parseFloat(suggestion.lat),
                lng: parseFloat(suggestion.lon),
            };
            setEditAddress(prev => ({ ...prev, ...updatedFields }));
            setMapCenter([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
            setSuggestions([]);
            setShowSuggestions(false);
        };

        const handleBlur = () => {
            setTimeout(() => setShowSuggestions(false), 100);
        };
        
        const handleLocationSelected = (latlng) => {
            setEditAddress(prev => ({ ...prev, lat: latlng.lat, lng: latlng.lng }));
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`)
                .then(res => res.json())
                .then(data => {
                    if (data.address) {
                        const { country, city, town, village, state, postcode, road, house_number } = data.address;
                        setEditAddress(prev => ({
                            ...prev,
                            Country: country || '',
                            City: city || town || village || '',
                            StateProvince: state || '',
                            PostalCode: postcode || '',
                            StreetAddress: house_number ? `${house_number} ${road}` : road || '',
                        }));
                    }
                })
                .catch(error => console.error("Error fetching reverse geocoding data:", error));
        };


        return (
            <form
                className="address-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveChanges();
                }}
            >
                <div className="form-row">
                    <input
                        type="text"
                        name="FullName"
                        placeholder="Full Name"
                        value={editAddress.FullName}
                        onChange={handleEditChange}
                        required
                    />
                    <PhoneInput
                        className="phone-input"
                        placeholder="Enter phone number"
                        value={editAddress.PhoneNumber}
                        onChange={handlePhoneNumberChange}
                        defaultCountry="PH"
                        required
                    />
                </div>
                <label className="section-label">Residence</label>
                <div className="form-row address-icon-row">
                    <input
                        type="text"
                        name="StreetAddress"
                        placeholder="Street Address"
                        value={editAddress.StreetAddress}
                        onChange={handleChangeWithSuggestions}
                        onBlur={handleBlur}
                        autoComplete="off"
                        required
                    />
                    <LocationPicker
                        center={mapCenter}
                        onLocationSelected={handleLocationSelected}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {suggestions.map((suggestion) => (
                                <li
                                    key={suggestion.place_id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion.display_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="form-row">
                    <input
                        type="text"
                        name="AddressLine2"
                        placeholder="Apartment, Bldg, etc. (Optional)"
                        value={editAddress.AddressLine2}
                        onChange={handleEditChange}
                    />
                </div>
                <div className="form-row">
                    <input
                        type="text"
                        name="Country"
                        placeholder="Country"
                        value={editAddress.Country}
                        onChange={handleChangeWithSuggestions}
                        required
                    />
                    <input
                        type="text"
                        name="City"
                        placeholder="City"
                        value={editAddress.City}
                        onChange={handleChangeWithSuggestions}
                        required
                    />
                    <input
                        type="text"
                        name="StateProvince"
                        placeholder="State/Province"
                        value={editAddress.StateProvince}
                        onChange={handleEditChange}
                        required
                    />
                    <input
                        type="text"
                        name="PostalCode"
                        placeholder="Postal Code"
                        value={editAddress.PostalCode}
                        onChange={handleEditChange}
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="submit-btn"
                    disabled={JSON.stringify(editAddress) === JSON.stringify(originalAddress)}
                >
                    Save
                </button>
            </form>
        );
    };

    return (
        <div>
            <div className="user-profile">
                <Sidebar />
                <div className="address-container">
                    <div className="user-address-header">
                        <h2>My Addresses</h2>
                        <button className="add-address-btn" onClick={() => setIsModalOpen(true)}>
                            + Add New Address
                        </button>
                    </div>
                    <div className="address-list">
                        {addresses.length > 0 ? (
                            addresses.map((address, index) => (
                                <div
                                    key={address.AddressID}
                                    className={`address-card ${address.IsInUse === 1 ? "first-address" : ""}`}
                                >
                                    <div className="address-name">
                                        <p className="address-full-name">{address.FullName}</p>
                                        <p className="address-phone">{address.PhoneNumber}</p>
                                    </div>
                                    <div className="address-lines">
                                        <div className="address-lines-row1">
                                            <p>
                                                {address.StreetAddress}
                                                {address.AddressLine2 && `, ${address.AddressLine2}`}
                                            </p>
                                            <div>
                                                <button
                                                    className="edit"
                                                    onClick={() => handleEditClick(address)}
                                                >
                                                    <FaPencilAlt /> Edit
                                                </button>
                                                <button
                                                    className="delete"
                                                    onClick={() => setConfirmDeleteID(address.AddressID)}
                                                >
                                                    <FaTrashAlt /> Delete
                                                </button>
                                            </div>
                                        </div>
                                        <div className="address-lines-row1">
                                            <p>
                                                {address.City}, {address.StateProvince},{" "}
                                                {address.PostalCode}
                                            </p>
                                            {address.IsInUse === 1 ? (
                                                <button className="default" disabled>
                                                    Default
                                                </button>
                                            ) : (
                                                <button
                                                    className="default"
                                                    onClick={() => setConfirmDefaultID(address.AddressID)}
                                                >
                                                    Set as default
                                                </button>
                                            )}
                                        </div>
                                        <div className="address-lines-row1">
                                            <p>{address.Country}</p>
                                        </div>
                                    </div>
                                    {index === 0 && <span className="default-text">Default</span>}
                                </div>
                            ))
                        ) : (
                            <p>No addresses found. Add one below.</p>
                        )}
                    </div>
                </div>
                {confirmDeleteID && (
                    <div className="modal-con">
                        <div className="modal-con-content">
                            <RiDeleteBin6Line className="deletion-icon" />
                            <h2>Are you sure you want to delete this address?</h2>
                            <p>This action cannot be undone.</p>
                            <button
                                className="confirm-button"
                                onClick={() => {
                                    deleteAddress(confirmDeleteID);
                                    setConfirmDeleteID(null);
                                }}
                            >
                                Yes
                            </button>
                            <button
                                className="confirm-button"
                                onClick={() => setConfirmDeleteID(null)}
                            >
                                No
                            </button>
                        </div>
                    </div>
                )}
                {confirmDefaultID && (
                    <div className="modal-con">
                        <div className="modal-con-content">
                            <GoQuestion className="check-icon" />
                            <h2>You want to set this address as your default?</h2>
                            <p>This will update your default shipping address. </p>
                            <button className="confirm-button"
                                onClick={() => {
                                    setDefaultAddress(confirmDefaultID);
                                    setConfirmDefaultID(null);
                                }}
                            >
                                Yes, Set This address as Default
                            </button>
                            <button className="cancel-button"
                                onClick={() => setConfirmDefaultID(null)}
                            >
                                No
                            </button>
                        </div>
                    </div>
                )}
                {isModalOpen && (
                    <div className="AddAddressmodal">
                        <div className="AddAddressmodal-content">
                            <AddAddressForm onAddressAdded={() => fetchAddresses(userID)} />
                        </div>
                    </div>
                )}
            </div>
            {isEditModalOpen && (
                <div className="AddAddressmodal">
                    <div className="AddAddressmodal-content">
                        <div className="address-form-container">
                            <div className="form-header">
                                <IoCloseOutline
                                    className="address-form-close"
                                    onClick={() => setIsEditModalOpen(false)}
                                />
                            </div>
                            <h2 className="form-title">Edit Address</h2>
                            <h2 className="form-subheader">
                                Update your address details below. This will affect your
                                delivery and tracking information.
                            </h2>
                            <EditAddressForm
                                editAddress={editAddress}
                                handleEditChange={handleEditChange}
                                handleSaveChanges={handleSaveChanges}
                                originalAddress={originalAddress}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserAddresses;