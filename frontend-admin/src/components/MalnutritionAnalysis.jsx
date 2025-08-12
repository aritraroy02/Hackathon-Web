import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { AlertTriangle, Users, TrendingUp, ArrowLeft, Download, Filter, Calendar, MapPin, Eye, Activity } from 'lucide-react';
import { apiService } from '../services/api';
import './Dashboard.css';
import './MalnutritionAnalysis.css';

const MalnutritionAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchMalnutritionData();
  }, [filterPeriod]);

  const fetchMalnutritionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getChildren({ limit: 1000 });
      if (response && response.data) {
        const children = response.data;
        const analysisData = calculateMalnutritionAnalysis(children);
        setData(analysisData);
      }
    } catch (err) {
      setError('Failed to fetch malnutrition data');
      console.error('Error fetching malnutrition data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMalnutritionAnalysis = (children) => {
    // Filter by period if needed
    let filteredChildren = children;
    if (filterPeriod !== 'all') {
      const cutoffDate = new Date();
      const days = filterPeriod === '7d' ? 7 : filterPeriod === '30d' ? 30 : filterPeriod === '90d' ? 90 : 0;
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filteredChildren = children.filter(child => 
        new Date(child.dateCollected || child.uploadedAt) >= cutoffDate
      );
    }

    // Malnutrition symptoms distribution
    const malnutritionStats = filteredChildren.reduce((acc, child) => {
      let signs = child.malnutritionSigns;
      
      // Handle string format
      if (typeof signs === 'string') {
        signs = signs.trim() ? signs.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
      }
      
      // Process valid signs
      if (Array.isArray(signs) && signs.length > 0) {
        signs.forEach(sign => {
          if (sign && sign.trim()) {
            const cleanSign = sign.trim();
            if (!acc[cleanSign]) {
              acc[cleanSign] = {
                count: 0,
                children: [],
                percentage: 0
              };
            }
            acc[cleanSign].count++;
            acc[cleanSign].children.push({
              id: child._id,
              name: child.childName,
              age: child.age,
              location: child.location,
              healthId: child.healthId,
              uploadedBy: child.uploadedBy,
              dateCollected: child.dateCollected || child.uploadedAt
            });
          }
        });
      } else {
        if (!acc['No Symptoms']) {
          acc['No Symptoms'] = {
            count: 0,
            children: [],
            percentage: 0
          };
        }
        acc['No Symptoms'].count++;
        acc['No Symptoms'].children.push({
          id: child._id,
          name: child.childName,
          age: child.age,
          location: child.location,
          healthId: child.healthId,
          uploadedBy: child.uploadedBy,
          dateCollected: child.dateCollected || child.uploadedAt
        });
      }
      return acc;
    }, {});

    // Calculate percentages
    const totalChildren = filteredChildren.length;
    Object.keys(malnutritionStats).forEach(symptom => {
      malnutritionStats[symptom].percentage = 
        ((malnutritionStats[symptom].count / totalChildren) * 100).toFixed(1);
    });

    // Critical cases analysis
    const criticalCases = filteredChildren.filter(child => {
      let signs = child.malnutritionSigns;
      
      if (typeof signs === 'string') {
        signs = signs.trim() ? signs.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
      }
      
      const validSigns = Array.isArray(signs) 
        ? signs.filter(sign => 
            sign && 
            sign.trim() &&
            !['N/A - No visible signs', 'No visible signs', 'None', 'N/A'].includes(sign.trim())
          )
        : [];
      
      return validSigns.length > 2;
    });

    // Age-wise malnutrition distribution
    const ageWiseStats = filteredChildren.reduce((acc, child) => {
      const age = child.age || 0;
      let group;
      if (age < 2) group = '0-2 years';
      else if (age < 5) group = '2-5 years';
      else if (age < 8) group = '5-8 years';
      else if (age < 12) group = '8-12 years';
      else group = '12+ years';

      if (!acc[group]) {
        acc[group] = { total: 0, withSymptoms: 0, criticalCases: 0 };
      }
      
      acc[group].total++;
      
      let signs = child.malnutritionSigns;
      if (typeof signs === 'string') {
        signs = signs.trim() ? signs.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
      }
      
      const validSigns = Array.isArray(signs) 
        ? signs.filter(sign => 
            sign && 
            sign.trim() &&
            !['N/A - No visible signs', 'No visible signs', 'None', 'N/A'].includes(sign.trim())
          )
        : [];
      
      if (validSigns.length > 0) {
        acc[group].withSymptoms++;
      }
      
      if (validSigns.length > 2) {
        acc[group].criticalCases++;
      }
      
      return acc;
    }, {});

    // Location-wise analysis
    const locationStats = filteredChildren.reduce((acc, child) => {
      const state = child.location?.state || 'Unknown';
      const city = child.location?.city || 'Unknown';
      
      if (!acc[state]) {
        acc[state] = { total: 0, withSymptoms: 0, cities: {} };
      }
      
      if (!acc[state].cities[city]) {
        acc[state].cities[city] = { total: 0, withSymptoms: 0 };
      }
      
      acc[state].total++;
      acc[state].cities[city].total++;
      
      let signs = child.malnutritionSigns;
      if (typeof signs === 'string') {
        signs = signs.trim() ? signs.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
      }
      
      const validSigns = Array.isArray(signs) 
        ? signs.filter(sign => 
            sign && 
            sign.trim() &&
            !['N/A - No visible signs', 'No visible signs', 'None', 'N/A'].includes(sign.trim())
          )
        : [];
      
      if (validSigns.length > 0) {
        acc[state].withSymptoms++;
        acc[state].cities[city].withSymptoms++;
      }
      
      return acc;
    }, {});

    return {
      totalChildren,
      malnutritionStats,
      criticalCases: criticalCases.length,
      criticalCasesDetails: criticalCases.map(child => ({
        id: child._id,
        name: child.childName,
        age: child.age,
        healthId: child.healthId,
        location: child.location,
        symptoms: typeof child.malnutritionSigns === 'string' 
          ? child.malnutritionSigns.split(',').map(s => s.trim()) 
          : child.malnutritionSigns || [],
        uploadedBy: child.uploadedBy,
        dateCollected: child.dateCollected || child.uploadedAt
      })),
      ageWiseStats,
      locationStats,
      filteredChildren
    };
  };

  const handleSymptomClick = (symptom) => {
    setSelectedSymptom(symptom);
    setShowDetailModal(true);
  };

  const handleExportData = () => {
    if (!data) return;

    const csvContent = [
      ['Symptom', 'Count', 'Percentage', 'Children Affected'],
      ...Object.entries(data.malnutritionStats).map(([symptom, stats]) => [
        symptom,
        stats.count,
        `${stats.percentage}%`,
        stats.children.map(child => `${child.name} (${child.healthId})`).join('; ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'malnutrition_analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading malnutrition analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2 className="error-title">Error Loading Analysis</h2>
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={fetchMalnutritionData}>Retry</button>
      </div>
    );
  }

  // Prepare data for charts
  const symptomBarData = Object.entries(data?.malnutritionStats || {})
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10)
    .map(([symptom, stats]) => ({
      name: symptom.length > 20 ? symptom.substring(0, 20) + '...' : symptom,
      fullName: symptom,
      count: stats.count,
      percentage: parseFloat(stats.percentage)
    }));

  const ageWiseData = Object.entries(data?.ageWiseStats || {}).map(([ageGroup, stats]) => ({
    ageGroup,
    total: stats.total,
    withSymptoms: stats.withSymptoms,
    percentage: ((stats.withSymptoms / stats.total) * 100).toFixed(1),
    criticalCases: stats.criticalCases
  }));

  const locationData = Object.entries(data?.locationStats || {})
    .sort(([,a], [,b]) => b.withSymptoms - a.withSymptoms)
    .slice(0, 8)
    .map(([state, stats]) => ({
      state,
      total: stats.total,
      withSymptoms: stats.withSymptoms,
      percentage: ((stats.withSymptoms / stats.total) * 100).toFixed(1)
    }));

  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

  return (
    <div className="malnutrition-analysis">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <div className="header-nav">
              <button 
                className="back-button"
                onClick={() => window.history.back()}
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
            </div>
            <h1>
              <AlertTriangle size={32} />
              Malnutrition Analysis
            </h1>
            <p>Comprehensive analysis of malnutrition symptoms and patterns</p>
          </div>
          <div className="header-actions">
            <div className="filter-controls">
              <Filter size={16} />
              <select 
                value={filterPeriod} 
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            <button onClick={handleExportData} className="export-btn">
              <Download size={16} />
              Export Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{data?.totalChildren || 0}</div>
            <div className="stat-label">Total Children Analyzed</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {Object.values(data?.malnutritionStats || {}).reduce((sum, stats) => 
                stats.count > 0 && !stats.children[0]?.name?.includes('No Symptoms') ? sum + stats.count : sum, 0)}
            </div>
            <div className="stat-label">Children with Symptoms</div>
          </div>
        </div>

        <div className="stat-card critical">
          <div className="stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{data?.criticalCases || 0}</div>
            <div className="stat-label">Critical Cases</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {Object.keys(data?.malnutritionStats || {}).length}
            </div>
            <div className="stat-label">Unique Symptoms</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Main Symptoms Chart */}
        <div className="chart-container large">
          <div className="chart-header">
            <h3 className="chart-title">
              <AlertTriangle size={20} />
              Malnutrition Symptoms Distribution
            </h3>
            <p className="chart-subtitle">Top 10 most common symptoms (click bars for details)</p>
          </div>
          <ResponsiveContainer width="100%" height={window.innerWidth <= 768 ? 350 : 400}>
            <BarChart 
              data={symptomBarData} 
              margin={{ 
                top: 20, 
                right: window.innerWidth <= 480 ? 10 : 30, 
                left: window.innerWidth <= 480 ? 10 : 20, 
                bottom: window.innerWidth <= 768 ? 80 : 100 
              }}
              onClick={(data) => data && handleSymptomClick(data.activePayload?.[0]?.payload)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={window.innerWidth <= 480 ? 9 : 11}
                angle={-45}
                textAnchor="end"
                height={window.innerWidth <= 768 ? 80 : 100}
                interval={0}
              />
              <YAxis stroke="#64748b" fontSize={window.innerWidth <= 480 ? 10 : 12} />
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} children (${props.payload.percentage}%)`, 
                  'Count'
                ]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="count" 
                radius={[4, 4, 0, 0]}
                cursor="pointer"
              >
                {symptomBarData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Age-wise Analysis */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3 className="chart-title">
              <Users size={20} />
              Age Group Analysis
            </h3>
            <p className="chart-subtitle">Malnutrition prevalence by age group</p>
          </div>
          <ResponsiveContainer width="100%" height={window.innerWidth <= 768 ? 280 : 300}>
            <BarChart data={ageWiseData} margin={{ 
              top: 20, 
              right: window.innerWidth <= 480 ? 10 : 30, 
              left: window.innerWidth <= 480 ? 10 : 20, 
              bottom: 5 
            }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ageGroup" stroke="#64748b" fontSize={window.innerWidth <= 480 ? 10 : 12} />
              <YAxis stroke="#64748b" fontSize={window.innerWidth <= 480 ? 10 : 12} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'total') return [`${value} children`, 'Total Children'];
                  if (name === 'withSymptoms') return [`${value} children`, 'With Symptoms'];
                  if (name === 'criticalCases') return [`${value} children`, 'Critical Cases'];
                  return [value, name];
                }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="total" fill="#e2e8f0" name="Total Children" radius={[2, 2, 0, 0]} />
              <Bar dataKey="withSymptoms" fill="#f97316" name="With Symptoms" radius={[2, 2, 0, 0]} />
              <Bar dataKey="criticalCases" fill="#ef4444" name="Critical Cases" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Location Analysis */}
        <div className="chart-container medium">
          <div className="chart-header">
            <h3 className="chart-title">
              <MapPin size={20} />
              Geographic Distribution
            </h3>
            <p className="chart-subtitle">Malnutrition cases by state</p>
          </div>
          <ResponsiveContainer width="100%" height={window.innerWidth <= 768 ? 280 : 300}>
            <BarChart data={locationData} margin={{ 
              top: 20, 
              right: window.innerWidth <= 480 ? 10 : 30, 
              left: window.innerWidth <= 480 ? 10 : 20, 
              bottom: window.innerWidth <= 768 ? 50 : 60 
            }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="state" 
                stroke="#64748b" 
                fontSize={window.innerWidth <= 480 ? 9 : 11}
                angle={-45}
                textAnchor="end"
                height={window.innerWidth <= 768 ? 60 : 80}
              />
              <YAxis stroke="#64748b" fontSize={window.innerWidth <= 480 ? 10 : 12} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'withSymptoms') return [`${value} children`, 'With Symptoms'];
                  return [value, name];
                }}
                labelFormatter={(label) => `State: ${label}`}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="withSymptoms" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Critical Cases List */}
        <div className="chart-container large">
          <div className="chart-header">
            <h3 className="chart-title">
              <AlertTriangle size={20} />
              Critical Cases Details
            </h3>
            <p className="chart-subtitle">Children with multiple malnutrition symptoms (&gt;2 symptoms)</p>
          </div>
          <div className="critical-cases-list">
            {data?.criticalCasesDetails?.slice(0, 10).map((child, index) => (
              <div key={child.id || index} className="critical-case-item">
                <div className="case-header">
                  <div className="child-info">
                    <span className="child-name">{child.name || 'Unknown'}</span>
                    <span className="health-id">ID: {child.healthId}</span>
                    <span className="age">Age: {child.age || 'N/A'}</span>
                  </div>
                  <div className="case-meta">
                    <span className="location">
                      <MapPin size={14} />
                      {child.location?.city || 'Unknown'}, {child.location?.state || 'Unknown'}
                    </span>
                    <span className="date">
                      <Calendar size={14} />
                      {new Date(child.dateCollected).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="symptoms-list">
                  <strong>Symptoms:</strong>
                  <div className="symptoms-tags">
                    {Array.isArray(child.symptoms) ? 
                      child.symptoms.filter(s => s && s.trim()).map((symptom, idx) => (
                        <span key={idx} className="symptom-tag">{symptom}</span>
                      )) : 
                      <span className="symptom-tag">{child.symptoms}</span>
                    }
                  </div>
                </div>
              </div>
            ))}
            {data?.criticalCasesDetails?.length > 10 && (
              <div className="show-more">
                <p>... and {data.criticalCasesDetails.length - 10} more critical cases</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSymptom && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Eye size={20} />
                {selectedSymptom.fullName || selectedSymptom.name}
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="symptom-stats">
                <div className="stat-item">
                  <span className="label">Total Cases:</span>
                  <span className="value">{data.malnutritionStats[selectedSymptom.fullName || selectedSymptom.name]?.count || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="label">Percentage:</span>
                  <span className="value">{data.malnutritionStats[selectedSymptom.fullName || selectedSymptom.name]?.percentage || 0}%</span>
                </div>
              </div>
              <div className="affected-children">
                <h4>Affected Children:</h4>
                <div className="children-list">
                  {data.malnutritionStats[selectedSymptom.fullName || selectedSymptom.name]?.children?.slice(0, 20).map((child, idx) => (
                    <div key={idx} className="child-item">
                      <span className="name">{child.name}</span>
                      <span className="details">
                        {child.healthId} • Age {child.age} • {child.location?.city || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
                {data.malnutritionStats[selectedSymptom.fullName || selectedSymptom.name]?.children?.length > 20 && (
                  <p className="more-indicator">
                    ... and {data.malnutritionStats[selectedSymptom.fullName || selectedSymptom.name].children.length - 20} more children
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MalnutritionAnalysis;
