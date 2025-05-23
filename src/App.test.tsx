import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

test('renders start page', () => {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/start']}>
        <App />
      </MemoryRouter>
    </I18nextProvider>
  );
  const loadingElement = screen.getByText(/loading/i);
  expect(loadingElement).toBeInTheDocument();
});