import React from 'react';
import TopBar from '../components/TopBar';
import ResourceButtons from '../components/ResourceButtons';
import CenterPanel from '../components/CenterPanel';
import BottomMenu from '../components/BottomMenu';
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
      {/* Верхняя часть со скроллом если нужно */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        paddingBottom: '80px'
      }}>
        <TopBar />
        <ResourceButtons />

        {/* Центрируем сейф */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}>
          <CenterPanel />
        </div>

        {/* Кнопки АТАКА/ОБМЕН/ЗАДАНИЯ */}
        <div style={{
          width: '90%',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          <BottomMenu />
        </div>
      </div>

      {/* Фиксированное главное меню */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '60px',
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.8)'
      }}>
        <MainMenu />
      </div>
    </div>
  );
};

export default HomePage;