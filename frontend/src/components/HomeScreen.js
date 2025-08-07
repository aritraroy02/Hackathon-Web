import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import {
  Person as PersonIcon,
  Add as AddIcon,
  List as ListIcon,
  Settings as SettingsIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { getAllRecords } from '../utils/database';
import './HomeScreen.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { state } = useAppContext();
  const [records, setRecords] = useState([]);

  const getWelcomeMessage = () => {
    if (isAuthenticated && user) {
      return `Welcome, ${user.firstName || user.name || 'User'}!`;
    }
    return 'Welcome to Child Health Records!';
  };

  const loadRecords = useCallback(async () => {
    try {
      const allRecords = await getAllRecords();
      setRecords(allRecords);
    } catch (error) {
      console.error('Failed to load records:', error);
    }
  }, []);

  // Load records on component mount
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Update records when context state changes (when new records are added)
  useEffect(() => {
    if (state.savedRecords.length > 0) {
      setRecords(state.savedRecords);
    }
  }, [state.savedRecords]);

  const getQuickStats = () => {
    // Use context state if available, otherwise use local records state
    const recordsToUse = state.savedRecords.length > 0 ? state.savedRecords : records;
    const totalRecords = recordsToUse.length;
    const syncedRecords = recordsToUse.filter(record => record.synced).length;
    const pendingRecords = totalRecords - syncedRecords;

    return {
      total: totalRecords,
      synced: syncedRecords,
      pending: pendingRecords
    };
  };

  const stats = getQuickStats();

  const QuickActionCard = ({ title, description, icon, onClick, color = 'primary' }) => (
    <Card 
      className="action-card"
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box className="action-icon">
          {icon}
        </Box>
        <Typography variant="h6" component="div" className="action-title" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" className="action-description">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box className="home-screen" sx={{ pb: 10 }}>
      {/* Welcome Header */}
      <Card className="welcome-card">
        <CardContent>
          <Box className="welcome-header">
            <div className="welcome-avatar">
              {isAuthenticated && user ? (
                user.firstName?.charAt(0) || user.name?.charAt(0) || 'U'
              ) : (
                <PersonIcon />
              )}
            </div>
            <Box className="welcome-text">
              <Typography variant="h4" component="h1" className="welcome-title">
                {getWelcomeMessage()}
              </Typography>
              <Typography variant="body1" className="welcome-subtitle">
                {isAuthenticated 
                  ? `Health Worker • ${user.designation || 'Health Worker'}`
                  : 'Manage child health records efficiently'
                }
              </Typography>
              
              {isAuthenticated && (
                <Box className="welcome-chips">
                  <span className="welcome-chip">
                    UIN: {user.uinNumber}
                  </span>
                  <span className="welcome-chip">
                    {user.role === 'health_worker' ? 'Health Worker' : user.role}
                  </span>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Records</div>
        </div>
        <div className="stat-card synced">
          <div className="stat-number">{stats.synced}</div>
          <div className="stat-label">Synced</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending Sync</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-grid">
        <QuickActionCard
          title="Add Record"
          description="Create a new child health record"
          icon={<AddIcon />}
          onClick={() => navigate('/form')}
        />
        <QuickActionCard
          title="View Records"
          description={`Browse ${getQuickStats().total} health records`}
          icon={<ListIcon />}
          onClick={() => navigate('/records')}
        />
        <QuickActionCard
          title="Settings"
          description="Configure app preferences"
          icon={<SettingsIcon />}
          onClick={() => navigate('/settings')}
        />
        <QuickActionCard
          title="Help"
          description="Get support and guidance"
          icon={<HelpIcon />}
          onClick={() => navigate('/help')}
        />
      </div>

      {/* Getting Started Guide */}
      {getQuickStats().total === 0 && (
        <Card className="auth-prompt">
          <CardContent>
            <Typography variant="h6" className="auth-prompt-title">
              Getting Started
            </Typography>
            <Typography variant="body2" className="auth-prompt-text">
              Welcome to the Child Health Records app! Here's how to get started:
            </Typography>
            <Box component="ul" sx={{ pl: 2, color: 'var(--text-secondary)' }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Tap "Add Record" to create your first child health record
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Fill in the child's health information and measurements
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                View and manage all records in the Records section
              </Typography>
              <Typography component="li" variant="body2">
                Access settings and help from the bottom navigation
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default HomeScreen; 