// cosmic-shells/CosmicShellsGame.tsx

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../context/PlayerContext';
import { useTranslation } from 'react-i18next';

// Компоненты
import CosmicShellsToast from './components/CosmicShellsToast';
import CosmicShellsStats from './components/CosmicShellsStats';
import CosmicShellsBetPanel from './components/CosmicShellsBetPanel';
import CosmicShellsGameResult from './components/CosmicShellsGameResult';
import CosmicShellsGameHistory from './components/CosmicShellsGameHistory';
import CosmicShellsHistoryModal from './components/CosmicShellsHistoryModal';
import ShellsGameField from '../../../components/games/ShellsGameField';
import CurrencyPanel from '../../../components/CurrencyPanel';

// Хуки
import { useGameStatus } from './hooks/useGameStatus';
import { useGameHistory } from './hooks/useGameHistory';
import { useCosmicShellsGame } from './hooks/useCosmicShellsGame';
import { useToastNotifications } from './hooks/useToastNotifications';

// Локализация
import { getTranslation } from './locales';

const CosmicShellsGame: React.FC = () => {
  const { i18n } = useTranslation();
  const { player, currentSystem, refreshPlayer } = usePlayer();
  const navigate = useNavigate();
  
  const colorStyle = player?.color || '#00f0ff';
  const warningColor = '#ffa500';
  
  // Локализация
  const t = getTranslation(i18n.language);
  
  // Хуки состояния
  const { gameStatus, loading, loadGameStatus } = useGameStatus(player?.telegram_id);
  const { 
    recentHistory, 
    fullHistory, 
    historyLoading, 
    showFullHistory, 
    loadRecentHistory,
    openFullHistory, 
    closeFullHistory, 
    refreshHistory 
  } = useGameHistory(player?.telegram_id);
  const { toasts, showToast, removeToast } = useToastNotifications();
  
  // Колбэк для обновления всех данных
  const handleDataUpdate = useCallback(() => {
    console.log('🎮 Frontend: Updating all game data...');
    refreshPlayer();
    loadGameStatus();
    refreshHistory();
  }, [refreshPlayer, loadGameStatus, refreshHistory]);
  
  // Передаем колбэк в хук игры
  const {
    gameState,
    betAmount,
    setBetAmount,
    gameResult,
    isWatchingAd,
    startGame,
    makeChoice,
    newGame,
    watchAd
  } = useCosmicShellsGame(
    player?.telegram_id,
    gameStatus,
    showToast,
    t,
    handleDataUpdate
  );

  // Загрузка истории при монтировании
  useEffect(() => {
    if (player?.telegram_id) {
      loadRecentHistory();
    }
  }, [player?.telegram_id, loadRecentHistory]);

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
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>🛸</div>
          <p>{t.loading}</p>
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
      <CosmicShellsHistoryModal
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
          🛸 {t.title}
        </h1>

        {/* Статистика */}
        <CosmicShellsStats
          gameStatus={gameStatus}
          colorStyle={colorStyle}
          t={t}
        />
        
        {/* Панель ставки */}
        {gameState === 'waiting' && (
          <CosmicShellsBetPanel
            gameStatus={gameStatus}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
            onStartGame={startGame}
            colorStyle={colorStyle}
            t={t}
          />
        )}

        {/* Игровое поле */}
        <div style={{
          width: '100%',
          maxWidth: '600px',
          overflow: 'hidden',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <ShellsGameField
            gameState={gameState}
            onShellClick={makeChoice}
            revealedPositions={gameResult?.positions}
            winningPosition={gameResult?.winningPosition}
            chosenPosition={gameResult?.chosenPosition}
            colorStyle={colorStyle}
            t={t}
          />
        </div>

        {/* Результат игры */}
        {gameState === 'finished' && gameResult && (
          <CosmicShellsGameResult
            gameResult={gameResult}
            onNewGame={newGame}
            colorStyle={colorStyle}
            t={t}
          />
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
          {gameStatus.canWatchAd && gameState === 'waiting' && gameStatus.gamesLeft === 0 && (
            <button
              onClick={watchAd}
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
                textShadow: isWatchingAd ? 'none' : `0 0 10px ${warningColor}`,
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              {isWatchingAd 
                ? `⏳ ${t.watching}...` 
                : `📺 ${t.extraGame} (${gameStatus.dailyAds || 0}/20)`
              }
            </button>
          )}

          {/* Кнопка назад */}
          <button
            onClick={() => navigate('/games')}
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
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              if (!isWatchingAd) {
                e.currentTarget.style.background = `linear-gradient(45deg, ${colorStyle}40, ${colorStyle}60)`;
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={e => {
              if (!isWatchingAd) {
                e.currentTarget.style.background = `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`;
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            ← {t.backToGames}
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
            📖 {t.howToPlay}
          </h3>
          <div style={{ color: '#ccc', lineHeight: '1.5', textAlign: 'left' }}>
            <p>🛸 <strong>{t.rule1}</strong></p>
            <p>🌌 <strong>{t.rule2}</strong></p>
            <p>🕳️ <strong>{t.rule3}</strong></p>
            <p>💰 <strong>{t.rule4}</strong></p>
            <p>📺 <strong>{t.rule5}</strong></p>
          </div>
        </div>

        {/* История игр */}
        <CosmicShellsGameHistory
          recentHistory={recentHistory}
          onShowFullHistory={openFullHistory}
          colorStyle={colorStyle}
          t={t}
        />
      </div>
    </div>
  );
};

export default CosmicShellsGame;