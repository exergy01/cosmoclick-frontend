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
  autoSpin: 'АВТОСПИН',
  stopAutoSpin: 'СТОП',
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
  const { player, currentSystem, setPlayer } = usePlayer(); // ✅ ИСПРАВЛЕНО: используем setPlayer
  const navigate = useNavigate();
  
  const colorStyle = player?.color || '#00f0ff';
  
  // Локализация
  const t = getTranslation(i18n.language);
  
  // ✅ ИСПРАВЛЕННЫЕ хуки состояния
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
  
  // ✅ ИСПРАВЛЕНО: Обновление баланса игрока через setPlayer
  const handlePlayerBalanceUpdate = useCallback((newBalance: number) => {
    console.log('🎰 Frontend: Updating player balance:', newBalance);
    if (player) {
      setPlayer({
        ...player,
        ccc: newBalance
      });
    }
  }, [player, setPlayer]);
  
  // Локальное обновление статуса
  const handleLocalStatusUpdate = useCallback((newStatus: any) => {
    console.log('🎰 Frontend: Local status update:', newStatus);
    updateLocalStatus(newStatus);
  }, [updateLocalStatus]);
  
  // Обновляем только историю игр
  const handleHistoryUpdate = useCallback(() => {
    console.log('🎰 Frontend: Updating only game history...');
    refreshHistory();
  }, [refreshHistory]);
  
  // ✅ ИСПРАВЛЕННЫЙ хук игры с правильным балансом
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

      {/* ✅ ОБНОВЛЕННАЯ верхняя панель с валютами */}
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

        {/* ✅ ИСПРАВЛЕННАЯ слот-машина */}
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
          {/* ✅ ИСПРАВЛЕНО: Кнопка автоспина всегда видна когда активна */}
          {(gameStatus.canPlayFree || autoSpinActive) && (
            <button
              onClick={autoSpinActive ? stopAutoSpin : autoSpin}
              disabled={isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive)}
              style={{
                padding: '12px 25px',
                background: (isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive))
                  ? 'rgba(128,128,128,0.3)'
                  : autoSpinActive
                    ? `linear-gradient(45deg, #ff4444, #cc0000)`
                    : `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
                border: `2px solid ${(isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive)) ? '#888' : autoSpinActive ? '#ff4444' : colorStyle}`,
                borderRadius: '15px',
                color: (isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive)) ? '#888' : autoSpinActive ? '#fff' : colorStyle,
                cursor: (isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive)) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                textShadow: (isWatchingAd || (!gameStatus.canPlayFree && !autoSpinActive)) ? 'none' : `0 0 10px ${autoSpinActive ? '#ff4444' : colorStyle}`,
                transition: 'all 0.3s ease'
              }}
            >
              {autoSpinActive 
                ? `🛑 ${t.stopAutoSpin} (${autoSpinCount}/100)`
                : `🔄 ${t.autoSpin}`
              }
            </button>
          )}

          {/* ✅ ИСПРАВЛЕНО: Кнопка рекламы не блокирует автоспин */}
          {gameStatus.canWatchAd && gameState === 'waiting' && gameStatus.gamesLeft === 0 && !autoSpinActive && (
            <button
              onClick={watchAd}
              disabled={isWatchingAd}
              style={{
                padding: '12px 25px',
                background: isWatchingAd 
                  ? 'rgba(128,128,128,0.3)'
                  : `linear-gradient(45deg, #ffa500, #ff8c00)`,
                border: `2px solid ${isWatchingAd ? '#888' : '#ffa500'}`,
                borderRadius: '15px',
                color: isWatchingAd ? '#888' : '#fff',
                cursor: isWatchingAd ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                textShadow: isWatchingAd ? 'none' : `0 0 10px #ffa500`
              }}
            >
              {isWatchingAd 
                ? `⏳ ${t.watching}...` 
                : `📺 ${t.extraGame} (${gameStatus.dailyAds}/200)`
              }
            </button>
          )}

          {/* ✅ ИСПРАВЛЕНО: Кнопка назад блокируется только при автоспине */}
          <button
            onClick={() => navigate('/games')}
            disabled={isWatchingAd || autoSpinActive}
            style={{
              padding: '12px 25px',
              background: (isWatchingAd || autoSpinActive)
                ? 'rgba(128,128,128,0.3)'
                : `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
              border: `2px solid ${(isWatchingAd || autoSpinActive) ? '#888' : colorStyle}`,
              borderRadius: '15px',
              color: (isWatchingAd || autoSpinActive) ? '#888' : colorStyle,
              cursor: (isWatchingAd || autoSpinActive) ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              textShadow: (isWatchingAd || autoSpinActive) ? 'none' : `0 0 10px ${colorStyle}`
            }}
          >
            ← {t.backToGames}
          </button>
        </div>

        {/* ✅ УЛУЧШЕННЫЙ статус автоспина */}
        {autoSpinActive && (
          <div style={{
            marginTop: '15px',
            padding: '15px 25px',
            background: 'rgba(255,68,68,0.2)',
            border: '2px solid #ff4444',
            borderRadius: '10px',
            color: '#ff4444',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '0 0 10px #ff4444',
            boxShadow: '0 0 20px rgba(255,68,68,0.3)'
          }}>
            🔄 Автоспин активен: {autoSpinCount}/100 спинов
            <div style={{ 
              fontSize: '0.9rem', 
              marginTop: '5px',
              color: '#ffaaaa'
            }}>
              Следующий спин через {gameState === 'waiting' ? 'готов' : 'ожидание...'}
            </div>
          </div>
        )}

        {/* ✅ УЛУЧШЕННАЯ информация о лимитах */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid ${colorStyle}`,
          borderRadius: '10px',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{ 
            color: colorStyle, 
            fontSize: '1rem', 
            marginBottom: '10px',
            fontWeight: 'bold'
          }}>
            📊 Статистика игры
          </div>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            fontSize: '0.9rem'
          }}>
            <div style={{ color: '#ccc' }}>
              Игр сегодня: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.dailyGames}
              </span>
            </div>
            <div style={{ color: '#ccc' }}>
              Игр осталось: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.gamesLeft}
              </span>
            </div>
            <div style={{ color: '#ccc' }}>
              Реклам: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.dailyAds}/200
              </span>
            </div>
            <div style={{ color: '#ccc' }}>
              Баланс: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                {gameStatus.balance.toLocaleString()} CCC
              </span>
            </div>
          </div>
          <div style={{ 
            marginTop: '10px',
            padding: '8px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '5px',
            fontSize: '0.8rem',
            color: '#aaa'
          }}>
            RTP: ~75% | Автоспин: до 100 спинов | Лимит: 250 игр/день
          </div>
        </div>

        {/* История игр */}
        <SlotsGameHistory
          recentHistory={recentHistory}
          onShowFullHistory={openFullHistory}
          colorStyle={colorStyle}
          t={t}
        />

        {/* ✅ ОБНОВЛЕННАЯ таблица выплат */}
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
              <strong>🌟 Квазар (WILD):</strong> x0.2 / x0.5 / x1.2 (удваивает выигрыш)
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>🚀 Корабль:</strong> x0.15 / x0.4 / x1.0
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>🌌 Галактика:</strong> x0.1 / x0.3 / x0.8
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>⭐ Звезда:</strong> x0.08 / x0.2 / x0.5
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>🌍 Планета:</strong> x0.05 / x0.15 / x0.3
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>☄️ Астероид:</strong> x0.03 / x0.1 / x0.2
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>💀 Черная дыра:</strong> БЛОКИРУЕТ линии выплат
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
              * ✅ ИСПРАВЛЕНО: 25% шанс выигрыша, RTP ~75%<br/>
              * Лимит: 50 игр + 200 за рекламу = 250 игр/день
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalacticSlotsGame;