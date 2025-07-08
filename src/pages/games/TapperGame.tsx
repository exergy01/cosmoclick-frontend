import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import { tapperApi, TapperStatus } from '../../services/games/tapperApi';
import TapperAsteroid from '../../components/games/TapperAsteroid';
import CurrencyPanel from '../../components/CurrencyPanel';

// Интерфейс для уведомлений
interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
  duration: number;
}

// Mock Ad Service (заглушка)
const mockAdService = {
  async showRewardedAd(type: string, game: string) {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 1000; color: white;
        font-family: Arial; text-align: center;
      `;
      
      let countdown = 3;
      modal.innerHTML = `
        <div style="background: #222; padding: 40px; border-radius: 20px; border: 2px solid #00f0ff;">
          <h2 style="color: #00f0ff; margin-bottom: 20px;">📺 Реклама</h2>
          <p style="font-size: 1.2rem; margin-bottom: 20px;">Просмотр рекламы...</p>
          <div id="countdown" style="font-size: 2rem; color: #00f0ff;">${countdown}</div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const timer = setInterval(() => {
        countdown--;
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
          countdownEl.textContent = countdown.toString();
        }
        
        if (countdown <= 0) {
          clearInterval(timer);
          document.body.removeChild(modal);
          resolve({ success: true, provider: 'mock' });
        }
      }, 1000);
    });
  }
};

