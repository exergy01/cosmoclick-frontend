import React from 'react';
import TopBar from '../components/TopBar';
import ResourceButtons from '../components/ResourceButtons';
import CenterPanel from '../components/CenterPanel';
import MainMenu from '../components/MainMenu';

const HomePage: React.FC = () => {
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
      {/* Верхняя часть со скроллом */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
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

      {/* Только ОДНО НИЖНЕЕ МЕНЮ */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: 'rgba(0, 0, 34, 0.9)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '5px 0'
      }}>
        <MainMenu />
      </div>
    </div>
  );
};

export default HomePage;
