import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Typography, Card, CardContent, Box, Button } from '@mui/material';
import { CloudSync as CloudSyncIcon } from '@mui/icons-material';

/**
 * Sync page component to manage data synchronization
 * @returns {JSX.Element} Sync component
 */
function Sync() {
  const { pendingRecords, isOnline, syncStatus, actions } = useApp();

  const handleSync = async () => {
    if (!isOnline) {
      alert('You need to be online to sync records.');
      return;
    }
    try {
      await actions.syncPendingRecords();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div className="container">
      <Typography variant="h4" gutterBottom>
        Sync Child Health Data
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sync Status
          </Typography>
          <Typography variant="body1">
            You have {pendingRecords.length} record(s) waiting to be synced.
          </Typography>

          {syncStatus === 'syncing' ? (
            <Typography variant="body2" color="info.main">
              Syncing in progress...
            </Typography>
          ) : null}
        </CardContent>
      </Card>

      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudSyncIcon />}
          onClick={handleSync}
          disabled={!isOnline || pendingRecords.length === 0}
          className="mobile-touch-target"
        >
          Sync Now
        </Button>
      </Box>
    </div>
  );
}

export default Sync;

