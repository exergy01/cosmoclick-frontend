import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import { tapperApi, TapperStatus } from '../../services/games/tapperApi';
import TapperAsteroid from '../../components/games/TapperAsteroid';
import CurrencyPanel from '../../components/CurrencyPanel';
import { adService } from '../../services/adsgramService';

// Интерфейс для уведомлений
interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
  duration: number;
}

// Функция локализации из объединенного файла
const getTranslation = (language: string) => {
  // Здесь будет импорт из вашего файла переводов
  // import translations from './locales/tapper-translations.json';
  const translations: any = {
    ru: {
      games: {
        tapper: {
          title: "Астероидный Разрушитель",
          description: "Разрушайте астероиды и получайте CCC!",
          energy: "Энергия",
          perTap: "За тап",
          tapAsteroid: "Тапайте по астероиду для получения CCC",
          energyEmpty: "Энергия закончилась!",
          energyRestore: "Энергия восстанавливается автоматически (1 в 43 сек)",
          restoreTime: "Восстановление через",
          adsToday: "Реклам сегодня",
          watchAd: "Смотреть рекламу",
          adLimitReached: "Лимит рекламы достигнут",
          collectEarnings: "Собрать заработок",
          collectAccumulated: "Собирайте накопленные CCC кнопкой 'Собрать'",
          nothingToCollect: "Нечего собирать",
          collected: "Собрано",
          howToPlay: "Как играть",
          energyRestores: "Энергия восстанавливается со временем (1 за 43 сек)",
          watchAdForEnergy: "Смотрите рекламу для получения +100 энергии",
          limits: "Лимит: 20 реклам в день"
        },
        backToGames: "Назад к играм"
      },
      loading: "Загрузка...",
      error: "Ошибка",
      errors: {
        connectionError: "Ошибка подключения к серверу",
        adError: "Ошибка показа рекламы",
        adServiceUnavailable: "Рекламный сервис недоступен"
      },
      notifications: {
        energyReceived: "Получено энергии",
        testMode: "[Тест]",
        partnerMode: "[Партнер]",
        adMode: "[Реклама]"
      }
    },
    en: {
      games: {
        tapper: {
          title: "Asteroid Destroyer",
          description: "Destroy asteroids and earn CCC!",
          energy: "Energy",
          perTap: "Per tap",
          tapAsteroid: "Tap the asteroid to earn CCC",
          energyEmpty: "Energy depleted!",
          energyRestore: "Energy restores automatically (1 per 43 sec)",
          restoreTime: "Restore in",
          adsToday: "Ads today",
          watchAd: "Watch Ad",
          adLimitReached: "Ad limit reached",
          collectEarnings: "Collect Earnings",
          collectAccumulated: "Collect accumulated CCC with 'Collect' button",
          nothingToCollect: "Nothing to collect",
          collected: "Collected",
          howToPlay: "How to Play",
          energyRestores: "Energy restores over time (1 per 43 sec)",
          watchAdForEnergy: "Watch ads to get +100 energy",
          limits: "Limit: 20 ads per day"
        },
        backToGames: "Back to Games"
      },
      loading: "Loading...",
      error: "Error",
      errors: {
        connectionError: "Server connection error",
        adError: "Ad display error",
        adServiceUnavailable: "Ad service unavailable"
      },
      notifications: {
        energyReceived: "Energy received",
        testMode: "[Test]",
        partnerMode: "[Partner]",
        adMode: "[Ad]"
      }
    }
  };

  if (translations[language]) {
    return translations[language];
  }
  const languageCode = language.split('-')[0];
  if (translations[languageCode]) {
    return translations[languageCode];
  }
  return translations.en;
};

