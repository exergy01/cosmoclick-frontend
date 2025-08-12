import React, { useEffect, Suspense, useState } from 'react';
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

// 🔥 Новые импорты для локализации
import { useTranslation } from 'react-i18next';
// i18n.ts импортируется в index.tsx, поэтому здесь он не нужен

// URL для manifest.json TON Connect
const MANIFEST_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com/tonconnect-manifest.json'
  : 'http://localhost:5000/tonconnect-manifest.json';

// Конфигурация возврата в приложение
const TWA_RETURN_URL = 'https://t.me/CosmoClickBot/cosmoclick';

// 📱 КОМПОНЕНТ ПРОВЕРКИ МОБИЛЬНОГО УСТРОЙСТВА И ОРИЕНТАЦИИ
const MobileRestriction: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(true);
  const [isPortrait, setIsPortrait] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const { t } = useTranslation(); // ⬅️ Используем хук useTranslation

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword)) || 
                            window.innerWidth <= 768;

      const isPortraitOrientation = window.innerHeight > window.innerWidth;

      setIsMobile(isMobileDevice);
      setIsPortrait(isPortraitOrientation);
      setShowWarning(!isMobileDevice || !isPortraitOrientation);
    };

    checkDevice();

    const handleResize = () => checkDevice();
    const handleOrientationChange = () => {
      setTimeout(checkDevice, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  if (showWarning) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        padding: '20px',
        boxSizing: 'border-box',
        textAlign: 'center',
        zIndex: 9999
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '30px',
          borderRadius: '20px',
          border: '2px solid #00f0ff',
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
          maxWidth: '400px',
          width: '90%'
        }}>
          {!isMobile ? (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📱</div>
              <h2 style={{ 
                color: '#00f0ff', 
                marginBottom: '15px', 
                textShadow: '0 0 10px #00f0ff' 
              }}>
                {t('mobile_restriction.only_mobile')}
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                lineHeight: '1.5', 
                marginBottom: '20px',
                color: '#ccc'
              }}>
                {t('mobile_restriction.only_mobile_description')}
              </p>
              <p style={{ 
                fontSize: '1rem', 
                color: '#ffaa00',
                fontWeight: 'bold'
              }}>
                {t('mobile_restriction.only_mobile_cta')}
              </p>
            </>
          ) : (
            <>
              <div style={{ 
                fontSize: '4rem', 
                marginBottom: '20px',
                animation: 'rotate 2s ease-in-out infinite alternate'
              }}>
                📲
              </div>
              <h2 style={{ 
                color: '#00f0ff', 
                marginBottom: '15px', 
                textShadow: '0 0 10px #00f0ff' 
              }}>
                {t('mobile_restriction.rotate_screen')}
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                lineHeight: '1.5', 
                marginBottom: '20px',
                color: '#ccc'
              }}>
                {t('mobile_restriction.rotate_screen_description')}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                fontSize: '2rem'
              }}>
                <span style={{ transform: 'rotate(90deg)' }}>📱</span>
                <span style={{ color: '#00f0ff' }}>→</span>
                <span>📱</span>
              </div>
            </>
          )}
          
          <style>
            {`
              @keyframes rotate {
                0% { transform: rotate(-5deg); }
                100% { transform: rotate(5deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Компонент для логики приложения (внутри провайдеров)
const AppContent: React.FC = () => {
  const { player, loading, error, fetchInitialData } = useNewPlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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
          <div style={{ fontSize: '1.2rem' }}>
            {t('loading_page.loading_app')}
          </div>
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
        {/* 📱 ОБОРАЧИВАЕМ ВСЕ ПРИЛОЖЕНИЕ В ПРОВЕРКУ МОБИЛЬНОСТИ */}
        <MobileRestriction>
          <AppContent />
        </MobileRestriction>
      </AppProvider>
    </TonConnectUIProvider>
  );
};

export default App;