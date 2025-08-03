import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Divider,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Cake as CakeIcon,
  Work as WorkIcon,
  Badge as BadgeIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { getLocationWithFallback, checkLocationPermission } from '../../utils/locationService';

const ProfileModal = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const { state, setLocation, setLocationLoading, setLocationError, showNotification } = useAppContext();
  const [locationFetchRequested, setLocationFetchRequested] = useState(false);

  useEffect(() => {
    // Auto-fetch location when modal opens and user is authenticated
    if (open && user && !state.currentLocation && !locationFetchRequested) {
      handleFetchLocation();
      setLocationFetchRequested(true);
    }
  }, [open, user, handleFetchLocation, locationFetchRequested, state.currentLocation]);

  const handleFetchLocation = useCallback(async () => {
    if (!state.isOnline) {
      showNotification('Internet connection required for location services', 'warning');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      console.log('Starting location fetch...');
      
      // First check if location permission is available
      const permissionState = await checkLocationPermission();
      console.log('Permission state:', permissionState);
      
      if (permissionState === 'denied') {
        throw new Error('Location permission denied. Please enable location access in your browser settings and refresh the page.');
      }
      
      // Use fallback method for better reliability
      const location = await getLocationWithFallback();
      setLocation(location);
      
      if (location.isApproximate) {
        showNotification('Using approximate location based on IP address', 'info');
      } else if (location.accuracy <= 100) {
        showNotification(`Location updated successfully (${Math.round(location.accuracy)}m accuracy)`, 'success');
      } else {
        showNotification(`Location updated with ${Math.round(location.accuracy)}m accuracy`, 'warning');
      }
      
      console.log('Location set successfully:', location);
      
    } catch (error) {
      console.error('Location fetch failed:', error);
      const errorMessage = error.message || 'Failed to get location';
      setLocationError(errorMessage);
      
      // Provide helpful suggestions based on error type
      if (errorMessage.includes('denied') || errorMessage.includes('permission')) {
        showNotification('Please enable location permission in your browser settings', 'error');
      } else if (errorMessage.includes('unavailable')) {
        showNotification('Location services unavailable. Check your GPS settings', 'error');
      } else if (errorMessage.includes('timeout')) {
        showNotification('Location request timed out. Try again', 'warning');
      } else if (errorMessage.includes('HTTPS') || errorMessage.includes('secure')) {
        showNotification('Location requires secure connection (HTTPS)', 'error');
      } else {
        showNotification(`Location error: ${errorMessage.split('\n')[0]}`, 'error');
      }
    } finally {
      setLocationLoading(false);
    }
  }, [state.isOnline, showNotification, setLocation]);

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!user) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">User Profile</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              bgcolor: 'primary.main',
              fontSize: '2rem'
            }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            {user.name}
          </Typography>
          <Chip 
            label={user.designation} 
            color="primary" 
            variant="outlined" 
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            {user.department}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              Personal Information
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BadgeIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  UIN Number
                </Typography>
                <Typography variant="body1">
                  {user.uinNumber}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {user.email}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">
                  {user.phone}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CakeIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Date of Birth
                </Typography>
                <Typography variant="body1">
                  {formatDate(user.dateOfBirth)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1">
                  {user.gender}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom color="primary">
              Work Information
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WorkIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Employee ID
                </Typography>
                <Typography variant="body1">
                  {user.employeeId}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BadgeIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {user.role.replace('_', ' ')}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <LocationIcon sx={{ mr: 2, color: 'text.secondary', mt: 0.5 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1">
                  {user.address}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Account Status
              </Typography>
              <Chip 
                label={user.isActive ? 'Active' : 'Inactive'} 
                color={user.isActive ? 'success' : 'error'}
                size="small"
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Location Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary">
              Current Location
            </Typography>
            <Button
              size="small"
              startIcon={state.locationLoading ? <CircularProgress size={16} /> : <MyLocationIcon />}
              onClick={handleFetchLocation}
              disabled={state.locationLoading || !state.isOnline}
            >
              {state.locationLoading ? 'Getting Location...' : 'Update Location'}
            </Button>
          </Box>

          {state.locationError && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                state.locationError.includes('permission') || state.locationError.includes('denied') ? (
                  <Button size="small" onClick={() => window.location.reload()}>
                    Reload Page
                  </Button>
                ) : null
              }
            >
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {state.locationError.split('\n')[0]}
                </Typography>
                {state.locationError.includes('•') && (
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {state.locationError.split('•').slice(1).map((tip, index) => (
                      <Typography component="li" variant="body2" key={index} sx={{ fontSize: '0.8rem' }}>
                        {tip.trim()}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            </Alert>
          )}

          {!state.isOnline && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Internet connection required for location services
            </Alert>
          )}

          {state.currentLocation ? (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <LocationIcon sx={{ mr: 2, color: 'text.secondary', mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" gutterBottom>
                  {state.currentLocation.address || `${state.currentLocation.latitude.toFixed(6)}, ${state.currentLocation.longitude.toFixed(6)}`}
                </Typography>
                {state.currentLocation.city && (
                  <Typography variant="body2" color="text.secondary">
                    {state.currentLocation.city}, {state.currentLocation.state}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {state.currentLocation.isApproximate ? (
                    <Chip label="IP-based Location" size="small" color="info" />
                  ) : state.currentLocation.accuracy <= 100 ? (
                    <Chip label="High Accuracy" size="small" color="success" />
                  ) : (
                    <Chip label="Low Accuracy" size="small" color="warning" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {state.currentLocation.isApproximate ? (
                    <>
                      Approximate location • 
                      Updated: {new Date(state.currentLocation.timestamp).toLocaleString()}
                    </>
                  ) : (
                    <>
                      Accuracy: {Math.round(state.currentLocation.accuracy)}m • 
                      Updated: {new Date(state.currentLocation.timestamp).toLocaleString()}
                    </>
                  )}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Location not available. Click "Update Location" to fetch current position.
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button 
          onClick={handleLogout}
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
        >
          Logout
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileModal;
