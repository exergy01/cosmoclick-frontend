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

  // Автозагрузка краткой статистики
  useEffect(() => {
    if (isAdmin && currentSection === 'dashboard') {
      loadDashboardStats();
    }
  }, [isAdmin, currentSection, player]);

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
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>Обмены</div>
              <div style={{ display: 'grid', gap: '4px', fontSize: '0.8rem' }}>
                <div style={{ color: '#4CAF50' }}>
                  Stars→CS: <strong>{safeNumber(dashboardStats.stars_exchange?.total_exchanges)}</strong>
                </div>
                <div style={{ color: '#FF9800' }}>
                  За 24ч: <strong>{safeNumber(dashboardStats.stars_exchange?.exchanges_24h)}</strong>
                </div>
                <div style={{ color: '#2196F3' }}>
                  Другие: <strong>0</strong> {/* TODO: добавить когда появятся */}
                </div>
                <div style={{ color: '#9C27B0' }}>
                  Всего: <strong>{safeNumber(dashboardStats.stars_exchange?.total_exchanges)}</strong>
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

  // Заглушки для других разделов
  const renderFullStats = () => (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📊</div>
      <h2 style={{ color: colorStyle, marginBottom: '10px' }}>Полная статистика</h2>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>Здесь будет детальная аналитика системы</p>
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