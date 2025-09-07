import React from 'react';
import TopCategories from './Charts/TopCategories';
import DashboardSummary from './Charts/DashboardSummary';
import SalesOrder from './Charts/SalesOrder';
import TopProducts from './Charts/TopProducts';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      <h1>Dashboard</h1>
      <p>Overview of key metrics and performance indicators.</p>
        <div className="dashboard-charts">
          <DashboardSummary />
          <SalesOrder />
          <div className="chart-divider">
          <TopProducts />
          <TopCategories />
          </div>
          
          
        </div>
    </div>
  );
};

export default Dashboard;
