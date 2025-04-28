import React from 'react';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';

const QuestsPage: React.FC = () => {
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

        {/* Заголовок Задания */}
        <h2 style={{
          marginTop: '20px',
          marginBottom: '20px',
          fontSize: '24px',
          color: '#00f0ff',
          textShadow: '0 0 8px #00f0ff'
        }}>
          🎯 Задания
        </h2>

        {/* Здесь потом будет список заданий */}
        <div style={{
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '20px'
        }}>
          {/* Пока что пример одного задания */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 34, 0.7)',
            border: '2px solid #00f0ff',
            borderRadius: '12px',
            padding: '15px',
            boxShadow: '0 0 8px #00f0ff',
            textAlign: 'center',
            fontSize: '16px'
          }}>
            Выполните первое задание, чтобы получить 5 ✨CS!
          </div>

          <div style={{
            backgroundColor: 'rgba(0, 0, 34, 0.7)',
            border: '2px solid #00f0ff',
            borderRadius: '12px',
            padding: '15px',
            boxShadow: '0 0 8px #00f0ff',
            textAlign: 'center',
            fontSize: '16px'
          }}>
            Просмотри рекламу и получи 10 💠CCC!
          </div>
        </div>

      </div>

      {/* Нижнее меню */}
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

export default QuestsPage;
