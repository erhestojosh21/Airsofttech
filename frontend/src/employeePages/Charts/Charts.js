import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Charts.css";
import { FaChevronLeft } from "react-icons/fa"; 

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
import { useNavigate } from "react-router-dom"; // Assuming react-router-dom is used for navigation

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

const Charts = () => {
  const [filter, setFilter] = useState("daily");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [salesPurchaseData, setSalesPurchaseData] = useState({});
  const [orderSummaryData, setOrderSummaryData] = useState({});
  const [summary, setSummary] = useState("Loading summary...");

  // Initialize useNavigate for programmatic navigation
  const navigate = useNavigate();

  const reportRef = useRef();

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

  const generateSummary = (salesData, orderData, currentFilter, currentMonth, currentYear) => {
  if (!salesData.labels || salesData.labels.length === 0 || !orderData.labels || orderData.labels.length === 0) {
    setSummary("No data available to generate a summary.");
    return;
  }

  const salesValues = salesData.datasets[0].data;
  const orderValues = orderData.datasets[0].data;
  const deliveredValues = orderData.datasets[1].data;
  const labels = salesData.labels;

  const totalSales = salesValues.reduce((acc, curr) => acc + curr, 0);
  const avgSales = (totalSales / salesValues.length).toFixed(2);

  const totalOrdered = orderValues.reduce((acc, curr) => acc + curr, 0);
  const totalDelivered = deliveredValues.reduce((acc, curr) => acc + curr, 0);

  let highestSalesPeriod = "N/A";
  if (salesValues.length > 0) {
    const maxSales = Math.max(...salesValues);
    const maxSalesIndex = salesValues.indexOf(maxSales);
    highestSalesPeriod = labels[maxSalesIndex];
  }

  let highestOrderPeriod = "N/A";
  if (orderValues.length > 0) {
    const maxOrders = Math.max(...orderValues);
    const maxOrdersIndex = orderValues.indexOf(maxOrders);
    highestOrderPeriod = labels[maxOrdersIndex];
  }

  let periodContext = "";
  if (currentFilter === "daily") {
    periodContext = `${months[currentMonth - 1]} ${currentYear}`;
  } else if (currentFilter === "monthly") {
    periodContext = `Year ${currentYear}`;
  } else if (currentFilter === "weekly") {
    periodContext = `Year ${currentYear}`;
  } else if (currentFilter === "annually") {
    periodContext = `the recorded years`;
  }

  // Clean, formal business report style
  const localSummary = `Report for ${periodContext}:
- Total Sales: $${totalSales.toLocaleString()} (avg $${avgSales} per period)
- Total Orders: ${totalOrdered} | Delivered: ${totalDelivered}
- Highest Sales recorded in ${highestSalesPeriod}
- Peak order activity in ${highestOrderPeriod}
- Delivery success rate: ${(totalDelivered / totalOrdered * 100 || 0).toFixed(1)}%`;

  setSummary(localSummary);
};




  const fetchData = async () => {
    setSummary("Loading summary..."); // Reset summary when fetching new data
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/chart-data?filter=${filter}&month=${month}&year=${year}`);
      const data = res.data;

      const labels = data.salesPurchase.map((item) => formatLabel(item.Grouping));

      const newSalesPurchaseData = {
        labels,
        datasets: [
          {
            label: "Sales",
            data: data.salesPurchase.map((item) => item.Sales),
            backgroundColor: "#af784cff",
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#8e5638ff',
          },
        ],
      };
      setSalesPurchaseData(newSalesPurchaseData);

      const newOrderSummaryData = {
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
      };
      setOrderSummaryData(newOrderSummaryData);

      // Generate summary after setting chart data
      await generateSummary(newSalesPurchaseData, newOrderSummaryData, filter, month, year);

    } catch (error) {
      console.error("Failed to fetch chart data", error);
      setSummary("Failed to load chart data and generate summary.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter, month, year]);

  const downloadPDF = async () => {
    const input = reportRef.current;
    if (!input) return;

    // Take screenshot of the container
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Report_${month}_${year}.pdf`);
  };


    return (
      <div className="chart-report">
        <div className="inventory-details-title">
          <button className="back-button" onClick={() => navigate(-1)}>
              <FaChevronLeft /> Back
          </button>
        </div>
        <div className="chart-header">
          <h1>Sales and Order Report</h1>
        
          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition"
          >
            Download Report as PDF
          </button>

        </div>

        <div ref={reportRef}>
          <div className="chart-container">
          
            <div className="chart-box">
              <div className="chart-header">
                <h3>Sales Graph</h3>
                <div className="chart-controls">
                  <select className="chart-button" onChange={(e) => setFilter(e.target.value)} value={filter}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                  </select>

                  {(filter === "daily") && (
                    <select className="chart-button" onChange={(e) => setMonth(e.target.value)} value={month}>
                      {months.map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  )}

                  {(filter === "daily" || filter === "weekly" || filter === "monthly") && (
                    <select className="chart-button" onChange={(e) => setYear(e.target.value)} value={year}>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  )}

                  {filter === "annually" && (
                    <select className="chart-button" onChange={(e) => setYear(e.target.value)} value={year}>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
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
            </div>

            <div className="chart-box">
              <h3>Order Graph</h3>
              <div style={{ height: "300px" }}>
                {orderSummaryData.labels ? (
                  <Line data={orderSummaryData} options={lineOptions} />
                ) : (
                  <p className="text-center text-gray-500">Loading order summary data...</p>
                )}
              </div>
            </div>

            <div className="summary-report">
              <h3>Summary of Results</h3>
              <div className="mt-4">
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {summary.split("\n").map((point, index) => (
                    point.trim() !== "" && (
                      <li key={index}>{point.replace(/^[-•]\s*/, "")}</li>
                    )
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

};

export default Charts;
