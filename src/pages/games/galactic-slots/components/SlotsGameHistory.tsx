// galactic-slots/components/SlotsGameHistory.tsx

import React from 'react';
import { SlotGameHistory, SlotTranslations } from '../types';
import { formatGameTime, formatProfit, getProfitColor } from '../utils/formatters';

interface SlotsGameHistoryProps {
  recentHistory: SlotGameHistory[];
  onShowFullHistory: () => void;
  colorStyle: string;
  t: SlotTranslations;
}

const SlotsGameHistory: React.FC<SlotsGameHistoryProps> = ({
  recentHistory,
  onShowFullHistory,
  colorStyle,
  t
}) => {
  // Берем только последние 10 игр
  const lastTenGames = recentHistory.slice(0, 10);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      border: `2px solid ${colorStyle}`,
      borderRadius: '10px',
      padding: '15px',
      marginTop: '20px',
      width: '93%',
      maxWidth: '93%',
      boxShadow: `0 0 20px ${colorStyle}`,
      marginLeft: 'auto',
      marginRight: 'auto'
    }}>
      {/* Упрощенный заголовок без количества */}
      <h3 style={{ 
        color: colorStyle, 
        marginBottom: '15px', 
        textAlign: 'center',
        fontSize: '1.1rem',
        textShadow: `0 0 10px ${colorStyle}`
      }}>
        🕒 {t.lastGames} (10)
      </h3>
      
      {lastTenGames.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>
          История игр пуста
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.75rem'
            }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colorStyle}` }}>
                  <th style={{ color: colorStyle, padding: '8px', textAlign: 'left' }}>{t.time}</th>
                  <th style={{ color: colorStyle, padding: '8px', textAlign: 'center' }}>{t.bet}</th>
                  <th style={{ color: colorStyle, padding: '8px', textAlign: 'center' }}>{t.result}</th>
                  <th style={{ color: colorStyle, padding: '8px', textAlign: 'center' }}>{t.outcome}</th>
                </tr>
              </thead>
              <tbody>
                {lastTenGames.map((game) => (
                  <tr key={game.id} style={{ borderBottom: '1px solid #444' }}>
                    <td style={{ color: '#ccc', padding: '8px' }}>
                      {formatGameTime(game.date, 'short')}
                    </td>
                    <td style={{ color: '#ccc', padding: '8px', textAlign: 'center' }}>
                      {game.betAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{ 
                        color: game.result === 'win' ? '#00ff00' : '#ff0000',
                        fontWeight: 'bold'
                      }}>
                        {game.result === 'win' ? '✅' : '❌'} {game.result === 'win' ? t.win : t.loss}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '8px',
                      textAlign: 'center',
                      color: getProfitColor(game.profit),
                      fontWeight: 'bold'
                    }}>
                      {formatProfit(game.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button
              onClick={onShowFullHistory}
              style={{
                padding: '8px 16px',
                background: `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
                border: `2px solid ${colorStyle}`,
                borderRadius: '8px',
                color: colorStyle,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}
            >
              📋 {t.fullHistory}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SlotsGameHistory;