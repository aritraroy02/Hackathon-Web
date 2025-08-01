import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDone as SyncedIcon,
  CloudOff as OfflineIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';
import { getUnsyncedRecords, markRecordSynced } from '../../utils/database';
import { checkNetworkStatus } from '../../utils/network';

const SyncPage = () => {
  const { 
    state, 
    showNotification, 
    setSyncing, 
    removePendingRecord,
    markRecordSynced: markSynced 
  } = useAppContext();
  
  const [unsyncedRecords, setUnsyncedRecords] = useState([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState({});
  const [isManualSync, setIsManualSync] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    loadUnsyncedRecords();
    loadLastSyncTime();
  }, []);

  const loadUnsyncedRecords = async () => {
    try {
      const records = await getUnsyncedRecords();
      setUnsyncedRecords(records);
      
      // Initialize sync status for each record
      const initialStatus = {};
      records.forEach(record => {
        initialStatus[record.id] = { status: 'pending', message: 'Ready to sync' };
      });
      setSyncStatus(initialStatus);
    } catch (error) {
      console.error('Failed to load unsynced records:', error);
      showNotification('Failed to load pending records', 'error');
    }
  };

  const loadLastSyncTime = () => {
    const lastSync = localStorage.getItem('lastSyncTime');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }
  };

  const updateSyncStatus = (recordId, status, message) => {
    setSyncStatus(prev => ({
      ...prev,
      [recordId]: { status, message }
    }));
  };

  const syncSingleRecord = async (record) => {
    updateSyncStatus(record.id, 'syncing', 'Uploading...');
    
    try {
      // Simulate API call to sync record
      const response = await mockSyncAPI(record);
      
      if (response.success) {
        // Mark record as synced in database
        await markRecordSynced(record.id, response);
        
        // Update app state
        markSynced(record.id);
        removePendingRecord(record.id);
        
        updateSyncStatus(record.id, 'success', 'Synced successfully');
        
        return { success: true, record };
      } else {
        throw new Error(response.error || 'Sync failed');
      }
    } catch (error) {
      console.error(`Failed to sync record ${record.id}:`, error);
      updateSyncStatus(record.id, 'error', error.message);
      return { success: false, error: error.message };
    }
  };

  const syncAllRecords = async () => {
    if (!state.isOnline) {
      showNotification('Cannot sync while offline', 'error');
      return;
    }

    // Double-check network connectivity
    const hasConnection = await checkNetworkStatus();
    if (!hasConnection) {
      showNotification('No internet connection available', 'error');
      return;
    }

    setIsManualSync(true);
    setSyncing(true);
    setSyncProgress(0);

    const totalRecords = unsyncedRecords.length;
    let syncedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < unsyncedRecords.length; i++) {
      const record = unsyncedRecords[i];
      
      const result = await syncSingleRecord(record);
      
      if (result.success) {
        syncedCount++;
      } else {
        failedCount++;
      }
      
      // Update progress
      const progress = Math.round(((i + 1) / totalRecords) * 100);
      setSyncProgress(progress);
      
      // Small delay between syncs to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update last sync time
    const now = new Date();
    localStorage.setItem('lastSyncTime', now.toISOString());
    setLastSyncTime(now);

    // Show completion notification
    if (failedCount === 0) {
      showNotification(`Successfully synced ${syncedCount} records`, 'success');
    } else {
      showNotification(
        `Synced ${syncedCount} records, ${failedCount} failed`,
        'warning'
      );
    }

    // Reload unsynced records
    await loadUnsyncedRecords();
    
    setSyncing(false);
    setIsManualSync(false);
    setSyncProgress(0);
  };

  // Mock API for demonstration
  const mockSyncAPI = async (record) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Server temporarily unavailable');
    }

    return {
      success: true,
      serverId: `srv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      syncedAt: new Date().toISOString(),
      checksum: `cs_${record.id}`,
      message: 'Record synced successfully'
    };
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setIsDetailDialogOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'syncing':
        return <SyncIcon className="rotating" color="primary" />;
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'syncing':
        return 'info';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'Never';
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Sync Status Overview */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Data Synchronization
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {state.isOnline ? (
                  <Chip
                    icon={<SyncedIcon />}
                    label="Online"
                    color="success"
                    variant="outlined"
                  />
                ) : (
                  <Chip
                    icon={<OfflineIcon />}
                    label="Offline"
                    color="error"
                    variant="outlined"
                  />
                )}
                
                <Typography variant="body2" color="text.secondary">
                  Last sync: {formatDateTime(lastSyncTime)}
                </Typography>
              </Box>

              {state.isSyncing && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Syncing records... {syncProgress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={syncProgress} />
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Typography variant="h4" color="primary.main" gutterBottom>
                  {unsyncedRecords.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Records pending sync
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sync Actions */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Sync Actions
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadUnsyncedRecords}
                disabled={state.isSyncing}
              >
                Refresh
              </Button>
              
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={syncAllRecords}
                disabled={!state.isOnline || state.isSyncing || unsyncedRecords.length === 0}
              >
                {state.isSyncing ? 'Syncing...' : 'Sync All Records'}
              </Button>
            </Box>
          </Box>

          {!state.isOnline && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                You're currently offline. Records will be queued and automatically 
                synced when connection is restored.
              </Typography>
            </Alert>
          )}

          {unsyncedRecords.length === 0 && state.isOnline && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                All records are up to date! No pending synchronization required.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Pending Records List */}
      {unsyncedRecords.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Records
            </Typography>
            
            <List>
              {unsyncedRecords.map((record, index) => (
                <React.Fragment key={record.id}>
                  <ListItem
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          edge="end"
                          onClick={() => handleViewRecord(record)}
                          title="View Details"
                        >
                          <ViewIcon />
                        </IconButton>
                        
                        <IconButton
                          edge="end"
                          onClick={() => syncSingleRecord(record)}
                          disabled={!state.isOnline || state.isSyncing}
                          title="Sync This Record"
                        >
                          <UploadIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      {getStatusIcon(syncStatus[record.id]?.status)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={record.childName}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Health ID: {record.healthId} • Age: {record.age} years
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Guardian: {record.guardianName}
                          </Typography>
                          <Chip
                            label={syncStatus[record.id]?.message || 'Ready to sync'}
                            size="small"
                            color={getStatusColor(syncStatus[record.id]?.status)}
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  {index < unsyncedRecords.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Sync Tips */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sync Tips
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <SuccessIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Auto-sync when online"
                secondary="Records automatically sync when internet connection is available"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="Offline storage"
                secondary="Records are safely stored offline and will sync when connection is restored"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <SyncedIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Data encryption"
                secondary="All data is encrypted during storage and transmission for security"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Record Detail Dialog */}
      <Dialog
        open={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedRecord && (
          <>
            <DialogTitle>
              Sync Record Details - {selectedRecord.childName}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Health ID</Typography>
                  <Typography variant="body1">{selectedRecord.healthId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Age</Typography>
                  <Typography variant="body1">{selectedRecord.age} years</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Weight</Typography>
                  <Typography variant="body1">{selectedRecord.weight} kg</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Height</Typography>
                  <Typography variant="body1">{selectedRecord.height} cm</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Guardian</Typography>
                  <Typography variant="body1">{selectedRecord.guardianName}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">
                    {new Date(selectedRecord.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Sync Status</Typography>
                  <Chip
                    icon={getStatusIcon(syncStatus[selectedRecord.id]?.status)}
                    label={syncStatus[selectedRecord.id]?.message || 'Ready to sync'}
                    color={getStatusColor(syncStatus[selectedRecord.id]?.status)}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsDetailDialogOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  syncSingleRecord(selectedRecord);
                  setIsDetailDialogOpen(false);
                }}
                disabled={!state.isOnline || state.isSyncing}
                variant="contained"
                startIcon={<UploadIcon />}
              >
                Sync Record
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

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

export default SyncPage;
