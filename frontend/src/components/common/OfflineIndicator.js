import React from 'react';
import { 
  Alert, 
  Box, 
  Chip, 
  Typography,
  LinearProgress 
} from '@mui/material';
import {
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon,
  Sync as SyncIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const OfflineIndicator = ({ isOnline, isSyncing, pendingCount }) => {
  if (isOnline && !isSyncing && pendingCount === 0) {
    return null; // Don't show anything when everything is fine
  }

  const getStatusInfo = () => {
    if (isSyncing) {
      return {
        severity: 'info',
        icon: <SyncIcon className="rotating" />,
        message: 'Syncing data...',
        showProgress: true
      };
    }
    
    if (!isOnline) {
      return {
        severity: 'warning',
        icon: <OfflineIcon />,
        message: `You're offline. ${pendingCount > 0 ? `${pendingCount} records pending sync.` : 'Data will be saved locally.'}`,
        showProgress: false
      };
    }
    
    if (pendingCount > 0) {
      return {
        severity: 'info',
        icon: <WarningIcon />,
        message: `${pendingCount} records waiting to sync`,
        showProgress: false
      };
    }

    return {
      severity: 'success',
      icon: <OnlineIcon />,
      message: 'Online and synced',
      showProgress: false
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Box sx={{ position: 'sticky', top: 64, zIndex: 999, mb: 2 }}>
      <Alert 
        severity={statusInfo.severity}
        icon={statusInfo.icon}
        sx={{
          mx: 2,
          '& .MuiAlert-icon': {
            fontSize: '1.2rem'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {statusInfo.message}
          </Typography>
          
          {pendingCount > 0 && (
            <Chip
              label={`${pendingCount} pending`}
              size="small"
              color={isOnline ? 'primary' : 'default'}
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        
        {statusInfo.showProgress && (
          <LinearProgress 
            sx={{ mt: 1, borderRadius: 1 }}
            color="primary"
          />
        )}
      </Alert>

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
    </Box>
  );
};

export default OfflineIndicator;
