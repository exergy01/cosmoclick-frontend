import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

const App = () => {
  return React.createElement('div', {}, 
    React.createElement('h1', {style: {color: 'green', fontSize: '40px'}}, 'ROUTER TEST WORKS!')
  );
};

const AppWithRouter = () => {
  return React.createElement(Router, {}, React.createElement(App));
};

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(React.createElement(AppWithRouter));