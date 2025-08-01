import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  CloudOff as CloudOffIcon,
} from '@mui/icons-material';
import { dbService } from '../../services/dbService';

/**
 * Home page component with dashboard overview
 * @returns {JSX.Element} Home component
 */
function Home() {
  const navigate = useNavigate();
  const { isOnline, pendingRecords, syncedRecords, lastSyncTime, loading } = useApp();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dbStats = await dbService.getStats();
        setStats(dbStats);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
  }, [pendingRecords, syncedRecords]);

  const quickActions = [
    {
      title: 'Add Child Record',
      description: 'Collect new child health data',
      icon: <PersonAddIcon fontSize="large" />,
      action: () => navigate('/form'),
      color: 'primary',
    },
    {
      title: 'View Records',
      description: 'Browse saved child records',
      icon: <StorageIcon fontSize="large" />,
      action: () => navigate('/records'),
      color: 'secondary',
    },
    {
      title: 'Sync Data',
      description: 'Upload pending records to server',
      icon: <SyncIcon fontSize="large" />,
      action: () => navigate('/sync'),
      color: 'success',
      disabled: !isOnline || pendingRecords.length === 0,
    },
  ];

  if (loading && !stats) {
    return (
      <Box className="loading-spinner">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="container">
      <Typography variant="h4" gutterBottom>
        Child Health Data Collection Dashboard
      </Typography>

      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Records
              </Typography>
              <Typography variant="h4" component="div">
                {stats?.pendingRecords || 0}
              </Typography>
              <Typography variant="body2">
                {!isOnline && <CloudOffIcon fontSize="small" sx={{ mr: 1 }} />}
                Awaiting sync
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Synced Records
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {stats?.syncedRecords || 0}
              </Typography>
              <Typography variant="body2">
                Successfully uploaded
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Records
              </Typography>
              <Typography variant="h4" component="div">
                {stats?.totalRecords || 0}
              </Typography>
              <Typography variant="body2">
                All time collected
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Connection Status
              </Typography>
              <Typography 
                variant="h6" 
                component="div" 
                color={isOnline ? 'success.main' : 'error.main'}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Typography>
              <Typography variant="body2">
                {lastSyncTime 
                  ? `Last sync: ${new Date(lastSyncTime).toLocaleString()}`
                  : 'Never synced'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                opacity: action.disabled ? 0.6 : 1,
                '&:hover': {
                  boxShadow: action.disabled ? 'none' : 6,
                },
              }}
              onClick={!action.disabled ? action.action : undefined}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: `${action.color}.main`, mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {action.description}
                </Typography>
                <Button
                  variant="contained"
                  color={action.color}
                  onClick={!action.disabled ? action.action : undefined}
                  disabled={action.disabled}
                  className="mobile-touch-target"
                >
                  {action.title.split(' ')[0]}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Offline Notice */}
      {!isOnline && (
        <Card sx={{ mt: 3, bgcolor: 'warning.light' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudOffIcon />
              <Typography variant="h6">
                Working Offline
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mt: 1 }}>
              You're currently offline. You can still collect data, and it will be 
              automatically synced when you're back online.
            </Typography>
            {pendingRecords.length > 0 && (
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                You have {pendingRecords.length} record(s) waiting to be synced.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {stats?.totalRecords === 0 && (
        <Card sx={{ mt: 3, bgcolor: 'info.light' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Welcome to Child Health PWA
            </Typography>
            <Typography variant="body1" paragraph>
              This application helps you collect child health data even when offline. 
              All data is securely stored locally and synced when you're connected.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Getting started:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              1. Click "Add Child Record" to start collecting data<br />
              2. Fill out the form with child information<br />
              3. Data is automatically saved locally<br />
              4. When online, use "Sync Data" to upload to server
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/form')}
              >
                Start Collecting Data
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Home;
