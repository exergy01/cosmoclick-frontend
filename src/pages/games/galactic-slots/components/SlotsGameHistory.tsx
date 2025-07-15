// galactic-slots/components/SlotsGameHistory.tsx

import React from 'react';
import { SlotGameHistory } from '../types';

interface SlotsGameHistoryProps {
  recentHistory: SlotGameHistory[];
  onShowFullHistory: () => void;
  colorStyle: string;
  t: any;
}

const SlotsGameHistory: React.FC<SlotsGameHistoryProps> = ({
  recentHistory,
  onShowFullHistory,
  colorStyle,
  t
}) => {
  const formatShortDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).slice(0, 8);
  };

  const formatProfit = (profit: number): string => {
    if (profit > 0) {
      return `+${profit.toLocaleString()}`;
    } else if (profit < 0) {
      return profit.toLocaleString();
    } else {
      return '0';
    }
  };

  const getProfitColor = (profit: number): string => {
    if (profit > 0) return '#00ff00';
    if (profit < 0) return '#ff0000';
    return '#ffffff';
  };

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
      <h3 style={{ color: colorStyle, marginBottom: '15px', textAlign: 'center' }}>
        🕒 {t.lastGames || 'Последние игры'}
      </h3>
      
      {recentHistory.length === 0 ? (
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
                  <th style={{ color: colorStyle, padding: '6px', textAlign: 'left', fontSize: '0.7rem' }}>
                    {t.time || 'Время'}
                  </th>
                  <th style={{ color: colorStyle, padding: '6px', textAlign: 'center', fontSize: '0.7rem' }}>
                    {t.bet || 'Ставка'}
                  </th>
                  <th style={{ color: colorStyle, padding: '6px', textAlign: 'center', fontSize: '0.7rem' }}>
                    {t.result || 'Результат'}
                  </th>
                  <th style={{ color: colorStyle, padding: '6px', textAlign: 'center', fontSize: '0.7rem' }}>
                    {t.outcome || 'Итог'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map((game) => (
                  <tr key={game.id} style={{ borderBottom: '1px solid #444' }}>
                    <td style={{ color: '#ccc', padding: '6px', fontSize: '0.65rem' }}>
                      {formatShortDate(game.date)}
                    </td>
                    <td style={{ color: '#ccc', padding: '6px', textAlign: 'center', fontSize: '0.65rem' }}>
                      {game.betAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center', fontSize: '0.65rem' }}>
                      {game.result === 'win' ? (
                        <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                          ✅ {t.win || 'Выигрыш'}
                        </span>
                      ) : (
                        <span style={{ color: '#ff0000', fontWeight: 'bold' }}>
                          ❌ {t.loss || 'Проигрыш'}
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
                textShadow: `0 0 5px ${colorStyle}`
              }}
            >
              📋 {t.fullHistory || 'Вся история'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SlotsGameHistory;
