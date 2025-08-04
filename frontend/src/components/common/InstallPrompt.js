import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  Smartphone as PhoneIcon
} from '@mui/icons-material';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event triggered');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after a delay (not immediately)
      setTimeout(() => {
        if (!standalone) {
          setShowInstallPrompt(true);
        }
      }, 30000); // Show after 30 seconds
    };

    // Listen for successful app installation
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show manual install instructions after some time
    if (ios && !standalone) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 60000); // Show after 1 minute on iOS
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
    }
    
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    
    // Don't show again for 24 hours
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Check if user recently dismissed the prompt
  useEffect(() => {
    const dismissedTime = localStorage.getItem('installPromptDismissed');
    if (dismissedTime) {
      const hoursSinceDismissal = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissal < 24) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <Dialog
      open={showInstallPrompt}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          mx: 2
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon color="primary" />
            <Typography variant="h6" component="span">
              Install Child Health App
            </Typography>
          </Box>
          <IconButton onClick={handleDismiss} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" paragraph>
          Install this app on your device for the best experience:
        </Typography>
        
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            ✓ Works offline
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            ✓ Faster loading
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            ✓ App-like experience
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            ✓ No app store required
          </Typography>
        </Box>

        {isIOS ? (
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              iOS Installation Instructions:
            </Typography>
            <Typography variant="body2" paragraph>
              1. Tap the Share button (square with arrow) in Safari
            </Typography>
            <Typography variant="body2" paragraph>
              2. Scroll down and tap "Add to Home Screen"
            </Typography>
            <Typography variant="body2">
              3. Tap "Add" to install the app
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Click "Install" to add this app to your home screen.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleDismiss} color="inherit">
          Not Now
        </Button>
        {!isIOS && deferredPrompt && (
          <Button
            onClick={handleInstall}
            variant="contained"
            startIcon={<InstallIcon />}
            sx={{ ml: 1 }}
          >
            Install App
          </Button>
        )}
        {isIOS && (
          <Button
            onClick={handleDismiss}
            variant="contained"
            color="primary"
            sx={{ ml: 1 }}
          >
            Got It
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InstallPrompt;
