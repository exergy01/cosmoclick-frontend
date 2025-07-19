// galactic-slots/components/BetPanel.tsx
// ✅ ИСПРАВЛЕНО: Переводы через react-i18next

import React, { useState, useEffect } from 'react';
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
  t: (key: string) => string;
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
  const [inputValue, setInputValue] = useState<string>(betAmount.toString());

  // Синхронизируем значение при изменении извне
  useEffect(() => {
    setInputValue(betAmount.toString());
  }, [betAmount]);

  // Обработчик ввода - разрешает только цифры
  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Разрешаем только цифры и пустую строку
    if (value === '' || /^[0-9]*$/.test(value)) {
      setInputValue(value);
      const numValue = value === '' ? 0 : parseInt(value, 10);
      onBetAmountChange(numValue);
    }
  };

  // Проверка валидности ставки
  const getBetValidation = () => {
    if (betAmount < gameStatus.minBet) {
      return { 
        isValid: false, 
        error: formatTranslation(t('games.slots.errors.betTooLow'), { min: gameStatus.minBet }) 
      };
    }
    if (betAmount > gameStatus.maxBet) {
      return { 
        isValid: false, 
        error: formatTranslation(t('games.slots.errors.betTooHigh'), { max: gameStatus.maxBet }) 
      };
    }
    if (betAmount > gameStatus.balance) {
      return { 
        isValid: false, 
        error: t('games.slots.errors.insufficientFunds')
      };
    }
    return { isValid: true, error: '' };
  };

  const validation = getBetValidation();

  return (
    <div style={{ 
      background: 'rgba(0,0,0,0.4)', 
      border: `2px solid ${colorStyle}`, 
      borderRadius: '10px', 
      padding: '15px', 
      marginTop: '0px', 
      width: '93%', 
      maxWidth: '93%', 
      opacity: isSpinning ? 0.7 : 1, 
      transition: 'opacity 0.3s ease', 
      boxShadow: `0 0 20px ${colorStyle}`, 
      marginLeft: 'auto', 
      marginRight: 'auto' 
    }}>
      <h3 style={{
        color: colorStyle,
        textAlign: 'center',
        marginBottom: '15px',
        fontSize: '1.1rem',
        textShadow: `0 0 10px ${colorStyle}`
      }}>
        💰 {t('games.slots.placeBet')}
      </h3>

      {/* Основной блок ввода ставки */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '15px',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button
            onClick={() => onBetAmountChange(gameStatus.minBet)}
            disabled={isSpinning}
            style={{
              padding: '10px',
              background: isSpinning ? '#444' : `${colorStyle}40`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: isSpinning ? '#888' : colorStyle,
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            MIN
          </button>
          
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={handleBetChange}
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
          
          <button
            onClick={onMaxBet}
            disabled={isSpinning}
            style={{
              padding: '10px',
              background: isSpinning ? '#444' : `${colorStyle}40`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: isSpinning ? '#888' : colorStyle,
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            MAX
          </button>
        </div>
        
        {/* Отображение ошибок валидации */}
        {!validation.isValid && betAmount > 0 && (
          <div style={{
            color: '#ff4444',
            fontSize: '0.7rem',
            textAlign: 'center'
          }}>
            {validation.error}
          </div>
        )}
      </div>

      {/* Информация о лимитах */}
      <div style={{
        marginTop: '15px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#999'
      }}>
        <div style={{ marginBottom: '5px' }}>
          {t('games.slots.gamesLeft')}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
            {gameStatus.gamesLeft}
          </span>
        </div>
        <div style={{ fontSize: '0.7rem' }}>
          {t('games.slots.dailyTotal')}: {gameStatus.dailyGames} | {t('games.slots.adsWatched')}: {gameStatus.dailyAds}/10
        </div>
        {!gameStatus.canPlayFree && gameStatus.canWatchAd && (
          <div style={{ color: '#ffa500', marginTop: '5px', fontSize: '0.7rem' }}>
            📺 {t('games.slots.watchAdForGames')}
          </div>
        )}
      </div>

      {/* Стили для input */}
      <style>
        {`
          input[type="text"]::-webkit-outer-spin-button,
          input[type="text"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          
          input[type="text"] {
            -moz-appearance: textfield;
          }
        `}
      </style>
    </div>
  );
};

export default BetPanel;