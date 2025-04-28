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

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#00f0ff';
    e.currentTarget.style.color = '#001133';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = '#00f0ff';
  };

  return (
<div style={{
  width: '100%',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 34, 0.8)',
  borderRadius: '10px',
  padding: '10px 0',
  position: 'fixed',
  bottom: '60px',
  left: 0,
  zIndex: 10
}}>
      <button style={buttonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>⚔️ АТАКА</button>
      <button style={buttonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>🔄 ОБМЕН</button>
      <button style={buttonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>🎯 ЗАДАНИЯ</button>
    </div>
  );
};

export default BottomMenu;
