import React, { useState, useEffect } from 'react';

interface Stake {
  id: number;
  system_id: number;
  stake_amount: string;
  plan_type: string;
  plan_days: number;
  plan_percent: number;
  return_amount: string;
  start_date: string;
  end_date?: string;
  status: string;
  days_left: number;
  is_ready: boolean;
  test_mode?: boolean;
  penalty_amount?: string;
  withdrawn_at?: string;
  // Новые серверные поля
  time_left_text?: string;
  progress_percent?: number;
  remaining_time_ms?: number;
  server_time_utc?: string;
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
  const [completedStakes, setCompletedStakes] = useState<Stake[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ [key: number]: string }>({});
  const [forceRefresh, setForceRefresh] = useState(0);
  const [collecting, setCollecting] = useState<{ [key: number]: boolean }>({});
  const [progressValues, setProgressValues] = useState<{ [key: number]: number }>({});
  const [showAllHistory, setShowAllHistory] = useState(false);

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
      
      // Разделяем активные и завершенные стейки
      const activeStakes = systemStakes.filter((stake: Stake) => stake.status === 'active');
      
      console.log(`🎯 АКТИВНЫХ СТЕЙКОВ ДЛЯ СИСТЕМЫ ${systemId}:`, activeStakes.length);
      
      activeStakes.forEach((stake: any) => {
        console.log(`   - Активный стейк ${stake.id}: ${stake.stake_amount} TON, план ${stake.plan_type}`);
      });
      
      setStakes(activeStakes);
      
