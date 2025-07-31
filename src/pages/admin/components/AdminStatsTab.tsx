// Замените AdminStatsTab.tsx на эту версию с визуальной отладкой
import React, { useEffect, useState } from 'react';
import { useAdminStats } from '../hooks/useAdminStats';
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
    
    const info = {
      // Telegram данные
      telegramExists: !!telegram,
      webAppExists: !!webApp,
      initDataUnsafe: webApp?.initDataUnsafe,
      userId: webApp?.initDataUnsafe?.user?.id,
      userName: webApp?.initDataUnsafe?.user?.first_name,
      userUsername: webApp?.initDataUnsafe?.user?.username,
      
      // Другие источники
      savedId: localStorage.getItem('telegramId'),
      currentUrl: window.location.href,
      urlParams: window.location.search,
      
      // Устройство
      userAgent: navigator.userAgent,
      isMobile: /Mobi|Android/i.test(navigator.userAgent),
      platform: navigator.platform,
      
      // Админский ID
      expectedAdminId: '1222791281',
      
      // Что мы получили
      finalId: webApp?.initDataUnsafe?.user?.id || localStorage.getItem('telegramId'),
      isAdmin: (webApp?.initDataUnsafe?.user?.id || localStorage.getItem('telegramId')) === '1222791281'
    };
    
    setDebugInfo(info);
    setShowDebug(true);
  };

  const handleForceTest = () => {
    // Принудительно устанавливаем админский ID
    localStorage.setItem('telegramId', '1222791281');
    alert('Установлен тестовый админский ID. Обновите страницу и попробуйте загрузить статистику.');
    window.location.reload();
  };

  const handleTelegramTest = () => {
    const webApp = (window as any)?.Telegram?.WebApp;
    if (webApp?.initDataUnsafe?.user?.id) {
      const id = String(webApp.initDataUnsafe.user.id);
      localStorage.setItem('telegramId', id);
      alert(`Найден Telegram ID: ${id}. Сохранен и перезагружаем...`);
      window.location.reload();
    } else {
      alert('Telegram WebApp данные не найдены. Убедитесь, что запускаете из Telegram.');
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
        gap: '10px'
      }}>
        <h2 style={{ 
          color: colorStyle, 
          margin: 0,
          fontSize: '1.5rem'
        }}>
          📊 Статистика
        </h2>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: '10px 15px',
              background: loading 
                ? 'rgba(255, 255, 255, 0.1)' 
                : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: loading ? 'wait' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {loading ? '⏳' : '🔄'} Загрузить
          </button>
          
          <button
            onClick={handleDebug}
            style={{
              padding: '10px 15px',
              background: 'linear-gradient(135deg, #ff6b35, #ff6b3588)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
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
          padding: '20px',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ color: colorStyle, margin: 0 }}>🔍 Диагностика</h3>
            <button 
              onClick={() => setShowDebug(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                borderRadius: '4px',
                padding: '5px 10px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ color: '#aaa', marginBottom: '10px' }}>📱 Telegram данные:</div>
            <div>• Telegram объект: {debugInfo.telegramExists ? '✅' : '❌'}</div>
            <div>• WebApp объект: {debugInfo.webAppExists ? '✅' : '❌'}</div>
            <div>• User ID: {debugInfo.userId || '❌ не найден'}</div>
            <div>• Имя: {debugInfo.userName || '❌ не найдено'}</div>
            <div>• Username: {debugInfo.userUsername || '❌ не найден'}</div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ color: '#aaa', marginBottom: '10px' }}>💾 Другие источники:</div>
            <div>• Сохраненный ID: {debugInfo.savedId || '❌ нет'}</div>
            <div>• URL параметры: {debugInfo.urlParams || '❌ нет'}</div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ color: '#aaa', marginBottom: '10px' }}>🎯 Результат:</div>
            <div>• Итоговый ID: <strong>{debugInfo.finalId || '❌ НЕ НАЙДЕН'}</strong></div>
            <div>• Админский ID должен быть: <strong>1222791281</strong></div>
            <div>• Является админом: {debugInfo.isAdmin ? '✅ ДА' : '❌ НЕТ'}</div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleTelegramTest}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #4CAF50, #4CAF5088)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              📱 Использовать Telegram ID
            </button>
            
            <button
              onClick={handleForceTest}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #FF9800, #FF980088)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              🧪 Тестовый админский ID
            </button>
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
          
          <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '15px' }}>
            🔧 <strong>Возможные причины:</strong><br/>
            • Telegram ID не найден<br/>
            • Приложение запущено не из Telegram<br/>
            • Проблемы с сервером<br/>
            • Вы не являетесь администратором
          </div>
          
          <button
            onClick={handleDebug}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #ff6b35, #ff6b3588)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🔍 Показать диагностику
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
                value: `$${stats.current_rates.TON_USD.rate}`,
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
          <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Информация о состоянии системы CosmoClick</div>
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
        </div>
      )}
    </div>
  );
};

export default AdminStatsTab;