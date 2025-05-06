import React from 'react';
import TopBar from '../components/TopBar';
import ResourceButtons from '../components/ResourceButtons';
import CenterPanel from '../components/CenterPanel';
import MainMenu from '../components/MainMenu';
import { usePlayer } from '../context/PlayerContext';

const HomePage: React.FC = () => {
  const { player, loading, error } = usePlayer();

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
        {loading ? (
          <p style={{ textAlign: 'center', fontSize: '16px' }}>Загрузка...</p>
        ) : error ? (
          <p style={{ textAlign: 'center', fontSize: '16px', color: '#ff5555' }}>{error}</p>
        ) : player ? (
          <>
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
          </>
        ) : (
          <p style={{ textAlign: 'center', fontSize: '16px' }}>Игрок не загружен</p>
        )}
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
          <MainMenu />
        </div>
      </div>
    </div>
  );
};

export default HomePage;