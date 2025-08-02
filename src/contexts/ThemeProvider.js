import React, { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import { useAppContext } from './AppContext';

const CustomThemeProvider = ({ children }) => {
  const { state } = useAppContext();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(() => {
    let mode;
    if (state.settings.theme === 'auto') {
      mode = prefersDarkMode ? 'dark' : 'light';
    } else {
      mode = state.settings.theme;
    }

    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#2196f3',
        },
        secondary: {
          main: '#ff9800',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
    });
  }, [state.settings.theme, prefersDarkMode]);

  return (
    <MuiThemeProvider theme={theme}>
      {children}
    </MuiThemeProvider>
  );
};

export default CustomThemeProvider;