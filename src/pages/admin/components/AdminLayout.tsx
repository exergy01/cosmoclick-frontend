// pages/admin/components/AdminLayout.tsx
import React from 'react';
import type { AdminLayoutProps } from '../types';
import { ADMIN_TABS } from '../types';

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  colorStyle,
  playerName,
  playerId,
  onBackClick
}) => {
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
        
        {playerName && playerId && (
          <p style={{ fontSize: '1rem', color: '#aaa', margin: '0 0 15px 0' }}>
            Добро пожаловать, {playerName}! 
            <span style={{ color: colorStyle, marginLeft: '8px' }}>
              ID: {playerId}
            </span>
          </p>
        )}
        
        <button
          onClick={onBackClick}
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

      {/* Навигация */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
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

      {/* Контент */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </div>

      {/* Глобальные стили */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          input::placeholder, select option {
            color: #aaa;
          }
          input:focus, select:focus {
            outline: none;
            box-shadow: 0 0 10px ${colorStyle}40;
          }
          /* Кастомный скроллбар */
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: ${colorStyle};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${colorStyle}cc;
          }
        `}
      </style>
    </div>
  );
};

export default AdminLayout;