// pages/admin/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';
import AdminLayout from './components/AdminLayout';
import AdminStatsTab from './components/AdminStatsTab';
import { useAdminAuth } from './hooks/useAdminAuth';
import type { AdminTabType } from './types';

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  const { isAdmin, loading, error } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTabType>('stats');

  const colorStyle = player?.color || '#00f0ff';

  // Загрузка
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
        <div>Проверка прав...</div>
      </div>
    );
  }

  // Ошибка доступа
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
        <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
          {error || 'Доступ запрещен'}
        </div>
        <div style={{ color: '#aaa', marginBottom: '20px' }}>
          Перенаправление через 3 секунды...
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            background: '#00f0ff20',
            border: '2px solid #00f0ff',
            borderRadius: '10px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Вернуться в игру
        </button>
      </div>
    );
  }

  const handlePlayerClick = (playerId: string) => {
    // TODO: Открыть детальную страницу игрока
    console.log('Клик по игроку:', playerId);
  };

  const renderTabContent = () => {
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
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👥</div>
            <h2 style={{ color: colorStyle, marginBottom: '10px' }}>Управление игроками</h2>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>Поиск, редактирование, верификация игроков</p>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Раздел в разработке...
            </div>
          </div>
        );
      case 'exchange':
        return (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💱</div>
            <h2 style={{ color: colorStyle, marginBottom: '10px' }}>Обмены и курсы</h2>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>Управление курсами валют и разблокировками</p>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Раздел в разработке...
            </div>
          </div>
        );
      case 'management':
        return (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚙️</div>
            <h2 style={{ color: colorStyle, marginBottom: '10px' }}>Системные настройки</h2>
            <p style={{ color: '#aaa', marginBottom: '20px' }}>Конфигурация и управление системой</p>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              Раздел в разработке...
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      colorStyle={colorStyle}
      playerName={player?.first_name || player?.username}
      playerId={player?.telegram_id}
      onBackClick={() => navigate('/')}
    >
      {renderTabContent()}
    </AdminLayout>
  );
};

export default AdminPage;