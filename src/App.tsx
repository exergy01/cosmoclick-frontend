import React, { useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react';
import { AppProvider } from './context/AppProvider';
import { useNewPlayer } from './context/NewPlayerContext';
import MainPage from './pages/MainPage';
import ShopPage from './pages/ShopPage';
import StartPage from './pages/StartPage';
import AttackPage from './pages/AttackPage';
import ExchangePage from './pages/ExchangePage';
import QuestsPage from './pages/QuestsPage';
import GamesPage from './pages/GamesPage';
import WalletPage from './pages/wallet/WalletPage';
import ReferralsPage from './pages/ReferralsPage';
import AlphabetPage from './pages/AlphabetPage';

// 🔧 МОДУЛЬНАЯ АДМИНСКАЯ ПАНЕЛЬ - импортируем из новой структуры
import AdminPage from './pages/admin';

// Импортируем все доступные игры
import TapperGame from './pages/games/TapperGame';
import CosmicShellsGame from './pages/games/cosmic-shells';
import GalacticSlotsGame from './pages/games/galactic-slots';

// URL для manifest.json TON Connect
const MANIFEST_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com/tonconnect-manifest.json'
  : 'http://localhost:5000/tonconnect-manifest.json';

// Конфигурация возврата в приложение
const TWA_RETURN_URL = 'https://t.me/CosmoClickBot/cosmoclick';

// Компонент для логики приложения (внутри провайдеров)
const AppContent: React.FC = () => {
  const { player, loading, error, fetchInitialData } = useNewPlayer();
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
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px', animation: 'pulse 2s infinite' }}>🔧</div>
          <div style={{ fontSize: '1.2rem' }}>Загрузка CosmoClick...</div>
        </div>
      </div>
    }>
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
        
        {/* 🔧 МОДУЛЬНАЯ АДМИНСКАЯ ПАНЕЛЬ - теперь импорт из pages/admin */}
        <Route path="/admin" element={<AdminPage />} />
        
        {/* Роуты игр - все доступные игры */}
        <Route path="/games/tapper" element={<TapperGame />} />
        <Route path="/games/cosmic-shells" element={<CosmicShellsGame />} />
        <Route path="/games/galactic-slots" element={<GalacticSlotsGame />} />
      </Routes>
    </Suspense>
  );
};

// Главный компонент приложения с TON Connect
const App: React.FC = () => {
  return (
    <TonConnectUIProvider
      manifestUrl={MANIFEST_URL}
      uiPreferences={{ 
        theme: THEME.DARK,
        borderRadius: 'm'
      }}
      walletsListConfiguration={{
        includeWallets: [
          {
            appName: "tonkeeper",
            name: "Tonkeeper",
            imageUrl: "https://tonkeeper.com/assets/tonconnect-icon.png",
            aboutUrl: "https://tonkeeper.com",
            universalLink: "https://app.tonkeeper.com/ton-connect",
            bridgeUrl: "https://bridge.tonapi.io/bridge",
            platforms: ["ios", "android"]
          }
        ]
      }}
      actionsConfiguration={{
        twaReturnUrl: TWA_RETURN_URL,
        modals: ['before', 'success', 'error'],
        notifications: ['before', 'success', 'error'],
        returnStrategy: 'back'
      }}
    >
      <AppProvider>
        <AppContent />
      </AppProvider>
    </TonConnectUIProvider>
  );
};

export default App;