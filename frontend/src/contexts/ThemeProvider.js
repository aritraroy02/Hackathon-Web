import React, { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { useAppContext } from './AppContext';

const CustomThemeProvider = ({ children }) => {
  const { state } = useAppContext();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(() => {
    // Don't create theme until state is initialized
    if (!state) {
      return createTheme(); // Return default theme
    }
    let mode;
    const themeMode = state?.settings?.theme || 'light';
    
    if (themeMode === 'auto') {
      mode = prefersDarkMode ? 'dark' : 'light';
    } else {
      mode = themeMode;
    }

    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#2196f3',
          light: '#64b5f6',
          dark: '#1976d2',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#ff9800',
          light: '#ffb74d',
          dark: '#f57c00',
          contrastText: '#000000',
        },
        error: {
          main: '#f44336',
          light: '#e57373',
          dark: '#d32f2f',
          contrastText: '#ffffff',
        },
        warning: {
          main: '#ff9800',
          light: '#ffb74d',
          dark: '#f57c00',
          contrastText: '#000000',
        },
        info: {
          main: '#2196f3',
          light: '#64b5f6',
          dark: '#1976d2',
          contrastText: '#ffffff',
        },
        success: {
          main: '#4caf50',
          light: '#81c784',
          dark: '#388e3c',
          contrastText: '#ffffff',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
    });
  }, [state?.settings?.theme, prefersDarkMode]);

  // Don't render until state is initialized
  if (!state) {
    return null;
  }

  return (
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  );
};

export default CustomThemeProvider;