const TapperGame: React.FC = () => {
  const { t } = useTranslation();
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

  // Функция для показа уведомлений
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success', duration: number = 3000) => {
    const id = Date.now();
    const newToast: ToastNotification = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Автоматически удаляем уведомление
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  // Функция для удаления уведомления
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Компонент уведомления
  const ToastContainer: React.FC = () => (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
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
              background: 'rgba(0, 0, 0, 0.9)',
              border: `2px solid ${getToastColor()}`,
              borderRadius: '15px',
              padding: '15px 20px',
              color: '#fff',
              boxShadow: `0 0 20px ${getToastColor()}50`,
              cursor: 'pointer',
              animation: 'slideInRight 0.3s ease-out',
              minWidth: '250px',
              maxWidth: '350px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{getToastIcon()}</span>
              <span style={{ 
                color: getToastColor(), 
                fontWeight: 'bold',
                textShadow: `0 0 10px ${getToastColor()}`
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
      setError('Ошибка загрузки игры');
    } finally {
      setLoading(false);
    }
  }, [player?.telegram_id]);

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
      const errorMsg = 'Ошибка тапа';
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
        // Обновляем баланс игрока
        await refreshPlayer();
        
        // Обновляем статус тапалки
        await loadTapperStatus();
        
        // Показываем красивое уведомление
        showToast(
          `💰 Собрано ${result.collectedAmount.toFixed(2)} CCC!`,
          'success',
          4000
        );
      } else {
        const errorMsg = result.error || 'Ошибка сбора';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      const errorMsg = 'Ошибка сбора CCC';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsCollecting(false);
    }
  };

  // Просмотр рекламы
  const handleWatchAd = async () => {
    if (!player?.telegram_id || !tapperStatus.canWatchAd || isWatchingAd) return;
    
    setIsWatchingAd(true);
    
    try {
      await mockAdService.showRewardedAd('energy_boost', 'tapper');
      const result = await tapperApi.watchAd(player.telegram_id.toString());
      
      if (result.success) {
        setTapperStatus(prev => ({
          ...prev,
          energy: Math.min(prev.energy + result.energyAdded, prev.maxEnergy),
          adsWatched: prev.adsWatched + 1,
          canWatchAd: result.adsRemaining > 0
        }));
        setError(null);
        
        // Показываем уведомление о получении энергии
        showToast(
          `⚡ Получено ${result.energyAdded} энергии!`,
          'success',
          3000
        );
      } else if (result.error) {
        setError(result.error);
        showToast(result.error, 'error');
      }
    } catch (err) {
      const errorMsg = 'Ошибка просмотра рекламы';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsWatchingAd(false);
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
        color: '#fff'
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          padding: '30px',
          borderRadius: '20px',
          border: `2px solid ${colorStyle}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⚡</div>
          <p>{t('loading')}</p>
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
        marginTop: '150px', 
        paddingBottom: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1
      }}>
        {/* Заголовок */}
        <h1 style={{
          color: colorStyle,
          textShadow: `0 0 15px ${colorStyle}`,
          fontSize: '2.5rem',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          💥 {t('games.tapper.title')}
        </h1>

        {/* Статистика */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          width: '100%',
          maxWidth: '600px',
          marginBottom: '30px'
        }}>
          {/* Энергия */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '15px',
            textAlign: 'center',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>⚡</div>
            <div style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.2rem' }}>
              {tapperStatus.energy} / {tapperStatus.maxEnergy}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.8rem' }}>
              {t('games.tapper.energy')}
            </div>
            {tapperStatus.energy < tapperStatus.maxEnergy && (
              <div style={{ color: warningColor, fontSize: '0.7rem', marginTop: '5px' }}>
                {t('games.tapper.restoreTime')}: {getEnergyRestoreTime()}
              </div>
            )}
          </div>

          {/* Доход с КНОПКОЙ СБОРА */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '15px',
            textAlign: 'center',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>💰</div>
            <div style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.2rem' }}>
              +{tapperStatus.cccPerTap} CCC
            </div>
            <div style={{ color: '#ccc', fontSize: '0.8rem' }}>
              {t('games.tapper.perTap')}
            </div>
            
            {/* КНОПКА СБОРА */}
            <button
              onClick={handleCollectEarned}
              disabled={tapperStatus.pendingCcc <= 0 || isCollecting}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                background: tapperStatus.pendingCcc > 0 
                  ? `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`
                  : 'rgba(128,128,128,0.3)',
                border: `1px solid ${tapperStatus.pendingCcc > 0 ? colorStyle : '#888'}`,
                borderRadius: '10px',
                color: tapperStatus.pendingCcc > 0 ? colorStyle : '#888',
                cursor: tapperStatus.pendingCcc > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                width: '100%',
                textShadow: tapperStatus.pendingCcc > 0 ? `0 0 5px ${colorStyle}` : 'none'
              }}
            >
              {isCollecting ? '⏳' : `💰 ${tapperStatus.pendingCcc.toFixed(2)} CCC`}
            </button>
          </div>
        </div>

        {/* Астероид */}
        <TapperAsteroid
          onTap={handleTap}
          energy={tapperStatus.energy}
          cccPerTap={tapperStatus.cccPerTap}
          colorStyle={colorStyle}
        />

        {/* Блок рекламы ПОД астероидом */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: `2px solid ${colorStyle}`,
          borderRadius: '15px',
          padding: '20px',
          marginTop: '20px',
          textAlign: 'center',
          boxShadow: `0 0 20px ${colorStyle}30`,
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>📺</div>
              <div style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.2rem' }}>
                {tapperStatus.adsWatched} / 20
              </div>
              <div style={{ color: '#ccc', fontSize: '0.8rem' }}>
                {t('games.tapper.adsToday')}
              </div>
            </div>
            <div style={{ color: colorStyle, fontSize: '2rem' }}>→</div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>⚡</div>
              <div style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.2rem' }}>
                +100
              </div>
              <div style={{ color: '#ccc', fontSize: '0.8rem' }}>
                Энергии
              </div>
            </div>
          </div>
          
          {/* Кнопка рекламы */}
          {tapperStatus.canWatchAd ? (
            <button
              onClick={handleWatchAd}
              disabled={isWatchingAd}
              style={{
                padding: '12px 25px',
                background: isWatchingAd 
                  ? 'rgba(128,128,128,0.3)'
                  : `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
                border: `2px solid ${isWatchingAd ? '#888' : colorStyle}`,
                borderRadius: '15px',
                color: isWatchingAd ? '#888' : colorStyle,
                cursor: isWatchingAd ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                textShadow: isWatchingAd ? 'none' : `0 0 10px ${colorStyle}`,
                transition: 'all 0.3s ease',
                width: '100%'
              }}
            >
              {isWatchingAd ? '⏳ Просмотр...' : `📺 ${t('games.tapper.watchAd')}`}
            </button>
          ) : (
            <div style={{
              padding: '12px 25px',
              background: `rgba(255, 165, 0, 0.2)`,
              border: `2px solid ${warningColor}`,
              borderRadius: '15px',
              color: warningColor,
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              🚫 {t('games.tapper.adLimitReached')}
            </div>
          )}
        </div>

        {/* Сообщения */}
        {tapperStatus.energy <= 0 && (
          <div style={{
            background: 'rgba(255, 165, 0, 0.2)',
            border: `2px solid ${warningColor}`,
            borderRadius: '15px',
            padding: '15px',
            margin: '20px 0',
            textAlign: 'center',
            color: warningColor
          }}>
            ⚡ {t('games.tapper.energyEmpty')}
            <br />
            <small>{t('games.tapper.energyRestore')}</small>
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: `2px solid ${errorColor}`,
            borderRadius: '15px',
            padding: '15px',
            margin: '20px 0',
            textAlign: 'center',
            color: errorColor
          }}>
            ❌ {error}
          </div>
        )}

        {/* Кнопка назад */}
        <button
          onClick={() => navigate('/games')}
          style={{
            padding: '12px 25px',
            background: 'linear-gradient(45deg, rgba(128,128,128,0.2), rgba(128,128,128,0.4))',
            border: '2px solid #888',
            borderRadius: '15px',
            color: '#888',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            marginTop: '20px'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#888';
            e.currentTarget.style.borderColor = '#888';
          }}
        >
          ← {t('games.backToGames')}
        </button>

        {/* Инструкция */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${colorStyle}`,
          borderRadius: '15px',
          padding: '20px',
          marginTop: '30px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: colorStyle, marginBottom: '15px' }}>
            📖 {t('games.tapper.howToPlay')}
          </h3>
          <div style={{ color: '#ccc', lineHeight: '1.5', textAlign: 'left' }}>
            <p>🎯 <strong>{t('games.tapper.tapAsteroid')}</strong></p>
            <p>💰 <strong>{t('games.tapper.collectAccumulated')}</strong></p>
            <p>⚡ <strong>{t('games.tapper.energyRestores')}</strong></p>
            <p>📺 <strong>{t('games.tapper.watchAdForEnergy')}</strong></p>
            <p>🎮 <strong>{t('games.tapper.limits')}</strong></p>
          </div>
        </div>
      </div>

      {/* CSS анимации для уведомлений */}
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
      `}</style>
    </div>
  );
};

export default TapperGame;