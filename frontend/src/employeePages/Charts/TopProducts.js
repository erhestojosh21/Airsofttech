import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import "./TopProducts.css";

const TopProducts = () => {
  const [topProducts, setTopProducts] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/products`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          const productsWithPrices = res.data.map(product => {
            if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
              const prices = product.variants.map(variant => variant.price);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              return {
                ...product,
                minPrice,
                maxPrice
              };
            }
            return {
              ...product,
              minPrice: 0,
              maxPrice: 0
            };
          });
          setTopProducts(productsWithPrices);
        } else {
          console.error("Fetched data is not an array:", res.data);
          setTopProducts([]);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch top products", err);
        setTopProducts([]);
      });
  }, []);

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

  const displayedProducts = showAll ? topProducts : topProducts.slice(0, 4);

  return (
    <div className="top-products-card">
      <div className="header">
        <h3>Top Product</h3>
        <button className="see-all" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show Less" : "See All"}
        </button>
      </div>
      <table className="top-products-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Sold</th>
            <th>Rate</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {displayedProducts.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.totalOrders}</td>
              <td className="rating-cell">
                <span className="stars">{renderStars(product.avgRating)}</span>
                <span className="rate-info">
                  {product.avgRating} ({product.reviewCount} reviews)
                </span>
              </td>
              <td>
                {/* Use a robust check to ensure the properties exist before calling toLocaleString() */}
                {product.minPrice !== undefined && product.maxPrice !== undefined ? (
                  `₱ ${product.minPrice === product.maxPrice
                    ? product.minPrice.toLocaleString()
                    : `${product.minPrice.toLocaleString()} - ${product.maxPrice.toLocaleString()}`}`
                ) : (
                  "Price not available"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopProducts;