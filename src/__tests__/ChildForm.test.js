import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ChildForm from '../components/ChildForm';
import { AppProvider } from '../contexts/AppContext';

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

describe('ChildForm Component', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all required form fields', () => {
    renderWithProviders(
      <ChildForm onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    // Check for essential form fields
    expect(screen.getByLabelText(/child name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/weight/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/father's name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mother's name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
  });

  test('validates required fields on submission', async () => {
    renderWithProviders(
      <ChildForm onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    const submitButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/child name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('calculates age correctly from date of birth', async () => {
    renderWithProviders(
      <ChildForm onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    const dateInput = screen.getByLabelText(/date of birth/i);
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 2); // 2 years ago

    fireEvent.change(dateInput, {
      target: { value: birthDate.toISOString().split('T')[0] }
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(/2/)).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    renderWithProviders(
      <ChildForm onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/child name/i), {
      target: { value: 'Test Child' }
    });
    
    const birthDate = new Date('2022-01-01');
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: birthDate.toISOString().split('T')[0] }
    });

    fireEvent.change(screen.getByLabelText(/gender/i), {
      target: { value: 'Male' }
    });

    fireEvent.change(screen.getByLabelText(/weight/i), {
      target: { value: '12.5' }
    });

    fireEvent.change(screen.getByLabelText(/height/i), {
      target: { value: '85' }
    });

    fireEvent.change(screen.getByLabelText(/father's name/i), {
      target: { value: 'John Doe' }
    });

    fireEvent.change(screen.getByLabelText(/mother's name/i), {
      target: { value: 'Jane Doe' }
    });

    fireEvent.change(screen.getByLabelText(/address/i), {
      target: { value: '123 Main St' }
    });

    const submitButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          childName: 'Test Child',
          gender: 'Male',
          weight: 12.5,
          height: 85,
          fatherName: 'John Doe',
          motherName: 'Jane Doe',
          address: '123 Main St'
        })
      );
    });
  });

  test('handles photo capture', async () => {
    renderWithProviders(
      <ChildForm onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    const photoButton = screen.getByRole('button', { name: /take photo/i });
    fireEvent.click(photoButton);

    await waitFor(() => {
      expect(screen.getByText(/camera/i)).toBeInTheDocument();
    });
  });

  test('validates weight and height ranges', async () => {
    renderWithProviders(
      <ChildForm onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    // Test negative weight
    fireEvent.change(screen.getByLabelText(/weight/i), {
      target: { value: '-5' }
    });

    // Test zero height
    fireEvent.change(screen.getByLabelText(/height/i), {
      target: { value: '0' }
    });

    const submitButton = screen.getByRole('button', { name: /save record/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/weight must be positive/i)).toBeInTheDocument();
      expect(screen.getByText(/height must be positive/i)).toBeInTheDocument();
    });
  });

  test('handles cancel action', () => {
    renderWithProviders(
      <ChildForm onSave={mockOnSave} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('populates form when editing existing record', () => {
    const existingRecord = {
      id: '123',
      childName: 'Existing Child',
      dateOfBirth: '2022-01-01',
      gender: 'Female',
      weight: 15,
      height: 90,
      fatherName: 'Father Name',
      motherName: 'Mother Name',
      address: '456 Oak St'
    };

    renderWithProviders(
      <ChildForm 
        record={existingRecord}
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByDisplayValue('Existing Child')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Female')).toBeInTheDocument();
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('90')).toBeInTheDocument();
  });
});
