// cosmic-shells/components/CosmicShellsBetPanel.tsx

import React from 'react';
import { CosmicShellsStatus, CosmicShellsTranslations } from '../types';
import { formatNumber } from '../utils/formatters';

interface CosmicShellsBetPanelProps {
  gameStatus: CosmicShellsStatus;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onStartGame: () => void;
  colorStyle: string;
  t: CosmicShellsTranslations;
}

const CosmicShellsBetPanel: React.FC<CosmicShellsBetPanelProps> = ({
  gameStatus,
  betAmount,
  onBetAmountChange,
  onStartGame,
  colorStyle,
  t
}) => {
  const canStart = gameStatus.canPlayFree && betAmount <= gameStatus.balance;
  const possibleWin = betAmount * gameStatus.winMultiplier;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: `2px solid ${colorStyle}`,
      borderRadius: '15px',
      padding: '20px',
      marginBottom: '30px',
      maxWidth: '400px',
      width: '100%'
    }}>
      <h3 style={{ color: colorStyle, marginBottom: '15px', textAlign: 'center' }}>
        💫 {t.placeBet}
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ color: '#ccc', fontSize: '0.9rem', display: 'block', marginBottom: '5px' }}>
          {t.betAmount}
        </label>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => onBetAmountChange(Math.max(gameStatus.minBet, parseInt(e.target.value) || gameStatus.minBet))}
          min={gameStatus.minBet}
          max={Math.min(gameStatus.maxBet, gameStatus.balance)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            border: `1px solid ${colorStyle}`,
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            fontSize: '1rem',
            // Убираем стрелочки
            appearance: 'textfield',
            MozAppearance: 'textfield',
            WebkitAppearance: 'none'
          }}
        />
        <div style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '5px' }}>
          {t.min}: {formatNumber(gameStatus.minBet)} | {t.max}: {formatNumber(gameStatus.maxBet)}
        </div>
      </div>

      <div style={{ marginBottom: '15px', textAlign: 'center', color: '#ccc' }}>
        <p>{t.possibleWin} <span style={{ color: colorStyle, fontWeight: 'bold' }}>
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
            ? `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`
            : 'rgba(128,128,128,0.3)',
          border: `2px solid ${canStart ? colorStyle : '#888'}`,
          borderRadius: '15px',
          color: canStart ? colorStyle : '#888',
          cursor: canStart ? 'pointer' : 'not-allowed',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          textShadow: canStart ? `0 0 10px ${colorStyle}` : 'none'
        }}
      >
        🛸 {t.startGame}
      </button>

      {/* CSS для убирания стрелочек */}
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default CosmicShellsBetPanel; 
export {}; 
