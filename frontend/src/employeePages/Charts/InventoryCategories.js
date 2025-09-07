import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Inventory from '../Inventory';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const InventoryCategories = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.CategoryName),
    datasets: [
      {
        label: 'Number of Products',
        data: data.map(item => item.ProductCount),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Products per Category',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1, // Ensure integer ticks for product count
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '300px', margin: '20px 0' }}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default InventoryCategories;