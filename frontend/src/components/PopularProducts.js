import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./PopularProducts.css";

const PopularProducts = () => {
    const [products, setProducts] = useState([]);
    const [filter, setFilter] = useState("all");
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
    }, [filter]);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/products`);
            let data = response.data;

            // Check if data is an array before sorting
            if (!Array.isArray(data)) {
                console.error("Fetched data is not an array:", data);
                setProducts([]);
                return;
            }

            if (filter === "purchased") {
                data.sort((a, b) => b.totalOrders - a.totalOrders);
            } else if (filter === "ratings") {
                data.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
            } else {
                data.sort((a, b) => (b.avgRating + b.totalOrders) - (a.avgRating + a.totalOrders));
            }
            setProducts(data);
        } catch (error) {
            console.error("Error fetching popular products", error);
        }
    };

    // Scroll left
    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
        }
    };

    // Scroll right
    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
    };

    const formatPrice = (value) => {
        return value != null
            ? `₱${value.toLocaleString()}`
            : "₱0.00";
    };
    
    return (
        <div className="popular-products">
            <div className="header">
                <h2>Popular Products</h2>
                <div className="filter-buttons">
                    <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
                        All
                    </button>
                    <button className={filter === "ratings" ? "active" : ""} onClick={() => setFilter("ratings")}>
                        Ratings
                    </button>
                    <button className={filter === "purchased" ? "active" : ""} onClick={() => setFilter("purchased")}>
                        Sold Items
                    </button>
                </div>
            </div>

            <div className="scroll-container">
                <button className="scroll-btn left" onClick={scrollLeft}>
                    <FaChevronLeft />
                </button>

                <div className="product-list" ref={scrollRef}>
                    {products.map((product) => {
                        // FIX: Calculate min and max prices here for each product
                        const variantPrices = Array.isArray(product.variants) ? product.variants.map((v) => v.price) : [];
                        const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
                        const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 0;

                        return (
                            <div
                                key={product.id}
                                className="popular-product-card"
                                onClick={() => navigate(`/product/${product.id}`)}
                            >
                                <img src={product.image} alt={product.name} />
                                <h3>{product.name}</h3>
                                <p className="product-price">
                                    {/* FIX: Use the calculated minPrice and maxPrice */}
                                    ₱{minPrice === maxPrice
                                        ? minPrice.toLocaleString()
                                        : `${minPrice.toLocaleString()} - ₱${maxPrice.toLocaleString()}`}
                                </p>

                                <div className="rating">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} color={i < Math.round(product.avgRating) ? "#FFD700" : "#ccc"} />
                                    ))}
                                    <span>({product.reviewCount} reviews)</span>
                                </div>
                                <p className="sold-count">{product.totalOrders} sold</p>
                            </div>
                        );
                    })}
                </div>

                <button className="scroll-btn right" onClick={scrollRight}>
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default PopularProducts;