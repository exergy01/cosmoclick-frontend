// galactic-slots/components/BetPanel.tsx

import React from 'react';
import { GalacticSlotsStatus } from '../types';
import { formatTranslation } from '../utils/formatters';

interface BetPanelProps {
  gameStatus: GalacticSlotsStatus;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onSpin: () => void;
  onMaxBet: () => void;
  isSpinning: boolean;
  colorStyle: string;
  t: any;
}

const BetPanel: React.FC<BetPanelProps> = ({
  gameStatus,
  betAmount,
  onBetAmountChange,
  onSpin,
  onMaxBet,
  isSpinning,
  colorStyle,
  t
}) => {

  // Свободный ввод ставки без автокоррекции
  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onBetAmountChange(value);
  };

  // Функция для проверки валидности ставки
  const getBetValidation = () => {
    if (betAmount < gameStatus.minBet) {
      return { 
        isValid: false, 
        error: formatTranslation(t.errors.betTooLow, { min: gameStatus.minBet }) 
      };
    }
    if (betAmount > gameStatus.maxBet) {
      return { 
        isValid: false, 
        error: formatTranslation(t.errors.betTooHigh, { max: gameStatus.maxBet }) 
      };
    }
    if (betAmount > gameStatus.balance) {
      return { 
        isValid: false, 
        error: t.errors.insufficientFunds 
      };
    }
    return { isValid: true, error: '' };
  };

  const validation = getBetValidation();

  const quickBets = [100, 500, 1000, 2500];

  // Правильная логика проверки возможности спина
  const canSpin = !isSpinning && 
                 gameStatus.canPlayFree && 
                 validation.isValid;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      border: `1px solid ${colorStyle}`,
      borderRadius: '15px',
      padding: '20px',
      marginTop: '20px',
      maxWidth: '500px',
      width: '100%',
      opacity: isSpinning ? 0.7 : 1,
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
        💰 {t.placeBet}
      </h3>

      {/* Индикатор спина */}
      {isSpinning && (
        <div style={{
          textAlign: 'center',
          marginBottom: '15px',
          padding: '10px',
          background: 'rgba(255,165,0,0.2)',
          border: '2px solid #ffa500',
          borderRadius: '8px',
          color: '#ffa500',
          fontWeight: 'bold',
          animation: 'pulse 1s infinite'
        }}>
          🎰 Барабаны вращаются...
        </div>
      )}

      {/* Свободный ввод ставки с валидацией */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px'
      }}>
        <label style={{ color: '#ccc', fontSize: '1rem' }}>
          {t.betAmount}:
        </label>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <input
            type="number"
            value={betAmount}
            onChange={handleBetChange}
            min={gameStatus.minBet}
            max={gameStatus.maxBet}
            disabled={isSpinning}
            style={{
              width: '120px',
              padding: '10px',
              textAlign: 'center',
              background: isSpinning ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              border: `2px solid ${!validation.isValid ? '#ff4444' : colorStyle}`,
              borderRadius: '10px',
              color: isSpinning ? '#888' : !validation.isValid ? '#ff4444' : 'white',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: isSpinning ? 'not-allowed' : 'text'
            }}
          />
          {/* Отображение ошибки валидации */}
          {!validation.isValid && (
            <div style={{
              color: '#ff4444',
              fontSize: '0.7rem',
              marginTop: '4px',
              textAlign: 'center'
            }}>
              {validation.error}
            </div>
          )}
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
            disabled={amount > gameStatus.balance || isSpinning}
            style={{
              padding: '8px 15px',
              background: (amount > gameStatus.balance || isSpinning) ? '#444' : `${colorStyle}20`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: (amount > gameStatus.balance || isSpinning) ? '#888' : colorStyle,
              cursor: (amount > gameStatus.balance || isSpinning) ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              if (amount <= gameStatus.balance && !isSpinning) {
                e.currentTarget.style.background = `${colorStyle}40`;
              }
            }}
            onMouseLeave={e => {
              if (amount <= gameStatus.balance && !isSpinning) {
                e.currentTarget.style.background = `${colorStyle}20`;
              }
            }}
          >
            {amount}
          </button>
        ))}
        
        <button
          onClick={onMaxBet}
          disabled={isSpinning}
          style={{
            padding: '8px 15px',
            background: isSpinning ? '#444' : `${colorStyle}40`,
            border: `1px solid ${colorStyle}`,
            borderRadius: '8px',
            color: isSpinning ? '#888' : colorStyle,
            cursor: isSpinning ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            if (!isSpinning) {
              e.currentTarget.style.background = `${colorStyle}60`;
            }
          }}
          onMouseLeave={e => {
            if (!isSpinning) {
              e.currentTarget.style.background = `${colorStyle}40`;
            }
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
          {(betAmount * 6).toLocaleString()} CCC
        </div>
        <div style={{ 
          color: '#999', 
          fontSize: '0.8rem', 
          marginTop: '5px'
        }}>
          (при комбинации 5x 🌟 WILD x2)
        </div>
      </div>

      {/* Кнопка спина */}
      <div style={{
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={onSpin}
          disabled={!canSpin}
          style={{
            padding: '15px 40px',
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
            minWidth: '150px',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => {
            if (canSpin) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 0 20px ${colorStyle}`;
            }
          }}
          onMouseLeave={e => {
            if (canSpin) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {isSpinning ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ 
                animation: 'spin 1s linear infinite', 
                marginRight: '8px',
                display: 'inline-block'
              }}>
                🎰
              </span>
              {t.spin}...
            </span>
          ) : (
            `🎰 ${t.spin}`
          )}
        </button>
      </div>

      {/* Информация о лимитах */}
      <div style={{
        marginTop: '15px',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: '#999'
      }}>
        <div style={{ marginBottom: '5px' }}>
          {t.gamesLeft}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
            {gameStatus.gamesLeft}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem' }}>
          Всего за день: {gameStatus.dailyGames} | Реклам: {gameStatus.dailyAds}/200
        </div>
        {!gameStatus.canPlayFree && gameStatus.canWatchAd && (
          <div style={{ color: '#ffa500', marginTop: '5px', fontSize: '0.8rem' }}>
            📺 Смотрите рекламу для дополнительных игр
          </div>
        )}
      </div>

      {/* CSS для анимаций */}
      <style>
        {`
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          
          input[type="number"] {
            -moz-appearance: textfield;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
    </div>
  );
};

export default BetPanel;