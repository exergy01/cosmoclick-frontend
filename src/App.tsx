import React, { useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from './context/PlayerContext';
import MainPage from './pages/MainPage';
import ShopPage from './pages/ShopPage';
import StartPage from './pages/StartPage';
import AttackPage from './pages/AttackPage';
import ExchangePage from './pages/ExchangePage';
import QuestsPage from './pages/QuestsPage';
import GamesPage from './pages/GamesPage';
import WalletPage from './pages/WalletPage';
import ReferralsPage from './pages/ReferralsPage';
import AlphabetPage from './pages/AlphabetPage';

const App: React.FC = () => {
  const { player, loading, error, fetchInitialData } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!player && !loading && !error && location.pathname !== '/start') {
      fetchInitialData();
    }
    if (error) {
      navigate('/start', { replace: true });
    }
    if (!player && !loading && location.pathname !== '/start') {
      navigate('/start', { replace: true });
    }
  }, [player, loading, error, fetchInitialData, navigate, location.pathname]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/start" element={<StartPage />} />
        <Route path="/attack" element={<AttackPage />} />
        <Route path="/exchange" element={<ExchangePage />} />
        <Route path="/quests" element={<QuestsPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/ref" element={<ReferralsPage />} />
        <Route path="/alphabet" element={<AlphabetPage />} />
      </Routes>
    </Suspense>
  );
};

export default App;