import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Sync as SyncIcon,
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon,
  Notifications as NotificationsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';

const Header = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/form');
  };

  const getStatusIcon = () => {
    if (state.isSyncing) {
      return <SyncIcon className="rotating" />;
    }
    return state.isOnline ? <OnlineIcon /> : <OfflineIcon />;
  };

  const getStatusColor = () => {
    if (state.isSyncing) return 'warning';
    return state.isOnline ? 'success' : 'error';
  };

  return (
    <AppBar position="sticky" elevation={2}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          component="h1" 
          sx={{ flexGrow: 1, fontWeight: 600 }}
        >
          Child Health PWA
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Sync Status */}
          <IconButton
            color="inherit"
            title={
              state.isSyncing 
                ? 'Syncing data...' 
                : state.isOnline 
                  ? 'Online' 
                  : 'Offline'
            }
          >
            <Badge 
              badgeContent={state.pendingRecords.length > 0 ? state.pendingRecords.length : null}
              color="error"
            >
              {getStatusIcon()}
            </Badge>
          </IconButton>

          {/* Authentication Buttons */}
          {!state.isAuthenticated ? (
            <Button 
              color="inherit" 
              startIcon={<LoginIcon />}
              onClick={() => navigate('/auth')}
              sx={{ ml: 1 }}
            >
              Sign In
            </Button>
          ) : (
            <Button 
              color="inherit" 
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ ml: 1 }}
            >
              Logout
            </Button>
          )}

          {/* Notifications */}
          <IconButton
            color="inherit"
            title="Notifications"
          >
            <Badge 
              badgeContent={state.pendingRecords.length}
              color="error"
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>

      <style jsx>{`
        .rotating {
          animation: rotate 2s linear infinite;
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </AppBar>
  );
};

export default Header;
