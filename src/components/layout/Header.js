import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { checkInternetConnectivity } from '../../utils/networkUtils';
import LoginModal from '../auth/LoginModal';
import ProfileModal from '../auth/ProfileModal';

const Header = () => {
  const { state, showNotification } = useAppContext();
  const { isAuthenticated, user } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleProfileClick = async () => {
    // Check if internet is available for authentication
    if (!state.isOnline) {
      showNotification('Please connect to internet to access profile features', 'warning');
      return;
    }

    // Double-check internet connectivity
    const hasInternet = await checkInternetConnectivity();
    if (!hasInternet) {
      showNotification('Internet connection required for authentication', 'warning');
      return;
    }

    if (isAuthenticated && user) {
      setProfileModalOpen(true);
    } else {
      setLoginModalOpen(true);
    }
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
          {/* User Profile */}
          {isAuthenticated && user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                avatar={
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {user.name?.charAt(0) || 'U'}
                  </Avatar>
                }
                label={`Welcome, ${user.name?.split(' ')[0] || 'User'}`}
                variant="outlined"
                size="small"
                onClick={handleProfileClick}
                sx={{ 
                  cursor: 'pointer',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '& .MuiChip-avatar': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              />
            </Box>
          ) : (
            <IconButton
              color="inherit"
              onClick={handleProfileClick}
              title="Login"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <PersonIcon />
            </IconButton>
          )}

          {/* Notifications */}
          <IconButton
            color="inherit"
            title="Notifications"
          >
            <Badge 
              badgeContent={state.savedRecords.length}
              color="error"
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>

      {/* Modals */}
      <LoginModal 
        open={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
      />
      <ProfileModal 
        open={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
      />
    </AppBar>
  );
};

export default Header;
