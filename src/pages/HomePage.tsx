import React, { useEffect } from 'react';
import TopBar from '../components/TopBar';
import ResourceButtons from '../components/ResourceButtons';
import CenterPanel from '../components/CenterPanel';
import BottomMenu from '../components/BottomMenu';
import MainMenu from '../components/MainMenu';
import axios from 'axios';

declare global {
  interface Window {
    Telegram: any;
  }
}

const HomePage: React.FC = () => {
  useEffect(() => {
    const initPlayer = async () => {
      try {
        const telegram = window.Telegram?.WebApp?.initDataUnsafe;
        const telegramId = telegram?.user?.id;
        const nickname = telegram?.user?.username || 'Капитан';

        if (telegramId) {
          await axios.post('/api/player/init', {
            telegramId,
            nickname,
          });
        }
      } catch (error) {
        console.error('Ошибка инициализации игрока:', error);
      }
    };

    initPlayer();
  }, []);

  return (
    <div style={{
      backgroundImage: 'url(/backgrounds/cosmo-bg-1.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      backgroundColor: '#000022',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      color: '#00f0ff'
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        paddingTop: '100px',
        paddingBottom: '120px'
      }}>
        <TopBar />
        <ResourceButtons />
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}>
          <CenterPanel />
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: 'transparent',
        boxShadow: 'none',
        borderTop: 'none'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '5px 0',
          backgroundColor: 'rgba(0, 0, 34, 0.9)'
        }}>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '5px 0',
          backgroundColor: 'rgba(0, 0, 34, 0.9)'
        }}>
          <MainMenu />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
