import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  Chip,
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
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', py: 3 }}>
        <Box sx={{ color: `${color}.main`, mb: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ pb: 10 }}>
      {/* Welcome Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: 'primary.main',
                mr: 2
              }}
            >
              {isAuthenticated && user ? (
                <Typography variant="h4" sx={{ color: 'white' }}>
                  {user.firstName?.charAt(0) || user.name?.charAt(0) || 'U'}
                </Typography>
              ) : (
                <PersonIcon sx={{ fontSize: 32 }} />
              )}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {getWelcomeMessage()}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isAuthenticated 
                  ? `Health Worker • ${user.designation || 'Health Worker'}`
                  : 'Manage child health records efficiently'
                }
              </Typography>
            </Box>
          </Box>
          
          {isAuthenticated && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`UIN: ${user.uinNumber}`}
                size="small"
                variant="outlined"
              />
              <Chip 
                label={user.role === 'health_worker' ? 'Health Worker' : user.role}
                size="small"
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Records
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.synced}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Synced
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card 
        sx={{ 
          mb: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            zIndex: 0
          }
        }}
      >
        <CardContent sx={{ position: 'relative', zIndex: 1, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 'bold',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px'
              }}
            >
              ⚡ Quick Actions
            </Typography>
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              textAlign: 'center', 
              mt: 0.5, 
              opacity: 0.9,
              fontSize: '0.85rem'
            }}
          >
            Choose an action to get started
          </Typography>
        </CardContent>
      </Card>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <QuickActionCard
            title="Add Record"
            description="Create a new child health record"
            icon={<AddIcon sx={{ fontSize: 40 }} />}
            onClick={() => navigate('/form')}
            color="primary"
          />
        </Grid>
        <Grid item xs={6}>
                     <QuickActionCard
             title="View Records"
             description={`Browse ${getQuickStats().total} health records`}
             icon={<ListIcon sx={{ fontSize: 40 }} />}
             onClick={() => navigate('/records')}
             color="secondary"
           />
        </Grid>
        <Grid item xs={6}>
          <QuickActionCard
            title="Settings"
            description="Configure app preferences"
            icon={<SettingsIcon sx={{ fontSize: 40 }} />}
            onClick={() => navigate('/settings')}
            color="info"
          />
        </Grid>
        <Grid item xs={6}>
          <QuickActionCard
            title="Help"
            description="Get support and guidance"
            icon={<HelpIcon sx={{ fontSize: 40 }} />}
            onClick={() => navigate('/help')}
            color="success"
          />
        </Grid>
      </Grid>

      

             {/* Getting Started Guide */}
       {getQuickStats().total === 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Getting Started
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Welcome to the Child Health Records app! Here's how to get started:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tap "Add Record" to create your first child health record
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Fill in the child's health information and measurements
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                View and manage all records in the Records section
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
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