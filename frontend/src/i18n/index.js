import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import hiTranslations from './locales/hi.json';
import zhTranslations from './locales/zh.json';

const resources = {
  en: {
    translation: enTranslations
  },
  es: {
    translation: esTranslations
  },
  fr: {
    translation: frTranslations
  },
  hi: {
    translation: hiTranslations
  },
  zh: {
    translation: zhTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;
