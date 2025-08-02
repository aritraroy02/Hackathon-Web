import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  List as ListIcon,
  Settings as SettingsIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useAppContext();

  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/form') return 0;
    if (path === '/records') return 1;
    if (path === '/settings') return 2;
    if (path === '/help') return 3;
    return 0;
  };

  const handleChange = (event, newValue) => {
    const routes = ['/form', '/records', '/settings', '/help'];
    navigate(routes[newValue]);
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0,
        zIndex: 1000
      }} 
      elevation={8}
    >
      <BottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        showLabels
        sx={{
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px 8px',
          },
        }}
      >
        <BottomNavigationAction
          label="Form"
          icon={<AddIcon />}
          title="New Child Record"
        />
        
        <BottomNavigationAction
          label="Records"
          icon={
            <Badge 
              badgeContent={state.savedRecords.length > 0 ? state.savedRecords.length : null}
              color="primary"
              max={99}
            >
              <ListIcon />
            </Badge>
          }
          title="View Records"
        />
        
        <BottomNavigationAction
          label="Settings"
          icon={<SettingsIcon />}
          title="App Settings"
        />
        
        <BottomNavigationAction
          label="Help"
          icon={<HelpIcon />}
          title="Help & Support"
        />
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;
