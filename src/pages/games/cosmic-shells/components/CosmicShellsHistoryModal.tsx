// cosmic-shells/components/CosmicShellsHistoryModal.tsx
// ✅ ИСПРАВЛЕНО: Переводы через react-i18next

import React from 'react';
import { GameHistory } from '../types';

interface CosmicShellsHistoryModalProps {
  isOpen: boolean;
  gameHistory: GameHistory[];
  historyLoading: boolean;
  onClose: () => void;
  colorStyle: string;
  t: (key: string) => string;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}.${month}.${year}, ${hours}:${minutes}`;
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

const CosmicShellsHistoryModal: React.FC<CosmicShellsHistoryModalProps> = ({
  isOpen,
  gameHistory,
  historyLoading,
  onClose,
  colorStyle,
  t
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.9)',
        border: `2px solid ${colorStyle}`,
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: `0 0 30px ${colorStyle}40`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: colorStyle,
            textShadow: `0 0 10px ${colorStyle}`,
            margin: 0,
            fontSize: '1.5rem'
          }}>
            📋 {t('games.shells.fullHistory')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: `2px solid ${colorStyle}`,
              borderRadius: '10px',
              color: colorStyle,
              padding: '5px 10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${colorStyle}20`;
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>

        {historyLoading ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#ccc', 
            padding: '40px',
            fontSize: '1.1rem'
          }}>
            <div style={{ 
              fontSize: '2rem', 
              marginBottom: '15px',
              animation: 'spin 2s linear infinite'
            }}>
              🛸
            </div>
            {t('loading')}
          </div>
        ) : gameHistory.length === 0 ? (
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              marginBottom: '20px',
              padding: '15px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              border: `1px solid ${colorStyle}30`
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: colorStyle, fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {gameHistory.length}
                </div>
                <div style={{ color: '#ccc', fontSize: '0.8rem' }}>
                  {t('games.shells.totalGames')}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#00ff00', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {gameHistory.filter(g => g.result === 'win').length}
                </div>
                <div style={{ color: '#ccc', fontSize: '0.8rem' }}>
                  {t('games.win')}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#ff0000', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {gameHistory.filter(g => g.result === 'loss').length}
                </div>
                <div style={{ color: '#ccc', fontSize: '0.8rem' }}>
                  {t('games.loss')}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  color: getProfitColor(gameHistory.reduce((sum, g) => sum + g.profit, 0)), 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold' 
                }}>
                  {formatProfit(gameHistory.reduce((sum, g) => sum + g.profit, 0))}
                </div>
                <div style={{ color: '#ccc', fontSize: '0.8rem' }}>
                  {t('games.shells.profit')}
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem'
              }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colorStyle}` }}>
                    <th style={{ 
                      color: colorStyle, 
                      padding: '10px', 
                      textAlign: 'left',
                      textShadow: `0 0 5px ${colorStyle}`
                    }}>
                      {t('games.shells.time')}
                    </th>
                    <th style={{ 
                      color: colorStyle, 
                      padding: '10px', 
                      textAlign: 'center',
                      textShadow: `0 0 5px ${colorStyle}`
                    }}>
                      {t('games.shells.bet')}
                    </th>
                    <th style={{ 
                      color: colorStyle, 
                      padding: '10px', 
                      textAlign: 'center',
                      textShadow: `0 0 5px ${colorStyle}`
                    }}>
                      {t('games.shells.result')}
                    </th>
                    <th style={{ 
                      color: colorStyle, 
                      padding: '10px', 
                      textAlign: 'center',
                      textShadow: `0 0 5px ${colorStyle}`
                    }}>
                      {t('games.shells.outcome')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gameHistory.map((game) => (
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
                        padding: '10px',
                        fontSize: '0.85rem'
                      }}>
                        {formatDate(game.date)}
                      </td>
                      <td style={{ 
                        color: '#ccc', 
                        padding: '10px', 
                        textAlign: 'center',
                        fontSize: '0.85rem'
                      }}>
                        {game.betAmount.toLocaleString()} CCC
                      </td>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'center',
                        fontSize: '0.85rem'
                      }}>
                        {game.result === 'win' ? (
                          <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                            ✅ {t('games.win')}
                          </span>
                        ) : (
                          <span style={{ color: '#ff0000', fontWeight: 'bold' }}>
                            ❌ {t('games.loss')}
                          </span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '10px', 
                        textAlign: 'center',
                        color: getProfitColor(game.profit),
                        fontWeight: 'bold',
                        fontSize: '0.85rem'
                      }}>
                        {formatProfit(game.profit)} CCC
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: `1px solid ${colorStyle}30`
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
              border: `2px solid ${colorStyle}`,
              borderRadius: '10px',
              color: colorStyle,
              cursor: 'pointer',
              fontSize: '1rem',
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
            {t('games.shells.close')}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default CosmicShellsHistoryModal;