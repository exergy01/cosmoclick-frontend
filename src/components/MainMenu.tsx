import React from 'react';
import { useNavigate } from 'react-router-dom';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();

  const menuButtonStyle: React.CSSProperties = {
    width: '20%',
    padding: '8px 0',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: '#00f0ff',
    border: '2px solid #00f0ff',
    fontSize: '30px',
    fontWeight: 'bold',
    boxShadow: '0 0 8px #00f0ff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: '0.3s'
  };

  const bottomButtonStyle: React.CSSProperties = {
    width: '30%',
    padding: '10px 0',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: '#00f0ff',
    border: '2px solid #00f0ff',
    fontWeight: 'bold',
    fontSize: '16px',
    boxShadow: '0 0 8px #00f0ff',
    cursor: 'pointer',
    textAlign: 'center',
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
      position: 'fixed',
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(0, 0, 34, 0.9)',
      borderTop: '1px solid #00f0ff',
      padding: '10px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Верхняя строка - АТАКА / ОБМЕН / ЗАДАНИЯ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: '8px'
      }}>
        <button style={bottomButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
          ⚔️ АТАКА
        </button>
        <button style={bottomButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
          🔄 ОБМЕН
        </button>
        <button
          style={bottomButtonStyle}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={() => navigate('/quests')} // 👉 Переход на страницу ЗАДАНИЯ
        >
          🎯 ЗАДАНИЯ
        </button>
      </div>

      {/* Нижняя строка - значки */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        width: '100%'
      }}>
        <button style={menuButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>🎮</button>
        <button style={menuButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>💳</button>
        <button
  style={menuButtonStyle}
  onMouseDown={handleMouseDown}
  onMouseUp={handleMouseUp}
  onClick={() => navigate('/')} // 👉 Переход на главную страницу
>
  🚀
</button>

        <button style={menuButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>👥</button>
        <button style={menuButtonStyle} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>📖</button>
      </div>
    </div>
  );
};

export default MainMenu;
