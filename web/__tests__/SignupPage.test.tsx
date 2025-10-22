import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '../app/auth/signup/page';
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

describe('SignupPage', () => {
  const mockSignup = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      signup: mockSignup,
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockSignup.mockClear();
    mockPush.mockClear();
  });

  it('renders the signup form', () => {
    render(<SignupPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('allows a user to sign up', async () => {
    render(<SignupPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signupButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('newuser@example.com', 'newpassword123');
    });
  });

  it('redirects to the dashboard on successful signup', async () => {
    mockSignup.mockResolvedValueOnce(undefined); // Simulate successful signup
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'newuser@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays a generic error message on failed signup', async () => {
    mockSignup.mockRejectedValueOnce(new Error('Failed to create an account'));
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create an account/i)).toBeInTheDocument();
    });
  });

  it('displays a specific error for email already in use', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/this email is already in use/i)).toBeInTheDocument();
    });
  });
});
