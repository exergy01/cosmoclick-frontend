 
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import { cosmicShellsApi, CosmicShellsStatus, GameResult } from '../../services/games/cosmicShellsApi';
import ShellsGameField from '../../components/games/ShellsGameField';
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

type GameState = 'waiting' | 'shuffling' | 'choosing' | 'revealing' | 'finished';

const CosmicShellsGame: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem, refreshPlayer } = usePlayer();
  const navigate = useNavigate();
  
  const [gameStatus, setGameStatus] = useState<CosmicShellsStatus>({
    success: false,
    balance: 0,
    dailyGames: 0,
    dailyAds: 0,
    canPlayFree: false,
    canWatchAd: false,
    gamesLeft: 0,
    adsLeft: 0,
    minBet: 100,
    maxBet: 100000,
    winMultiplier: 2,
    stats: {
      total_games: 0,
      total_wins: 0,
      total_losses: 0,
      total_bet: 0,
      total_won: 0,
      best_streak: 0,
      worst_streak: 0
    }
  });
  
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [betAmount, setBetAmount] = useState(1000);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResult['result'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const colorStyle = player?.color || '#00f0ff';
  const warningColor = '#ffa500';
  const errorColor = '#ef4444';

  // Функция для показа уведомлений
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success', duration: number = 4000) => {
    const id = Date.now();
    const newToast: ToastNotification = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  };

  // Компонент уведомлений
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
            case 'success': return colorStyle;
            case 'error': return errorColor;
            case 'warning': return warningColor;
            default: return colorStyle;
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
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
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

  // Загрузка статуса игры
  const loadGameStatus = useCallback(async () => {
    if (!player?.telegram_id) return;
    
    try {
      const status = await cosmicShellsApi.getStatus(player.telegram_id.toString());
      setGameStatus(status);
      
      if (!status.success && status.error) {
        showToast(status.error, 'error');
      }
    } catch (err) {
      showToast('Ошибка загрузки игры', 'error');
    } finally {
      setLoading(false);
    }
  }, [player?.telegram_id]);

  // Загрузка при монтировании
  useEffect(() => {
    loadGameStatus();
  }, [loadGameStatus]);

  // Автообновление статуса каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(loadGameStatus, 30000);
    return () => clearInterval(interval);
  }, [loadGameStatus]);

  // Начать новую игру
  const handleStartGame = async () => {
    if (!player?.telegram_id || gameState !== 'waiting') return;
    
    // Проверка ставки
    if (betAmount < gameStatus.minBet || betAmount > gameStatus.maxBet) {
      showToast(`Ставка должна быть от ${gameStatus.minBet} до ${gameStatus.maxBet} CCC`, 'warning');
      return;
    }

    // Проверка баланса
    if (betAmount > gameStatus.balance) {
      showToast('Недостаточно средств', 'error');
      return;
    }

    // Проверка лимитов
    if (!gameStatus.canPlayFree && !gameStatus.canWatchAd) {
      showToast('Дневной лимит игр исчерпан', 'warning');
      return;
    }

    // Предупреждение о большой ставке
    if (betAmount > gameStatus.balance * 0.1) {
      const confirmed = window.confirm('Вы ставите более 10% от баланса! Уверены?');
      if (!confirmed) return;
    }

    try {
      // Списываем ставку сразу
      const updatedBalance = gameStatus.balance - betAmount;
      setGameStatus(prev => ({ ...prev, balance: updatedBalance }));

      const result = await cosmicShellsApi.startGame(player.telegram_id.toString(), betAmount);
      
      if (result.success && result.gameId) {
        setCurrentGameId(result.gameId);
        setGameState('shuffling');
        setGameResult(null);
        
        // Автоматически переходим к выбору через 5 секунд
        setTimeout(() => {
          setGameState('choosing');
        }, 5000);
        
      } else {
        // Возвращаем ставку при ошибке
        setGameStatus(prev => ({ ...prev, balance: prev.balance + betAmount }));
        showToast(result.error || 'Ошибка создания игры', 'error');
      }
    } catch (err) {
      // Возвращаем ставку при ошибке
      setGameStatus(prev => ({ ...prev, balance: prev.balance + betAmount }));
      showToast('Ошибка создания игры', 'error');
    }
  };

  // Выбор тарелки
  const handleShellClick = async (position: number) => {
    if (!player?.telegram_id || !currentGameId || gameState !== 'choosing') return;
    
    setGameState('revealing');
    
    try {
      const result = await cosmicShellsApi.makeChoice(
        player.telegram_id.toString(), 
        currentGameId, 
        position
      );
      
      if (result.success && result.result) {
        setGameResult(result.result);
        
        // Показываем результат через 2 секунды
        setTimeout(() => {
          setGameState('finished');
          
          if (result.result!.isWin) {
            showToast(
              `🎉 Выигрыш ${result.result!.winAmount} CCC! (+${result.result!.profit})`,
              'success',
              5000
            );
          } else {
            showToast(`💀 Проигрыш! Черная дыра поглотила ${result.result!.betAmount} CCC`, 'error', 4000);
          }
          
          // Обновляем данные
          refreshPlayer();
          loadGameStatus();
        }, 2000);
        
      } else {
        setGameState('choosing');
        showToast(result.error || 'Ошибка выбора', 'error');
      }
    } catch (err) {
      setGameState('choosing');
      showToast('Ошибка выбора', 'error');
    }
  };

  // Новая игра
  const handleNewGame = () => {
    setGameState('waiting');
    setCurrentGameId(null);
    setGameResult(null);
  };

  // Просмотр рекламы
  const handleWatchAd = async () => {
    if (!player?.telegram_id || !gameStatus.canWatchAd || isWatchingAd) return;
    
    setIsWatchingAd(true);
    
    try {
      await mockAdService.showRewardedAd('extra_game', 'cosmic_shells');
      
      const result = await cosmicShellsApi.watchAd(player.telegram_id.toString());
      
      if (result.success) {
        showToast('Получена дополнительная игра!', 'success');
        loadGameStatus();
      } else {
        showToast(result.error || 'Ошибка рекламы', 'error');
      }
    } catch (err) {
      showToast('Ошибка просмотра рекламы', 'error');
    } finally {
      setIsWatchingAd(false);
    }
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
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>🛸</div>
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
          🛸 {t('games.shells.title')}
        </h1>

{/* Статистика игры БЕЗ БАЛАНСА */}
<div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '15px',
          width: '100%',
          maxWidth: '600px',
          marginBottom: '30px'
        }}>
          {/* Игры */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '15px',
            textAlign: 'center',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>🎮</div>
            <div style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.1rem' }}>
              {gameStatus.gamesLeft}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.8rem' }}>Игр осталось</div>
          </div>

          {/* Всего игр */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '15px',
            textAlign: 'center',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>📊</div>
            <div style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.1rem' }}>
              {gameStatus.stats.total_games}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.8rem' }}>Всего игр</div>
          </div>

          {/* Выигрыши */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '15px',
            textAlign: 'center',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>🏆</div>
            <div style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.1rem' }}>
              {gameStatus.stats.total_games > 0 
                ? Math.round((gameStatus.stats.total_wins / gameStatus.stats.total_games) * 100)
                : 0}%
            </div>
            <div style={{ color: '#ccc', fontSize: '0.8rem' }}>Винрейт</div>
          </div>

          {/* Множитель */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '15px',
            textAlign: 'center',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>⭐</div>
            <div style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.1rem' }}>
              x{gameStatus.winMultiplier}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.8rem' }}>Множитель</div>
          </div>

          {/* Прибыль */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '15px',
            textAlign: 'center',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>💰</div>
            <div style={{ 
              color: gameStatus.stats.total_won > gameStatus.stats.total_bet ? colorStyle : '#ef4444', 
              fontWeight: 'bold', 
              fontSize: '1.1rem' 
            }}>
              {gameStatus.stats.total_won > gameStatus.stats.total_bet ? '+' : ''}
              {(gameStatus.stats.total_won - gameStatus.stats.total_bet).toLocaleString()}
            </div>
            <div style={{ color: '#ccc', fontSize: '0.8rem' }}>Прибыль</div>
          </div>
        </div>
        
        {/* Панель ставки */}
        {gameState === 'waiting' && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '30px',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ color: colorStyle, marginBottom: '15px', textAlign: 'center' }}>
              💫 Сделайте ставку
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#ccc', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>
                Сумма ставки (CCC):
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(gameStatus.minBet, parseInt(e.target.value) || gameStatus.minBet))}
                min={gameStatus.minBet}
                max={Math.min(gameStatus.maxBet, gameStatus.balance)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: `1px solid ${colorStyle}`,
                  background: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              />
              <div style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '5px' }}>
                Мин: {gameStatus.minBet.toLocaleString()} | Макс: {gameStatus.maxBet.toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: '15px', textAlign: 'center', color: '#ccc' }}>
              <p>Возможный выигрыш: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {(betAmount * gameStatus.winMultiplier).toLocaleString()} CCC
              </span></p>
            </div>

            <button
              onClick={handleStartGame}
              disabled={!gameStatus.canPlayFree || betAmount > gameStatus.balance}
              style={{
                width: '100%',
                padding: '15px',
                background: gameStatus.canPlayFree && betAmount <= gameStatus.balance
                  ? `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`
                  : 'rgba(128,128,128,0.3)',
                border: `2px solid ${gameStatus.canPlayFree && betAmount <= gameStatus.balance ? colorStyle : '#888'}`,
                borderRadius: '15px',
                color: gameStatus.canPlayFree && betAmount <= gameStatus.balance ? colorStyle : '#888',
                cursor: gameStatus.canPlayFree && betAmount <= gameStatus.balance ? 'pointer' : 'not-allowed',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textShadow: gameStatus.canPlayFree && betAmount <= gameStatus.balance ? `0 0 10px ${colorStyle}` : 'none'
              }}
            >
              🛸 Начать игру
            </button>
          </div>
        )}

        {/* Игровое поле */}
        <ShellsGameField
          gameState={gameState}
          onShellClick={handleShellClick}
          revealedPositions={gameResult?.positions}
          winningPosition={gameResult?.winningPosition}
          chosenPosition={gameResult?.chosenPosition}
          colorStyle={colorStyle}
        />

        {/* Результат игры */}
        {gameState === 'finished' && gameResult && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: `2px solid ${gameResult.isWin ? colorStyle : errorColor}`,
            borderRadius: '15px',
            padding: '20px',
            marginTop: '20px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{ 
              color: gameResult.isWin ? colorStyle : errorColor,
              marginBottom: '15px',
              fontSize: '1.5rem'
            }}>
              {gameResult.isWin ? '🎉 ВЫИГРЫШ!' : '💀 ПРОИГРЫШ!'}
            </h3>
            
            <div style={{ color: '#ccc', lineHeight: '1.5' }}>
              <p>Ставка: {gameResult.betAmount.toLocaleString()} CCC</p>
              {gameResult.isWin ? (
                <>
                  <p>Выигрыш: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                    {gameResult.winAmount.toLocaleString()} CCC
                  </span></p>
                  <p>Прибыль: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                    +{gameResult.profit.toLocaleString()} CCC
                  </span></p>
                </>
              ) : (
                <p style={{ color: errorColor }}>Потеряно: {gameResult.betAmount.toLocaleString()} CCC</p>
              )}
            </div>

            <button
              onClick={handleNewGame}
              style={{
                marginTop: '15px',
                padding: '12px 25px',
                background: `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
                border: `2px solid ${colorStyle}`,
                borderRadius: '15px',
                color: colorStyle,
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                textShadow: `0 0 10px ${colorStyle}`
              }}
            >
              🎮 Новая игра
            </button>
          </div>
        )}

        {/* Кнопки управления */}
        <div style={{
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '30px'
        }}>
          {/* Кнопка рекламы */}
          {gameStatus.canWatchAd && gameState === 'waiting' && !gameStatus.canPlayFree && (
            <button
              onClick={handleWatchAd}
              disabled={isWatchingAd}
              style={{
                padding: '12px 25px',
                background: isWatchingAd 
                  ? 'rgba(128,128,128,0.3)'
                  : `linear-gradient(45deg, ${warningColor}20, ${warningColor}40)`,
                border: `2px solid ${isWatchingAd ? '#888' : warningColor}`,
                borderRadius: '15px',
                color: isWatchingAd ? '#888' : warningColor,
                cursor: isWatchingAd ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                textShadow: isWatchingAd ? 'none' : `0 0 10px ${warningColor}`
              }}
            >
              {isWatchingAd ? '⏳ Просмотр...' : '📺 +1 игра'}
            </button>
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
              transition: 'all 0.3s ease'
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
        </div>

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
            📖 {t('games.shells.howToPlay')}
          </h3>
          <div style={{ color: '#ccc', lineHeight: '1.5', textAlign: 'left' }}>
            <p>🛸 <strong>{t('games.shells.rule1')}</strong></p>
            <p>🌌 <strong>{t('games.shells.rule2')}</strong></p>
            <p>🕳️ <strong>{t('games.shells.rule3')}</strong></p>
            <p>💰 <strong>{t('games.shells.rule4')}</strong></p>
            <p>📺 <strong>{t('games.shells.rule5')}</strong></p>
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
      `}</style>
    </div>
  );
};

export default CosmicShellsGame;