import React, { useEffect } from 'react';
import TopBar from '../components/TopBar';
import ResourceButtons from '../components/ResourceButtons';
import CenterPanel from '../components/CenterPanel';
import MainMenu from '../components/MainMenu';

const HomePage: React.FC = () => {
  useEffect(() => {
    const initPlayer = async () => {
      try {
        const tg = (window as any).Telegram;

        if (!tg || !tg.WebApp || !tg.WebApp.initDataUnsafe?.user) return;

        const telegramId = tg.WebApp.initDataUnsafe.user.id;
        const nickname = tg.WebApp.initDataUnsafe.user.username || 'Капитан';

        await fetch('/api/players/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: telegramId, nickname }),
        });
      } catch (error) {
        console.error('Ошибка при регистрации игрока:', error);
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
        }}></div>

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
