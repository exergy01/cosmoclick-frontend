// pages/admin/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

type AdminSection = 'main' | 'players' | 'exchanges' | 'finances' | 'games' | 'settings';

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('main');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

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

  // Загрузка расширенной статистики
  const loadStats = async () => {
    if (!player?.telegram_id) return;
    
    setStatsLoading(true);
    setStatsError(null);
    
    try {
      console.log('📊 Загружаем расширенную статистику...');
      const response = await axios.get(`${apiUrl}/api/admin/stats/${player.telegram_id}`);
      console.log('✅ Расширенная статистика загружена:', response.data);
      setStats(response.data);
    } catch (err: any) {
      console.error('❌ Ошибка статистики:', err);
      setStatsError(err.response?.data?.error || err.message || 'Ошибка загрузки');
    } finally {
      setStatsLoading(false);
    }
  };

  // Автозагрузка статистики для главной страницы
  useEffect(() => {
    if (isAdmin && activeSection === 'main') {
      loadStats();
    }
  }, [isAdmin, activeSection]);

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

  // Навигационные кнопки
  const navButtons = [
    { key: 'main', icon: '🏠', label: 'Главная', desc: 'Общая статистика и обзор системы' },
    { key: 'players', icon: '👥', label: 'Игроки', desc: 'Поиск игроков и управление аккаунтами' },
    { key: 'exchanges', icon: '💱', label: 'Обмены', desc: 'Статистика всех видов обменов валют' },
    { key: 'finances', icon: '💰', label: 'Финансы', desc: 'TON операции и покупки Stars' },
    { key: 'games', icon: '🎮', label: 'Игры', desc: 'Статистика игр и магазина' },
    { key: 'settings', icon: '⚙️', label: 'Настройки', desc: 'Управление системой и курсами' }
  ];

  // Рендер главной страницы
  const renderMainSection = () => (
    <div>
      {/* Кнопки навигации */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {navButtons.slice(1).map(button => (
          <button
            key={button.key}
            onClick={() => setActiveSection(button.key as AdminSection)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `2px solid ${colorStyle}40`,
              borderRadius: '15px',
              padding: '20px',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${colorStyle}20`;
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = `0 0 20px ${colorStyle}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '2rem' }}>{button.icon}</span>
              <h3 style={{ margin: 0, color: colorStyle, fontSize: '1.2rem' }}>{button.label}</h3>
            </div>
            <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>{button.desc}</p>
          </button>
        ))}
      </div>

      {/* Общая статистика */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: colorStyle, margin: 0 }}>📊 Общая статистика</h2>
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
          {statsLoading ? '⏳ Загрузка...' : '🔄 Обновить'}
        </button>
      </div>

      {/* Ошибка статистики */}
      {statsError && (
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

      {/* Карточки статистики */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Игроки */}
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
              <div>Всего: <strong>{Number(stats.players?.total_players || 0)}</strong></div>
              <div>Верифицированных: <strong style={{ color: '#4CAF50' }}>{Number(stats.players?.verified_players || 0)}</strong></div>
              <div>Активны 24ч: <strong style={{ color: '#FF9800' }}>{Number(stats.players?.active_24h || 0)}</strong></div>
              <div>Активны 7д: <strong style={{ color: '#2196F3' }}>{Number(stats.players?.active_7d || 0)}</strong></div>
              <div>Новых за 24ч: <strong style={{ color: '#9C27B0' }}>{Number(stats.players?.new_24h || 0)}</strong></div>
            </div>
          </div>

          {/* Валюты */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}40`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💰 Валюты в системе
            </h3>
            <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
              <div>CCC: <strong>{Number(stats.currencies?.total_ccc || 0).toFixed(2)}</strong></div>
              <div>CS: <strong style={{ color: '#FFD700' }}>{Number(stats.currencies?.total_cs || 0).toFixed(2)}</strong></div>
              <div>TON: <strong style={{ color: '#0088cc' }}>{Number(stats.currencies?.total_ton || 0).toFixed(4)}</strong></div>
              <div>Stars: <strong style={{ color: '#FFA500' }}>{Number(stats.currencies?.total_stars || 0)}</strong></div>
            </div>
          </div>

          {/* Обмены Stars */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}40`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🌟 Обмены Stars → CS
            </h3>
            <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
              <div>Всего обменов: <strong>{Number(stats.stars_exchange?.total_exchanges || 0)}</strong></div>
              <div>Stars обменено: <strong style={{ color: '#FFA500' }}>{Number(stats.stars_exchange?.total_stars_exchanged || 0)}</strong></div>
              <div>CS получено: <strong style={{ color: '#FFD700' }}>{Number(stats.stars_exchange?.total_cs_received || 0).toFixed(2)}</strong></div>
              <div>За 24ч: <strong style={{ color: '#FF9800' }}>{Number(stats.stars_exchange?.exchanges_24h || 0)} обменов</strong></div>
            </div>
          </div>

          {/* Покупки Stars */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}40`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💳 Покупки Stars
            </h3>
            <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
              <div>Всего покупок: <strong>{Number(stats.stars_purchases?.total_purchases || 0)}</strong></div>
              <div>Stars куплено: <strong style={{ color: '#FFA500' }}>{Number(stats.stars_purchases?.total_stars_bought || 0)}</strong></div>
              <div>Средняя покупка: <strong>{Number(stats.stars_purchases?.avg_purchase_amount || 0).toFixed(0)} Stars</strong></div>
              <div>За 24ч: <strong style={{ color: '#FF9800' }}>{Number(stats.stars_purchases?.purchases_24h || 0)} покупок</strong></div>
            </div>
          </div>

          {/* TON операции */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}40`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔄 TON операции
            </h3>
            <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
              <div>Депозитов: <strong style={{ color: '#4CAF50' }}>{Number(stats.ton_operations?.total_deposits || 0)}</strong></div>
              <div>Выводов: <strong style={{ color: '#f44336' }}>{Number(stats.ton_operations?.total_withdrawals || 0)}</strong></div>
              <div>Внесено TON: <strong style={{ color: '#0088cc' }}>{Number(stats.ton_operations?.total_deposited || 0).toFixed(4)}</strong></div>
              <div>Выведено TON: <strong style={{ color: '#0088cc' }}>{Number(stats.ton_operations?.total_withdrawn || 0).toFixed(4)}</strong></div>
            </div>
          </div>

          {/* Курсы */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${colorStyle}40`,
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ color: colorStyle, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📈 Текущие курсы
            </h3>
            <div style={{ display: 'grid', gap: '8px', fontSize: '0.9rem' }}>
              <div>TON/USD: <strong style={{ color: '#0088cc' }}>
                {stats.current_rates?.TON_USD 
                  ? `${Number(stats.current_rates.TON_USD.rate || 0).toFixed(2)}`
                  : 'Не загружен'
                }
              </strong></div>
              <div>1 Star: <strong style={{ color: '#FFA500' }}>
                {stats.current_rates?.STARS_CS 
                  ? `${Number(stats.current_rates.STARS_CS.rate || 0).toFixed(2)} CS`
                  : 'Не загружен'
                }
              </strong></div>
            </div>
          </div>
        </div>
      )}

      {/* ТОП игроков */}
      {stats?.top_players && stats.top_players.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '15px',
          padding: '25px',
          marginBottom: '30px'
        }}>
          <h3 style={{ 
            color: colorStyle, 
            marginTop: 0, 
            marginBottom: '20px',
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px'
          }}>
            🏆 ТОП-15 игроков по CS
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
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: colorStyle }}>#</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', color: colorStyle }}>Игрок</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle }}>CS</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle }}>CCC</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle }}>TON</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle }}>Stars</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle }}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_players.map((topPlayer: any, index: number) => (
                  <tr key={topPlayer.telegram_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
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
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                          {topPlayer.first_name || topPlayer.username || 'Аноним'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                          ID: {topPlayer.telegram_id}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <strong style={{ color: '#FFD700' }}>{Number(topPlayer.cs || 0).toFixed(2)}</strong>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <strong>{Number(topPlayer.ccc || 0).toFixed(2)}</strong>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <strong style={{ color: '#0088cc' }}>{Number(topPlayer.ton || 0).toFixed(4)}</strong>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <strong style={{ color: '#FFA500' }}>{Number(topPlayer.telegram_stars || 0)}</strong>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {topPlayer.verified ? (
                        <span style={{ color: '#4CAF50', fontSize: '1.2rem' }}>✅</span>
                      ) : (
                        <span style={{ color: '#FF5722', fontSize: '1.2rem' }}>❌</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Успешная загрузка */}
      {stats && (
        <div style={{
          padding: '15px',
          background: 'rgba(0, 255, 0, 0.05)',
          border: `1px solid #4CAF5040`,
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#4CAF50', marginBottom: '5px' }}>✅ Статистика обновлена успешно!</div>
          <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
            Данные от: {new Date(stats.timestamp).toLocaleString('ru-RU')}
          </div>
        </div>
      )}
    </div>
  );

  // Рендер других разделов (заглушки)
  const renderOtherSection = (section: AdminSection) => {
    const sectionData = navButtons.find(btn => btn.key === section);
    if (!sectionData) return null;

    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>{sectionData.icon}</div>
        <h2 style={{ color: colorStyle, marginBottom: '15px', fontSize: '2rem' }}>{sectionData.label}</h2>
        <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '1.1rem' }}>
          {sectionData.desc}
        </p>
        
        {/* Кнопка возврата */}
        <button
          onClick={() => setActiveSection('main')}
          style={{
            padding: '12px 24px',
            background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          ← Вернуться на главную
        </button>

        {/* Информация о разработке */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}20`,
          borderRadius: '12px',
          maxWidth: '600px',
          margin: '40px auto 0'
        }}>
          <h3 style={{ color: colorStyle, marginBottom: '15px' }}>🚧 Модуль в разработке</h3>
          <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Этот раздел будет включать:
          </p>
          <ul style={{ color: '#ccc', fontSize: '0.9rem', textAlign: 'left', marginTop: '10px' }}>
            {section === 'players' && (
              <>
                <li>Поиск игроков по ID, username, имени</li>
                <li>Подробная информация о каждом игроке</li>
                <li>История транзакций и активности</li>
                <li>Управление балансами и верификацией</li>
              </>
            )}
            {section === 'exchanges' && (
              <>
                <li>Статистика всех видов обменов (CS↔CCC, TON↔CS)</li>
                <li>Анализ популярности направлений обмена</li>
                <li>История курсов и их изменений</li>
                <li>Управление блокировками обменов</li>
              </>
            )}
            {section === 'finances' && (
              <>
                <li>Детальная статистика TON депозитов/выводов</li>
                <li>Анализ покупок Telegram Stars</li>
                <li>Финансовые отчеты по периодам</li>
                <li>Мониторинг крупных операций</li>
              </>
            )}
            {section === 'games' && (
              <>
                <li>Статистика по каждой игре (слоты, шеллы)</li>
                <li>Анализ популярности товаров в магазине</li>
                <li>Статистика выигрышей и проигрышей</li>
                <li>Управление игровыми настройками</li>
              </>
            )}
            {section === 'settings' && (
              <>
                <li>Управление курсами валют</li>
                <li>Настройки комиссий и лимитов</li>
                <li>Конфигурация игр и магазина</li>
                <li>Системные настройки и логи</li>
              </>
            )}
          </ul>
        </div>
      </div>
    );
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
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px', 
        borderBottom: `2px solid ${colorStyle}`, 
        paddingBottom: '20px' 
      }}>
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
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
          
          {activeSection !== 'main' && (
            <button
              onClick={() => setActiveSection('main')}
              style={{
                padding: '10px 20px',
                background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🏠 Главная админки
            </button>
          )}
        </div>
      </div>

      {/* Контент */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {activeSection === 'main' ? renderMainSection() : renderOtherSection(activeSection)}
      </div>
    </div>
  );
};

export default AdminPage;