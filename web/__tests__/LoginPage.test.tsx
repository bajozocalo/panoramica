import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../app/auth/login/page';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

// Mock the useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('LoginPage', () => {
  const mockLogin = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockLogin.mockClear();
    mockPush.mockClear();
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('allows a user to log in', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('redirects to the dashboard on successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined); // Simulate successful login
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays an error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Failed to log in'));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to log in/i)).toBeInTheDocument();
    });
  });
});
