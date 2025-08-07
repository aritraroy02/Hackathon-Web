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
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { checkInternetConnectivity } from '../../utils/networkUtils';
import LoginModal from '../auth/LoginModal';
import ProfileModal from '../auth/ProfileModal';
import LanguageSelector from '../common/LanguageSelector';

const Header = () => {
  const { t } = useTranslation();
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
          {t('app.title')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Language Selector */}
          <LanguageSelector variant="compact" showIcon={false} showLabel={false} />
          
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
                variant="filled"
                size="small"
                onClick={handleProfileClick}
                sx={{ 
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#1976d2',
                  fontWeight: 600,
                  '& .MuiChip-avatar': {
                    color: 'white',
                    backgroundColor: '#1976d2'
                  },
                  '&:hover': {
                    backgroundColor: 'white',
                    color: '#1565c0'
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
