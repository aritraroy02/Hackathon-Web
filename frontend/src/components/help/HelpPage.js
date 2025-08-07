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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [expandedPanel, setExpandedPanel] = useState('getting-started');

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : false);
  };

  const faqData = [
    {
      id: 'getting-started',
      title: t('help.getting_started'),
      icon: <GuideIcon />,
      content: [
        {
          question: t('help.how_register_child'),
          answer: t('help.register_child_answer')
        },
        {
          question: t('help.what_health_id'),
          answer: t('help.health_id_answer')
        },
        {
          question: t('help.need_internet'),
          answer: t('help.internet_answer')
        }
      ]
    },
    {
      id: 'authentication',
      title: t('help.authentication_security'),
      icon: <SecurityIcon />,
      content: [
        {
          question: t('help.how_authentication_works'),
          answer: t('help.authentication_answer')
        },
        {
          question: t('help.is_data_secure'),
          answer: t('help.data_secure_answer')
        },
        {
          question: t('help.forgot_credentials'),
          answer: t('help.forgot_credentials_answer')
        }
      ]
    },
    {
      id: 'offline-usage',
      title: t('help.offline_usage'),
      icon: <StorageIcon />,
      content: [
        {
          question: t('help.how_offline_works'),
          answer: t('help.offline_works_answer')
        },
        {
          question: t('help.how_much_storage'),
          answer: t('help.storage_capacity_answer')
        },
        {
          question: t('help.clear_browser_data'),
          answer: t('help.clear_data_answer')
        }
      ]
    },
    {
      id: 'sync-data',
      title: t('help.data_synchronization'),
      icon: <SyncIcon />,
      content: [
        {
          question: t('help.how_sync_data'),
          answer: t('help.sync_data_answer')
        },
        {
          question: t('help.sync_fails'),
          answer: t('help.sync_fails_answer')
        },
        {
          question: t('help.how_often_sync'),
          answer: t('help.sync_frequency_answer')
        }
      ]
    },
    {
      id: 'photos',
      title: t('help.photo_management'),
      icon: <CameraIcon />,
      content: [
        {
          question: t('help.camera_access_issue'),
          answer: t('help.camera_access_answer')
        },
        {
          question: t('help.photos_secure'),
          answer: t('help.photos_secure_answer')
        },
        {
          question: t('help.photos_without_internet'),
          answer: t('help.photos_offline_answer')
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: t('help.troubleshooting'),
      icon: <HelpIcon />,
      content: [
        {
          question: t('help.app_slow'),
          answer: t('help.app_slow_answer')
        },
        {
          question: t('help.lost_data'),
          answer: t('help.lost_data_answer')
        },
        {
          question: t('help.report_bug'),
          answer: t('help.report_bug_answer')
        }
      ]
    }
  ];

  const quickTips = [
    t('help.tip_auto_save'),
    t('help.tip_clear_photos'),
    t('help.tip_sync_regularly'),
    t('help.tip_check_storage'),
    t('help.tip_enable_notifications')
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
            {t('help.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('help.subtitle')}
          </Typography>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {t('help.quick_tips')}
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
            {t('help.faq')}
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
            {t('help.feature_overview')}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main'
                  }
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  <CameraIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                  {t('help.photo_capture')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('help.photo_capture_desc')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'secondary.main'
                  }
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  <StorageIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'secondary.main' }} />
                  {t('help.offline_storage')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('help.offline_storage_desc')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'info.main'
                  }
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  <SyncIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'info.main' }} />
                  {t('help.smart_sync')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('help.smart_sync_desc')}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'success.main'
                  }
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                  {t('help.security')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('help.security_desc')}
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
            {t('help.install_app')}
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('help.install_pwa_info')}
          </Alert>
          
          <Typography variant="subtitle2" gutterBottom>
            {t('help.android_chrome')}
          </Typography>
          <Typography variant="body2" paragraph>
            {t('help.android_instructions')}
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            {t('help.ios_safari')}
          </Typography>
          <Typography variant="body2" paragraph>
            {t('help.ios_instructions')}
          </Typography>
          
          <Chip
            label={t('help.pwa_compatible')}
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
            {t('help.language_support')}
          </Typography>
          
          <Typography variant="body2" paragraph>
            {t('help.language_change_info')}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="English" size="small" />
            <Chip label="हिंदी (Hindi)" size="small" />
            <Chip label="Español (Spanish)" size="small" />
            <Chip label="Français (French)" size="small" />
            <Chip label="中文 (Chinese)" size="small" />
          </Box>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <SupportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('help.contact')}
          </Typography>
          
          <Typography variant="body2" paragraph>
            {t('help.contact_support_info')}
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
                {t('help.support_hours')}
                <br />
                {supportInfo.hours}
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" href={`tel:${supportInfo.phone}`}>
              {t('help.call_support')}
            </Button>
            <Button variant="outlined" href={`mailto:${supportInfo.email}`}>
              {t('help.email_support')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HelpPage;
