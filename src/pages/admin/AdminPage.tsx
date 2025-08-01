// pages/admin/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

// Типы для навигации
type AdminSection = 'dashboard' | 'stats' | 'players' | 'exchange' | 'management';

// Конфигурация разделов
const ADMIN_SECTIONS = [
  { key: 'stats' as const, label: 'Полная статистика', icon: '📊', description: 'Детальная аналитика системы' },
  { key: 'players' as const, label: 'Управление игроками', icon: '👥', description: 'Поиск, редактирование, верификация' },
  { key: 'exchange' as const, label: 'Обмены и курсы', icon: '💱', description: 'Курсы валют, разблокировки' },
  { key: 'management' as const, label: 'Системные настройки', icon: '⚙️', description: 'Конфигурация системы' }
];

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  
  // Краткая статистика для дашборда
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Полная статистика с загрузкой данных
  const [fullStats, setFullStats] = useState<any>(null);
  const [fullStatsLoading, setFullStatsLoading] = useState(false);
  const [fullStatsError, setFullStatsError] = useState<string | null>(null);

  // Простая проверка админа
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        console.log('🔍 Простая проверка админа...');
        
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
        
        console.log('📱 Проверяем ID:', telegramId);
        
        if (String(telegramId) === '1222791281') {
          setIsAdmin(true);
          console.log('✅ Админ подтвержден');
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

  // Загрузка краткой статистики для дашборда
  const loadDashboardStats = async () => {
    if (!player?.telegram_id) return;
    
    setStatsLoading(true);
    
    try {
      console.log('📊 Загружаем краткую статистику...');
      const response = await axios.get(`${apiUrl}/api/admin/stats/${player.telegram_id}`);
      console.log('✅ Статистика загружена');
      setDashboardStats(response.data);
    } catch (err: any) {
      console.error('❌ Ошибка статистики:', err);
      // Не показываем ошибку на дашборде, просто логируем
    } finally {
      setStatsLoading(false);
    }
  };

  const loadFullStats = async () => {
    if (!player?.telegram_id) return;
    
    setFullStatsLoading(true);
    setFullStatsError(null);
    
    try {
      console.log('📊 Загружаем полную статистику...');
      const response = await axios.get(`${apiUrl}/api/admin/stats/${player.telegram_id}`);
      console.log('✅ Полная статистика загружена:', response.data);
      setFullStats(response.data);
    } catch (err: any) {
      console.error('❌ Ошибка полной статистики:', err);
      setFullStatsError(err.response?.data?.error || err.message || 'Ошибка загрузки');
    } finally {
      setFullStatsLoading(false);
    }
  };

  // Автозагрузка краткой статистики
  useEffect(() => {
    if (isAdmin && currentSection === 'dashboard') {
      loadDashboardStats();
    }
  }, [isAdmin, currentSection, player]);

  // Автозагрузка полной статистики при переходе в раздел
  useEffect(() => {
    if (currentSection === 'stats' && !fullStats && !fullStatsLoading) {
      loadFullStats();
    }
  }, [currentSection, player]);

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
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔐</div>
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

  // Дашборд с краткой статистикой
  const renderDashboard = () => (
    <div>
      {/* Навигационные кнопки */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {ADMIN_SECTIONS.map(section => (
          <button
            key={section.key}
            onClick={() => setCurrentSection(section.key)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `2px solid ${colorStyle}40`,
              borderRadius: '15px',
              padding: '25px',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = `0 0 25px ${colorStyle}30`;
              e.currentTarget.style.borderColor = colorStyle;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = `${colorStyle}40`;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '2rem' }}>{section.icon}</span>
              <h3 style={{ margin: 0, color: colorStyle, fontSize: '1.2rem' }}>
                {section.label}
              </h3>
            </div>
            <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem', lineHeight: 1.4 }}>
              {section.description}
            </p>
            <div style={{ 
              marginTop: '15px', 
              fontSize: '0.8rem', 
              color: colorStyle,
              opacity: 0.8,
              fontStyle: 'italic'
            }}>
              Нажмите для перехода →
            </div>
          </button>
        ))}
      </div>

      {/* Краткая статистика */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${colorStyle}40`,
        borderRadius: '15px',
        padding: '25px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ color: colorStyle, margin: 0 }}>📈 Краткая сводка</h3>
          <button
            onClick={loadDashboardStats}
            disabled={statsLoading}
            style={{
              padding: '8px 16px',
              background: statsLoading 
                ? 'rgba(255, 255, 255, 0.1)' 
                : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: statsLoading ? 'wait' : 'pointer',
              fontSize: '0.8rem'
            }}
          >
            {statsLoading ? '⏳ Загрузка...' : '🔄 Обновить'}
          </button>
        </div>

        {statsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
            <div>Загрузка сводки...</div>
          </div>
        ) : dashboardStats ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px'
          }}>
            {/* Игроки */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colorStyle, marginBottom: '5px' }}>
                {safeNumber(dashboardStats.players?.total_players)}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Всего игроков</div>
              <div style={{ fontSize: '0.8rem', color: '#4CAF50', marginTop: '8px' }}>
                ✅ {safeNumber(dashboardStats.players?.verified_players)} верифицированы
              </div>
            </div>

            {/* Балансы всех валют */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💰</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>Балансы в игре</div>
              <div style={{ display: 'grid', gap: '4px', fontSize: '0.8rem' }}>
                <div style={{ color: '#fff' }}>
                  CCC: <strong>{safeNumber(dashboardStats.currencies?.total_ccc).toFixed(2)}</strong>
                </div>
                <div style={{ color: '#FFD700' }}>
                  CS: <strong>{safeNumber(dashboardStats.currencies?.total_cs).toFixed(2)}</strong>
                </div>
                <div style={{ color: '#0088cc' }}>
                  TON: <strong>{safeNumber(dashboardStats.currencies?.total_ton).toFixed(4)}</strong>
                </div>
                <div style={{ color: '#FFA500' }}>
                  Stars: <strong>{safeNumber(dashboardStats.currencies?.total_stars)}</strong>
                </div>
              </div>
            </div>

            {/* Активность */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FF9800', marginBottom: '5px' }}>
                {safeNumber(dashboardStats.players?.active_24h)}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Активны за 24ч</div>
              <div style={{ fontSize: '0.8rem', color: '#2196F3', marginTop: '8px' }}>
                📅 {safeNumber(dashboardStats.players?.active_7d)} за неделю
              </div>
            </div>

            {/* Обмены всех направлений */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💱</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>Все обмены</div>
              <div style={{ display: 'grid', gap: '4px', fontSize: '0.8rem' }}>
                <div style={{ color: '#FFA500' }}>
                  Stars→CS: <strong>{safeNumber(dashboardStats.stars_exchange?.total_exchanges)}</strong>
                </div>
                <div style={{ color: '#fff' }}>
                  CCC→CS: <strong>0</strong> {/* TODO: добавить API */}
                </div>
                <div style={{ color: '#0088cc' }}>
                  CS↔TON: <strong>0</strong> {/* TODO: добавить API */}
                </div>
                <div style={{ color: '#4CAF50' }}>
                  За 24ч: <strong>{safeNumber(dashboardStats.stars_exchange?.exchanges_24h)}</strong>
                </div>
              </div>
            </div>

            {/* Мини-игры */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎮</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>Мини-игры</div>
              <div style={{ display: 'grid', gap: '4px', fontSize: '0.8rem' }}>
                <div style={{ color: '#FF6B35' }}>
                  Игр сыграно: <strong>0</strong> {/* TODO: добавить API */}
                </div>
                <div style={{ color: '#4ECDC4' }}>
                  Активных игроков: <strong>0</strong>
                </div>
                <div style={{ color: '#45B7D1' }}>
                  Награды выданы: <strong>0</strong>
                </div>
                <div style={{ color: '#96CEB4' }}>
                  Рекорды: <strong>0</strong>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
            <div>Нажмите "Обновить" для загрузки сводки</div>
          </div>
        )}
      </div>

      {/* Быстрые действия */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${colorStyle}40`,
        borderRadius: '15px',
        padding: '25px'
      }}>
        <h3 style={{ color: colorStyle, marginTop: 0, marginBottom: '20px' }}>⚡ Быстрые действия</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <button
            onClick={() => setCurrentSection('players')}
            style={{
              padding: '15px',
              background: 'linear-gradient(135deg, #4CAF50, #4CAF5088)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            👥 Найти игрока
          </button>
          <button
            onClick={() => setCurrentSection('exchange')}
            style={{
              padding: '15px',
              background: 'linear-gradient(135deg, #FF9800, #FF980088)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            📈 Обновить курс
          </button>
          <button
            onClick={() => setCurrentSection('stats')}
            style={{
              padding: '15px',
              background: 'linear-gradient(135deg, #2196F3, #2196F388)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            📊 Полная статистика
          </button>
          <button
            onClick={() => setCurrentSection('management')}
            style={{
              padding: '15px',
              background: 'linear-gradient(135deg, #9C27B0, #9C27B088)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            ⚙️ Настройки
          </button>
        </div>
      </div>
    </div>
  );

  const renderFullStats = () => (
    <div>
      {/* Заголовок секции */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '25px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h2 style={{ 
          color: colorStyle, 
          margin: 0,
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📊 Полная статистика системы
        </h2>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadFullStats}
            disabled={fullStatsLoading}
            style={{
              padding: '10px 16px',
              background: fullStatsLoading 
                ? 'rgba(255, 255, 255, 0.1)' 
                : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: fullStatsLoading ? 'wait' : 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {fullStatsLoading ? '⏳ Загрузка...' : '🔄 Обновить статистику'}
          </button>
          
          <button
            onClick={() => setCurrentSection('dashboard')}
            style={{
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: `2px solid ${colorStyle}40`,
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            ← Назад к дашборду
          </button>
        </div>
      </div>

      {/* Автозагрузка при первом открытии */}
      {!fullStats && !fullStatsLoading && !fullStatsError && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
          <div style={{ fontSize: '1.2rem', marginBottom: '10px', color: colorStyle }}>
            Детальная статистика системы
          </div>
          <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '20px' }}>
            Нажмите "Обновить статистику" для загрузки всех данных
          </div>
          <button
            onClick={loadFullStats}
            style={{
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            📊 Загрузить статистику
          </button>
        </div>
      )}

      {/* Загрузка */}
      {fullStatsLoading && (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '15px',
            animation: 'spin 1s linear infinite'
          }}>⏳</div>
          <div style={{ fontSize: '1.1rem', color: colorStyle, marginBottom: '8px' }}>
            Загружаем полную статистику...
          </div>
          <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
            Собираем данные о игроках, валютах, обменах и ТОП рейтинге
          </div>
        </div>
      )}

      {/* Ошибка */}
      {fullStatsError && !fullStatsLoading && (
        <div style={{
          background: 'rgba(255, 0, 0, 0.1)',
          border: '2px solid #ff4444',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>⚠️</div>
          <div style={{ color: '#ff6666', fontWeight: 'bold', marginBottom: '10px', fontSize: '1.1rem' }}>
            Ошибка загрузки полной статистики
          </div>
          <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>
            {fullStatsError}
          </div>
          <button
            onClick={loadFullStats}
            style={{
              padding: '10px 20px',
              background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🔄 Попробовать снова
          </button>
        </div>
      )}

      {/* Детальная статистика */}
      {fullStats && !fullStatsLoading && (
        <div>
          {/* Карточки детальной статистики */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            
            {/* Детальная статистика игроков */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${colorStyle}40`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👥 Детальная статистика игроков
              </h3>
              <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                <div>Всего игроков: <strong>{safeNumber(fullStats.players?.total_players)}</strong></div>
                <div>Верифицированных: <strong style={{ color: '#4CAF50' }}>{safeNumber(fullStats.players?.verified_players)}</strong></div>
                <div>Активны за 24ч: <strong style={{ color: '#FF9800' }}>{safeNumber(fullStats.players?.active_24h)}</strong></div>
                <div>Активны за 7 дней: <strong style={{ color: '#2196F3' }}>{safeNumber(fullStats.players?.active_7d)}</strong></div>
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#aaa' }}>
                  Процент верификации: <strong style={{ color: colorStyle }}>
                    {fullStats.players?.total_players > 0 
                      ? ((safeNumber(fullStats.players?.verified_players) / safeNumber(fullStats.players?.total_players)) * 100).toFixed(1)
                      : 0
                    }%
                  </strong>
                </div>
              </div>
            </div>

            {/* Детальная статистика валют */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${colorStyle}40`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💰 Детальная статистика валют
              </h3>
              <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                <div>Всего CCC: <strong>{safeNumber(fullStats.currencies?.total_ccc).toFixed(2)}</strong></div>
                <div>Всего CS: <strong style={{ color: '#FFD700' }}>{safeNumber(fullStats.currencies?.total_cs).toFixed(2)}</strong></div>
                <div>Всего TON: <strong style={{ color: '#0088cc' }}>{safeNumber(fullStats.currencies?.total_ton).toFixed(4)}</strong></div>
                <div>Всего Stars: <strong style={{ color: '#FFA500' }}>{safeNumber(fullStats.currencies?.total_stars)}</strong></div>
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#aaa' }}>
                  Средний CS на игрока: <strong style={{ color: '#FFD700' }}>
                    {safeNumber(fullStats.currencies?.avg_cs).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Детальная статистика всех обменов */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${colorStyle}40`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💱 Детальная статистика всех обменов
              </h3>
              <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                {/* Stars → CS */}
                <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: '#FFA500', fontWeight: 'bold', marginBottom: '4px' }}>🌟 Stars → CS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                    <div>Обменов: <strong>{safeNumber(fullStats.stars_exchange?.total_exchanges)}</strong></div>
                    <div>За 24ч: <strong>{safeNumber(fullStats.stars_exchange?.exchanges_24h)}</strong></div>
                    <div>Stars потрачено: <strong>{safeNumber(fullStats.stars_exchange?.total_stars_exchanged)}</strong></div>
                    <div>CS получено: <strong>{safeNumber(fullStats.stars_exchange?.total_cs_received).toFixed(2)}</strong></div>
                  </div>
                </div>

                {/* CCC → CS (TODO: добавить когда появится API) */}
                <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>🔄 CCC → CS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                    <div>Обменов: <strong>0</strong> {/* TODO: добавить API */}</div>
                    <div>За 24ч: <strong>0</strong></div>
                    <div>CCC потрачено: <strong>0.00</strong></div>
                    <div>CS получено: <strong>0.00</strong></div>
                  </div>
                </div>

                {/* CS → TON (TODO: добавить когда появится API) */}
                <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: '#0088cc', fontWeight: 'bold', marginBottom: '4px' }}>💎 CS → TON</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                    <div>Обменов: <strong>0</strong> {/* TODO: добавить API */}</div>
                    <div>За 24ч: <strong>0</strong></div>
                    <div>CS потрачено: <strong>0.00</strong></div>
                    <div>TON получено: <strong>0.0000</strong></div>
                  </div>
                </div>

                {/* TON → CS (обратный обмен) */}
                <div style={{ padding: '8px 0' }}>
                  <div style={{ color: '#0088cc', fontWeight: 'bold', marginBottom: '4px' }}>🔄 TON → CS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                    <div>Обменов: <strong>0</strong> {/* TODO: добавить API */}</div>
                    <div>За 24ч: <strong>0</strong></div>
                    <div>TON потрачено: <strong>0.0000</strong></div>
                    <div>CS получено: <strong>0.00</strong></div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#aaa', textAlign: 'center' }}>
                  Всего обменов всех типов: <strong style={{ color: colorStyle }}>
                    {safeNumber(fullStats.stars_exchange?.total_exchanges)}
                  </strong>
                  <br/>
                  <span style={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                    * CCC↔CS и CS↔TON обмены будут добавлены при появлении API
                  </span>
                </div>
              </div>
            </div>

            {/* Курсы валют */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${colorStyle}40`,
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📈 Текущие курсы валют
              </h3>
              <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
                <div>TON/USD: <strong style={{ color: '#0088cc' }}>
                  {fullStats.current_rates?.TON_USD 
                    ? `${safeNumber(fullStats.current_rates.TON_USD.rate).toFixed(2)}`
                    : 'Не загружен'
                  }
                </strong></div>
                <div>1 Star: <strong style={{ color: '#FFA500' }}>
                  {fullStats.current_rates?.STARS_CS 
                    ? `${safeNumber(fullStats.current_rates.STARS_CS.rate).toFixed(2)} CS`
                    : 'Не загружен'
                  }
                </strong></div>
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#aaa' }}>
                  Источник: <strong>
                    {fullStats.current_rates?.TON_USD?.source || 'неизвестно'}
                  </strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  Обновлено: <strong>
                    {fullStats.current_rates?.TON_USD?.last_updated 
                      ? new Date(fullStats.current_rates.TON_USD.last_updated).toLocaleString('ru-RU')
                      : 'неизвестно'
                    }
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* ТОП-10 игроков */}
          {fullStats.top_players && fullStats.top_players.length > 0 && (
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
                🏆 ТОП-10 игроков по CS
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: '0.9rem',
                  minWidth: '700px'
                }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${colorStyle}40` }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: colorStyle, fontWeight: 'bold' }}>#</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', color: colorStyle, fontWeight: 'bold' }}>Игрок</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>CS</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>CCC</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>TON</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>Stars</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullStats.top_players.map((topPlayer: any, index: number) => (
                      <tr 
                        key={topPlayer.telegram_id} 
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                            color: index < 3 ? '#000' : '#fff',
                            boxShadow: `0 0 10px ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : colorStyle}40`
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
                            fontSize: '1rem',
                            textShadow: '0 0 8px #FFD70040'
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
                            fontWeight: 'bold',
                            textShadow: '0 0 8px #0088cc40'
                          }}>
                            {safeNumber(topPlayer.ton).toFixed(4)}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <div style={{ 
                            color: '#FFA500', 
                            fontWeight: 'bold',
                            textShadow: '0 0 8px #FFA50040'
                          }}>
                            {safeNumber(topPlayer.telegram_stars)}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          {topPlayer.verified ? (
                            <span style={{ 
                              color: '#4CAF50', 
                              fontSize: '1.2rem',
                              filter: 'drop-shadow(0 0 4px #4CAF50)'
                            }}>✅</span>
                          ) : (
                            <span style={{ 
                              color: '#FF5722', 
                              fontSize: '1.2rem',
                              filter: 'drop-shadow(0 0 4px #FF5722)'
                            }}>❌</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Информация об обновлении */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(0, 255, 0, 0.05)',
            border: `1px solid #4CAF5040`,
            borderRadius: '10px',
            textAlign: 'center',
            fontSize: '0.9rem'
          }}>
            <div style={{ color: '#4CAF50', marginBottom: '5px' }}>✅ Полная статистика загружена успешно!</div>
            <div style={{ color: '#aaa' }}>
              Данные обновлены: {new Date().toLocaleString('ru-RU')}
            </div>
            <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '8px' }}>
              Игроков: {safeNumber(fullStats.players?.total_players)} | 
              CS: {safeNumber(fullStats.currencies?.total_cs).toFixed(2)} | 
              Обменов: {safeNumber(fullStats.stars_exchange?.total_exchanges)} |
              ТОП игроков: {fullStats.top_players?.length || 0}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Заглушки для других разделов
  const renderPlayersSection = () => (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👥</div>
      <h2 style={{ color: colorStyle, marginBottom: '10px' }}>Управление игроками</h2>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>Поиск, редактирование, верификация игроков</p>
      <button
        onClick={() => setCurrentSection('dashboard')}
        style={{
          padding: '10px 20px',
          background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer'
        }}
      >
        ← Назад к дашборду
      </button>
    </div>
  );

  const renderExchangeSection = () => (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💱</div>
      <h2 style={{ color: colorStyle, marginBottom: '10px' }}>Обмены и курсы</h2>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>Управление курсами валют и разблокировками</p>
      <button
        onClick={() => setCurrentSection('dashboard')}
        style={{
          padding: '10px 20px',
          background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer'
        }}
      >
        ← Назад к дашборду
      </button>
    </div>
  );

  const renderManagementSection = () => (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚙️</div>
      <h2 style={{ color: colorStyle, marginBottom: '10px' }}>Системные настройки</h2>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>Конфигурация и управление системой</p>
      <button
        onClick={() => setCurrentSection('dashboard')}
        style={{
          padding: '10px 20px',
          background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer'
        }}
      >
        ← Назад к дашборду
      </button>
    </div>
  );

  // Рендер разделов
  const renderSection = () => {
    switch (currentSection) {
      case 'stats':
        return renderFullStats();
      case 'players':
        return renderPlayersSection();
      case 'exchange':
        return renderExchangeSection();
      case 'management':
        return renderManagementSection();
      default:
        return renderDashboard();
    }
  };

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
          🔧 Админ панель CosmoClick
        </h1>
        
        {player && (
          <p style={{ fontSize: '1rem', color: '#aaa', margin: '0 0 15px 0' }}>
            Добро пожаловать, {player.first_name || player.username}! ID: {player.telegram_id}
          </p>
        )}
        
        {/* Навигация верхнего уровня */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
          {currentSection !== 'dashboard' && (
            <button
              onClick={() => setCurrentSection('dashboard')}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `2px solid ${colorStyle}`,
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🏠 Главная
            </button>
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
              fontSize: '0.9rem'
            }}
          >
            ← Вернуться в игру
          </button>
        </div>

        {/* Индикатор текущего раздела */}
        {currentSection !== 'dashboard' && (
          <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
            Текущий раздел: <span style={{ color: colorStyle }}>
              {ADMIN_SECTIONS.find(s => s.key === currentSection)?.label || 'Дашборд'}
            </span>
          </div>
        )}
      </div>

      {/* Контент */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {renderSection()}
      </div>
    </div>
  );
};

export default AdminPage;