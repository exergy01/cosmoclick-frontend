// pages/admin/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../context/NewPlayerContext';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const AdminPage: React.FC = () => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

  // Загрузка статистики
  const loadStats = async () => {
    if (!player?.telegram_id) return;
    
    setStatsLoading(true);
    setStatsError(null);
    
    try {
      console.log('📊 Загружаем статистику...');
      const response = await axios.get(`${apiUrl}/api/admin/stats/${player.telegram_id}`);
      console.log('✅ Статистика загружена:', response.data);
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

      {/* Статистика */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
                  <div>Stars→CS: <strong>{safeNumber(stats.all_exchanges?.stars_to_cs?.total_exchanges || stats.stars_exchange?.total_exchanges)}</strong></div>
                  <div>CCC↔CS: <strong style={{ color: '#fff' }}>{safeNumber((stats.all_exchanges?.ccc_cs?.ccc_to_cs_exchanges || 0) + (stats.all_exchanges?.ccc_cs?.cs_to_ccc_exchanges || 0))}</strong></div>
                  <div>CS↔TON: <strong style={{ color: '#0088cc' }}>{safeNumber((stats.all_exchanges?.cs_ton?.cs_to_ton_exchanges || 0) + (stats.all_exchanges?.cs_ton?.ton_to_cs_exchanges || 0))}</strong></div>
                  <div>За 24ч: <strong style={{ color: '#FF9800' }}>{safeNumber(stats.all_exchanges?.totals?.all_exchanges_24h || stats.stars_exchange?.exchanges_24h)}</strong></div>
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
                  <div>Ставок на: <strong style={{ color: '#45B7D1' }}>{safeNumber(stats.minigames?.total_bet)}</strong></div>
                  <div>Выиграно: <strong style={{ color: '#96CEB4' }}>{safeNumber(stats.minigames?.total_won)}</strong></div>
                </div>
              </div>
            </div>

            {/* ТОП-10 игроков */}
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
                        <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>Статус</th>
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
                              <div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '0.95rem' }}>
                                {topPlayer.first_name || topPlayer.username || 'Аноним'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                ID: {topPlayer.telegram_id}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '1rem' }}>
                              {safeNumber(topPlayer.cs).toFixed(2)}
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold' }}>
                              {safeNumber(topPlayer.ccc).toFixed(2)}
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <div style={{ color: '#0088cc', fontWeight: 'bold' }}>
                              {safeNumber(topPlayer.ton).toFixed(4)}
                            </div>
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
              <div style={{ color: '#4CAF50', marginBottom: '5px' }}>✅ Статистика загружена успешно!</div>
              <div style={{ color: '#aaa' }}>
                Данные обновлены: {new Date().toLocaleString('ru-RU')}
              </div>
              <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '8px' }}>
                • Игроков: {safeNumber(stats.players?.total_players)} 
                • CS: {safeNumber(stats.currencies?.total_cs).toFixed(0)} 
                • Игр: {safeNumber(stats.minigames?.total_games)}
                • ТОП: {stats.top_players?.length || 0}
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
            <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Получите актуальную информацию о системе CosmoClick</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;