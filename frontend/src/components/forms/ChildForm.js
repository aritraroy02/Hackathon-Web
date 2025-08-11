import React, { useState, useEffect, useCallback } from 'react';
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
  FormHelperText,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Height as HeightIcon,
  MonitorWeight as WeightIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { saveRecord, generateHealthId } from '../../utils/database';
import { getLocationWithFallback } from '../../utils/locationService';
import PhotoCapture from './PhotoCapture';
import FormValidation from './FormValidation';

// Import dayjs locales with error handling
try {
  require('dayjs/locale/en');
  require('dayjs/locale/hi');
  require('dayjs/locale/es');
  require('dayjs/locale/fr');
  require('dayjs/locale/zh-cn');
} catch (error) {
  console.warn('Some dayjs locales failed to load:', error.message);
}


const ChildForm = () => {
  const { t, i18n } = useTranslation();
  
  // Map i18n language codes to dayjs locale codes
  const getDateLocale = (lang) => {
    const localeMap = {
      'en': 'en',
      'hi': 'hi',
      'es': 'es', 
      'fr': 'fr',
      'zh': 'zh-cn'
    };
    return localeMap[lang] || 'en';
  };

  // Set dayjs locale based on current language with error handling
  const currentLocale = getDateLocale(i18n.language);
  try {
    dayjs.locale(currentLocale);
  } catch (error) {
    console.warn(`Failed to set dayjs locale to ${currentLocale}, using default:`, error);
    dayjs.locale('en'); // Fallback to English
  }
  
  // Make malnutrition options reactive to language changes
  const malnutritionOptions = React.useMemo(() => [
    t('child.form.malnutrition.stunting'),
    t('child.form.malnutrition.wasting'), 
    t('child.form.malnutrition.underweight'),
    t('child.form.malnutrition.visible_ribs'),
    t('child.form.malnutrition.swollen_belly'),
    t('child.form.malnutrition.pale_skin'),
    t('child.form.malnutrition.hair_changes'),
    t('child.form.malnutrition.delayed_development'),
    t('child.form.malnutrition.frequent_infections'),
    t('child.form.malnutrition.loss_appetite'),
    t('child.form.malnutrition.no_visible_signs')
  ], [t, i18n.language]);

  // Make steps reactive to language changes
  const steps = React.useMemo(() => [
    t('child.steps.basic_info'),
    t('child.steps.physical_measurements'),
    t('child.steps.health_assessment'),
    t('child.steps.guardian_info'),
    t('child.steps.review_submit')
  ], [t, i18n.language]);

  const { 
    state, 
    updateFormField, 
    resetForm, 
    addRecord,
    showNotification,
    setLoading
  } = useAppContext();
  const { user, isAuthenticated } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');

  const hasFormData = useCallback(() => {
    return state.currentForm.childName || 
           state.currentForm.dateOfBirth || 
           state.currentForm.weight || 
           state.currentForm.height ||
           state.currentForm.guardianName;
  }, [state.currentForm.childName, state.currentForm.dateOfBirth, state.currentForm.weight, state.currentForm.height, state.currentForm.guardianName]);

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
  }, [state.currentForm, state.settings.autoSave, hasFormData]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Load draft and auto-generate Health ID on component mount
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
    
    // Auto-generate Health ID if not already present
    if (!state.currentForm.healthId) {
      const autoHealthId = generateHealthId('NEW', new Date().toISOString());
      updateFormField('healthId', autoHealthId);
    }
  }, [updateFormField, showNotification, state.currentForm.healthId]);

  // Auto-regenerate Health ID when child name changes
  useEffect(() => {
    if (state.currentForm.childName && state.currentForm.childName.trim()) {
      const newHealthId = generateHealthId(
        state.currentForm.childName,
        new Date().toISOString()
      );
      updateFormField('healthId', newHealthId);
    }
  }, [state.currentForm.childName, updateFormField]);

  // Handle malnutrition signs translation when language changes
  useEffect(() => {
    if (state.currentForm.malnutritionSigns && state.currentForm.malnutritionSigns.length > 0) {
      // Create translation mapping from all languages to current language
      const allTranslations = {
        // English (base)
        'Stunting (low height for age)': t('child.form.malnutrition.stunting'),
        'Wasting (low weight for height)': t('child.form.malnutrition.wasting'),
        'Underweight (low weight for age)': t('child.form.malnutrition.underweight'),
        'Visible ribs/spine': t('child.form.malnutrition.visible_ribs'),
        'Swollen belly': t('child.form.malnutrition.swollen_belly'),
        'Pale skin/eyes': t('child.form.malnutrition.pale_skin'),
        'Hair changes (color/texture)': t('child.form.malnutrition.hair_changes'),
        'Delayed development': t('child.form.malnutrition.delayed_development'),
        'Frequent infections': t('child.form.malnutrition.frequent_infections'),
        'Loss of appetite': t('child.form.malnutrition.loss_appetite'),
        'N/A - No visible signs': t('child.form.malnutrition.no_visible_signs'),
        
        // Spanish
        'Retraso en el crecimiento (baja estatura para la edad)': t('child.form.malnutrition.stunting'),
        'Emaciación (bajo peso para la estatura)': t('child.form.malnutrition.wasting'),
        'Bajo peso (bajo peso para la edad)': t('child.form.malnutrition.underweight'),
        'Costillas/columna visibles': t('child.form.malnutrition.visible_ribs'),
        'Abdomen hinchado': t('child.form.malnutrition.swollen_belly'),
        'Piel/ojos pálidos': t('child.form.malnutrition.pale_skin'),
        'Cambios en el cabello (color/textura)': t('child.form.malnutrition.hair_changes'),
        'Desarrollo retrasado': t('child.form.malnutrition.delayed_development'),
        'Infecciones frecuentes': t('child.form.malnutrition.frequent_infections'),
        'Pérdida de apetito': t('child.form.malnutrition.loss_appetite'),
        'N/A - Sin signos visibles': t('child.form.malnutrition.no_visible_signs'),
        
        // French
        'Retard de croissance (taille faible pour l\'âge)': t('child.form.malnutrition.stunting'),
        'Émaciation (poids faible pour la taille)': t('child.form.malnutrition.wasting'),
        'Insuffisance pondérale (poids faible pour l\'âge)': t('child.form.malnutrition.underweight'),
        'Côtes/colonne vertébrale visibles': t('child.form.malnutrition.visible_ribs'),
        'Ventre gonflé': t('child.form.malnutrition.swollen_belly'),
        'Peau/yeux pâles': t('child.form.malnutrition.pale_skin'),
        'Changements capillaires (couleur/texture)': t('child.form.malnutrition.hair_changes'),
        'Développement retardé': t('child.form.malnutrition.delayed_development'),
        'Infections fréquentes': t('child.form.malnutrition.frequent_infections'),
        'Perte d\'appétit': t('child.form.malnutrition.loss_appetite'),
        'N/A - Aucun signe visible': t('child.form.malnutrition.no_visible_signs'),
        
        // Hindi
        'स्टंटिंग (उम्र के अनुपात में कम ऊंचाई)': t('child.form.malnutrition.stunting'),
        'वेस्टिंग (ऊंचाई के अनुपात में कम वजन)': t('child.form.malnutrition.wasting'),
        'कम वजन (उम्र के अनुपात में कम वजन)': t('child.form.malnutrition.underweight'),
        'दिखाई देने वाली पसलियां/रीढ़': t('child.form.malnutrition.visible_ribs'),
        'सूजा हुआ पेट': t('child.form.malnutrition.swollen_belly'),
        'पीली त्वचा/आंखें': t('child.form.malnutrition.pale_skin'),
        'बालों में परिवर्तन (रंग/बनावट)': t('child.form.malnutrition.hair_changes'),
        'विकास में देरी': t('child.form.malnutrition.delayed_development'),
        'बार-बार संक्रमण': t('child.form.malnutrition.frequent_infections'),
        'भूख में कमी': t('child.form.malnutrition.loss_appetite'),
        'कोई दिखाई देने वाले लक्षण नहीं': t('child.form.malnutrition.no_visible_signs'),
        
        // Chinese
        '发育迟缓（年龄身高偏低）': t('child.form.malnutrition.stunting'),
        '消瘦（身高体重偏低）': t('child.form.malnutrition.wasting'),
        '体重不足（年龄体重偏低）': t('child.form.malnutrition.underweight'),
        '可见肋骨/脊柱': t('child.form.malnutrition.visible_ribs'),
        '腹部肿胀': t('child.form.malnutrition.swollen_belly'),
        '皮肤/眼睛苍白': t('child.form.malnutrition.pale_skin'),
        '头发变化（颜色/质地）': t('child.form.malnutrition.hair_changes'),
        '发育延迟': t('child.form.malnutrition.delayed_development'),
        '频繁感染': t('child.form.malnutrition.frequent_infections'),
        '食欲不振': t('child.form.malnutrition.loss_appetite'),
        'N/A - 无可见症状': t('child.form.malnutrition.no_visible_signs')
      };

      // Update malnutrition signs to current language
      const updatedSigns = state.currentForm.malnutritionSigns.map(sign => {
        // If it's already in current language, keep it
        if (malnutritionOptions.includes(sign)) {
          return sign;
        }
        // Find translation or keep original
        return allTranslations[sign] || sign;
      });

      // Only update if there are changes
      const hasChanges = updatedSigns.some((sign, index) => 
        sign !== state.currentForm.malnutritionSigns[index]
      );

      if (hasChanges) {
        updateFormField('malnutritionSigns', updatedSigns);
      }
    }
  }, [i18n.language, t, malnutritionOptions, state.currentForm.malnutritionSigns, updateFormField]);

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!state.currentForm.childName.trim()) {
          newErrors.childName = t('child.form.name_required');
        }
        if (!state.currentForm.dateOfBirth) {
          newErrors.dateOfBirth = t('child.form.date_birth_required');
        } else {
          const birthDate = new Date(state.currentForm.dateOfBirth);
          const today = new Date();
          const minDate = new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000);
          
          if (birthDate > today) {
            newErrors.dateOfBirth = t('child.form.date_birth_future');
          } else if (birthDate < minDate) {
            newErrors.dateOfBirth = t('child.form.date_birth_too_old');
          } else {
            const age = calculateAge(state.currentForm.dateOfBirth);
            if (age < 0 || age > 18) {
              newErrors.dateOfBirth = t('child.form.age_range_invalid');
            }
          }
        }
        if (!state.currentForm.gender) {
          newErrors.gender = t('child.form.gender_required');
        }
        if (!state.currentForm.healthId) {
          newErrors.healthId = t('child.form.health_id_required');
        }
        break;

      case 1: // Physical Measurements
        if (!state.currentForm.weight || isNaN(parseFloat(state.currentForm.weight)) || parseFloat(state.currentForm.weight) <= 0) {
          newErrors.weight = t('child.form.weight_invalid');
        }
        if (!state.currentForm.height || isNaN(parseFloat(state.currentForm.height)) || parseFloat(state.currentForm.height) <= 0) {
          newErrors.height = t('child.form.height_invalid');
        }
        break;      case 2: // Health Assessment
        // Optional validation for malnutrition signs
        break;
        
      case 3: // Guardian Information
        if (!state.currentForm.guardianName.trim()) {
          newErrors.guardianName = t('child.form.guardian_name_required');
        }
        if (!state.currentForm.phone.trim()) {
          newErrors.phone = t('child.form.phone_required');
        } else if (!/^\d{10}$/.test(state.currentForm.phone.trim())) {
          newErrors.phone = t('child.form.phone_invalid');
        }
        if (!state.currentForm.parentalConsent) {
          newErrors.parentalConsent = t('child.form.consent_required');
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

  const handlePhoneChange = (value) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (numericValue.length <= 10) {
      updateFormField('phone', numericValue);
    }
  };

  const handleMalnutritionChange = (selectedValues) => {
    const naOption = t('child.form.malnutrition.no_visible_signs');
    
    if (selectedValues.includes(naOption)) {
      // If N/A is selected, only keep N/A
      updateFormField('malnutritionSigns', [naOption]);
    } else {
      // If any other option is selected, remove N/A if it exists
      const filteredValues = selectedValues.filter(value => value !== naOption);
      updateFormField('malnutritionSigns', filteredValues);
    }
  };



  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const generateUniqueHealthId = () => {
    const childName = state.currentForm.childName || 'NEW';
    const healthId = generateHealthId(
      childName,
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

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Generate Health ID if not already generated
      if (!state.currentForm.healthId) {
        generateUniqueHealthId();
      }

      // Get user location if available and user is authenticated
      let location = null;
      if (isAuthenticated && user) {
        try {
          showNotification('Fetching location...', 'info');
          location = await getLocationWithFallback();
          
          if (location.isApproximate) {
            showNotification('Location captured (approximate)', 'info');
          } else {
            showNotification('Location captured successfully', 'success');
          }
        } catch (error) {
          console.log('Location not available:', error);
          showNotification(`Location unavailable: ${error.message.split('\n')[0]}`, 'warning');
        }
      }

             // Prepare record data with user information matching the required schema
       const recordData = {
         // Child Information
         childName: String(state.currentForm.childName).trim(),
         age: String(calculateAge(state.currentForm.dateOfBirth)),
         dateOfBirth: String(state.currentForm.dateOfBirth),
         gender: String(state.currentForm.gender),
         weight: String(state.currentForm.weight),
         height: String(state.currentForm.height),
        
        // Guardian Information
        guardianName: String(state.currentForm.guardianName).trim(),
        relation: String(state.currentForm.relation || 'Parent'),
        phone: String(state.currentForm.phone).trim(),
        parentsConsent: Boolean(state.currentForm.parentalConsent),
        
        // Health Information
        healthId: String(state.currentForm.healthId),
        facePhoto: state.currentForm.photo || null,
        localId: `LOC${Date.now().toString().slice(-6)}`,
        idType: String(state.currentForm.idType || 'aadhar'),
        countryCode: String(state.currentForm.countryCode || '+91'),
        malnutritionSigns: Array.isArray(state.currentForm.malnutritionSigns) 
          ? state.currentForm.malnutritionSigns.join(', ')
          : String(state.currentForm.malnutritionSigns || ''),
        recentIllnesses: String(state.currentForm.recentIllnesses || ''),
        skipMalnutrition: false,
        skipIllnesses: false,
        
        // Timestamps and Status
        dateCollected: new Date().toISOString(),
        isOffline: !isAuthenticated || !state.isOnline,
        
        // Location (if available)
        location: location || null,
        
        // Upload tracking (if authenticated)
        ...(isAuthenticated && user && {
          uploadedBy: String(user.name || `${user.firstName} ${user.lastName}`),
          uploaderUIN: user.uin,
          uploaderEmployeeId: user.employeeId,
          uploadedAt: new Date().toISOString()
        })
      };

      // Save to local database
      const savedRecord = await saveRecord(recordData);
      addRecord(savedRecord);

      // Records are stored locally for demo
      console.log('Record saved locally:', savedRecord.id);

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

      // Show submission status based on authentication
      if (isAuthenticated && user) {
        showNotification(`Record submitted by ${user.name || 'User'} (${user.employeeId || 'N/A'})`, 'info');
      } else {
        showNotification('Record saved offline (demo mode)', 'info');
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
              <PhotoCapture
                photo={state.currentForm.photo}
                onPhotoCapture={(photo) => updateFormField('photo', photo)}
                onPhotoClear={() => updateFormField('photo', null)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('child.first_name')}
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
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={currentLocale}>
                <DatePicker
                  label={t('child.date_of_birth')}
                  value={state.currentForm.dateOfBirth ? dayjs(state.currentForm.dateOfBirth) : null}
                  onChange={(newValue) => {
                    const dateString = newValue ? newValue.format('YYYY-MM-DD') : '';
                    updateFormField('dateOfBirth', dateString);
                  }}
                  maxDate={dayjs()} // Today's date
                  minDate={dayjs().subtract(18, 'year')} // 18 years ago
                  inputFormat="DD/MM/YYYY" // Display format
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!errors.dateOfBirth}
                      helperText={errors.dateOfBirth || (state.currentForm.dateOfBirth ? `${t('child.age')}: ${calculateAge(state.currentForm.dateOfBirth)} ${t('child.years')}` : t('child.form.select_date_of_birth'))}
                      sx={{
                        '& .MuiInputLabel-root': {
                          backgroundColor: 'background.paper',
                          padding: '0 4px'
                        }
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.gender}>
                <InputLabel>{t('child.gender')}</InputLabel>
                <Select
                  value={state.currentForm.gender}
                  onChange={(e) => updateFormField('gender', e.target.value)}
                  label={t('child.gender')}
                >
                  <MenuItem value="Male">{t('child.male')}</MenuItem>
                  <MenuItem value="Female">{t('child.female')}</MenuItem>
                  <MenuItem value="Other">{t('child.other')}</MenuItem>
                </Select>
                {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
              </FormControl>
            </Grid>
            
            {/* Health ID field commented out from basic info section
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label={t('child.health_id')}
                  value={state.currentForm.healthId}
                  InputProps={{
                    readOnly: true,
                  }}
                  error={!!errors.healthId}
                  helperText={errors.healthId || t('child.health_id_helper')}
                  required
                  sx={{
                    '& .MuiInputBase-input': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={generateUniqueHealthId}
                  sx={{ minWidth: 'auto', px: 2 }}
                  title={t('child.regenerate_health_id')}
                >
                  <RefreshIcon />
                </Button>
              </Box>
            </Grid>
            */}
          </Grid>
        );

      case 1: // Physical Measurements
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('child.weight') + ' (kg)'}
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
                label={t('child.height') + ' (cm)'}
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
            
                         {state.currentForm.weight && state.currentForm.height && state.currentForm.dateOfBirth && (
               <Grid item xs={12}>
                 <FormValidation 
                   weight={parseFloat(state.currentForm.weight)}
                   height={parseFloat(state.currentForm.height)}
                   age={calculateAge(state.currentForm.dateOfBirth)}
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
                <InputLabel>{t('child.form.malnutrition_signs')}</InputLabel>
                <Select
                  multiple
                  value={state.currentForm.malnutritionSigns}
                  onChange={(e) => handleMalnutritionChange(e.target.value)}
                  input={<OutlinedInput label={t('child.form.malnutrition_signs')} />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {malnutritionOptions.map((option) => {
                    const naOption = t('child.form.malnutrition.no_visible_signs');
                    const isNASelected = state.currentForm.malnutritionSigns.includes(naOption);
                    const isNAOption = option === naOption;
                    const hasOtherSelections = state.currentForm.malnutritionSigns.length > 0 && 
                                              !state.currentForm.malnutritionSigns.includes(naOption);
                    
                    const isDisabled = (isNASelected && !isNAOption) || (hasOtherSelections && isNAOption);
                    
                    return (
                      <MenuItem 
                        key={option} 
                        value={option}
                        disabled={isDisabled}
                        sx={{
                          opacity: isDisabled ? 0.5 : 1,
                          fontStyle: isDisabled ? 'italic' : 'normal'
                        }}
                      >
                        {option}
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText>
                  {state.currentForm.malnutritionSigns.includes(t('child.form.malnutrition.no_visible_signs')) 
                    ? t('child.na_selected_helper')
                    : t('child.malnutrition_helper')
                  }
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('child.recent_illnesses')}
                multiline
                rows={4}
                value={state.currentForm.recentIllnesses}
                onChange={(e) => updateFormField('recentIllnesses', e.target.value)}
                placeholder={t('child.recent_illnesses_placeholder')}
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
                label={t('child.parent_guardian')}
                value={state.currentForm.guardianName}
                onChange={(e) => updateFormField('guardianName', e.target.value)}
                error={!!errors.guardianName}
                helperText={errors.guardianName}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('child.contact_number')}
                type="tel"
                value={state.currentForm.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone || `${state.currentForm.phone.length}/10 digits entered`}
                required
                placeholder={t('child.form.phone_placeholder')}
                inputProps={{
                  maxLength: 10,
                  pattern: "[0-9]{10}",
                  inputMode: 'numeric'
                }}
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
                    {t('child.consent_text')}
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
            
            {/* Submission status */}
            <Alert 
              severity="info"
              sx={{ mb: 3 }}
            >
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Submission Status
              </Typography>
              <Typography variant="body2">
                📱 Your submission will be saved locally for offline access
              </Typography>
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Child's Name</Typography>
                <Typography variant="body1">{state.currentForm.childName}</Typography>
              </Grid>
                             <Grid item xs={12} sm={6}>
                 <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                 <Typography variant="body1">
                   {state.currentForm.dateOfBirth ? new Date(state.currentForm.dateOfBirth).toLocaleDateString('en-GB') : 'Not provided'}
                 </Typography>
               </Grid>
               <Grid item xs={12} sm={6}>
                 <Typography variant="body2" color="text.secondary">Age</Typography>
                 <Typography variant="body1">
                   {state.currentForm.dateOfBirth ? `${calculateAge(state.currentForm.dateOfBirth)} years` : 'Not calculated'}
                 </Typography>
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
              
              {state.currentForm.malnutritionSigns && state.currentForm.malnutritionSigns.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Malnutrition Signs</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {(Array.isArray(state.currentForm.malnutritionSigns) 
                      ? state.currentForm.malnutritionSigns 
                      : []
                    ).map((sign, index) => (
                      <Chip key={index} label={sign} size="small" variant="outlined" />
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
          title={t('child.form.title')}
          subheader={t('child.form.subtitle')}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {isAuthenticated && user && (
                <Chip 
                  label={`Logged in as ${user.name?.split(' ')[0] || 'User'}`}
                  size="small" 
                  color="success" 
                  variant="outlined"
                  icon={<PersonIcon />}
                />
              )}
              {autoSaveStatus && (
                <Chip 
                  label={autoSaveStatus} 
                  size="small" 
                  color="info" 
                  variant="outlined" 
                />
              )}
            </Box>
          }
        />
        
        <CardContent>
          {/* Status Alerts */}
          {!isAuthenticated && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {t('child.form.working_offline')} 
                <strong> {t('child.form.login_required')}</strong>
              </Typography>
            </Alert>
          )}
          
          {isAuthenticated && !state.isOnline && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                You're offline. Location services unavailable. Data will be saved locally for later upload.
              </Typography>
            </Alert>
          )}
          
          {isAuthenticated && state.isOnline && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                ✓ Online • ✓ Authenticated • ✓ Location services available • Ready for full data collection
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
                {t('child.clear_form')}
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || isSubmitting}
              >
                {t('child.back')}
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  startIcon={<SaveIcon />}
                  size="large"
                >
                  {isSubmitting ? t('child.saving') : t('child.save_record')}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isSubmitting}
                >
                  {t('child.next')}
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