const TapperGame: React.FC = () => {
  const { i18n } = useTranslation();
  const { player, currentSystem, refreshPlayer } = usePlayer();
  const navigate = useNavigate();
  
  const [tapperStatus, setTapperStatus] = useState<TapperStatus>({
    success: false,
    energy: 0,
    maxEnergy: 500,
    cccPerTap: 0.01,
    adsWatched: 0,
    canWatchAd: false,
    pendingCcc: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Используем цвет игрока везде
  const colorStyle = player?.color || '#00f0ff';
  const successColor = colorStyle;
  const warningColor = '#ffa500';
  const errorColor = '#ef4444';

  // Локализация
  const t = getTranslation(i18n.language);

  // Функция для показа уведомлений
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success', duration: number = 3000) => {
    const id = Date.now();
    const newToast: ToastNotification = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  // Функция для удаления уведомления
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Компонент уведомления с улучшенным дизайном
  const ToastContainer: React.FC = () => (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '90vw'
    }}>
      {toasts.map((toast) => {
        const getToastColor = () => {
          switch (toast.type) {
            case 'success': return successColor;
            case 'error': return errorColor;
            case 'warning': return warningColor;
            default: return successColor;
          }
        };

        const getToastIcon = () => {
          switch (toast.type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return '✅';
          }
        };

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'linear-gradient(145deg, rgba(0,0,0,0.95), rgba(20,20,20,0.95))',
              border: `2px solid ${getToastColor()}`,
              borderRadius: '18px',
              padding: '16px 20px',
              color: '#fff',
              boxShadow: `0 8px 32px ${getToastColor()}40, 0 0 20px ${getToastColor()}30`,
              cursor: 'pointer',
              animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              backdropFilter: 'blur(10px)',
              minWidth: '280px',
              maxWidth: '350px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ 
                fontSize: '1.4rem',
                filter: `drop-shadow(0 0 8px ${getToastColor()})`
              }}>
                {getToastIcon()}
              </div>
              <span style={{ 
                color: getToastColor(), 
                fontWeight: '600',
                textShadow: `0 0 10px ${getToastColor()}`,
                fontSize: '0.95rem',
                lineHeight: '1.4'
              }}>
                {toast.message}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Загрузка статуса тапалки
  const loadTapperStatus = useCallback(async () => {
    if (!player?.telegram_id) return;
    
    try {
      const status = await tapperApi.getStatus(player.telegram_id.toString());
      setTapperStatus(status);
      
      if (!status.success && status.error) {
        setError(status.error);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(t.errors.connectionError);
    } finally {
      setLoading(false);
    }
  }, [player?.telegram_id, t.errors.connectionError]);

  // Загрузка при монтировании
  useEffect(() => {
    loadTapperStatus();
  }, [loadTapperStatus]);

  // Автообновление энергии каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      loadTapperStatus();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadTapperStatus]);

  // Тап по астероиду
  const handleTap = async () => {
    if (!player?.telegram_id || tapperStatus.energy <= 0) return;

    try {
      const result = await tapperApi.tap(player.telegram_id.toString());
      
      if (result.success) {
        setTapperStatus(prev => ({
          ...prev,
          energy: result.energy
        }));
        // Обновляем pendingCcc из сервера
        await loadTapperStatus();
      } else if (result.error) {
        setError(result.error);
        showToast(result.error, 'error');
      }
    } catch (err) {
      const errorMsg = t.errors.connectionError;
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  // Сбор накопленных CCC
  const handleCollectEarned = async () => {
    if (tapperStatus.pendingCcc <= 0 || isCollecting) return;
    
    setIsCollecting(true);
    try {
      const result = await tapperApi.collect(player.telegram_id.toString());
      
      if (result.success) {
        await refreshPlayer();
        await loadTapperStatus();
        
        showToast(
          `💰 ${t.games.tapper.collected} ${result.collectedAmount.toFixed(2)} CCC!`,
          'success',
          4000
        );
      } else {
        const errorMsg = result.error || t.errors.connectionError;
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      const errorMsg = t.errors.connectionError;
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsCollecting(false);
    }
  };

  // ✅ ИСПРАВЛЕНО: Используем настоящий Adsgram сервис как в слотах
  const handleWatchAd = async () => {
    if (!player?.telegram_id || !tapperStatus.canWatchAd || isWatchingAd) return;
    
    setIsWatchingAd(true);
    
    try {
      console.log('⚡ Starting ad watch for tapper...');
      
      // Проверяем доступность сервиса
      if (!adService.isAvailable()) {
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '10674';
        await adService.initialize(ADSGRAM_BLOCK_ID);
        
        if (!adService.isAvailable()) {
          showToast(t.errors.adServiceUnavailable, 'error');
          return;
        }
      }
      
      // Показываем рекламу
      const adResult = await adService.showRewardedAd();
      console.log('⚡ Ad result for tapper:', adResult);
      
      if (adResult.success) {
        // Вызываем API для получения награды
        const result = await tapperApi.watchAd(player.telegram_id.toString());
        
        if (result.success) {
          setTapperStatus(prev => ({
            ...prev,
            energy: Math.min(prev.energy + result.energyAdded, prev.maxEnergy),
            adsWatched: prev.adsWatched + 1,
            canWatchAd: result.adsRemaining > 0
          }));
          setError(null);
          
          // Показываем уведомление с информацией о провайдере
          let message = `⚡ ${t.notifications.energyReceived}: ${result.energyAdded}!`;
          
          const currentProvider = adService.getProviderInfo();
          if (currentProvider.name === 'mock') {
            message += ` ${t.notifications.testMode}`;
          } else if (currentProvider.name === 'roboforex') {
            message += ` ${t.notifications.partnerMode}`;
          } else {
            message += ` ${t.notifications.adMode}`;
          }
          
          showToast(message, 'success', 4000);
        } else if (result.error) {
          setError(result.error);
          showToast(result.error, 'error');
        }
      } else {
        showToast(adResult.error || t.errors.adError, 'error');
      }
    } catch (err) {
      const errorMsg = t.errors.adError;
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setTimeout(() => {
        setIsWatchingAd(false);
      }, 500);
    }
  };

  // Время восстановления энергии
  const getEnergyRestoreTime = () => {
    const energyToRestore = tapperStatus.maxEnergy - tapperStatus.energy;
    const secondsToRestore = energyToRestore * 43.2;
    const hours = Math.floor(secondsToRestore / 3600);
    const minutes = Math.floor((secondsToRestore % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  // Процент энергии
  const energyPercentage = (tapperStatus.energy / tapperStatus.maxEnergy) * 100;

  if (loading) {
    return (
      <div style={{
        backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        padding: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(0,0,0,0.9), rgba(20,20,20,0.9))',
          padding: '40px',
          borderRadius: '25px',
          border: `2px solid ${colorStyle}`,
          textAlign: 'center',
          boxShadow: `0 0 50px ${colorStyle}30`,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '20px',
            animation: 'pulse 2s infinite'
          }}>⚡</div>
          <p style={{ fontSize: '1.1rem' }}>{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px',
      position: 'relative'
    }}>
      {/* Контейнер уведомлений */}
      <ToastContainer />

      {/* Верхняя панель с валютами */}
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />

      {/* Основной контент */}
      <div style={{ 
        marginTop: '140px', 
        paddingBottom: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: '100%',
        width: '100%'
      }}>
        {/* Заголовок с улучшенной типографикой */}
        <h1 style={{
          color: colorStyle,
          textShadow: `0 0 20px ${colorStyle}, 0 0 40px ${colorStyle}50`,
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          marginBottom: '25px',
          textAlign: 'center',
          fontWeight: '700',
          letterSpacing: '1px'
        }}>
          💥 {t.games.tapper.title}
        </h1>

        {/* Астероид ПЕРВЫЙ */}
        <TapperAsteroid
          onTap={handleTap}
          energy={tapperStatus.energy}
          cccPerTap={tapperStatus.cccPerTap}
          colorStyle={colorStyle}
        />

        {/* ✅ БОЛЬШАЯ КНОПКА СБОРА CCC с правильной шириной */}
        <div style={{
          width: '93%',
          maxWidth: '93%',
          marginTop: '25px',
          marginBottom: '25px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <button
            onClick={handleCollectEarned}
            disabled={tapperStatus.pendingCcc <= 0 || isCollecting}
            style={{
              width: '100%',
              padding: '20px 25px',
              background: tapperStatus.pendingCcc > 0 
                ? `linear-gradient(135deg, ${colorStyle}40, ${colorStyle}60, ${colorStyle}40)`
                : 'linear-gradient(135deg, rgba(128,128,128,0.2), rgba(128,128,128,0.4))',
              border: `3px solid ${tapperStatus.pendingCcc > 0 ? colorStyle : '#555'}`,
              borderRadius: '20px',
              color: tapperStatus.pendingCcc > 0 ? '#fff' : '#888',
              cursor: tapperStatus.pendingCcc > 0 ? 'pointer' : 'not-allowed',
              fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
              fontWeight: 'bold',
              textShadow: tapperStatus.pendingCcc > 0 ? `0 0 15px ${colorStyle}` : 'none',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              boxShadow: tapperStatus.pendingCcc > 0 
                ? `0 0 30px ${colorStyle}50, inset 0 0 20px ${colorStyle}20`
                : '0 0 10px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              if (tapperStatus.pendingCcc > 0) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 0 40px ${colorStyle}70, inset 0 0 30px ${colorStyle}30`;
              }
            }}
            onMouseLeave={e => {
              if (tapperStatus.pendingCcc > 0) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 0 30px ${colorStyle}50, inset 0 0 20px ${colorStyle}20`;
              }
            }}
          >
            {/* Анимированный фон для активной кнопки */}
            {tapperStatus.pendingCcc > 0 && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${colorStyle}30, transparent)`,
                animation: 'shimmer 2s infinite',
                pointerEvents: 'none'
              }} />
            )}
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '15px',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
                {isCollecting ? '⏳' : '💰'}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.2rem, 4vw, 1.6rem)' }}>
                  {isCollecting ? 'Собираем...' : t.games.tapper.collectEarnings}
                </div>
                <div style={{ 
                  fontSize: 'clamp(1rem, 3vw, 1.3rem)',
                  marginTop: '5px',
                  opacity: 0.9
                }}>
                  {tapperStatus.pendingCcc.toFixed(2)} CCC
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Статистика с правильной шириной как в слотах */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '15px',
          width: '93%',
          maxWidth: '93%',
          marginBottom: '25px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          {/* Энергия с прогресс-баром */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(0,0,0,0.4), rgba(20,20,20,0.4))',
            border: `2px solid ${colorStyle}`,
            borderRadius: '18px',
            padding: '18px 15px',
            textAlign: 'center',
            boxShadow: `0 8px 32px ${colorStyle}20`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Прогресс-бар фон */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '0 0 16px 16px'
            }}>
              <div style={{
                height: '100%',
                background: `linear-gradient(90deg, ${colorStyle}, ${colorStyle}80)`,
                width: `${energyPercentage}%`,
                transition: 'width 0.3s ease',
                borderRadius: '0 0 16px 16px'
              }} />
            </div>
            
            <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>⚡</div>
            <div style={{ 
              color: colorStyle, 
              fontWeight: 'bold', 
              fontSize: 'clamp(1rem, 3vw, 1.2rem)',
              textShadow: `0 0 10px ${colorStyle}`
            }}>
              {tapperStatus.energy} / {tapperStatus.maxEnergy}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '5px' }}>
              {t.games.tapper.energy}
            </div>
            {tapperStatus.energy < tapperStatus.maxEnergy && (
              <div style={{ 
                color: warningColor, 
                fontSize: '0.7rem', 
                marginTop: '8px',
                fontWeight: '500'
              }}>
                {t.games.tapper.restoreTime}: {getEnergyRestoreTime()}
              </div>
            )}
          </div>

          {/* Доход за тап с алмазом 💠 */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(0,0,0,0.4), rgba(20,20,20,0.4))',
            border: `2px solid ${colorStyle}`,
            borderRadius: '18px',
            padding: '18px 15px',
            textAlign: 'center',
            boxShadow: `0 8px 32px ${colorStyle}20`,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '8px' }}>💠</div>
            <div style={{ 
              color: colorStyle, 
              fontWeight: 'bold', 
              fontSize: 'clamp(1rem, 3vw, 1.2rem)',
              textShadow: `0 0 10px ${colorStyle}`
            }}>
              +{tapperStatus.cccPerTap} CCC
            </div>
            <div style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '5px' }}>
              {t.games.tapper.perTap}
            </div>
          </div>
        </div>

        {/* Блок рекламы с правильной шириной и padding */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(0,0,0,0.4), rgba(20,20,20,0.4))',
          border: `2px solid ${colorStyle}`,
          borderRadius: '20px',
          padding: '20px',
          marginTop: '25px',
          textAlign: 'center',
          boxShadow: `0 8px 32px ${colorStyle}20`,
          width: '93%',
          maxWidth: '93%',
          backdropFilter: 'blur(10px)',
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '20px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📺</div>
              <div style={{ 
                color: colorStyle, 
                fontWeight: 'bold', 
                fontSize: '1.3rem',
                textShadow: `0 0 10px ${colorStyle}`
              }}>
                {tapperStatus.adsWatched} / 20
              </div>
              <div style={{ color: '#ccc', fontSize: '0.85rem' }}>
                {t.games.tapper.adsToday}
              </div>
            </div>
            <div style={{ 
              color: colorStyle, 
              fontSize: '2.5rem',
              textShadow: `0 0 15px ${colorStyle}`
            }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>⚡</div>
              <div style={{ 
                color: colorStyle, 
                fontWeight: 'bold', 
                fontSize: '1.3rem',
                textShadow: `0 0 10px ${colorStyle}`
              }}>
                +100
              </div>
              <div style={{ color: '#ccc', fontSize: '0.85rem' }}>
                {t.games.tapper.energy}
              </div>
            </div>
          </div>
          
          {/* Кнопка рекламы */}
          {tapperStatus.canWatchAd ? (
            <button
              onClick={handleWatchAd}
              disabled={isWatchingAd}
              style={{
                padding: '15px 30px',
                background: isWatchingAd 
                  ? 'rgba(128,128,128,0.3)'
                  : `linear-gradient(135deg, ${colorStyle}20, ${colorStyle}40)`,
                border: `2px solid ${isWatchingAd ? '#555' : colorStyle}`,
                borderRadius: '18px',
                color: isWatchingAd ? '#888' : colorStyle,
                cursor: isWatchingAd ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textShadow: isWatchingAd ? 'none' : `0 0 12px ${colorStyle}`,
                transition: 'all 0.3s ease',
                width: '100%',
                backdropFilter: 'blur(5px)'
              }}
            >
              {isWatchingAd ? '⏳ Просмотр...' : `📺 ${t.games.tapper.watchAd}`}
            </button>
          ) : (
            <div style={{
              padding: '15px 30px',
              background: `rgba(255, 165, 0, 0.2)`,
              border: `2px solid ${warningColor}`,
              borderRadius: '18px',
              color: warningColor,
              fontSize: '1rem',
              fontWeight: 'bold',
              backdropFilter: 'blur(5px)'
            }}>
              🚫 {t.games.tapper.adLimitReached}
            </div>
          )}
        </div>

        {/* Сообщения с правильной шириной как в слотах */}
        {tapperStatus.energy <= 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.15), rgba(255, 165, 0, 0.25))',
            border: `2px solid ${warningColor}`,
            borderRadius: '18px',
            padding: '20px',
            margin: '25px auto',
            textAlign: 'center',
            color: warningColor,
            width: '93%',
            maxWidth: '93%',
            backdropFilter: 'blur(10px)',
            boxShadow: `0 8px 32px ${warningColor}20`
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚡</div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {t.games.tapper.energyEmpty}
            </div>
            <small style={{ opacity: 0.9 }}>
              {t.games.tapper.energyRestore}
            </small>
          </div>
        )}

        {error && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.25))',
            border: `2px solid ${errorColor}`,
            borderRadius: '18px',
            padding: '20px',
            margin: '25px auto',
            textAlign: 'center',
            color: errorColor,
            width: '93%',
            maxWidth: '93%',
            backdropFilter: 'blur(10px)',
            boxShadow: `0 8px 32px ${errorColor}20`
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>❌</div>
            <div style={{ fontWeight: 'bold' }}>{error}</div>
          </div>
        )}

        {/* ✅ Кнопка назад КАК В СЛОТАХ */}
        <button
          onClick={() => navigate('/games')}
          style={{
            padding: '12px 25px',
            background: `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
            border: `2px solid ${colorStyle}`,
            borderRadius: '10px',
            color: colorStyle,
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${colorStyle}`,
            boxShadow: `0 0 20px ${colorStyle}`,
            transition: 'all 0.3s ease',
            marginTop: '25px'
          }}
        >
          ← {t.games.backToGames}
        </button>

        {/* Инструкция с правильной шириной и padding */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(0,0,0,0.4), rgba(20,20,20,0.4))',
          border: `1px solid ${colorStyle}50`,
          borderRadius: '20px',
          padding: '20px',
          marginTop: '30px',
          width: '93%',
          maxWidth: '93%',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 8px 32px ${colorStyle}10`,
          marginLeft: 'auto',
          marginRight: 'auto',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ 
            color: colorStyle, 
            marginBottom: '20px',
            fontSize: '1.3rem',
            textShadow: `0 0 10px ${colorStyle}`
          }}>
            📖 {t.games.tapper.howToPlay}
          </h3>
          <div style={{ 
            color: '#ccc', 
            lineHeight: '1.6', 
            textAlign: 'left',
            fontSize: '0.95rem'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px', 
              marginBottom: '15px' 
            }}>
              <span style={{ fontSize: '1.2rem' }}>🎯</span>
              <span><strong>{t.games.tapper.tapAsteroid}</strong></span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px', 
              marginBottom: '15px' 
            }}>
              <span style={{ fontSize: '1.2rem' }}>💰</span>
              <span><strong>{t.games.tapper.collectAccumulated}</strong></span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px', 
              marginBottom: '15px' 
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <span><strong>{t.games.tapper.energyRestores}</strong></span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px', 
              marginBottom: '15px' 
            }}>
              <span style={{ fontSize: '1.2rem' }}>📺</span>
              <span><strong>{t.games.tapper.watchAdForEnergy}</strong></span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '12px' 
            }}>
              <span style={{ fontSize: '1.2rem' }}>🎮</span>
              <span><strong>{t.games.tapper.limits}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS анимации */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px currentColor;
          }
          50% {
            box-shadow: 0 0 20px currentColor;
          }
        }
      `}</style>
    </div>
  );
};

export default TapperGame;