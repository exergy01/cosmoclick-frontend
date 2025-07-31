import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#fff',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔧</div>
        <h1 style={{ 
          fontSize: '2.5rem', 
          color: '#00f0ff', 
          marginBottom: '20px',
          textShadow: '0 0 20px #00f0ff'
        }}>
          Админ панель в разработке
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#aaa' }}>
          Мы переделываем админ панель с модульной архитектурой для лучшей производительности и удобства использования.
        </p>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          padding: '20px', 
          borderRadius: '15px',
          marginBottom: '30px',
          border: '1px solid #00f0ff40'
        }}>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong>Ваш статус:</strong> {player?.first_name || player?.username || 'Неизвестен'}
          </p>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong>Telegram ID:</strong> {player?.telegram_id || 'Не определен'}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Проверка прав:</strong> В процессе...
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '15px 30px',
            background: 'linear-gradient(135deg, #00f0ff, #00f0ff88)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 20px #00f0ff40';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ← Вернуться в игру
        </button>
      </div>
    </div>
  );
};

export default AdminPage;