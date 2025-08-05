import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Users, Activity, AlertTriangle, Heart, MapPin, Clock, Search, Download, Plus, TrendingUp } from 'lucide-react';
import { apiService } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStateIndex, setActiveStateIndex] = useState(null);
  const [activeCityIndex, setActiveCityIndex] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all children data and calculate statistics
      const response = await apiService.getChildren({ limit: 1000 });
      if (response && response.data) {
        const children = response.data;
        const dashboardStats = calculateDashboardStats(children);
        setData(dashboardStats);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (children) => {
    const totalChildren = children.length;
    
    // Gender distribution
    const genderDist = children.reduce((acc, child) => {
      const gender = child.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    // Malnutrition symptoms distribution
    const malnutritionStats = children.reduce((acc, child) => {
      if (child.malnutritionSigns && Array.isArray(child.malnutritionSigns) && child.malnutritionSigns.length > 0) {
        child.malnutritionSigns.forEach(sign => {
          acc[sign] = (acc[sign] || 0) + 1;
        });
      } else {
        acc['No Symptoms'] = (acc['No Symptoms'] || 0) + 1;
      }
      return acc;
    }, {});

    // Location distribution
    const cityDist = children.reduce((acc, child) => {
      const city = child.location?.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    const stateDist = children.reduce((acc, child) => {
      const state = child.location?.state || 'Unknown';
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {});

    // Recent uploads (last 7 days)
    const recentUploads = children.filter(child => {
      const uploadDate = new Date(child.dateCollected || child.uploadedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return uploadDate > weekAgo;
    }).length;

    // Offline submissions
    const offlineSubmissions = children.filter(child => child.isOffline).length;

    // Critical cases (children with multiple malnutrition signs)
    const criticalCases = children.filter(child => 
      child.malnutritionSigns && 
      Array.isArray(child.malnutritionSigns) && 
      child.malnutritionSigns.length > 2 &&
      !child.malnutritionSigns.includes('N/A - No visible signs')
    ).length;

    // Age distribution
    const ageGroups = children.reduce((acc, child) => {
      const age = child.age || 0;
      let group;
      if (age < 2) group = '0-2 years';
      else if (age < 5) group = '2-5 years';
      else if (age < 8) group = '5-8 years';
      else if (age < 12) group = '8-12 years';
      else group = '12+ years';
      
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    // Recent activity (last 10 uploads)
    const recentActivity = children
      .sort((a, b) => new Date(b.dateCollected || b.uploadedAt) - new Date(a.dateCollected || a.uploadedAt))
      .slice(0, 10)
      .map(child => ({
        id: child._id,
        childName: child.childName,
        uploadedBy: child.uploadedBy,
        date: child.dateCollected || child.uploadedAt,
        healthId: child.healthId
      }));

    return {
      totalChildren,
      recentUploads,
      offlineSubmissions,
      criticalCases,
      genderDistribution: genderDist,
      malnutritionDistribution: malnutritionStats,
      cityDistribution: cityDist,
      stateDistribution: stateDist,
      ageDistribution: ageGroups,
      recentActivity
    };
  };
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2 className="error-title">Error Loading Dashboard</h2>
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  // Prepare data for charts
  const malnutritionPieData = Object.entries(data?.malnutritionDistribution || {}).map(([key, value]) => ({
    name: key,
    value: value,
    percentage: ((value / data?.totalChildren) * 100).toFixed(1)
  }));

  const genderPieData = Object.entries(data?.genderDistribution || {}).map(([key, value]) => ({
    name: key,
    value: value
  }));

  const ageBarData = Object.entries(data?.ageDistribution || {}).map(([key, value]) => ({
    name: key,
    count: value
  }));

  const cityBarData = Object.entries(data?.cityDistribution || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([key, value]) => ({ name: key, count: value }));

  const stateBarData = Object.entries(data?.stateDistribution || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([key, value]) => ({ name: key, count: value }));

  // Colors for pie charts
  const malnutritionColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
  const genderColors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b'];
  const stateColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#eab308', '#84cc16'];

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <Activity className="title-icon" />
          Health Analytics Dashboard
        </h1>
        <p className="dashboard-subtitle">Real-time insights into child health data</p>
      </div>

      {/* Key Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{data?.totalChildren || 0}</div>
            <div className="stat-label">Total Children</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <Heart size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{data?.recentUploads || 0}</div>
            <div className="stat-label">Recent Records</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{data?.offlineSubmissions || 0}</div>
            <div className="stat-label">Offline Submissions</div>
          </div>
        </div>

        <div className="stat-card critical">
          <div className="stat-icon">
            <Heart size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{data?.criticalCases || 0}</div>
            <div className="stat-label">Critical Cases</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="quick-actions-panel">
        <h3 className="panel-title">Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={() => window.location.href = '/children'}>
            <Users size={20} />
            View All Children
          </button>
          <button className="action-btn secondary" onClick={() => window.location.href = '/lookup'}>
            <Search size={20} />
            Find Child
          </button>
          <button className="action-btn success" onClick={() => window.location.href = '/children'}>
            <Download size={20} />
            Export Data
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Recent Activity Feed */}
        <div className="chart-container activity-feed">
          <div className="chart-header">
            <h3 className="chart-title">
              <Clock size={20} />
              Recent Activity
            </h3>
            <p className="chart-subtitle">Latest child health records</p>
          </div>
          <div className="activity-list">
            {data?.recentActivity?.slice(0, 5).map((activity, index) => (
              <div key={activity.id || index} className="activity-item">
                <div className="activity-info">
                  <div className="activity-main">
                    <span className="child-name">{activity.childName || 'Unknown'}</span>
                    <span className="health-id">({activity.healthId})</span>
                  </div>
                  <div className="activity-meta">
                    <span className="uploader">by {activity.uploadedBy || 'Unknown'}</span>
                    <span className="date">{new Date(activity.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Age Distribution */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3 className="chart-title">
              <TrendingUp size={20} />
              Age Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={12}
                angle={0}
                textAnchor="middle"
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Malnutrition Analysis */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3 className="chart-title">
              <AlertTriangle size={20} />
              Malnutrition Symptoms Analysis
            </h3>
            <p className="chart-subtitle">Distribution of reported malnutrition signs</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={malnutritionPieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                label={({name, percentage}) => `${name}: ${percentage}%`}
              >
                {malnutritionPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={malnutritionColors[index % malnutritionColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} children`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Distribution */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3 className="chart-title">
              <Users size={20} />
              Gender Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderPieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({name, value}) => `${name}: ${value}`}
              >
                {genderPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={genderColors[index % genderColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Cities Distribution */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3 className="chart-title">
              <MapPin size={20} />
              Top Cities by Records
            </h3>
            <p className="chart-subtitle">Cities with most health records</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={cityBarData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                fill="#8884d8"
                dataKey="count"
                label={({name, count, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
                onClick={(data, index) => setActiveCityIndex(activeCityIndex === index ? null : index)}
              >
                {cityBarData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`hsl(${(index * 45) % 360}, 70%, 60%)`}
                    stroke={activeCityIndex === index ? "#000000" : "#ffffff"}
                    strokeWidth={activeCityIndex === index ? 3 : 1}
                    style={{
                      cursor: 'pointer',
                      filter: activeCityIndex === index ? 'brightness(1.1)' : 'none'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} records`, name]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* State Distribution */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3 className="chart-title">
              <MapPin size={20} />
              State Distribution
            </h3>
            <p className="chart-subtitle">Health records by state</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={stateBarData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                fill="#8884d8"
                dataKey="count"
                label={({name, count}) => `${name}: ${count}`}
                onClick={(data, index) => setActiveStateIndex(index)}
                strokeLinejoin="round"
                strokeLinecap="round"
              >
                {stateBarData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={stateColors[index % stateColors.length]}
                    stroke={activeStateIndex === index ? "#000000" : "#ffffff"}
                    strokeWidth={activeStateIndex === index ? 4 : 1}
                    style={{
                      paintOrder: activeStateIndex === index ? "stroke fill" : "fill stroke",
                      strokeLinejoin: "round",
                      strokeLinecap: "round"
                    }}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} records`, name]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

