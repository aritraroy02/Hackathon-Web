import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  PhotoLibrary as GalleryIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CameraEnhance as CaptureIcon
} from '@mui/icons-material';

const PhotoCapture = ({ photo, onPhotoCapture, onPhotoClear }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const openDialog = () => {
    setIsDialogOpen(true);
    setError('');
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    stopCamera();
    setIsCapturing(false);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      setIsCapturing(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera if available
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setError('Unable to access camera. Please check permissions or use file upload.');
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 with compression
    const quality = 0.8; // Adjust quality (0.1 to 1.0)
    const dataUrl = canvas.toDataURL('image/jpeg', quality);

    // Stop camera and close dialog
    stopCamera();
    setIsCapturing(false);
    closeDialog();

    // Pass the captured photo to parent
    onPhotoCapture(dataUrl);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      
      // Compress image if needed
      compressImage(imageData, (compressedImage) => {
        onPhotoCapture(compressedImage);
        closeDialog();
      });
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (imageData, callback) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions (max 800px width/height)
      const maxSize = 800;
      let { width, height } = img;
      
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedData = canvas.toDataURL('image/jpeg', 0.8);
      callback(compressedData);
    };
    img.src = imageData;
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Child's Photo
      </Typography>
      
      {photo ? (
        <Card sx={{ maxWidth: 300, mb: 2 }}>
          <CardMedia
            component="img"
            height="200"
            image={photo}
            alt="Child's photo"
            sx={{ objectFit: 'cover' }}
          />
          <CardActions>
            <Button
              size="small"
              color="primary"
              onClick={openDialog}
              startIcon={<CameraIcon />}
            >
              Retake
            </Button>
            <Button
              size="small"
              color="error"
              onClick={onPhotoClear}
              startIcon={<DeleteIcon />}
            >
              Remove
            </Button>
          </CardActions>
        </Card>
      ) : (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: 'grey.50',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.light',
              '& .MuiTypography-root': {
                color: 'primary.contrastText'
              }
            }
          }}
          onClick={openDialog}
        >
          <CameraIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Tap to add child's photo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Camera or file upload
          </Typography>
        </Box>
      )}

      {/* Photo Capture Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Photo</Typography>
            <IconButton onClick={closeDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isCapturing ? (
            <Box sx={{ textAlign: 'center' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  borderRadius: '8px'
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={capturePhoto}
                  startIcon={<CaptureIcon />}
                  size="large"
                  sx={{ mr: 2 }}
                >
                  Capture Photo
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    stopCamera();
                    setIsCapturing(false);
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<CameraIcon />}
                onClick={startCamera}
                size="large"
                fullWidth
              >
                Use Camera
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<GalleryIcon />}
                onClick={triggerFileInput}
                size="large"
                fullWidth
              >
                Choose from Gallery
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                Photos are compressed and stored securely
              </Typography>
            </Box>
          )}
        </DialogContent>

        {!isCapturing && (
          <DialogActions>
            <Button onClick={closeDialog}>
              Cancel
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default PhotoCapture;
