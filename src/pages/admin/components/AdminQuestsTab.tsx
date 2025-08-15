// pages/admin/components/AdminQuestsTab.tsx - ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ
import React, { useState } from 'react';

interface AdminQuestsTabProps {
  colorStyle: string;
}

const AdminQuestsTab: React.FC<AdminQuestsTabProps> = ({ colorStyle }) => {
  const [actionResults, setActionResults] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  // Функции управления заданиями (пока заглушки)
  const handleQuestAction = (action: string) => {
    const actionKey = action.toLowerCase().replace(' ', '_');
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    // Имитация API вызова
    setTimeout(() => {
      setActionResults(prev => [
        `🔄 Действие "${action}" выполнено (демо-режим)`,
        `⏰ ${new Date().toLocaleTimeString()}`,
        ...prev.slice(0, 8)
      ]);
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }, 1000);
  };

  const createTestQuest = () => {
    const questKey = `test_quest_${Date.now()}`;
    handleQuestAction(`Создано тестовое задание: ${questKey}`);
  };

  return (
    <div>
      <h2 style={{ 
        color: colorStyle, 
        marginTop: 0, 
        marginBottom: '25px',
        fontSize: '1.4rem'
      }}>
        📋 Управление заданиями
      </h2>

      {/* Кнопки действий */}
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
          
          <button
            onClick={() => handleQuestAction('Список заданий')}
            disabled={actionLoading.список_заданий}
            style={{
              padding: '12px',
              background: actionLoading.список_заданий 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #3498db, #2980b9)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: actionLoading.список_заданий ? 'wait' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {actionLoading.список_заданий ? '⏳' : '📋'} Список заданий
          </button>
          
          <button
            onClick={createTestQuest}
            disabled={actionLoading.создать_тест}
            style={{
              padding: '12px',
              background: actionLoading.создать_тест 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #27ae60, #229954)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: actionLoading.создать_тест ? 'wait' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {actionLoading.создать_тест ? '⏳' : '🧪'} Создать тест
          </button>
          
          <button
            onClick={() => handleQuestAction('Статистика заданий')}
            disabled={actionLoading.статистика_заданий}
            style={{
              padding: '12px',
              background: actionLoading.статистика_заданий 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #9b59b6, #8e44ad)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: actionLoading.статистика_заданий ? 'wait' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {actionLoading.статистика_заданий ? '⏳' : '📊'} Статистика
          </button>
          
          <button
            onClick={() => handleQuestAction('Очистить тесты')}
            disabled={actionLoading.очистить_тесты}
            style={{
              padding: '12px',
              background: actionLoading.очистить_тесты 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #e74c3c, #c0392b)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: actionLoading.очистить_тесты ? 'wait' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {actionLoading.очистить_тесты ? '⏳' : '🧹'} Очистить тесты
          </button>
        </div>
      </div>

      {/* Информация о системе заданий */}
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
          💡 Используйте кнопки выше для управления системой заданий
        </div>
      </div>

      {/* Результаты действий */}
      {actionResults.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '25px'
        }}>
          <h4 style={{ 
            color: colorStyle, 
            margin: '0 0 10px 0', 
            fontSize: '1rem' 
          }}>
            📋 Результаты действий:
          </h4>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {actionResults.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  fontSize: '0.8rem', 
                  marginBottom: '4px', 
                  opacity: 1 - (index * 0.06),
                  padding: '2px 0',
                  borderLeft: index === 0 ? `3px solid ${colorStyle}` : 'none',
                  paddingLeft: index === 0 ? '8px' : '0'
                }}
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Информационная панель */}
      <div style={{
        marginTop: '25px',
        padding: '15px',
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid #4CAF5040',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '0.85rem'
      }}>
        <div style={{ color: '#4CAF50', marginBottom: '8px', fontWeight: 'bold' }}>
          💡 Система управления заданиями
        </div>
        <div style={{ color: '#aaa', lineHeight: '1.4' }}>
          Полное управление квестами: создание, редактирование, переводы, мануальные проверки, планировщик заданий
        </div>
        <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '8px' }}>
          🚧 Планировщик заданий: готов backend, требуется интерфейс
        </div>
      </div>
    </div>
  );
};

export default AdminQuestsTab;