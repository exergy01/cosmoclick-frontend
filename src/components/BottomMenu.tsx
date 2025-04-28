import React from 'react';
import { useNavigate } from 'react-router-dom';

const BottomMenu: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      marginBottom: '60px'
    }}>
      <button
        style={{
          backgroundColor: 'rgba(0, 0, 34, 0.8)',
          border: '2px solid #00f0ff',
          borderRadius: '12px',
          color: '#00f0ff',
          padding: '10px 14px',
          fontWeight: 'bold',
          boxShadow: '0 0 8px #00f0ff',
          width: '30%'
        }}
        onClick={() => alert('⚔️ Атака в разработке')}
      >
        ⚔️ АТАКА
      </button>

      <button
        style={{
          backgroundColor: 'rgba(0, 0, 34, 0.8)',
          border: '2px solid #00f0ff',
          borderRadius: '12px',
          color: '#00f0ff',
          padding: '10px 14px',
          fontWeight: 'bold',
          boxShadow: '0 0 8px #00f0ff',
          width: '30%'
        }}
        onClick={() => alert('🔄 Обмен в разработке')}
      >
        🔄 ОБМЕН
      </button>

      <button
        style={{
          backgroundColor: 'rgba(0, 0, 34, 0.8)',
          border: '2px solid #00f0ff',
          borderRadius: '12px',
          color: '#00f0ff',
          padding: '10px 14px',
          fontWeight: 'bold',
          boxShadow: '0 0 8px #00f0ff',
          width: '30%'
        }}
        onClick={() => navigate('/quests')} // 👉 Переход по клику
      >
        🎯 ЗАДАНИЯ
      </button>
    </div>
  );
};

export default BottomMenu;
