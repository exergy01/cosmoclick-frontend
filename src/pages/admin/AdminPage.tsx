// pages/admin/AdminPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';
import { useAdminAuth } from './hooks/useAdminAuth';
import AdminLayout from './components/AdminLayout';
import type { AdminTabType } from './types';

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  const { isAdmin, loading, error } = useAdminAuth();
  
  const [activeTab, setActiveTab] = useState<AdminTabType>('stats');

  // Экран загрузки проверки админа
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '20px',
            animation: 'pulse 2s infinite'
          }}>🔐</div>
          <div style={{ fontSize: '1.2rem', color: '#aaa' }}>Проверка прав доступа...</div>
        </div>
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
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Автоматическое перенаправление через 3 секунды...
          </div>
          
          {/* Кнопка для ручного возврата */}
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '20px',
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <div>
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📊</div>
              <h2 style={{ color: colorStyle, marginBottom: '15px' }}>Статистика системы</h2>
              <p style={{ color: '#aaa', marginBottom: '30px' }}>
                Здесь будет отображаться общая статистика игроков, валют и обменов
              </p>
              
              {/* Макет будущих карточек статистики */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                {[
                  { icon: '👥', title: 'Игроки', desc: 'Общая статистика пользователей' },
                  { icon: '💰', title: 'Валюты', desc: 'Суммы всех валют в системе' },
                  { icon: '🌟', title: 'Обмены Stars', desc: 'Статистика обмена Stars' },
                  { icon: '📈', title: 'Курсы', desc: 'Текущие курсы валют' }
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colorStyle}20`,
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{item.icon}</div>
                    <h4 style={{ color: colorStyle, margin: '0 0 8px 0' }}>{item.title}</h4>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'players':
        return (
          <div>
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👥</div>
              <h2 style={{ color: colorStyle, marginBottom: '15px' }}>Управление игроками</h2>
              <p style={{ color: '#aaa', marginBottom: '30px' }}>
                Поиск игроков, просмотр подробной информации и управление аккаунтами
              </p>
              
              {/* Макет функций управления игроками */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px',
                maxWidth: '900px',
                margin: '0 auto'
              }}>
                {[
                  { icon: '🔍', title: 'Поиск игроков', desc: 'Найти игрока по ID, username или имени' },
                  { icon: '📋', title: 'Детали игрока', desc: 'Просмотр балансов, истории и статистики' },
                  { icon: '✅', title: 'Верификация', desc: 'Управление статусом верификации игроков' }
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colorStyle}20`,
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{item.icon}</div>
                    <h4 style={{ color: colorStyle, margin: '0 0 8px 0' }}>{item.title}</h4>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'exchange':
        return (
          <div>
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💱</div>
              <h2 style={{ color: colorStyle, marginBottom: '15px' }}>Система обменов</h2>
              <p style={{ color: '#aaa', marginBottom: '30px' }}>
                Мониторинг курсов валют и управление системой обменов
              </p>
              
              {/* Макет функций обменов */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                {[
                  { icon: '📊', title: 'Курсы валют', desc: 'Текущие курсы TON/USD и Stars/CS' },
                  { icon: '📈', title: 'Статистика', desc: 'История и статистика обменов' },
                  { icon: '🔓', title: 'Блокировки', desc: 'Управление блокировками обменов' }
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colorStyle}20`,
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{item.icon}</div>
                    <h4 style={{ color: colorStyle, margin: '0 0 8px 0' }}>{item.title}</h4>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'management':
        return (
          <div>
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚙️</div>
              <h2 style={{ color: colorStyle, marginBottom: '15px' }}>Управление системой</h2>
              <p style={{ color: '#aaa', marginBottom: '30px' }}>
                Инструменты для управления балансами игроков и настройками системы
              </p>
              
              {/* Макет функций управления */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '20px',
                maxWidth: '900px',
                margin: '0 auto'
              }}>
                {[
                  { icon: '💰', title: 'Управление балансами', desc: 'Изменение балансов игроков (CCC, CS, TON, Stars)' },
                  { icon: '📈', title: 'Курс TON', desc: 'Ручное обновление курса TON/USD' },
                  { icon: '🛡️', title: 'Безопасность', desc: 'Все действия логируются и проверяются' }
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${colorStyle}20`,
                      borderRadius: '12px',
                      padding: '20px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{item.icon}</div>
                    <h4 style={{ color: colorStyle, margin: '0 0 8px 0' }}>{item.title}</h4>
                    <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
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
      
      {/* Информация о разработке */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${colorStyle}20`,
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🚧</div>
        <h3 style={{ color: colorStyle, margin: '0 0 10px 0' }}>Модульная архитектура</h3>
        <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
          Админ панель переделана с модульной архитектурой. 
          Каждый компонент независим и может быть легко расширен или изменен.
        </p>
        <div style={{ 
          marginTop: '15px', 
          fontSize: '0.8rem', 
          color: '#666',
          fontFamily: 'monospace'
        }}>
          📁 /admin/components/ • /hooks/ • /services/ • /types/ • /utils/
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPage;