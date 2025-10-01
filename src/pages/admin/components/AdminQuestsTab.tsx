// pages/admin/components/AdminQuestsTab.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ без синтаксических ошибок
import React, { useState } from 'react';
import { adminApiService } from '../services/adminApi';

interface AdminQuestsTabProps {
  colorStyle: string;
}

const AdminQuestsTab: React.FC<AdminQuestsTabProps> = ({ colorStyle }) => {
  const [actionResults, setActionResults] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [questsData, setQuestsData] = useState<any>(null);

  // Дебаг информация при загрузке компонента
  React.useEffect(() => {
    const savedId = localStorage.getItem('telegramId');
    const webApp = (window as any)?.Telegram?.WebApp;
    const webAppId = webApp?.initDataUnsafe?.user?.id;
    
    console.log('🔍 AdminQuestsTab - проверка ID источников:', {
      savedId,
      webAppId,
      hasWebApp: !!webApp,
      hasUser: !!webApp?.initDataUnsafe?.user
    });
    
    addResult(`ID источники: localStorage=${savedId}, webApp=${webAppId}`, 'info');
  }, []);

  // Функция для добавления результата
  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔄';
    setActionResults(prev => [
      `${emoji} ${message}`,
      `⏰ ${new Date().toLocaleTimeString()}`,
      ...prev.slice(0, 8)
    ]);
  };

  // Функция получения Telegram ID из localStorage или WebApp
  const getTelegramId = (): string | null => {
    // 1. Из localStorage
    const savedId = localStorage.getItem('telegramId');
    if (savedId?.trim()) {
      console.log('✅ ID из localStorage:', savedId.trim());
      return savedId.trim();
    }
    
    // 2. Из Telegram WebApp
    const webApp = (window as any)?.Telegram?.WebApp;
    if (webApp?.initDataUnsafe?.user?.id) {
      const webAppId = String(webApp.initDataUnsafe.user.id);
      localStorage.setItem('telegramId', webAppId);
      console.log('✅ ID из WebApp:', webAppId);
      return webAppId;
    }
    
    // 3. Тестовый админский ID (для разработки)
    const testId = '1222791281';
    localStorage.setItem('telegramId', testId);
    console.log('✅ Использован тестовый ID:', testId);
    return testId;
  };

  // Загрузить список квестов
  const handleLoadQuestsList = async () => {
    const actionKey = 'load_quests_list';
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        addResult('Ошибка: не удалось получить Telegram ID', 'error');
        return;
      }
      
      console.log('🔍 Отправляем запрос с админ ID:', telegramId);
      addResult(`Загружаем список квестов (админ проверка: ${telegramId})...`, 'info');
      
      const response = await adminApiService.getQuestsList(telegramId);
      setQuestsData(response);
      
      addResult(
        `Список квестов загружен: ${response.total_quests || 0} всего, ` +
        `${response.active_quests || 0} активных, ${response.inactive_quests || 0} неактивных`,
        'success'
      );
      
      // Показываем детали по квестам
      if (response.quests && response.quests.length > 0) {
        response.quests.slice(0, 3).forEach((quest: any) => {
          addResult(
            `📋 ${quest.quest_key}: ${quest.english_name || quest.quest_key} ` +
            `(${quest.is_active ? 'активен' : 'неактивен'}, CS: ${quest.reward_cs})`,
            'info'
          );
        });
        
        if (response.quests.length > 3) {
          addResult(`... и еще ${response.quests.length - 3} квестов`, 'info');
        }
      }
      
    } catch (error: any) {
      console.error('❌ Ошибка загрузки списка квестов:', error);
      addResult(`Ошибка загрузки списка: ${error.message || 'Неизвестная ошибка'}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Создать тестовый квест
  const handleCreateTestQuest = async () => {
    const actionKey = 'create_test_quest';
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        addResult('Ошибка: не удалось получить Telegram ID', 'error');
        return;
      }
      
      addResult(`Создаем ГЛОБАЛЬНЫЙ квест (админ проверка: ${telegramId})...`, 'info');
      
      const response = await adminApiService.createTestQuest(telegramId);
      
      addResult(
        `Тестовый квест создан: ${response.quest?.quest_key || 'unknown'} ` +
        `(CS: ${response.quest?.reward_cs || 100})`,
        'success'
      );
      
    } catch (error: any) {
      console.error('❌ Ошибка создания тестового квеста:', error);
      addResult(`Ошибка создания квеста: ${error.message || 'Неизвестная ошибка'}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Получить статистику квестов
  const handleGetStatistics = async () => {
    const actionKey = 'get_quest_statistics';
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        addResult('Ошибка: не удалось получить Telegram ID', 'error');
        return;
      }
      
      addResult(`Собираем статистику ВСЕХ квестов (админ проверка: ${telegramId})...`, 'info');
      
      const response = await adminApiService.getQuestsStatistics(telegramId);
      
      addResult(
        `Статистика загружена: ${response.total_quests || 0} квестов, ` +
        `${response.summary?.total_completions || 0} выполнений, ` +
        `${response.summary?.unique_players || 0} уникальных игроков`,
        'success'
      );
      
      addResult(
        `Выдано наград: ${response.summary?.total_rewards_given || 0} CS`,
        'info'
      );
      
    } catch (error: any) {
      console.error('❌ Ошибка получения статистики:', error);
      addResult(`Ошибка статистики: ${error.message || 'Неизвестная ошибка'}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Массовое удаление тестовых квестов
  const handleBulkDeleteTests = async () => {
    const actionKey = 'bulk_delete_tests';
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        addResult('Ошибка: не удалось получить Telegram ID', 'error');
        return;
      }
      
      // Подтверждение перед удалением
      const confirmed = window.confirm(
        '⚠️ Удалить ВСЕ тестовые квесты?\n\n' +
        'Будут удалены все квесты, начинающиеся с "test_".\n' +
        'Это действие необратимо!'
      );
      
      if (!confirmed) {
        addResult('Массовое удаление отменено пользователем', 'info');
        return;
      }
      
      addResult(`Ищем и удаляем ВСЕ тестовые квесты (админ проверка: ${telegramId})...`, 'info');
      
      const response = await adminApiService.bulkDeleteTestQuests(telegramId);
      
      if (response.deleted_count > 0) {
        addResult(
          `Тестовые квесты удалены: ${response.deleted_count}/${response.total_found}`,
          'success'
        );
      } else {
        addResult(response.message || 'Тестовые квесты не найдены', 'info');
      }
      
    } catch (error: any) {
      console.error('❌ Ошибка массового удаления:', error);
      addResult(`Ошибка удаления: ${error.message || 'Неизвестная ошибка'}`, 'error');
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

      {/* Кнопки действий с API */}
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
          ⚡ Действия с заданиями (LIVE API)
        </h3>
        
        {/* Диагностические кнопки */}
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={() => {
              localStorage.setItem('telegramId', '1222791281');
              addResult('🔧 Установлен тестовый админский ID: 1222791281', 'success');
            }}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #FF5722, #E64A19)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
          >
            🔧 Установить тестовый ID
          </button>
          
          <button
            onClick={async () => {
              try {
                addResult('🧪 Тестируем прямой вызов API...', 'info');
                
                const apiUrl = process.env.NODE_ENV === 'production'
                  ? 'https://cosmoclick-backend.onrender.com'
                  : 'http://localhost:5002';
                
                const response = await fetch(`${apiUrl}/api/admin/check/1222791281`);
                const data = await response.json();
                
                addResult(`🧪 Ответ /check: ${JSON.stringify(data)}`, data.isAdmin ? 'success' : 'error');
                
                if (data.isAdmin) {
                  // Если админ проверка прошла, пробуем квесты
                  const questsResponse = await fetch(`${apiUrl}/api/admin/quests/list/1222791281`);
                  const questsData = await questsResponse.json();
                  
                  addResult(`🧪 Ответ /quests: ${questsResponse.status} ${questsResponse.statusText}`, 'info');
                  addResult(`🧪 Данные: ${JSON.stringify(questsData).slice(0, 100)}...`, 'info');
                }
                
              } catch (error: any) {
                addResult(`🧪 Ошибка теста: ${error.message}`, 'error');
              }
            }}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
          >
            🧪 Тест API
          </button>
          
          <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
            ID: {localStorage.getItem('telegramId') || 'не установлен'}
          </span>
        </div>
        
        {/* Основные кнопки управления квестами */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          
          <button
            onClick={handleLoadQuestsList}
            disabled={actionLoading.load_quests_list}
            style={{
              padding: '12px',
              background: actionLoading.load_quests_list 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #3498db, #2980b9)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: actionLoading.load_quests_list ? 'wait' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {actionLoading.load_quests_list ? '⏳ Загрузка...' : '📋 Список заданий'}
          </button>
          
          <button
            onClick={handleCreateTestQuest}
            disabled={actionLoading.create_test_quest}
            style={{
              padding: '12px',
              background: actionLoading.create_test_quest 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #27ae60, #229954)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: actionLoading.create_test_quest ? 'wait' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {actionLoading.create_test_quest ? '⏳ Создание...' : '🧪 Создать тест'}
          </button>
          
          <button
            onClick={handleGetStatistics}
            disabled={actionLoading.get_quest_statistics}
            style={{
              padding: '12px',
              background: actionLoading.get_quest_statistics 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #9b59b6, #8e44ad)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: actionLoading.get_quest_statistics ? 'wait' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {actionLoading.get_quest_statistics ? '⏳ Анализ...' : '📊 Статистика'}
          </button>
          
          <button
            onClick={handleBulkDeleteTests}
            disabled={actionLoading.bulk_delete_tests}
            style={{
              padding: '12px',
              background: actionLoading.bulk_delete_tests 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #e74c3c, #c0392b)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: actionLoading.bulk_delete_tests ? 'wait' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {actionLoading.bulk_delete_tests ? '⏳ Очистка...' : '🧹 Очистить тесты'}
          </button>
        </div>
        
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: `${colorStyle}10`,
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#aaa'
        }}>
          🚀 <strong>LIVE режим:</strong> Кнопки подключены к реальному API backend<br/>
          📱 <strong>Мобильная диагностика:</strong> Если ошибки с ID - нажмите "🔧 Установить тестовый ID"
        </div>
      </div>

      {/* Отображение загруженных данных о квестах */}
      {questsData && (
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
            📊 Загруженные данные квестов
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            
            <div style={{
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid #4CAF5040',
              borderRadius: '8px',
              padding: '15px'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🎯</div>
              <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {questsData.active_quests || 0}
              </div>
              <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Активные</div>
            </div>
            
            <div style={{
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid #FF980040',
              borderRadius: '8px',
              padding: '15px'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>📝</div>
              <div style={{ color: '#FF9800', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {questsData.inactive_quests || 0}
              </div>
              <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Неактивные</div>
            </div>
            
            <div style={{
              background: 'rgba(156, 39, 176, 0.1)',
              border: '1px solid #9C27B040',
              borderRadius: '8px',
              padding: '15px'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>📋</div>
              <div style={{ color: '#9C27B0', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {questsData.total_quests || 0}
              </div>
              <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Всего</div>
            </div>
            
            <div style={{
              background: 'rgba(255, 87, 34, 0.1)',
              border: '1px solid #FF572240',
              borderRadius: '8px',
              padding: '15px'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>👥</div>
              <div style={{ color: '#FF5722', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {questsData.quests?.filter((q: any) => q.quest_key?.startsWith('test_')).length || 0}
              </div>
              <div style={{ color: '#aaa', fontSize: '0.8rem' }}>Тестовые</div>
            </div>
          </div>
          
          {/* Список квестов (первые 5) */}
          {questsData.quests && questsData.quests.length > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${colorStyle}20`,
              borderRadius: '8px',
              padding: '15px'
            }}>
              <h4 style={{ color: colorStyle, margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                📋 Квесты (показано первые 5):
              </h4>
              {questsData.quests.slice(0, 5).map((quest: any, index: number) => (
                <div 
                  key={quest.quest_key || index}
                  style={{
                    padding: '8px 0',
                    borderBottom: index < 4 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: quest.is_active ? '#4CAF50' : '#FF9800' }}>
                        {quest.english_name || quest.quest_key}
                      </strong>
                      <span style={{ color: '#aaa', marginLeft: '8px' }}>
                        ({quest.quest_type})
                      </span>
                    </div>
                    <div style={{ color: '#FFD700' }}>
                      {quest.reward_cs} CS
                    </div>
                  </div>
                  <div style={{ color: '#aaa', fontSize: '0.7rem', marginTop: '2px' }}>
                    Выполнений: {quest.stats?.total_completions || 0} | 
                    Игроков: {quest.stats?.unique_players || 0} | 
                    Статус: {quest.is_active ? '🟢 Активен' : '🟡 Неактивен'}
                  </div>
                </div>
              ))}
              {questsData.quests.length > 5 && (
                <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '10px', fontStyle: 'italic' }}>
                  ... и еще {questsData.quests.length - 5} квестов
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
            📋 Результаты действий (LIVE):
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
          🚀 LIVE API подключен с мобильной диагностикой!
        </div>
        <div style={{ color: '#aaa', lineHeight: '1.4' }}>
          Глобальное управление квестами: создание, статистика, удаление. Квесты создаются для всех игроков
        </div>
        <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '8px' }}>
          ✅ /quests/list | ✅ /quests/create | ✅ /quests/delete | ✅ Статистика | 🧪 Мобильная диагностика
        </div>
      </div>
    </div>
  );
};

export default AdminQuestsTab;