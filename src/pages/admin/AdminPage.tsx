// pages/admin/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';

// Безопасные импорты с fallback
let AdminLayout: React.FC<any> | null = null;
let AdminStatsTab: React.FC<any> | null = null;
let useAdminAuth: any = null;

try {
  AdminLayout = require('./components/AdminLayout').default;
} catch (e) {
  console.error('Ошибка импорта AdminLayout:', e);
}

try {
  AdminStatsTab = require('./components/AdminStatsTab').default;
} catch (e) {
  console.error('Ошибка импорта AdminStatsTab:', e);
}

try {
  useAdminAuth = require('./hooks/useAdminAuth').useAdminAuth;
} catch (e) {
  console.error('Ошибка импорта useAdminAuth:', e);
}

type AdminTabType = 'stats' | 'players' | 'exchange' | 'management';

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<AdminTabType>('stats');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Проверка админских прав без хука (если хук не загрузился)
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        console.log('🔍 Проверяем админские права...');
        console.log('📱 Player:', player);
        
        if (!player?.telegram_id) {
          console.log('⚠️ Нет telegram_id в player');
          
          // Пробуем получить из Telegram WebApp
          const webApp = (window as any)?.Telegram?.WebApp;
          if (webApp?.initDataUnsafe?.user?.id) {
            const telegramId = String(webApp.initDataUnsafe.user.id);
            console.log('📱 Найден ID в WebApp:', telegramId);
            
            if (telegramId === '1222791281') {
              setIsAdmin(true);
              setLoading(false);
              return;
            }
          }
          
          setError('Не удалось получить Telegram ID');
          setLoading(false);
          return;
        }
        
        // Проверяем админский ID
        const isAdminUser = String(player.telegram_id) === '1222791281';
        console.log('🔐 Проверка админа:', {
          telegramId: player.telegram_id,
          isAdmin: isAdminUser
        });
        
        if (isAdminUser) {
          setIsAdmin(true);
        } else {
          setError('Доступ запрещен! Только для администратора.');
          setTimeout(() => navigate('/', { replace: true }), 3000);
        }
        
      } catch (err) {
        console.error('❌ Ошибка проверки админа:', err);
        setError('Ошибка проверки прав доступа');
      } finally {
        setLoading(false);
      }
    };

    // Используем хук если доступен, иначе свою проверку
    if (useAdminAuth) {
      try {
        const { isAdmin: hookIsAdmin, loading: hookLoading, error: hookError } = useAdminAuth();
        setIsAdmin(hookIsAdmin);
        setLoading(hookLoading);
        setError(hookError);
      } catch (e) {
        console.error('Ошибка использования useAdminAuth:', e);
        checkAdmin();
      }
    } else {
      checkAdmin();
    }
  }, [player, navigate]);

  // Экран загрузки
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
        <div style={{ 
          fontSize: '4rem', 
          marginBottom: '20px',
          animation: 'pulse 2s infinite'
        }}>🔐</div>
        <div style={{ fontSize: '1.2rem', color: '#aaa' }}>Проверка прав доступа...</div>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}
        </style>
      </div>
    );
  }

  // Экран ошибки или отказа в доступе
  if (error || !isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
            {error ? '⚠️' : '🚫'}
          </div>
          <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
            {error ? 'Ошибка подключения' : 'Доступ запрещен'}
          </div>
          <div style={{ fontSize: '1rem', color: '#aaa', marginBottom: '20px' }}>
            {error || 'Только для администратора'}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
            Автоматическое перенаправление через 3 секунды...
          </div>
          
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid #00f0ff',
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00f0ff20';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Вернуться сейчас
          </button>
        </div>
      </div>
    );
  }

  const colorStyle = player?.color || '#00f0ff';

  const handlePlayerClick = (playerId: string) => {
    console.log('🔍 Клик по игроку:', playerId);
    setActiveTab('players');
  };

  // Простой рендер без сложных компонентов если они не загрузились
  if (!AdminLayout || !AdminStatsTab) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#fff',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: colorStyle,
            textShadow: `0 0 20px ${colorStyle}`,
            margin: '0 0 20px 0'
          }}>
            🔧 Админ панель CosmoClick
          </h1>
          
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

        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#ff6666', marginBottom: '15px' }}>
            Ошибка загрузки компонентов
          </h2>
          <p style={{ color: '#aaa', marginBottom: '20px' }}>
            Не удалось загрузить AdminLayout или AdminStatsTab компоненты
          </p>
          
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}20`,
            borderRadius: '10px',
            padding: '20px',
            marginTop: '20px'
          }}>
            <h3 style={{ color: colorStyle }}>Отладочная информация:</h3>
            <div style={{ textAlign: 'left', fontSize: '0.9rem', color: '#ccc' }}>
              <div>AdminLayout загружен: {AdminLayout ? '✅' : '❌'}</div>
              <div>AdminStatsTab загружен: {AdminStatsTab ? '✅' : '❌'}</div>
              <div>useAdminAuth загружен: {useAdminAuth ? '✅' : '❌'}</div>
              <div>Player ID: {player?.telegram_id || 'не найден'}</div>
              <div>Админский статус: {isAdmin ? '✅' : '❌'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <AdminStatsTab
            colorStyle={colorStyle}
            onPlayerClick={handlePlayerClick}
          />
        );
        
      case 'players':
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👥</div>
            <h2 style={{ color: colorStyle, marginBottom: '15px' }}>Управление игроками</h2>
            <p style={{ color: '#aaa' }}>Модуль в разработке</p>
          </div>
        );
        
      case 'exchange':
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💱</div>
            <h2 style={{ color: colorStyle, marginBottom: '15px' }}>Система обменов</h2>
            <p style={{ color: '#aaa' }}>Модуль в разработке</p>
          </div>
        );
        
      case 'management':
        return (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚙️</div>
            <h2 style={{ color: colorStyle, marginBottom: '15px' }}>Управление системой</h2>
            <p style={{ color: '#aaa' }}>Модуль в разработке</p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      colorStyle={colorStyle}
      playerName={player?.first_name || player?.username}
      playerId={player?.telegram_id}
      onBackClick={() => navigate('/')}
    >
      {renderTabContent()}
    </AdminLayout>
  );
};

export default AdminPage;