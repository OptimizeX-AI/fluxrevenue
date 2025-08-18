import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('renders the login form correctly', () => {
    render(<LoginPage />);

    // Check for the main heading
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();

    // Check for input fields
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Check for the login button
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});
