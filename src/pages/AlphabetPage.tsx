import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

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
      setPlayer({ ...player, color: response.data.color });
      await refreshPlayer();
    } catch (err) {
      console.error('AlphabetPage: Failed to set color:', err);
    }
  };

  const colorStyle = player?.color || '#00f0ff';

  useEffect(() => {
    if (player && !player.color) {
      setPlayer({ ...player, color: '#00f0ff' });
    }
  }, [player, setPlayer]);

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
      {/* Верхняя панель с валютами */}
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />

      <div style={{ marginTop: '150px', paddingBottom: '130px' }}>
        <div style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <h2 style={{ color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, fontSize: '2rem', marginBottom: '30px' }}>
            ⚙️ {t('settings')}
          </h2>
          
          <div style={{ 
            margin: '20px 0', 
            padding: '20px', 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: `1px solid ${colorStyle}`, 
            borderRadius: '15px',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <h3 style={{ color: colorStyle, marginBottom: '15px', fontSize: '1.5rem' }}>🌍 {t('language')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {[
                { code: 'en', name: 'English', flag: '🇺🇸' },
                { code: 'ru', name: 'Русский', flag: '🇷🇺' },
                { code: 'es', name: 'Español', flag: '🇪🇸' },
                { code: 'fr', name: 'Français', flag: '🇫🇷' },
                { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                { code: 'zh', name: '中文', flag: '🇨🇳' },
                { code: 'ja', name: '日本語', flag: '🇯🇵' }
              ].map(({ code, name, flag }) => (
                <button
                  key={code}
                  onClick={() => changeLanguage(code)}
                  style={{
                    padding: '12px 18px',
                    background: i18n.language === code ? 
                      `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)` : 
                      'rgba(0, 0, 0, 0.5)',
                    boxShadow: i18n.language === code ? 
                      `0 0 25px ${colorStyle}, inset 0 0 15px ${colorStyle}30` : 
                      `0 0 10px ${colorStyle}`,
                    color: '#fff',
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontWeight: i18n.language === code ? 'bold' : 'normal',
                    textShadow: i18n.language === code ? `0 0 10px ${colorStyle}` : 'none'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = `0 0 30px ${colorStyle}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = i18n.language === code ? 
                      `0 0 25px ${colorStyle}, inset 0 0 15px ${colorStyle}30` : 
                      `0 0 10px ${colorStyle}`;
                  }}
                >
                  {flag} {name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ 
            margin: '20px 0', 
            padding: '20px', 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: `1px solid ${colorStyle}`, 
            borderRadius: '15px',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <h3 style={{ color: colorStyle, marginBottom: '15px', fontSize: '1.5rem' }}>🎨 {t('theme_color')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {[
                { color: '#00f0ff', name: 'Кибер Синий' },
                { color: '#bf00ff', name: 'Неон Фиолетовый' },
                { color: '#ff00ff', name: 'Плазма Розовый' },
                { color: '#00ffbf', name: 'Космо Зеленый' },
                { color: '#ffbf00', name: 'Звездное Золото' },
                { color: '#ff4444', name: 'Марс Красный' }
              ].map(({ color, name }) => (
                <button
                  key={color}
                  onClick={() => changeColor(color)}
                  style={{
                    padding: '12px 18px',
                    background: player?.color === color ? 
                      `linear-gradient(135deg, ${color}30, ${color}60, ${color}30)` : 
                      'rgba(0, 0, 0, 0.5)',
                    boxShadow: player?.color === color ? 
                      `0 0 25px ${color}, inset 0 0 15px ${color}30` : 
                      `0 0 10px ${color}`,
                    color: '#fff',
                    border: `2px solid ${color}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontWeight: player?.color === color ? 'bold' : 'normal',
                    textShadow: player?.color === color ? `0 0 10px ${color}` : 'none'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = `0 0 30px ${color}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = player?.color === color ? 
                      `0 0 25px ${color}, inset 0 0 15px ${color}30` : 
                      `0 0 10px ${color}`;
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ 
            margin: '20px 0', 
            padding: '20px', 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: `1px solid ${colorStyle}`, 
            borderRadius: '15px',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <h3 style={{ color: colorStyle, marginBottom: '15px', fontSize: '1.5rem' }}>ℹ️ {t('about_game')}</h3>
            <div style={{ textAlign: 'left', lineHeight: '1.6', color: '#ccc' }}>
              <p><strong style={{ color: colorStyle }}>🌌 Звёздные системы:</strong> 7 уникальных систем с собственной экономикой и ресурсами</p>
              <p><strong style={{ color: colorStyle }}>🤖 Дроны:</strong> Автоматическая добыча CCC, CS и TON. Покупка и улучшение</p>
              <p><strong style={{ color: colorStyle }}>🌍 Астероиды:</strong> Источники ресурсов. Требуют покупки и разработки дронами</p>
              <p><strong style={{ color: colorStyle }}>📦 Карго:</strong> Ограничивает объём сбора. 5-й уровень = автосбор</p>
              <p><strong style={{ color: colorStyle }}>💠 CCC:</strong> Основная валюта системы</p>
              <p><strong style={{ color: colorStyle }}>✨ CS:</strong> Валюта прокачки через обмен или задания</p>
              <p><strong style={{ color: colorStyle }}>💎 TON:</strong> Редкая награда в поздних системах</p>
              <p><strong style={{ color: colorStyle }}>🔄 Обмен:</strong> Конвертация валют с курсом и комиссией</p>
              <p><strong style={{ color: colorStyle }}>🎯 Задания:</strong> Ежедневные и разовые задачи с наградами</p>
              <p><strong style={{ color: colorStyle }}>🎮 Мини-игры:</strong> От таймеров до PvP сражений</p>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default AlphabetPage;