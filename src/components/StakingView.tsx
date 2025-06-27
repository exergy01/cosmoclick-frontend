import React, { useState, useEffect } from 'react';

interface Stake {
  id: number;
  system_id: number;
  stake_amount: string;
  plan_type: string;
  plan_days: number;
  plan_percent: number;
  return_amount: string;
  end_date: string;
  status: string;
  days_left: number;
  is_ready: boolean;
  test_mode?: boolean;
}

interface StakingViewProps {
  player: any;
  systemId: number;
  colorStyle: string;
  onSystemChange?: (systemId: number) => void;
  onPlayerUpdate?: () => void;
  onCreateNewStake?: () => void;
  refreshTrigger?: number;
}

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const StakingView: React.FC<StakingViewProps> = ({ 
  player, 
  systemId, 
  colorStyle, 
  onSystemChange, 
  onPlayerUpdate, 
  onCreateNewStake,
  refreshTrigger 
}) => {
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ [key: number]: string }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Функция загрузки стейков
  const fetchStakes = async () => {
    try {
      console.log(`🔍 ЗАГРУЖАЕМ СТЕЙКИ ДЛЯ СИСТЕМЫ ${systemId}, ИГРОК ${player.telegram_id}`);
      
      const response = await fetch(`${API_URL}/api/ton/stakes/${player.telegram_id}`);
      const data = await response.json();
      
      console.log(`📋 ПОЛУЧЕНО СТЕЙКОВ ИЗ API:`, data.length);
      data.forEach((stake: any) => {
        console.log(`   - Стейк ${stake.id}: система ${stake.system_id}, статус ${stake.status}`);
      });
      
      // Фильтруем стейки для текущей системы
      const systemStakes = data.filter((stake: Stake) => 
        stake.system_id === systemId
      );
      
      console.log(`🎯 СТЕЙКИ ДЛЯ СИСТЕМЫ ${systemId}:`, systemStakes.length);
      systemStakes.forEach((stake: any) => {
        console.log(`   - Стейк ${stake.id}: ${stake.stake_amount} TON, план ${stake.plan_type}`);
      });
      
      setStakes(systemStakes);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки стейков:', err);
      setLoading(false);
    }
  };

  // Обновление при изменении unlocked_systems игрока
  useEffect(() => {
    if (player?.telegram_id) {
      console.log('🔄 Обновление стейков: изменился игрок или система');
      fetchStakes();
    }
  }, [player?.telegram_id, player?.unlocked_systems, systemId, refreshTrigger, forceRefresh]);

  // Функция принудительного обновления стейков
  const refreshStakes = async () => {
    setRefreshing(true);
    await fetchStakes();
    setRefreshing(false);
  };

  // Функция для принудительного обновления из родительского компонента
  const triggerRefresh = () => {
    setForceRefresh(prev => prev + 1);
  };

  // Подписываемся на глобальные события обновления стейков
  useEffect(() => {
    const handleStakeUpdate = () => {
      console.log('📢 Получен сигнал обновления стейков');
      triggerRefresh();
    };

    window.addEventListener('stakes-updated', handleStakeUpdate);

    return () => {
      window.removeEventListener('stakes-updated', handleStakeUpdate);
    };
  }, []);

  // Обновление времени каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft: { [key: number]: string } = {};
      
      stakes.forEach(stake => {
        const endTime = new Date(stake.end_date).getTime();
        const now = new Date().getTime();
        const difference = endTime - now;
        
        if (difference > 0) {
          if (stake.test_mode) {
            // В тестовом режиме показываем секунды
            const totalSeconds = Math.floor(difference / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            newTimeLeft[stake.id] = `${minutes}м ${seconds}с`;
          } else {
            // В обычном режиме показываем дни/часы/минуты
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            
            newTimeLeft[stake.id] = `${days}д ${hours}ч ${minutes}м ${seconds}с`;
          }
        } else {
          newTimeLeft[stake.id] = 'Готово к сбору!';
        }
      });
      
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [stakes]);

  // Сбор стейка
  const handleWithdraw = async (stakeId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/ton/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: player.telegram_id,
          stakeId: stakeId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Получено ${result.withdrawn_amount} TON!`);
        
        // Отправляем событие глобального обновления
        window.dispatchEvent(new CustomEvent('stakes-updated'));
        
        // Обновляем данные игрока
        if (onPlayerUpdate) {
          await onPlayerUpdate();
        }
        
        // Принудительно обновляем стейки
        await fetchStakes();
        
        // Если нет больше стейков - переключаемся на систему 1
        const remainingStakes = stakes.filter(s => s.id !== stakeId);
        if (remainingStakes.length === 0 && onSystemChange) {
          setTimeout(() => onSystemChange(1), 1000);
        }
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (err) {
      console.error('Ошибка сбора:', err);
      alert('Ошибка при сборе стейка');
    }
  };

  // Отмена стейка со штрафом
  const handleCancel = async (stakeId: number) => {
    const confirmCancel = window.confirm(
      'Вы уверены что хотите отменить стейк? Вы потеряете 10% от вложенной суммы!'
    );
    
    if (!confirmCancel) return;
    
    try {
      const response = await fetch(`${API_URL}/api/ton/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: player.telegram_id,
          stakeId: stakeId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`⚠️ Стейк отменен! Возвращено ${result.returned_amount} TON (штраф ${result.penalty_amount} TON)`);
        
        // Отправляем событие глобального обновления
        window.dispatchEvent(new CustomEvent('stakes-updated'));
        
        // Обновляем данные игрока
        if (onPlayerUpdate) {
          await onPlayerUpdate();
        }
        
        // Принудительно обновляем стейки
        await fetchStakes();
        
        // Если нет больше стейков - переключаемся на систему 1
        const remainingStakes = stakes.filter(s => s.id !== stakeId);
        if (remainingStakes.length === 0 && onSystemChange) {
          setTimeout(() => onSystemChange(1), 1000);
        }
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (err) {
      console.error('Ошибка отмены:', err);
      alert('Ошибка при отмене стейка');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: colorStyle }}>
        <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⏳</div>
        <div>Загрузка стейков...</div>
      </div>
    );
  }

  if (stakes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#ccc' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💰</div>
        <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
          В системе 5 нет активных стейков
        </div>
        <div style={{ fontSize: '1rem', marginBottom: '30px' }}>
          Создайте новый стейк для получения дохода
        </div>
        
        {/* Кнопка создания нового стейка */}
        {onCreateNewStake && (
          <button
            onClick={onCreateNewStake}
            style={{
              padding: '15px 30px',
              background: `linear-gradient(135deg, ${colorStyle}20, ${colorStyle}40, ${colorStyle}20)`,
              border: `3px solid ${colorStyle}`,
              borderRadius: '15px',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: `0 0 20px ${colorStyle}50`
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 0 30px ${colorStyle}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 0 20px ${colorStyle}50`;
            }}
          >
            💰 Создать новый стейк
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Панель управления для системы 5 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.5)',
        border: `1px solid ${colorStyle}`,
        borderRadius: '10px'
      }}>
        <div style={{ color: '#fff' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
            Активных стейков: {stakes.length}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
            Система 5 - Неограниченный стейкинг
            {stakes.some(s => s.test_mode) && (
              <span style={{ color: '#ff6b6b', marginLeft: '10px' }}>
                🧪 ТЕСТОВЫЙ РЕЖИМ
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={refreshStakes}
            disabled={refreshing}
            style={{
              padding: '10px 15px',
              background: 'transparent',
              border: `2px solid ${colorStyle}`,
              borderRadius: '8px',
              color: colorStyle,
              fontSize: '0.9rem',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            {refreshing ? '🔄 Обновление...' : '🔄 Обновить'}
          </button>
          
          {onCreateNewStake && (
            <button
              onClick={onCreateNewStake}
              style={{
                padding: '10px 20px',
                background: `linear-gradient(135deg, ${colorStyle}20, ${colorStyle}40, ${colorStyle}20)`,
                border: `2px solid ${colorStyle}`,
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 0 15px ${colorStyle}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ➕ Создать стейк
            </button>
          )}
        </div>
      </div>
      
      {/* Список стейков */}
      {stakes.map(stake => {
        const isReady = new Date(stake.end_date).getTime() <= new Date().getTime();
        const totalTime = stake.test_mode ? 
          (stake.plan_days * 60 * 1000) : // Минуты в миллисекундах для теста
          (stake.plan_days * 24 * 60 * 60 * 1000); // Дни в миллисекундах
        const elapsed = new Date().getTime() - new Date(stake.end_date).getTime() + totalTime;
        const progressPercent = Math.min(100, Math.max(0, (elapsed / totalTime) * 100));

        return (
          <div 
            key={stake.id}
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              border: `2px solid ${colorStyle}`,
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '20px',
              boxShadow: `0 0 20px ${colorStyle}50`,
              position: 'relative'
            }}
          >
            {/* Тестовый режим индикатор */}
            {stake.test_mode && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#ff6b6b',
                color: '#fff',
                padding: '5px 10px',
                borderRadius: '15px',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                🧪 ТЕСТ
              </div>
            )}

            {/* Заголовок */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ 
                color: colorStyle, 
                fontSize: '1.8rem', 
                textShadow: `0 0 10px ${colorStyle}`,
                marginBottom: '10px'
              }}>
                💰 TON Стейкинг
              </h2>
              <div style={{ fontSize: '1.1rem', color: '#ccc' }}>
                {stake.plan_type === 'fast' ? '⚡ Ускоренный тариф' : '🏆 Стандартный тариф'}
                {stake.test_mode && (
                  <span style={{ color: '#ff6b6b', marginLeft: '10px' }}>
                    ({stake.plan_days} {stake.plan_days === 1 ? 'минута' : 'минут'})
                  </span>
                )}
              </div>
            </div>

            {/* Информация о стейке */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '20px', 
              marginBottom: '30px' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '5px' }}>
                  Вложено
                </div>
                <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>
                  {parseFloat(stake.stake_amount).toFixed(2)} TON
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '5px' }}>
                  Получите
                </div>
                <div style={{ color: '#4ade80', fontSize: '1.4rem', fontWeight: 'bold' }}>
                  {parseFloat(stake.return_amount).toFixed(2)} TON
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '5px' }}>
                  Срок
                </div>
                <div style={{ color: '#fff', fontSize: '1.2rem' }}>
                  {stake.plan_days} {stake.test_mode ? 
                    (stake.plan_days === 1 ? 'минута' : 'минут') : 
                    (stake.plan_days === 1 ? 'день' : 'дней')
                  }
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '5px' }}>
                  Доходность
                </div>
                <div style={{ color: colorStyle, fontSize: '1.2rem' }}>
                  +{stake.plan_percent}%
                </div>
              </div>
            </div>

            {/* Прогресс бар */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '10px', 
                height: '20px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: `linear-gradient(90deg, ${colorStyle}, #4ade80)`,
                  height: '100%',
                  width: `${progressPercent}%`,
                  transition: 'width 0.3s ease',
                  borderRadius: '10px'
                }} />
              </div>
              <div style={{ 
                textAlign: 'center', 
                marginTop: '10px', 
                color: isReady ? '#4ade80' : '#fff',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}>
                {timeLeft[stake.id] || 'Загрузка...'}
              </div>
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => handleWithdraw(stake.id)}
                disabled={!isReady}
                style={{
                  padding: '15px 30px',
                  background: isReady ? 
                    `linear-gradient(135deg, #4ade80, #22c55e)` : 
                    'rgba(100, 100, 100, 0.3)',
                  border: `2px solid ${isReady ? '#4ade80' : '#666'}`,
                  borderRadius: '15px',
                  color: isReady ? '#fff' : '#999',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: isReady ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseEnter={e => {
                  if (isReady) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 20px #4ade80';
                  }
                }}
                onMouseLeave={e => {
                  if (isReady) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isReady ? '💰 Забрать' : '💰 Забрать'}
              </button>

              <button
                onClick={() => handleCancel(stake.id)}
                style={{
                  padding: '15px 20px',
                  background: 'transparent',
                  border: '2px solid #ef4444',
                  borderRadius: '15px',
                  color: '#ef4444',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = '#dc2626';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
              >
                ❌ Отменить (-10%)
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StakingView;