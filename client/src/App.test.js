import { render, screen } from '@testing-library/react';
import App from './App';

test('renderiza el formulario de inicio de sesión por defecto', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { level: 2, name: /iniciar sesión/i });
  expect(heading).toBeInTheDocument();
});
