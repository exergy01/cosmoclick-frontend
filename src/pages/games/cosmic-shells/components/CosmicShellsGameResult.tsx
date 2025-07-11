// cosmic-shells/components/CosmicShellsGameResult.tsx

import React from 'react';
import { GameResult, CosmicShellsTranslations } from '../types';
import { formatNumber } from '../utils/formatters';

interface CosmicShellsGameResultProps {
  gameResult: GameResult['result'];
  onNewGame: () => void;
  colorStyle: string;
  t: CosmicShellsTranslations;
}

const CosmicShellsGameResult: React.FC<CosmicShellsGameResultProps> = ({
  gameResult,
  onNewGame,
  colorStyle,
  t
}) => {
  if (!gameResult) return null;

  const errorColor = '#ef4444';

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: `2px solid ${gameResult.isWin ? colorStyle : errorColor}`,
      borderRadius: '15px',
      padding: '20px',
      marginTop: '20px',
      textAlign: 'center',
      maxWidth: '400px',
      width: '100%'
    }}>
      <h3 style={{ 
        color: gameResult.isWin ? colorStyle : errorColor,
        marginBottom: '15px',
        fontSize: '1.5rem'
      }}>
        {gameResult.isWin ? `🎉 ${t.win.toUpperCase()}!` : `💀 ${t.loss.toUpperCase()}!`}
      </h3>
      
      <div style={{ color: '#ccc', lineHeight: '1.5' }}>
        <p>{t.bet}: {formatNumber(gameResult.betAmount)} CCC</p>
        {gameResult.isWin ? (
          <>
            <p>{t.win}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
              {formatNumber(gameResult.winAmount)} CCC
            </span></p>
            <p>{t.profit}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
              +{formatNumber(gameResult.profit)} CCC
            </span></p>
          </>
        ) : (
          <p style={{ color: errorColor }}>Потеряно: {formatNumber(gameResult.betAmount)} CCC</p>
        )}
      </div>

      <button
        onClick={onNewGame}
        style={{
          marginTop: '15px',
          padding: '12px 25px',
          background: `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
          border: `2px solid ${colorStyle}`,
          borderRadius: '15px',
          color: colorStyle,
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          textShadow: `0 0 10px ${colorStyle}`
        }}
      >
        🎮 {t.newGame}
      </button>
    </div>
  );
};

export default CosmicShellsGameResult; 
export {}; 
