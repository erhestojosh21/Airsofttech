import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SalesOrder.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom"; // Correctly import useNavigate hook

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#6b7280',
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return '$' + value;
        },
        color: '#6b7280',
      },
      grid: {
        color: '#e5e7eb',
      },
    },
  },
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          color: '#4b5563',
        },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#6b7280',
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: '#6b7280',
      },
      grid: {
        color: '#e5e7eb',
      },
    },
  },
};

const SalesOrder = () => {
  const [filter, setFilter] = useState("monthly");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [salesPurchaseData, setSalesPurchaseData] = useState({});
  const [orderSummaryData, setOrderSummaryData] = useState({});

  const navigate = useNavigate();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const formatLabel = (label) => {
    if (filter === "monthly") {
      const monthNum = parseInt(label);
      return months[monthNum - 1] || label;
    }

    if (filter === "daily") {
      const date = new Date(label);
      return `${months[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
    }

    if (filter === "weekly") {
      return `Week ${label}`;
    }

    if (filter === "annually") {
      return label;
    }

    return label;
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/chart-data?filter=${filter}&month=${month}&year=${year}`);
      const data = res.data;

      const labels = data.salesPurchase.map((item) => formatLabel(item.Grouping));

      setSalesPurchaseData({
        labels,
        datasets: [
          {
            label: "Sales",
            data: data.salesPurchase.map((item) => item.Sales),
            backgroundColor: "#8f2c2cff",
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#442020ff',
          },
        ],
      });

      setOrderSummaryData({
        labels,
        datasets: [
          {
            label: "Ordered",
            data: data.orderSummary.map((item) => item.Ordered),
            borderColor: "#FFC107",
            backgroundColor: "rgba(255,193,7,0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#FFC107",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
          {
            label: "Delivered",
            data: data.orderSummary.map((item) => item.Delivered),
            borderColor: "#2196F3",
            backgroundColor: "rgba(33,150,243,0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#2196F3",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
          },
        ],
      });
    } catch (error) {
      console.error("Failed to fetch chart data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter, month, year]);

  return (
    <div className="graph-container">
      <div className="sales-box">
        <div className="chart-header">
          <h3>Sales Graph</h3>
          <div className="chart-controls">
            <select
              className="chart-button"
              onChange={(e) => setFilter(e.target.value)}
              value={filter}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
            </select>

            <select
              className="chart-button"
              onChange={(e) => setYear(e.target.value)}
              value={year}
            >
              {Array.from({ length: filter === "annually" ? 10 : 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {filter === "daily" && (
              <select
                className="chart-button"
                onChange={(e) => setMonth(e.target.value)}
                value={month}
              >
                {months.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div style={{ height: "300px" }}>
          {salesPurchaseData.labels ? (
            <Bar data={salesPurchaseData} options={barOptions} />
          ) : (
            <p className="text-center text-gray-500">Loading sales data...</p>
          )}
        </div>

        <div className="chart-all" onClick={() => navigate("/admin/charts")}>
           View All
        </div>
      </div>

      <div className="order-box" onClick={() => navigate("/admin/charts")}>
        <h3>Order Graph</h3>
        <div style={{ height: "300px" }}>
          {orderSummaryData.labels ? (
            <Line data={orderSummaryData} options={lineOptions} />
          ) : (
            <p className="text-center text-gray-500">Loading order summary data...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesOrder;
