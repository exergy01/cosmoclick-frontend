import React from 'react';

const TopBar: React.FC = () => {
  return (
    <div style={{
      width: '90%',
      margin: '20px auto 10px auto',
      padding: '12px',
      border: '2px solid #00f0ff',
      borderRadius: '12px',
      boxShadow: '0 0 10px #00f0ff',
      backgroundColor: 'rgba(0, 0, 34, 0.8)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: '#00f0ff',
      fontSize: '18px',
      fontWeight: 'bold'
    }}>
      {/* Левая часть */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div>💠 CCC 0,00</div>
        <div>📈 CCC 0,00 в час</div>
      </div>

      {/* Правая часть */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div>✨ CS 0,00</div>
        <div>💎 TON 0,0000000</div>
      </div>
    </div>
  );
};

export default TopBar;
