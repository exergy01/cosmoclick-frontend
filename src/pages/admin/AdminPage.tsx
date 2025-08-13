// pages/admin/AdminPage.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ - ЧАСТЬ 1
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

interface AdminStats {
  players: {
    total_players: number;
    verified_players: number;
    active_24h: number;
    active_7d: number;
  };
  currencies: {
    total_ccc: number;
    total_cs: number;
    total_ton: number;
    total_stars: number;
  };
  all_exchanges?: {
    stars_to_cs?: {
      total_exchanges: number;
      exchanges_24h: number;
    };
    totals?: {
      all_exchanges: number;
      all_exchanges_24h: number;
    };
  };
  minigames?: {
    total_games: number;
    active_players: number;
  };
  top_players: Array<{
    telegram_id: string;
    first_name: string;
    username: string;
    cs: number;
    ccc: number;
    ton: number;
    verified: boolean;
    premium_no_ads_forever?: boolean;
    premium_no_ads_until?: string;
  }>;
}

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // Дополнительные состояния для функций
  const [testResults, setTestResults] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  // Проверка админа
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        let telegramId = player?.telegram_id;
        
        if (!telegramId) {
          const webApp = (window as any)?.Telegram?.WebApp;
          if (webApp?.initDataUnsafe?.user?.id) {
            telegramId = String(webApp.initDataUnsafe.user.id);
          }
        }
        
        if (!telegramId) {
          setError('Не удалось получить Telegram ID');
          setLoading(false);
          return;
        }
        
        if (String(telegramId) === '1222791281') {
          setIsAdmin(true);
        } else {
          setError('Доступ запрещен - не админ');
          setTimeout(() => navigate('/', { replace: true }), 3000);
        }
        
      } catch (err) {
        console.error('❌ Ошибка проверки:', err);
        setError('Ошибка проверки прав');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [player, navigate]);

  // Загрузка статистики
  const loadStats = async () => {
    if (!player?.telegram_id) return;
    
    setStatsLoading(true);
    setStatsError(null);
    
    try {
      const response = await axios.get(`${apiUrl}/api/admin/stats/${player.telegram_id}`);
      setStats(response.data);
    } catch (err: any) {
      console.error('❌ Ошибка статистики:', err);
      setStatsError(err.response?.data?.error || err.message || 'Ошибка загрузки');
    } finally {
      setStatsLoading(false);
    }
  };

  // Автозагрузка статистики
  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin, player]);

  // 🧪 ТЕСТОВЫЕ ФУНКЦИИ
  const runTest = async (testType: string, data?: any) => {
    const actionKey = `test_${testType}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      let url = '';
      let payload = {};
      
      switch (testType) {
        case 'daily_summary':
          url = `${apiUrl}/api/test/daily-summary`;
          payload = { telegramId: player?.telegram_id, force: true };
          break;
        case 'notify_stars':
          url = `${apiUrl}/api/test/notify-stars`;
          payload = {
            telegramId: player?.telegram_id,
            playerData: { telegram_id: player?.telegram_id, first_name: 'Test Admin' },
            amount: 100
          };
          break;
        case 'notify_ton':
          url = `${apiUrl}/api/test/notify-ton`;
          payload = {
            telegramId: player?.telegram_id,
            playerData: { telegram_id: player?.telegram_id, first_name: 'Test Admin' },
            amount: 5.5,
            transactionHash: 'test_' + Date.now()
          };
          break;
        case 'notify_withdrawal':
          url = `${apiUrl}/api/test/notify-withdrawal`;
          payload = {
            telegramId: player?.telegram_id,
            playerData: { telegram_id: player?.telegram_id, first_name: 'Test Admin' },
            amount: 10.0,
            withdrawalId: 'test_' + Date.now()
          };
          break;
        case 'simple_message':
          url = `${apiUrl}/api/test/simple-message`;
          payload = {
            telegramId: player?.telegram_id,
            message: data?.message || '🧪 Тестовое сообщение из админки!'
          };
          break;
      }
      
      const response = await axios.post(url, payload);
      
      if (response.data.success) {
        setTestResults(prev => [
          `✅ ${testType}: ${response.data.message}`,
          ...prev.slice(0, 9)
        ]);
      } else {
        setTestResults(prev => [
          `❌ ${testType}: ${response.data.error}`,
          ...prev.slice(0, 9)
        ]);
      }
      
    } catch (err: any) {
      console.error(`❌ Ошибка теста ${testType}:`, err);
      setTestResults(prev => [
        `❌ ${testType}: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };
  // 💰 УПРАВЛЕНИЕ БАЛАНСОМ ИГРОКА
  const updatePlayerBalance = async (playerId: string, currency: string, operation: string, amount: number) => {
    const actionKey = `balance_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.post(`${apiUrl}/api/admin/update-balance/${player?.telegram_id}`, {
        playerId,
        currency,
        operation,
        amount
      });
      
      if (response.data.success) {
        setTestResults(prev => [
          `✅ Баланс обновлен: ${playerId} ${currency} ${operation} ${amount}`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка обновления баланса:', err);
      setTestResults(prev => [
        `❌ Баланс: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // 🏆 НОВЫЕ ФУНКЦИИ УПРАВЛЕНИЯ ПРЕМИУМОМ
  
  // Базовая верификация (только галочка)
  const grantBasicVerification = async (playerId: string) => {
    const actionKey = `basic_verify_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.post(`${apiUrl}/api/admin/grant-basic-verification/${player?.telegram_id}`, {
        playerId
      });
      
      if (response.data.success) {
        setTestResults(prev => [
          `✅ Базовая верификация выдана: ${playerId}`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка базовой верификации:', err);
      setTestResults(prev => [
        `❌ Базовая верификация: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Премиум 30 дней (verified + премиум функции)
  const grantPremium30Days = async (playerId: string) => {
    const actionKey = `premium30_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.post(`${apiUrl}/api/admin/grant-premium-30days/${player?.telegram_id}`, {
        playerId
      });
      
      if (response.data.success) {
        setTestResults(prev => [
          `✅ Премиум 30 дней выдан: ${playerId} (+ verified)`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка премиум 30 дней:', err);
      setTestResults(prev => [
        `❌ Премиум 30 дней: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Премиум навсегда (verified + премиум функции навсегда)
  const grantPremiumForever = async (playerId: string) => {
    const actionKey = `premium_forever_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.post(`${apiUrl}/api/admin/grant-premium-forever/${player?.telegram_id}`, {
        playerId
      });
      
      if (response.data.success) {
        setTestResults(prev => [
          `✅ Премиум навсегда выдан: ${playerId} (+ verified)`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка премиум навсегда:', err);
      setTestResults(prev => [
        `❌ Премиум навсегда: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Отмена всех статусов (сброс verified + всех премиум полей)
  const revokeAllPremium = async (playerId: string) => {
    const actionKey = `revoke_all_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.post(`${apiUrl}/api/admin/revoke-premium/${player?.telegram_id}`, {
        playerId
      });
      
      if (response.data.success) {
        setTestResults(prev => [
          `✅ Все статусы отменены: ${playerId} (verified + премиум)`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка отмены статусов:', err);
      setTestResults(prev => [
        `❌ Отмена статусов: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // 🧪 Тестовая очистка премиума
  const testPremiumCleanup = async () => {
    const actionKey = 'test_cleanup';
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.post(`${apiUrl}/api/admin/test-premium-cleanup/${player?.telegram_id}`);
      
      if (response.data.success) {
        setTestResults(prev => [
          `✅ Тестовая очистка: ${JSON.stringify(response.data.cleanup_result)}`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка тестовой очистки:', err);
      setTestResults(prev => [
        `❌ Тестовая очистка: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Безопасное форматирование чисел
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

  // Определение типа верификации игрока
  const getPlayerVerificationType = (topPlayer: any) => {
    if (topPlayer.premium_no_ads_forever) {
      return { type: 'premium_forever', label: '🏆 Премиум навсегда', color: '#FFD700' };
    } else if (topPlayer.premium_no_ads_until && new Date(topPlayer.premium_no_ads_until) > new Date()) {
      return { type: 'premium_30days', label: '👑 Премиум 30д', color: '#FF6B35' };
    } else if (topPlayer.verified) {
      return { type: 'basic_verified', label: '✅ Базовая', color: '#4CAF50' };
    } else {
      return { type: 'not_verified', label: '❌ Нет', color: '#FF5722' };
    }
  };

  // Загрузка
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
        <div>Проверка прав...</div>
      </div>
    );
  }

  // Ошибка доступа
  if (error || !isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚫</div>
        <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
          {error || 'Доступ запрещен'}
        </div>
        <div style={{ color: '#aaa', marginBottom: '20px' }}>
          Перенаправление через 3 секунды...
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            background: '#00f0ff20',
            border: '2px solid #00f0ff',
            borderRadius: '10px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Вернуться в игру
        </button>
      </div>
    );
  }

  const colorStyle = player?.color || '#00f0ff';
  // Основной интерфейс админки
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#fff',
      padding: '20px'
    }}>
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: `2px solid ${colorStyle}`, paddingBottom: '20px' }}>
        <h1 style={{
          fontSize: '2rem',
          color: colorStyle,
          textShadow: `0 0 20px ${colorStyle}`,
          margin: '0 0 10px 0'
        }}>
          🔧 Админ панель CosmoClick (UNIFIED)
        </h1>
        
        {player && (
          <p style={{ fontSize: '1rem', color: '#aaa', margin: '0 0 15px 0' }}>
            Добро пожаловать, {player.first_name || player.username}! ID: {player.telegram_id}
          </p>
        )}
        
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '10px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          ← Вернуться в игру
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* 🧪 ТЕСТОВАЯ ПАНЕЛЬ */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: colorStyle, marginBottom: '20px' }}>🧪 Тестовые уведомления</h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => runTest('daily_summary')}
              disabled={actionLoading.test_daily_summary}
              style={{
                padding: '12px',
                background: actionLoading.test_daily_summary ? '#666' : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: actionLoading.test_daily_summary ? 'wait' : 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {actionLoading.test_daily_summary ? '⏳' : '📊'} Ежедневная сводка
            </button>
            
            <button
              onClick={() => runTest('notify_stars')}
              disabled={actionLoading.test_notify_stars}
              style={{
                padding: '12px',
                background: actionLoading.test_notify_stars ? '#666' : 'linear-gradient(135deg, #FFD700, #FFA500)',
                border: 'none',
                borderRadius: '10px',
                color: '#000',
                cursor: actionLoading.test_notify_stars ? 'wait' : 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {actionLoading.test_notify_stars ? '⏳' : '⭐'} Stars уведомление
            </button>
            
            <button
              onClick={() => runTest('notify_ton')}
              disabled={actionLoading.test_notify_ton}
              style={{
                padding: '12px',
                background: actionLoading.test_notify_ton ? '#666' : 'linear-gradient(135deg, #0088cc, #004466)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: actionLoading.test_notify_ton ? 'wait' : 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {actionLoading.test_notify_ton ? '⏳' : '💎'} TON уведомление
            </button>
            
            <button
              onClick={() => runTest('notify_withdrawal')}
              disabled={actionLoading.test_notify_withdrawal}
              style={{
                padding: '12px',
                background: actionLoading.test_notify_withdrawal ? '#666' : 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: actionLoading.test_notify_withdrawal ? 'wait' : 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {actionLoading.test_notify_withdrawal ? '⏳' : '💸'} Заявка на вывод
            </button>
            
            <button
              onClick={() => runTest('simple_message', { message: '🎮 Привет из админки CosmoClick!' })}
              disabled={actionLoading.test_simple_message}
              style={{
                padding: '12px',
                background: actionLoading.test_simple_message ? '#666' : 'linear-gradient(135deg, #9b59b6, #8e44ad)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: actionLoading.test_simple_message ? 'wait' : 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {actionLoading.test_simple_message ? '⏳' : '📱'} Простое сообщение
            </button>
            
            {/* 🧪 НОВАЯ КНОПКА: Тестовая очистка премиума */}
            <button
              onClick={testPremiumCleanup}
              disabled={actionLoading.test_cleanup}
              style={{
                padding: '12px',
                background: actionLoading.test_cleanup ? '#666' : 'linear-gradient(135deg, #e74c3c, #c0392b)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: actionLoading.test_cleanup ? 'wait' : 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {actionLoading.test_cleanup ? '⏳' : '🧹'} Тест очистки премиума
            </button>
          </div>
          
          {/* Результаты тестов */}
          {testResults.length > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${colorStyle}40`,
              borderRadius: '10px',
              padding: '15px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <h4 style={{ color: colorStyle, margin: '0 0 10px 0' }}>📋 Результаты тестов:</h4>
              {testResults.map((result, index) => (
                <div key={index} style={{ fontSize: '0.9rem', marginBottom: '5px', opacity: 1 - (index * 0.1) }}>
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Статистика */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: colorStyle, margin: 0 }}>📊 Статистика системы</h2>
          <button
            onClick={loadStats}
            disabled={statsLoading}
            style={{
              padding: '10px 20px',
              background: statsLoading 
                ? 'rgba(255, 255, 255, 0.1)' 
                : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              cursor: statsLoading ? 'wait' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {statsLoading ? '⏳ Загрузка...' : '🔄 Обновить статистику'}
          </button>
        </div>

        {/* Ошибка статистики */}
        {statsError && !statsLoading && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            border: '2px solid #ff4444',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
            <div style={{ color: '#ff6666', fontWeight: 'bold', marginBottom: '10px' }}>
              Ошибка загрузки статистики
            </div>
            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
              {statsError}
            </div>
          </div>
        )}

        {/* Данные статистики */}
        {stats && (
          <div>
            {/* Карточки статистики */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              
              {/* Статистика игроков */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  👥 Игроки
                </h3>
                <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                  <div>Всего: <strong>{safeNumber(stats.players?.total_players)}</strong></div>
                  <div>Верифицированных: <strong style={{ color: '#4CAF50' }}>{safeNumber(stats.players?.verified_players)}</strong></div>
                  <div>Активны 24ч: <strong style={{ color: '#FF9800' }}>{safeNumber(stats.players?.active_24h)}</strong></div>
                  <div>Активны 7д: <strong style={{ color: '#2196F3' }}>{safeNumber(stats.players?.active_7d)}</strong></div>
                </div>
              </div>

              {/* Статистика валют */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💰 Валюты
                </h3>
                <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                  <div>CCC: <strong>{safeNumber(stats.currencies?.total_ccc).toFixed(2)}</strong></div>
                  <div>CS: <strong style={{ color: '#FFD700' }}>{safeNumber(stats.currencies?.total_cs).toFixed(2)}</strong></div>
                  <div>TON: <strong style={{ color: '#0088cc' }}>{safeNumber(stats.currencies?.total_ton).toFixed(4)}</strong></div>
                  <div>Stars: <strong style={{ color: '#FFA500' }}>{safeNumber(stats.currencies?.total_stars)}</strong></div>
                </div>
              </div>

              {/* Статистика обменов */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💱 Обмены
                </h3>
                <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                  <div>Stars→CS: <strong>{safeNumber(stats.all_exchanges?.stars_to_cs?.total_exchanges)}</strong></div>
                  <div>Всего обменов: <strong style={{ color: '#fff' }}>{safeNumber(stats.all_exchanges?.totals?.all_exchanges)}</strong></div>
                  <div>За 24ч: <strong style={{ color: '#FF9800' }}>{safeNumber(stats.all_exchanges?.totals?.all_exchanges_24h)}</strong></div>
                </div>
              </div>

              {/* Статистика мини-игр */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎮 Мини-игры
                </h3>
                <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                  <div>Игр сыграно: <strong style={{ color: '#FF6B35' }}>{safeNumber(stats.minigames?.total_games)}</strong></div>
                  <div>Активных игроков: <strong style={{ color: '#4ECDC4' }}>{safeNumber(stats.minigames?.active_players)}</strong></div>
                </div>
              </div>
            </div>
            {/* 🏆 ТОП-10 игроков с НОВЫМИ кнопками управления */}
            {stats.top_players && stats.top_players.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '15px',
                padding: '25px',
                marginBottom: '20px'
              }}>
                <h3 style={{ 
                  color: colorStyle, 
                  marginTop: 0, 
                  marginBottom: '20px',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  fontSize: '1.3rem'
                }}>
                  🏆 ТОП-10 игроков (UNIFIED система)
                </h3>
                
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    fontSize: '0.9rem',
                    minWidth: '900px'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${colorStyle}40` }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', color: colorStyle, fontWeight: 'bold' }}>#</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', color: colorStyle, fontWeight: 'bold' }}>Игрок</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>CS</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>CCC</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>TON</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>Статус</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>🔧 Управление</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_players.map((topPlayer, index) => {
                        const verificationType = getPlayerVerificationType(topPlayer);
                        
                        return (
                          <tr 
                            key={topPlayer.telegram_id} 
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                          >
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: index < 3 
                                  ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] 
                                  : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                color: index < 3 ? '#000' : '#fff'
                              }}>
                                {index + 1}
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '0.95rem' }}>
                                  {topPlayer.first_name || topPlayer.username || 'Аноним'}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                  ID: {topPlayer.telegram_id}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <div style={{ 
                                color: '#FFD700', 
                                fontWeight: 'bold', 
                                fontSize: '1rem'
                              }}>
                                {safeNumber(topPlayer.cs).toFixed(2)}
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <div style={{ fontWeight: 'bold' }}>
                                {safeNumber(topPlayer.ccc).toFixed(2)}
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <div style={{ 
                                color: '#0088cc', 
                                fontWeight: 'bold'
                              }}>
                                {safeNumber(topPlayer.ton).toFixed(4)}
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              <div style={{
                                fontSize: '0.7rem',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                background: verificationType.color + '20',
                                border: `1px solid ${verificationType.color}60`,
                                color: verificationType.color,
                                fontWeight: 'bold'
                              }}>
                                {verificationType.label}
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              {/* 🔥 НОВЫЕ КНОПКИ UNIFIED УПРАВЛЕНИЯ */}
                              <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                
                                {/* Базовая верификация */}
                                <button
                                  onClick={() => grantBasicVerification(topPlayer.telegram_id)}
                                  disabled={actionLoading[`basic_verify_${topPlayer.telegram_id}`]}
                                  style={{
                                    padding: '3px 6px',
                                    background: actionLoading[`basic_verify_${topPlayer.telegram_id}`] ? '#666' : '#4CAF50',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    cursor: actionLoading[`basic_verify_${topPlayer.telegram_id}`] ? 'wait' : 'pointer',
                                    fontSize: '0.6rem',
                                    minWidth: '35px'
                                  }}
                                  title="Базовая верификация (только галочка)"
                                >
                                  {actionLoading[`basic_verify_${topPlayer.telegram_id}`] ? '⏳' : '✅'}
                                </button>
                                
                                {/* Премиум 30 дней */}
                                <button
                                  onClick={() => grantPremium30Days(topPlayer.telegram_id)}
                                  disabled={actionLoading[`premium30_${topPlayer.telegram_id}`]}
                                  style={{
                                    padding: '3px 6px',
                                    background: actionLoading[`premium30_${topPlayer.telegram_id}`] ? '#666' : '#FF6B35',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    cursor: actionLoading[`premium30_${topPlayer.telegram_id}`] ? 'wait' : 'pointer',
                                    fontSize: '0.6rem',
                                    minWidth: '35px'
                                  }}
                                  title="Премиум 30 дней + verified"
                                >
                                  {actionLoading[`premium30_${topPlayer.telegram_id}`] ? '⏳' : '👑'}
                                </button>
                                
                                {/* Премиум навсегда */}
                                <button
                                  onClick={() => grantPremiumForever(topPlayer.telegram_id)}
                                  disabled={actionLoading[`premium_forever_${topPlayer.telegram_id}`]}
                                  style={{
                                    padding: '3px 6px',
                                    background: actionLoading[`premium_forever_${topPlayer.telegram_id}`] ? '#666' : '#FFD700',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#000',
                                    cursor: actionLoading[`premium_forever_${topPlayer.telegram_id}`] ? 'wait' : 'pointer',
                                    fontSize: '0.6rem',
                                    minWidth: '35px'
                                  }}
                                  title="Премиум навсегда + verified"
                                >
                                  {actionLoading[`premium_forever_${topPlayer.telegram_id}`] ? '⏳' : '🏆'}
                                </button>
                                
                                {/* Отменить всё */}
                                <button
                                  onClick={() => revokeAllPremium(topPlayer.telegram_id)}
                                  disabled={actionLoading[`revoke_all_${topPlayer.telegram_id}`]}
                                  style={{
                                    padding: '3px 6px',
                                    background: actionLoading[`revoke_all_${topPlayer.telegram_id}`] ? '#666' : '#e74c3c',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    cursor: actionLoading[`revoke_all_${topPlayer.telegram_id}`] ? 'wait' : 'pointer',
                                    fontSize: '0.6rem',
                                    minWidth: '35px'
                                  }}
                                  title="Отменить все статусы"
                                >
                                  {actionLoading[`revoke_all_${topPlayer.telegram_id}`] ? '⏳' : '❌'}
                                </button>
                                
                                {/* +100 CS (быстрая премия) */}
                                <button
                                  onClick={() => updatePlayerBalance(topPlayer.telegram_id, 'cs', 'add', 100)}
                                  disabled={actionLoading[`balance_${topPlayer.telegram_id}`]}
                                  style={{
                                    padding: '3px 6px',
                                    background: actionLoading[`balance_${topPlayer.telegram_id}`] ? '#666' : '#9b59b6',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#fff',
                                    cursor: actionLoading[`balance_${topPlayer.telegram_id}`] ? 'wait' : 'pointer',
                                    fontSize: '0.6rem',
                                    minWidth: '35px'
                                  }}
                                  title="Добавить 100 CS"
                                >
                                  {actionLoading[`balance_${topPlayer.telegram_id}`] ? '⏳' : '+💰'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Легенда кнопок */}
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: '#aaa'
                }}>
                  <strong style={{ color: colorStyle }}>Легенда:</strong> 
                  <span style={{ color: '#4CAF50', marginLeft: '8px' }}>✅ Базовая верификация</span> |
                  <span style={{ color: '#FF6B35', marginLeft: '8px' }}>👑 Премиум 30д</span> |
                  <span style={{ color: '#FFD700', marginLeft: '8px' }}>🏆 Премиум ∞</span> |
                  <span style={{ color: '#e74c3c', marginLeft: '8px' }}>❌ Отменить всё</span> |
                  <span style={{ color: '#9b59b6', marginLeft: '8px' }}>+💰 +100 CS</span>
                </div>
              </div>
            )}
            {/* 💰 БЫСТРОЕ УПРАВЛЕНИЕ */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${colorStyle}40`,
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '20px' }}>
                💰 Быстрое управление (UNIFIED система)
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                
                {/* Базовая верификация */}
                <button
                  onClick={() => {
                    const playerId = prompt('ID игрока для БАЗОВОЙ верификации (только галочка):');
                    if (playerId) grantBasicVerification(playerId);
                  }}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ✅ Базовая верификация
                </button>
                
                {/* Премиум 30 дней */}
                <button
                  onClick={() => {
                    const playerId = prompt('ID игрока для ПРЕМИУМ 30 ДНЕЙ (verified + нет рекламы):');
                    if (playerId) grantPremium30Days(playerId);
                  }}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #FF6B35, #e55a2b)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  👑 Премиум 30 дней
                </button>
                
                {/* Премиум навсегда */}
                <button
                  onClick={() => {
                    const playerId = prompt('ID игрока для ПРЕМИУМ НАВСЕГДА (verified + нет рекламы навсегда):');
                    if (playerId) grantPremiumForever(playerId);
                  }}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #FFD700, #ddb800)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  🏆 Премиум навсегда
                </button>
                
                {/* Отменить все статусы */}
                <button
                  onClick={() => {
                    const playerId = prompt('ID игрока для ОТМЕНЫ ВСЕХ СТАТУСОВ (verified + премиум):');
                    if (playerId && confirm(`Вы уверены, что хотите отменить ВСЕ статусы игрока ${playerId}?\n\n- Verified = false\n- Премиум статус = false\n- Реклама включится`)) {
                      revokeAllPremium(playerId);
                    }
                  }}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  ❌ Отменить всё
                </button>
                
                {/* Добавить CS */}
                <button
                  onClick={() => {
                    const playerId = prompt('ID игрока:');
                    if (playerId) updatePlayerBalance(playerId, 'cs', 'add', 1000);
                  }}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  💰 Добавить 1000 CS
                </button>
                
                {/* Добавить TON */}
                <button
                  onClick={() => {
                    const playerId = prompt('ID игрока:');
                    if (playerId) updatePlayerBalance(playerId, 'ton', 'add', 5);
                  }}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #0088cc, #004466)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  💎 Добавить 5 TON
                </button>
                
                {/* Отправить сообщение игроку */}
                <button
                  onClick={async () => {
                    const playerId = prompt('ID игрока для отправки сообщения:');
                    if (!playerId?.trim()) return;
                    
                    const message = prompt('Текст сообщения игроку:');
                    if (!message?.trim()) return;
                    
                    const actionKey = `message_${playerId}`;
                    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
                    
                    try {
                      const response = await axios.post(`${apiUrl}/api/admin/send-message/${player?.telegram_id}`, {
                        playerId: playerId.trim(),
                        message: message.trim()
                      });
                      
                      if (response.data.success) {
                        setTestResults(prev => [
                          `✅ Сообщение отправлено игроку ${playerId} (${response.data.player?.first_name || 'Unknown'})`,
                          ...prev.slice(0, 9)
                        ]);
                      } else {
                        setTestResults(prev => [
                          `❌ Ошибка отправки сообщения: ${response.data.error}`,
                          ...prev.slice(0, 9)
                        ]);
                      }
                    } catch (err: any) {
                      console.error('❌ Ошибка отправки сообщения:', err);
                      setTestResults(prev => [
                        `❌ Сообщение: ${err.response?.data?.error || err.message}`,
                        ...prev.slice(0, 9)
                      ]);
                    } finally {
                      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
                    }
                  }}
                  disabled={actionLoading.message_individual}
                  style={{
                    padding: '12px',
                    background: actionLoading.message_individual 
                      ? '#666' 
                      : 'linear-gradient(135deg, #9b59b6, #8e44ad)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: actionLoading.message_individual ? 'wait' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {actionLoading.message_individual ? '⏳' : '📱'} Сообщение игроку
                </button>
                
                {/* Рассылка всем */}
                <button
                  onClick={async () => {
                    const message = prompt('Текст для рассылки всем игрокам:');
                    if (!message?.trim()) return;
                    
                    const onlyVerified = confirm('Отправить только верифицированным игрокам?\n\nОК = только верифицированным\nОтмена = всем игрокам');
                    
                    if (!confirm(`Вы уверены, что хотите отправить рассылку ${onlyVerified ? 'верифицированным' : 'всем'} игрокам?\n\nТекст: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`)) {
                      return;
                    }
                    
                    const actionKey = 'broadcast_message';
                    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
                    
                    try {
                      const response = await axios.post(`${apiUrl}/api/admin/broadcast-message/${player?.telegram_id}`, {
                        message: message.trim(),
                        onlyVerified: onlyVerified
                      });
                      
                      if (response.data.success) {
                        const stats = response.data.statistics;
                        setTestResults(prev => [
                          `✅ Рассылка завершена: отправлено ${stats.sent_count}/${stats.total_players} (${stats.success_rate}%)`,
                          ...prev.slice(0, 9)
                        ]);
                        
                        if (stats.error_count > 0) {
                          setTestResults(prev => [
                            `⚠️ Ошибок при рассылке: ${stats.error_count}`,
                            ...prev.slice(0, 9)
                          ]);
                        }
                      } else {
                        setTestResults(prev => [
                          `❌ Ошибка рассылки: ${response.data.error}`,
                          ...prev.slice(0, 9)
                        ]);
                      }
                    } catch (err: any) {
                      console.error('❌ Ошибка рассылки:', err);
                      setTestResults(prev => [
                        `❌ Рассылка: ${err.response?.data?.error || err.message}`,
                        ...prev.slice(0, 9)
                      ]);
                    } finally {
                      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
                    }
                  }}
                  disabled={actionLoading.broadcast_message}
                  style={{
                    padding: '12px',
                    background: actionLoading.broadcast_message 
                      ? '#666' 
                      : 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: actionLoading.broadcast_message ? 'wait' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {actionLoading.broadcast_message ? '⏳' : '📢'} Рассылка всем
                </button>
                
                {/* Кнопка тестового сообщения админу */}
                <button
                  onClick={() => {
                    const message = prompt('Тестовое сообщение себе (для отладки):') || 'Тестовое сообщение админу';
                    runTest('simple_message', { message });
                  }}
                  style={{
                    padding: '12px',
                    background: 'linear-gradient(135deg, #34495e, #2c3e50)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  🧪 Тест (себе)
                </button>
              </div>
            </div>

            {/* Информация об обновлении UNIFIED системы */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(0, 255, 0, 0.05)',
              border: `1px solid #4CAF5040`,
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '0.9rem'
            }}>
              <div style={{ color: '#4CAF50', marginBottom: '5px' }}>✅ UNIFIED система верификации активна!</div>
              <div style={{ color: '#aaa' }}>
                Данные обновлены: {new Date().toLocaleString('ru-RU')}
              </div>
              <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '8px' }}>
                🔥 <strong>Новая логика:</strong><br/>
                • <span style={{ color: '#4CAF50' }}>✅ Базовая верификация</span> = только галочка в профиле<br/>
                • <span style={{ color: '#FF6B35' }}>👑 Премиум 30д</span> = verified + нет рекламы 30 дней<br/>
                • <span style={{ color: '#FFD700' }}>🏆 Премиум ∞</span> = verified + нет рекламы навсегда<br/>
                • <span style={{ color: '#e74c3c' }}>❌ Отмена</span> = сброс всех статусов<br/>
                • При покупке премиума → auto verified = true<br/>
                • При истечении 30д → auto verified = false
              </div>
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {!stats && !statsLoading && !statsError && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: `1px solid ${colorStyle}20`
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
            <div style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Нажмите "Обновить статистику"</div>
            <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Получите актуальную информацию о системе CosmoClick с UNIFIED верификацией</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;