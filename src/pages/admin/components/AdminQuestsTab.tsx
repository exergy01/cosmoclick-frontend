// pages/admin/components/AdminQuestsTab.tsx
import React, { useState } from 'react';
import QuestActionButtons from './QuestActionButtons';
import QuestCreator from './QuestCreator';
import QuestStatistics from './QuestStatistics';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

interface AdminQuestsTabProps {
  colorStyle: string;
}

const AdminQuestsTab: React.FC<AdminQuestsTabProps> = ({ colorStyle }) => {
  const [actionResults, setActionResults] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  // Получение админского ID
  const getAdminId = () => localStorage.getItem('telegramId') || '1222791281';

  // Функция тестирования создания задания
  const testNewQuestCreation = async () => {
    const actionKey = 'test_create_quest';
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const testQuestData = {
        quest_key: `test_quest_${Date.now()}`,
        quest_type: 'partner_link',
        reward_cs: 500,
        quest_data: {
          url: 'https://example.com/test',
          timer_seconds: 30
        },
        target_languages: null,
        sort_order: 999,
        translations: {
          en: {
            quest_name: 'Test Quest (English)',
            description: 'This is a test quest created from admin panel'
          },
          ru: {
            quest_name: 'Тестовое задание (Русский)',
            description: 'Это тестовое задание, созданное из админ панели'
          }
        }
      };
      
      const response = await axios.post(`${apiUrl}/api/admin/quests/create/${getAdminId()}`, testQuestData);
      
      if (response.data.success) {
        setActionResults(prev => [
          `🧪 Тестовое задание создано: ${testQuestData.quest_key}`,
          `✅ Проверьте его в списке заданий`,
          `⚠️ Не забудьте удалить после тестирования`,
          ...prev.slice(0, 7)
        ]);
      }
    } catch (error: any) {
      console.error('❌ Ошибка тестирования создания:', error);
      setActionResults(prev => [
        `❌ Тест создания: ${error.response?.data?.error || error.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Функция получения статистики заданий
  const getQuestStatistics = async () => {
    const actionKey = 'quest_statistics';
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.get(`${apiUrl}/api/admin/quests/list/${getAdminId()}`);
      
      if (response.data.success) {
        const quests = response.data.quests;
        
        const stats = {
          total: quests.length,
          active: quests.filter((q: any) => q.is_active).length,
          inactive: quests.filter((q: any) => !q.is_active).length,
          by_type: quests.reduce((acc: any, quest: any) => {
            acc[quest.quest_type] = (acc[quest.quest_type] || 0) + 1;
            return acc;
          }, {}),
          total_completions: quests.reduce((sum: number, quest: any) => sum + (quest.stats?.total_completions || 0), 0),
          total_players: quests.reduce((sum: number, quest: any) => sum + (quest.stats?.unique_players || 0), 0)
        };
        
        setActionResults(prev => [
          `📊 СТАТИСТИКА ЗАДАНИЙ:`,
          `Всего: ${stats.total} (активных: ${stats.active}, неактивных: ${stats.inactive})`,
          `По типам: ${Object.entries(stats.by_type).map(([type, count]) => `${type}: ${count}`).join(', ')}`,
          `Выполнений: ${stats.total_completions}, уникальных игроков: ${stats.total_players}`,
          ...prev.slice(0, 6)
        ]);
      }
    } catch (error: any) {
      console.error('❌ Ошибка получения статистики:', error);
      setActionResults(prev => [
        `❌ Статистика заданий: ${error.response?.data?.error || error.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Функция массового обновления заданий
  const bulkUpdateQuests = async (operation: 'activate' | 'deactivate' | 'delete_test') => {
    const actionKey = `bulk_${operation}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      if (operation === 'delete_test') {
        const listResponse = await axios.get(`${apiUrl}/api/admin/quests/list/${getAdminId()}`);
        if (listResponse.data.success) {
          const testQuests = listResponse.data.quests.filter((q: any) => q.quest_key.includes('test_quest_'));
          
          let deletedCount = 0;
          for (const quest of testQuests) {
            try {
              await axios.delete(`${apiUrl}/api/admin/quests/delete/${quest.quest_key}/${getAdminId()}`);
              deletedCount++;
            } catch (deleteError) {
              console.error(`Ошибка удаления ${quest.quest_key}:`, deleteError);
            }
          }
          
          setActionResults(prev => [
            `🧹 Очистка завершена: удалено ${deletedCount} тестовых заданий`,
            ...prev.slice(0, 9)
          ]);
        }
      }
    } catch (error: any) {
      console.error('❌ Ошибка массового обновления:', error);
      setActionResults(prev => [
        `❌ Массовое обновление: ${error.response?.data?.error || error.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Функция загрузки списка заданий
  const loadQuestsList = async () => {
    const actionKey = 'list_quests';
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.get(`${apiUrl}/api/admin/quests/list/${getAdminId()}`);
      
      if (response.data.success) {
        setActionResults(prev => [
          `📋 Загружено заданий: ${response.data.total_quests} (активных: ${response.data.active_quests})`,
          ...response.data.quests.slice(0, 5).map((q: any) => 
            `• ${q.quest_key} (${q.quest_type}) - ${q.is_active ? '✅' : '❌'}`
          ),
          ...prev.slice(0, 5)
        ]);
      }
    } catch (error: any) {
      setActionResults(prev => [
        `❌ Ошибка загрузки заданий: ${error.response?.data?.error || error.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
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
      <QuestActionButtons
        colorStyle={colorStyle}
        actionLoading={actionLoading}
        onLoadList={loadQuestsList}
        onTestCreate={testNewQuestCreation}
        onGetStatistics={getQuestStatistics}
        onBulkDelete={() => bulkUpdateQuests('delete_test')}
      />

      {/* Создатель заданий */}
      <QuestCreator
        colorStyle={colorStyle}
        onQuestCreated={(message) => {
          setActionResults(prev => [message, ...prev.slice(0, 9)]);
        }}
      />

      {/* Статистика заданий */}
      <QuestStatistics
        colorStyle={colorStyle}
        onStatisticsUpdate={(stats) => {
          setActionResults(prev => [
            `📊 Обновлена статистика заданий`,
            `Всего: ${stats.total}, активных: ${stats.active}`,
            ...prev.slice(0, 8)
          ]);
        }}
      />

      {/* Результаты действий */}
      {actionResults.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '12px',
          padding: '15px',
          marginTop: '25px'
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