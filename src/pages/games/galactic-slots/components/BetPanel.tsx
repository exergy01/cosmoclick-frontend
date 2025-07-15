// galactic-slots/components/BetPanel.tsx

import React from 'react';
import { GalacticSlotsStatus } from '../types';

interface BetPanelProps {
  gameStatus: GalacticSlotsStatus;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onSpin: () => void;
  onAutoSpin: (count: number) => void;
  onStopAutoSpin: () => void;
  onMaxBet: () => void;
  isSpinning: boolean;
  isAutoSpinning: boolean;
  autoSpinCount: number;
  colorStyle: string;
  t: any;
}

const BetPanel: React.FC<BetPanelProps> = ({
  gameStatus,
  betAmount,
  onBetAmountChange,
  onSpin,
  onAutoSpin,
  onStopAutoSpin,
  onMaxBet,
  isSpinning,
  isAutoSpinning,
  autoSpinCount,
  colorStyle,
  t
}) => {

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(gameStatus.minBet, Math.min(parseInt(e.target.value) || gameStatus.minBet, gameStatus.maxBet));
    onBetAmountChange(value);
  };

  const adjustBet = (delta: number) => {
    const newAmount = Math.max(gameStatus.minBet, Math.min(betAmount + delta, gameStatus.maxBet, gameStatus.balance));
    onBetAmountChange(newAmount);
  };

  const quickBets = [100, 500, 1000, 2500];

  // ИСПРАВЛЕНО: Правильная логика проверки возможности спина
  const canSpin = !isSpinning && 
                 !isAutoSpinning && 
                 gameStatus.canPlayFree && 
                 betAmount >= gameStatus.minBet &&
                 betAmount <= gameStatus.maxBet &&
                 betAmount <= gameStatus.balance;

  // ИСПРАВЛЕНО: Блокировка элементов управления во время игры
  const isGameActive = isSpinning || isAutoSpinning;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      border: `1px solid ${colorStyle}`,
      borderRadius: '15px',
      padding: '20px',
      marginTop: '20px',
      maxWidth: '500px',
      width: '100%',
      // ДОБАВЛЕНО: Визуальная индикация блокировки
      opacity: isGameActive ? 0.7 : 1,
      transition: 'opacity 0.3s ease'
    }}>
      {/* Заголовок */}
      <h3 style={{
        color: colorStyle,
        textAlign: 'center',
        marginBottom: '20px',
        fontSize: '1.2rem',
        textShadow: `0 0 10px ${colorStyle}`
      }}>
        💰 {t.placeBet || 'Сделать ставку'}
      </h3>

      {/* ДОБАВЛЕНО: Индикатор статуса игры */}
      {isGameActive && (
        <div style={{
          textAlign: 'center',
          marginBottom: '15px',
          padding: '10px',
          background: 'rgba(255,165,0,0.2)',
          border: '1px solid #ffa500',
          borderRadius: '8px',
          color: '#ffa500',
          fontWeight: 'bold'
        }}>
          {isAutoSpinning 
            ? `🎰 Автоспин: ${autoSpinCount} осталось...`
            : isSpinning 
            ? '🌀 Вращение...'
            : 'Игра в процессе...'
          }
        </div>
      )}

      {/* Текущая ставка */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px'
      }}>
        <label style={{ color: '#ccc', fontSize: '1rem' }}>
          {t.betAmount || 'Ставка'}:
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <button
            onClick={() => adjustBet(-100)}
            disabled={betAmount <= gameStatus.minBet || isGameActive}
            style={{
              padding: '8px 12px',
              background: (betAmount <= gameStatus.minBet || isGameActive) ? '#444' : `${colorStyle}40`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: (betAmount <= gameStatus.minBet || isGameActive) ? '#888' : colorStyle,
              cursor: (betAmount <= gameStatus.minBet || isGameActive) ? 'not-allowed' : 'pointer',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            -
          </button>
          
          <input
            type="number"
            value={betAmount}
            onChange={handleBetChange}
            min={gameStatus.minBet}
            max={gameStatus.maxBet}
            disabled={isGameActive}
            style={{
              width: '100px',
              padding: '8px',
              textAlign: 'center',
              background: isGameActive ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: isGameActive ? '#888' : 'white',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isGameActive ? 'not-allowed' : 'text'
            }}
          />
          
          <button
            onClick={() => adjustBet(100)}
            disabled={betAmount >= gameStatus.maxBet || betAmount >= gameStatus.balance || isGameActive}
            style={{
              padding: '8px 12px',
              background: (betAmount >= gameStatus.maxBet || betAmount >= gameStatus.balance || isGameActive) ? '#444' : `${colorStyle}40`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: (betAmount >= gameStatus.maxBet || betAmount >= gameStatus.balance || isGameActive) ? '#888' : colorStyle,
              cursor: (betAmount >= gameStatus.maxBet || betAmount >= gameStatus.balance || isGameActive) ? 'not-allowed' : 'pointer',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Быстрые ставки */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '15px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {quickBets.map(amount => (
          <button
            key={amount}
            onClick={() => onBetAmountChange(Math.min(amount, gameStatus.balance, gameStatus.maxBet))}
            disabled={amount > gameStatus.balance || isGameActive}
            style={{
              padding: '6px 12px',
              background: (amount > gameStatus.balance || isGameActive) ? '#444' : `${colorStyle}20`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: (amount > gameStatus.balance || isGameActive) ? '#888' : colorStyle,
              cursor: (amount > gameStatus.balance || isGameActive) ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {amount}
          </button>
        ))}
        
        <button
          onClick={onMaxBet}
          disabled={isGameActive}
          style={{
            padding: '6px 12px',
            background: isGameActive ? '#444' : `${colorStyle}40`,
            border: `1px solid ${colorStyle}`,
            borderRadius: '8px',
            color: isGameActive ? '#888' : colorStyle,
            cursor: isGameActive ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          MAX
        </button>
      </div>

      {/* Возможный выигрыш */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        padding: '10px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '5px' }}>
          Максимальный выигрыш:
        </div>
        <div style={{ 
          color: colorStyle, 
          fontSize: '1.2rem', 
          fontWeight: 'bold',
          textShadow: `0 0 10px ${colorStyle}`
        }}>
          {(betAmount * 5000).toLocaleString()} CCC
        </div>
        <div style={{ 
          color: '#999', 
          fontSize: '0.8rem', 
          marginTop: '5px'
        }}>
          (при комбинации 5x 🌟 WILD)
        </div>
      </div>

      {/* Кнопки */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Кнопка спина */}
        <button
          onClick={onSpin}
          disabled={!canSpin}
          style={{
            padding: '15px 30px',
            background: !canSpin 
              ? '#444' 
              : `linear-gradient(45deg, ${colorStyle}60, ${colorStyle}80)`,
            border: `2px solid ${!canSpin ? '#666' : colorStyle}`,
            borderRadius: '12px',
            color: !canSpin ? '#888' : 'white',
            cursor: !canSpin ? 'not-allowed' : 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: !canSpin ? 'none' : `0 0 10px ${colorStyle}`,
            minWidth: '120px',
            transition: 'all 0.3s ease',
            transform: isSpinning ? 'scale(0.95)' : 'scale(1)',
            animation: isSpinning ? 'spin-button 1s infinite' : 'none'
          }}
        >
          {isSpinning ? '🌀 СПИН...' : '🎰 СПИН'}
        </button>

        {/* Автоспин */}
        {!isAutoSpinning ? (
          <>
            <button
              onClick={() => onAutoSpin(10)}
              disabled={!canSpin}
              style={{
                padding: '12px 20px',
                background: !canSpin ? '#444' : `${colorStyle}40`,
                border: `1px solid ${!canSpin ? '#666' : colorStyle}`,
                borderRadius: '10px',
                color: !canSpin ? '#888' : colorStyle,
                cursor: !canSpin ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              AUTO x10
            </button>
            
            <button
              onClick={() => onAutoSpin(50)}
              disabled={!canSpin}
              style={{
                padding: '12px 20px',
                background: !canSpin ? '#444' : `${colorStyle}40`,
                border: `1px solid ${!canSpin ? '#666' : colorStyle}`,
                borderRadius: '10px',
                color: !canSpin ? '#888' : colorStyle,
                cursor: !canSpin ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              AUTO x50
            </button>
          </>
        ) : (
          <button
            onClick={onStopAutoSpin}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(45deg, #ff4444, #ff6666)',
              border: '2px solid #ff6666',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              textShadow: '0 0 10px #ff4444',
              animation: 'pulse-red 1.5s infinite'
            }}
          >
            ⏹️ СТОП ({autoSpinCount})
          </button>
        )}
      </div>

      {/* Информация о лимитах */}
      <div style={{
        marginTop: '15px',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: '#999'
      }}>
        <div>
          {t.gamesLeft || 'Игр осталось'}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
            {gameStatus.gamesLeft}
          </span> / {5 + gameStatus.dailyAds}
        </div>
        {!gameStatus.canPlayFree && gameStatus.canWatchAd && (
          <div style={{ color: '#ffa500', marginTop: '5px', fontSize: '0.8rem' }}>
            📺 Смотрите рекламу для дополнительных игр
          </div>
        )}
      </div>

      {/* CSS анимации */}
      <style>
        {`
          @keyframes spin-button {
            0% { transform: scale(0.95) rotate(0deg); }
            100% { transform: scale(0.95) rotate(360deg); }
          }
          
          @keyframes pulse-red {
            0%, 100% { 
              background: linear-gradient(45deg, #ff4444, #ff6666);
              transform: scale(1);
            }
            50% { 
              background: linear-gradient(45deg, #ff6666, #ff8888);
              transform: scale(1.05);
            }
          }
          
          /* Убираем стрелочки у input number */
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>
    </div>
  );
};

export default BetPanel;
