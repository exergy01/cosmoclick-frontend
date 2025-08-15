// pages/admin/components/LoadingScreen.tsx
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#fff',
      flexDirection: 'column'
    }}>
      <div style={{ 
        fontSize: '4rem', 
        marginBottom: '20px',
        animation: 'spin 2s linear infinite'
      }}>
        🔍
      </div>
      <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
        Проверка админских прав...
      </div>
      <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
        Подождите, идет авторизация
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingScreen;

