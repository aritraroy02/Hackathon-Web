import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const steps = ['Enter UIN', 'Verify OTP'];

const LoginModal = ({ open, onClose }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [uinNumber, setUinNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [errors, setErrors] = useState({});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setActiveStep(0);
      setUinNumber('');
      setOtp('');
      setErrors({});
      clearError();
    }
  }, [open]); // Only depend on open prop

  // Reset errors when UIN changes
  useEffect(() => {
    if (errors.uinNumber && uinNumber) {
      setErrors(prev => ({ ...prev, uinNumber: '' }));
    }
  }, [uinNumber, errors.uinNumber]);

  // Reset errors when OTP changes
  useEffect(() => {
    if (errors.otp && otp) {
      setErrors(prev => ({ ...prev, otp: '' }));
    }
  }, [otp, errors.otp]);

  const validateUin = () => {
    const newErrors = {};
    if (!uinNumber) {
      newErrors.uinNumber = 'UIN Number is required';
    } else if (uinNumber.length !== 10) {
      newErrors.uinNumber = 'UIN Number must be 10 digits';
    } else if (!/^\d+$/.test(uinNumber)) {
      newErrors.uinNumber = 'UIN Number must contain only numbers';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = () => {
    const newErrors = {};
    if (!otp) {
      newErrors.otp = 'OTP is required';
    } else if (otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (validateUin()) {
        setActiveStep(1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(0);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateOtp()) {
      const result = await login(uinNumber, otp);
      if (result.success) {
        onClose();
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" component="span">
            eSignet Authentication
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {activeStep === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your 10-digit UIN (Unique Identification Number) to continue
              </Typography>
              <TextField
                fullWidth
                label="UIN Number"
                value={uinNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only digits and limit to 10 characters
                  const numericValue = value.replace(/\D/g, ''); // Remove non-digits
                  if (numericValue.length <= 10) {
                    setUinNumber(numericValue);
                  }
                }}
                error={!!errors.uinNumber}
                helperText={errors.uinNumber || 'Demo UIN: 1234567890'}
                placeholder="Enter 10-digit UIN"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter the 6-digit OTP sent to your registered mobile number
              </Typography>
              <TextField
                fullWidth
                label="Enter OTP"
                type={showOtp ? 'text' : 'password'}
                value={otp}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only digits and limit to 6 characters
                  const numericValue = value.replace(/\D/g, ''); // Remove non-digits
                  if (numericValue.length <= 6) {
                    setOtp(numericValue);
                  }
                }}
                error={!!errors.otp}
                helperText={errors.otp || 'Demo OTP: 123456'}
                placeholder="Enter 6-digit OTP"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SecurityIcon />
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
              />
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                <Typography variant="caption" display="block">
                  <strong>Demo Credentials:</strong>
                </Typography>
                <Typography variant="caption" display="block">
                  UIN: 1234567890
                </Typography>
                <Typography variant="caption" display="block">
                  OTP: 123456
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        {activeStep === 1 && (
          <Button onClick={handleBack} disabled={isLoading}>
            Back
          </Button>
        )}
        {activeStep === 0 ? (
          <Button 
            onClick={handleNext}
            variant="contained"
            disabled={isLoading}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Authenticating...' : 'Login'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LoginModal;
