// galactic-slots/GalacticSlotsGame.tsx
// ✅ ИСПРАВЛЕНО: Переводы через react-i18next

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../context/PlayerContext';
import { useTranslation } from 'react-i18next';

// Компоненты
import SlotMachine from './components/SlotMachine';
import BetPanel from './components/BetPanel';
import CurrencyPanel from '../../../components/CurrencyPanel';
import CosmicShellsToast from '../cosmic-shells/components/CosmicShellsToast';
import SlotsGameHistory from './components/SlotsGameHistory';
import SlotsHistoryModal from './components/SlotsHistoryModal';

// Хуки
import { useGalacticSlotsStatus } from './hooks/useGalacticSlotsStatus';
import { useGalacticSlotsGame } from './hooks/useGalacticSlotsGame';
import { useToastNotifications } from '../cosmic-shells/hooks/useToastNotifications';
import { useSlotsHistory } from './hooks/useSlotsHistory';

// Утилиты
import { formatTranslation } from './utils/formatters';

const GalacticSlotsGame: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem, setPlayer } = usePlayer();
  const navigate = useNavigate();
  
  const colorStyle = player?.color || '#00f0ff';
  
  // Хуки состояния
  const { 
    gameStatus, 
    loading, 
    updateLocalStatus,
    forceRefresh 
  } = useGalacticSlotsStatus(player?.telegram_id);
  
  const { toasts, showToast, removeToast } = useToastNotifications();
  
  // История игр
  const { 
    recentHistory, 
    fullHistory, 
    historyLoading, 
    showFullHistory, 
    loadRecentHistory,
    openFullHistory, 
    closeFullHistory, 
    refreshHistory 
  } = useSlotsHistory(player?.telegram_id);
  
  // Обновление баланса игрока
  const handlePlayerBalanceUpdate = useCallback((newBalance: number) => {
    if (process.env.NODE_ENV === 'development') console.log('🎰 Frontend: Updating player balance:', newBalance);
    if (player) {
      setPlayer({
        ...player,
        ccc: newBalance
      });
    }
  }, [player, setPlayer]);
  
  // Локальное обновление статуса
  const handleLocalStatusUpdate = useCallback((newStatus: any) => {
    if (process.env.NODE_ENV === 'development') console.log('🎰 Frontend: Local status update:', newStatus);
    updateLocalStatus(newStatus);
  }, [updateLocalStatus]);
  
  // Обновление истории игр
  const handleHistoryUpdate = useCallback(() => {
    if (process.env.NODE_ENV === 'development') console.log('🎰 Frontend: Updating game history...');
    refreshHistory();
  }, [refreshHistory]);
  
  // Хук игры
  const {
    gameState,
    betAmount,
    setBetAmount,
    lastResult,
    isWatchingAd,
    autoSpinActive,
    autoSpinCount,
    spin,
    autoSpin,
    stopAutoSpin,
    watchAd,
    setMaxBet,
    cleanup
  } = useGalacticSlotsGame(
    player?.telegram_id,
    gameStatus,
    showToast,
    t,
    handleLocalStatusUpdate,
    handleHistoryUpdate,
    handlePlayerBalanceUpdate
  );

  // Загрузка истории при монтировании
  useEffect(() => {
    if (player?.telegram_id) {
      loadRecentHistory();
    }
  }, [player?.telegram_id, loadRecentHistory]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Загрузочный экран
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
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>🎰</div>
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
      {/* Уведомления */}
      <CosmicShellsToast 
        toasts={toasts}
        onRemoveToast={removeToast}
        colorStyle={colorStyle}
      />

      {/* Модальное окно истории */}
      <SlotsHistoryModal
        isOpen={showFullHistory}
        gameHistory={fullHistory}
        historyLoading={historyLoading}
        onClose={closeFullHistory}
        colorStyle={colorStyle}
        t={t}
      />

      {/* Верхняя панель с валютами */}
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />

      {/* Основной контент */}
      <div style={{ 
        marginTop: '120px',
        paddingBottom: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* Заголовок - компактный */}
        <h1 style={{
          color: colorStyle,
          textShadow: `0 0 15px ${colorStyle}`,
          fontSize: '2rem',
          marginBottom: '5px',
          textAlign: 'center'
        }}>
          🎰 {t('games.slots.title')}
        </h1>
        
        <p style={{
          color: '#ccc',
          fontSize: '1rem',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          {t('games.slots.subtitle')}
        </p>

        {/* Слот-машина - ФИКСИРОВАННАЯ ширина 93% */}
        <div style={{
          width: '93%',
          marginBottom: '15px'
        }}>
          <SlotMachine
            gameState={gameState}
            lastResult={lastResult}
            colorStyle={colorStyle}
            t={t}
          />
        </div>

        {/* Панель ставок - ФИКСИРОВАННАЯ ширина 93% */}
        <div style={{
          width: '93%',
          marginBottom: '15px'
        }}>
          <BetPanel
            gameStatus={gameStatus}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
            onSpin={spin}
            onMaxBet={setMaxBet}
            isSpinning={gameState !== 'waiting'}
            colorStyle={colorStyle}
            t={t}
          />
        </div>

        {/* Кнопки СПИН и АВТОСПИН - ФИКСИРОВАННАЯ ширина 93% */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '15px',
          width: '93%'
        }}>
          {/* Спин */}
          <button
            onClick={spin}
            disabled={gameState !== 'waiting' || !gameStatus.canPlayFree || isWatchingAd}
            style={{
              flex: '1',
              padding: '12px 20px',
              background: (gameState !== 'waiting' || !gameStatus.canPlayFree || isWatchingAd)
                ? 'rgba(128,128,128,0.3)'
                : `linear-gradient(45deg, ${colorStyle}60, ${colorStyle}80)`,
              border: `2px solid ${(gameState !== 'waiting' || !gameStatus.canPlayFree || isWatchingAd) ? '#888' : colorStyle}`,
              borderRadius: '10px',
              color: (gameState !== 'waiting' || !gameStatus.canPlayFree || isWatchingAd) ? '#888' : 'white',
              cursor: (gameState !== 'waiting' || !gameStatus.canPlayFree || isWatchingAd) ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              textShadow: (gameState !== 'waiting' || !gameStatus.canPlayFree || isWatchingAd) ? 'none' : `0 0 10px ${colorStyle}`,
              boxShadow: `0 0 20px ${colorStyle}`,
              transition: 'all 0.3s ease'
            }}
          >
            🎰 {t('games.slots.spin')}
          </button>

          {/* Автоспин */}
          {(gameStatus.canPlayFree || autoSpinActive) && (
            <button
              onClick={autoSpinActive ? stopAutoSpin : autoSpin}
              disabled={isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive)}
              style={{
                flex: '1',
                padding: '12px 20px',
                background: (isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive))
                  ? 'rgba(128,128,128,0.3)'
                  : autoSpinActive
                    ? `linear-gradient(45deg, #ff4444, #cc0000)`
                    : `linear-gradient(45deg, ${colorStyle}60, ${colorStyle}80)`,
                border: `2px solid ${(isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive)) ? '#888' : autoSpinActive ? '#ff4444' : colorStyle}`,
                borderRadius: '10px',
                color: (isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive)) ? '#888' : 'white',
                cursor: (isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive)) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                textShadow: (isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive)) ? 'none' : `0 0 10px ${autoSpinActive ? '#ff4444' : colorStyle}`,
                boxShadow: `0 0 20px ${autoSpinActive ? '#ff4444' : colorStyle}`,
                transition: 'all 0.3s ease'
              }}
            >
              {autoSpinActive 
                ? `🛑 ${t('games.slots.stopAutoSpin')} (${autoSpinCount}/20)`
                : `🔄 ${t('games.slots.autoSpin')}`
              }
            </button>
          )}
        </div>

        {/* Кнопки РЕКЛАМА и НАЗАД - ФИКСИРОВАННАЯ ширина 93% */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '15px',
          width: '93%'
        }}>
          {/* Кнопка рекламы */}
          {gameStatus.canWatchAd && gameState === 'waiting' && gameStatus.gamesLeft === 0 && !autoSpinActive && (
            <button
              onClick={watchAd}
              disabled={isWatchingAd}
              style={{
                flex: '1',
                padding: '12px 20px',
                background: isWatchingAd 
                  ? 'rgba(128,128,128,0.3)'
                  : `linear-gradient(45deg, #ffa500, #ff8c00)`,
                border: `2px solid ${isWatchingAd ? '#888' : '#ffa500'}`,
                borderRadius: '10px',
                color: isWatchingAd ? '#888' : '#fff',
                cursor: isWatchingAd ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                textShadow: isWatchingAd ? 'none' : `0 0 10px #ffa500`,
                boxShadow: '0 0 20px #ffa500',
                transition: 'all 0.3s ease'
              }}
            >
              {isWatchingAd 
                ? `⏳ ${t('games.slots.watching')}...` 
                : `📺 +20 ${t('games.slots.extraGame')} (${gameStatus.dailyAds}/10)`
              }
            </button>
          )}

          {/* Кнопка назад */}
          <button
            onClick={() => navigate('/games')}
            disabled={isWatchingAd || autoSpinActive}
            style={{
              flex: gameStatus.canWatchAd && gameState === 'waiting' && gameStatus.gamesLeft === 0 && !autoSpinActive ? '1' : '0 0 200px',
              padding: '12px 20px',
              background: (isWatchingAd || autoSpinActive)
                ? 'rgba(128,128,128,0.3)'
                : `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
              border: `2px solid ${(isWatchingAd || autoSpinActive) ? '#888' : colorStyle}`,
              borderRadius: '10px',
              color: (isWatchingAd || autoSpinActive) ? '#888' : colorStyle,
              cursor: (isWatchingAd || autoSpinActive) ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              textShadow: (isWatchingAd || autoSpinActive) ? 'none' : `0 0 10px ${colorStyle}`,
              boxShadow: `0 0 20px ${colorStyle}`,
              transition: 'all 0.3s ease'
            }}
          >
            ← {t('games.backToGames')}
          </button>
        </div>

        {/* Статус автоспина - ФИКСИРОВАННАЯ ширина 93% */}
        {autoSpinActive && (
          <div style={{
            marginBottom: '15px',
            padding: '10px 20px',
            background: 'rgba(255,68,68,0.2)',
            border: '2px solid #ff4444',
            borderRadius: '10px',
            color: '#ff4444',
            fontSize: '1rem',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '0 0 10px #ff4444',
            boxShadow: '0 0 20px rgba(255,68,68,0.3)',
            width: '93%'
          }}>
            🔄 {formatTranslation(t('games.slots.autoSpinActive') + ': {count}/20 ' + t('games.slots.spinsCount'), { count: autoSpinCount })}
            <div style={{ 
              fontSize: '0.8rem',
              marginTop: '3px',
              color: '#ffaaaa'
            }}>
              {t('games.slots.nextSpin')} {gameState === 'waiting' ? t('games.slots.ready') : t('games.slots.waiting')}
            </div>
          </div>
        )}

        {/* Информация о лимитах - ФИКСИРОВАННАЯ ширина 93% */}
        <div style={{
          marginBottom: '15px',
          padding: '12px',
          background: 'rgba(0,0,0,0.4)',
          border: `2px solid ${colorStyle}`,
          borderRadius: '10px',
          textAlign: 'center',
          boxShadow: `0 0 20px ${colorStyle}`,
          width: '93%'
        }}>
          <div style={{ 
            color: colorStyle, 
            fontSize: '0.9rem',
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            📊 {t('games.slots.dailyStats')}
          </div>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            fontSize: '0.8rem'
          }}>
            <div style={{ color: '#ccc' }}>
              {t('games.slots.gamesPlayed')}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.dailyGames}
              </span>
            </div>
            <div style={{ color: '#ccc' }}>
              {t('games.slots.gamesRemaining')}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.gamesLeft}
              </span>
            </div>
            <div style={{ color: '#ccc' }}>
              {t('games.slots.adsWatched')}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.dailyAds}/10
              </span>
            </div>
            <div style={{ color: '#ccc' }}>
              {t('games.balance')}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.balance.toLocaleString()} CCC
              </span>
            </div>
          </div>
          <div style={{ 
            marginTop: '8px',
            padding: '6px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '4px',
            fontSize: '0.7rem',
            color: '#aaa'
          }}>
            {t('games.slots.rtpInfo')} | {t('games.slots.autoSpinInfo')} | {t('games.slots.limitInfo')}
          </div>
        </div>

        {/* История игр - ФИКСИРОВАННАЯ ширина 93% */}
        <div style={{
          width: '100%'
        }}>
          <SlotsGameHistory
            recentHistory={recentHistory}
            onShowFullHistory={openFullHistory}
            colorStyle={colorStyle}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};

export default GalacticSlotsGame;