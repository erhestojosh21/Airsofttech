import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; 
import { FaChevronRight } from "react-icons/fa";
import "./ProductReviewList.css";

const ProductReviewList = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("all");
  const navigate = useNavigate(); 

  useEffect(() => {
    fetchProducts();
  }, [sortType]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/products`);
      let data = response.data;

      if (!Array.isArray(data)) {
        console.error("Fetched data is not an array:", data);
        setProducts([]);
        return;
      }

      const productsWithPrices = data.map(product => {
        const variantPrices = (product.variants && Array.isArray(product.variants)) ? product.variants.map(v => v.price) : [];
        const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
        const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 0;
        return { ...product, minPrice, maxPrice };
      });

      if (sortType === "ratings") {
        productsWithPrices.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
      } else if (sortType === "sold") {
        productsWithPrices.sort((a, b) => b.totalOrders - a.totalOrders);
      } else {
        productsWithPrices.sort((a, b) => (b.avgRating + b.totalOrders) - (a.avgRating + a.totalOrders));
      }

      setProducts(productsWithPrices);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      setProducts([]);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} color="#facc15" size={14} />);
    }

    if (hasHalf) {
      stars.push(<FaStarHalfAlt key="half" color="#facc15" size={14} />);
    }

    while (stars.length < 5) {
      stars.push(<FaRegStar key={`off-${stars.length}`} color="#d1d5db" size={14} />);
    }

    return stars;
  };
  
  // No longer slicing the array since "Show All" feature is removed
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="product-review-list-card">
      <div className="header">
        <button onClick={() => navigate("/admin/reported-comments")}>
          View Reported Comments
        </button>
        <h3>Product Reviews</h3>
        <div className="controls">
          <input
            type="text"
            placeholder="Search product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
            <option value="all">Top All</option>
            <option value="ratings">Ratings</option>
            <option value="sold">Sold Items</option>
          </select>
        </div>
      </div>

      <table className="review-list-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Rating</th>
            <th>Reviews</th>
            <th>View</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>
                {product.minPrice !== undefined && product.maxPrice !== undefined ? (
                  `₱${product.minPrice === product.maxPrice
                    ? product.minPrice.toLocaleString()
                    : `${product.minPrice.toLocaleString()} - ₱${product.maxPrice.toLocaleString()}`}`
                ) : (
                  "Price not available"
                )}
              </td>
              <td>
                <span className="stars">{renderStars(product.avgRating)}</span>
                <span className="rate-info">
                  {product.avgRating}
                </span>
              </td>
              <td className="rating-cell">
                {product.reviewCount}
              </td>
              
              <td>
                <button
                  className="view-button"
                  onClick={() => navigate(`/admin/product-reviews/${product.id}`)}
                >
                  <FaChevronRight />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductReviewList;