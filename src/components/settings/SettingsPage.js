import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import {
  Storage as StorageIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Palette as ThemeIcon,
  Camera as CameraIcon,
  Sync as SyncIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';
import { saveSettings, getSettings, clearAllData, getDatabaseStats } from '../../utils/database';
import { getCacheStorageUsage, clearAllCaches } from '../../utils/serviceWorker';

const SettingsPage = () => {
  const { state, updateSettings, showNotification, logout } = useAppContext();
  
  const [localSettings, setLocalSettings] = useState(state.settings);
  const [storageInfo, setStorageInfo] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClearCacheDialogOpen, setIsClearCacheDialogOpen] = useState(false);

  useEffect(() => {
    loadStorageInfo();
    loadDatabaseStats();
    loadSavedSettings();
  }, []);

  const loadSavedSettings = async () => {
    try {
      const savedSettings = await getSettings();
      if (savedSettings) {
        setLocalSettings(savedSettings);
        updateSettings(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const storageUsage = await getCacheStorageUsage();
      setStorageInfo(storageUsage);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const stats = await getDatabaseStats();
      setDbStats(stats);
    } catch (error) {
      console.error('Failed to get database stats:', error);
    }
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    
    try {
      await saveSettings(newSettings);
      updateSettings(newSettings);
      showNotification('Settings saved', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showNotification('Failed to save settings', 'error');
    }
  };

  const handleClearAllData = async () => {
    try {
      await clearAllData();
      showNotification('All data cleared successfully', 'success');
      setIsDeleteDialogOpen(false);
      
      // Reload stats
      loadDatabaseStats();
      
      // Logout user
      logout();
    } catch (error) {
      console.error('Failed to clear data:', error);
      showNotification('Failed to clear data', 'error');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearAllCaches();
      showNotification('Cache cleared successfully', 'success');
      setIsClearCacheDialogOpen(false);
      
      // Reload storage info
      loadStorageInfo();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      showNotification('Failed to clear cache', 'error');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageUsagePercentage = () => {
    if (!storageInfo || !storageInfo.quota) return 0;
    return Math.round((storageInfo.usage / storageInfo.quota) * 100);
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* App Settings */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SyncIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Sync Settings
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText
                primary="Auto-save forms"
                secondary="Automatically save form data as you type"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemText
                primary="Sync on reconnect"
                secondary="Automatically sync data when connection is restored"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.syncOnReconnect}
                  onChange={(e) => handleSettingChange('syncOnReconnect', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemText
                primary="Data compression"
                secondary="Compress data to save storage space"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={localSettings.dataCompression}
                  onChange={(e) => handleSettingChange('dataCompression', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Photo Settings */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <CameraIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Photo Settings
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Photo Quality</InputLabel>
            <Select
              value={localSettings.photoQuality}
              onChange={(e) => handleSettingChange('photoQuality', e.target.value)}
              label="Photo Quality"
            >
              <MenuItem value="low">Low (faster uploads)</MenuItem>
              <MenuItem value="medium">Medium (balanced)</MenuItem>
              <MenuItem value="high">High (best quality)</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Higher quality photos take more storage space and longer to sync
          </Typography>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <ThemeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Appearance
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={localSettings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  label="Language"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="hi">हिंदी (Hindi)</MenuItem>
                  <MenuItem value="bn">বাংলা (Bengali)</MenuItem>
                  <MenuItem value="te">తెలుగు (Telugu)</MenuItem>
                  <MenuItem value="ta">தமிழ் (Tamil)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={localSettings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  label="Theme"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto (System)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Storage Information */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Storage Usage
          </Typography>
          
          {storageInfo && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Cache Storage</Typography>
                <Typography variant="body2">
                  {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                </Typography>
              </Box>
              <Box sx={{ 
                width: '100%', 
                height: 8, 
                bgcolor: 'grey.200', 
                borderRadius: 1,
                overflow: 'hidden'
              }}>
                <Box sx={{
                  width: `${getStorageUsagePercentage()}%`,
                  height: '100%',
                  bgcolor: getStorageUsagePercentage() > 80 ? 'error.main' : 'primary.main',
                  transition: 'width 0.3s ease'
                }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {getStorageUsagePercentage()}% used
              </Typography>
            </Box>
          )}
          
          {dbStats && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <Typography variant="h6" color="primary">{dbStats.totalRecords}</Typography>
                <Typography variant="body2" color="text.secondary">Total Records</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" color="success.main">{dbStats.syncedRecords}</Typography>
                <Typography variant="body2" color="text.secondary">Synced</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="h6" color="warning.main">{dbStats.unsyncedRecords}</Typography>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
              </Grid>
            </Grid>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsClearCacheDialogOpen(true)}
            >
              Clear Cache
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={loadStorageInfo}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Security & Privacy
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText
                primary="Data Encryption"
                secondary="All sensitive data is encrypted before storage"
              />
              <ListItemSecondaryAction>
                <Chip label="Enabled" color="success" size="small" />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemText
                primary="Simple Authentication"
                secondary="Username/password authentication"
              />
              <ListItemSecondaryAction>
                <Chip label="Active" color="success" size="small" />
              </ListItemSecondaryAction>
            </ListItem>
            
            <ListItem>
              <ListItemText
                primary="Local Data Only"
                secondary="No data leaves your device until you sync"
              />
              <ListItemSecondaryAction>
                <Chip label="Protected" color="info" size="small" />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            App Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Version</Typography>
              <Typography variant="body1">1.0.0</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Build</Typography>
              <Typography variant="body1">PWA-2024.1</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Last Update</Typography>
              <Typography variant="body1">
                {new Date().toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">Platform</Typography>
              <Typography variant="body1">
                {navigator.platform}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card sx={{ mb: 2, border: '1px solid', borderColor: 'error.main' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="error">
            <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Danger Zone
          </Typography>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            These actions cannot be undone. Please proceed with caution.
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Clear All Data
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              onClick={logout}
            >
              Logout
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Clear All Data Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle color="error">Clear All Data</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This will permanently delete all child health records, settings, and cached data.
          </Alert>
          <Typography>
            Are you sure you want to clear all data? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClearAllData} color="error" variant="contained">
            Clear All Data
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Cache Dialog */}
      <Dialog
        open={isClearCacheDialogOpen}
        onClose={() => setIsClearCacheDialogOpen(false)}
      >
        <DialogTitle>Clear Cache</DialogTitle>
        <DialogContent>
          <Typography>
            This will clear all cached files and may require the app to reload content 
            when you use it next time.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsClearCacheDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClearCache} variant="contained">
            Clear Cache
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;
