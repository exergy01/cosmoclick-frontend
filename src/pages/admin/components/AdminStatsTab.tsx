// pages/admin/components/AdminStatsTab.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import React, { useEffect, useState } from 'react';
import { useAdminStats } from '../hooks/useAdminStats';
import { forceSaveTelegramId, setTestAdminId, testAdminApi } from '../services/adminApi';
import AdminStatsCard from './AdminStatsCard';
import AdminTopPlayersTable from './AdminTopPlayersTable';

interface AdminStatsTabProps {
  colorStyle: string;
  onPlayerClick?: (playerId: string) => void;
}

// Безопасная функция для преобразования в число
const safeNumber = (value: any, defaultValue: number = 0): number => {
  try {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

// Безопасная функция для форматирования чисел
const safeFormat = (value: any, decimals: number = 0): string => {
  try {
    const num = safeNumber(value);
    return num.toFixed(decimals);
  } catch {
    return '0';
  }
};

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
    const telegram = (window as any)?.Telegram;
    const webApp = telegram?.WebApp;
    
    const webAppId = webApp?.initDataUnsafe?.user?.id;
    const savedId = localStorage.getItem('telegramId');
    const webAppIdStr = webAppId ? String(webAppId) : null;
    const adminIdStr = '1222791281';
    
    const info = {
      telegramExists: !!telegram,
      webAppExists: !!webApp,
      initDataUnsafe: webApp?.initDataUnsafe,
      userId: webAppId,
      userIdString: webAppIdStr,
      userName: webApp?.initDataUnsafe?.user?.first_name,
      userUsername: webApp?.initDataUnsafe?.user?.username,
      
      savedId: savedId,
      currentUrl: window.location.href,
      urlParams: window.location.search,
      
      userAgent: navigator.userAgent,
      isMobile: /Mobi|Android/i.test(navigator.userAgent),
      platform: navigator.platform,
      
      expectedAdminId: adminIdStr,
      webAppIdMatches: webAppIdStr === adminIdStr,
      savedIdMatches: savedId === adminIdStr,
      
      finalId: savedId || webAppIdStr,
      finalIdMatches: (savedId || webAppIdStr) === adminIdStr,
      
      webAppIdType: typeof webAppId,
      savedIdType: typeof savedId,
      adminIdType: typeof adminIdStr,
      
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
      
      // 🆕 Отладка НОВЫХ данных статистики
      statsData: stats ? {
        hasPlayers: !!stats.players,
        hasCurrencies: !!stats.currencies,
        hasStarsExchange: !!stats.stars_exchange,
        hasAllExchanges: !!stats.all_exchanges, // НОВОЕ поле
        hasMinigames: !!stats.minigames, // НОВОЕ поле
        hasDebug: !!stats.debug, // НОВОЕ поле с отладочной информацией
        
        playersData: stats.players,
        currenciesData: stats.currencies,
        starsExchangeData: stats.stars_exchange,
        allExchangesData: stats.all_exchanges, // НОВОЕ
        minigamesData: stats.minigames, // НОВОЕ
        debugData: stats.debug, // НОВОЕ
        topPlayersCount: stats.top_players?.length || 0,
        
        // Подробная диагностика новых полей
        detailedAnalysis: {
          activePlayers24h: stats.players?.active_24h,
          cccCsExchanges: stats.all_exchanges?.ccc_cs,
          csTonExchanges: stats.all_exchanges?.cs_ton,
          totalExchanges: stats.all_exchanges?.totals,
          minigamesTotalGames: stats.minigames?.total_games,
          activityFieldUsed: stats.debug?.activity_field_used,
          reasonValuesFound: stats.debug?.reason_values_found
        }
      } : null
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
          📊 Статистика системы
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
            {loading ? '⏳' : '🔄'} Обновить
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
            <h3 style={{ color: colorStyle, margin: 0, fontSize: '1rem' }}>🔍 Диагностика (включая новые поля)</h3>
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
          
          {/* Telegram данные */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem' }}>📱 Telegram WebApp:</div>
            <div>• User ID: <strong>{debugInfo.userId || '❌'}</strong> (тип: {debugInfo.webAppIdType})</div>
            <div>• Имя: {debugInfo.userName || '❌'}</div>
            <div>• Username: {debugInfo.userUsername || '❌'}</div>
          </div>

          {/* Сравнение ID */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem' }}>🔍 Проверка прав:</div>
            <div>• Сохраненный ID: <strong>{debugInfo.savedId || '❌'}</strong></div>
            <div>• Админский ID: <strong>{debugInfo.expectedAdminId}</strong></div>
            <div>• Является админом: <strong>{debugInfo.finalIdMatches ? '✅ ДА' : '❌ НЕТ'}</strong></div>
          </div>

          {/* 🆕 НОВАЯ СЕКЦИЯ - Диагностика данных статистики */}
          {debugInfo.statsData && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem' }}>📊 Анализ новых данных статистики:</div>
              <div>• Игроки: {debugInfo.statsData.hasPlayers ? '✅' : '❌'} (активны 24ч: <strong>{debugInfo.statsData.detailedAnalysis?.activePlayers24h || 0}</strong>)</div>
              <div>• Валюты: {debugInfo.statsData.hasCurrencies ? '✅' : '❌'}</div>
              <div>• Stars обмены: {debugInfo.statsData.hasStarsExchange ? '✅' : '❌'}</div>
              <div>• Все обмены (НОВОЕ): {debugInfo.statsData.hasAllExchanges ? '✅' : '❌'}</div>
              <div>• CCC↔CS: <strong>{(debugInfo.statsData.detailedAnalysis?.cccCsExchanges?.ccc_to_cs_exchanges || 0) + (debugInfo.statsData.detailedAnalysis?.cccCsExchanges?.cs_to_ccc_exchanges || 0)}</strong></div>
              <div>• CS↔TON: <strong>{(debugInfo.statsData.detailedAnalysis?.csTonExchanges?.cs_to_ton_exchanges || 0) + (debugInfo.statsData.detailedAnalysis?.csTonExchanges?.ton_to_cs_exchanges || 0)}</strong></div>
              <div>• Мини-игры (НОВОЕ): {debugInfo.statsData.hasMinigames ? '✅' : '❌'} (игр: <strong>{debugInfo.statsData.detailedAnalysis?.minigamesTotalGames || 0}</strong>)</div>
              <div>• Отладка БД (НОВОЕ): {debugInfo.statsData.hasDebug ? '✅' : '❌'}</div>
              {debugInfo.statsData.hasDebug && (
                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px' }}>
                  • Поле активности: <strong>{debugInfo.statsData.detailedAnalysis?.activityFieldUsed}</strong><br/>
                  • Найдено значений reason: <strong>{debugInfo.statsData.detailedAnalysis?.reasonValuesFound}</strong>
                </div>
              )}
            </div>
          )}
          
          <div style={{ 
            marginBottom: '15px',
            padding: '10px',
            background: debugInfo.finalIdMatches ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 87, 34, 0.2)',
            borderRadius: '8px'
          }}>
            <div style={{ color: '#aaa', marginBottom: '8px', fontSize: '0.85rem' }}>🎯 СТАТУС:</div>
            <div>• ID: <strong>{debugInfo.finalId || '❌ НЕ НАЙДЕН'}</strong></div>
            <div>• Доступ: <strong>{debugInfo.finalIdMatches ? '✅ РАЗРЕШЕН' : '❌ ЗАПРЕЩЕН'}</strong></div>
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
              📱 Получить из Telegram
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
            🔧 **Возможные причины:**<br/>
            • Backend возвращает неправильные данные<br/>
            • SQL запросы содержат ошибки<br/>
            • Поля в БД названы по-другому<br/>
            • Используйте диагностику для анализа
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

      {/* 🆕 ИСПРАВЛЕННЫЕ карточки статистики с поддержкой новых полей */}
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
              { label: 'Всего', value: safeNumber(stats.players?.total_players) },
              { label: 'Верифицированных', value: safeNumber(stats.players?.verified_players), color: '#4CAF50' },
              { label: 'Активны 24ч', value: safeNumber(stats.players?.active_24h), color: '#FF9800' },
              { label: 'Активны 7д', value: safeNumber(stats.players?.active_7d), color: '#2196F3' }
            ] : []}
          />

          {/* Статистика валют */}
          <AdminStatsCard
            title="Валюты"
            icon="💰"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              { label: 'CCC', value: safeFormat(stats.currencies?.total_ccc, 2) },
              { label: 'CS', value: safeFormat(stats.currencies?.total_cs, 2), color: '#FFD700' },
              { label: 'TON', value: safeFormat(stats.currencies?.total_ton, 4), color: '#0088cc' },
              { label: 'Stars', value: safeNumber(stats.currencies?.total_stars), color: '#FFA500' }
            ] : []}
          />

          {/* 🆕 НОВАЯ карточка - Все обмены (вместо только Stars) */}
          <AdminStatsCard
            title="Все обмены"
            icon="💱"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              { label: 'Stars→CS', value: safeNumber(stats.all_exchanges?.stars_to_cs?.total_exchanges || stats.stars_exchange?.total_exchanges), color: '#FFA500' },
              { label: 'CCC↔CS', value: safeNumber((stats.all_exchanges?.ccc_cs?.ccc_to_cs_exchanges || 0) + (stats.all_exchanges?.ccc_cs?.cs_to_ccc_exchanges || 0)), color: '#FFD700' },
              { label: 'CS↔TON', value: safeNumber((stats.all_exchanges?.cs_ton?.cs_to_ton_exchanges || 0) + (stats.all_exchanges?.cs_ton?.ton_to_cs_exchanges || 0)), color: '#0088cc' },
              { label: 'За 24ч', value: safeNumber(stats.all_exchanges?.totals?.all_exchanges_24h || stats.stars_exchange?.exchanges_24h), color: '#FF9800' }
            ] : []}
          />

          {/* 🆕 НОВАЯ карточка - Мини-игры */}
          <AdminStatsCard
            title="Мини-игры"
            icon="🎮"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              { label: 'Игр сыграно', value: safeNumber(stats.minigames?.total_games), color: '#FF6B35' },
              { label: 'Активных игроков', value: safeNumber(stats.minigames?.active_players), color: '#4ECDC4' },
              { label: 'Ставок на', value: safeFormat(stats.minigames?.total_bet, 2), color: '#45B7D1' },
              { label: 'Выиграно', value: safeFormat(stats.minigames?.total_won, 2), color: '#96CEB4' }
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
                value: `${safeFormat(stats.current_rates.TON_USD.rate, 2)}`,
                color: '#0088cc'
              }] : [{ label: 'TON/USD', value: 'Не загружен', color: '#666' }]),
              ...(stats.current_rates?.STARS_CS ? [{
                label: '1 Star',
                value: `${safeFormat(stats.current_rates.STARS_CS.rate, 2)} CS`,
                color: '#FFA500'
              }] : [{ label: 'Stars/CS', value: 'Не загружен', color: '#666' }])
            ] : []}
          />

          {/* 🆕 НОВАЯ карточка - Отладочная информация БД (только если есть debug данные) */}
          {stats?.debug && (
            <AdminStatsCard
              title="Отладка БД"
              icon="🔧"
              colorStyle={colorStyle}
              loading={loading}
              data={[
                { label: 'Поле активности', value: stats.debug.activity_field_used || 'неизвестно', color: '#9C27B0' },
                { label: 'Значений reason', value: stats.debug.reason_values_found || 0, color: '#9C27B0' },
                { label: 'ТОП reason', value: stats.debug.top_reasons?.join(', ').slice(0, 30) + '...' || 'нет данных', color: '#9C27B0' },
                { label: 'Таблиц проверено', value: stats.debug.tables_checked?.length || 0, color: '#9C27B0' }
              ]}
            />
          )}
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
          <div style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Нажмите "Обновить" для получения статистики</div>
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
      
      {/* 🆕 УЛУЧШЕННАЯ информация о статистике с новыми данными */}
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
            Игроков: {safeNumber(stats.players?.total_players)} | 
            Активны 24ч: {safeNumber(stats.players?.active_24h)} | 
            CS: {safeFormat(stats.currencies?.total_cs, 0)} | 
            Всего обменов: {safeNumber(stats.all_exchanges?.totals?.all_exchanges)} | 
            Игр: {safeNumber(stats.minigames?.total_games)}
          </div>
          {/* Показываем отладочную информацию если есть */}
          {stats.debug && (
            <div style={{ color: '#888', fontSize: '0.7rem', marginTop: '5px', fontStyle: 'italic' }}>
              🔧 Backend использует поле "{stats.debug.activity_field_used}" для активности, найдено {stats.debug.reason_values_found} различных типов операций
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStatsTab;