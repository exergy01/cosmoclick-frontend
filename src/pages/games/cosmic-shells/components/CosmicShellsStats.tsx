// cosmic-shells/components/CosmicShellsStats.tsx

import React from 'react';
import { CosmicShellsStatus, CosmicShellsTranslations } from '../types';
import { formatProfit, getProfitColor } from '../utils/formatters';

interface CosmicShellsStatsProps {
  gameStatus: CosmicShellsStatus;
  colorStyle: string;
  t: CosmicShellsTranslations;
}

const CosmicShellsStats: React.FC<CosmicShellsStatsProps> = ({
  gameStatus,
  colorStyle,
  t
}) => {
  const profit = gameStatus.stats.total_won - gameStatus.stats.total_bet;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: `2px solid ${colorStyle}`,
      borderRadius: '15px',
      padding: '20px',
      marginBottom: '30px',
      width: '100%',
      maxWidth: '400px',
      boxShadow: `0 0 20px ${colorStyle}30`
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px',
        textAlign: 'center'
      }}>
        {/* Игры осталось */}
        <div>
          <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>🎮</div>
          <div style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.1rem' }}>
            {gameStatus.gamesLeft}
          </div>
          <div style={{ color: '#ccc', fontSize: '0.75rem' }}>{t.gamesLeft}</div>
        </div>

        {/* Множитель */}
        <div>
          <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>⭐</div>
          <div style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.1rem' }}>
            x{gameStatus.winMultiplier}
          </div>
          <div style={{ color: '#ccc', fontSize: '0.75rem' }}>{t.multiplier}</div>
        </div>

        {/* Прибыль */}
        <div>
          <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>💰</div>
          <div style={{ 
            color: getProfitColor(profit), 
            fontWeight: 'bold', 
            fontSize: '1.1rem' 
          }}>
            {formatProfit(profit)}
          </div>
          <div style={{ color: '#ccc', fontSize: '0.75rem' }}>{t.profit}</div>
        </div>
      </div>
    </div>
  );
};

export default CosmicShellsStats; 
export {}; 
