import React, { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from './AppContext';

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { showNotification } = useAppContext();

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      
      // Get language name for notification
      const languageNames = {
        en: 'English',
        es: 'Español',
        fr: 'Français',
        hi: 'हिंदी',
        zh: '中文'
      };
      
      const languageName = languageNames[languageCode] || languageCode;
      showNotification(`Language changed to ${languageName}`, 'success');
    } catch (error) {
      showNotification('Failed to change language', 'error');
      console.error('Language change error:', error);
    }
  };

  const value = {
    changeLanguage,
    currentLanguage: i18n.language,
    languages: [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
      { code: 'zh', name: '中文', flag: '🇨🇳' }
    ]
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
