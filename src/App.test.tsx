import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

test('renders app without crashing', () => {
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </I18nextProvider>
  );
});