import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TopCategories.css";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const TopCategories = () => {
  const [categorySalesData, setCategorySalesData] = useState(null);

  useEffect(() => {
    const fetchCategorySales = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/most-sold-categories`);
        const data = res.data;

        setCategorySalesData({
          labels: data.map((item) => item.CategoryName),
          datasets: [
            {
              label: "Units Sold",
              data: data.map((item) => item.TotalSold),
              backgroundColor: [
                "#FF6384", "#36A2EB", "#FFCE56", "#8BC34A", "#FF9800",
                "#9C27B0", "#00BCD4", "#CDDC39", "#E91E63", "#3F51B5"
              ],
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching category sales data", error);
      }
    };

    fetchCategorySales();
  }, []);

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          boxWidth: 10,
          boxHeight: 10,
          padding: 10,
          font: {
            size: 12,
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="top-categories-box">
      <h3>Top Selling Categories</h3>
      {categorySalesData && <Pie data={categorySalesData} options={chartOptions} />}
    </div>
  );
};

export default TopCategories;
