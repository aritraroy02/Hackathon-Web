import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import './Dashboard.css';

function Dashboard({ data, loading, error, onRetry, isOffline }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2 className="error-title">Error Loading Data</h2>
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={onRetry}>Retry</button>
      </div>
    );
  }

  const { totalChildren, averageAge, genderDistribution, cityDistribution, stateDistribution } = data?.data || {};

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="stat-number">{totalChildren || 0}</div>
          <div className="stat-label">Total Children</div>
        </div>

        <div className="dashboard-card">
          <div className="stat-number">{averageAge || 0}</div>
          <div className="stat-label">Average Age</div>
        </div>

        <div className="dashboard-card">
          <div className="stat-number">{genderDistribution?.Male || 0}</div>
          <div className="stat-label">Male Children</div>
        </div>

        <div className="dashboard-card">
          <div className="stat-number">{genderDistribution?.Female || 0}</div>
          <div className="stat-label">Female Children</div>
        </div>

        <div className="dashboard-card">
          <div className="stat-number">{genderDistribution?.Other || 0}</div>
          <div className="stat-label">Other Genders</div>
        </div>
      </div>

      <div className="charts-container">
        <h2 className="chart-title">City Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={Object.entries(cityDistribution || {}).map(([key, value]) => ({ city: key, count: value }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="city" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="charts-container">
        <h2 className="chart-title">State Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={Object.entries(stateDistribution || {}).map(([key, value]) => ({ state: key, count: value }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="state" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Dashboard;

