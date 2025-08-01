import React, { useState } from 'react';
import { dbService } from '../../services/dbService';
import {
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

/**
 * Settings page component
 * @returns {JSX.Element} Settings component
 */
function Settings() {
  const [clearDataDialog, setClearDataDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClearData = async () => {
    try {
      setLoading(true);
      await dbService.clearAllData();
      setClearDataDialog(false);
      alert('All data has been cleared successfully.');
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstallPWA = () => {
    if ('serviceWorker' in navigator) {
      alert('This app can be installed on your device for offline use.');
    }
  };

  return (
    <div className="container">
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* App Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            App Information
          </Typography>
          <Typography variant="body1" paragraph>
            Child Health Data Collection PWA v1.0.0
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This Progressive Web App allows you to collect child health data 
            offline and sync when connected to the internet.
          </Typography>
        </CardContent>
      </Card>

      {/* PWA Installation */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Install App
          </Typography>
          <Typography variant="body2" paragraph>
            Install this app on your device for better performance and offline access.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<InfoIcon />}
            onClick={handleInstallPWA}
          >
            Install PWA
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Management
          </Typography>
          <Typography variant="body2" paragraph>
            Clear all stored data including pending and synced records.
            This action cannot be undone.
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setClearDataDialog(true)}
            disabled={loading}
          >
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Privacy & Security
          </Typography>
          <Typography variant="body2" paragraph>
            • All sensitive data is encrypted before local storage
          </Typography>
          <Typography variant="body2" paragraph>
            • Photos and personal information are protected
          </Typography>
          <Typography variant="body2" paragraph>
            • Data is only transmitted when you initiate sync
          </Typography>
        </CardContent>
      </Card>

      {/* Clear Data Confirmation Dialog */}
      <Dialog
        open={clearDataDialog}
        onClose={() => setClearDataDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Clear All Data?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This will permanently delete all child health records, drafts, and settings.
            Make sure you have synced all important data before proceeding.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDataDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleClearData} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Clear All Data
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Settings;
