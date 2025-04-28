import React from 'react';

const ResourceButtons: React.FC = () => {
  const buttonStyle: React.CSSProperties = {
    width: '30%', // Одинаковая ширина для каждой кнопки
    padding: '10px 0',
    margin: '5px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: '#00f0ff',
    border: '2px solid #00f0ff',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 0 8px #00f0ff',
    textAlign: 'center',
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
      display: 'flex',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: '16px'
    }}>
      <button style={buttonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>РЕСУРСЫ</button>
      <button style={buttonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>ДРОНЫ</button>
      <button style={buttonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>КАРГО</button>
    </div>
  );
};

export default ResourceButtons;
