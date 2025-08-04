import React from 'react';
import {
  Alert,
  Box,
  Typography,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const FormValidation = ({ weight, height, age }) => {
  // Calculate BMI and growth percentiles
  const calculateBMI = () => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  const getBMICategory = (bmi, age) => {
    if (!bmi || !age) return null;
    
    // Simplified BMI categories for children (actual implementation would use WHO growth charts)
    if (age < 2) {
      // For infants, different criteria apply
      if (bmi < 14) return { category: 'Underweight', severity: 'warning', color: 'orange' };
      if (bmi >= 14 && bmi < 18) return { category: 'Normal', severity: 'success', color: 'green' };
      if (bmi >= 18 && bmi < 20) return { category: 'Overweight', severity: 'warning', color: 'orange' };
      return { category: 'Obese', severity: 'error', color: 'red' };
    } else {
      // For children 2+ years
      if (bmi < 15) return { category: 'Underweight', severity: 'warning', color: 'orange' };
      if (bmi >= 15 && bmi < 19) return { category: 'Normal', severity: 'success', color: 'green' };
      if (bmi >= 19 && bmi < 22) return { category: 'Overweight', severity: 'warning', color: 'orange' };
      return { category: 'Obese', severity: 'error', color: 'red' };
    }
  };

  const getHeightCategory = (height, age) => {
    if (!height || !age) return null;
    
    // Simplified height categories (actual implementation would use WHO growth charts)
    const expectedHeightRanges = {
      0.5: [60, 70], 1: [70, 80], 2: [80, 90], 3: [90, 100], 4: [95, 110],
      5: [105, 115], 6: [110, 120], 7: [115, 125], 8: [120, 130], 9: [125, 135],
      10: [130, 140], 11: [135, 145], 12: [140, 155], 13: [145, 165], 14: [150, 170],
      15: [155, 175], 16: [160, 180], 17: [160, 180], 18: [160, 180]
    };
    
    const ageGroup = Math.floor(age);
    const range = expectedHeightRanges[ageGroup] || expectedHeightRanges[18];
    
    if (height < range[0] * 0.9) return { category: 'Below Normal', severity: 'warning', color: 'orange' };
    if (height >= range[0] && height <= range[1]) return { category: 'Normal', severity: 'success', color: 'green' };
    if (height > range[1] * 1.1) return { category: 'Above Normal', severity: 'info', color: 'blue' };
    return { category: 'Normal Range', severity: 'success', color: 'green' };
  };

  const getWeightCategory = (weight, age) => {
    if (!weight || !age) return null;
    
    // Simplified weight categories (actual implementation would use WHO growth charts)
    const expectedWeightRanges = {
      0.5: [5, 8], 1: [8, 12], 2: [10, 15], 3: [12, 18], 4: [14, 20],
      5: [16, 22], 6: [18, 25], 7: [20, 28], 8: [22, 32], 9: [25, 36],
      10: [28, 40], 11: [32, 45], 12: [35, 55], 13: [40, 65], 14: [45, 70],
      15: [50, 75], 16: [52, 80], 17: [54, 82], 18: [55, 85]
    };
    
    const ageGroup = Math.floor(age);
    const range = expectedWeightRanges[ageGroup] || expectedWeightRanges[18];
    
    if (weight < range[0] * 0.8) return { category: 'Underweight', severity: 'warning', color: 'orange' };
    if (weight >= range[0] && weight <= range[1]) return { category: 'Normal', severity: 'success', color: 'green' };
    if (weight > range[1] * 1.2) return { category: 'Overweight', severity: 'warning', color: 'orange' };
    return { category: 'Normal Range', severity: 'success', color: 'green' };
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi, age);
  const heightCategory = getHeightCategory(height, age);
  const weightCategory = getWeightCategory(weight, age);

  const getIcon = (severity) => {
    switch (severity) {
      case 'success': return <CheckIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      case 'info': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  const getAlertSeverity = (severity) => {
    switch (severity) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Health Assessment
      </Typography>
      
      {bmi && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Body Mass Index (BMI): {bmi.toFixed(1)}
          </Typography>
          
          {bmiCategory && (
            <Alert
              severity={getAlertSeverity(bmiCategory.severity)}
              icon={getIcon(bmiCategory.severity)}
              sx={{ mb: 1 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  BMI Category: {bmiCategory.category}
                </Typography>
                <Chip
                  label={bmiCategory.category}
                  size="small"
                  sx={{ bgcolor: bmiCategory.color, color: 'white' }}
                />
              </Box>
            </Alert>
          )}
        </Box>
      )}

      {heightCategory && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Height Assessment for Age {age} years
          </Typography>
          
          <Alert
            severity={getAlertSeverity(heightCategory.severity)}
            icon={getIcon(heightCategory.severity)}
            sx={{ mb: 1 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                Height: {heightCategory.category}
              </Typography>
              <Chip
                label={heightCategory.category}
                size="small"
                sx={{ bgcolor: heightCategory.color, color: 'white' }}
              />
            </Box>
          </Alert>
        </Box>
      )}

      {weightCategory && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Weight Assessment for Age {age} years
          </Typography>
          
          <Alert
            severity={getAlertSeverity(weightCategory.severity)}
            icon={getIcon(weightCategory.severity)}
            sx={{ mb: 1 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                Weight: {weightCategory.category}
              </Typography>
              <Chip
                label={weightCategory.category}
                size="small"
                sx={{ bgcolor: weightCategory.color, color: 'white' }}
              />
            </Box>
          </Alert>
        </Box>
      )}

      {/* Growth Progress Visualization */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Growth Indicators
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* BMI Progress */}
          {bmi && bmiCategory && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">BMI</Typography>
                <Typography variant="body2">{bmi.toFixed(1)}</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(Math.max((bmi / 25) * 100, 10), 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: bmiCategory.color,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          )}
          
          {/* Height Progress */}
          {height && heightCategory && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Height</Typography>
                <Typography variant="body2">{height} cm</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(Math.max((height / 180) * 100, 10), 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: heightCategory.color,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          )}
          
          {/* Weight Progress */}
          {weight && weightCategory && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Weight</Typography>
                <Typography variant="body2">{weight} kg</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(Math.max((weight / 85) * 100, 10), 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: weightCategory.color,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Recommendations */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Note:
          </Typography>
          <Typography variant="body2">
            These assessments are based on simplified growth charts and should not replace 
            professional medical evaluation. Please consult with healthcare professionals 
            for accurate diagnosis and treatment recommendations.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default FormValidation;
