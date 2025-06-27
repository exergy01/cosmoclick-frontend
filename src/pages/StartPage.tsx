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
  const [progress, setProgress] = useState(0);
  const [showLanguageModal, setShowLanguageModal] = useState(true); // 🔥 ПРИНУДИТЕЛЬНО TRUE
  const [hasNavigated, setHasNavigated] = useState(false);

  // 🔥 ТЕСТ: Всегда показываем модал на 10 секунд
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasNavigated) {
        console.log('🔥 ТЕСТ: Принудительный переход через 10 секунд');
        setHasNavigated(true);
        navigate('/', { replace: true });
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [hasNavigated, navigate]);

  // Простой прогресс бар
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => prev < 90 ? prev + 5 : prev);
    }, 200);

    return () => clearInterval(progressInterval);
  }, []);

  // Загрузка данных
  useEffect(() => {
    if (!player && !loading) {
      fetchInitialData();
    }
  }, [player, loading, fetchInitialData]);

  const handleLanguageSelect = async (lang: string) => {
    console.log('🌐 Выбран язык:', lang);
    
    try {
      if (player?.telegram_id) {
        console.log('📡 Отправка запроса на сервер...');
        const response = await axios.post(`${API_URL}/api/player/language`, { 
          telegramId: player.telegram_id, 
          language: lang,
          isFirstLanguageSelection: true
        });
        console.log('✅ Ответ сервера:', response.data);
        
        // Обновляем игрока локально
        if (player) {
          setPlayer({ 
            ...player, 
            language: lang, 
            registration_language: lang 
          });
        }
        
        // Меняем язык в i18n
        console.log('🌐 Смена языка в i18n на:', lang);
        await i18n.changeLanguage(lang);
        
        setShowLanguageModal(false);
        
        // Показываем сообщение об успехе
        if (response.data && response.data.language === lang) {
          alert(`✅ Язык успешно изменен на: ${lang}`);
        } else {
          alert(`❌ Ошибка: язык в ответе не совпадает. Ответ: ${JSON.stringify(response.data)}`);
        }
        
      } else {
        console.error('❌ Нет telegram_id!');
        alert('❌ Нет telegram_id!');
        return;
      }
      
      // Переход на главную через 2 секунды
      setTimeout(() => {
        if (!hasNavigated) {
          setHasNavigated(true);
          navigate('/', { replace: true });
        }
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ Ошибка установки языка:', err);
      alert(`❌ Ошибка: ${err.response?.data?.error || err.message}`);
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
          backgroundRepeat: 'no-root',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          padding: '20px',
          position: 'relative',
        }}
      >
        <h1 style={{ fontSize: '2rem', marginBottom: '20px', textAlign: 'center' }}>
          🚀 CosmoClick Loading...
        </h1>
        
        {/* Прогресс бар */}
        <div style={{ width: '80%', maxWidth: '400px', marginBottom: '20px' }}>
          <div style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '5px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '20px',
              background: colorStyle,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '10px' }}>
            {progress}%
          </p>
        </div>

        {/* 🔥 ПРИНУДИТЕЛЬНОЕ МОДАЛЬНОЕ ОКНО */}
        {showLanguageModal && (
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
            }}
          >
            <div
              style={{
                background: 'rgba(0, 0, 20, 0.95)',
                padding: '30px',
                borderRadius: '20px',
                textAlign: 'center',
                border: `3px solid ${colorStyle}`,
                boxShadow: `0 0 30px ${colorStyle}`,
                maxWidth: '350px',
                width: '90%',
              }}
            >
              <h2 style={{ 
                color: colorStyle, 
                marginBottom: '25px', 
                fontSize: '20px' 
              }}>
                🌐 Choose Language<br/>Выберите язык
              </h2>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                maxWidth: '300px',
                margin: '0 auto'
              }}>
                {[
                  { code: 'en', flag: '🇺🇸', name: 'English' },
                  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
                  { code: 'es', flag: '🇪🇸', name: 'Español' },
                  { code: 'fr', flag: '🇫🇷', name: 'Français' },
                  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
                  { code: 'zh', flag: '🇨🇳', name: '中文' },
                  { code: 'ja', flag: '🇯🇵', name: '日本語' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    style={{
                      padding: '12px 8px',
                      background: 'transparent',
                      border: `2px solid ${colorStyle}`,
                      borderRadius: '10px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      minHeight: '70px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colorStyle;
                      e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#fff';
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                    <span style={{ fontSize: '11px', textAlign: 'center', lineHeight: '1.2' }}>
                      {lang.name}
                    </span>
                  </button>
                ))}
              </div>
              
              <p style={{ 
                marginTop: '20px', 
                fontSize: '12px', 
                color: '#888' 
              }}>
                Модальное окно работает! 🎉
              </p>
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: '#ff4444', textAlign: 'center', marginTop: '20px' }}>
            {error}
          </p>
        )}
      </div>
    </Suspense>
  );
};

export default StartPage;