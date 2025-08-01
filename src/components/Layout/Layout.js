import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  PersonAdd as PersonAddIcon,
  Storage as StorageIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  CloudOff as CloudOffIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

/**
 * Layout component with navigation and offline indicator
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Layout component
 */
function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isOnline, pendingRecords, syncStatus } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Add Child', icon: <PersonAddIcon />, path: '/form' },
    { 
      text: 'Records', 
      icon: <StorageIcon />, 
      path: '/records',
      badge: pendingRecords.length > 0 ? pendingRecords.length : null
    },
    { 
      text: 'Sync', 
      icon: <SyncIcon />, 
      path: '/sync',
      badge: pendingRecords.length > 0 ? pendingRecords.length : null
    },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Child Health PWA
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Child Health Data Collection
          </Typography>
          
          {/* Online/Offline Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isOnline ? (
              <CloudIcon color="inherit" />
            ) : (
              <CloudOffIcon color="error" />
            )}
            <Typography variant="body2">
              {isOnline ? 'Online' : 'Offline'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        
        {/* Offline indicator banner */}
        {!isOnline && (
          <Box
            sx={{
              backgroundColor: 'orange',
              color: 'white',
              padding: 1,
              textAlign: 'center',
              marginBottom: 2,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2">
              You are currently offline. Data will be synced when connection is restored.
            </Typography>
          </Box>
        )}

        {/* Sync status indicator */}
        {syncStatus === 'syncing' && (
          <Box
            sx={{
              backgroundColor: 'info.main',
              color: 'white',
              padding: 1,
              textAlign: 'center',
              marginBottom: 2,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2">
              Syncing data...
            </Typography>
          </Box>
        )}

        {children}
      </Box>
    </Box>
  );
}

export default Layout;
