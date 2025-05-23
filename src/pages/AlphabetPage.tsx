// src/pages/AlphabetPage.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { droneData } from '../data/shopDataSystem1';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const AlphabetPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { player, currentSystem, setPlayer, refreshPlayer } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const changeLanguage = async (lng: string) => {
    try {
      if (!player?.telegram_id) {
        console.error('AlphabetPage: No telegram_id available');
        return;
      }
      await axios.post(`${apiUrl}/api/player/language`, { telegramId: player.telegram_id, language: lng });
      i18n.changeLanguage(lng);
      await refreshPlayer();
    } catch (err) {
      console.error('AlphabetPage: Failed to set language:', err);
    }
  };

  const changeColor = async (color: string) => {
    try {
      if (!player?.telegram_id) {
        console.error('AlphabetPage: No telegram_id available');
        return;
      }
      const response = await axios.post(`${apiUrl}/api/player/color`, { telegramId: player.telegram_id, color });
      setPlayer({ ...player, color: response.data.color }); // Обновляем цвет сразу
      await refreshPlayer();
    } catch (err) {
      console.error('AlphabetPage: Failed to set color:', err);
    }
  };

  const calculateMiningSpeed = (): number => {
    if (!player) return 0;
    return player.drones
      .filter(d => d.system === currentSystem)
      .reduce((sum, d) => {
        const item = droneData.find(item => item.id === d.id && item.system === d.system);
        return sum + (item?.cccPerDay || 0) / 24;
      }, 0);
  };

  const colorStyle = player?.color || '#00f0ff';

  return (
    <div
      style={{
        backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        position: 'relative'
      }}
    >
      <div
        style={{
          width: '93%',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '3px',
          background: 'rgba(0, 0, 0, 0.5)',
          border: `2px solid ${colorStyle}`,
          borderRadius: '10px',
          boxShadow: `0 0 20px ${colorStyle}`,
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '1.1rem' }}>💠 CCC: {(typeof player?.ccc === 'number' ? player.ccc : parseFloat(player?.ccc || '0')).toFixed(5)}</p>
          <p style={{ fontSize: '1.1rem' }}>📈 В час: {calculateMiningSpeed().toFixed(5)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '1.1rem' }}>✨ {t('cs')}: {(typeof player?.cs === 'number' ? player.cs : parseFloat(player?.cs || '0')).toFixed(2)}</p>
          <p style={{ fontSize: '1.1rem' }}>💎 {t('ton')}: {(typeof player?.ton === 'number' ? player.ton : parseFloat(player?.ton || '0')).toFixed(9)}</p>
        </div>
      </div>

      <div style={{ marginTop: '110px', paddingBottom: '130px' }}>
        <div style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <h2>{t('alphabet')}</h2>
          <div style={{ margin: '10px 0' }}>
            <h3>{t('language')}</h3>
            {['en', 'ru', 'es', 'fr', 'de', 'zh', 'ja'].map(lng => (
              <button
                key={lng}
                onClick={() => changeLanguage(lng)}
                style={{
                  padding: '10px 15px',
                  background: 'transparent',
                  boxShadow: i18n.language === lng ? `0 0 20px ${colorStyle}` : `0 0 10px ${colorStyle}`,
                  color: '#fff',
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  margin: '5px',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ margin: '10px 0' }}>
            <h3>{t('color')}</h3>
            {['#00f0ff', '#bf00ff', '#ff00ff', '#00ffbf', '#ffbf00'].map(color => (
              <button
                key={color}
                onClick={() => changeColor(color)}
                style={{
                  padding: '10px 15px',
                  background: 'transparent',
                  boxShadow: player?.color === color ? `0 0 20px ${color}` : `0 0 10px ${color}`,
                  color: '#fff',
                  border: `2px solid ${color}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  margin: '5px',
                  transition: 'transform 0.3s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {color}
              </button>
            ))}
          </div>
          <div>
            <h3>{t('about')}</h3>
            <p>{t('about_text')}</p>
            <h3>{t('mechanics')}</h3>
            <p>Звёздные системы: Несколько систем, в каждой — свои дроны, астероиды, экономика. Прогресс — отдельно.</p>
            <p>Дроны автоматически добывают CCC, CS и даже TON, можно покупать и улучшать.</p>
            <p>Астероиды источник ресурсов. Требуют покупки. Разрабатываются дронами.</p>
            <p>Карго ограничивает объём ресурсов. 5 уровень — автосбор.</p>
            <p>CCC основная валюта. CS валюта для прокачки и покупок, через обмен или задания. TON редкая награда в поздних системах.</p>
            <p>Обмен конвертация CCC ⇄ CS с курсом и комиссией.</p>
            <p>Задания ежедневные, которые дают ССС, ускорения, ресурсы. Разовые - приносят игроку CS.</p>
            <p>Мини-игры от таймеров до PvP.</p>
            <p>WebApp Telegram не требует установки.</p>
          </div>
        </div>
      </div>

      <div
        style={{
          width: '93%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '10px',
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          {[
            { path: '/attack', icon: '⚔️', label: t('attack') },
            { path: '/exchange', icon: '🔄', label: t('exchange') },
            { path: '/quests', icon: '🎯', label: t('quests') }
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                padding: '8px 5px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: location.pathname === path ? `4px solid ${colorStyle}` : `2px solid ${colorStyle}`,
                borderRadius: '15px',
                boxShadow: location.pathname === path ? `0 0 10px ${colorStyle}, inset 0 0 10px ${colorStyle}` : `0 0 10px ${colorStyle}`,
                color: '#fff',
                fontSize: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxSizing: 'border-box',
                height: 'auto'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          {[
            { path: '/games', icon: '🎮' },
            { path: '/wallet', icon: '💳' },
            { path: '/main', icon: '🚀' },
            { path: '/ref', icon: '👥' },
            { path: '/alphabet', icon: '📖' }
          ].map(({ path, icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                padding: '8px 5px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: location.pathname === path ? `4px solid ${colorStyle}` : `2px solid ${colorStyle}`,
                borderRadius: '15px',
                boxShadow: location.pathname === path ? `0 0 10px ${colorStyle}, inset 0 0 10px ${colorStyle}` : `0 0 10px ${colorStyle}`,
                color: '#fff',
                fontSize: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxSizing: 'border-box',
                height: 'auto'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlphabetPage;