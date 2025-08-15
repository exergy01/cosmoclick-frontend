// pages/admin/AdminPage.tsx - БЕЗОПАСНАЯ ВЕРСИЯ
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';
import { useAdminAuth } from './hooks/useAdminAuth';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  const { isAdmin, loading, error } = useAdminAuth();
  
  const colorStyle = player?.color || '#00f0ff';

  // Обработчики
  const handleBackClick = () => {
    navigate('/', { replace: true });
  };

  // Состояния загрузки
  if (loading) {
    return <LoadingScreen />;
  }

  // Состояние ошибки или отсутствие прав
  if (error || !isAdmin) {
    return (
      <ErrorScreen 
        error={error || 'Доступ запрещен'} 
        onBackClick={handleBackClick}
      />
    );
  }

  // Главный интерфейс (пока простой)
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      backgroundAttachment: 'fixed',
      color: '#fff',
      padding: '20px'
    }}>
      {/* Заголовок */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        borderBottom: `2px solid ${colorStyle}`,
        paddingBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: colorStyle,
          textShadow: `0 0 20px ${colorStyle}`,
          margin: '0 0 10px 0',
          background: `linear-gradient(45deg, ${colorStyle}, #fff)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🔧 Админ панель CosmoClick
        </h1>
        
        {player && (
          <p style={{ fontSize: '1rem', color: '#aaa', margin: '0 0 15px 0' }}>
            Добро пожаловать, {player.first_name || player.username}! 
            <span style={{ color: colorStyle, marginLeft: '8px' }}>
              ID: {player.telegram_id}
            </span>
          </p>
        )}
        
        <button
          onClick={handleBackClick}
          style={{
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '10px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${colorStyle}20`;
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ← Вернуться в игру
        </button>
      </div>

      {/* Основной контент */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎛️</div>
          <h2 style={{ 
            color: colorStyle, 
            marginBottom: '15px',
            fontSize: '1.5rem'
          }}>
            Система управления активна!
          </h2>
          <p style={{ color: '#aaa', fontSize: '1rem', lineHeight: '1.6' }}>
            Админ панель загружена успешно. Все основные компоненты работают корректно.
            <br />
            Модульная архитектура готова к использованию.
          </p>
          
          {/* Статус системы */}
          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid #4CAF5040',
            borderRadius: '10px'
          }}>
            <div style={{ color: '#4CAF50', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>
              ✅ Статус системы: Все компоненты загружены
            </div>
            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
              • LoadingScreen - ✅ Работает<br/>
              • ErrorScreen - ✅ Работает<br/>
              • useAdminAuth - ✅ Работает<br/>
              • Авторизация - ✅ Прошла успешно<br/>
            </div>
          </div>
          
          <div style={{
            marginTop: '20px',
            fontSize: '0.8rem',
            color: '#666'
          }}>
            Обновлено: {new Date().toLocaleString('ru-RU')} | Версия: v2.0-safe
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;