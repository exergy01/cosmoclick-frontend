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
import { PlayerProvider } from './context/PlayerContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const MIN_START_PAGE_TIME = 6000; // 6 секунд

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
          {showStartPage ? <StartPage /> : (
            <Router>
              <AppWithQuery />
            </Router>
          )}
        </PlayerProvider>
      </QueryClientProvider>
    </TonConnectUIProvider>
  );
};

export default App;