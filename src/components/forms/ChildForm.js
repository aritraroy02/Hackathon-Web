import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Alert,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  CameraAlt as CameraIcon,
  Person as PersonIcon,
  Height as HeightIcon,
  MonitorWeight as WeightIcon,
  Send as SendIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAppContext } from '../../contexts/AppContext';
import { saveRecord, generateHealthId } from '../../utils/database';
import { checkNetworkStatus } from '../../utils/network';
import PhotoCapture from './PhotoCapture';
import FormValidation from './FormValidation';

const malnutritionOptions = [
  'Stunting (low height for age)',
  'Wasting (low weight for height)',
  'Underweight (low weight for age)',
  'Visible ribs/spine',
  'Swollen belly',
  'Pale skin/eyes',
  'Hair changes (color/texture)',
  'Delayed development',
  'Frequent infections',
  'Loss of appetite',
  'N/A - No visible signs'
];

const steps = [
  'Basic Information',
  'Physical Measurements',
  'Health Assessment',
  'Guardian Information',
  'Review & Submit'
];

const ChildForm = () => {
  const navigate = useNavigate();
  const { 
    state, 
    updateFormField, 
    resetForm, 
    addRecord, 
    addPendingRecord,
    showNotification,
    setLoading,
    setRequiresAuthForSubmission
  } = useAppContext();

  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (state.settings.autoSave && hasFormData()) {
      try {
        const draftData = {
          ...state.currentForm,
          isDraft: true,
          lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('childFormDraft', JSON.stringify(draftData));
        setAutoSaveStatus('Draft saved');
        
        setTimeout(() => setAutoSaveStatus(''), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [state.currentForm, state.settings.autoSave]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Restore temporary form data when returning from authentication
  useEffect(() => {
    if (state.isAuthenticated && state.requiresAuthForSubmission) {
      const tempData = localStorage.getItem('childFormTempData');
      if (tempData) {
        try {
          const parsedData = JSON.parse(tempData);
          // Restore form data
          Object.keys(parsedData).forEach(key => {
            if (key !== 'tempSave' && key !== 'lastSaved') {
              updateFormField(key, parsedData[key]);
            }
          });
          
          // Move to review step
          setActiveStep(steps.length - 1);
          
          showNotification(
            'Authentication successful! Your form data has been restored. You can now submit.',
            'success'
          );
          
          // Reset the submission requirement flag
          setRequiresAuthForSubmission(false);
        } catch (error) {
          console.error('Failed to restore form data:', error);
          showNotification('Authentication successful, but form data could not be restored.', 'warning');
        }
      }
    }
  }, [state.isAuthenticated, state.requiresAuthForSubmission, updateFormField, setRequiresAuthForSubmission, showNotification]);

  // Load draft on component mount
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draft = localStorage.getItem('childFormDraft');
        if (draft) {
          const draftData = JSON.parse(draft);
          // Only load if it's recent (within 24 hours)
          const draftAge = Date.now() - new Date(draftData.lastSaved).getTime();
          if (draftAge < 24 * 60 * 60 * 1000) {
            Object.keys(draftData).forEach(key => {
              if (key !== 'isDraft' && key !== 'lastSaved') {
                updateFormField(key, draftData[key]);
              }
            });
            showNotification('Draft restored', 'info');
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    };

    loadDraft();
  }, [updateFormField, showNotification]);

  const hasFormData = () => {
    return state.currentForm.childName || 
           state.currentForm.age || 
           state.currentForm.weight || 
           state.currentForm.height ||
           state.currentForm.guardianName;
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!state.currentForm.childName.trim()) {
          newErrors.childName = 'Child name is required';
        }
        if (!state.currentForm.age || state.currentForm.age < 0 || state.currentForm.age > 18) {
          newErrors.age = 'Age must be between 0 and 18 years';
        }
        break;
        
      case 1: // Physical Measurements
        if (!state.currentForm.weight || state.currentForm.weight <= 0) {
          newErrors.weight = 'Weight is required and must be positive';
        }
        if (!state.currentForm.height || state.currentForm.height <= 0) {
          newErrors.height = 'Height is required and must be positive';
        }
        break;
        
      case 2: // Health Assessment
        // Optional validation for malnutrition signs
        break;
        
      case 3: // Guardian Information
        if (!state.currentForm.guardianName.trim()) {
          newErrors.guardianName = 'Guardian name is required';
        }
        if (!state.currentForm.parentalConsent) {
          newErrors.parentalConsent = 'Parental consent is required';
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
      autoSave();
    }
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const generateUniqueHealthId = () => {
    const healthId = generateHealthId(
      state.currentForm.childName,
      new Date().toISOString()
    );
    updateFormField('healthId', healthId);
    showNotification('Health ID generated successfully', 'success');
  };

  const handleSubmit = async () => {
    // Validate all steps
    let isValid = true;
    for (let i = 0; i < steps.length - 1; i++) {
      if (!validateStep(i)) {
        isValid = false;
        setActiveStep(i);
        break;
      }
    }

    if (!isValid) {
      showNotification('Please fix all errors before submitting', 'error');
      return;
    }

    // Check if online and require authentication for online submissions
    const isOnline = await checkNetworkStatus();
    
    if (isOnline && !state.isAuthenticated) {
      // Set flag to indicate authentication is required for submission
      setRequiresAuthForSubmission(true);
      
      showNotification(
        'Authentication required for online submission. Redirecting to authentication...',
        'info'
      );
      
      // Store form data temporarily before redirecting
      const tempFormData = {
        ...state.currentForm,
        tempSave: true,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('childFormTempData', JSON.stringify(tempFormData));
      
      // Redirect to authentication
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Generate Health ID if not already generated
      if (!state.currentForm.healthId) {
        generateUniqueHealthId();
      }

      // Get user location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            });
          });
          
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.log('Location not available:', error);
        }
      }

      // Prepare record data
      const recordData = {
        ...state.currentForm,
        location,
        timestamp: new Date().toISOString(),
        submittedBy: state.user?.nationalId || 'offline-user',
        submitterName: state.user?.name || 'Offline User',
        submissionMode: isOnline ? 'online' : 'offline'
      };

      // Save to local database
      const savedRecord = await saveRecord(recordData);
      addRecord(savedRecord);

      // Add to pending sync queue if online
      if (isOnline) {
        addPendingRecord(savedRecord);
      }

      // Clear draft and temp data
      localStorage.removeItem('childFormDraft');
      localStorage.removeItem('childFormTempData');

      // Reset form
      resetForm();
      setActiveStep(0);
      setErrors({});

      showNotification(
        `Child record saved successfully! Health ID: ${savedRecord.healthId}`,
        'success'
      );

      // Show sync status
      if (isOnline) {
        showNotification('Record queued for sync', 'info');
      } else {
        showNotification('Record saved offline. Will sync when online.', 'warning');
      }

    } catch (error) {
      console.error('Failed to save record:', error);
      showNotification('Failed to save record. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    resetForm();
    setActiveStep(0);
    setErrors({});
    localStorage.removeItem('childFormDraft');
    showNotification('Form cleared', 'info');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Basic Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Child's Name"
                value={state.currentForm.childName}
                onChange={(e) => updateFormField('childName', e.target.value)}
                error={!!errors.childName}
                helperText={errors.childName}
                required
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age (years)"
                type="number"
                value={state.currentForm.age}
                onChange={(e) => updateFormField('age', e.target.value)}
                error={!!errors.age}
                helperText={errors.age}
                required
                inputProps={{ min: 0, max: 18, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="Health ID"
                  value={state.currentForm.healthId}
                  onChange={(e) => updateFormField('healthId', e.target.value)}
                  placeholder="Auto-generated or manual entry"
                />
                <Button
                  variant="outlined"
                  onClick={generateUniqueHealthId}
                  sx={{ minWidth: 'auto', px: 2 }}
                  title="Generate Health ID"
                >
                  <RefreshIcon />
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <PhotoCapture
                photo={state.currentForm.photo}
                onPhotoCapture={(photo) => updateFormField('photo', photo)}
                onPhotoClear={() => updateFormField('photo', null)}
              />
            </Grid>
          </Grid>
        );

      case 1: // Physical Measurements
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weight (kg)"
                type="number"
                value={state.currentForm.weight}
                onChange={(e) => updateFormField('weight', e.target.value)}
                error={!!errors.weight}
                helperText={errors.weight}
                required
                inputProps={{ min: 0, step: 0.1 }}
                InputProps={{
                  startAdornment: <WeightIcon sx={{ mr: 1, color: 'primary.main' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Height (cm)"
                type="number"
                value={state.currentForm.height}
                onChange={(e) => updateFormField('height', e.target.value)}
                error={!!errors.height}
                helperText={errors.height}
                required
                inputProps={{ min: 0, step: 0.1 }}
                InputProps={{
                  startAdornment: <HeightIcon sx={{ mr: 1, color: 'primary.main' }} />
                }}
              />
            </Grid>
            
            {state.currentForm.weight && state.currentForm.height && (
              <Grid item xs={12}>
                <FormValidation 
                  weight={parseFloat(state.currentForm.weight)}
                  height={parseFloat(state.currentForm.height)}
                  age={parseFloat(state.currentForm.age)}
                />
              </Grid>
            )}
          </Grid>
        );

      case 2: // Health Assessment
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Visible Signs of Malnutrition</InputLabel>
                <Select
                  multiple
                  value={state.currentForm.malnutritionSigns}
                  onChange={(e) => updateFormField('malnutritionSigns', e.target.value)}
                  input={<OutlinedInput label="Visible Signs of Malnutrition" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {malnutritionOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recent Illnesses"
                multiline
                rows={4}
                value={state.currentForm.recentIllnesses}
                onChange={(e) => updateFormField('recentIllnesses', e.target.value)}
                placeholder="Describe any recent illnesses or health concerns (optional)"
              />
            </Grid>
          </Grid>
        );

      case 3: // Guardian Information
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Parent/Guardian's Name"
                value={state.currentForm.guardianName}
                onChange={(e) => updateFormField('guardianName', e.target.value)}
                error={!!errors.guardianName}
                helperText={errors.guardianName}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.currentForm.parentalConsent}
                    onChange={(e) => updateFormField('parentalConsent', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I hereby provide consent for the collection and processing of my child's health data 
                    for the purpose of health monitoring and care. I understand that this data will be 
                    used to improve child health outcomes and will be handled securely.
                  </Typography>
                }
              />
              {errors.parentalConsent && (
                <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {errors.parentalConsent}
                </Typography>
              )}
            </Grid>
          </Grid>
        );

      case 4: // Review & Submit
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Information
            </Typography>
            
            {/* Authentication and submission status */}
            <Alert 
              severity={state.isOnline ? (state.isAuthenticated ? "success" : "warning") : "info"} 
              sx={{ mb: 3 }}
            >
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Submission Status
              </Typography>
              <Typography variant="body2">
                {state.isOnline ? (
                  state.isAuthenticated ? 
                    "✅ Online & Authenticated - Your submission will be processed immediately" :
                    "⚠️ Online but not authenticated - You'll be asked to authenticate when you submit"
                ) : (
                  "📴 Offline - Your submission will be saved locally and synced when online"
                )}
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Child's Name</Typography>
                <Typography variant="body1">{state.currentForm.childName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Age</Typography>
                <Typography variant="body1">{state.currentForm.age} years</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Weight</Typography>
                <Typography variant="body1">{state.currentForm.weight} kg</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Height</Typography>
                <Typography variant="body1">{state.currentForm.height} cm</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Health ID</Typography>
                <Typography variant="body1">{state.currentForm.healthId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Guardian</Typography>
                <Typography variant="body1">{state.currentForm.guardianName}</Typography>
              </Grid>
              
              {state.currentForm.malnutritionSigns.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Malnutrition Signs</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {state.currentForm.malnutritionSigns.map((sign) => (
                      <Chip key={sign} label={sign} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              )}
              
              {state.currentForm.recentIllnesses && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Recent Illnesses</Typography>
                  <Typography variant="body1">{state.currentForm.recentIllnesses}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      <Card>
        <CardHeader
          title="Child Health Data Collection"
          subheader="Complete all sections to register a new child health record"
          action={
            autoSaveStatus && (
              <Chip 
                label={autoSaveStatus} 
                size="small" 
                color="info" 
                variant="outlined" 
              />
            )
          }
        />
        
        <CardContent>
          {!state.isAuthenticated && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Authentication Information
              </Typography>
              <Typography variant="body2">
                You can fill out the form without authentication. When you submit the form while online, 
                you'll be asked to authenticate for security purposes. Offline submissions don't require authentication.
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

          {isSubmitting && (
            <Box sx={{ mb: 3 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                Saving record...
              </Typography>
            </Box>
          )}

          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Box>
              <Button
                onClick={handleClearForm}
                color="error"
                disabled={isSubmitting}
              >
                Clear Form
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || isSubmitting}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  startIcon={<SaveIcon />}
                  size="large"
                >
                  {isSubmitting ? 'Saving...' : 'Save Record'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChildForm;
