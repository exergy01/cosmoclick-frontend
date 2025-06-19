import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getTelegramId } from '../utils/telegram';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const StartPage: React.FC = () => {
  const { player, loading, error, setError, fetchInitialData } = useNewPlayer();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [timeoutElapsed, setTimeoutElapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

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
        telegramId: player.telegram_id
      });
      setDataLoaded(true);
      
      // Устанавливаем язык если есть
      if (player.language && i18n.language !== player.language) {
        console.log(`🌐 StartPage: Смена языка на ${player.language}`);
        i18n.changeLanguage(player.language);
      }
    }
  }, [player, loading, i18n]);

  // Логика навигации - всегда ждем минимум 4 секунды
  useEffect(() => {
    if (hasNavigated) return;

    // Показываем модальное окно выбора языка если нужно
    if (player && !player.language && !loading && !error && !showLanguageModal) {
      console.log('🌐 StartPage: Показ модального окна выбора языка');
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
      hasLanguage: !!player?.language
    });

    // Переходим на главную после минимальной задержки и загрузки данных
    if (canNavigate || (timeoutElapsed && !error)) {
      if (allDataLoaded) {
        console.log('✅ StartPage: Переход на главную - данные загружены');
        setHasNavigated(true);
        navigate('/', { replace: true });
      } else if (timeoutElapsed) {
        console.log('⏰ StartPage: Переход на главную - тайм-аут');
        setHasNavigated(true);
        navigate('/', { replace: true });
      }
    }
  }, [player, loading, error, minDelayElapsed, timeoutElapsed, navigate, i18n, hasNavigated, dataLoaded, progress, showLanguageModal]);

  const handleLanguageSelect = async (lang: string) => {
    try {
      const telegramId = player?.telegram_id || getTelegramId();
      if (!telegramId) {
        console.error('❌ StartPage: Не удалось получить telegramId');
        return;
      }
      console.log(`🌐 StartPage: Выбор языка ${lang}, telegramId: ${telegramId}`);
      
      const response = await axios.post(`${API_URL}/api/player/language`, { telegramId, language: lang });
      console.log('✅ StartPage: Ответ от API:', response.data);
      
      await i18n.changeLanguage(lang);
      setShowLanguageModal(false);
      setSelectedLanguage(lang);
      
      console.log('🔄 StartPage: Обновление данных игрока после выбора языка');
      await fetchInitialData();
    } catch (err) {
      console.error('❌ StartPage: Не удалось установить язык:', err);
      setShowLanguageModal(false);
      setError('Не удалось установить язык');
    }
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
            t('welcome_player', { username: player.username || `User${player.telegram_id?.slice(-4) || 'Unknown'}` }) :
            'CosmoClick Loading...'
          }
        </h1>

        {/* 🔥 ПОЛНАЯ ДИАГНОСТИКА TELEGRAM */}
        <div style={{
          position: 'absolute',
          top: '100px',
          left: '20px',
          background: 'rgba(0,0,0,0.9)',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#fff',
          maxWidth: '350px',
          overflowY: 'auto',
          maxHeight: '300px',
          border: '1px solid #333'
        }}>
          <div style={{color: '#00ff00', fontWeight: 'bold', marginBottom: '5px'}}>🔍 ДИАГНОСТИКА:</div>
          <div>Telegram ID: <span style={{color: '#ffff00'}}>{getTelegramId()}</span></div>
          <div>Player loaded: {player ? '✅' : '❌'}</div>
          <div>Data loaded: {dataLoaded ? '✅' : '❌'}</div>
          <div>Min delay: {minDelayElapsed ? '✅' : '❌'}</div>
          <div>Progress: {progress}%</div>
          
          <hr style={{margin: '10px 0', borderColor: '#666'}} />
          <div style={{color: '#00ffff', fontWeight: 'bold'}}>📱 TELEGRAM DEBUG:</div>
          <div>Has window.Telegram: {typeof window !== 'undefined' && window.Telegram ? '✅' : '❌'}</div>
          <div>Has WebApp: {typeof window !== 'undefined' && window.Telegram?.WebApp ? '✅' : '❌'}</div>
          <div>WebApp version: <span style={{color: '#ffff00'}}>{typeof window !== 'undefined' && window.Telegram?.WebApp?.version || 'N/A'}</span></div>
          <div>Has initData: {typeof window !== 'undefined' && window.Telegram?.WebApp?.initData ? '✅' : '❌'}</div>
          <div>InitData length: <span style={{color: '#ffff00'}}>{typeof window !== 'undefined' && (window.Telegram?.WebApp?.initData?.length || 0)}</span></div>
          <div>Has initDataUnsafe: {typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe ? '✅' : '❌'}</div>
          <div>Has user: {typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user ? '✅' : '❌'}</div>
          <div>User ID: <span style={{color: '#ffff00'}}>{typeof window !== 'undefined' && (window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'N/A')}</span></div>
          <div>User name: <span style={{color: '#ffff00'}}>{typeof window !== 'undefined' && (window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'N/A')}</span></div>
          
          <hr style={{margin: '10px 0', borderColor: '#666'}} />
          <div style={{color: '#ff9900', fontWeight: 'bold'}}>🌐 БРАУЗЕР INFO:</div>
          <div>User Agent: <span style={{fontSize: '10px', wordBreak: 'break-all'}}>{typeof window !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'N/A'}</span></div>
          <div>URL: <span style={{fontSize: '10px', wordBreak: 'break-all'}}>{typeof window !== 'undefined' ? window.location.href : 'N/A'}</span></div>
          <div>Is Mobile: {typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? '✅' : '❌'}</div>
        </div>
        
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
                background: 'rgba(255, 255, 252, 0.1)',
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
                    boxShadow: selectedLanguage === lang ? `0 0 10px ${colorStyle}` : 'none',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {lang.toUpperCase()}
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