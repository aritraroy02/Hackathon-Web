import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography
} from '@mui/material';
import {
  Language as LanguageIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../contexts/AppContext';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

const LanguageSelector = ({ variant = 'standard', showIcon = true, showLabel = true }) => {
  const { i18n, t } = useTranslation();
  const { showNotification } = useAppContext();

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
    
    // Show notification about language change
    const languageName = languages.find(lang => lang.code === newLanguage)?.name || newLanguage;
    showNotification(t('notifications.language_changed'), 'success');
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  if (variant === 'compact') {
    return (
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <Select
          value={i18n.language}
          onChange={handleLanguageChange}
          displayEmpty
          renderValue={(selected) => {
            const selectedLang = languages.find(lang => lang.code === selected);
            if (!selectedLang) return '';
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{selectedLang.flag}</span>
                <Typography variant="body2">{selectedLang.name}</Typography>
              </Box>
            );
          }}
          sx={{
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1
            }
          }}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <span>{language.flag}</span>
                <Typography variant="body2" sx={{ flexGrow: 1 }}>{language.name}</Typography>
                {i18n.language === language.code && (
                  <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <FormControl fullWidth sx={{ maxWidth: 400 }}>
      {showLabel && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {showIcon && <LanguageIcon />}
          <Typography variant="subtitle2">{t('settings.language')}</Typography>
        </Box>
      )}
      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        displayEmpty
        renderValue={(selected) => {
          const selectedLang = languages.find(lang => lang.code === selected);
          if (!selectedLang) return '';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{selectedLang.flag}</span>
              <Typography variant="body1">{selectedLang.name}</Typography>
            </Box>
          );
        }}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1.5
          }
        }}
      >
        {languages.map((language) => (
          <MenuItem key={language.code} value={language.code}>
            <ListItemIcon sx={{ minWidth: 'auto', mr: 2 }}>
              <span style={{ fontSize: '1.2em' }}>{language.flag}</span>
            </ListItemIcon>
            <ListItemText 
              primary={language.name}
              secondary={language.code.toUpperCase()}
              sx={{ flexGrow: 1 }}
            />
            {i18n.language === language.code && (
              <CheckIcon sx={{ color: 'primary.main', ml: 1 }} />
            )}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LanguageSelector;
