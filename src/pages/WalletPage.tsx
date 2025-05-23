import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import { droneData } from '../data/shopDataSystem1';

const WalletPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { player } = usePlayer();
  const currentSystem = player?.systems[0] || 1;

  const handleVerify = async () => {
    // Логика верификации
  };

  const handleWithdraw = async () => {
    // Логика вывода
  };

  const calculatePerHour = () => {
    if (!player?.drones || player.drones.length === 0) {
      return '0.00';
    }
    const totalCccPerDay = player.drones.reduce((sum: number, d: { id: number; system: number }) => {
      const drone = droneData.find(item => item.id === d.id && item.system === d.system);
      return sum + (drone?.cccPerDay || 0);
    }, 0);
    return (totalCccPerDay / 24).toFixed(2);
  };

  return (
    <div
      style={{
        backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
        backgroundSize: 'cover',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '10px',
        position: 'relative'
      }}
    >
      {/* Инфопанель */}
      <div
        style={{
          width: '93%',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '3px',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '2px solid #00f0ff',
          borderRadius: '10px',
          boxShadow: '0 0 20px #00f0ff',
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '1.1rem' }}>💠 {t('ccc')}: {(typeof player?.ccc === 'number' ? player.ccc : parseFloat(player?.ccc || '0')).toFixed(2)}</p>
          <p style={{ fontSize: '1.1rem' }}>📈 {t('per_hour', { amount: calculatePerHour() })}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '1.1rem' }}>✨ {t('cs')}: {(typeof player?.cs === 'number' ? player.cs : parseFloat(player?.cs || '0')).toFixed(2)}</p>
          <p style={{ fontSize: '1.1rem' }}>💎 {t('ton')}: {(typeof player?.ton === 'number' ? player.ton : parseFloat(player?.ton || '0')).toFixed(8)}</p>
        </div>
      </div>

      {/* Контент */}
      <div style={{ flex: 1, padding: '10px', textAlign: 'center', marginTop: '80px' }}>
        <h2>{t('wallet')}</h2>
        <p>{t('ton_balance')}: {(typeof player?.ton === 'number' ? player.ton : parseFloat(player?.ton || '0')).toFixed(8)} TON</p>
        <button
          onClick={handleVerify}
          style={{
            padding: '15px',
            background: player?.verified ? '#333' : '#00f0ff',
            boxShadow: player?.verified ? 'none' : '0 0 20px #00f0ff',
            color: player?.verified ? '#fff' : '#000',
            border: '2px solid #00f0ff',
            borderRadius: '15px',
            cursor: player?.verified ? 'not-allowed' : 'pointer',
            margin: '10px',
            transition: 'transform 0.3s ease'
          }}
          disabled={player?.verified}
          onMouseEnter={e => !player?.verified && (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => !player?.verified && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {player?.verified ? t('verified') : t('verify_for_1_ton')}
        </button>
        <button
          onClick={handleWithdraw}
          style={{
            padding: '15px',
            background: player && player.ton >= (player.verified ? 5 : 15) ? '#00f0ff' : '#333',
            boxShadow: player && player.ton >= (player.verified ? 5 : 15) ? '0 0 20px #00f0ff' : 'none',
            color: player && player.ton >= (player.verified ? 5 : 15) ? '#000' : '#fff',
            border: '2px solid #00f0ff',
            borderRadius: '15px',
            cursor: player && player.ton >= (player.verified ? 5 : 15) ? 'pointer' : 'not-allowed',
            transition: 'transform 0.3s ease'
          }}
          disabled={!player || player.ton < (player.verified ? 5 : 15)}
          onMouseEnter={e => player && player.ton >= (player.verified ? 5 : 15) && (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => player && player.ton >= (player.verified ? 5 : 15) && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {t('withdraw_ton', { amount: player?.verified ? 5 : 15 })}
        </button>
      </div>

      {/* Меню */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          padding: '10px',
          position: 'fixed',
          bottom: 0,
          left: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '15px' }}>
          {[
            { path: '/attack', icon: '⚔️', label: t('attack') },
            { path: '/exchange', icon: '🔄', label: t('exchange') },
            { path: '/quests', icon: '🎯', label: t('quests') }
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '2px solid #00f0ff',
                borderRadius: '15px',
                boxShadow: location.pathname === path ? '0 0 20px #00f0ff' : '0 0 10px #00f0ff',
                color: '#fff',
                fontSize: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: '15px' }}>
          {[
            { path: '/games', icon: '🎮', label: t('games') },
            { path: '/wallet', icon: '💳', label: t('wallet') },
            { path: '/main', icon: '🚀', label: t('main') },
            { path: '/ref', icon: '👥', label: t('referrals') },
            { path: '/alphabet', icon: '📖', label: t('alphabet') }
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '2px solid #00f0ff',
                borderRadius: '15px',
                boxShadow: location.pathname === path ? '0 0 20px #00f0ff' : '0 0 10px #00f0ff',
                color: '#fff',
                fontSize: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;