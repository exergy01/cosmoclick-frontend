// pages/admin/components/ErrorScreen.tsx
import React from 'react';

interface ErrorScreenProps {
  error: string;
  onBackClick: () => void;
}

const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onBackClick }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#fff',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚫</div>
      
      <div style={{ 
        fontSize: '1.4rem', 
        marginBottom: '15px',
        textAlign: 'center',
        color: '#ff6b6b',
        fontWeight: 'bold'
      }}>
        Доступ запрещен
      </div>
      
      <div style={{ 
        color: '#aaa', 
        marginBottom: '30px',
        textAlign: 'center',
        fontSize: '1rem',
        maxWidth: '400px',
        lineHeight: '1.4'
      }}>
        {error}
      </div>
      
      <div style={{ 
        color: '#666', 
        marginBottom: '25px',
        fontSize: '0.9rem',
        textAlign: 'center'
      }}>
        Перенаправление через 3 секунды...
      </div>
      
      <button
        onClick={onBackClick}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #00f0ff, #00b8cc)',
          border: 'none',
          borderRadius: '12px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0, 240, 255, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 240, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 240, 255, 0.3)';
        }}
      >
        🏠 Вернуться в игру
      </button>
    </div>
  );
};

export default ErrorScreen;