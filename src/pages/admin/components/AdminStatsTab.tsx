// pages/admin/components/AdminStatsTab.tsx
import React, { useEffect, useState } from 'react';
import { useAdminStats } from '../hooks/useAdminStats';
import { forceSaveTelegramId, setTestAdminId, testAdminApi } from '../services/adminApi';
import AdminStatsCard from './AdminStatsCard';
import AdminTopPlayersTable from './AdminTopPlayersTable';

interface AdminStatsTabProps {
  colorStyle: string;
  onPlayerClick?: (playerId: string) => void;
}

const AdminStatsTab: React.FC<AdminStatsTabProps> = ({
  colorStyle,
  onPlayerClick
}) => {
  const { stats, loading, error, loadStats, refresh } = useAdminStats();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [testingApi, setTestingApi] = useState(false);

  // Загружаем статистику при монтировании компонента
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = async () => {
    await refresh();
  };

  const handleDebug = () => {
    // Собираем всю отладочную информацию
    const telegram = (window as any)?.Telegram;
    const webApp = telegram?.WebApp;
    
    // Получаем все возможные ID
    const webAppId = webApp?.initDataUnsafe?.user?.id;
    const savedId = localStorage.getItem('telegramId');
    
    // Приводим к строкам для правильного сравнения
    const webAppIdStr = webAppId ? String(webAppId) : null;
    const adminIdStr = '1222791281';
    
    const info = {
      // Telegram данные
      telegramExists: !!telegram,
      webAppExists: !!webApp,
      initDataUnsafe: webApp?.initDataUnsafe,
      userId: webAppId,
      userIdString: webAppIdStr,
      userName: webApp?.initDataUnsafe?.user?.first_name,
      userUsername: webApp?.initDataUnsafe?.user?.username,
      
      // Другие источники
      savedId: savedId,
      currentUrl: window.location.href,
      urlParams: window.location.search,
      
      // Устройство
      userAgent: navigator.userAgent,
      isMobile: /Mobi|Android/i.test(navigator.userAgent),
      platform: navigator.platform,
      
      // Сравнение ID
      expectedAdminId: adminIdStr,
      webAppIdMatches: webAppIdStr === adminIdStr,
      savedIdMatches: savedId === adminIdStr,
      
      // Что мы получили итого
      finalId: savedId || webAppIdStr,
      finalIdMatches: (savedId || webAppIdStr) === adminIdStr,
      
      // Отладка типов
      webAppIdType: typeof webAppId,
      savedIdType: typeof savedId,
      adminIdType: typeof adminIdStr,
      
      // API информация
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    };
    
    setDebugInfo(info);
    setShowDebug(true);
  };

  const handleTelegramTest = () => {
    const savedId = forceSaveTelegramId();
    if (savedId) {
      alert(`✅ Telegram ID сохранен: ${savedId}\nПерезагружаем страницу...`);
      window.location.reload();
    } else {
      alert('❌ Не удалось получить Telegram ID из WebApp');
    }
  };

  const handleForceTest = () => {
    setTestAdminId();
    alert('🧪 Тестовый админский ID установлен!\nПерезагружаем страницу...');
    window.location.reload();
  };

  const handleApiTest = async () => {
    setTestingApi(true);
    try {
      await testAdminApi();
      alert('✅ Тест API завершен! Проверьте результаты в диагностике.');
      // Автоматически показываем диагностику после теста
      setTimeout(() => {
        handleDebug();
      }, 500);
    } catch (error) {
      alert(`❌ Ошибка тестирования API: ${error}`);
    } finally {
      setTestingApi(false);
    }
  };

  return (
    <div>
      {/* Заголовок с кнопками */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <h2 style={{ 
          color: colorStyle, 
          margin: 0,
          fontSize: '1.4rem'
        }}>
          📊 Статистика
        </h2>
        
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: '6px 10px',
              background: loading 
                ? 'rgba(255, 255, 255, 0.1)' 
                : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: '0.75rem'
            }}
          >
            {loading ? '⏳' : '🔄'} Загрузить
          </button>
          
          <button
            onClick={handleApiTest}
            disabled={testingApi}
            style={{
              padding: '6px 10px',
              background: testingApi 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #4CAF50, #4CAF5088)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: testingApi ? 'wait' : 'pointer',
              fontSize: '0.75rem'
            }}
          >
            {testingApi ? '⏳' : '🧪'} Тест API
          </button>
          
          <button
            onClick={handleDebug}
            style={{
              padding: '6px 10px',
              background: 'linear-gradient(135deg, #ff6b35, #ff6b3588)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            🔍 Диагностика
          </button>
        </div>
      </div>

      {/* Блок диагностики */}
      {showDebug && debugInfo && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: `2px solid ${colorStyle}`,
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '20px',
          fontSize: '0.8rem'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ color: colorStyle, margin: 0, fontSize: '1rem' }}>🔍 Подробная диагностика</h3>
            <button 
              onClick={() => setShowDebug(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                borderRadius: '4px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem' }}>📱 Telegram WebApp:</div>
            <div>• Telegram: {debugInfo.telegramExists ? '✅' : '❌'}</div>
            <div>• WebApp: {debugInfo.webAppExists ? '✅' : '❌'}</div>
            <div>• User ID: <strong>{debugInfo.userId || '❌'}</strong> (тип: {debugInfo.webAppIdType})</div>
            <div>• User ID как строка: <strong>{debugInfo.userIdString || '❌'}</strong></div>
            <div>• Имя: {debugInfo.userName || '❌'}</div>
            <div>• Username: {debugInfo.userUsername || '❌'}</div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem' }}>💾 localStorage:</div>
            <div>• Сохраненный ID: <strong>{debugInfo.savedId || '❌'}</strong> (тип: {debugInfo.savedIdType})</div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem' }}>🔍 Сравнение ID:</div>
            <div>• Админский ID: <strong>{debugInfo.expectedAdminId}</strong> (тип: {debugInfo.adminIdType})</div>
            <div>• WebApp ID совпадает: {debugInfo.webAppIdMatches ? '✅ ДА' : '❌ НЕТ'}</div>
            <div>• Сохраненный ID совпадает: {debugInfo.savedIdMatches ? '✅ ДА' : '❌ НЕТ'}</div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem' }}>🌐 API информация:</div>
            <div>• API URL: <strong>{debugInfo.apiUrl}</strong></div>
            <div>• Проверка: <code>/api/admin/check/{debugInfo.finalId}</code></div>
            <div>• Статистика: <code>/api/admin/stats/{debugInfo.finalId}</code></div>
          </div>
          
          <div style={{ 
            marginBottom: '15px',
            padding: '10px',
            background: debugInfo.finalIdMatches ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 87, 34, 0.2)',
            borderRadius: '8px'
          }}>
            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem' }}>🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:</div>
            <div>• Итоговый ID: <strong>{debugInfo.finalId || '❌ НЕ НАЙДЕН'}</strong></div>
            <div>• Является админом: <strong>{debugInfo.finalIdMatches ? '✅ ДА' : '❌ НЕТ'}</strong></div>
            {!debugInfo.finalIdMatches && (
              <div style={{ color: '#ff6666', fontSize: '0.75rem', marginTop: '5px' }}>
                ⚠️ ID не совпадает с админским! Попробуйте кнопки ниже.
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={handleTelegramTest}
              style={{
                padding: '5px 8px',
                background: 'linear-gradient(135deg, #4CAF50, #4CAF5088)',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              📱 Сохранить из Telegram
            </button>
            
            <button
              onClick={handleForceTest}
              style={{
                padding: '5px 8px',
                background: 'linear-gradient(135deg, #FF9800, #FF980088)',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              🧪 Принудительно админ
            </button>
            
            <button
              onClick={() => {
                localStorage.clear();
                alert('🗑️ localStorage очищен. Перезагружаем...');
                window.location.reload();
              }}
              style={{
                padding: '5px 8px',
                background: 'linear-gradient(135deg, #f44336, #f4433688)',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              🗑️ Очистить localStorage
            </button>
          </div>
          
          <div style={{ 
            marginTop: '10px',
            fontSize: '0.65rem',
            color: '#888',
            fontStyle: 'italic'
          }}>
            💡 Если кнопка "🧪 Тест API" показывает ошибки - проблема в backend
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && !loading && (
        <div style={{
          background: 'rgba(255, 0, 0, 0.1)',
          border: '2px solid #ff4444',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
          <div style={{ color: '#ff6666', fontWeight: 'bold', marginBottom: '10px' }}>
            Ошибка загрузки статистики
          </div>
          <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '15px' }}>
            {error}
          </div>
          
          <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '15px' }}>
            🔧 <strong>Диагностика показывает:</strong><br/>
            • Frontend правильно определяет админский ID<br/>
            • Проблема в передаче ID в API запросы<br/>
            • Попробуйте кнопку "🧪 Тест API" для диагностики<br/>
            • Если тест не проходит - проблема в backend
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleApiTest}
              disabled={testingApi}
              style={{
                padding: '8px 12px',
                background: testingApi 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'linear-gradient(135deg, #4CAF50, #4CAF5088)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: testingApi ? 'wait' : 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {testingApi ? '⏳ Тестируем...' : '🧪 Тестировать API'}
            </button>
            
            <button
              onClick={handleDebug}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #ff6b35, #ff6b3588)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              🔍 Показать диагностику
            </button>
          </div>
        </div>
      )}

      {/* Быстрые действия при ошибке */}
      {error && !showDebug && (
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleTelegramTest}
            style={{
              padding: '6px 10px',
              background: 'linear-gradient(135deg, #4CAF50, #4CAF5088)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            📱 Попробовать Telegram ID
          </button>
          
          <button
            onClick={handleForceTest}
            style={{
              padding: '6px 10px',
              background: 'linear-gradient(135deg, #FF9800, #FF980088)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            🧪 Форсировать админ доступ
          </button>
        </div>
      )}

      {/* Карточки статистики */}
      {(stats || loading) && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          
          {/* Статистика игроков */}
          <AdminStatsCard
            title="Игроки"
            icon="👥"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              { label: 'Всего', value: stats.players.total_players },
              { label: 'Верифицированных', value: stats.players.verified_players, color: '#4CAF50' },
              { label: 'Активны 24ч', value: stats.players.active_24h, color: '#FF9800' },
              { label: 'Активны 7д', value: stats.players.active_7d, color: '#2196F3' }
            ] : []}
          />

          {/* Статистика валют */}
          <AdminStatsCard
            title="Валюты"
            icon="💰"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              { label: 'CCC', value: (stats.currencies.total_ccc || 0).toFixed(2) },
              { label: 'CS', value: (stats.currencies.total_cs || 0).toFixed(2), color: '#FFD700' },
              { label: 'TON', value: (stats.currencies.total_ton || 0).toFixed(4), color: '#0088cc' },
              { label: 'Stars', value: stats.currencies.total_stars || 0, color: '#FFA500' }
            ] : []}
          />

          {/* Статистика обменов */}
          <AdminStatsCard
            title="Обмены Stars"
            icon="🌟"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              { label: 'Всего обменов', value: stats.stars_exchange.total_exchanges || 0 },
              { label: 'Stars обменено', value: stats.stars_exchange.total_stars_exchanged || 0, color: '#FFA500' },
              { label: 'CS получено', value: (stats.stars_exchange.total_cs_received || 0).toFixed(2), color: '#FFD700' },
              { label: 'За 24ч', value: stats.stars_exchange.exchanges_24h || 0, color: '#FF9800' }
            ] : []}
          />

          {/* Курсы */}
          <AdminStatsCard
            title="Курсы"
            icon="📈"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              ...(stats.current_rates?.TON_USD ? [{
                label: 'TON/USD',
                value: `${stats.current_rates.TON_USD.rate}`,
                color: '#0088cc'
              }] : [{ label: 'TON/USD', value: 'Не загружен', color: '#666' }]),
              ...(stats.current_rates?.STARS_CS ? [{
                label: '1 Star',
                value: `${stats.current_rates.STARS_CS.rate} CS`,
                color: '#FFA500'
              }] : [{ label: 'Stars/CS', value: 'Не загружен', color: '#666' }])
            ] : []}
          />
        </div>
      )}

      {/* ТОП игроков */}
      {(stats?.top_players || loading) && (
        <AdminTopPlayersTable
          players={stats?.top_players || []}
          colorStyle={colorStyle}
          onPlayerClick={onPlayerClick}
          loading={loading}
        />
      )}

      {/* Пустое состояние */}
      {!stats && !loading && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: `1px solid ${colorStyle}20`
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
          <div style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Нажмите "Загрузить" для получения статистики</div>
          <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '15px' }}>Информация о состоянии системы CosmoClick</div>
          
          <button
            onClick={handleApiTest}
            disabled={testingApi}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #4CAF50, #4CAF5088)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginTop: '10px'
            }}
          >
            {testingApi ? '⏳ Тестируем API...' : '🧪 Протестировать подключение'}
          </button>
        </div>
      )}
      
      {/* Информация о статистике */}
      {stats && (
        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: 'rgba(0, 255, 0, 0.05)',
          border: `1px solid #4CAF5040`,
          borderRadius: '10px',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          <div style={{ color: '#4CAF50', marginBottom: '5px' }}>✅ Статистика загружена успешно!</div>
          <div style={{ color: '#aaa' }}>
            Данные обновлены: {new Date().toLocaleString('ru-RU')}
          </div>
          <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '8px' }}>
            Всего игроков: {stats.players?.total_players || 0} | 
            Всего CS: {(stats.currencies?.total_cs || 0).toFixed(2)} | 
            Обменов: {stats.stars_exchange?.total_exchanges || 0}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStatsTab;