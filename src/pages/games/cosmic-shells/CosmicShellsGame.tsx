// cosmic-shells/CosmicShellsGame.tsx
// ✅ ИСПРАВЛЕНО: Мультиязычность, лимиты, результаты в игровом поле

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../context/PlayerContext';
import { useTranslation } from 'react-i18next';

// Компоненты
import CosmicShellsToast from './components/CosmicShellsToast';
import CosmicShellsBetPanel from './components/CosmicShellsBetPanel';
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
  const { player, currentSystem, setPlayer } = usePlayer();
  const navigate = useNavigate();
  
  const colorStyle = player?.color || '#00f0ff';
  const warningColor = '#ffa500';
  
  // Локализация
  const t = getTranslation(i18n.language);
  
  // Хуки состояния
  const { 
    gameStatus, 
    loading, 
    updateLocalStatus,
    forceRefresh 
  } = useGameStatus(player?.telegram_id);
  
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
  
  // ✅ ВОССТАНОВЛЕНО: Обновление баланса как в слотах
  const handlePlayerBalanceUpdate = useCallback((newBalance: number) => {
    console.log('🛸 Frontend: Updating player balance:', newBalance);
    if (player) {
      setPlayer({
        ...player,
        ccc: newBalance
      });
    }
  }, [player, setPlayer]);
  
  // ✅ ВОССТАНОВЛЕНО: Локальное обновление статуса
  const handleLocalStatusUpdate = useCallback((newStatus: any) => {
    console.log('🛸 Frontend: Local status update:', newStatus);
    updateLocalStatus(newStatus);
  }, [updateLocalStatus]);
  
  // ✅ ВОССТАНОВЛЕНО: Обновление истории
  const handleHistoryUpdate = useCallback(() => {
    console.log('🛸 Frontend: Updating game history...');
    refreshHistory();
  }, [refreshHistory]);
  
  // Хук игры с правильными колбэками как в слотах
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
        marginTop: '120px',
        paddingBottom: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* ✅ ИСПРАВЛЕН: Заголовок с мультиязычным подзаголовком */}
        <h1 style={{
          color: colorStyle,
          textShadow: `0 0 15px ${colorStyle}`,
          fontSize: '2rem',
          marginBottom: '5px',
          textAlign: 'center'
        }}>
          🛸 {t.title}
        </h1>
        
        <p style={{
          color: '#ccc',
          fontSize: '1rem',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          {t.subtitle}
        </p>

        {/* ПОРЯДОК 1: Игровое поле с результатами ВНУТРИ - ФИКСИРОВАННАЯ ширина 93% */}
        <div style={{
          width: '93%',
          marginBottom: '15px'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '20px',
            boxShadow: `0 0 30px ${colorStyle}40`
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

            {/* ✅ ПРОСТОЕ отображение результата */}
            {gameState === 'finished' && gameResult && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: gameResult.isWin 
                  ? `rgba(0, 255, 0, 0.1)` 
                  : `rgba(255, 0, 0, 0.1)`,
                border: `2px solid ${gameResult.isWin ? '#00ff00' : '#ff0000'}`,
                borderRadius: '10px',
                textAlign: 'center',
                animation: 'fadeIn 0.5s ease-in'
              }}>
                <h3 style={{ 
                  color: gameResult.isWin ? '#00ff00' : '#ff0000',
                  marginBottom: '10px',
                  fontSize: '1.2rem'
                }}>
                  {gameResult.isWin ? `🎉 ${t.win.toUpperCase()}!` : `💀 ${t.loss.toUpperCase()}!`}
                </h3>
                
                <div style={{ color: '#ccc', lineHeight: '1.5', fontSize: '0.9rem' }}>
                  <p>{t.bet}: {gameResult.betAmount.toLocaleString()} CCC</p>
                  {gameResult.isWin ? (
                    <>
                      <p>{t.win}: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                        {gameResult.winAmount.toLocaleString()} CCC
                      </span></p>
                      <p>{t.profit}: <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                        +{gameResult.profit.toLocaleString()} CCC
                      </span></p>
                    </>
                  ) : (
                    <p style={{ color: '#ff0000' }}>{t.lost}: {gameResult.betAmount.toLocaleString()} CCC</p>
                  )}
                </div>
              </div>
            )}

            {/* CSS для анимации */}
            <style>
              {`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}
            </style>
          </div>
        </div>

        {/* ✅ ИСПРАВЛЕНО: Панель ставки ВСЕГДА видна (как в слотах) - активна/неактивна */}
        <div style={{
          width: '93%',
          marginBottom: '15px'
        }}>
          <CosmicShellsBetPanel
            gameStatus={gameStatus}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
            onStartGame={startGame}
            isSpinning={gameState !== 'waiting'} // ✅ Передаем состояние для блокировки
            colorStyle={colorStyle}
            t={t}
          />
        </div>

        {/* ПОРЯДОК 4: Кнопки РЕКЛАМА и НАЗАД - ФИКСИРОВАННАЯ ширина 93% */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '15px',
          width: '93%'
        }}>
          {/* ✅ ИСПРАВЛЕНО: Кнопка рекламы с правильными лимитами напёрстков */}
          {gameStatus.canWatchAd && gameState === 'waiting' && gameStatus.gamesLeft === 0 && (
            <button
              onClick={watchAd}
              disabled={isWatchingAd}
              style={{
                flex: '1',
                padding: '12px 20px',
                background: isWatchingAd 
                  ? 'rgba(128,128,128,0.3)'
                  : `linear-gradient(45deg, ${warningColor}, #ff8c00)`,
                border: `2px solid ${isWatchingAd ? '#888' : warningColor}`,
                borderRadius: '10px',
                color: isWatchingAd ? '#888' : '#fff',
                cursor: isWatchingAd ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                textShadow: isWatchingAd ? 'none' : `0 0 10px ${warningColor}`,
                boxShadow: `0 0 20px ${warningColor}`,
                transition: 'all 0.3s ease'
              }}
            >
              {isWatchingAd 
                ? `⏳ ${t.watching}...` 
                : `📺 ${t.extraGame} (${gameStatus.dailyAds}/10)`
              }
            </button>
          )}

          {/* Кнопка назад */}
          <button
            onClick={() => navigate('/games')}
            disabled={isWatchingAd}
            style={{
              flex: (gameStatus.canWatchAd && gameState === 'waiting' && gameStatus.gamesLeft === 0) ? '1' : '0 0 200px',
              padding: '12px 20px',
              background: isWatchingAd
                ? 'rgba(128,128,128,0.3)'
                : `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
              border: `2px solid ${isWatchingAd ? '#888' : colorStyle}`,
              borderRadius: '10px',
              color: isWatchingAd ? '#888' : colorStyle,
              cursor: isWatchingAd ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              textShadow: isWatchingAd ? 'none' : `0 0 10px ${colorStyle}`,
              boxShadow: `0 0 20px ${colorStyle}`,
              transition: 'all 0.3s ease'
            }}
          >
            ← {t.backToGames}
          </button>
        </div>

        {/* ✅ ИСПРАВЛЕНО: Информация о лимитах с мультиязычностью */}
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
            📊 {t.dailyStats}
          </div>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            fontSize: '0.8rem'
          }}>
            <div style={{ color: '#ccc' }}>
              {t.gamesPlayed}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.dailyGames}
              </span>
            </div>
            <div style={{ color: '#ccc' }}>
              {t.gamesLeft}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.gamesLeft}
              </span>
            </div>
            <div style={{ color: '#ccc' }}>
              {t.adsWatched}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.dailyAds}/10
              </span>
            </div>
            <div style={{ color: '#ccc' }}>
              {t.balance}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
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
            {t.rtpInfo} | {t.limitInfo}
          </div>
        </div>

        {/* ✅ ЗАКОММЕНТИРОВАНО: Инструкция (убрана нафиг, но не удалена) */}
        {/*
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid ${colorStyle}`,
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '15px',
          textAlign: 'center',
          width: '93%',
          boxShadow: `0 0 20px ${colorStyle}`
        }}>
          <h3 style={{ color: colorStyle, marginBottom: '10px', fontSize: '1rem' }}>
            📖 {t.howToPlay}
          </h3>
          <div style={{ color: '#ccc', lineHeight: '1.4', textAlign: 'left', fontSize: '0.8rem' }}>
            <p>🛸 <strong>{t.rule1}</strong></p>
            <p>🌌 <strong>{t.rule2}</strong></p>
            <p>🕳️ <strong>{t.rule3}</strong></p>
            <p>💰 <strong>{t.rule4}</strong></p>
            <p>📺 <strong>{t.rule5}</strong></p>
          </div>
        </div>
        */}

        {/* ПОРЯДОК 7: История игр - ФИКСИРОВАННАЯ ширина 93% */}
        <div style={{
          width: '93%'
        }}>
          <CosmicShellsGameHistory
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

export default CosmicShellsGame;