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

  // Минимальная задержка 4 секунды + прогресс
  useEffect(() => {
    const minDelayTimer = setTimeout(() => setMinDelayElapsed(true), 4000);
    const timeoutTimer = setTimeout(() => setTimeoutElapsed(true), 15000);
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
    if (!isInitialized && !loading) {
      console.log('Инициализация: запуск fetchInitialData');
      fetchInitialData();
      setIsInitialized(true);
    }
  }, [fetchInitialData, isInitialized, loading]);

  // Отслеживание загрузки данных
  useEffect(() => {
    if (player && !loading) {
      console.log('Данные игрока полностью загружены');
      setDataLoaded(true);
      
      // Устанавливаем язык сразу как получили данные
      if (player.language && i18n.language !== player.language) {
        console.log(`Смена языка на ${player.language}`);
        i18n.changeLanguage(player.language);
      }
    }
  }, [player, loading, i18n]);

  // Навигация только после минимальной задержки И загрузки данных
  useEffect(() => {
    if (hasNavigated) return;

    // Показываем модальное окно выбора языка если нужно
    if (player && !player.language && !loading && !error && !showLanguageModal) {
      console.log('Показ модального окна для выбора языка');
      setShowLanguageModal(true);
      return;
    }

    const allDataLoaded = !!(player && player.language && dataLoaded);
    const canNavigate = minDelayElapsed && allDataLoaded && progress >= 100;
    
    console.log('Проверка условий перехода:', { 
      minDelayElapsed, 
      loading, 
      allDataLoaded, 
      dataLoaded,
      timeoutElapsed, 
      error, 
      hasNavigated,
      progress,
      canNavigate
    });

    // Переходим только если прошла минимальная задержка И данные загружены И прогресс 100%
    if (canNavigate || (timeoutElapsed && !error)) {
      if (timeoutElapsed && !allDataLoaded && !error) {
        console.log('Тайм-аут истёк, но данные не загружены, переход на /');
        setHasNavigated(true);
        navigate('/', { replace: true });
      } else if (allDataLoaded) {
        console.log('Все данные загружены и задержка прошла, переход на /main');
        setHasNavigated(true);
        navigate('/main', { replace: true });
      } else if (error && error !== 'Не удалось купить астероид') {
        console.log('Произошла критическая ошибка, переход на /');
        setHasNavigated(true);
        navigate('/', { replace: true });
      }
    }
  }, [player, loading, error, minDelayElapsed, timeoutElapsed, navigate, i18n, hasNavigated, dataLoaded, progress, showLanguageModal]);

  const handleLanguageSelect = async (lang: string) => {
    try {
      const telegramId = player?.telegram_id || getTelegramId();
      if (!telegramId) {
        console.error('Не удалось получить telegramId');
        return;
      }
      console.log(`Выбор языка: ${lang}, telegramId: ${telegramId}`);
      const response = await axios.post(`${API_URL}/api/player/language`, { telegramId, language: lang });
      console.log('Ответ от API:', response.data);
      await i18n.changeLanguage(lang);
      setShowLanguageModal(false);
      setSelectedLanguage(lang);
      console.log('Обновление данных игрока после выбора языка');
      await fetchInitialData();
    } catch (err) {
      console.error('Не удалось установить язык:', err);
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
        {/* Приветствие на правильном языке */}
        <h1
          style={{
            fontSize: '2rem',
            color: 'black',
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
            'Loading...'
          }
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
        
        {/* Прогресс бар с лучшей логикой */}
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