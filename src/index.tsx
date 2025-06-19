import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { AppProvider } from './context/AppProvider';

const App = () => {
  return React.createElement('div', {}, 
    React.createElement('h1', {style: {color: 'purple', fontSize: '40px'}}, 'CONTEXT TEST WORKS!')
  );
};

const AppWithAll = () => {
  return React.createElement(AppProvider, null, 
    React.createElement(I18nextProvider, {i18n}, 
      React.createElement(Router, {}, 
        React.createElement(App)
      )
    )
  );
};

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(React.createElement(AppWithAll));