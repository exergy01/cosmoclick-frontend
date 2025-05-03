import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuestsPage from './pages/QuestsPage';
import ExchangePage from './pages/ExchangePage';
import WalletPage from './pages/WalletPage';
import ReferralPage from './pages/ReferralPage';
import { PlayerProvider } from './context/PlayerContext';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

const App: React.FC = () => {
  return (
    <TonConnectUIProvider manifestUrl="https://cosmoclick-frontend.vercel.app/tonconnect-manifest.json">
      <PlayerProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quests" element={<QuestsPage />} />
            <Route path="/exchange" element={<ExchangePage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/referrals" element={<ReferralPage />} />
          </Routes>
        </Router>
      </PlayerProvider>
    </TonConnectUIProvider>
  );
};

export default App;