// cosmic-shells/components/CosmicShellsBetPanel.tsx
// ✅ ИСПРАВЛЕНО: Переводы через react-i18next

import React, { useState, useEffect } from 'react';
import { CosmicShellsStatus } from '../types';
import { formatNumber } from '../utils/formatters';

interface CosmicShellsBetPanelProps {
  gameStatus: CosmicShellsStatus;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onStartGame: () => void;
  isSpinning?: boolean;
  colorStyle: string;
  t: (key: string) => string;
}

const CosmicShellsBetPanel: React.FC<CosmicShellsBetPanelProps> = ({
  gameStatus,
  betAmount,
  onBetAmountChange,
  onStartGame,
  isSpinning = false,
  colorStyle,
  t
}) => {
  const [inputValue, setInputValue] = useState<string>(betAmount.toString());

  useEffect(() => {
    setInputValue(betAmount.toString());
  }, [betAmount]);

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '' || /^[0-9]*$/.test(value)) {
      setInputValue(value);
      const numValue = value === '' ? 0 : parseInt(value, 10);
      onBetAmountChange(numValue);
    }
  };

  const getBetValidation = () => {
    if (betAmount < gameStatus.minBet) {
      return { 
        isValid: false, 
        error: `${t('games.shells.minBet')} ${gameStatus.minBet.toLocaleString()} CCC`
      };
    }
    if (betAmount > gameStatus.maxBet) {
      return { 
        isValid: false, 
        error: `${t('games.shells.maxBet')} ${gameStatus.maxBet.toLocaleString()} CCC`
      };
    }
    if (betAmount > gameStatus.balance) {
      return { 
        isValid: false, 
        error: t('games.shells.insufficientFunds')
      };
    }
    return { isValid: true, error: '' };
  };

  const validation = getBetValidation();
  const canStart = gameStatus.canPlayFree && validation.isValid && !isSpinning;
  const possibleWin = betAmount * gameStatus.winMultiplier;

  const setMinBet = () => {
    onBetAmountChange(gameStatus.minBet);
  };

  const setMaxBet = () => {
    const maxPossible = Math.min(gameStatus.maxBet, gameStatus.balance);
    onBetAmountChange(maxPossible);
  };

  return (
    <div style={{ 
      background: 'rgba(0,0,0,0.4)', 
      border: `2px solid ${colorStyle}`, 
      borderRadius: '10px', 
      padding: '15px', 
      width: '93%', 
      maxWidth: '93%', 
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
        💰 {t('games.shells.placeBet')}
      </h3>

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
            onClick={setMinBet}
            disabled={isSpinning}
            style={{
              padding: '10px',
              background: isSpinning ? '#444' : `${colorStyle}40`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: isSpinning ? '#888' : colorStyle,
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              if (!isSpinning) e.currentTarget.style.background = `${colorStyle}60`;
            }}
            onMouseLeave={e => {
              if (!isSpinning) e.currentTarget.style.background = `${colorStyle}40`;
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
              cursor: isSpinning ? 'not-allowed' : 'text',
              appearance: 'textfield',
              MozAppearance: 'textfield',
              WebkitAppearance: 'none'
            }}
          />
          
          <button
            onClick={setMaxBet}
            disabled={isSpinning}
            style={{
              padding: '10px',
              background: isSpinning ? '#444' : `${colorStyle}40`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: isSpinning ? '#888' : colorStyle,
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              if (!isSpinning) e.currentTarget.style.background = `${colorStyle}60`;
            }}
            onMouseLeave={e => {
              if (!isSpinning) e.currentTarget.style.background = `${colorStyle}40`;
            }}
          >
            MAX
          </button>
        </div>
        
        {!validation.isValid && betAmount > 0 && (
          <div style={{
            color: '#ff4444',
            fontSize: '0.8rem',
            textAlign: 'center'
          }}>
            {validation.error}
          </div>
        )}
      </div>

      <div style={{ 
        marginBottom: '15px', 
        textAlign: 'center', 
        color: '#ccc',
        fontSize: '0.9rem'
      }}>
        <p>{t('games.shells.possibleWin')} <span style={{ color: colorStyle, fontWeight: 'bold' }}>
          {formatNumber(possibleWin)} CCC
        </span></p>
      </div>

      <button
        onClick={onStartGame}
        disabled={!canStart}
        style={{
          width: '100%',
          padding: '15px',
          background: canStart
            ? `linear-gradient(45deg, ${colorStyle}60, ${colorStyle}80)`
            : 'rgba(128,128,128,0.3)',
          border: `2px solid ${canStart ? colorStyle : '#888'}`,
          borderRadius: '10px',
          color: canStart ? 'white' : '#888',
          cursor: canStart ? 'pointer' : 'not-allowed',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          textShadow: canStart ? `0 0 10px ${colorStyle}` : 'none',
          boxShadow: `0 0 20px ${colorStyle}`,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={e => {
          if (canStart) {
            e.currentTarget.style.background = `linear-gradient(45deg, ${colorStyle}80, ${colorStyle})`;
            e.currentTarget.style.transform = 'scale(1.02)';
          }
        }}
        onMouseLeave={e => {
          if (canStart) {
            e.currentTarget.style.background = `linear-gradient(45deg, ${colorStyle}60, ${colorStyle}80)`;
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        🛸 {t('games.shells.startGame')}
      </button>

      <div style={{
        marginTop: '15px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#999'
      }}>
        <div style={{ marginBottom: '5px' }}>
          {t('games.shells.gamesLeft')}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
            {gameStatus.gamesLeft}
          </span>
        </div>
        <div style={{ fontSize: '0.7rem' }}>
          {t('games.shells.min')}: {formatNumber(gameStatus.minBet)} | {t('games.shells.max')}: {formatNumber(gameStatus.maxBet)}
        </div>
        {!gameStatus.canPlayFree && gameStatus.canWatchAd && (
          <div style={{ color: '#ffa500', marginTop: '5px', fontSize: '0.7rem' }}>
            📺 {t('games.shells.extraGame')}
          </div>
        )}
      </div>

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

export default CosmicShellsBetPanel;