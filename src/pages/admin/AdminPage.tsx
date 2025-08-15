// pages/admin/AdminPage.tsx - РЕФАКТОРИНГ: Модульная архитектура
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';
import { useAdminAuth } from './hooks/useAdminAuth';
import AdminLayout from './components/AdminLayout';
import AdminStatsTab from './components/AdminStatsTab';
import AdminPlayersTab from './components/AdminPlayersTab';
import AdminQuestsTab from './components/AdminQuestsTab';
import AdminMinigamesTab from './components/AdminMinigamesTab';
import AdminFinanceTab from './components/AdminFinanceTab';
import AdminSystemTab from './components/AdminSystemTab';
import AdminNotificationsTab from './components/AdminNotificationsTab';
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import type { AdminTabType } from './types';

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  const { isAdmin, loading, error } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTabType>('stats');
  
  const colorStyle = player?.color || '#00f0ff';

  // Обработчики
  const handleTabChange = (tab: AdminTabType) => {
    setActiveTab(tab);
  };

  const handleBackClick = () => {
    navigate('/', { replace: true });
  };

  const handlePlayerClick = (playerId: string) => {
    // Переключаемся на вкладку игроков и передаем ID для открытия деталей
    setActiveTab('players');
    // TODO: Передать playerId в PlayerTab для открытия деталей
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
          <AdminPlayersTab 
            colorStyle={colorStyle}
          />
        );
      case 'exchange':
        return (
          <AdminQuestsTab 
            colorStyle={colorStyle}
          />
        );
      case 'management':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            <AdminMinigamesTab colorStyle={colorStyle} />
            <AdminFinanceTab colorStyle={colorStyle} />
            <AdminSystemTab colorStyle={colorStyle} />
            <AdminNotificationsTab colorStyle={colorStyle} />
          </div>
        );
      default:
        return <AdminStatsTab colorStyle={colorStyle} onPlayerClick={handlePlayerClick} />;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      colorStyle={colorStyle}
      playerName={player?.first_name || player?.username}
      playerId={player?.telegram_id}
      onBackClick={handleBackClick}
    >
      {renderActiveTabContent()}
    </AdminLayout>
  );
};

export default AdminPage;