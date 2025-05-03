import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const query = new URLSearchParams(location.search);
  const activeTab = query.get('tab') || '';

  const menuButtonStyle: React.CSSProperties = {
    width: '20%',
    padding: '8px 0',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: '#00f0ff',
    border: '2px solid #00f0ff',
    fontSize: '30px',
    fontWeight: 'normal',
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
    fontWeight: 'normal',
    fontSize: '16px',
    boxShadow: '0 0 8px #00f0ff',
    cursor: 'pointer',
    textAlign: 'center',
    transition: '0.3s'
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = '#00f0ff';
      e.currentTarget.style.color = '#001133';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = '#00f0ff';
    }
  };

  const getButtonStyle = (baseStyle: React.CSSProperties, path: string, tab?: string): React.CSSProperties => {
    const isActive = tab
      ? currentPath === '/shop' && activeTab === tab
      : currentPath === path;
    return {
      ...baseStyle,
      boxShadow: isActive ? 'inset 0 0 10px #00f0ff, 0 0 8px #00f0ff' : '0 0 8px #00f0ff',
    };
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: '8px'
      }}>
        <button
          style={getButtonStyle(bottomButtonStyle, '/attack')}
          onMouseDown={(e) => handleMouseDown(e, currentPath === '/attack')}
          onMouseUp={(e) => handleMouseUp(e, currentPath === '/attack')}
        >
          ⚔️ АТАКА
        </button>
        <button
          style={getButtonStyle(bottomButtonStyle, '/exchange')}
          onMouseDown={(e) => handleMouseDown(e, currentPath === '/exchange')}
          onMouseUp={(e) => handleMouseUp(e, currentPath === '/exchange')}
          onClick={() => navigate('/exchange')}
        >
          🔄 ОБМЕН
        </button>
        <button
          style={getButtonStyle(bottomButtonStyle, '/quests')}
          onMouseDown={(e) => handleMouseDown(e, currentPath === '/quests')}
          onMouseUp={(e) => handleMouseUp(e, currentPath === '/quests')}
          onClick={() => navigate('/quests')}
        >
          🎯 ЗАДАНИЯ
        </button>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        width: '100%'
      }}>
        <button
          style={getButtonStyle(menuButtonStyle, '/game')}
          onMouseDown={(e) => handleMouseDown(e, currentPath === '/game')}
          onMouseUp={(e) => handleMouseUp(e, currentPath === '/game')}
        >
          🎮
        </button>
        <button
          style={getButtonStyle(menuButtonStyle, '/wallet')}
          onMouseDown={(e) => handleMouseDown(e, currentPath === '/wallet')}
          onMouseUp={(e) => handleMouseUp(e, currentPath === '/wallet')}
          onClick={() => navigate('/wallet')}
        >
          💳
        </button>
        <button
          style={getButtonStyle(menuButtonStyle, '/')}
          onMouseDown={(e) => handleMouseDown(e, currentPath === '/')}
          onMouseUp={(e) => handleMouseUp(e, currentPath === '/')}
          onClick={() => navigate('/')}
        >
          🚀
        </button>
        <button
          style={getButtonStyle(menuButtonStyle, '/referrals')}
          onMouseDown={(e) => handleMouseDown(e, currentPath === '/referrals')}
          onMouseUp={(e) => handleMouseUp(e, currentPath === '/referrals')}
          onClick={() => navigate('/referrals')}
        >
          👥
        </button>
        <button
          style={getButtonStyle(menuButtonStyle, '/alphabet')}
          onMouseDown={(e) => handleMouseDown(e, currentPath === '/alphabet')}
          onMouseUp={(e) => handleMouseUp(e, currentPath === '/alphabet')}
          onClick={() => navigate('/alphabet')}
        >
          📖
        </button>
      </div>
    </div>
  );
};

export default MainMenu;