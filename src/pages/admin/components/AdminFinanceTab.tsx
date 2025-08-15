// pages/admin/components/AdminFinanceTab.tsx
import React from 'react';

interface AdminFinanceTabProps {
  colorStyle: string;
}

const AdminFinanceTab: React.FC<AdminFinanceTabProps> = ({ colorStyle }) => {
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
        💰 Финансовое управление
      </h3>
      
      <div style={{ 
        textAlign: 'center', 
        color: '#aaa', 
        padding: '40px 20px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💰</div>
        <div style={{ fontSize: '1rem', marginBottom: '10px', fontWeight: 'bold' }}>
          Экономическая система
        </div>
        <div style={{ fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '15px' }}>
          Курсы валют, обмены, транзакции, настройки экономики игры,
          мониторинг финансовых операций
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '20px',
          fontSize: '0.8rem'
        }}>
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid #FFD70040',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#FFD700', fontWeight: 'bold' }}>📈 Курсы валют</div>
            <div style={{ color: '#aaa' }}>TON, Stars, внешние курсы</div>
          </div>
          
          <div style={{
            background: 'rgba(0, 136, 204, 0.1)',
            border: '1px solid #0088cc40',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#0088cc', fontWeight: 'bold' }}>💱 Обмены</div>
            <div style={{ color: '#aaa' }}>Статистика и управление</div>
          </div>
          
          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid #4CAF5040',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>💳 Транзакции</div>
            <div style={{ color: '#aaa' }}>История операций</div>
          </div>
          
          <div style={{
            background: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid #9C27B040',
            borderRadius: '6px',
            padding: '10px'
          }}>
            <div style={{ color: '#9C27B0', fontWeight: 'bold' }}>⚙️ Настройки</div>
            <div style={{ color: '#aaa' }}>Лимиты и комиссии</div>
          </div>
        </div>
        
        <div style={{ 
          fontSize: '0.8rem', 
          marginTop: '20px', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          🚧 В разработке - расширенные финансовые инструменты
        </div>
      </div>
    </div>
  );
};

export default AdminFinanceTab;