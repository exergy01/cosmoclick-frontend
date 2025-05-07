import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuestsPage from './pages/QuestsPage';
import ExchangePage from './pages/ExchangePage';
import WalletPage from './pages/WalletPage';
import ReferralPage from './pages/ReferralPage';
import ShopPage from './pages/ShopPage';
import AlphabetPage from './pages/AlphabetPage';
import StartPage from './pages/StartPage';
import { PlayerProvider } from '../context/PlayerContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const MIN_START_PAGE_TIME = 5000; // 5 секунд

const AppWithQuery = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const tab = query.get('tab') || 'resources';

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/quests" element={<QuestsPage />} />
      <Route path="/exchange" element={<ExchangePage />} />
      <Route path="/wallet" element={<WalletPage />} />
      <Route path="/referrals" element={<ReferralPage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/alphabet" element={<AlphabetPage />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [showStartPage, setShowStartPage] = useState(true);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStartPage(false);
    }, MIN_START_PAGE_TIME);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TonConnectUIProvider manifestUrl="https://cosmoclick-frontend.vercel.app/tonconnect-manifest.json">
      <QueryClientProvider client={queryClient}>
        <PlayerProvider>
          {isPortrait ? (
            showStartPage ? <StartPage /> : (
              <Router>
                <AppWithQuery />
              </Router>
            )
          ) : (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: '#000022',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              color: '#00f0ff',
              fontFamily: 'Arial, sans-serif',
              fontSize: '1.5rem',
              textShadow: '0 0 5px #00f0ff',
              zIndex: 9999,
            }}>
              Пожалуйста, поверните устройство в вертикальное положение
            </div>
          )}
        </PlayerProvider>
      </QueryClientProvider>
    </TonConnectUIProvider>
  );
};

export default App;