// pages/admin/components/AdminMinigamesTab.tsx
import React from 'react';

interface AdminMinigamesTabProps {
  colorStyle: string;
}

const AdminMinigamesTab: React.FC<AdminMinigamesTabProps> = ({ colorStyle }) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${colorStyle}40`,
      borderRadius: '12px',
      padding: '20px',
      minHeight: '300px'
    }}>
      <h3 style={{ 
        color: colorStyle, 
        marginTop: 0, 
        marginBottom: '20px',
        fontSize: '1.1rem'
      }}>
        🎮 Управление мини-играми
      </h3>
      
      <div style={{ 
        textAlign: 'center', 
        color: '#aaa', 
        padding: '40px 20px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎮</div>
        <div style={{ fontSize: '1rem', marginBottom: '10px', fontWeight: 'bold' }}>
          Система мини-игр
        </div>
        <div style={{ fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '15px' }}>
          Настройки лимитов, статистика игр, управление джекпотом, 
          конфигурация вероятностей выигрыша
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '20px',
          fontSize: '0.8rem'
        }}>
          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid #FFC10740',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#FFC107', fontWeight: 'bold' }}>🎰 Слот-машина</div>
            <div style={{ color: '#aaa' }}>Настройки и статистика</div>
          </div>
          
          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid #4CAF5040',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>💰 Джекпот</div>
            <div style={{ color: '#aaa' }}>Управление призовым фондом</div>
          </div>
          
          <div style={{
            background: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid #2196F340',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#2196F3', fontWeight: 'bold' }}>📊 Аналитика</div>
            <div style={{ color: '#aaa' }}>Статистика игр и выигрышей</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 87, 34, 0.1)',
            border: '1px solid #FF572240',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#FF5722', fontWeight: 'bold' }}>⚙️ Настройки</div>
            <div style={{ color: '#aaa' }}>Лимиты и вероятности</div>
          </div>
        </div>
        
        <div style={{ 
          fontSize: '0.8rem', 
          marginTop: '20px', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          🚧 В разработке - функционал будет добавлен в следующих обновлениях
        </div>
      </div>
    </div>
  );
};

export default AdminMinigamesTab;