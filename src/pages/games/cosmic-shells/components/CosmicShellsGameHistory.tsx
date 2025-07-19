// cosmic-shells/components/CosmicShellsGameHistory.tsx
// ✅ ИСПРАВЛЕНО: Переводы через react-i18next

import React from 'react';
import { GameHistory } from '../types';
import { formatDate, formatProfit, getProfitColor } from '../utils/formatters';

interface CosmicShellsGameHistoryProps {
  recentHistory: GameHistory[];
  onShowFullHistory: () => void;
  colorStyle: string;
  t: (key: string) => string;
}

const formatGameTime = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}, ${hours}:${minutes}`;
};

const CosmicShellsGameHistory: React.FC<CosmicShellsGameHistoryProps> = ({
  recentHistory,
  onShowFullHistory,
  colorStyle,
  t
}) => {
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
      <h3 style={{ 
        color: colorStyle, 
        marginBottom: '15px', 
        textAlign: 'center',
        fontSize: '1.1rem',
        textShadow: `0 0 10px ${colorStyle}`
      }}>
        🕒 {t('games.shells.lastGames')} (10)
      </h3>
      
      {lastTenGames.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#ccc', 
          padding: '40px',
          fontSize: '1.1rem'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '15px' }}>📊</div>
          {t('games.shells.emptyHistory')}
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
                    padding: '8px', 
                    textAlign: 'left',
                    textShadow: `0 0 5px ${colorStyle}`
                  }}>
                    {t('games.shells.time')}
                  </th>
                  <th style={{ 
                    color: colorStyle, 
                    padding: '8px', 
                    textAlign: 'center',
                    textShadow: `0 0 5px ${colorStyle}`
                  }}>
                    {t('games.shells.bet')}
                  </th>
                  <th style={{ 
                    color: colorStyle, 
                    padding: '8px', 
                    textAlign: 'center',
                    textShadow: `0 0 5px ${colorStyle}`
                  }}>
                    {t('games.shells.result')}
                  </th>
                  <th style={{ 
                    color: colorStyle, 
                    padding: '8px', 
                    textAlign: 'center',
                    textShadow: `0 0 5px ${colorStyle}`
                  }}>
                    {t('games.shells.outcome')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lastTenGames.map((game) => (
                  <tr key={game.id} style={{ 
                    borderBottom: '1px solid #333',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  >
                    <td style={{ 
                      color: '#ccc', 
                      padding: '8px',
                      fontSize: '0.7rem'
                    }}>
                      {formatGameTime(game.date)}
                    </td>
                    <td style={{ 
                      color: '#ccc', 
                      padding: '8px', 
                      textAlign: 'center',
                      fontSize: '0.7rem'
                    }}>
                      {game.betAmount.toLocaleString()}
                    </td>
                    <td style={{ 
                      padding: '8px', 
                      textAlign: 'center',
                      fontSize: '0.7rem'
                    }}>
                      <span style={{ 
                        color: game.result === 'win' ? '#00ff00' : '#ff0000',
                        fontWeight: 'bold'
                      }}>
                        {game.result === 'win' ? '✅' : '❌'} {game.result === 'win' ? t('games.win') : t('games.loss')}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '8px',
                      textAlign: 'center',
                      color: getProfitColor(game.profit),
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
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
              📋 {t('games.shells.fullHistory')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CosmicShellsGameHistory;