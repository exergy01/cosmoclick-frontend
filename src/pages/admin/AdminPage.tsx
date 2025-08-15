// pages/admin/AdminPage.tsx - ПРАВИЛЬНАЯ ВЕРСИЯ - использует готовые компоненты
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';
import { useAdminAuth } from './hooks/useAdminAuth';

// Импортируем ГОТОВЫЕ компоненты
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import AdminStatsTab from './components/AdminStatsTab';

// Типы для вкладок
type AdminTabType = 'stats' | 'players' | 'quests' | 'management';

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  const { isAdmin, loading, error } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTabType>('stats');
  
  const colorStyle = player?.color || '#00f0ff';

  // Конфигурация вкладок
  const tabs = [
    { key: 'stats' as const, label: 'Статистика', icon: '📊' },
    { key: 'players' as const, label: 'Игроки', icon: '👥' },
    { key: 'quests' as const, label: 'Задания', icon: '📋' },
    { key: 'management' as const, label: 'Управление', icon: '⚙️' }
  ];

  // Обработчики
  const handleTabChange = (tab: AdminTabType) => {
    setActiveTab(tab);
  };

  const handleBackClick = () => {
    navigate('/', { replace: true });
  };

  const handlePlayerClick = (playerId: string) => {
    setActiveTab('players');
    // TODO: передать playerId в PlayerTab для открытия деталей
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

  // Рендер содержимого активной вкладки
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <AdminStatsTab 
            colorStyle={colorStyle}
            onPlayerClick={handlePlayerClick}
          />
        );
      case 'players':
        return (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}40`,
            borderRadius: '15px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👥</div>
            <h3 style={{ color: colorStyle, marginBottom: '15px' }}>Управление игроками</h3>
            <p style={{ color: '#aaa' }}>Компонент AdminPlayersTab будет добавлен следующим</p>
          </div>
        );
      case 'quests':
        return (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}40`,
            borderRadius: '15px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📋</div>
            <h3 style={{ color: colorStyle, marginBottom: '15px' }}>Управление заданиями</h3>
            <p style={{ color: '#aaa' }}>Компонент AdminQuestsTab будет добавлен следующим</p>
          </div>
        );
      case 'management':
        return (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}40`,
            borderRadius: '15px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚙️</div>
            <h3 style={{ color: colorStyle, marginBottom: '15px' }}>Системное управление</h3>
            <p style={{ color: '#aaa' }}>Дополнительные компоненты управления</p>
          </div>
        );
      default:
        return <AdminStatsTab colorStyle={colorStyle} onPlayerClick={handlePlayerClick} />;
    }
  };

  // Главный интерфейс
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
        >
          ← Вернуться в игру
        </button>
      </div>

      {/* Навигация по вкладкам */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              padding: '12px 24px',
              background: activeTab === tab.key 
                ? `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)` 
                : 'rgba(255, 255, 255, 0.1)',
              border: `2px solid ${activeTab === tab.key ? colorStyle : 'transparent'}`,
              borderRadius: '15px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              boxShadow: activeTab === tab.key ? `0 0 20px ${colorStyle}40` : 'none',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент активной вкладки */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {renderActiveTabContent()}
      </div>

      {/* Статус системы */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid #4CAF5040',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '0.9rem'
      }}>
        <div style={{ color: '#4CAF50', marginBottom: '5px' }}>
          ✅ Модульная архитектура активна! Используем готовые компоненты.
        </div>
        <div style={{ color: '#aaa' }}>
          Активная вкладка: {tabs.find(t => t.key === activeTab)?.icon} {tabs.find(t => t.key === activeTab)?.label} | 
          Обновлено: {new Date().toLocaleString('ru-RU')}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;