import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge
} from '@mui/material';
import {
  Home as HomeIcon,
  Add as AddIcon,
  List as ListIcon,
  Settings as SettingsIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useAppContext();

  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 0;
    if (path === '/form') return 1;
    if (path === '/records') return 2;
    if (path === '/settings') return 3;
    if (path === '/help') return 4;
    return 0;
  };

  const handleChange = (event, newValue) => {
    const routes = ['/home', '/form', '/records', '/settings', '/help'];
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
          label={t('navigation.home')}
          icon={<HomeIcon />}
          title={t('navigation.home')}
        />
        
        <BottomNavigationAction
          label={t('navigation.add_child')}
          icon={<AddIcon />}
          title={t('child.add_new')}
        />
        
        <BottomNavigationAction
          label={t('navigation.records')}
          icon={
            <Badge 
              badgeContent={state.savedRecords.length > 0 ? state.savedRecords.length : null}
              color="primary"
              max={99}
            >
              <ListIcon />
            </Badge>
          }
          title={t('records.title')}
        />
        
        <BottomNavigationAction
          label={t('navigation.settings')}
          icon={<SettingsIcon />}
          title={t('settings.title')}
        />
        
        <BottomNavigationAction
          label={t('navigation.help')}
          icon={<HelpIcon />}
          title={t('help.title')}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default Navigation;
