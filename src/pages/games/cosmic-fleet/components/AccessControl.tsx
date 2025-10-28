import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface AccessControlProps {
  telegramId?: number | string;
  children: React.ReactNode;
}

const AccessRestriction: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      color: '#fff',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '40px',
        borderRadius: '20px',
        border: '2px solid #ff6600',
        boxShadow: '0 0 30px rgba(255, 102, 0, 0.3)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚀</div>
        <h1 style={{
          color: '#ff6600',
          marginBottom: '20px',
          textShadow: '0 0 10px #ff6600',
          fontSize: '2rem'
        }}>
          Cosmic Fleet Commander
        </h1>
        <div style={{
          background: 'rgba(255, 102, 0, 0.1)',
          padding: '20px',
          borderRadius: '15px',
          border: '1px solid #ff6600',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#ff6600', marginBottom: '15px' }}>
            🔧 В разработке
          </h3>
          <p style={{
            color: '#ccc',
            lineHeight: '1.6',
            fontSize: '1.1rem'
          }}>
            Космическая мини-игра находится в стадии активной разработки.
            <br />
            Скоро вы сможете командовать собственным флотом!
          </p>
        </div>

        <div style={{
          background: 'rgba(0, 240, 255, 0.1)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid #00f0ff',
          marginBottom: '25px'
        }}>
          <p style={{ color: '#00f0ff', margin: 0, fontSize: '0.9rem' }}>
            ⭐ Следите за обновлениями в основной игре
          </p>
        </div>

        <button
          onClick={() => navigate('/games')}
          style={{
            background: 'linear-gradient(135deg, #ff6600, #ff8800)',
            border: 'none',
            borderRadius: '15px',
            padding: '15px 30px',
            color: '#fff',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 5px 15px rgba(255, 102, 0, 0.4)',
            transition: 'all 0.3s ease',
            width: '100%'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🎮 Вернуться к играм
        </button>
      </div>
    </div>
  );
};

const AccessControl: React.FC<AccessControlProps> = ({ telegramId, children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!telegramId) {
        setHasAccess(false);
        setIsChecking(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/admin/auth/check-test-access/${telegramId}`);
        setHasAccess(response.data.hasTestAccess);
      } catch (error) {
        console.error('Access check error:', error);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [telegramId]);

  if (isChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚀</div>
          <div>Проверка доступа...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessRestriction />;
  }

  return <>{children}</>;
};

export default AccessControl;