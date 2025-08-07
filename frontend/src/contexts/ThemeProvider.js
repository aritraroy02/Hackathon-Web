import React, { useMemo, useEffect } from 'react';
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
          main: mode === 'dark' ? '#2196f3' : '#1976d2', // Crisp blue
          light: mode === 'dark' ? '#64b5f6' : '#42a5f5',
          dark: mode === 'dark' ? '#1976d2' : '#1565c0',
          contrastText: '#ffffff',
        },
        secondary: {
          main: mode === 'dark' ? '#f5f5f5' : '#757575', // Clean gray/white
          light: mode === 'dark' ? '#ffffff' : '#9e9e9e',
          dark: mode === 'dark' ? '#e0e0e0' : '#616161',
          contrastText: mode === 'dark' ? '#000000' : '#ffffff',
        },
        background: {
          default: mode === 'dark' ? '#000000' : '#fafafa', // Pure black background
          paper: mode === 'dark' ? '#121212' : '#ffffff', // Very dark gray for cards
        },
        text: {
          primary: mode === 'dark' ? '#ffffff' : '#212121', // Pure white text on dark
          secondary: mode === 'dark' ? '#e0e0e0' : '#757575', // Light gray secondary text
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
          contrastText: '#ffffff',
        },
        info: {
          main: mode === 'dark' ? '#29b6f6' : '#0288d1',
          light: mode === 'dark' ? '#4fc3f7' : '#03a9f4',
          dark: mode === 'dark' ? '#0277bd' : '#01579b',
          contrastText: '#ffffff',
        },
        success: {
          main: '#4caf50',
          light: '#81c784',
          dark: '#388e3c',
          contrastText: '#ffffff',
        },
        divider: mode === 'dark' ? '#333333' : '#e0e0e0', // Dark theme dividers
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
                ? '0 8px 24px rgba(0, 0, 0, 0.8)' 
                : '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
              border: mode === 'dark' ? '1px solid #333333' : 'none',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: mode === 'dark' 
                  ? '0 12px 32px rgba(0, 0, 0, 0.9)' 
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
              boxShadow: mode === 'dark' 
                ? '0 4px 12px rgba(33, 150, 243, 0.3)' 
                : '0 4px 8px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: mode === 'dark' 
                  ? '0 8px 20px rgba(33, 150, 243, 0.4)' 
                  : '0 6px 12px rgba(0, 0, 0, 0.3)',
              },
            },
            outlined: {
              borderColor: mode === 'dark' ? '#333333' : undefined,
              color: mode === 'dark' ? '#ffffff' : undefined,
              '&:hover': {
                borderColor: mode === 'dark' ? '#2196f3' : undefined,
                backgroundColor: mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : undefined,
              },
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
                '& fieldset': {
                  borderColor: mode === 'dark' ? '#333333' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'dark' ? '#555555' : '#bdbdbd',
                },
                '&.Mui-focused fieldset': {
                  borderColor: mode === 'dark' ? '#2196f3' : '#1976d2',
                },
              },
              '& .MuiInputLabel-root': {
                color: mode === 'dark' ? '#e0e0e0' : '#757575',
              },
              '& .MuiOutlinedInput-input': {
                color: mode === 'dark' ? '#ffffff' : '#212121',
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#1976d2' : '#1976d2',
              backgroundImage: 'none',
              boxShadow: mode === 'dark'
                ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                : '0 2px 8px rgba(0, 0, 0, 0.1)',
            },
          },
        },
        MuiBottomNavigation: {
          styleOverrides: {
            root: {
              borderTop: `1px solid ${mode === 'dark' ? '#333333' : '#e0e0e0'}`,
              backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
            },
          },
        },
        MuiTypography: {
          styleOverrides: {
            root: {
              color: mode === 'dark' ? '#ffffff' : undefined,
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#333333' : '#e0e0e0',
              color: mode === 'dark' ? '#ffffff' : '#212121',
              '&.MuiChip-colorPrimary': {
                backgroundColor: mode === 'dark' ? '#2196f3' : '#1976d2',
                color: '#ffffff',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
              color: mode === 'dark' ? '#ffffff' : '#212121',
            },
          },
        },
      },
      shape: {
        borderRadius: 12,
      },
    });
  }, [state?.settings?.theme, prefersDarkMode]); // Only depend on theme setting

  // Set the data-theme attribute on document root for CSS variables
  useEffect(() => {
    let mode;
    const themeMode = state?.settings?.theme || 'light';
    
    if (themeMode === 'auto') {
      mode = prefersDarkMode ? 'dark' : 'light';
    } else {
      mode = themeMode;
    }
    
    document.documentElement.setAttribute('data-theme', mode);
  }, [state?.settings?.theme, prefersDarkMode]);

  return (
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  );
};

export default CustomThemeProvider;
