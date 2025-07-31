// pages/admin/components/AdminTopPlayersTable.tsx
import React from 'react';
import type { TopPlayer } from '../types';

interface AdminTopPlayersTableProps {
  players: TopPlayer[];
  colorStyle: string;
  onPlayerClick?: (playerId: string) => void;
  loading?: boolean;
}

const AdminTopPlayersTable: React.FC<AdminTopPlayersTableProps> = ({
  players,
  colorStyle,
  onPlayerClick,
  loading = false
}) => {
  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${colorStyle}40`,
        borderRadius: '15px',
        padding: '40px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ 
          fontSize: '2rem', 
          marginBottom: '10px',
          animation: 'spin 1s linear infinite'
        }}>⏳</div>
        <div style={{ color: '#aaa' }}>Загрузка топ игроков...</div>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${colorStyle}40`,
        borderRadius: '15px',
        padding: '40px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
        <div style={{ color: '#aaa' }}>Нет данных о топ игроках</div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${colorStyle}40`,
      borderRadius: '15px',
      padding: '25px',
      backdropFilter: 'blur(10px)'
    }}>
      <h3 style={{ 
        color: colorStyle, 
        marginTop: 0, 
        marginBottom: '20px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        fontSize: '1.3rem'
      }}>
        🏆 ТОП-10 игроков по CS
      </h3>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '0.9rem',
          minWidth: '700px'
        }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${colorStyle}40` }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', color: colorStyle, fontWeight: 'bold' }}>#</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', color: colorStyle, fontWeight: 'bold' }}>Игрок</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>CS</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>CCC</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>TON</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>Статус</th>
              {onPlayerClick && (
                <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>Действия</th>
              )}
            </tr>
          </thead>
          <tbody>
            {players.map((topPlayer, index) => (
              <tr 
                key={topPlayer.telegram_id} 
                style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '12px 8px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: index < 3 
                      ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] 
                      : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: index < 3 ? '#000' : '#fff',
                    boxShadow: `0 0 10px ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : colorStyle}40`
                  }}>
                    {index + 1}
                  </div>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '0.95rem' }}>
                      {topPlayer.first_name || topPlayer.username || 'Аноним'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                      ID: {topPlayer.telegram_id}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <div style={{ 
                    color: '#FFD700', 
                    fontWeight: 'bold', 
                    fontSize: '1rem',
                    textShadow: '0 0 8px #FFD70040'
                  }}>
                    {topPlayer.cs.toFixed(2)}
                  </div>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {topPlayer.ccc.toFixed(2)}
                  </div>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <div style={{ 
                    color: '#0088cc', 
                    fontWeight: 'bold',
                    textShadow: '0 0 8px #0088cc40'
                  }}>
                    {topPlayer.ton.toFixed(4)}
                  </div>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {topPlayer.verified ? (
                    <span style={{ 
                      color: '#4CAF50', 
                      fontSize: '1.2rem',
                      filter: 'drop-shadow(0 0 4px #4CAF50)'
                    }}>✅</span>
                  ) : (
                    <span style={{ 
                      color: '#FF5722', 
                      fontSize: '1.2rem',
                      filter: 'drop-shadow(0 0 4px #FF5722)'
                    }}>❌</span>
                  )}
                </td>
                {onPlayerClick && (
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => onPlayerClick(topPlayer.telegram_id)}
                      style={{
                        padding: '6px 12px',
                        background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      👁️ Подробнее
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTopPlayersTable;