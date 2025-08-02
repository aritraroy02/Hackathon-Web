import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Sms as SmsIcon,
  Security as SecurityIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';
import { mockESignetAuth } from '../../utils/mockAuth';
import { checkNetworkStatus } from '../../utils/network';

const AuthPage = () => {
  const navigate = useNavigate();
  const { setAuthenticated, showNotification, setLoading, state } = useAppContext();
  
  const [activeStep, setActiveStep] = useState(0);
  const [nationalId, setNationalId] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const steps = [
    'Enter National ID',
    'Verify OTP',
    'Authentication Complete'
  ];

  const validateNationalId = (id) => {
    // Mock validation - in real implementation, this would be more sophisticated
    return id.length >= 10 && /^\d+$/.test(id);
  };

  const handleRequestOtp = async () => {
    setError('');
    
    // Check if device is online
    if (!state.isOnline) {
      setError('Authentication requires an internet connection. Please connect to the internet and try again.');
      return;
    }

    // Double-check network connectivity
    const hasConnection = await checkNetworkStatus();
    if (!hasConnection) {
      setError('No internet connection detected. Authentication requires a stable internet connection.');
      return;
    }
    
    if (!validateNationalId(nationalId)) {
      setError('Please enter a valid National ID (minimum 10 digits)');
      return;
    }

    setLoading(true);
    
    try {
      // Mock eSignet OTP request
      const response = await mockESignetAuth.requestOtp(nationalId);
      
      if (response.success) {
        setGeneratedOtp(response.otp); // In real implementation, this would be sent via SMS
        setActiveStep(1);
        showNotification(
          `OTP sent to registered mobile number ending with ${response.maskedPhone}`,
          'success'
        );
        
        // For demo purposes, show the OTP in console
        console.log('Demo OTP:', response.otp);
        showNotification(
          `Demo OTP: ${response.otp} (This would normally be sent via SMS)`,
          'info'
        );
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    
    // Check if device is online
    if (!state.isOnline) {
      setError('Authentication requires an internet connection. Please connect to the internet and try again.');
      return;
    }

    // Double-check network connectivity
    const hasConnection = await checkNetworkStatus();
    if (!hasConnection) {
      setError('No internet connection detected. Authentication requires a stable internet connection.');
      return;
    }
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    
    try {
      const response = await mockESignetAuth.verifyOtp(nationalId, otp);
      
      if (response.success) {
        setActiveStep(2);
        
        // Set authentication state
        setAuthenticated(true, response.user, response.token);
        
        showNotification('Authentication successful!', 'success');
        
        // Check if authentication was required for form submission
        const tempFormData = localStorage.getItem('childFormTempData');
        if (tempFormData) {
          // Redirect back to form to complete submission
          setTimeout(() => {
            navigate('/form');
          }, 1500);
        } else {
          // Regular authentication, redirect to form after delay
          setTimeout(() => {
            navigate('/form');
          }, 1500);
        }
      } else {
        setError(response.message || 'Invalid OTP');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setNationalId('');
    setOtp('');
    setError('');
    setGeneratedOtp('');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Enter your National ID to begin the authentication process.
            </Typography>
            
            <TextField
              fullWidth
              label="National ID"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="Enter your National ID"
              disabled={state.isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleRequestOtp}
              disabled={!nationalId || state.isLoading}
              startIcon={state.isLoading ? <CircularProgress size={20} /> : <SmsIcon />}
              size="large"
            >
              {state.isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Enter the 6-digit OTP sent to your registered mobile number.
            </Typography>
            
            <TextField
              fullWidth
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              disabled={state.isLoading}
              type={showOtp ? 'text' : 'password'}
              inputProps={{ maxLength: 6 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SecurityIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowOtp(!showOtp)}
                      edge="end"
                    >
                      {showOtp ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={state.isLoading}
                sx={{ flex: 1 }}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                onClick={handleVerifyOtp}
                disabled={!otp || state.isLoading}
                startIcon={state.isLoading ? <CircularProgress size={20} /> : <SecurityIcon />}
                sx={{ flex: 1 }}
                size="large"
              >
                {state.isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <SecurityIcon 
              sx={{ fontSize: 64, color: 'success.main', mb: 2 }} 
            />
            
            <Typography variant="h6" gutterBottom>
              Authentication Successful!
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              You have been successfully authenticated. Redirecting to the application...
            </Typography>
            
            <CircularProgress sx={{ mt: 2 }} />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardHeader
          title="eSignet Authentication"
          subheader="Secure authentication for child health data collection"
          titleTypographyProps={{ variant: 'h5', textAlign: 'center' }}
          subheaderTypographyProps={{ textAlign: 'center' }}
        />
        
        <CardContent>
          {!state.isOnline && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                No Internet Connection
              </Typography>
              <Typography variant="body2">
                Authentication requires an internet connection. Please connect to the internet to proceed with authentication.
              </Typography>
            </Alert>
          )}
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderStepContent()}
          
          {/* Demo Information */}
          {activeStep === 0 && (
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Demo Mode
              </Typography>
              <Typography variant="body2">
                This is a mock eSignet implementation. Use any 10+ digit number as National ID.
                The OTP will be displayed in the browser console and as a notification.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthPage;
