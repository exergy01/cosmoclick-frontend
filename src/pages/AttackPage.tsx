import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import { droneData } from '../data/shopDataSystem1';

const AttackPage = () => {
  const { t } = useTranslation();
  const { player, currentSystem } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

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
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.5)',
          boxShadow: '0 0 10px #00f0ff'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <p>💠 {t('ccc')}: {(typeof player?.ccc === 'number' ? player.ccc : parseFloat(player?.ccc || '0')).toFixed(2)}</p>
          <p>📈 {t('per_hour', { amount: calculatePerHour() })}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p>✨ {t('cs')}: {(typeof player?.cs === 'number' ? player.cs : parseFloat(player?.cs || '0')).toFixed(2)}</p>
          <p>💎 {t('ton')}: {(typeof player?.ton === 'number' ? player.ton : parseFloat(player?.ton || '0')).toFixed(8)}</p>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2>{t('under_construction')}</h2>
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '10px',
          position: 'fixed',
          bottom: 0,
          left: 0,
          background: 'rgba(0, 0, 0, 0.7)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {[
            { path: '/attack', icon: '⚔️', label: t('attack') },
            { path: '/exchange', icon: '🔄', label: t('exchange') },
            { path: '/quests', icon: '🎯', label: t('quests') }
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                padding: '10px',
                background: 'rgba(0, 0, 0, 0.5)',
                boxShadow: location.pathname === path ? '0 0 15px #00f0ff' : '0 0 10px #00f0ff',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
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
                padding: '10px',
                background: 'rgba(0, 0, 0, 0.5)',
                boxShadow: location.pathname === path ? '0 0 15px #00f0ff' : '0 0 10px #00f0ff',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttackPage;