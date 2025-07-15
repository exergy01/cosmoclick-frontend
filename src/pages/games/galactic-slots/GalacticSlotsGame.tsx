// galactic-slots/GalacticSlotsGame.tsx

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

// Локализация
const getTranslation = (language: string) => ({
  title: 'GALACTIC FORTUNE',
  subtitle: 'Космические слоты',
  placeBet: 'Сделать ставку',
  betAmount: 'Ставка',
  spin: 'СПИН',
  gamesLeft: 'Игр осталось',
  extraGame: 'Дополнительная игра',
  watching: 'Смотрим рекламу',
  backToGames: 'К играм',
  loading: 'Загрузка...',
  lastGames: 'Последние игры',
  fullHistory: 'Вся история',
  time: 'Время',
  bet: 'Ставка',
  result: 'Результат',
  outcome: 'Итог',
  win: 'Выигрыш',
  loss: 'Проигрыш',
  errors: {
    betTooLow: 'Минимальная ставка 100 CCC',
    betTooHigh: 'Максимальная ставка 5,000 CCC',
    insufficientFunds: 'Недостаточно средств',
    dailyLimit: 'Лимит игр исчерпан',
    spinError: 'Ошибка спина'
  },
  notifications: {
    winMessage: 'Выигрыш!',
    bigWinMessage: 'Большой выигрыш!',
    lossMessage: 'Проигрыш',
    extraGameReceived: 'Дополнительная игра получена!'
  }
});

const GalacticSlotsGame: React.FC = () => {
  const { i18n } = useTranslation();
  const { player, currentSystem } = usePlayer(); // УБРАЛИ refreshPlayer
  const navigate = useNavigate();
  
  const colorStyle = player?.color || '#00f0ff';
  const warningColor = '#ffa500';
  
  // Локализация
  const t = getTranslation(i18n.language);
  
  // Хуки состояния
  const { gameStatus, loading, loadGameStatus } = useGalacticSlotsStatus(player?.telegram_id);
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
  
  // ИСПРАВЛЕНО: Колбэк БЕЗ перерисовки всей страницы
  const handleDataUpdate = useCallback(() => {
    console.log('🎰 Frontend: Updating only game status...');
    loadGameStatus(); // Только статус игры
    refreshHistory(); // Только история
    // НЕ ОБНОВЛЯЕМ player - чтобы не было перерисовки!
  }, [loadGameStatus, refreshHistory]);
  
  // ИСПРАВЛЕНО: Правильный вызов хука игры
  const {
    gameState,
    betAmount,
    setBetAmount,
    lastResult,
    isWatchingAd,
    spin,
    watchAd,
    setMaxBet
  } = useGalacticSlotsGame(
    player?.telegram_id,  // Первый параметр
    gameStatus,           // Второй параметр
    showToast,           // Третий параметр
    t,                   // Четвертый параметр
    handleDataUpdate     // Пятый параметр
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
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>🎰</div>
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
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          🎰 {t.title}
        </h1>
        
        <p style={{
          color: '#ccc',
          fontSize: '1.2rem',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          {t.subtitle}
        </p>

        {/* Слот-машина */}
        <div style={{
          width: '100%',
          maxWidth: '500px',
          marginBottom: '20px'
        }}>
          <SlotMachine
            gameState={gameState}
            lastResult={lastResult}
            colorStyle={colorStyle}
          />
        </div>

        {/* Панель ставок */}
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

        {/* Кнопки управления */}
        <div style={{
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '20px'
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
                textShadow: isWatchingAd ? 'none' : `0 0 10px ${warningColor}`
              }}
            >
              {isWatchingAd 
                ? `⏳ ${t.watching}...` 
                : `📺 ${t.extraGame} (${gameStatus.dailyAds}/20)`
              }
            </button>
          )}

          {/* Кнопка назад */}
          <button
            onClick={() => navigate('/games')}
            disabled={isWatchingAd || gameState !== 'waiting'}
            style={{
              padding: '12px 25px',
              background: (isWatchingAd || gameState !== 'waiting')
                ? 'rgba(128,128,128,0.3)'
                : `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
              border: `2px solid ${(isWatchingAd || gameState !== 'waiting') ? '#888' : colorStyle}`,
              borderRadius: '15px',
              color: (isWatchingAd || gameState !== 'waiting') ? '#888' : colorStyle,
              cursor: (isWatchingAd || gameState !== 'waiting') ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              textShadow: (isWatchingAd || gameState !== 'waiting') ? 'none' : `0 0 10px ${colorStyle}`
            }}
          >
            ← {t.backToGames}
          </button>
        </div>

        {/* История игр */}
        <SlotsGameHistory
          recentHistory={recentHistory}
          onShowFullHistory={openFullHistory}
          colorStyle={colorStyle}
          t={t}
        />

        {/* Таблица выплат */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${colorStyle}`,
          borderRadius: '15px',
          padding: '20px',
          marginTop: '30px',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h3 style={{ 
            color: colorStyle, 
            textAlign: 'center',
            marginBottom: '15px',
            textShadow: `0 0 10px ${colorStyle}`
          }}>
            💰 Таблица выплат
          </h3>
          
          <div style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>🌟 Квазар (WILD):</strong> x50 / x500 / x5000
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>🚀 Корабль:</strong> x15 / x75 / x500
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>🌌 Галактика:</strong> x10 / x50 / x250
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>⭐ Звезда:</strong> x8 / x40 / x150
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>🌍 Планета:</strong> x4 / x15 / x50
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>☄️ Астероид:</strong> x2 / x5 / x15
            </div>
            
            <div style={{ 
              borderTop: `1px solid ${colorStyle}40`,
              paddingTop: '10px',
              fontSize: '0.8rem',
              color: '#999'
            }}>
              * Коэффициенты для 3/4/5 символов в ряд<br/>
              * WILD удваивает выигрыш<br/>
              * 20 активных линий выплат<br/>
              * RTP: 85% (УЛУЧШЕНО!)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalacticSlotsGame;