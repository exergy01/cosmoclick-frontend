import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getTelegramId } from '../utils/telegram';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const StartPage: React.FC = () => {
  const { player, loading, error, fetchInitialData } = usePlayer();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [timeoutElapsed, setTimeoutElapsed] = useState(false);

  useEffect(() => {
    const minDelayTimer = setTimeout(() => {
      setMinDelayElapsed(true);
    }, 3000);

    const timeoutTimer = setTimeout(() => {
      setTimeoutElapsed(true);
    }, 10000); // Таймаут 10 секунд

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) return prev + (100 / 30);
        return 100;
      });
    }, 100);

    if (!player && !loading && !error) {
      fetchInitialData();
    }

    if (player && !player.language && !loading && !error) {
      setShowLanguageModal(true);
    }

    if (player?.language && i18n.language !== player.language) {
      i18n.changeLanguage(player.language);
    }

    const allDataLoaded = player && player.language;
    if ((minDelayElapsed && !loading && (allDataLoaded || timeoutElapsed)) && !error) {
      if (timeoutElapsed && !allDataLoaded) {
        navigate('/', { replace: true }); // Резервный путь
      } else {
        navigate('/', { replace: true });
      }
    }

    return () => {
      clearTimeout(minDelayTimer);
      clearTimeout(timeoutTimer);
      clearInterval(progressInterval);
    };
  }, [player, loading, error, fetchInitialData, navigate, minDelayElapsed, i18n, timeoutElapsed]);

  const handleLanguageSelect = async (lang: string) => {
    try {
      const telegramId = player?.telegram_id || getTelegramId();
      if (!telegramId) {
        return;
      }

      await axios.post(`${API_URL}/api/player/language`, { telegramId, language: lang });
      i18n.changeLanguage(lang);
      setShowLanguageModal(false);
      setSelectedLanguage(lang);
      fetchInitialData();
    } catch (err) {
      console.error('StartPage: Failed to set language:', err);
    }
  };

  const colorStyle = player?.color || '#00f0ff';

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div
        style={{
          backgroundImage: `url(/assets/startpage_bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: '#fff',
          padding: '20px',
          position: 'relative',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            color: 'black',
            textShadow: `0 0 10px ${colorStyle}, 0 0 20px ${colorStyle}`,
            textAlign: 'center',
            whiteSpace: 'pre-line',
            position: 'absolute',
            top: '20px',
          }}
        >
          {t('welcome_player', { username: player?.username || `User${getTelegramId() || 'Unknown'}` })}
        </h1>
        {error && (
          <p
            style={{
              fontSize: '1.2rem',
              color: '#ff4d4d',
              textShadow: '0 0 10px #ff4d4d',
              marginTop: '60px',
            }}
          >
            {error}
          </p>
        )}
        <div
          style={{
            width: '80%',
            maxWidth: '600px',
            position: 'absolute',
            bottom: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '5px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '20px',
                background: colorStyle,
                boxShadow: `0 0 10px ${colorStyle}`,
                transition: 'width 0.1s linear',
              }}
            />
          </div>
          <p style={{ textAlign: 'center', marginTop: '10px' }}>
            {t('loading')} {Math.round(progress)}%
          </p>
        </div>

        {showLanguageModal && (
          <div
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center',
                boxShadow: `0 0 10px ${colorStyle}`,
              }}
            >
              <h2 style={{ color: colorStyle }}>{t('select_language')}</h2>
              {['en', 'ru'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageSelect(lang)}
                  style={{
                    padding: '10px 20px',
                    margin: '10px',
                    background: 'transparent',
                    border: `2px solid ${colorStyle}`,
                    boxShadow: selectedLanguage === lang ? `0 0 20px ${colorStyle}` : `0 0 10px ${colorStyle}`,
                    color: '#fff',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {lang === 'en' ? 'English' : 'Русский'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
};

export default StartPage;