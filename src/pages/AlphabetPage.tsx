import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'https://cosmoclick-backend.onrender.com';

const AlphabetPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { player, currentSystem, setPlayer, refreshPlayer } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  // Состояние звука (получаем из localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('cosmoclick_sound_enabled');
    return saved !== 'false'; // По умолчанию звук включен
  });

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

  const toggleSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    localStorage.setItem('cosmoclick_sound_enabled', newSoundState.toString());
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

      <div style={{ marginTop: '80px', paddingBottom: '130px' }}>
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
            <h3 style={{ color: colorStyle, marginBottom: '15px', fontSize: '1.5rem' }}>{t('language')}</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {[
                { code: 'en', name: t('en'), flag: '🇺🇸' },
                { code: 'ru', name: t('ru'), flag: '🇷🇺' },
                { code: 'es', name: t('es'), flag: '🇪🇸' },
                { code: 'fr', name: t('fr'), flag: '🇫🇷' },
                { code: 'de', name: t('de'), flag: '🇩🇪' },
                { code: 'zh', name: t('zh'), flag: '🇨🇳' },
                { code: 'ja', name: t('ja'), flag: '🇯🇵' },
                { code: 'hi', name: t('hi'), flag: '🇮🇳' }
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
            <h3 style={{ color: colorStyle, marginBottom: '15px', fontSize: '1.5rem' }}>{t('theme_color')}</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {[
                { color: '#00f0ff', name: t('cyber_blue') },
                { color: '#bf00ff', name: t('neon_purple') },
                { color: '#ff00ff', name: t('plasma_pink') },
                { color: '#00ffbf', name: t('cosmo_green') },
                { color: '#ffbf00', name: t('star_gold') },
                { color: '#ff4444', name: t('mars_red') }
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
            <h3 style={{ color: colorStyle, marginBottom: '15px', fontSize: '1.5rem' }}>🔊 Настройки звука</h3>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '15px'
            }}>
              <span style={{ color: '#ccc', fontSize: '1.1rem' }}>
                {soundEnabled ? '🔊 Звук включен' : '🔇 Звук выключен'}
              </span>
              <button
                onClick={toggleSound}
                style={{
                  padding: '12px 24px',
                  background: soundEnabled ?
                    `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)` :
                    'rgba(255, 0, 0, 0.3)',
                  boxShadow: soundEnabled ?
                    `0 0 25px ${colorStyle}, inset 0 0 15px ${colorStyle}30` :
                    '0 0 25px #ff0000, inset 0 0 15px rgba(255, 0, 0, 0.3)',
                  color: '#fff',
                  border: soundEnabled ? `2px solid ${colorStyle}` : '2px solid #ff0000',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  textShadow: soundEnabled ? `0 0 10px ${colorStyle}` : '0 0 10px #ff0000'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = soundEnabled ?
                    `0 0 30px ${colorStyle}` :
                    '0 0 30px #ff0000';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = soundEnabled ?
                    `0 0 25px ${colorStyle}, inset 0 0 15px ${colorStyle}30` :
                    '0 0 25px #ff0000, inset 0 0 15px rgba(255, 0, 0, 0.3)';
                }}
              >
                {soundEnabled ? '🔊 Выключить звук' : '🔇 Включить звук'}
              </button>
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
            <h3 style={{ color: colorStyle, marginBottom: '15px', fontSize: '1.5rem' }}>{t('about_game')}</h3>
            <div style={{ textAlign: 'left', lineHeight: '1.6', color: '#ccc' }}>
              <p><strong style={{ color: colorStyle }}>{t('star_systems')}:</strong> {t('star_systems_desc')}</p>
              <p><strong style={{ color: colorStyle }}>{t('drones')}:</strong> {t('drones_desc')}</p>
              <p><strong style={{ color: colorStyle }}>{t('asteroids')}:</strong> {t('asteroids_desc')}</p>
              <p><strong style={{ color: colorStyle }}>{t('cargo')}:</strong> {t('cargo_desc')}</p>
              <p><strong style={{ color: colorStyle }}>{t('ccc')}:</strong> {t('ccc_desc')}</p>
              <p><strong style={{ color: colorStyle }}>{t('cs')}:</strong> {t('cs_desc')}</p>
              <p><strong style={{ color: colorStyle }}>{t('ton')}:</strong> {t('ton_desc')}</p>
              <p><strong style={{ color: colorStyle }}>{t('exchange')}:</strong> {t('exchange_desc')}</p>
              <p><strong style={{ color: colorStyle }}>{t('quests')}:</strong> {t('quests_desc')}</p>
              <p><strong style={{ color: colorStyle }}>{t('mini_games')}:</strong> {t('mini_games_desc')}</p>
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