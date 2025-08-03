import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  Help as HelpIcon,
  QuestionAnswer as FAQIcon,
  ContactSupport as SupportIcon,
  Description as GuideIcon,
  Security as SecurityIcon,
  Sync as SyncIcon,
  CameraAlt as CameraIcon,
  Storage as StorageIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  GetApp as DownloadIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const HelpPage = () => {
  const [expandedPanel, setExpandedPanel] = useState('getting-started');

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const faqData = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <GuideIcon />,
      content: [
        {
          question: 'How do I register a new child?',
          answer: 'Navigate to the Form tab, fill in all required information including child\'s name, age, weight, height, and guardian details. Don\'t forget to provide parental consent before submitting.'
        },
        {
          question: 'What is a Health ID?',
          answer: 'A Health ID is a unique identifier generated for each child. It helps track health records over time and can be auto-generated or manually entered.'
        },
        {
          question: 'Do I need internet to use the app?',
          answer: 'No! The app works completely offline. Data is stored locally and synced when internet becomes available.'
        }
      ]
    },
    {
      id: 'authentication',
      title: 'Authentication & Security',
      icon: <SecurityIcon />,
      content: [
        {
          question: 'How does authentication work?',
          answer: 'Use your assigned username and password to login. Demo accounts are available: admin/password123, user/user123, demo/demo123.'
        },
        {
          question: 'Is my data secure?',
          answer: 'Yes! All sensitive data is encrypted before storage. Data only leaves your device when you explicitly sync it to the server.'
        },
        {
          question: 'What if I forget my login credentials?',
          answer: 'For this demo application, use any of the provided demo accounts: admin/password123, user/user123, or demo/demo123.'
        }
      ]
    },
    {
      id: 'offline-usage',
      title: 'Offline Usage',
      icon: <StorageIcon />,
      content: [
        {
          question: 'How does offline mode work?',
          answer: 'The app automatically saves all data locally when offline. When internet returns, you can sync all pending records to the server.'
        },
        {
          question: 'How much data can I store offline?',
          answer: 'The app can store thousands of records offline, depending on your device\'s storage capacity. Check Settings > Storage for current usage.'
        },
        {
          question: 'What happens if I clear my browser data?',
          answer: 'All offline data will be lost. Make sure to sync your data regularly when online to prevent data loss.'
        }
      ]
    },
    {
      id: 'sync-data',
      title: 'Data Synchronization',
      icon: <SyncIcon />,
      content: [
        {
          question: 'How do I sync my data?',
          answer: 'Go to the Sync tab and tap "Sync All Records". You can also sync individual records. Syncing requires an internet connection.'
        },
        {
          question: 'What if sync fails?',
          answer: 'Failed records remain in the queue and can be retried. Check your internet connection and try again. Contact support if problems persist.'
        },
        {
          question: 'How often should I sync?',
          answer: 'Sync regularly, preferably daily or whenever you have stable internet connection. This ensures data backup and reduces storage usage.'
        }
      ]
    },
    {
      id: 'photos',
      title: 'Photo Management',
      icon: <CameraIcon />,
      content: [
        {
          question: 'Why can\'t I access the camera?',
          answer: 'Ensure you\'ve granted camera permissions to the app. You can also upload photos from your gallery if camera access isn\'t available.'
        },
        {
          question: 'Are photos stored securely?',
          answer: 'Yes, photos are compressed and encrypted before storage. They\'re only uploaded when you sync the record.'
        },
        {
          question: 'Can I take photos without internet?',
          answer: 'Absolutely! All photos are stored locally and will be synced when internet becomes available.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <HelpIcon />,
      content: [
        {
          question: 'The app is slow or not responding',
          answer: 'Try refreshing the page or clearing the app cache in Settings. If problems persist, check your device\'s available storage.'
        },
        {
          question: 'I lost some data',
          answer: 'Check if the data was synced by going to the Records tab. Unsynced data might be in the Sync tab queue. Contact support for data recovery assistance.'
        },
        {
          question: 'How do I report a bug?',
          answer: 'Use the support contact information below to report bugs. Include details about what you were doing when the issue occurred.'
        }
      ]
    }
  ];

  const quickTips = [
    'Use auto-save to prevent data loss while filling forms',
    'Take clear, well-lit photos for better record quality',
    'Sync regularly to keep your data backed up',
    'Check the storage usage in Settings to manage space',
    'Enable notifications to know when sync is complete'
  ];

  const supportInfo = {
    phone: '+91-9392351645',
    email: 'aritraditya.roy@gmail.com',
    hours: 'Monday to Friday, 9:00 AM - 6:00 PM IST'
  };

  return (
    <Box sx={{ pb: 10 }}>
      {/* Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            <HelpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Help & Support
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find answers to common questions and get help using the Child Health PWA
          </Typography>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Tips
          </Typography>
          <List dense>
            {quickTips.map((tip, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckIcon color="success" />
                </ListItemIcon>
                <ListItemText primary={tip} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* FAQ Sections */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FAQIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Frequently Asked Questions
          </Typography>
          
          {faqData.map((section) => (
            <Accordion
              key={section.id}
              expanded={expandedPanel === section.id}
              onChange={handleAccordionChange(section.id)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {section.icon}
                  <Typography sx={{ ml: 1, fontWeight: 500 }}>
                    {section.title}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {section.content.map((faq, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Q: {faq.question}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      A: {faq.answer}
                    </Typography>
                    {index < section.content.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Feature Guide */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Feature Overview
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <CameraIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Photo Capture
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Take photos using camera or upload from gallery. Photos are automatically compressed and secured.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Offline Storage
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All data is stored locally and encrypted. Works completely offline with automatic sync when online.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <SyncIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Smart Sync
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Intelligent synchronization with retry logic and progress tracking. Sync individual records or all at once.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Security
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Simple authentication, data encryption, and local storage ensure your data is always protected.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* App Installation */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <DownloadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Install as App
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Install this PWA on your device for the best experience!
          </Alert>
          
          <Typography variant="subtitle2" gutterBottom>
            Android/Chrome:
          </Typography>
          <Typography variant="body2" paragraph>
            1. Tap the menu (three dots) in your browser
            <br />
            2. Select "Add to Home Screen" or "Install App"
            <br />
            3. Follow the prompts to install
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            iOS/Safari:
          </Typography>
          <Typography variant="body2" paragraph>
            1. Tap the Share button (square with arrow)
            <br />
            2. Scroll down and tap "Add to Home Screen"
            <br />
            3. Tap "Add" to install
          </Typography>
          
          <Chip
            label="PWA Compatible"
            color="success"
            variant="outlined"
            size="small"
          />
        </CardContent>
      </Card>

      {/* Language Support */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LanguageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Language Support
          </Typography>
          
          <Typography variant="body2" paragraph>
            The app supports multiple languages. Change language in Settings- Appearance.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="English" size="small" />
            <Chip label="हिंदी (Hindi)" size="small" />
            <Chip label="বাংলা (Bengali)" size="small" />
            <Chip label="తెలుగు (Telugu)" size="small" />
            <Chip label="தமிழ் (Tamil)" size="small" />
          </Box>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SupportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Contact Support
          </Typography>
          
          <Typography variant="body2" paragraph>
            Need more help? Our support team is here to assist you.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PhoneIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="body2">{supportInfo.phone}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmailIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="body2">{supportInfo.email}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Support Hours:
                <br />
                {supportInfo.hours}
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" href={`tel:${supportInfo.phone}`}>
              Call Support
            </Button>
            <Button variant="outlined" href={`mailto:${supportInfo.email}`}>
              Email Support
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HelpPage;
