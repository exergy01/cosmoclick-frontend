import React from 'react';

const TopBar: React.FC = () => {
  return (
<div style={{
  width: '90%',
  backgroundColor: 'rgba(0, 0, 34, 0.8)',
  border: '2px solid #00f0ff',
  borderRadius: '12px',
  padding: '12px',
  marginTop: '10px',
  marginBottom: '10px',
  boxShadow: '0 0 12px #00f0ff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'fixed',  // 👉 добавляем!
  top: '10px',        // 👉 отступ сверху
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10          // 👉 чтобы было поверх всего
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
