// pages/admin/AdminPage.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ с модульной архитектурой
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';
import { useAdminAuth } from './hooks/useAdminAuth';

// Импортируем СУЩЕСТВУЮЩИЕ компоненты
import AdminLayout from './components/AdminLayout';
import AdminStatsTab from './components/AdminStatsTab';

// Простые заглушки для остальных вкладок (пока не созданы)
const AdminPlayersTab: React.FC<{ colorStyle: string }> = ({ colorStyle }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${colorStyle}40`,
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
    <h2 style={{ color: colorStyle, marginBottom: '10px' }}>Управление игроками</h2>
    <p style={{ color: '#aaa' }}>В разработке - поиск и управление игроками</p>
  </div>
);

const AdminExchangeTab: React.FC<{ colorStyle: string }> = ({ colorStyle }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${colorStyle}40`,
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💱</div>
    <h2 style={{ color: colorStyle, marginBottom: '10px' }}>Управление обменами</h2>
    <p style={{ color: '#aaa' }}>В разработке - курсы валют и управление обменами</p>
  </div>
);

const AdminManagementTab: React.FC<{ colorStyle: string }> = ({ colorStyle }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${colorStyle}40`,
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚙️</div>
    <h2 style={{ color: colorStyle, marginBottom: '10px' }}>Системное управление</h2>
    <p style={{ color: '#aaa' }}>В разработке - системные настройки и управление</p>
  </div>
);

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  const { isAdmin, loading, error } = useAdminAuth();
  
  // Состояние активной вкладки
  const [activeTab, setActiveTab] = useState<'stats' | 'players' | 'exchange' | 'management'>('stats');

  const colorStyle = player?.color || '#00f0ff';

  // Пока идет проверка прав
  if (loading) {
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
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔐</div>
        <div>Проверка админских прав...</div>
      </div>
    );
  }

  // Если ошибка или не админ
  if (error || !isAdmin) {
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
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚫</div>
        <div style={{ fontSize: '1.2rem', marginBottom: '10px', textAlign: 'center' }}>
          {error || 'Доступ запрещен'}
        </div>
        <div style={{ color: '#aaa', marginBottom: '20px' }}>
          Перенаправление на главную через 3 секунды...
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            background: `rgba(255, 255, 255, 0.1)`,
            border: `2px solid ${colorStyle}`,
            borderRadius: '10px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Вернуться в игру
        </button>
      </div>
    );
  }

  // Обработчик смены вкладки  
  const handleTabChange = (tab: 'stats' | 'players' | 'exchange' | 'management') => {
    console.log('🔄 Переключение на вкладку:', tab);
    setActiveTab(tab);
  };

  // Обработчик возврата в игру
  const handleBackClick = () => {
    navigate('/', { replace: true });
  };

  // Обработчик клика по игроку (для будущего использования)
  const handlePlayerClick = (playerId: string) => {
    console.log('👤 Клик по игроку:', playerId);
    // В будущем здесь будет переключение на вкладку игроков с выбранным игроком
    setActiveTab('players');
  };

  // Главный интерфейс админки
  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      colorStyle={colorStyle}
      playerName={player?.first_name || player?.username}
      playerId={player?.telegram_id}
      onBackClick={handleBackClick}
    >
      {/* Рендерим контент в зависимости от активной вкладки */}
      {activeTab === 'stats' && (
        <AdminStatsTab 
          colorStyle={colorStyle}
          onPlayerClick={handlePlayerClick}
        />
      )}
      
      {activeTab === 'players' && (
        <AdminPlayersTab colorStyle={colorStyle} />
      )}
      
      {activeTab === 'exchange' && (
        <AdminExchangeTab colorStyle={colorStyle} />
      )}
      
      {activeTab === 'management' && (
        <AdminManagementTab colorStyle={colorStyle} />
      )}
    </AdminLayout>
  );
};

export default AdminPage;