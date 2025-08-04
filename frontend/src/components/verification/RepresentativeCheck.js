import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const RepresentativeVerification = () => {
  const { verifyRepresentative } = useAuth();
  const [verifyType, setVerifyType] = useState('employeeId');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!identifier.trim()) {
      setError('Please enter an identifier');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await verifyRepresentative(identifier.trim(), verifyType);
      
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || 'Verification failed');
      }
    } catch (err) {
      setError('An error occurred during verification');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleVerify();
    }
  };

  const getLabel = () => {
    switch (verifyType) {
      case 'email':
        return 'Email Address';
      case 'uinNumber':
        return 'UIN Number';
      case 'employeeId':
      default:
        return 'Employee ID';
    }
  };

  const getPlaceholder = () => {
    switch (verifyType) {
      case 'email':
        return 'e.g., john.doe@healthdept.gov.in';
      case 'uinNumber':
        return 'e.g., 1234567890';
      case 'employeeId':
      default:
        return 'e.g., HW-567890';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Card>
        <CardHeader
          avatar={<SearchIcon color="primary" sx={{ fontSize: '2rem' }} />}
          title="Health Representative Verification"
          subheader="Verify the existence and status of health workers in the system"
        />
        
        <CardContent>
          <Grid container spacing={3}>
            {/* Verification Type Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Verification Type</InputLabel>
                <Select
                  value={verifyType}
                  label="Verification Type"
                  onChange={(e) => {
                    setVerifyType(e.target.value);
                    setIdentifier('');
                    setError('');
                    setResult(null);
                  }}
                >
                  <MenuItem value="employeeId">Employee ID</MenuItem>
                  <MenuItem value="email">Email Address</MenuItem>
                  <MenuItem value="uinNumber">UIN Number</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Identifier Input */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={getLabel()}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholder()}
                disabled={loading}
              />
            </Grid>

            {/* Verify Button */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleVerify}
                disabled={loading || !identifier.trim()}
                startIcon={loading ? <CircularProgress size={16} /> : <SearchIcon />}
                size="large"
              >
                {loading ? 'Verifying...' : 'Verify Representative'}
              </Button>
            </Grid>

            {/* Error Display */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error" icon={<ErrorIcon />}>
                  {error}
                </Alert>
              </Grid>
            )}

            {/* Results Display */}
            {result && (
              <Grid item xs={12}>
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
                  Representative found and verified!
                </Alert>
                
                <Card variant="outlined">
                  <CardHeader
                    avatar={
                      <PersonIcon 
                        sx={{ 
                          fontSize: '3rem', 
                          color: 'primary.main',
                          bgcolor: 'primary.light',
                          borderRadius: '50%',
                          p: 1
                        }} 
                      />
                    }
                    title={result.name}
                    subheader={result.designation}
                    action={
                      <Chip
                        label={result.isActive ? 'Active' : 'Inactive'}
                        color={result.isActive ? 'success' : 'default'}
                        icon={<CheckCircleIcon />}
                      />
                    }
                  />
                  
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Employee ID
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {result.employeeId}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          UIN Number
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {result.uinNumber}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Email Address
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {result.email}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Department
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {result.department}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Chip
                            label={result.role.replace('_', ' ').toUpperCase()}
                            color="primary"
                            size="small"
                          />
                          <Chip
                            label={result.isActive ? 'VERIFIED' : 'INACTIVE'}
                            color={result.isActive ? 'success' : 'warning'}
                            size="small"
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Sample IDs for Testing */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sample IDs for Testing:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Employee IDs:</Typography>
                <Typography variant="body2">HW-567890, HW-567891, AD-123456</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">UIN Numbers:</Typography>
                <Typography variant="body2">1234567890, 2345678901, 3456789012</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Email Addresses:</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                  aritraditya.roy@gmail.com<br />
                  priya.sharma@healthdept.gov.in
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RepresentativeVerification;
