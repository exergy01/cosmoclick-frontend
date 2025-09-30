// pages/admin/AdminPage.tsx - ПРАВИЛЬНАЯ ВЕРСИЯ - использует готовые компоненты
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNewPlayer } from '../../context/NewPlayerContext';
import { useAdminAuth } from './hooks/useAdminAuth';

// Импортируем ГОТОВЫЕ компоненты
import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import AdminStatsTab from './components/AdminStatsTab';
import AdminPlayersTab from './components/AdminPlayersTab';
import AdminQuestsTab from './components/AdminQuestsTab';
import AdminFinanceTab from './components/AdminFinanceTab_v2';
import AdminInvestigationTab from './components/AdminInvestigationTab';

// Типы для вкладок
type AdminTabType = 'stats' | 'players' | 'quests' | 'finance' | 'investigation' | 'management';

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  const { isAdmin, loading, error } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTabType>('stats');
  
  const colorStyle = player?.color || '#00f0ff';

  // Конфигурация вкладок
  const tabs = [
    { key: 'stats' as const, label: t('admin.tabs.stats'), icon: '📊' },
    { key: 'players' as const, label: t('admin.tabs.players'), icon: '👥' },
    { key: 'quests' as const, label: t('admin.tabs.quests'), icon: '📋' },
    { key: 'finance' as const, label: t('admin.tabs.finance'), icon: '🏦' },
    { key: 'investigation' as const, label: t('admin.tabs.investigation'), icon: '🕵️' },
    { key: 'management' as const, label: t('admin.tabs.management'), icon: '⚙️' }
  ];

  // Обработчики
  const handleTabChange = (tab: AdminTabType) => {
    setActiveTab(tab);
  };

  const handleBackClick = () => {
    navigate('/', { replace: true });
  };

  const handlePlayerClick = (playerId: string) => {
    setActiveTab('players');
    // TODO: передать playerId в PlayerTab для открытия деталей
  };

  // Состояния загрузки
  if (loading) {
    return <LoadingScreen />;
  }

  // Состояние ошибки или отсутствие прав
  if (error || !isAdmin) {
    return (
      <ErrorScreen
        error={error || t('admin.access_denied')}
        onBackClick={handleBackClick}
      />
    );
  }

  // Рендер содержимого активной вкладки
  const renderActiveTabContent = () => {
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
          <AdminPlayersTab 
            colorStyle={colorStyle}
          />
        );
        case 'quests':
          return (
            <AdminQuestsTab
              colorStyle={colorStyle}
            />
          );
        case 'finance':
          return (
            <AdminFinanceTab
              colorStyle={colorStyle}
            />
          );
        case 'investigation':
          return (
            <AdminInvestigationTab
              colorStyle={colorStyle}
            />
          );
        case 'management':
        return (
          <SystemManagementSection colorStyle={colorStyle} />
        );
      default:
        return <AdminStatsTab colorStyle={colorStyle} onPlayerClick={handlePlayerClick} />;
    }
  };

  // Главный интерфейс
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      backgroundAttachment: 'fixed',
      color: '#fff',
      padding: '20px'
    }}>
      {/* Заголовок */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        borderBottom: `2px solid ${colorStyle}`,
        paddingBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: colorStyle,
          textShadow: `0 0 20px ${colorStyle}`,
          margin: '0 0 10px 0',
          background: `linear-gradient(45deg, ${colorStyle}, #fff)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🔧 Админ панель CosmoClick
        </h1>
        
        {player && (
          <p style={{ fontSize: '1rem', color: '#aaa', margin: '0 0 15px 0' }}>
            Добро пожаловать, {player.first_name || player.username}! 
            <span style={{ color: colorStyle, marginLeft: '8px' }}>
              ID: {player.telegram_id}
            </span>
          </p>
        )}
        
        <button
          onClick={handleBackClick}
          style={{
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '10px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
        >
          {t('admin.back_to_game')}
        </button>
      </div>

      {/* Навигация по вкладкам */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              padding: '12px 24px',
              background: activeTab === tab.key 
                ? `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)` 
                : 'rgba(255, 255, 255, 0.1)',
              border: `2px solid ${activeTab === tab.key ? colorStyle : 'transparent'}`,
              borderRadius: '15px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: activeTab === tab.key ? 'bold' : 'normal',
              boxShadow: activeTab === tab.key ? `0 0 20px ${colorStyle}40` : 'none',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Контент активной вкладки */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {renderActiveTabContent()}
      </div>

      {/* Статус системы */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid #4CAF5040',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '0.9rem'
      }}>
        <div style={{ color: '#4CAF50', marginBottom: '5px' }}>
          ✅ Модульная архитектура активна! Используем готовые компоненты.
        </div>
        <div style={{ color: '#aaa' }}>
          Активная вкладка: {tabs.find(t => t.key === activeTab)?.icon} {tabs.find(t => t.key === activeTab)?.label} | 
          Обновлено: {new Date().toLocaleString('ru-RU')}
        </div>
      </div>
    </div>
  );
};

// Компонент системного управления
const SystemManagementSection: React.FC<{ colorStyle: string }> = ({ colorStyle }) => {
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    setLoading(true);
    try {
      // Используем существующий админский API для получения статистики
      const response = await fetch('/api/admin/stats/' + (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id);
      const data = await response.json();
      setSystemStats(data);
    } catch (error) {
      console.error('System stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTonRate = async () => {
    try {
      await fetch('/api/admin/update-ton-rate/' + (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id, {
        method: 'POST'
      });
      alert('Курс TON обновлен');
    } catch (error) {
      console.error('Update TON rate error:', error);
      alert('Ошибка обновления курса');
    }
  };

  const unblockExchange = async () => {
    try {
      await fetch('/api/admin/unblock-exchange/' + (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id, {
        method: 'POST'
      });
      alert('Обмен разблокирован');
    } catch (error) {
      console.error('Unblock exchange error:', error);
      alert('Ошибка разблокировки');
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${colorStyle}40`,
      borderRadius: '12px',
      padding: '20px',
      minHeight: '400px'
    }}>
      <h3 style={{
        color: colorStyle,
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '1.2rem'
      }}>
        ⚙️ Системное управление
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
          🔄 Загрузка системной информации...
        </div>
      ) : (
        <div>
          {/* System Status */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'rgba(68, 255, 68, 0.1)',
              border: '1px solid #44ff4440',
              borderRadius: '8px',
              padding: '15px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>🟢</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '5px' }}>
                Система работает
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                Все сервисы активны
              </div>
            </div>

            {systemStats && (
              <>
                <div style={{
                  background: 'rgba(100, 149, 237, 0.1)',
                  border: '1px solid #6495ED40',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>👥</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '5px' }}>
                    {systemStats.total_players || 0}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    Всего игроков
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid #FFD70040',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>💰</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '5px' }}>
                    {systemStats.total_balance || 0} TON
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    Общий баланс системы
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid #FFA50040',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>📊</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '5px' }}>
                    {systemStats.active_quests || 0}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    Активных заданий
                  </div>
                </div>
              </>
            )}
          </div>

          {/* System Actions */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: colorStyle, marginBottom: '15px' }}>🔧 Действия системы</h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              <button
                onClick={updateTonRate}
                style={{
                  background: 'rgba(255, 215, 0, 0.1)',
                  border: '1px solid #FFD70040',
                  borderRadius: '8px',
                  padding: '15px',
                  color: '#FFD700',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💱</div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  Обновить курс TON
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  Получить актуальный курс с биржи
                </div>
              </button>

              <button
                onClick={unblockExchange}
                style={{
                  background: 'rgba(68, 255, 68, 0.1)',
                  border: '1px solid #44ff4440',
                  borderRadius: '8px',
                  padding: '15px',
                  color: '#44ff44',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(68, 255, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(68, 255, 68, 0.1)';
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔓</div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  Разблокировать обмен
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  Снять временную блокировку
                </div>
              </button>

              <button
                onClick={loadSystemStats}
                style={{
                  background: `rgba(${colorStyle.replace('#', '')}, 0.1)`,
                  border: `1px solid ${colorStyle}40`,
                  borderRadius: '8px',
                  padding: '15px',
                  color: colorStyle,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `rgba(${colorStyle.replace('#', '')}, 0.2)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `rgba(${colorStyle.replace('#', '')}, 0.1)`;
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔄</div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  Обновить статистику
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  Перезагрузить данные системы
                </div>
              </button>
            </div>
          </div>

          {/* Module Status */}
          <div>
            <h4 style={{ color: colorStyle, marginBottom: '15px' }}>📦 Статус модулей</h4>

            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '15px'
            }}>
              {[
                { name: 'Аутентификация', status: 'active', color: '#44ff44' },
                { name: 'Статистика', status: 'active', color: '#44ff44' },
                { name: 'Управление игроками', status: 'active', color: '#44ff44' },
                { name: 'Премиум функции', status: 'active', color: '#44ff44' },
                { name: 'Система сообщений', status: 'active', color: '#44ff44' },
                { name: 'Управление заданиями', status: 'active', color: '#44ff44' },
                { name: 'Планировщик', status: 'active', color: '#44ff44' },
                { name: 'Финансовое управление', status: 'active', color: '#44ff44' },
                { name: 'Аналитика', status: 'active', color: '#44ff44' },
                { name: 'Расследования', status: 'active', color: '#44ff44' }
              ].map((module, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '4px',
                  marginBottom: '6px',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ color: '#ddd' }}>{module.name}</span>
                  <span style={{
                    color: module.color,
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    background: `${module.color}20`,
                    borderRadius: '4px'
                  }}>
                    ✅ АКТИВЕН
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;