import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const StartPage: React.FC = () => {
  const { player, loading, error, setError, fetchInitialData, setPlayer } = useNewPlayer();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [timeoutElapsed, setTimeoutElapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isNewPlayer, setIsNewPlayer] = useState(false);

  // 🔥 ВСЕГДА показываем StartPage минимум 4 секунды
  useEffect(() => {
    console.log('🎬 StartPage: Запуск таймеров');
    const minDelayTimer = setTimeout(() => {
      console.log('⏰ StartPage: Минимальная задержка 4 сек прошла');
      setMinDelayElapsed(true);
    }, 4000);
    
    const timeoutTimer = setTimeout(() => {
      console.log('⏰ StartPage: Тайм-аут 15 сек прошел');
      setTimeoutElapsed(true);
    }, 15000);
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          return prev + 3;
        } else if (dataLoaded && prev < 100) {
          return prev + 10;
        }
        return prev;
      });
    }, 150);

    return () => {
      clearTimeout(minDelayTimer);
      clearTimeout(timeoutTimer);
      clearInterval(progressInterval);
    };
  }, [dataLoaded]);

  // Очистка ошибки через 3 секунды
  useEffect(() => {
    if (error) {
      const errorTimer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(errorTimer);
    }
  }, [error, setError]);

  // Инициализация данных
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 StartPage: Запуск fetchInitialData');
      fetchInitialData();
      setIsInitialized(true);
    }
  }, [fetchInitialData, isInitialized]);

  // Отслеживание загрузки данных
  useEffect(() => {
    if (player && !loading) {
      console.log('📦 StartPage: Данные игрока загружены', {
        hasLanguage: !!player.language,
        telegramId: player.telegram_id,
        username: player.username,
        first_name: player.first_name
      });
      setDataLoaded(true);
      
      // 🔥 ПРОСТАЯ ЛОГИКА: если язык 'en' (по умолчанию) - значит новый игрок
      const isPlayerNew = player.language === 'en';
      
      console.log('🔍 Проверка нового игрока:', {
        language: player.language,
        isPlayerNew
      });
      
      setIsNewPlayer(isPlayerNew);
      
      // Устанавливаем язык БЕЗ перезагрузки если игрок НЕ новый
      if (player.language && i18n.language !== player.language && !isPlayerNew) {
        console.log(`🌐 StartPage: Смена языка на ${player.language} без перезагрузки`);
        i18n.changeLanguage(player.language);
      }
    }
  }, [player, loading, i18n]);

  // Логика навигации - всегда ждем минимум 4 секунды
  useEffect(() => {
    if (hasNavigated) return;

    // 🔥 НОВАЯ ЛОГИКА: Показываем выбор языка для новых игроков
    if (player && isNewPlayer && !loading && !error && !showLanguageModal && !showWelcomeModal) {
      console.log('🌐 StartPage: Показ модального окна выбора языка для нового игрока');
      setShowLanguageModal(true);
      return;
    }

    const allDataLoaded = !!(player && dataLoaded);
    const canNavigate = minDelayElapsed && allDataLoaded && progress >= 100;
    
    console.log('🔍 StartPage: Проверка условий перехода:', { 
      minDelayElapsed, 
      loading, 
      allDataLoaded, 
      dataLoaded,
      timeoutElapsed, 
      error, 
      hasNavigated,
      progress,
      canNavigate,
      hasLanguage: !!player?.language,
      isNewPlayer
    });

    // Переходим на главную после минимальной задержки и загрузки данных
    if (canNavigate && !showLanguageModal && !showWelcomeModal) {
      console.log('✅ StartPage: Переход на главную - данные загружены');
      setHasNavigated(true);
      navigate('/', { replace: true });
    } else if (timeoutElapsed && !error && !showLanguageModal && !showWelcomeModal) {
      console.log('⏰ StartPage: Переход на главную - тайм-аут');
      setHasNavigated(true);
      navigate('/', { replace: true });
    }
  }, [player, loading, error, minDelayElapsed, timeoutElapsed, navigate, i18n, hasNavigated, dataLoaded, progress, showLanguageModal, showWelcomeModal, isNewPlayer]);

  const handleLanguageSelect = async (lang: string) => {
    try {
      const telegramId = player?.telegram_id;
      if (!telegramId) {
        console.error('❌ StartPage: Не удалось получить telegramId');
        return;
      }
      console.log(`🌐 StartPage: Выбор языка ${lang}, telegramId: ${telegramId}`);
      
      // 🔥 ИСПРАВЛЕНО: НЕ перезагружаем данные, только обновляем язык
      const response = await axios.post(`${API_URL}/api/player/language`, { telegramId, language: lang });
      console.log('✅ StartPage: Ответ от API:', response.data);
      
      // Обновляем язык локально БЕЗ перезагрузки
      await i18n.changeLanguage(lang);
      setSelectedLanguage(lang);
      
      // Обновляем объект игрока локально
      if (player) {
        setPlayer({ ...player, language: lang });
      }
      
      setShowLanguageModal(false);
      
      // 🔥 ПОКАЗЫВАЕМ ПРИВЕТСТВЕННОЕ МОДАЛЬНОЕ ОКНО ПОСЛЕ ВЫБОРА ЯЗЫКА
      setTimeout(() => {
        setShowWelcomeModal(true);
      }, 500);
      
    } catch (err) {
      console.error('❌ StartPage: Не удалось установить язык:', err);
      setShowLanguageModal(false);
      setError('Не удалось установить язык');
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
  };

  const colorStyle = player?.color || '#00f0ff';

  return (
    <Suspense fallback={<div>Загрузка...</div>}>
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
        {/* Приветствие */}
        <h1
          style={{
            fontSize: '2rem',
            color: 'white',
            textShadow: `0 0 10px ${colorStyle}, 0 0 20px ${colorStyle}`,
            textAlign: 'center',
            whiteSpace: 'pre-line',
            position: 'absolute',
            top: '20px',
            opacity: dataLoaded ? 1 : 0.7,
            transition: 'opacity 0.5s ease'
          }}
        >
          {player && player.language ? 
            t('welcome_player', { username: player.first_name || player.username || `User${player.telegram_id?.slice(-4) || 'Unknown'}` }) :
            'CosmoClick Loading...'
          }
        </h1>
        
        {error && (
          <p
            style={{
              fontSize: '1.2rem',
              color: '#ff4d4d',
              textShadow: '0 0 10px #ff4d4d',
              marginTop: '200px',
            }}
          >
            {error}
          </p>
        )}
        
        {/* Прогресс бар */}
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
                width: `${Math.min(progress, 100)}%`,
                height: '20px',
                background: colorStyle,
                boxShadow: `0 0 10px ${colorStyle}`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ textAlign: 'center', marginTop: '10px' }}>
            {dataLoaded ? 
              t('loading_complete') || 'Готово!' : 
              t('loading') || 'Загрузка...'
            } {Math.round(Math.min(progress, 100))}%
          </p>
        </div>

        {/* 🌐 МОДАЛЬНОЕ ОКНО ВЫБОРА ЯЗЫКА */}
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
                background: 'rgba(0, 0, 20, 0.9)',
                padding: '30px',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: `0 0 20px ${colorStyle}`,
                border: `2px solid ${colorStyle}`,
                maxWidth: '400px',
                margin: '20px'
              }}
            >
              <h2 style={{ color: colorStyle, marginBottom: '20px' }}>
                🌐 Choose Language / Выберите язык
              </h2>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                {[
                  { code: 'en', flag: '🇺🇸', name: 'English' },
                  { code: 'ru', flag: '🇷🇺', name: 'Русский' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    style={{
                      padding: '15px 20px',
                      background: 'transparent',
                      border: `2px solid ${colorStyle}`,
                      borderRadius: '10px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colorStyle;
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 🎮 МОДАЛЬНОЕ ОКНО ПРИВЕТСТВИЯ И ЭКСКУРСА */}
        {showWelcomeModal && (
          <div
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
          >
            <div
              style={{
                background: 'rgba(0, 0, 40, 0.95)',
                padding: '30px',
                borderRadius: '20px',
                textAlign: 'center',
                boxShadow: `0 0 30px ${colorStyle}`,
                border: `3px solid ${colorStyle}`,
                maxWidth: '500px',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <h2 style={{ color: colorStyle, marginBottom: '20px', fontSize: '24px' }}>
                🚀 {t('welcome_to_cosmoclick') || 'Добро пожаловать в CosmoClick!'}
              </h2>
              
              <div style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '16px', marginBottom: '25px' }}>
                <p style={{ marginBottom: '15px' }}>
                  🌟 <strong>{t('game_description') || 'CosmoClick - это космическая игра-кликер, где вы:'}</strong>
                </p>
                
                <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
                  <li style={{ marginBottom: '8px' }}>
                    🪨 {t('buy_asteroids') || 'Покупаете астероиды для добычи ресурсов'}
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    🤖 {t('buy_drones') || 'Покупаете дронов для автоматической добычи'}
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    📦 {t('buy_cargo') || 'Улучшаете карго для хранения ресурсов'}
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    🌌 {t('unlock_systems') || 'Открываете новые звездные системы'}
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    💎 {t('stake_ton') || 'Стейкаете TON в системе 5 для получения прибыли'}
                  </li>
                </ul>
                
                <p style={{ marginBottom: '15px' }}>
                  💰 <strong>{t('currencies') || 'Валюты:'}:</strong>
                </p>
                
                <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
                  <li>🔸 <strong>CCC</strong> - {t('ccc_description') || 'основная валюта для систем 1-3'}</li>
                  <li>🔹 <strong>CS</strong> - {t('cs_description') || 'продвинутая валюта для системы 4'}</li>
                  <li>💎 <strong>TON</strong> - {t('ton_description') || 'криптовалюта для стейкинга в системе 5'}</li>
                </ul>
                
                <p style={{ textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>
                  {t('start_journey') || 'Начните свое космическое путешествие прямо сейчас!'}
                </p>
              </div>
              
              <button
                onClick={handleWelcomeClose}
                style={{
                  padding: '15px 30px',
                  background: colorStyle,
                  border: 'none',
                  borderRadius: '10px',
                  color: '#000',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
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