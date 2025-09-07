import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import "./Products.css";
import AOS from 'aos';
import Footer from "./Footer";

import 'aos/dist/aos.css';

const Products = () => {
    AOS.init({ duration: 1000 });

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [priceSort, setPriceSort] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                let categoryParam = selectedCategories.length > 0 ? selectedCategories.join(",") : "";
                
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/products?category=${categoryParam}`
                );
                const data = await response.json();
                
                let filteredData = Array.isArray(data) ? data : [];

                if (searchTerm) {
                    const search = searchTerm.toLowerCase();
                    filteredData = filteredData.filter((product) => {
                        const nameMatch = product.name.toLowerCase().includes(search);
                        const priceMatch = product.variants.some((variant) =>
                            variant.price.toString().includes(search)
                        );
                        return nameMatch || priceMatch;
                    });
                }
                
                if (priceSort === "lowToHigh") {
                    filteredData.sort((a, b) => {
                        const minA = Math.min(...a.variants.map(v => v.price));
                        const minB = Math.min(...b.variants.map(v => v.price));
                        return minA - minB;
                    });
                } else if (priceSort === "highToLow") {
                    filteredData.sort((a, b) => {
                        const maxA = Math.max(...a.variants.map(v => v.price));
                        const maxB = Math.max(...b.variants.map(v => v.price));
                        return maxB - maxA;
                    });
                }
                
                setProducts(filteredData);
            } catch (error) {
                console.error("Error fetching products:", error);
                setProducts([]);
            }
            setLoading(false);
        };
        
        fetchProducts();
    }, [selectedCategories, searchTerm, priceSort]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/filter-categories`);
                const data = await response.json();
                setCategories(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    const handleCategoryChange = (event) => {
        const value = Number(event.target.value);
        setSelectedCategories((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    const handlePriceSortChange = (e) => {
        setPriceSort(e.target.value);
    };

    return (
        <div className="products-page-container">
            {/* Search Bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search products, category, prices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
                
            <div className="products-page">
                {/* Sidebar Filter */}
                <aside className="filter-sidebar" data-aos="fade-right">
                    <h3>Filtered by</h3>
                    {/* Price Sort */}
                    <div className="filter-group">
                        <label>Price:</label>
                        <div className="checkbox-group">
                            <label>
                                <input
                                    type="radio"
                                    name="priceSort"
                                    value=""
                                    checked={priceSort === ""}
                                    onChange={handlePriceSortChange}
                                />
                                Default
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="priceSort"
                                    value="lowToHigh"
                                    checked={priceSort === "lowToHigh"}
                                    onChange={handlePriceSortChange}
                                />
                                Lowest to Highest
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="priceSort"
                                    value="highToLow"
                                    checked={priceSort === "highToLow"}
                                    onChange={handlePriceSortChange}
                                />
                                Highest to Lowest
                            </label>
                        </div>
                    </div>
                    {/* Category Multi-Select */}
                    <div className="filter-group">
                        <label>Categories:</label>
                        <div className="checkbox-group">
                            {categories.map((cat) => (
                                <label key={cat.id}>
                                    <input
                                        type="checkbox"
                                        value={cat.id}
                                        checked={selectedCategories.includes(cat.id)}
                                        onChange={handleCategoryChange}
                                    />
                                    {cat.name}
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>
                {/* Products Section */}
                <div className="products-container">
                    {loading ? (
                        <p>Loading products...</p>
                    ) : products.length === 0 ? (
                        <p>No products found.</p>
                    ) : (
                        products.map((product) => {
                            const variantPrices = product.variants.map((v) => v.price);
                            const minPrice = Math.min(...variantPrices);
                            const maxPrice = Math.max(...variantPrices);

                            return (
                                <div
                                    className="product-card"
                                    key={product.id}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                >
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="product-image lazy-load"
                                        loading="lazy"
                                    />
                                    <h3>{product.name}</h3>
                                    <p className="product-price">
                                        ₱{minPrice === maxPrice
                                        ? minPrice.toLocaleString()
                                        : `${minPrice.toLocaleString()} - ₱${maxPrice.toLocaleString()}`}
                                    </p>
                                    {/* Display ratings */}
                                    <div className="rating-container">
                                        {[...Array(5)].map((_, i) => {
                                            const fullStars = Math.floor(product.avgRating);
                                            const hasHalfStar = product.avgRating - fullStars >= 0.5;

                                            if (i < fullStars) {
                                            return <FaStar key={i} color="#FFD700" />;
                                            } else if (i === fullStars && hasHalfStar) {
                                            return <FaStarHalfAlt key={i} color="#FFD700" />;
                                            } else {
                                            return <FaRegStar key={i} color="#ccc" />;
                                            }
                                        })}
                                        <span>({product.reviewCount})</span>
                                    </div>
                                    <p className="sold-count">{product.totalOrders} sold</p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            <footer className="footer-container">
                <Footer />
            </footer>
        </div>
    );
};

export default Products;