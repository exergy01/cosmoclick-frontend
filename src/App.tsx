import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuestsPage from './pages/QuestsPage';
import { PlayerProvider } from './context/PlayerContext'; // добавим импорт

const App: React.FC = () => {
  return (
    <PlayerProvider> {/* Добавили обёртку */}
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quests" element={<QuestsPage />} />
        </Routes>
      </Router>
    </PlayerProvider>
  );
};

export default App;
