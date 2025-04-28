import React from 'react';

const MainMenu: React.FC = () => {
  const menuButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: '#00f0ff',
    border: '2px solid #00f0ff',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 0 8px #00f0ff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
      position: 'fixed',
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(0, 0, 34, 0.9)',
      padding: '10px 0',
      borderTop: '1px solid #00f0ff'
    }}>
      <button style={menuButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>🎮 Игры</button>
      <button style={menuButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>💳 Кошелёк</button>
      <button style={menuButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>🚀 Главная</button>
      <button style={menuButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>👥 Друзья</button>
      <button style={menuButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>📖 Азбука</button>
    </div>
  );
};

export default MainMenu;
