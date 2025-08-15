// pages/admin/components/QuestStatistics.tsx
import React from 'react';

interface QuestStatisticsProps {
  colorStyle: string;
  onStatisticsUpdate: (stats: { total: number; active: number }) => void;
}

const QuestStatistics: React.FC<QuestStatisticsProps> = ({ 
  colorStyle, 
  onStatisticsUpdate 
}) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${colorStyle}40`,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '25px'
    }}>
      <h3 style={{ 
        color: colorStyle, 
        marginTop: 0, 
        marginBottom: '15px', 
        fontSize: '1.1rem' 
      }}>
        📊 Расширенная аналитика заданий
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        textAlign: 'center'
      }}>
        
        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid #4CAF5040',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🎯</div>
          <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.1rem' }}>Активные</div>
          <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Задания в работе</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid #FF980040',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>📝</div>
          <div style={{ color: '#FF9800', fontWeight: 'bold', fontSize: '1.1rem' }}>Черновики</div>
          <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Неактивные задания</div>
        </div>
        
        <div style={{
          background: 'rgba(156, 39, 176, 0.1)',
          border: '1px solid #9C27B040',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>📅</div>
          <div style={{ color: '#9C27B0', fontWeight: 'bold', fontSize: '1.1rem' }}>Планировщик</div>
          <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Автоматические задания</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 87, 34, 0.1)',
          border: '1px solid #FF572240',
          borderRadius: '8px',
          padding: '15px'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🔧</div>
          <div style={{ color: '#FF5722', fontWeight: 'bold', fontSize: '1.1rem' }}>В разработке</div>
          <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Дополнительные инструменты</div>
        </div>
      </div>
      
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: `${colorStyle}10`,
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#aaa',
        textAlign: 'center'
      }}>
        💡 Используйте кнопку "📊 Статистика" выше для получения актуальных данных
      </div>
    </div>
  );
};

export default QuestStatistics;