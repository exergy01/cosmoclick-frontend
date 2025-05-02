import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuestsPage from './pages/QuestsPage';
import ExchangePage from './pages/ExchangePage';
import { PlayerProvider } from './context/PlayerContext';

const App: React.FC = () => {
  return (
    <PlayerProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quests" element={<QuestsPage />} />
          <Route path="/exchange" element={<ExchangePage />} />
        </Routes>
      </Router>
    </PlayerProvider>
  );
};

export default App;
