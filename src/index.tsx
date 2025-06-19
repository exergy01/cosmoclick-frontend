import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { AppProvider } from './context/AppProvider';
import StartPage from './pages/StartPage';

// Простой тест MainPage
const SimpleMainPage = () => {
  return React.createElement('div', {style: {padding: '20px', textAlign: 'center'}},
    React.createElement('h1', {style: {color: 'green', fontSize: '30px'}}, 'MAIN PAGE WORKS!'),
    React.createElement('p', {}, 'Игра загружена успешно! 🎮'),
    React.createElement('p', {}, 'Скоро здесь будет система TON стейкинга'),
    React.createElement('a', {href: '/start', style: {color: 'blue'}}, 'Назад на StartPage')
  );
};

const AppContent = () => {
  return React.createElement(Routes, {},
    // 🔥 ИСПРАВЛЕНО: StartPage как главная страница
    React.createElement(Route, {path: '/', element: React.createElement(StartPage)}),
    React.createElement(Route, {path: '/main', element: React.createElement(SimpleMainPage)})
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