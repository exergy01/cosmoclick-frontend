// cosmic-shells/components/CosmicShellsHistoryModal.tsx

import React from 'react';
import { GameHistory, CosmicShellsTranslations } from '../types';
import { formatDate, formatProfit, getProfitColor, formatNumber } from '../utils/formatters';

interface CosmicShellsHistoryModalProps {
  isOpen: boolean;
  gameHistory: GameHistory[];
  historyLoading: boolean;
  onClose: () => void;
  colorStyle: string;
  t: CosmicShellsTranslations;
}

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
        overflow: 'auto'
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
            margin: 0
          }}>
            📋 {t.fullHistory}
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
              fontSize: '1rem'
            }}
          >
            ✕
          </button>
        </div>

        {historyLoading ? (
          <div style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>
            {t.loading}
          </div>
        ) : gameHistory.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>
            История игр пуста
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colorStyle}` }}>
                  <th style={{ color: colorStyle, padding: '10px', textAlign: 'left' }}>
                    {t.time}
                  </th>
                  <th style={{ color: colorStyle, padding: '10px', textAlign: 'center' }}>
                    {t.bet}
                  </th>
                  <th style={{ color: colorStyle, padding: '10px', textAlign: 'center' }}>
                    {t.result}
                  </th>
                  <th style={{ color: colorStyle, padding: '10px', textAlign: 'center' }}>
                    {t.outcome}
                  </th>
                </tr>
              </thead>
              <tbody>
                {gameHistory.map((game) => (
                  <tr key={game.id} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ color: '#ccc', padding: '10px' }}>
                      {formatDate(game.date)}
                    </td>
                    <td style={{ color: '#ccc', padding: '10px', textAlign: 'center' }}>
                      {formatNumber(game.betAmount)} CCC
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
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
                      padding: '10px', 
                      textAlign: 'center',
                      color: getProfitColor(game.profit),
                      fontWeight: 'bold'
                    }}>
                      {formatProfit(game.profit)} CCC
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CosmicShellsHistoryModal; 
export {}; 
