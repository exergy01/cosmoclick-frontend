// StartPage.tsx
import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const StartPage: React.FC = () => {
  const { player, loading, error, setError, fetchInitialData, setPlayer } = useNewPlayer();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [timeoutElapsed, setTimeoutElapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isNewPlayer, setIsNewPlayer] = useState(false);

  // Блокировка прокрутки при показе модального окна
  useEffect(() => {
    if (showWelcomeModal) {
      // Сохраняем текущую позицию прокрутки
      const scrollY = window.scrollY;
      
      // Блокируем прокрутку
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Восстанавливаем прокрутку
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showWelcomeModal]);

  useEffect(() => {
    const minDelayTimer = setTimeout(() => setMinDelayElapsed(true), 4000);
    const timeoutTimer = setTimeout(() => setTimeoutElapsed(true), 15000);
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) return prev + 3;
        else if (dataLoaded && prev < 100) return prev + 10;
        return prev;
      });
    }, 150);

    return () => {
      clearTimeout(minDelayTimer);
      clearTimeout(timeoutTimer);
      clearInterval(progressInterval);
    };
  }, [dataLoaded]);

  useEffect(() => {
    if (error) {
      const errorTimer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(errorTimer);
    }
  }, [error, setError]);

  useEffect(() => {
    if (!isInitialized) {
      fetchInitialData();
      setIsInitialized(true);
    }
  }, [fetchInitialData, isInitialized]);

  useEffect(() => {
    if (player && !loading) {
      setDataLoaded(true);
      const isPlayerNew = !player.language;
      setIsNewPlayer(isPlayerNew);

      if (player.language && i18n.language !== player.language && !isPlayerNew) {
        i18n.changeLanguage(player.language);
      }

      // 🔥 Автоматический выбор языка для новых игроков
      if (isPlayerNew && !selectedLanguage) {
        const supportedLanguages = Array.isArray(i18n.options.supportedLngs)
          ? i18n.options.supportedLngs.filter((l: string) => l !== 'cimode')
          : ['en'];
        const baseLang = i18n.language.split('-')[0]; // нормализуем язык
        const autoLang = supportedLanguages.includes(baseLang) ? baseLang : 'en';
        handleLanguageSelect(autoLang);
      }
    }
  }, [player, loading, i18n, selectedLanguage]);

  useEffect(() => {
    if (hasNavigated) return;

    if (showWelcomeModal) return;

    if (isNewPlayer && player?.language && dataLoaded && !showWelcomeModal) {
      setShowWelcomeModal(true);
      return;
    }

    const allDataLoaded = !!(player && dataLoaded);
    const canNavigate = minDelayElapsed && allDataLoaded && progress >= 100;

    if (canNavigate) {
      setHasNavigated(true);
      navigate('/', { replace: true });
    } else if (timeoutElapsed && !error) {
      setHasNavigated(true);
      navigate('/', { replace: true });
    }
  }, [player, loading, error, minDelayElapsed, timeoutElapsed, navigate, hasNavigated, dataLoaded, progress, showWelcomeModal, isNewPlayer]);

  const handleLanguageSelect = async (lang: string) => {
    try {
      const telegramId = player?.telegram_id;
      if (!telegramId) {
        setError('Failed to get Telegram ID');
        return;
      }

      const response = await axios.post(`${API_URL}/api/player/language`, {
        telegramId,
        language: lang,
        isFirstLanguageSelection: true
      });

      await i18n.changeLanguage(lang);
      setSelectedLanguage(lang);

      if (player) {
        setPlayer({ ...player, language: lang, registration_language: lang });
      }

      if (isNewPlayer) {
        setTimeout(() => setShowWelcomeModal(true), 1000);
      }

    } catch (err: any) {
      console.error('Failed to set language:', err);
      setError('Failed to set language');
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
    setIsNewPlayer(false);
  };

  const colorStyle = player?.color || '#00f0ff';

  return (
    <Suspense fallback={<div>{t('loading')}</div>}>
      <div
        style={{
          backgroundImage: `url(/assets/startpage_bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: '#fff',
          padding: '20px',
          position: 'fixed', // Изменено с relative на fixed
          top: 0,
          left: 0,
          overflow: 'hidden', // Предотвращает прокрутку
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            color: 'white',
            textShadow: `0 0 10px ${colorStyle}, 0 0 20px ${colorStyle}`,
            textAlign: 'center',
            whiteSpace: 'pre-line',
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)', // Центрируем по горизонтали
            width: 'calc(100% - 40px)', // Учитываем padding
            opacity: dataLoaded ? 1 : 0.7,
            transition: 'opacity 0.5s ease',
            margin: 0,
            zIndex: 1,
          }}
        >
          {player && player.language ?
            t('welcome_player', { username: player.first_name || player.username || `User${player.telegram_id?.slice(-4) || 'Unknown'}` }) :
            'CosmoClick Loading...'
          }
        </h1>

        {error && (
          <p style={{
            fontSize: '1.2rem',
            color: '#ff4d4d',
            textShadow: '0 0 10px #ff4d4d',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1,
          }}>
            {error}
          </p>
        )}

        {/* Прогресс бар */}
        <div style={{
          width: '80%',
          maxWidth: '600px',
          position: 'absolute',
          bottom: '40px', // Увеличил отступ
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1,
        }}>
          <div style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '5px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(progress, 100)}%`,
              height: '20px',
              background: colorStyle,
              boxShadow: `0 0 10px ${colorStyle}`,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <p style={{ 
            textAlign: 'center', 
            marginTop: '10px',
            fontSize: '14px',
          }}>
            {dataLoaded ?
              t('loading_complete') || 'Готово!' :
              t('loading') || 'Загрузка...'
            } {Math.round(Math.min(progress, 100))}%
          </p>
        </div>

        {/* Модальное окно приветствия */}
        {showWelcomeModal && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'hidden', // Блокируем прокрутку модального окна
          }}>
            <div style={{
              background: 'rgba(0, 0, 40, 0.95)',
              padding: '20px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: `0 0 30px ${colorStyle}`,
              border: `3px solid ${colorStyle}`,
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh', // Увеличил максимальную высоту
              overflowY: 'auto', // Скролл только внутри модального окна
              boxSizing: 'border-box',
            }}>
              <h2 style={{ 
                color: colorStyle, 
                marginBottom: '15px', 
                fontSize: '20px',
                margin: '0 0 15px 0',
              }}>
                🚀 {t('welcome_to_cosmoclick') || 'Добро пожаловать в CosmoClick!'}
              </h2>

              <div style={{ 
                textAlign: 'left', 
                lineHeight: '1.5', 
                fontSize: '14px', 
                marginBottom: '20px' 
              }}>
                <p style={{ marginBottom: '12px' }}>
                  🌟 <strong>{t('game_description') || 'CosmoClick - это космическая игра-кликер, где вы:'}</strong>
                </p>

                <ul style={{ 
                  paddingLeft: '20px', 
                  marginBottom: '12px',
                  margin: '0 0 12px 0',
                }}>
                  <li style={{ marginBottom: '6px' }}>🪨 {t('buy_asteroids')}</li>
                  <li style={{ marginBottom: '6px' }}>🤖 {t('buy_drones')}</li>
                  <li style={{ marginBottom: '6px' }}>📦 {t('buy_cargo')}</li>
                  <li style={{ marginBottom: '6px' }}>🌌 {t('unlock_systems')}</li>
                  <li style={{ marginBottom: '6px' }}>💎 {t('stake_ton')}</li>
                </ul>

                <p style={{ marginBottom: '12px' }}>
                  💰 <strong>{t('currencies')}:</strong>
                </p>

                <ul style={{ 
                  paddingLeft: '20px', 
                  marginBottom: '12px',
                  margin: '0 0 12px 0',
                }}>
                  <li style={{ marginBottom: '4px' }}>🔸 <strong>CCC</strong> - {t('ccc_description')}</li>
                  <li style={{ marginBottom: '4px' }}>🔹 <strong>CS</strong> - {t('cs_description')}</li>
                  <li style={{ marginBottom: '4px' }}>💎 <strong>TON</strong> - {t('ton_description')}</li>
                </ul>

                <p style={{ 
                  textAlign: 'center', 
                  color: colorStyle, 
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}>
                  {t('start_journey')}
                </p>
              </div>

              <button
                onClick={handleWelcomeClose}
                style={{
                  padding: '12px 24px',
                  background: colorStyle,
                  border: 'none',
                  borderRadius: '10px',
                  color: '#000',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  margin: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 0 20px ${colorStyle}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🚀 {t('start_game') || 'Начать игру!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
};

export default StartPage;