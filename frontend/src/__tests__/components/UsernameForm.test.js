import React from 'react';
import { render, screen } from '@testing-library/react';
import UsernameForm from '../../components/UsernameForm';

test('renders welcome message', () => {
  render(<UsernameForm handleSetUsername={() => {}} />);
  const welcomeMessage = screen.getByText(/Bienvenue !/i);
  expect(welcomeMessage).toBeInTheDocument();
});