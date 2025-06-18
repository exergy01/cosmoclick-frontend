import React from 'react';
import ReactDOM from 'react-dom/client';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(React.createElement('h1', {style: {color: 'red', fontSize: '50px'}}, 'TEST WORKS!'));