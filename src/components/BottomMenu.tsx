import React from 'react';

const BottomMenu: React.FC = () => {
  const buttonStyle: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: '#00f0ff',
    border: '2px solid #00f0ff',
    fontWeight: 'bold',
    fontSize: '16px',
    boxShadow: '0 0 8px #00f0ff',
    cursor: 'pointer',
    transition: '0.3s'
  };

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 34, 0.6)',
      borderRadius: '10px',
      padding: '10px 0',
      marginBottom: '20px'
    }}>
      <button style={buttonStyle}>⚔️ АТАКА</button>
      <button style={buttonStyle}>🔄 ОБМЕН</button>
      <button style={buttonStyle}>🎯 ЗАДАНИЯ</button>
    </div>
  );
};

export default BottomMenu;
