import React, { useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import { useNewPlayer } from './context/NewPlayerContext';
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

// Компонент для логики приложения (внутри провайдеров)
const AppContent: React.FC = () => {
  const { player, loading, error, fetchInitialData } = useNewPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  // Инициализация Telegram Web App
  useEffect(() => {
    if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.ready();
      console.log('Telegram Web App initialized');
      console.log('Telegram data:', (window as any).Telegram.WebApp.initDataUnsafe);
    } else {
      console.log('Telegram Web App not available');
    }
  }, []);

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

// Главный компонент приложения
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;