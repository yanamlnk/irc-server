import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders App component', () => {
  render(<App />);
  const appElement = screen.getByText(/Bienvenue !/i);
  expect(appElement).toBeInTheDocument();
});