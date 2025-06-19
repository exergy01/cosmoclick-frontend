import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { AppProvider } from './context/AppProvider';
import StartPage from './pages/StartPage';
import MainPage from './pages/MainPage'; // 🔥 ДОБАВЛЯЕМ

const AppContent = () => {
  return React.createElement(Routes, {},
    React.createElement(Route, {path: '/', element: React.createElement(MainPage)}), // 🔥 ЗАМЕНЯЕМ тест на MainPage
    React.createElement(Route, {path: '/start', element: React.createElement(StartPage)})
  );
};

const AppWithAll = () => {
  return React.createElement(AppProvider, null, 
    React.createElement(I18nextProvider, {i18n}, 
      React.createElement(Router, {}, 
        React.createElement(AppContent)
      )
    )
  );
};

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(React.createElement(AppWithAll));