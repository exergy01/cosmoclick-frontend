// galactic-slots/components/SlotsGameHistory.tsx

import React from 'react';
import { SlotGameHistory, SlotTranslations } from '../types';
import { formatShortDate, formatProfit, getProfitColor } from '../utils/formatters';

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
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: `1px solid ${colorStyle}`,
      borderRadius: '15px',
      padding: '20px',
      marginTop: '20px',
      maxWidth: '500px',
      width: '100%'
    }}>
      <h3 style={{ 
        color: colorStyle, 
        marginBottom: '15px', 
        textAlign: 'center',
        textShadow: `0 0 10px ${colorStyle}`
      }}>
        🕒 {t.lastGames}
      </h3>
      
      {recentHistory.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>
          {t.loading === 'Загрузка...' ? 'История игр пуста' : 'Game history is empty'}
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
                  <th style={{ 
                    color: colorStyle, 
                    padding: '6px', 
                    textAlign: 'left', 
                    fontSize: '0.7rem',
                    textShadow: `0 0 5px ${colorStyle}`
                  }}>
                    {t.time}
                  </th>
                  <th style={{ 
                    color: colorStyle, 
                    padding: '6px', 
                    textAlign: 'center', 
                    fontSize: '0.7rem',
                    textShadow: `0 0 5px ${colorStyle}`
                  }}>
                    {t.bet}
                  </th>
                  <th style={{ 
                    color: colorStyle, 
                    padding: '6px', 
                    textAlign: 'center', 
                    fontSize: '0.7rem',
                    textShadow: `0 0 5px ${colorStyle}`
                  }}>
                    {t.result}
                  </th>
                  <th style={{ 
                    color: colorStyle, 
                    padding: '6px', 
                    textAlign: 'center', 
                    fontSize: '0.7rem',
                    textShadow: `0 0 5px ${colorStyle}`
                  }}>
                    {t.outcome}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map((game) => (
                  <tr key={game.id} style={{ borderBottom: '1px solid #444' }}>
                    <td style={{ 
                      color: '#ccc', 
                      padding: '6px', 
                      fontSize: '0.65rem' 
                    }}>
                      {formatShortDate(game.date)}
                    </td>
                    <td style={{ 
                      color: '#ccc', 
                      padding: '6px', 
                      textAlign: 'center', 
                      fontSize: '0.65rem' 
                    }}>
                      {game.betAmount.toLocaleString()}
                    </td>
                    <td style={{ 
                      padding: '6px', 
                      textAlign: 'center', 
                      fontSize: '0.65rem' 
                    }}>
                      {game.result === 'win' ? (
                        <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                          ✅ {t.win}
                        </span>
                      ) : (
                        <span style={{ color: '#ff0000', fontWeight: 'bold' }}>
                          ❌ {t.loss}
                        </span>
                      )}
                    </td>
                    <td style={{ 
                      padding: '6px', 
                      textAlign: 'center',
                      color: getProfitColor(game.profit),
                      fontWeight: 'bold',
                      fontSize: '0.65rem'
                    }}>
                      {formatProfit(game.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Кнопка показать всю историю */}
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button
              onClick={onShowFullHistory}
              style={{
                padding: '8px 16px',
                background: `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
                border: `2px solid ${colorStyle}`,
                borderRadius: '10px',
                color: colorStyle,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                textShadow: `0 0 5px ${colorStyle}`,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `linear-gradient(45deg, ${colorStyle}40, ${colorStyle}60)`;
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`;
                e.currentTarget.style.transform = 'scale(1)';
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