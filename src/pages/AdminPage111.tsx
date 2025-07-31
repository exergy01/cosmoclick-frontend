import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AdminStatsCard from '../components/AdminStatsCard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
    avg_ccc: number;
    avg_cs: number;
    avg_ton: number;
  };
  stars_exchange: {
    total_exchanges: number;
    total_stars_exchanged: number;
    total_cs_received: number;
    exchanges_24h: number;
  };
  top_players: Array<{
    telegram_id: string;
    username: string;
    first_name: string;
    cs: number;
    ccc: number;
    ton: number;
    telegram_stars: number;
    verified: boolean;
  }>;
  current_rates: {
    [key: string]: {
      currency_pair: string;
      rate: number;
      last_updated: string;
      source: string;
    };
  };
}

interface PlayerData {
  player: any;
  recent_actions: Array<{
    action_type: string;
    amount: number;
    created_at: string;
    details: any;
  }>;
  stars_history: Array<{
    amount: number;
    cs_amount: number;
    exchange_rate: number;
    created_at: string;
    status: string;
  }>;
  referral_stats: {
    referrals_count: number;
  };
}
const AdminPage: React.FC = () => {
    const { t } = useTranslation();
    const { player } = useNewPlayer();
    const navigate = useNavigate();
  
    // Состояние админки
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCheckLoading, setAdminCheckLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stats' | 'players' | 'exchange' | 'management'>('stats');
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    
    // Состояние поиска игроков
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
    const [playerLoading, setPlayerLoading] = useState(false);
  
    // Формы управления
    const [manageForm, setManageForm] = useState({
      playerId: '',
      currency: 'cs',
      operation: 'add',
      amount: ''
    });
    
    const [tonRateForm, setTonRateForm] = useState({
      newRate: ''
    });
    // Проверяем админский статус
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!player?.telegram_id) {
        setIsAdmin(false);
        setAdminCheckLoading(false);
        return;
      }
      
      try {
        console.log('🔍 Проверяем админский статус для:', player.telegram_id);
        const response = await axios.get(`${API_URL}/api/admin/check/${player.telegram_id}`);
        const adminStatus = response.data.isAdmin;
        
        setIsAdmin(adminStatus);
        console.log('🔐 Результат проверки админа:', adminStatus);
        
        if (!adminStatus) {
          alert('Доступ запрещен! Только для администратора.');
          navigate('/');
          return;
        }
      } catch (error) {
        console.log('❌ Ошибка проверки админа:', error);
        setIsAdmin(false);
        navigate('/');
      } finally {
        setAdminCheckLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [player?.telegram_id, navigate]);

  // Загружаем статистику при открытии вкладки
  useEffect(() => {
    if (isAdmin && activeTab === 'stats') {
      loadAdminStats();
    }
  }, [isAdmin, activeTab]);
  const loadAdminStats = async () => {
    if (!player?.telegram_id) return;
    
    setStatsLoading(true);
    try {
      console.log('📊 Загружаем админскую статистику...');
      const response = await axios.get(`${API_URL}/api/admin/stats/${player.telegram_id}`);
      setAdminStats(response.data);
      console.log('✅ Статистика загружена:', response.data);
    } catch (error) {
      console.error('❌ Ошибка загрузки статистики:', error);
      alert('Ошибка загрузки статистики');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!player?.telegram_id || !searchQuery.trim()) return;
    
    try {
      console.log('🔍 Поиск игроков:', searchQuery);
      const response = await axios.get(`${API_URL}/api/admin/search/${player.telegram_id}?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.results);
      console.log('✅ Результаты поиска:', response.data.results);
    } catch (error) {
      console.error('❌ Ошибка поиска:', error);
      alert('Ошибка поиска игроков');
    }
  };

  const loadPlayerData = async (playerId: string) => {
    if (!player?.telegram_id) return;
    
    setPlayerLoading(true);
    try {
      console.log('👤 Загружаем данные игрока:', playerId);
      const response = await axios.get(`${API_URL}/api/admin/player/${player.telegram_id}/${playerId}`);
      setSelectedPlayer(response.data);
      console.log('✅ Данные игрока загружены:', response.data);
    } catch (error) {
      console.error('❌ Ошибка загрузки данных игрока:', error);
      alert('Ошибка загрузки данных игрока');
    } finally {
      setPlayerLoading(false);
    }
  };
  const handleUpdateBalance = async () => {
    if (!player?.telegram_id || !manageForm.playerId || !manageForm.amount) {
      alert('Заполните все поля');
      return;
    }
    
    try {
      console.log('💰 Обновляем баланс:', manageForm);
      const response = await axios.post(`${API_URL}/api/admin/update-balance/${player.telegram_id}`, {
        playerId: manageForm.playerId,
        currency: manageForm.currency,
        operation: manageForm.operation,
        amount: parseFloat(manageForm.amount)
      });
      
      console.log('✅ Баланс обновлен:', response.data);
      alert(`Баланс обновлен успешно! Новый баланс: ${response.data.operation.new_balance}`);
      
      // Обновляем данные игрока если он выбран
      if (selectedPlayer && selectedPlayer.player.telegram_id === manageForm.playerId) {
        loadPlayerData(manageForm.playerId);
      }
      
      // Очищаем форму
      setManageForm({ playerId: '', currency: 'cs', operation: 'add', amount: '' });
    } catch (error) {
      console.error('❌ Ошибка обновления баланса:', error);
      alert('Ошибка обновления баланса');
    }
  };

  const handleVerifyPlayer = async (playerId: string, verified: boolean) => {
    if (!player?.telegram_id) return;
    
    try {
      console.log('🔧 Изменяем верификацию:', { playerId, verified });
      await axios.post(`${API_URL}/api/admin/verify-player/${player.telegram_id}`, {
        playerId,
        verified
      });
      
      console.log('✅ Верификация изменена');
      alert(`Игрок ${verified ? 'верифицирован' : 'деверифицирован'} успешно!`);
      
      // Обновляем данные игрока
      if (selectedPlayer && selectedPlayer.player.telegram_id === playerId) {
        loadPlayerData(playerId);
      }
    } catch (error) {
      console.error('❌ Ошибка верификации:', error);
      alert('Ошибка изменения верификации');
    }
  };

  const handleUpdateTonRate = async () => {
    if (!player?.telegram_id || !tonRateForm.newRate) {
      alert('Введите новый курс TON');
      return;
    }
    
    try {
      console.log('📈 Обновляем курс TON:', tonRateForm.newRate);
      const response = await axios.post(`${API_URL}/api/admin/update-ton-rate/${player.telegram_id}`, {
        newRate: parseFloat(tonRateForm.newRate)
      });
      
      console.log('✅ Курс TON обновлен:', response.data);
      alert(`Курс TON обновлен: ${response.data.previous_rate} → ${response.data.new_rate}`);
      
      // Перезагружаем статистику
      if (activeTab === 'stats') {
        loadAdminStats();
      }
      
      setTonRateForm({ newRate: '' });
    } catch (error) {
      console.error('❌ Ошибка обновления курса TON:', error);
      alert('Ошибка обновления курса TON');
    }
  };
  // Экран загрузки проверки админа
  if (adminCheckLoading) {
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

  // Экран отказа в доступе
  if (!isAdmin) {
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
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚫</div>
          <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Доступ запрещен</div>
          <div style={{ fontSize: '1rem', color: '#aaa' }}>Только для администратора</div>
        </div>
      </div>
    );
  }

  const colorStyle = player?.color || '#00f0ff';
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
        <p style={{ fontSize: '1rem', color: '#aaa', margin: '0 0 15px 0' }}>
          Добро пожаловать, {player?.first_name || player?.username}! 
          <span style={{ color: colorStyle, marginLeft: '8px' }}>
            ID: {player?.telegram_id}
          </span>
        </p>
        <button
          onClick={() => navigate('/')}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${colorStyle}20`;
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ← Вернуться в игру
        </button>
      </div>

      {/* Навигация */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {[
          { key: 'stats', label: 'Статистика', icon: '📊' },
          { key: 'players', label: 'Игроки', icon: '👥' },
          { key: 'exchange', label: 'Обмены', icon: '💱' },
          { key: 'management', label: 'Управление', icon: '⚙️' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
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

      {/* Контент вкладок */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

      </div>
      {/* Вкладка Статистика */}
      {activeTab === 'stats' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '30px',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <h2 style={{ 
                color: colorStyle, 
                margin: 0,
                fontSize: '1.8rem',
                textShadow: `0 0 10px ${colorStyle}40`
              }}>
                📊 Общая статистика системы
              </h2>
              <button
                onClick={loadAdminStats}
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
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {statsLoading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
                    Загрузка...
                  </>
                ) : (
                  <>
                    🔄 Обновить
                  </>
                )}
              </button>
            </div>

            {adminStats ? (
              <>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                  gap: '25px',
                  marginBottom: '30px'
                }}>
                  
                  {/* Статистика игроков */}
                  <AdminStatsCard
                    title="Игроки"
                    icon="👥"
                    colorStyle={colorStyle}
                    loading={statsLoading}
                    data={[
                      { label: 'Всего игроков', value: adminStats.players.total_players },
                      { label: 'Верифицированных', value: adminStats.players.verified_players, color: '#4CAF50' },
                      { label: 'Активны за 24ч', value: adminStats.players.active_24h, color: '#FF9800' },
                      { label: 'Активны за 7 дней', value: adminStats.players.active_7d, color: '#2196F3' }
                    ]}
                  />

                  {/* Статистика валют */}
                  <AdminStatsCard
                    title="Валюты в системе"
                    icon="💰"
                    colorStyle={colorStyle}
                    loading={statsLoading}
                    data={[
                      { label: 'Всего CCC', value: (adminStats.currencies.total_ccc || 0).toFixed(2) },
                      { label: 'Всего CS', value: (adminStats.currencies.total_cs || 0).toFixed(2), color: '#FFD700' },
                      { label: 'Всего TON', value: (adminStats.currencies.total_ton || 0).toFixed(4), color: '#0088cc' },
                      { label: 'Всего Stars', value: adminStats.currencies.total_stars || 0, color: '#FFA500' }
                    ]}
                  />

                  {/* Статистика обменов Stars */}
                  <AdminStatsCard
                    title="Обмены Stars"
                    icon="🌟"
                    colorStyle={colorStyle}
                    loading={statsLoading}
                    data={[
                      { label: 'Всего обменов', value: adminStats.stars_exchange.total_exchanges || 0 },
                      { label: 'Stars обменено', value: adminStats.stars_exchange.total_stars_exchanged || 0, color: '#FFA500' },
                      { label: 'CS получено', value: (adminStats.stars_exchange.total_cs_received || 0).toFixed(2), color: '#FFD700' },
                      { label: 'Обменов за 24ч', value: adminStats.stars_exchange.exchanges_24h || 0, color: '#FF9800' }
                    ]}
                  />

                  {/* Текущие курсы */}
                  <AdminStatsCard
                    title="Текущие курсы"
                    icon="📈"
                    colorStyle={colorStyle}
                    loading={statsLoading}
                    data={[
                      ...(adminStats.current_rates?.TON_USD ? [{
                        label: 'TON/USD',
                        value: `$${adminStats.current_rates.TON_USD.rate}`,
                        color: '#0088cc'
                      }] : [{ label: 'TON/USD', value: 'Не загружен', color: '#666' }]),
                      ...(adminStats.current_rates?.STARS_CS ? [{
                        label: '1 Star',
                        value: `${adminStats.current_rates.STARS_CS.rate} CS`,
                        color: '#FFA500'
                      }] : [{ label: 'Stars/CS', value: 'Не загружен', color: '#666' }])
                    ]}
                  />
                </div>

                {/* ТОП игроков */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${colorStyle}40`,
                  borderRadius: '15px',
                  padding: '25px',
                  backdropFilter: 'blur(10px)'
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
                          <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminStats.top_players.map((topPlayer, index) => (
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
                                {topPlayer.cs.toFixed(2)}
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <div style={{ fontWeight: 'bold' }}>
                                {topPlayer.ccc.toFixed(2)}
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <div style={{ 
                                color: '#0088cc', 
                                fontWeight: 'bold',
                                textShadow: '0 0 8px #0088cc40'
                              }}>
                                {topPlayer.ton.toFixed(4)}
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
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              <button
                                onClick={() => loadPlayerData(topPlayer.telegram_id)}
                                style={{
                                  padding: '6px 12px',
                                  background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                👁️ Подробнее
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : !statsLoading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                border: `1px solid ${colorStyle}20`
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.7 }}>📊</div>
                <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Нажмите "Обновить" для загрузки статистики</div>
                <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Получите полную информацию о состоянии системы</div>
              </div>
            )}
          </div>
        )}
        {/* Вкладка Игроки */}
        {activeTab === 'players' && (
          <div>
            <h2 style={{ 
              color: colorStyle, 
              marginBottom: '25px',
              fontSize: '1.8rem',
              textShadow: `0 0 10px ${colorStyle}40`
            }}>
              👥 Поиск и управление игроками
            </h2>
            
            {/* Поиск */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${colorStyle}40`,
              borderRadius: '15px',
              padding: '25px',
              marginBottom: '25px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ 
                color: colorStyle, 
                marginTop: 0,
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔍 Поиск игроков
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введите Telegram ID, username или имя"
                  style={{
                    flex: 1,
                    minWidth: '250px',
                    padding: '12px 15px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: `2px solid ${colorStyle}40`,
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '1rem',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={(e) => e.currentTarget.style.borderColor = colorStyle}
                  onBlur={(e) => e.currentTarget.style.borderColor = `${colorStyle}40`}
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  style={{
                    padding: '12px 20px',
                    background: searchQuery.trim() 
                      ? `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)` 
                      : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    cursor: searchQuery.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (searchQuery.trim()) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = `0 0 15px ${colorStyle}40`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  🔍 Найти
                </button>
              </div>
            </div>

            {/* Результаты поиска */}
            {searchResults.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '15px',
                padding: '25px',
                marginBottom: '25px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ 
                  color: colorStyle, 
                  marginTop: 0,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📋 Результаты поиска ({searchResults.length})
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    fontSize: '0.9rem',
                    minWidth: '800px'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${colorStyle}40` }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', color: colorStyle, fontWeight: 'bold' }}>Игрок</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>CS</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>CCC</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: colorStyle, fontWeight: 'bold' }}>TON</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>Статус</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', color: colorStyle, fontWeight: 'bold' }}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((foundPlayer) => (
                        <tr 
                          key={foundPlayer.telegram_id} 
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 8px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                                {foundPlayer.first_name || foundPlayer.username || 'Аноним'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                ID: {foundPlayer.telegram_id}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <div style={{ 
                              color: '#FFD700', 
                              fontWeight: 'bold',
                              textShadow: '0 0 8px #FFD70040'
                            }}>
                              {foundPlayer.cs.toFixed(2)}
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold' }}>
                              {foundPlayer.ccc.toFixed(2)}
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <div style={{ 
                              color: '#0088cc', 
                              fontWeight: 'bold',
                              textShadow: '0 0 8px #0088cc40'
                            }}>
                              {foundPlayer.ton.toFixed(4)}
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            {foundPlayer.verified ? (
                              <span style={{ 
                                color: '#4CAF50', 
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                              }}>✅ Верифицирован</span>
                            ) : (
                              <span style={{ 
                                color: '#FF5722', 
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                              }}>❌ Не верифицирован</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <button
                              onClick={() => loadPlayerData(foundPlayer.telegram_id)}
                              style={{
                                padding: '6px 12px',
                                background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
                                border: 'none',
                                borderRadius: '6px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              👁️ Подробнее
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Подробная информация об игроке */}
            {selectedPlayer && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '15px',
                padding: '25px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <h3 style={{ 
                    color: colorStyle, 
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1.3rem'
                  }}>
                    👤 {selectedPlayer.player.first_name || selectedPlayer.player.username || 'Аноним'}
                  </h3>
                  <button
                    onClick={() => setSelectedPlayer(null)}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${colorStyle}40`,
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                      e.currentTarget.style.borderColor = '#ff4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = `${colorStyle}40`;
                    }}
                  >
                    ✕ Закрыть
                  </button>
                </div>

                {playerLoading ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: '#aaa'
                  }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      marginBottom: '10px',
                      animation: 'spin 1s linear infinite'
                    }}>⏳</div>
                    Загрузка данных игрока...
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                    gap: '25px' 
                  }}>
                    
                    {/* Основная информация */}
                    <div>
                      <h4 style={{ 
                        color: colorStyle,
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        💰 Балансы
                      </h4>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '10px', 
                        fontSize: '0.9rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '15px',
                        borderRadius: '10px'
                      }}>
                        <div>CCC:</div>
                        <div style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {selectedPlayer.player.ccc.toFixed(5)}
                        </div>
                        <div>CS:</div>
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: '#FFD700', 
                          textAlign: 'right',
                          textShadow: '0 0 8px #FFD70040'
                        }}>
                          {selectedPlayer.player.cs.toFixed(2)}
                        </div>
                        <div>TON:</div>
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: '#0088cc', 
                          textAlign: 'right',
                          textShadow: '0 0 8px #0088cc40'
                        }}>
                          {selectedPlayer.player.ton.toFixed(4)}
                        </div>
                        <div>Stars:</div>
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: '#FFA500', 
                          textAlign: 'right',
                          textShadow: '0 0 8px #FFA50040'
                        }}>
                          {selectedPlayer.player.telegram_stars || 0}
                        </div>
                      </div>

                      <h4 style={{ 
                        color: colorStyle, 
                        marginTop: '25px',
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        📋 Данные игрока
                      </h4>
                      <div style={{ 
                        fontSize: '0.9rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '15px',
                        borderRadius: '10px'
                      }}>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>ID:</strong> {selectedPlayer.player.telegram_id}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Username:</strong> @{selectedPlayer.player.username || 'нет'}
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Верификация:</strong> {selectedPlayer.player.verified ? (
                            <span style={{ color: '#4CAF50', fontWeight: 'bold' }}> ✅ Да</span>
                          ) : (
                            <span style={{ color: '#FF5722', fontWeight: 'bold' }}> ❌ Нет</span>
                          )}
                        </div>
                        <div>
                          <strong>Рефералов:</strong> {selectedPlayer.referral_stats.referrals_count}
                        </div>
                      </div>

                      {/* Кнопки управления */}
                      <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleVerifyPlayer(
                            selectedPlayer.player.telegram_id, 
                            !selectedPlayer.player.verified
                          )}
                          style={{
                            padding: '10px 15px',
                            background: selectedPlayer.player.verified ? '#FF5722' : '#4CAF50',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {selectedPlayer.player.verified ? '❌ Снять верификацию' : '✅ Верифицировать'}
                        </button>
                      </div>
                    </div>

                    {/* История действий */}
                    <div>
                      <h4 style={{ 
                        color: colorStyle,
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        📜 Последние действия
                      </h4>
                      <div style={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto', 
                        fontSize: '0.8rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        padding: '10px'
                      }}>
                        {selectedPlayer.recent_actions.length > 0 ? selectedPlayer.recent_actions.map((action, index) => (
                          <div key={index} style={{ 
                            padding: '10px', 
                            background: 'rgba(255,255,255,0.05)', 
                            marginBottom: '8px', 
                            borderRadius: '6px',
                            border: `1px solid ${colorStyle}20`
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              {action.action_type}
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              Сумма: <span style={{ fontWeight: 'bold' }}>{action.amount}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                              {new Date(action.created_at).toLocaleString()}
                            </div>
                          </div>
                        )) : (
                          <div style={{ 
                            textAlign: 'center', 
                            color: '#aaa', 
                            fontStyle: 'italic',
                            padding: '20px'
                          }}>
                            Нет записей о действиях
                          </div>
                        )}
                      </div>
                    </div>

                    {/* История обменов Stars */}
                    <div>
                      <h4 style={{ 
                        color: colorStyle,
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🌟 Обмены Stars
                      </h4>
                      <div style={{ 
                        maxHeight: '300px', 
                        overflowY: 'auto', 
                        fontSize: '0.8rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '10px',
                        padding: '10px'
                      }}>
                        {selectedPlayer.stars_history.length > 0 ? selectedPlayer.stars_history.map((exchange, index) => (
                          <div key={index} style={{ 
                            padding: '10px', 
                            background: 'rgba(255,255,255,0.05)', 
                            marginBottom: '8px', 
                            borderRadius: '6px',
                            border: `1px solid #FFA50020`
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                              <span style={{ color: '#FFA500' }}>{Math.abs(exchange.amount)} Stars</span>
                              {' → '}
                              <span style={{ color: '#FFD700' }}>{exchange.cs_amount} CS</span>
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              Курс: <span style={{ fontWeight: 'bold' }}>{exchange.exchange_rate}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                              {new Date(exchange.created_at).toLocaleString()}
                            </div>
                          </div>
                        )) : (
                          <div style={{ 
                            textAlign: 'center', 
                            color: '#aaa', 
                            fontStyle: 'italic',
                            padding: '20px'
                          }}>
                            Обменов не было
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Вкладка Управление */}
        {activeTab === 'management' && (
          <div>
            <h2 style={{ 
              color: colorStyle, 
              marginBottom: '25px',
              fontSize: '1.8rem',
              textShadow: `0 0 10px ${colorStyle}40`
            }}>
              ⚙️ Управление системой
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
              gap: '25px' 
            }}>
              
              {/* Управление балансом игрока */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '15px',
                padding: '25px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ 
                  color: colorStyle, 
                  marginTop: 0,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💰 Изменение баланса игрока
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input
                    type="text"
                    value={manageForm.playerId}
                    onChange={(e) => setManageForm({...manageForm, playerId: e.target.value})}
                    placeholder="Telegram ID игрока"
                    style={{
                      padding: '12px 15px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: `2px solid ${colorStyle}40`,
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = colorStyle}
                    onBlur={(e) => e.currentTarget.style.borderColor = `${colorStyle}40`}
                  />
                  
                  <select
                    value={manageForm.currency}
                    onChange={(e) => setManageForm({...manageForm, currency: e.target.value})}
                    style={{
                      padding: '12px 15px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: `2px solid ${colorStyle}40`,
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ccc" style={{ background: '#1a1a2e', color: '#fff' }}>CCC</option>
                    <option value="cs" style={{ background: '#1a1a2e', color: '#fff' }}>CS</option>
                    <option value="ton" style={{ background: '#1a1a2e', color: '#fff' }}>TON</option>
                    <option value="stars" style={{ background: '#1a1a2e', color: '#fff' }}>Stars</option>
                  </select>
                  
                  <select
                    value={manageForm.operation}
                    onChange={(e) => setManageForm({...manageForm, operation: e.target.value})}
                    style={{
                      padding: '12px 15px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: `2px solid ${colorStyle}40`,
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="add" style={{ background: '#1a1a2e', color: '#fff' }}>Добавить к текущему</option>
                    <option value="set" style={{ background: '#1a1a2e', color: '#fff' }}>Установить точное значение</option>
                  </select>
                  
                  <input
                    type="number"
                    value={manageForm.amount}
                    onChange={(e) => setManageForm({...manageForm, amount: e.target.value})}
                    placeholder="Сумма"
                    step="0.00001"
                    style={{
                      padding: '12px 15px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: `2px solid ${colorStyle}40`,
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = colorStyle}
                    onBlur={(e) => e.currentTarget.style.borderColor = `${colorStyle}40`}
                  />
                  
                  <button
                    onClick={handleUpdateBalance}
                    disabled={!manageForm.playerId || !manageForm.amount}
                    style={{
                      padding: '15px',
                      background: (manageForm.playerId && manageForm.amount) 
                        ? `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)` 
                        : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      cursor: (manageForm.playerId && manageForm.amount) ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (manageForm.playerId && manageForm.amount) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = `0 0 15px ${colorStyle}40`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    💰 Изменить баланс
                  </button>
                  
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#aaa', 
                    textAlign: 'center',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: `1px solid ${colorStyle}20`
                  }}>
                    ⚠️ Будьте осторожны! Это действие необратимо и логируется в системе.
                  </div>
                </div>
              </div>

              {/* Управление курсом TON */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '15px',
                padding: '25px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ 
                  color: colorStyle, 
                  marginTop: 0,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📈 Обновление курса TON
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#aaa'
                  }}>
                    Текущий курс: {adminStats?.current_rates?.TON_USD 
                      ? `$${adminStats.current_rates.TON_USD.rate}` 
                      : 'Не загружен'}
                  </div>
                  
                  <input
                    type="number"
                    value={tonRateForm.newRate}
                    onChange={(e) => setTonRateForm({newRate: e.target.value})}
                    placeholder="Новый курс TON/USD (например: 3.45)"
                    step="0.01"
                    min="0"
                    style={{
                      padding: '12px 15px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: `2px solid ${colorStyle}40`,
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = colorStyle}
                    onBlur={(e) => e.currentTarget.style.borderColor = `${colorStyle}40`}
                  />
                  
                  <button
                    onClick={handleUpdateTonRate}
                    disabled={!tonRateForm.newRate || parseFloat(tonRateForm.newRate) <= 0}
                    style={{
                      padding: '15px',
                      background: (tonRateForm.newRate && parseFloat(tonRateForm.newRate) > 0) 
                        ? `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)` 
                        : 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      cursor: (tonRateForm.newRate && parseFloat(tonRateForm.newRate) > 0) ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (tonRateForm.newRate && parseFloat(tonRateForm.newRate) > 0) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = `0 0 15px ${colorStyle}40`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    📈 Обновить курс TON
                  </button>
                  
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#aaa', 
                    textAlign: 'center',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: `1px solid ${colorStyle}20`
                  }}>
                    ⚠️ Это автоматически пересчитает курс обмена Stars → CS
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Вкладка Обмены */}
        {activeTab === 'exchange' && (
          <div>
            <h2 style={{ 
              color: colorStyle, 
              marginBottom: '25px',
              fontSize: '1.8rem',
              textShadow: `0 0 10px ${colorStyle}40`
            }}>
              💱 Система обменов
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '25px' 
            }}>
              
              {/* Информация о курсах */}
              <AdminStatsCard
                title="Текущие курсы"
                icon="📊"
                colorStyle={colorStyle}
                data={[
                  ...(adminStats?.current_rates?.TON_USD ? [{
                    label: 'TON/USD',
                    value: `$${adminStats.current_rates.TON_USD.rate}`,
                    color: '#0088cc'
                  }] : [{ label: 'TON/USD', value: 'Не загружен', color: '#666' }]),
                  ...(adminStats?.current_rates?.STARS_CS ? [{
                    label: '1 Star',
                    value: `${adminStats.current_rates.STARS_CS.rate} CS`,
                    color: '#FFA500'
                  }] : [{ label: 'Stars/CS', value: 'Не загружен', color: '#666' }])
                ]}
              />

              {/* Статистика обменов */}
              <AdminStatsCard
                title="Статистика обменов"
                icon="📈"
                colorStyle={colorStyle}
                data={adminStats?.stars_exchange ? [
                  { label: 'Всего обменов', value: adminStats.stars_exchange.total_exchanges },
                  { label: 'Stars обменено', value: adminStats.stars_exchange.total_stars_exchanged, color: '#FFA500' },
                  { label: 'CS выдано', value: adminStats.stars_exchange.total_cs_received?.toFixed(2), color: '#FFD700' },
                  { label: 'Обменов за 24ч', value: adminStats.stars_exchange.exchanges_24h, color: '#FF9800' }
                ] : [
                  { label: 'Данные', value: 'Не загружены', color: '#666' }
                ]}
              />

              {/* Управление блокировками */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '15px',
                padding: '25px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ 
                  color: colorStyle, 
                  marginTop: 0,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🔓 Управление блокировками
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <button
                    onClick={async () => {
                      try {
                        await axios.post(`${API_URL}/api/admin/unblock-exchange/${player?.telegram_id}`, {
                          exchangeType: 'stars_to_cs'
                        });
                        alert('Блокировка обмена Stars снята!');
                      } catch (error) {
                        console.error('❌ Ошибка снятия блокировки:', error);
                        alert('Ошибка снятия блокировки');
                      }
                    }}
                    style={{
                      padding: '12px 15px',
                      background: '#4CAF50',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 0 15px #4CAF5040';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    🔓 Снять блокировку обмена Stars
                  </button>
                  
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#aaa', 
                    textAlign: 'center',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: `1px solid ${colorStyle}20`
                  }}>
                    ⚠️ Используйте только при необходимости. Блокировки защищают от спама.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      {/* Добавляем стили для анимации */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          input::placeholder, select option {
            color: #aaa;
          }
          input:focus, select:focus {
            outline: none;
            box-shadow: 0 0 10px ${colorStyle}40;
          }
          /* Кастомный скроллбар */
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: ${colorStyle};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${colorStyle}cc;
          }
        `}
      </style>
    </div>
  );
};

export default AdminPage;