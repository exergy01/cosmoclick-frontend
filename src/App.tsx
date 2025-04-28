import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuestsPage from './pages/QuestsPage'; // обязательно добавлен

const App: React.FC = () => {
  return (
    <Router> {/* Весь проект обёрнут в Router */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quests" element={<QuestsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
