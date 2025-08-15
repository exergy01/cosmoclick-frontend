// pages/admin/components/AdminSystemTab.tsx
import React from 'react';

interface AdminSystemTabProps {
  colorStyle: string;
}

const AdminSystemTab: React.FC<AdminSystemTabProps> = ({ colorStyle }) => {
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
        🔧 Системные функции
      </h3>
      
      <div style={{ 
        textAlign: 'center', 
        color: '#aaa', 
        padding: '40px 20px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔧</div>
        <div style={{ fontSize: '1rem', marginBottom: '10px', fontWeight: 'bold' }}>
          Системное администрирование
        </div>
        <div style={{ fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '15px' }}>
          Резервное копирование, логи, тестирование, очистка данных,
          мониторинг производительности системы
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '20px',
          fontSize: '0.8rem'
        }}>
          <div style={{
            background: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid #2196F340',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#2196F3', fontWeight: 'bold' }}>💾 Бэкапы</div>
            <div style={{ color: '#aaa' }}>Резервное копирование</div>
          </div>
          
          <div style={{
            background: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid #FF980040',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#FF9800', fontWeight: 'bold' }}>📋 Логи</div>
            <div style={{ color: '#aaa' }}>Системные журналы</div>
          </div>
          
          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid #4CAF5040',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>🧪 Тестирование</div>
            <div style={{ color: '#aaa' }}>Проверка функций</div>
          </div>
          
          <div style={{
            background: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid #F4433640',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#F44336', fontWeight: 'bold' }}>🗑️ Очистка</div>
            <div style={{ color: '#aaa' }}>Управление данными</div>
          </div>
        </div>
        
        <div style={{ 
          fontSize: '0.8rem', 
          marginTop: '20px', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          🚧 В разработке - системные инструменты администратора
        </div>
      </div>
    </div>
  );
};

export default AdminSystemTab;