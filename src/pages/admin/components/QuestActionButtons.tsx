// pages/admin/components/QuestActionButtons.tsx
import React from 'react';

interface QuestActionButtonsProps {
  colorStyle: string;
  actionLoading: {[key: string]: boolean};
  onLoadList: () => void;
  onTestCreate: () => void;
  onGetStatistics: () => void;
  onBulkDelete: () => void;
}

const QuestActionButtons: React.FC<QuestActionButtonsProps> = ({
  colorStyle,
  actionLoading,
  onLoadList,
  onTestCreate,
  onGetStatistics,
  onBulkDelete
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
        ⚡ Действия с заданиями
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        
        {/* Список заданий */}
        <button
          onClick={onLoadList}
          disabled={actionLoading.list_quests}
          style={{
            padding: '12px',
            background: actionLoading.list_quests 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, #3498db, #2980b9)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: actionLoading.list_quests ? 'wait' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {actionLoading.list_quests ? '⏳ Загрузка...' : '📋 Список заданий'}
        </button>
        
        {/* Создать тест */}
        <button
          onClick={onTestCreate}
          disabled={actionLoading.test_create_quest}
          style={{
            padding: '12px',
            background: actionLoading.test_create_quest 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, #27ae60, #229954)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: actionLoading.test_create_quest ? 'wait' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {actionLoading.test_create_quest ? '⏳ Создание...' : '🧪 Создать тест'}
        </button>
        
        {/* Статистика */}
        <button
          onClick={onGetStatistics}
          disabled={actionLoading.quest_statistics}
          style={{
            padding: '12px',
            background: actionLoading.quest_statistics 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, #9b59b6, #8e44ad)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: actionLoading.quest_statistics ? 'wait' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {actionLoading.quest_statistics ? '⏳ Анализ...' : '📊 Статистика'}
        </button>
        
        {/* Очистить тесты */}
        <button
          onClick={onBulkDelete}
          disabled={actionLoading.bulk_delete_test}
          style={{
            padding: '12px',
            background: actionLoading.bulk_delete_test 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, #e74c3c, #c0392b)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: actionLoading.bulk_delete_test ? 'wait' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {actionLoading.bulk_delete_test ? '⏳ Очистка...' : '🧹 Очистить тесты'}
        </button>
      </div>
    </div>
  );
};

export default QuestActionButtons;