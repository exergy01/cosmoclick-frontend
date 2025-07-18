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
  // Обработчик изменения ставки
  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Разрешаем пустую строку (для очистки поля)
    if (rawValue === '') {
      onBetAmountChange(0);
      return;
    }
    
    // Оставляем только цифры
    const numericValue = rawValue.replace(/[^0-9]/g, '');
    
    // Если есть цифры - преобразуем в число, иначе 0
    const newValue = numericValue ? parseInt(numericValue, 10) : 0;
    
    // Передаем новое значение, даже если оно вне диапазона
    onBetAmountChange(newValue);
  };

  // Проверка валидности ставки (только для отображения ошибки)
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

  // Проверка возможности спина
  const canSpin = !isSpinning && 
                 gameStatus.canPlayFree && 
                 validation.isValid;

  const handleMinBet = () => {
    onBetAmountChange(gameStatus.minBet);
  };

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
      {/* Заголовок */}
      <h3 style={{
        color: colorStyle,
        textAlign: 'center',
        marginBottom: '15px',
        fontSize: '1.1rem',
        textShadow: `0 0 10px ${colorStyle}`
      }}>
        💰 {t.placeBet}
      </h3>

      {/* Блок с кнопками и вводом ставки */}
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
            onClick={handleMinBet}
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
            value={betAmount === 0 ? '' : betAmount}
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
        {/* Отображение ошибки валидации */}
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
          {t.gamesLeft}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
            {gameStatus.gamesLeft}
          </span>
        </div>
        <div style={{ fontSize: '0.7rem' }}>
          {t.dailyTotal}: {gameStatus.dailyGames} | {t.adsWatched}: {gameStatus.dailyAds}/10
        </div>
        {!gameStatus.canPlayFree && gameStatus.canWatchAd && (
          <div style={{ color: '#ffa500', marginTop: '5px', fontSize: '0.7rem' }}>
            📺 {t.watchAdForGames}
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