      // Загружаем историю стейков сразу
      await fetchStakeHistory();
      
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки стейков:', err);
      setLoading(false);
    }
  };

  // Функция загрузки истории стейков
  const fetchStakeHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ton/stakes/history/${player.telegram_id}`);
      const data = await response.json();
      
      const systemCompletedStakes = data.filter((stake: Stake) => 
        stake.system_id === systemId && stake.status === 'withdrawn'
      );
      
      console.log(`📚 ЗАВЕРШЕННЫХ СТЕЙКОВ ДЛЯ СИСТЕМЫ ${systemId}:`, systemCompletedStakes.length);
      
      setCompletedStakes(systemCompletedStakes);
    } catch (err) {
      console.error('Ошибка загрузки истории стейков:', err);
    }
  };

  // Обновление при изменении unlocked_systems игрока
  useEffect(() => {
    if (player?.telegram_id) {
      console.log('🔄 Обновление стейков: изменился игрок или система');
      fetchStakes();
    }
  }, [player?.telegram_id, player?.unlocked_systems, systemId, refreshTrigger, forceRefresh]);

  // Расчет заработанных денег
  const calculateTotalEarnings = () => {
    return completedStakes.reduce((total, stake) => {
      const stakeAmount = parseFloat(stake.stake_amount);
      const returnAmount = parseFloat(stake.return_amount);
      const profit = returnAmount - stakeAmount; // Чистая прибыль
      return total + profit;
    }, 0);
  };

  // Функция принудительного обновления стейков
  const refreshStakes = async () => {
    await fetchStakes();
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

  // 🔥 ПРАВИЛЬНЫЙ useEffect - ИСПОЛЬЗУЕТ СЕРВЕРНЫЕ ДАННЫЕ
// 🔥 useEffect с отладкой и fallback
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!player?.telegram_id) return;
      
      try {
        // 🔥 ПОЛУЧАЕМ ДАННЫЕ ОТ СЕРВЕРА
        const response = await fetch(`${API_URL}/api/ton/stakes/${player.telegram_id}`);
        const serverStakes = await response.json();
        
        console.log('📊 ПОЛНЫЕ СЕРВЕРНЫЕ ДАННЫЕ:', serverStakes);
        
        // Фильтруем для текущей системы
        const systemStakes = serverStakes.filter((stake: any) => stake.system_id === systemId);
        
        console.log('📊 СТЕЙКИ ДЛЯ СИСТЕМЫ:', systemStakes);
        
        if (systemStakes.length > 0) {
          const newTimeLeft: { [key: number]: string } = {};
          const newProgressValues: { [key: number]: number } = {};
          let hasReadyStakes = false;
          
          systemStakes.forEach((stake: any) => {
            console.log(`📊 ДЕТАЛЬНЫЙ АНАЛИЗ СТЕЙКА ${stake.id}:`, stake);
            
            // 🔥 ПРОВЕРЯЕМ ЕСТЬ ЛИ СЕРВЕРНЫЕ ПОЛЯ
            if (stake.time_left_text && typeof stake.time_left_text === 'string') {
              // Используем серверные данные
              console.log(`✅ СЕРВЕР ДАЕТ ВРЕМЯ для стейка ${stake.id}: "${stake.time_left_text}"`);
              newTimeLeft[stake.id] = stake.time_left_text;
              
              if (typeof stake.progress_percent === 'number') {
                newProgressValues[stake.id] = stake.progress_percent;
              }
              
              if (stake.is_ready) {
                hasReadyStakes = true;
              }
            } else {
              // 🔥 FALLBACK: Считаем на клиенте
              console.log(`❌ СЕРВЕР НЕ ДАЕТ ВРЕМЯ для стейка ${stake.id}, считаем на клиенте`);
              
              const now = new Date();
              const startTime = new Date(stake.start_date);
              
              let endTime;
              if (stake.test_mode) {
                endTime = new Date(startTime.getTime() + (stake.plan_days * 60 * 1000));
              } else {
                endTime = new Date(startTime.getTime() + (stake.plan_days * 24 * 60 * 60 * 1000));
              }
              
              const timeLeftMs = endTime.getTime() - now.getTime();
              const totalDurationMs = endTime.getTime() - startTime.getTime();
              const elapsedMs = now.getTime() - startTime.getTime();
              const progress = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));
              
              newProgressValues[stake.id] = progress;
              
              const isReady = timeLeftMs <= 0;
              
              if (isReady) {
                newTimeLeft[stake.id] = 'Готово к сбору!';
                newProgressValues[stake.id] = 100;
                hasReadyStakes = true;
              } else {
                if (stake.test_mode) {
                  const totalSeconds = Math.floor(timeLeftMs / 1000);
                  const minutes = Math.floor(totalSeconds / 60);
                  const seconds = totalSeconds % 60;
                  newTimeLeft[stake.id] = `${minutes}м ${seconds}с`;
                } else {
                  const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
                  
                  if (days > 0) {
                    newTimeLeft[stake.id] = `${days}д ${hours}ч ${minutes}м`;
                  } else if (hours > 0) {
                    newTimeLeft[stake.id] = `${hours}ч ${minutes}м`;
                  } else {
                    newTimeLeft[stake.id] = `${minutes}м`;
                  }
                }
              }
              
              console.log(`🔧 КЛИЕНТСКИЙ РАСЧЕТ для стейка ${stake.id}:`);
              console.log(`   Время: "${newTimeLeft[stake.id]}"`);
              console.log(`   Прогресс: ${progress.toFixed(1)}%`);
              console.log(`   Готов: ${isReady}`);
            }
          });
          
          console.log('📊 ФИНАЛЬНОЕ СОСТОЯНИЕ:', { 
            timeLeft: newTimeLeft, 
            progress: newProgressValues 
          });
          
          setTimeLeft(newTimeLeft);
          setProgressValues(newProgressValues);
          
          // Если есть готовые стейки - обновляем основные данные
          if (hasReadyStakes) {
            console.log('⏰ Есть готовые стейки, обновляем основные данные');
            await fetchStakes();
          }
        }
      } catch (error) {
        console.error('❌ Ошибка получения серверных данных:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player?.telegram_id, systemId, stakes]);
  
  // Сбор стейка с анимацией
  const handleWithdraw = async (stakeId: number) => {
    try {
      // Устанавливаем состояние сбора
      setCollecting(prev => ({ ...prev, [stakeId]: true }));
      
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
        // Создаем эффект взрыва денег
        createMoneyExplosion();
        
        // Показываем успех с анимацией
        setTimeout(() => {
          alert(`✅ Получено ${result.withdrawn_amount} TON!`);
        }, 500);
        
        // Отправляем событие глобального обновления
        window.dispatchEvent(new CustomEvent('stakes-updated'));
        
        // Обновляем данные игрока
        if (onPlayerUpdate) {
          await onPlayerUpdate();
        }
        
        // Принудительно обновляем стейки
        await fetchStakes();
        
      } else {
        alert(`❌ Ошибка: ${result.error}`);
      }
    } catch (err) {
      console.error('Ошибка сбора:', err);
      alert('Ошибка при сборе стейка');
    } finally {
      // Убираем состояние сбора
      setCollecting(prev => ({ ...prev, [stakeId]: false }));
    }
  };
  // Функция создания эффекта взрыва денег
  const createMoneyExplosion = () => {
    const container = document.body;
    
    // Создаем 20 монеток
    for (let i = 0; i < 20; i++) {
      const coin = document.createElement('div');
      coin.innerHTML = '💰';
      coin.style.position = 'fixed';
      coin.style.fontSize = '2rem';
      coin.style.zIndex = '9999';
      coin.style.pointerEvents = 'none';
      coin.style.left = '50%';
      coin.style.top = '50%';
      coin.style.transform = 'translate(-50%, -50%)';
      coin.style.animation = `coinExplosion${i} 2s ease-out forwards`;
      
      container.appendChild(coin);
      
      // Удаляем монетку через 2 секунды
      setTimeout(() => {
        container.removeChild(coin);
      }, 2000);
    }
    
    // Добавляем CSS анимации
    const style = document.createElement('style');
    style.textContent = `
      @keyframes coinExplosion0 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion1 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion2 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion3 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion4 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion5 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion6 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion7 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion8 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion9 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion10 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion11 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion12 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion13 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion14 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion15 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion16 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion17 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion18 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
      @keyframes coinExplosion19 { to { transform: translate(${Math.random() * 400 - 200}px, ${Math.random() * 400 - 200}px) scale(0) rotate(720deg); opacity: 0; } }
    `;
    document.head.appendChild(style);
    
    // Удаляем стили через 3 секунды
    setTimeout(() => {
      document.head.removeChild(style);
    }, 3000);
  };

  // 🔥 ПРОСТАЯ отмена стейка - доверяем серверу
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
        
      } else {
        alert(`❌ Ошибка: ${result.error || result.message}`);
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
      <div style={{ padding: '20px' }}>
        {/* Панель статистики даже без активных стейков */}
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
              Активных стейков: 0
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>
              Заработано в стейках: {calculateTotalEarnings().toFixed(2)} TON
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
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

        {/* Сообщение о том что нет активных стейков */}
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#ccc' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💰</div>
          <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
            В системе 5 нет активных стейков
          </div>
          <div style={{ fontSize: '1rem', marginBottom: '30px' }}>
            Создайте новый стейк для получения дохода
          </div>
        </div>

        {/* История стейков даже когда нет активных */}
        {completedStakes.length > 0 && (
          <div>
            <h3 style={{ 
              color: colorStyle, 
              fontSize: '1.5rem', 
              textAlign: 'center',
              marginBottom: '20px',
              textShadow: `0 0 10px ${colorStyle}`
            }}>
              📚 История стейков ({completedStakes.length})
            </h3>
            
            {(showAllHistory ? completedStakes : completedStakes.slice(0, 10)).map(stake => {
              const isSuccessful = !stake.penalty_amount || parseFloat(stake.penalty_amount) === 0;
              
              return (
                <div 
                  key={stake.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid #333',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '15px',
                    opacity: 0.8
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>
                        {stake.plan_type === 'fast' ? '⚡ Ускоренный' : '🏆 Стандартный'} - {parseFloat(stake.stake_amount).toFixed(2)} TON
                      </div>
                      <div style={{ 
                        color: isSuccessful ? '#4ade80' : '#ef4444', 
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        marginTop: '5px'
                      }}>
                        Получено: {parseFloat(stake.return_amount).toFixed(2)} TON 
                        (+{stake.plan_percent}% за {stake.plan_days} {stake.test_mode ? 'минут' : 'дней'})
                      </div>
                      <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '5px' }}>
                        Завершен: {new Date(stake.withdrawn_at || stake.end_date || '').toLocaleDateString()}
                        {!isSuccessful && (
                          <span style={{ 
                            color: '#ef4444', 
                            marginLeft: '10px',
                            fontWeight: 'bold'
                          }}>
                            Штраф: {parseFloat(stake.penalty_amount || '0').toFixed(2)} TON
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ 
                      color: isSuccessful ? '#4ade80' : '#ef4444',
                      fontSize: '1.5rem',
                      marginLeft: '15px'
                    }}>
                      {isSuccessful ? '✅' : '❌'}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {completedStakes.length > 10 && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '10px',
                    color: colorStyle,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${colorStyle}20`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {showAllHistory ? 
                    `📚 Показать только 10 последних` : 
                    `📚 Показать все ${completedStakes.length} стейков`
                  }
                </button>
              </div>
            )}
          </div>
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
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>
            Заработано в стейках: {calculateTotalEarnings().toFixed(2)} TON
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
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
        const isCollecting = collecting[stake.id] || false;
        const timeLeftText = timeLeft[stake.id] || 'Получение данных...';
        const isReady = timeLeftText === 'Готово к сбору!';
        const canCancel = !isReady && !isCollecting;
        const progressPercent = progressValues[stake.id] || 0;

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

