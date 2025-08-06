import React, { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { useAppContext } from './AppContext';

const CustomThemeProvider = ({ children }) => {
  const { state } = useAppContext();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(() => {
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
          main: mode === 'dark' ? '#90caf9' : '#2196f3',
          light: mode === 'dark' ? '#bbdefb' : '#64b5f6',
          dark: mode === 'dark' ? '#42a5f5' : '#1976d2',
          contrastText: mode === 'dark' ? '#000000' : '#ffffff',
        },
        secondary: {
          main: mode === 'dark' ? '#ffb74d' : '#ff9800',
          light: mode === 'dark' ? '#ffc947' : '#ffb74d',
          dark: mode === 'dark' ? '#ff8f00' : '#f57c00',
          contrastText: mode === 'dark' ? '#000000' : '#ffffff',
        },
        background: {
          default: mode === 'dark' ? '#121212' : '#f5f5f5',
          paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
        text: {
          primary: mode === 'dark' ? '#ffffff' : '#000000',
          secondary: mode === 'dark' ? '#b0b0b0' : '#666666',
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
          contrastText: mode === 'dark' ? '#000000' : '#ffffff',
        },
        info: {
          main: mode === 'dark' ? '#64b5f6' : '#2196f3',
          light: mode === 'dark' ? '#90caf9' : '#64b5f6',
          dark: mode === 'dark' ? '#2196f3' : '#1976d2',
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
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
          fontSize: '2.5rem',
          fontWeight: 700,
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 600,
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 600,
        },
        h4: {
          fontSize: '1.5rem',
          fontWeight: 600,
        },
        h5: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
        h6: {
          fontSize: '1.125rem',
          fontWeight: 600,
        },
        body1: {
          fontSize: '1rem',
          lineHeight: 1.6,
        },
        body2: {
          fontSize: '0.875rem',
          lineHeight: 1.5,
        },
      },
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              boxShadow: mode === 'dark' 
                ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                : '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: mode === 'dark' 
                  ? '0 8px 20px rgba(0, 0, 0, 0.4)' 
                  : '0 8px 20px rgba(0, 0, 0, 0.15)',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              textTransform: 'none',
              fontWeight: 600,
              padding: '10px 24px',
              transition: 'all 0.2s ease-in-out',
            },
            contained: {
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: mode === 'dark'
                ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: '0 0 20px 20px',
              boxShadow: mode === 'dark'
                ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                : '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            },
          },
        },
        MuiBottomNavigation: {
          styleOverrides: {
            root: {
              borderTop: `1px solid ${mode === 'dark' ? '#333' : '#e0e0e0'}`,
              backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            },
          },
        },
      },
      shape: {
        borderRadius: 12,
      },
    });
  }, [state?.settings?.theme, prefersDarkMode]); // Only depend on theme setting

  return (
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  );
};

export default CustomThemeProvider;
