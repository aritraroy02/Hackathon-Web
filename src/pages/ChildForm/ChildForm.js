import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { v4 as uuidv4 } from 'uuid';
import {
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Snackbar,
} from '@mui/material';
import { Alert } from '@mui/material';
import { dbService } from '../../services/dbService';

// Malnutrition Signs Options
const malnutritionSigns = ['Visible Fat Loss', 'Muscle Wasting', 'Edema', 'N/A'];

/**
 * Form for collecting child health data
 */
function ChildForm() {
  const { actions } = useApp();

  // Form data state
  const [formData, setFormData] = useState({
    id: uuidv4(),
    childName: '',
    photo: '',
    age: '',
    uniqueIdentifier: '',
    weight: '',
    height: '',
    guardianName: '',
    malnutritionSign: '',
    recentIllnesses: '',
    parentalConsent: false,
  });

  const [isChanged, setIsChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const loadDraft = async () => {
      const draft = await dbService.getLatestFormDraft();
      if (draft) {
        setFormData(draft.data);
        setDraftId(draft.id);
      }
    };

    loadDraft();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setIsChanged(true);
  };

  // Handle photo capture or file upload
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prevData) => ({
          ...prevData,
          photo: reader.result,
        }));
        setIsChanged(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form fields
  const validateFields = () => {
    const requiredFields = ['childName', 'age', 'guardianName'];
    const errors = requiredFields.filter(
      (field) => !formData[field].trim()
    );
    return errors.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFields()) {
      setSnackbar({ open: true, message: 'Please fill in all required fields.', severity: 'error' });
      return;
    }

    if (!formData.parentalConsent) {
      setSnackbar({ open: true, message: 'Parental consent is required.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      await actions.addChildRecord(formData);
      setFormData({
        id: uuidv4(),
        childName: '',
        photo: '',
        age: '',
        uniqueIdentifier: '',
        weight: '',
        height: '',
        guardianName: '',
        malnutritionSign: '',
        recentIllnesses: '',
        parentalConsent: false,
      });
      setSnackbar({ open: true, message: 'Form submitted successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to submit form. Please try again.', severity: 'error' });
    }
    setLoading(false);
  };

  // Handle draft saving
  const handleDraftSave = () => {
    if (isChanged) {
      dbService.saveFormDraft(formData, draftId).then((id) => {
        setDraftId(id);
        setIsChanged(false);
        setSnackbar({ open: true, message: 'Draft saved', severity: 'info' });
      });
    }
  };

  return (
    <Card className="form-container">
      <CardContent>
        <Typography variant="h4" gutterBottom>
          Child Health Data Form
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Child's Name"
                name="childName"
                value={formData.childName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoChange}
                />
              </Button>
              {formData.photo && 
                <img src={formData.photo} alt="Preview" className="photo-preview" />}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID/Unique Identifier"
                name="uniqueIdentifier"
                value={formData.uniqueIdentifier}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Weight (kg)"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Height (cm)"
                name="height"
                value={formData.height}
                onChange={handleChange}
                inputProps={{ step: '0.1' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parents/Guardian's Name"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Visible Signs of Malnutrition"
                name="malnutritionSign"
                value={formData.malnutritionSign}
                onChange={handleChange}
              >
                {malnutritionSigns.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Recent Illnesses"
                name="recentIllnesses"
                value={formData.recentIllnesses}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.parentalConsent}
                    onChange={handleChange}
                    name="parentalConsent"
                    required
                  />
                }
                label="Parental Consent"
              />
            </Grid>
          </Grid>

          <div className="action-buttons">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              className="primary-button"
              disabled={loading}
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="contained"
              color="secondary"
              onClick={handleDraftSave}
            >
              Save Draft
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => setFormData({
                id: uuidv4(),
                childName: '',
                photo: '',
                age: '',
                uniqueIdentifier: '',
                weight: '',
                height: '',
                guardianName: '',
                malnutritionSign: '',
                recentIllnesses: '',
                parentalConsent: false,
              })}
            >
              Reset
            </Button>
          </div>
        </form>
        {loading && <LinearProgress className="form-progress" />}
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
}

export default ChildForm;
