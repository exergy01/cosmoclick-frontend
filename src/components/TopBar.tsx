import React from 'react';

const TopBar: React.FC = () => {
  const playerName = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'Капитан CosmoClick';

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '10px',
    }}>
      {/* Имя игрока */}
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '5px',
        color: '#00f0ff',
        textShadow: '0 0 8px #00f0ff'
      }}>
        {playerName}
      </div>

      {/* Баланс CCC и CS */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(0, 0, 34, 0.7)',
        borderRadius: '10px',
        padding: '10px 0',
        boxShadow: '0 0 10px #00f0ff'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>💎 0 CCC</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>✨ 0 CS</div>
      </div>
    </div>
  );
};

export default TopBar;
