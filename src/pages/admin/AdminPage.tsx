// pages/admin/AdminPage.tsx - НОВАЯ СТРУКТУРА С РАЗДЕЛАМИ - ЧАСТЬ 1
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

// Новые типы для системы разделов
type AdminSection = 'overview' | 'statistics' | 'players' | 'quests' | 'minigames' | 'finance' | 'system' | 'notifications';

interface SectionButton {
  key: AdminSection;
  icon: string;
  label: string;
  color: string;
}

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  
  // Основные состояния
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // Состояния для действий и результатов
  const [actionResults, setActionResults] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  
  // Новые состояния для системы разделов
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [sectionLoading, setSectionLoading] = useState<{[key: string]: boolean}>({});
  
  // Конфигурация разделов
  const sections: SectionButton[] = [
    { key: 'overview', icon: '📊', label: 'Обзор', color: '#3498db' },
    { key: 'statistics', icon: '📈', label: 'Статистика', color: '#9b59b6' },
    { key: 'players', icon: '🎯', label: 'Игроки', color: '#e74c3c' },
    { key: 'quests', icon: '📋', label: 'Задания', color: '#27ae60' },
    { key: 'minigames', icon: '🎮', label: 'Мини-игры', color: '#f39c12' },
    { key: 'finance', icon: '💰', label: 'Финансы', color: '#16a085' },
    { key: 'system', icon: '🔧', label: 'Система', color: '#34495e' },
    { key: 'notifications', icon: '📨', label: 'Уведомления', color: '#e67e22' }
  ];

  const colorStyle = player?.color || '#00f0ff';
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
  // 🏆 ФУНКЦИИ УПРАВЛЕНИЯ ПРЕМИУМОМ И ИГРОКАМИ
  
  // Базовая верификация (только галочка)
  const grantBasicVerification = async (playerId: string) => {
    const actionKey = `basic_verify_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.post(`${apiUrl}/api/admin/grant-basic-verification/${player?.telegram_id}`, {
        playerId
      });
      
      if (response.data.success) {
        setActionResults(prev => [
          `✅ Базовая верификация выдана: ${playerId}`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка базовой верификации:', err);
      setActionResults(prev => [
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
        setActionResults(prev => [
          `✅ Премиум 30 дней выдан: ${playerId} (+ verified)`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка премиум 30 дней:', err);
      setActionResults(prev => [
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
        setActionResults(prev => [
          `✅ Премиум навсегда выдан: ${playerId} (+ verified)`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка премиум навсегда:', err);
      setActionResults(prev => [
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
        setActionResults(prev => [
          `✅ Все статусы отменены: ${playerId} (verified + премиум)`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка отмены статусов:', err);
      setActionResults(prev => [
        `❌ Отмена статусов: ${err.response?.data?.error || err.message}`,
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
        setActionResults(prev => [
          `✅ Баланс обновлен: ${playerId} ${currency} ${operation} ${amount}`,
          ...prev.slice(0, 9)
        ]);
        loadStats();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка обновления баланса:', err);
      setActionResults(prev => [
        `❌ Баланс: ${err.response?.data?.error || err.message}`,
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
  // 📋 ФУНКЦИИ УПРАВЛЕНИЯ ЗАДАНИЯМИ
  
  // Функция создания нового задания
  const createQuest = async (questData: any) => {
    const actionKey = 'create_quest';
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.post(`${apiUrl}/api/admin/quests/create/${player?.telegram_id}`, questData);
      
      if (response.data.success) {
        setActionResults(prev => [
          `✅ Задание создано: ${questData.quest_key}`,
          `Тип: ${questData.quest_type}, Награда: ${questData.reward_cs} CS`,
          `Языки: ${questData.target_languages ? questData.target_languages.join(', ') : 'все'}`,
          `Переводы: ${Object.keys(questData.translations).join(', ')}`,
          ...prev.slice(0, 6)
        ]);
      } else {
        setActionResults(prev => [
          `❌ Ошибка создания: ${response.data.error}`,
          ...prev.slice(0, 9)
        ]);
      }
    } catch (error: any) {
      console.error('❌ Ошибка создания задания:', error);
      setActionResults(prev => [
        `❌ Создание задания: ${error.response?.data?.error || error.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Функция обновления задания
  const updateQuest = async (questKey: string, updateData: any) => {
    const actionKey = `update_quest_${questKey}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.put(`${apiUrl}/api/admin/quests/update/${questKey}/${player?.telegram_id}`, updateData);
      
      if (response.data.success) {
        setActionResults(prev => [
          `✅ Задание обновлено: ${questKey}`,
          `Изменения: ${JSON.stringify(updateData)}`,
          ...prev.slice(0, 8)
        ]);
      } else {
        setActionResults(prev => [
          `❌ Ошибка обновления: ${response.data.error}`,
          ...prev.slice(0, 9)
        ]);
      }
    } catch (error: any) {
      console.error('❌ Ошибка обновления задания:', error);
      setActionResults(prev => [
        `❌ Обновление задания: ${error.response?.data?.error || error.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Функция тестирования нового задания
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
      
      const response = await axios.post(`${apiUrl}/api/admin/quests/create/${player?.telegram_id}`, testQuestData);
      
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
      const response = await axios.get(`${apiUrl}/api/admin/quests/list/${player?.telegram_id}`);
      
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
        const listResponse = await axios.get(`${apiUrl}/api/admin/quests/list/${player?.telegram_id}`);
        if (listResponse.data.success) {
          const testQuests = listResponse.data.quests.filter((q: any) => q.quest_key.includes('test_quest_'));
          
          let deletedCount = 0;
          for (const quest of testQuests) {
            try {
              await axios.delete(`${apiUrl}/api/admin/quests/delete/${quest.quest_key}/${player?.telegram_id}`);
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
  // RENDER: Loading состояние
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

  // RENDER: Error состояние
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
  // RENDER: Основной интерфейс админки
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#fff',
      padding: '15px'
    }}>
      {/* 🔝 ШАПКА АДМИНКИ */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '25px', 
        borderBottom: `2px solid ${colorStyle}`, 
        paddingBottom: '15px' 
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          color: colorStyle,
          textShadow: `0 0 20px ${colorStyle}`,
          margin: '0 0 10px 0'
        }}>
          🔧 Админ панель CosmoClick
        </h1>
        
        {player && (
          <p style={{ fontSize: '0.9rem', color: '#aaa', margin: '0 0 15px 0' }}>
            Добро пожаловать, {player.first_name || player.username}! ID: {player.telegram_id}
          </p>
        )}
        
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          ← Вернуться в игру
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* 📊 КРАТКАЯ СВОДКА */}
        {stats && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}40`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <h2 style={{ color: colorStyle, margin: 0, fontSize: '1.2rem' }}>📊 Краткая сводка</h2>
              <button
                onClick={loadStats}
                disabled={statsLoading}
                style={{
                  padding: '6px 12px',
                  background: statsLoading 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: statsLoading ? 'wait' : 'pointer',
                  fontSize: '0.7rem'
                }}
              >
                {statsLoading ? '⏳' : '🔄'} Обновить
              </button>
            </div>
            
            {/* Краткие метрики в одну строку */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              fontSize: '0.9rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#4CAF50', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {safeNumber(stats.players?.total_players)}
                </div>
                <div style={{ color: '#aaa', fontSize: '0.8rem' }}>👥 Всего игроков</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {safeNumber(stats.players?.verified_players)}
                </div>
                <div style={{ color: '#aaa', fontSize: '0.8rem' }}>✅ Верифицированных</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#FF9800', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {safeNumber(stats.players?.active_24h)}
                </div>
                <div style={{ color: '#aaa', fontSize: '0.8rem' }}>🔥 Активных 24ч</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#0088cc', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {safeNumber(stats.currencies?.total_ton).toFixed(2)}
                </div>
                <div style={{ color: '#aaa', fontSize: '0.8rem' }}>💎 Всего TON</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#e74c3c', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {safeNumber(stats.minigames?.total_games)}
                </div>
                <div style={{ color: '#aaa', fontSize: '0.8rem' }}>🎮 Игр сыграно</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#9b59b6', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {safeNumber(stats.all_exchanges?.totals?.all_exchanges)}
                </div>
                <div style={{ color: '#aaa', fontSize: '0.8rem' }}>💱 Обменов</div>
              </div>
            </div>
          </div>
        )}

        {/* 🎛️ НАВИГАЦИОННЫЕ КНОПКИ РАЗДЕЛОВ */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px'
        }}>
          <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '15px', fontSize: '1.1rem' }}>
            🎛️ Разделы управления
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px'
          }}>
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                style={{
                  padding: '12px 8px',
                  background: activeSection === section.key 
                    ? `linear-gradient(135deg, ${section.color}, ${section.color}DD)` 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${activeSection === section.key ? section.color : 'transparent'}`,
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: activeSection === section.key ? 'bold' : 'normal',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseEnter={e => {
                  if (activeSection !== section.key) {
                    e.currentTarget.style.background = `rgba(${parseInt(section.color.slice(1, 3), 16)}, ${parseInt(section.color.slice(3, 5), 16)}, ${parseInt(section.color.slice(5, 7), 16)}, 0.2)`;
                  }
                }}
                onMouseLeave={e => {
                  if (activeSection !== section.key) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{section.icon}</div>
                <div>{section.label}</div>
              </button>
            ))}
          </div>
          
          {/* Индикатор активного раздела */}
          <div style={{
            marginTop: '15px',
            padding: '8px 12px',
            background: `${sections.find(s => s.key === activeSection)?.color}20`,
            border: `1px solid ${sections.find(s => s.key === activeSection)?.color}40`,
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: sections.find(s => s.key === activeSection)?.color
          }}>
            Активный раздел: {sections.find(s => s.key === activeSection)?.icon} {sections.find(s => s.key === activeSection)?.label}
          </div>
        </div>
        {/* 📁 СОДЕРЖИМОЕ АКТИВНОГО РАЗДЕЛА */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          minHeight: '400px'
        }}>
          
          {/* РАЗДЕЛ: ОБЗОР */}
          {activeSection === 'overview' && (
            <div>
              <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '20px' }}>
                📊 Обзор системы
              </h3>
              <div style={{ color: '#aaa', textAlign: 'center', padding: '50px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏠</div>
                <div style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Добро пожаловать в админ панель!</div>
                <div style={{ fontSize: '0.9rem' }}>Выберите раздел для управления системой CosmoClick</div>
              </div>
            </div>
          )}

          {/* РАЗДЕЛ: ПОЛНАЯ СТАТИСТИКА */}
          {activeSection === 'statistics' && (
            <div>
              <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '20px' }}>
                📈 Полная статистика
              </h3>
              
              {stats ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px'
                }}>
                  {/* Детальная статистика игроков */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid #4CAF5040',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h4 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>👥 Игроки</h4>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                      <div>Всего зарегистрировано: <strong>{safeNumber(stats.players?.total_players)}</strong></div>
                      <div>Верифицированных: <strong>{safeNumber(stats.players?.verified_players)}</strong></div>
                      <div>Активны за 24ч: <strong>{safeNumber(stats.players?.active_24h)}</strong></div>
                      <div>Активны за 7д: <strong>{safeNumber(stats.players?.active_7d)}</strong></div>
                      <div style={{ marginTop: '8px', color: '#aaa' }}>
                        Конверсия верификации: {stats.players?.total_players > 0 ? 
                          ((safeNumber(stats.players?.verified_players) / safeNumber(stats.players?.total_players)) * 100).toFixed(1) + '%' : '0%'}
                      </div>
                    </div>
                  </div>

                  {/* Детальная статистика валют */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid #FFD70040',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h4 style={{ color: '#FFD700', margin: '0 0 10px 0' }}>💰 Экономика</h4>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                      <div>CCC в системе: <strong>{safeNumber(stats.currencies?.total_ccc).toLocaleString()}</strong></div>
                      <div>CS в системе: <strong>{safeNumber(stats.currencies?.total_cs).toLocaleString()}</strong></div>
                      <div>TON в системе: <strong>{safeNumber(stats.currencies?.total_ton).toFixed(4)}</strong></div>
                      <div>Stars в системе: <strong>{safeNumber(stats.currencies?.total_stars).toLocaleString()}</strong></div>
                      <div style={{ marginTop: '8px', color: '#aaa' }}>
                        Средний CS на игрока: {stats.players?.total_players > 0 ? 
                          (safeNumber(stats.currencies?.total_cs) / safeNumber(stats.players?.total_players)).toFixed(2) : '0'}
                      </div>
                    </div>
                  </div>

                  {/* Детальная статистика обменов */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid #1abc9c40',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h4 style={{ color: '#1abc9c', margin: '0 0 10px 0' }}>💱 Обмены</h4>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                      <div>Stars→CS обменов: <strong>{safeNumber(stats.all_exchanges?.stars_to_cs?.total_exchanges)}</strong></div>
                      <div>Всего обменов: <strong>{safeNumber(stats.all_exchanges?.totals?.all_exchanges)}</strong></div>
                      <div>Обменов за 24ч: <strong>{safeNumber(stats.all_exchanges?.totals?.all_exchanges_24h)}</strong></div>
                      <div style={{ marginTop: '8px', color: '#aaa' }}>
                      Активность обменов: {safeNumber(stats.all_exchanges?.totals?.all_exchanges) > 0 ? 
  ((safeNumber(stats.all_exchanges?.totals?.all_exchanges_24h) / safeNumber(stats.all_exchanges?.totals?.all_exchanges)) * 100).toFixed(1) + '% за сутки' : 'нет данных'}
                      </div>
                    </div>
                  </div>

                  {/* Детальная статистика мини-игр */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid #e74c3c40',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <h4 style={{ color: '#e74c3c', margin: '0 0 10px 0' }}>🎮 Мини-игры</h4>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                      <div>Всего игр сыграно: <strong>{safeNumber(stats.minigames?.total_games)}</strong></div>
                      <div>Активных игроков: <strong>{safeNumber(stats.minigames?.active_players)}</strong></div>
                      <div style={{ marginTop: '8px', color: '#aaa' }}>
                      Игр на игрока: {safeNumber(stats.minigames?.active_players) > 0 ? 
  (safeNumber(stats.minigames?.total_games) / safeNumber(stats.minigames?.active_players)).toFixed(1) : '0'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '50px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                  <div>Загрузите статистику для просмотра детальных данных</div>
                </div>
              )}
            </div>
          )}

          {/* РАЗДЕЛ: УПРАВЛЕНИЕ ИГРОКАМИ */}
          {activeSection === 'players' && (
            <div>
              <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '20px' }}>
                🎯 Управление игроками
              </h3>
              
              {/* Быстрые действия */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: colorStyle, marginBottom: '10px', fontSize: '0.9rem' }}>⚡ Быстрые действия:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  
                  <button
                    onClick={() => {
                      const playerId = prompt('ID игрока для БАЗОВОЙ верификации:');
                      if (playerId) grantBasicVerification(playerId);
                    }}
                    style={{
                      padding: '8px',
                      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    ✅ Базовая верификация
                  </button>
                  
                  <button
                    onClick={() => {
                      const playerId = prompt('ID игрока для ПРЕМИУМ 30 дней:');
                      if (playerId) grantPremium30Days(playerId);
                    }}
                    style={{
                      padding: '8px',
                      background: 'linear-gradient(135deg, #FF6B35, #e55a2b)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    👑 Премиум 30 дней
                  </button>
                  
                  <button
                    onClick={() => {
                      const playerId = prompt('ID игрока для ПРЕМИУМ навсегда:');
                      if (playerId) grantPremiumForever(playerId);
                    }}
                    style={{
                      padding: '8px',
                      background: 'linear-gradient(135deg, #FFD700, #ddb800)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#000',
                      cursor: 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    🏆 Премиум навсегда
                  </button>
                  
                  <button
                    onClick={() => {
                      const playerId = prompt('ID игрока для ОТМЕНЫ статусов:');
                      if (playerId && confirm(`Отменить ВСЕ статусы у игрока ${playerId}?`)) {
                        revokeAllPremium(playerId);
                      }
                    }}
                    style={{
                      padding: '8px',
                      background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    ❌ Отменить статусы
                  </button>
                  
                  <button
                    onClick={() => {
                      const playerId = prompt('ID игрока:');
                      if (playerId) updatePlayerBalance(playerId, 'cs', 'add', 1000);
                    }}
                    style={{
                      padding: '8px',
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#000',
                      cursor: 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    💰 +1000 CS
                  </button>
                  
                  <button
                    onClick={() => {
                      const playerId = prompt('ID игрока:');
                      if (playerId) updatePlayerBalance(playerId, 'ton', 'add', 5);
                    }}
                    style={{
                      padding: '8px',
                      background: 'linear-gradient(135deg, #0088cc, #004466)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    💎 +5 TON
                  </button>
                </div>
              </div>

              {/* ТОП-10 игроков */}
              {stats?.top_players && stats.top_players.length > 0 && (
                <div>
                  <h4 style={{ color: colorStyle, marginBottom: '15px', fontSize: '0.9rem' }}>
                    🏆 ТОП-10 игроков (управление):
                  </h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '12px'
                  }}>
                    {stats.top_players.slice(0, 10).map((topPlayer, index) => {
                      const verificationType = getPlayerVerificationType(topPlayer);
                      
                      return (
                        <div 
                          key={topPlayer.telegram_id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : colorStyle}40`,
                            borderRadius: '8px',
                            padding: '12px',
                            position: 'relative'
                          }}
                        >
                          {/* Номер места */}
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: index < 3 
                              ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] 
                              : `${colorStyle}88`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            color: index < 3 ? '#000' : '#fff'
                          }}>
                            {index + 1}
                          </div>
                          
                          {/* Информация об игроке */}
                          <div style={{ paddingRight: '30px', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '2px' }}>
                              {topPlayer.first_name || topPlayer.username || 'Аноним'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                              ID: {topPlayer.telegram_id}
                            </div>
                          </div>
                          
                          {/* Балансы */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '6px',
                            marginBottom: '8px',
                            fontSize: '0.7rem'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#FFD700', fontWeight: 'bold' }}>
                                {safeNumber(topPlayer.cs).toFixed(0)}
                              </div>
                              <div style={{ color: '#aaa', fontSize: '0.6rem' }}>CS</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: 'bold' }}>
                                {safeNumber(topPlayer.ccc).toFixed(0)}
                              </div>
                              <div style={{ color: '#aaa', fontSize: '0.6rem' }}>CCC</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ color: '#0088cc', fontWeight: 'bold' }}>
                                {safeNumber(topPlayer.ton).toFixed(3)}
                              </div>
                              <div style={{ color: '#aaa', fontSize: '0.6rem' }}>TON</div>
                            </div>
                          </div>
                          
                          {/* Статус */}
                          <div style={{ marginBottom: '8px', textAlign: 'center' }}>
                            <div style={{
                              fontSize: '0.6rem',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              background: verificationType.color + '20',
                              border: `1px solid ${verificationType.color}60`,
                              color: verificationType.color,
                              fontWeight: 'bold',
                              display: 'inline-block'
                            }}>
                              {verificationType.label}
                            </div>
                          </div>
                          
                          {/* Кнопки управления */}
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr 1fr 1fr', 
                            gap: '3px'
                          }}>
                            <button
                              onClick={() => grantBasicVerification(topPlayer.telegram_id)}
                              disabled={actionLoading[`basic_verify_${topPlayer.telegram_id}`]}
                              style={{
                                padding: '4px 2px',
                                background: actionLoading[`basic_verify_${topPlayer.telegram_id}`] ? '#666' : '#4CAF50',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                cursor: actionLoading[`basic_verify_${topPlayer.telegram_id}`] ? 'wait' : 'pointer',
                                fontSize: '0.6rem',
                                fontWeight: 'bold'
                              }}
                              title="Базовая верификация"
                            >
                              {actionLoading[`basic_verify_${topPlayer.telegram_id}`] ? '⏳' : '✅'}
                            </button>
                            
                            <button
                              onClick={() => grantPremium30Days(topPlayer.telegram_id)}
                              disabled={actionLoading[`premium30_${topPlayer.telegram_id}`]}
                              style={{
                                padding: '4px 2px',
                                background: actionLoading[`premium30_${topPlayer.telegram_id}`] ? '#666' : '#FF6B35',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                cursor: actionLoading[`premium30_${topPlayer.telegram_id}`] ? 'wait' : 'pointer',
                                fontSize: '0.6rem',
                                fontWeight: 'bold'
                              }}
                              title="Премиум 30 дней"
                            >
                              {actionLoading[`premium30_${topPlayer.telegram_id}`] ? '⏳' : '👑'}
                            </button>
                            
                            <button
                              onClick={() => grantPremiumForever(topPlayer.telegram_id)}
                              disabled={actionLoading[`premium_forever_${topPlayer.telegram_id}`]}
                              style={{
                                padding: '4px 2px',
                                background: actionLoading[`premium_forever_${topPlayer.telegram_id}`] ? '#666' : '#FFD700',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#000',
                                cursor: actionLoading[`premium_forever_${topPlayer.telegram_id}`] ? 'wait' : 'pointer',
                                fontSize: '0.6rem',
                                fontWeight: 'bold'
                              }}
                              title="Премиум навсегда"
                            >
                              {actionLoading[`premium_forever_${topPlayer.telegram_id}`] ? '⏳' : '🏆'}
                            </button>
                            
                            <button
                              onClick={() => revokeAllPremium(topPlayer.telegram_id)}
                              disabled={actionLoading[`revoke_all_${topPlayer.telegram_id}`]}
                              style={{
                                padding: '4px 2px',
                                background: actionLoading[`revoke_all_${topPlayer.telegram_id}`] ? '#666' : '#e74c3c',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                cursor: actionLoading[`revoke_all_${topPlayer.telegram_id}`] ? 'wait' : 'pointer',
                                fontSize: '0.6rem',
                                fontWeight: 'bold'
                              }}
                              title="Отменить всё"
                            >
                              {actionLoading[`revoke_all_${topPlayer.telegram_id}`] ? '⏳' : '❌'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* РАЗДЕЛ: УПРАВЛЕНИЕ ЗАДАНИЯМИ */}
          {activeSection === 'quests' && (
            <div>
              <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '20px' }}>
                📋 Управление заданиями
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                
                <button
                  onClick={async () => {
                    const actionKey = 'list_quests';
                    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
                    
                    try {
                      const response = await axios.get(`${apiUrl}/api/admin/quests/list/${player?.telegram_id}`);
                      
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
                  }}
                  disabled={actionLoading.list_quests}
                  style={{
                    padding: '10px',
                    background: actionLoading.list_quests ? '#666' : 'linear-gradient(135deg, #3498db, #2980b9)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: actionLoading.list_quests ? 'wait' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {actionLoading.list_quests ? '⏳' : '📋'} Список заданий
                </button>
                
                <button
                  onClick={testNewQuestCreation}
                  disabled={actionLoading.test_create_quest}
                  style={{
                    padding: '10px',
                    background: actionLoading.test_create_quest ? '#666' : 'linear-gradient(135deg, #27ae60, #229954)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: actionLoading.test_create_quest ? 'wait' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {actionLoading.test_create_quest ? '⏳' : '🧪'} Создать тест
                </button>
                
                <button
                  onClick={getQuestStatistics}
                  disabled={actionLoading.quest_statistics}
                  style={{
                    padding: '10px',
                    background: actionLoading.quest_statistics ? '#666' : 'linear-gradient(135deg, #9b59b6, #8e44ad)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: actionLoading.quest_statistics ? 'wait' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {actionLoading.quest_statistics ? '⏳' : '📊'} Статистика
                </button>
                
                <button
                  onClick={() => bulkUpdateQuests('delete_test')}
                  disabled={actionLoading.bulk_delete_test}
                  style={{
                    padding: '10px',
                    background: actionLoading.bulk_delete_test ? '#666' : 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: actionLoading.bulk_delete_test ? 'wait' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {actionLoading.bulk_delete_test ? '⏳' : '🧹'} Очистить тесты
                </button>
              </div>
              
              <div style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>
                💡 Полное управление заданиями: создание, редактирование, переводы, мануальные проверки
              </div>
            </div>
          )}

          {/* РАЗДЕЛ: МИНИ-ИГРЫ */}
          {activeSection === 'minigames' && (
            <div>
              <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '20px' }}>
                🎮 Управление мини-играми
              </h3>
              <div style={{ color: '#aaa', textAlign: 'center', padding: '50px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎮</div>
                <div style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Управление мини-играми</div>
                <div style={{ fontSize: '0.9rem' }}>Настройки лимитов, статистика игр, управление джекпотом</div>
                <div style={{ fontSize: '0.8rem', marginTop: '10px', color: '#666' }}>🚧 В разработке</div>
              </div>
            </div>
          )}

          {/* РАЗДЕЛ: ФИНАНСЫ */}
          {activeSection === 'finance' && (
            <div>
              <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '20px' }}>
                💰 Управление финансами
              </h3>
              <div style={{ color: '#aaa', textAlign: 'center', padding: '50px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💰</div>
                <div style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Финансовое управление</div>
                <div style={{ fontSize: '0.9rem' }}>Курсы валют, обмены, транзакции, настройки экономики</div>
                <div style={{ fontSize: '0.8rem', marginTop: '10px', color: '#666' }}>🚧 В разработке</div>
              </div>
            </div>
          )}

          {/* РАЗДЕЛ: СИСТЕМА */}
          {activeSection === 'system' && (
            <div>
              <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '20px' }}>
                🔧 Системные функции
              </h3>
              <div style={{ color: '#aaa', textAlign: 'center', padding: '50px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔧</div>
                <div style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Системное администрирование</div>
                <div style={{ fontSize: '0.9rem' }}>Резервное копирование, логи, тестирование, очистка данных</div>
                <div style={{ fontSize: '0.8rem', marginTop: '10px', color: '#666' }}>🚧 В разработке</div>
              </div>
            </div>
          )}

          {/* РАЗДЕЛ: УВЕДОМЛЕНИЯ */}
          {activeSection === 'notifications' && (
            <div>
              <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '20px' }}>
                📨 Управление уведомлениями
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                
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
                        setActionResults(prev => [
                          `✅ Сообщение отправлено игроку ${playerId}`,
                          ...prev.slice(0, 9)
                        ]);
                      } else {
                        setActionResults(prev => [
                          `❌ Ошибка отправки: ${response.data.error}`,
                          ...prev.slice(0, 9)
                        ]);
                      }
                    } catch (error: any) {
                      setActionResults(prev => [
                        `❌ Сообщение: ${error.response?.data?.error || error.message}`,
                        ...prev.slice(0, 9)
                      ]);
                    } finally {
                      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
                    }
                  }}
                  style={{
                    padding: '10px',
                    background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  📱 Сообщение игроку
                </button>
                
                <button
                  onClick={async () => {
                    const message = prompt('Текст для рассылки всем игрокам:');
                    if (!message?.trim()) return;
                    
                    const onlyVerified = confirm('Отправить только верифицированным игрокам?\n\nОК = только верифицированным\nОтмена = всем игрокам');
                    
                    if (!confirm(`Вы уверены, что хотите отправить рассылку ${onlyVerified ? 'верифицированным' : 'всем'} игрокам?`)) {
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
                        setActionResults(prev => [
                          `✅ Рассылка завершена: отправлено ${stats.sent_count}/${stats.total_players}`,
                          ...prev.slice(0, 9)
                        ]);
                      }
                    } catch (error: any) {
                      setActionResults(prev => [
                        `❌ Рассылка: ${error.response?.data?.error || error.message}`,
                        ...prev.slice(0, 9)
                      ]);
                    } finally {
                      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
                    }
                  }}
                  disabled={actionLoading.broadcast_message}
                  style={{
                    padding: '10px',
                    background: actionLoading.broadcast_message 
                      ? '#666' 
                      : 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: actionLoading.broadcast_message ? 'wait' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {actionLoading.broadcast_message ? '⏳' : '📢'} Рассылка всем
                </button>
              </div>
              
              <div style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center', padding: '20px' }}>
                💡 Отправка уведомлений игрокам: личные сообщения и массовые рассылки
              </div>
            </div>
          )}
        </div>

        {/* 📋 РЕЗУЛЬТАТЫ ДЕЙСТВИЙ */}
        {actionResults.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}40`,
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: colorStyle, margin: '0 0 10px 0', fontSize: '1rem' }}>📋 Результаты действий:</h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {actionResults.map((result, index) => (
                <div key={index} style={{ fontSize: '0.8rem', marginBottom: '4px', opacity: 1 - (index * 0.1) }}>
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🔥 ИНФОРМАЦИЯ О СИСТЕМЕ */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(0, 255, 0, 0.05)',
          border: `1px solid #4CAF5040`,
          borderRadius: '10px',
          textAlign: 'center',
          fontSize: '0.8rem'
        }}>
          <div style={{ color: '#4CAF50', marginBottom: '5px' }}>✅ UNIFIED система верификации активна!</div>
          <div style={{ color: '#aaa' }}>
            Обновлено: {new Date().toLocaleString('ru-RU')} | Версия: v2.0 | Разделы: {sections.length}
          </div>
          <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '8px' }}>
            🔥 Новая архитектура админки с разделами для удобного управления всеми аспектами CosmoClick
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;