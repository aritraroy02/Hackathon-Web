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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginModal = ({ open, onClose }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [loginType, setLoginType] = useState('employeeId');
  const [identifier, setIdentifier] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setLoginType('employeeId');
      setIdentifier('');
      setErrors({});
      clearError();
    }
  }, [open, clearError]);

  const getPlaceholder = () => {
    switch (loginType) {
      case 'email':
        return 'Enter your email address';
      case 'uinNumber':
        return 'Enter your UIN number';
      case 'employeeId':
      default:
        return 'Enter your employee ID';
    }
  };

  const getIcon = () => {
    switch (loginType) {
      case 'email':
        return <EmailIcon />;
      case 'uinNumber':
        return <PersonIcon />;
      case 'employeeId':
      default:
        return <BadgeIcon />;
    }
  };

  const validateInput = () => {
    const newErrors = {};
    
    if (!identifier.trim()) {
      newErrors.identifier = `${loginType.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      setErrors(newErrors);
      return false;
    }

    if (loginType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      newErrors.identifier = 'Please enter a valid email address';
      setErrors(newErrors);
      return false;
    }

    if (loginType === 'uinNumber' && !/^\d{10}$/.test(identifier)) {
      newErrors.identifier = 'UIN number should be 10 digits';
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleLogin = async () => {
    if (!validateInput()) return;

    try {
      const result = await login(identifier.trim(), loginType);
      
      if (result.success) {
        onClose();
      }
      // Error handling is done in the auth context
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6">Health Worker Login</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Type Selection */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Login Method</InputLabel>
            <Select
              value={loginType}
              label="Login Method"
              onChange={(e) => {
                setLoginType(e.target.value);
                setIdentifier('');
                setErrors({});
              }}
            >
              <MenuItem value="employeeId">Employee ID</MenuItem>
              <MenuItem value="email">Email Address</MenuItem>
              <MenuItem value="uinNumber">UIN Number</MenuItem>
            </Select>
          </FormControl>

          {/* Identifier Input */}
          <TextField
            fullWidth
            label={loginType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyPress={handleKeyPress}
            error={!!errors.identifier}
            helperText={errors.identifier}
            placeholder={getPlaceholder()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {getIcon()}
                </InputAdornment>
              ),
            }}
            disabled={isLoading}
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          {/* Demo Credentials */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Demo Credentials:
            </Typography>
            <Typography variant="body2" component="div">
              <strong>Employee ID:</strong> HW-567890<br />
              <strong>Email:</strong> aritraditya.roy@gmail.com<br />
              <strong>UIN Number:</strong> 1234567890
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleLogin}
          variant="contained"
          disabled={isLoading || !identifier.trim()}
          startIcon={isLoading ? <CircularProgress size={16} /> : <SecurityIcon />}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginModal;
