// pages/admin/components/AdminPlayersTab.tsx - ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ
import React, { useState } from 'react';
import { useAdminStats } from '../hooks/useAdminStats';

interface AdminPlayersTabProps {
  colorStyle: string;
}

const AdminPlayersTab: React.FC<AdminPlayersTabProps> = ({ colorStyle }) => {
  const { stats, loading, refresh } = useAdminStats();
  const [actionResults, setActionResults] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  // Загружаем статистику при монтировании компонента
  React.useEffect(() => {
    refresh();
  }, [refresh]);

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
  const getPlayerVerificationType = (player: any) => {
    if (player.premium_no_ads_forever) {
      return { type: 'premium_forever', label: '🏆 Премиум навсегда', color: '#FFD700' };
    } else if (player.premium_no_ads_until && new Date(player.premium_no_ads_until) > new Date()) {
      return { type: 'premium_30days', label: '👑 Премиум 30д', color: '#FF6B35' };
    } else if (player.verified) {
      return { type: 'basic_verified', label: '✅ Базовая', color: '#4CAF50' };
    } else {
      return { type: 'not_verified', label: '❌ Нет', color: '#FF5722' };
    }
  };

  // Быстрые действия (пока заглушки)
  const handleQuickAction = (action: string) => {
    const playerId = prompt(`🆔 ID игрока для действия "${action}":`);
    if (playerId?.trim()) {
      setActionResults(prev => [
        `🔄 Действие "${action}" для игрока ${playerId} - в разработке`,
        ...prev.slice(0, 9)
      ]);
    }
  };

  return (
    <div>
      <h2 style={{ 
        color: colorStyle, 
        marginTop: 0, 
        marginBottom: '25px',
        fontSize: '1.4rem'
      }}>
        🎯 Управление игроками
      </h2>

      {/* Панель быстрых действий */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${colorStyle}40`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '25px'
      }}>
        <h3 style={{ 
          color: colorStyle, 
          marginTop: 0, 
          marginBottom: '15px', 
          fontSize: '1.1rem' 
        }}>
          ⚡ Быстрые действия
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px'
        }}>
          
          <button
            onClick={() => handleQuickAction('Базовая верификация')}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #4CAF50, #45a049)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ✅ Базовая верификация
          </button>
          
          <button
            onClick={() => handleQuickAction('Премиум 30 дней')}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #FF6B35, #e55a2b)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            👑 Премиум 30 дней
          </button>
          
          <button
            onClick={() => handleQuickAction('Премиум навсегда')}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #FFD700, #ddb800)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🏆 Премиум навсегда
          </button>
          
          <button
            onClick={() => handleQuickAction('+1000 CS')}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            💰 +1000 CS
          </button>
        </div>
        
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: `${colorStyle}10`,
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#aaa'
        }}>
          💡 <strong>Совет:</strong> Функции пока в режиме заглушек - будут подключены к API следующими
        </div>
      </div>

      {/* ТОП игроков */}
      {loading ? (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '25px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
          <div style={{ color: '#aaa' }}>Загружаем ТОП игроков...</div>
        </div>
      ) : stats?.top_players && stats.top_players.length > 0 ? (
        <div>
          <h3 style={{ 
            color: colorStyle, 
            marginBottom: '20px', 
            fontSize: '1.2rem' 
          }}>
            🏆 ТОП-10 игроков:
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '15px'
          }}>
            {stats.top_players.slice(0, 10).map((player, index) => {
              const verificationType = getPlayerVerificationType(player);
              
              return (
                <div 
                  key={player.telegram_id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : colorStyle}40`,
                    borderRadius: '12px',
                    padding: '15px',
                    position: 'relative'
                  }}
                >
                  {/* Номер места */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: index < 3 
                      ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] 
                      : `${colorStyle}88`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: index < 3 ? '#000' : '#fff'
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* Информация об игроке */}
                  <div style={{ paddingRight: '40px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>
                      {player.first_name || player.username || 'Аноним'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                      ID: {player.telegram_id}
                    </div>
                  </div>
                  
                  {/* Балансы */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    marginBottom: '12px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#FFD700', fontWeight: 'bold' }}>
                        {safeNumber(player.cs).toFixed(0)}
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.7rem' }}>CS</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {safeNumber(player.ccc).toFixed(0)}
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.7rem' }}>CCC</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#0088cc', fontWeight: 'bold' }}>
                        {safeNumber(player.ton).toFixed(3)}
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.7rem' }}>TON</div>
                    </div>
                  </div>
                  
                  {/* Статус */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.7rem',
                      padding: '4px 8px',
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
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '25px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
          <h3 style={{ color: colorStyle, marginBottom: '15px' }}>ТОП игроков не найден</h3>
          <p style={{ color: '#aaa', marginBottom: '15px' }}>
            {stats ? 'В системе пока нет игроков с достаточным количеством CS' : 'Статистика не загружена'}
          </p>
          <button
            onClick={refresh}
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
            🔄 Обновить данные
          </button>
        </div>
      )}

      {/* Результаты действий */}
      {actionResults.length > 0 && (
        <div style={{
          marginTop: '25px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '12px',
          padding: '15px'
        }}>
          <h4 style={{ 
            color: colorStyle, 
            margin: '0 0 10px 0', 
            fontSize: '1rem' 
          }}>
            📋 Результаты действий:
          </h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {actionResults.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  fontSize: '0.8rem', 
                  marginBottom: '4px', 
                  opacity: 1 - (index * 0.08),
                  padding: '2px 0'
                }}
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Информация о компоненте */}
      <div style={{
        marginTop: '25px',
        padding: '15px',
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid #4CAF5040',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '0.9rem'
      }}>
        <div style={{ color: '#4CAF50', marginBottom: '5px' }}>
          ✅ AdminPlayersTab загружен успешно!
        </div>
        <div style={{ color: '#aaa' }}>
          ТОП игроков: {stats?.top_players?.length || 0} | 
          Быстрые действия: 4 | 
          API подключение: В разработке
        </div>
      </div>
    </div>
  );
};

export default AdminPlayersTab;