{/* Прогресс бар с анимацией */}
<div style={{ marginBottom: '20px' }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '10px', 
                height: '20px',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  background: isReady ? 
                    `linear-gradient(90deg, #4ade80, #22c55e, #16a34a)` : 
                    `linear-gradient(90deg, ${colorStyle}, #4ade80)`,
                  height: '100%',
                  width: `${progressPercent}%`,
                  transition: 'width 1s ease-in-out',
                  borderRadius: '10px',
                  boxShadow: isReady ? '0 0 15px #4ade80' : `0 0 10px ${colorStyle}`,
                  animation: isReady ? 'pulse 2s infinite' : 'none'
                }} />
              </div>
              <div style={{ 
                textAlign: 'center', 
                marginTop: '10px', 
                color: isReady ? '#4ade80' : '#fff',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                textShadow: isReady ? '0 0 10px #4ade80' : 'none',
                animation: isReady ? 'glow 2s infinite' : 'none'
              }}>
                {timeLeftText}
              </div>
            </div>
            

            {/* 🔥 КНОПКИ НА РАЗНЫХ СТРОЧКАХ И РАСТЯНУТЫЕ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Кнопка "Забрать" */}
              <button
                onClick={() => handleWithdraw(stake.id)}
                disabled={!isReady || isCollecting}
                style={{
                  padding: '12px 20px',
                  background: isReady ? 
                    `linear-gradient(135deg, #4ade80, #22c55e)` : 
                    'rgba(100, 100, 100, 0.3)',
                  border: `2px solid ${isReady ? '#4ade80' : '#666'}`,
                  borderRadius: '12px',
                  color: isReady ? '#fff' : '#999',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: (isReady && !isCollecting) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: isCollecting ? 'scale(1.02)' : 'scale(1)',
                  animation: isReady ? 'readyPulse 2s infinite' : 'none',
                  opacity: isCollecting ? 0.8 : 1
                }}
                onMouseEnter={e => {
                  if (isReady && !isCollecting) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 0 15px #4ade80';
                  }
                }}
                onMouseLeave={e => {
                  if (isReady && !isCollecting) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isCollecting ? (
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ 
                      animation: 'spin 1s linear infinite',
                      display: 'inline-block'
                    }}>💰</span>
                    Собираем доход...
                  </span>
                ) : (
                  <>💰 Забрать доход</>
                )}
              </button>

              {/* Кнопка "Отменить" */}
              <button
                onClick={() => handleCancel(stake.id)}
                disabled={isCollecting || !canCancel}
                title={!canCancel ? 'Стейк завершен - отмена невозможна' : 'Отменить с штрафом 10%'}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  border: `2px solid ${canCancel ? '#ef4444' : '#666'}`,
                  borderRadius: '12px',
                  color: canCancel ? '#ef4444' : '#666',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  cursor: (isCollecting || !canCancel) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  opacity: (isCollecting || !canCancel) ? 0.5 : 1
                }}
                onMouseEnter={e => {
                  if (!isCollecting && canCancel) {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = '#dc2626';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isCollecting && canCancel) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {canCancel ? '❌ Отменить стейк (-10% штраф)' : '⏰ Стейк завершен'}
              </button>
            </div>
          </div>
        );
      })}

      {/* История стейков */}
      {completedStakes.length > 0 && (
        <div style={{ marginTop: stakes.length > 0 ? '30px' : '0' }}>
          <h3 style={{ 
            color: colorStyle, 
            fontSize: '1.5rem', 
            textAlign: 'center',
            marginBottom: '20px',
            textShadow: `0 0 10px ${colorStyle}`
          }}>
            📚 История стейков ({completedStakes.length})
          </h3>
          
          {(showAllHistory ? completedStakes : completedStakes.slice(0, 10)).map(stake => {
            const isSuccessful = !stake.penalty_amount || parseFloat(stake.penalty_amount) === 0;
            
            return (
              <div 
                key={stake.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid #333',
                  borderRadius: '15px',
                  padding: '20px',
                  marginBottom: '15px',
                  opacity: 0.8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {stake.plan_type === 'fast' ? '⚡ Ускоренный' : '🏆 Стандартный'} - {parseFloat(stake.stake_amount).toFixed(2)} TON
                    </div>
                    <div style={{ 
                      color: isSuccessful ? '#4ade80' : '#ef4444', 
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      marginTop: '5px'
                    }}>
                      Получено: {parseFloat(stake.return_amount).toFixed(2)} TON 
                      (+{stake.plan_percent}% за {stake.plan_days} {stake.test_mode ? 'минут' : 'дней'})
                    </div>
                    <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '5px' }}>
                      Завершен: {new Date(stake.withdrawn_at || stake.end_date || '').toLocaleDateString()}
                      {!isSuccessful && (
                        <span style={{ 
                          color: '#ef4444', 
                          marginLeft: '10px',
                          fontWeight: 'bold'
                        }}>
                          Штраф: {parseFloat(stake.penalty_amount || '0').toFixed(2)} TON
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ 
                    color: isSuccessful ? '#4ade80' : '#ef4444',
                    fontSize: '1.5rem',
                    marginLeft: '15px'
                  }}>
                    {isSuccessful ? '✅' : '❌'}
                  </div>
                </div>
              </div>
            );
          })}
          
          {completedStakes.length > 10 && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={() => setShowAllHistory(!showAllHistory)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '10px',
                  color: colorStyle,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${colorStyle}20`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {showAllHistory ? 
                  `📚 Показать только 10 последних` : 
                  `📚 Показать все ${completedStakes.length} стейков`
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* CSS анимации */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 15px #4ade80; }
            50% { box-shadow: 0 0 25px #4ade80, 0 0 35px #4ade80; }
          }
          
          @keyframes glow {
            0%, 100% { text-shadow: 0 0 10px #4ade80; }
            50% { text-shadow: 0 0 20px #4ade80, 0 0 30px #4ade80; }
          }
          
          @keyframes readyPulse {
            0%, 100% { 
              box-shadow: 0 0 10px #4ade80;
              background: linear-gradient(135deg, #4ade80, #22c55e);
            }
            50% { 
              box-shadow: 0 0 20px #4ade80, 0 0 30px #4ade80;
              background: linear-gradient(135deg, #22c55e, #4ade80);
            }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default StakingView;