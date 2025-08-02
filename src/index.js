import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import CustomThemeProvider from './contexts/ThemeProvider';
import { initializeDatabase } from './utils/database';
import { registerSW } from './utils/serviceWorker';
import './index.css';

// Initialize the application
const initializeApp = async () => {
  try {
    // Initialize IndexedDB
    await initializeDatabase();
    
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      await registerSW();
    }
    
    // Hide loading screen
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Render the React app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <AppProvider>
            <CustomThemeProvider>
              <CssBaseline />
              <App />
            </CustomThemeProvider>
          </AppProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show error message
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div style="text-align: center; color: white;">
          <h2>Failed to Load</h2>
          <p>Please refresh the page and try again.</p>
          <button onclick="window.location.reload()" 
                  style="padding: 10px 20px; background: white; color: #2196f3; border: none; border-radius: 5px; cursor: pointer;">
            Refresh
          </button>
        </div>
      `;
    }
  }
};

// Start the application
initializeApp();
