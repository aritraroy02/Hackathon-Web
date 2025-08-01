import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import App from '../App';
import { AppProvider } from '../contexts/AppContext';

// Mock service worker registration
jest.mock('../utils/serviceWorker', () => ({
  register: jest.fn(),
  unregister: jest.fn(),
}));

// Mock IndexedDB
const mockIDBRequest = {
  onsuccess: null,
  onerror: null,
  result: null,
};

global.indexedDB = {
  open: jest.fn(() => mockIDBRequest),
  deleteDatabase: jest.fn(() => mockIDBRequest),
};

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <AppProvider>
        {component}
      </AppProvider>
    </ThemeProvider>
  );
};

describe('Child Health PWA - Core Functionality', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders app with authentication page when not logged in', () => {
    renderWithProviders(<App />);
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/national id/i)).toBeInTheDocument();
  });

  test('allows user to enter national ID', async () => {
    renderWithProviders(<App />);
    
    const nationalIdInput = screen.getByLabelText(/national id/i);
    
    fireEvent.change(nationalIdInput, { target: { value: '123456789012' } });
    
    expect(nationalIdInput.value).toBe('123456789012');
  });

  test('validates national ID format', async () => {
    renderWithProviders(<App />);
    
    const nationalIdInput = screen.getByLabelText(/national id/i);
    const signInButton = screen.getByRole('button', { name: /send otp/i });
    
    fireEvent.change(nationalIdInput, { target: { value: '123' } });
    fireEvent.click(signInButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid 12-digit national id/i)).toBeInTheDocument();
    });
  });

  test('proceeds to OTP verification with valid national ID', async () => {
    renderWithProviders(<App />);
    
    const nationalIdInput = screen.getByLabelText(/national id/i);
    const signInButton = screen.getByRole('button', { name: /send otp/i });
    
    fireEvent.change(nationalIdInput, { target: { value: '123456789012' } });
    fireEvent.click(signInButton);
    
    await waitFor(() => {
      expect(screen.getByText(/verify otp/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/enter otp/i)).toBeInTheDocument();
    });
  });

  test('completes authentication flow with valid OTP', async () => {
    renderWithProviders(<App />);
    
    // Enter national ID
    const nationalIdInput = screen.getByLabelText(/national id/i);
    fireEvent.change(nationalIdInput, { target: { value: '123456789012' } });
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
    
    // Wait for OTP screen
    await waitFor(() => {
      expect(screen.getByLabelText(/enter otp/i)).toBeInTheDocument();
    });
    
    // Enter OTP
    const otpInput = screen.getByLabelText(/enter otp/i);
    fireEvent.change(otpInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    
    // Should navigate to main app
    await waitFor(() => {
      expect(screen.getByText(/child health records/i)).toBeInTheDocument();
    });
  });

  test('shows offline indicator when offline', () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    renderWithProviders(<App />);
    
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  test('validates form submission without authentication', async () => {
    // Mock authenticated state
    localStorage.setItem('healthApp_user', JSON.stringify({
      nationalId: '123456789012',
      token: 'mock-token',
      name: 'Test User'
    }));

    renderWithProviders(<App />);
    
    // Navigate to form
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add record/i });
      fireEvent.click(addButton);
    });

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/child name is required/i)).toBeInTheDocument();
    });
  });
});

describe('Child Form Validation', () => {
  beforeEach(() => {
    localStorage.setItem('healthApp_user', JSON.stringify({
      nationalId: '123456789012',
      token: 'mock-token',
      name: 'Test User'
    }));
  });

  test('validates required fields', async () => {
    renderWithProviders(<App />);
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add record/i });
      fireEvent.click(addButton);
    });

    const submitButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/child name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument();
      expect(screen.getByText(/gender is required/i)).toBeInTheDocument();
    });
  });

  test('validates age calculation', async () => {
    renderWithProviders(<App />);
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add record/i });
      fireEvent.click(addButton);
    });

    const dateInput = screen.getByLabelText(/date of birth/i);
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    fireEvent.change(dateInput, { 
      target: { value: futureDate.toISOString().split('T')[0] } 
    });
    
    const submitButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/date of birth cannot be in the future/i)).toBeInTheDocument();
    });
  });

  test('validates weight and height inputs', async () => {
    renderWithProviders(<App />);
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add record/i });
      fireEvent.click(addButton);
    });

    const weightInput = screen.getByLabelText(/weight/i);
    const heightInput = screen.getByLabelText(/height/i);
    
    fireEvent.change(weightInput, { target: { value: '-5' } });
    fireEvent.change(heightInput, { target: { value: '0' } });
    
    const submitButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/weight must be positive/i)).toBeInTheDocument();
      expect(screen.getByText(/height must be positive/i)).toBeInTheDocument();
    });
  });
});

describe('Offline Functionality', () => {
  test('stores data locally when offline', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    localStorage.setItem('healthApp_user', JSON.stringify({
      nationalId: '123456789012',
      token: 'mock-token',
      name: 'Test User'
    }));

    renderWithProviders(<App />);
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add record/i });
      fireEvent.click(addButton);
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/child name/i), { 
      target: { value: 'Test Child' } 
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { 
      target: { value: '2023-01-01' } 
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/record saved locally/i)).toBeInTheDocument();
    });
  });
});

describe('PWA Features', () => {
  test('shows install prompt when available', () => {
    // Mock beforeinstallprompt event
    const mockEvent = {
      preventDefault: jest.fn(),
      prompt: jest.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    window.dispatchEvent(new CustomEvent('beforeinstallprompt', mockEvent));
    
    renderWithProviders(<App />);
    
    expect(screen.getByText(/install app/i)).toBeInTheDocument();
  });

  test('handles service worker updates', () => {
    // Mock service worker update event
    const mockRegistration = {
      waiting: {
        postMessage: jest.fn(),
      },
    };

    window.dispatchEvent(new CustomEvent('swUpdated', { 
      detail: mockRegistration 
    }));
    
    renderWithProviders(<App />);
    
    expect(screen.getByText(/app update available/i)).toBeInTheDocument();
  });
});

describe('Language Support', () => {
  test('changes language preference', async () => {
    localStorage.setItem('healthApp_user', JSON.stringify({
      nationalId: '123456789012',
      token: 'mock-token',
      name: 'Test User'
    }));

    renderWithProviders(<App />);
    
    // Navigate to settings
    await waitFor(() => {
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
    });

    // Change language
    const languageSelect = screen.getByLabelText(/language/i);
    fireEvent.change(languageSelect, { target: { value: 'hi' } });
    
    await waitFor(() => {
      expect(screen.getByText(/भाषा/)).toBeInTheDocument();
    });
  });
});

describe('Data Security', () => {
  test('encrypts sensitive data before storage', () => {
    // This would test the encryption utility
    const { encrypt, decrypt } = require('../utils/database');
    
    const testData = { name: 'Test Child', dob: '2023-01-01' };
    const encrypted = encrypt(JSON.stringify(testData));
    const decrypted = JSON.parse(decrypt(encrypted));
    
    expect(encrypted).not.toBe(JSON.stringify(testData));
    expect(decrypted).toEqual(testData);
  });

  test('clears sensitive data on logout', async () => {
    localStorage.setItem('healthApp_user', JSON.stringify({
      nationalId: '123456789012',
      token: 'mock-token',
      name: 'Test User'
    }));

    renderWithProviders(<App />);
    
    // Navigate to settings and logout
    await waitFor(() => {
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(localStorage.getItem('healthApp_user')).toBeNull();
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });
});
