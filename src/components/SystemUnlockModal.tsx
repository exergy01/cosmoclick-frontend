import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useTranslation } from 'react-i18next';

interface SystemUnlockModalProps {
  systemId: number;
  onUnlock: () => void;
  onCancel: () => void;
}

const SystemUnlockModal: React.FC<SystemUnlockModalProps> = ({ systemId, onUnlock, onCancel }) => {
  const { player, buySystem } = usePlayer();
  const { setPlayer } = useNewPlayer();
  const { t } = useTranslation();
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [showAmountSelection, setShowAmountSelection] = useState(false);
  const [planData, setPlanData] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState<number>(15);
  const [loading, setLoading] = useState(false);

  if (!player) return null;

  const systemNames = [
    'Андромеда',
    'Орион', 
    'Млечный Путь', 
    'Туманность Ориона', 
    'Крабовидная Туманность'
  ];

  const systemDescriptions = [
    'Начальная система для освоения основ космической добычи. Здесь вы изучите принципы работы с астероидами, дронами и грузовыми отсеками.',
    'Развитая система с улучшенными астероидами и более мощными дронами. Увеличенная добыча CCC откроет новые возможности.',
    'Родная галактика с богатыми ресурсами и передовыми технологиями. Высокая прибыльность и престижные достижения.',
    'Мистическая область космоса с уникальными астероидами. Повышенные риски компенсируются невероятной добычей.',
    'TON стейкинг система с гарантированной доходностью. Создавайте неограниченное количество стейков и получайте пассивный доход от вложений в TON.'
  ];

  const systemData = {
    1: { price: 0, currency: 'cs' },
    2: { price: 150, currency: 'cs' },
    3: { price: 300, currency: 'cs' },
    4: { price: 500, currency: 'cs' },
    5: { price: 15, currency: 'ton' }
  };

  const system = systemData[systemId as keyof typeof systemData];
  
  const playerCs = parseFloat(player.cs || '0');
  const playerTon = parseFloat(player.ton || '0');
  
  const canAfford = system.currency === 'cs' ? 
    playerCs >= system.price : 
    playerTon >= system.price;

  const handleUnlock = async () => {
    if (process.env.NODE_ENV === 'development') console.log('🚀 КЛИК ПО КНОПКЕ handleUnlock, canAfford:', canAfford);
    if (process.env.NODE_ENV === 'development') console.log('🚀 systemId:', systemId, 'price:', system.price);
    
    try {
      setLoading(true);
      
      if (systemId === 5) {
        const isSystem5Unlocked = player.unlocked_systems?.includes(5);
        
        if (isSystem5Unlocked) {
          // Система 5 УЖЕ разблокирована - показываем выбор суммы
          setShowAmountSelection(true);
          setLoading(false);
          return;
        } else {
          // Система 5 НЕ разблокирована - показываем выбор тарифа для 15 TON
          setPlanData({
            system_id: 5,
            stake_amount: 15,
            plans: [
              {
                type: 'fast',
                days: 20,
                percent: 3,
                return_amount: (15 * 1.03).toFixed(8),
                time_unit: 'дней'
              },
              {
                type: 'standard',
                days: 40,
                percent: 7,
                return_amount: (15 * 1.07).toFixed(8),
                time_unit: 'дней'
              }
            ]
          });
          setShowPlanSelection(true);
          setLoading(false);
          return;
        }
      }
      
      // Для других систем - обычная покупка
      if (process.env.NODE_ENV === 'development') console.log('🚀 ВЫЗЫВАЕМ buySystem...');
      const result = await buySystem(systemId, system.price) as any;
      if (process.env.NODE_ENV === 'development') console.log('✅ buySystem результат:', result);
      
      setLoading(false);
      onUnlock();
    } catch (err) {
      console.error('❌ Failed to unlock system:', err);
      setLoading(false);
      alert(`❌ Ошибка разблокировки системы: ${err}`);
    }
  };

  const handleAmountConfirm = async () => {
    if (customAmount < 15 || customAmount > 1000) {
      alert('Сумма должна быть от 15 до 1000 TON');
      return;
    }
    
    const playerTon = parseFloat(player.ton || '0');
    if (playerTon < customAmount) {
      alert(`Недостаточно TON. У вас: ${playerTon.toFixed(6)}`);
      return;
    }
    
    setLoading(true);
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

      if (process.env.NODE_ENV === 'development') console.log('🔥 Запрос расчета планов для суммы:', customAmount);
      if (process.env.NODE_ENV === 'development') console.log('🔥 API URL:', `${API_URL}/api/ton/calculate/${customAmount}`);
      
      const response = await fetch(`${API_URL}/api/ton/calculate/${customAmount}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (process.env.NODE_ENV === 'development') console.log('🔥 Response status:', response.status);
      if (process.env.NODE_ENV === 'development') console.log('🔥 Response headers:', response.headers);
      
      // Проверяем, что получили JSON
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Получен не JSON ответ:', textResponse.substring(0, 200));
        throw new Error(`Сервер вернул ${response.status}: ${response.statusText}. Проверьте доступность API.`);
      }
      
      const result = await response.json();
      if (process.env.NODE_ENV === 'development') console.log('🔥 Результат расчета планов:', result);
      
      if (response.ok && result.success) {
        setPlanData({
          system_id: 5,
          stake_amount: customAmount,
          plans: result.plans
        });
        setShowAmountSelection(false);
        setShowPlanSelection(true);
      } else {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Ошибка расчета планов:', err);
      alert(`❌ Ошибка при расчете планов: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (planType: string) => {
    if (!planData) return;
    
    setLoading(true);
    
    try {
      if (process.env.NODE_ENV === 'development') console.log('🔥 ВЫБИРАЕМ ТАРИФ:', planType);
      if (process.env.NODE_ENV === 'development') console.log('🔥 ДАННЫЕ ДЛЯ СТЕЙКА:', {
        systemId: planData.system_id, 
        stakeAmount: planData.stake_amount,
        planType 
      });
      
const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';
        
      if (process.env.NODE_ENV === 'development') console.log('🔥 ОТПРАВЛЯЕМ ЗАПРОС НА:', `${API_URL}/api/ton/stake`);
      
      const response = await fetch(`${API_URL}/api/ton/stake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: player.telegram_id,
          systemId: planData.system_id,
          stakeAmount: planData.stake_amount,
          planType: planType
        }),
      });
      
      if (process.env.NODE_ENV === 'development') console.log('🔥 Response status:', response.status);
      
      // Проверяем, что получили JSON
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Получен не JSON ответ:', textResponse.substring(0, 200));
        throw new Error(`Сервер вернул ${response.status}: ${response.statusText}. Проверьте доступность API стейкинга.`);
      }
      
      const result = await response.json();
      if (process.env.NODE_ENV === 'development') console.log('🔥 РЕЗУЛЬТАТ СОЗДАНИЯ СТЕЙКА:', result);
      
      if (response.ok && result.success) {
        const timeUnit = result.stake.time_unit || 'дней';
        alert(`✅ Стейк создан успешно! Получите ${result.stake.return_amount} TON через ${result.stake.plan_days} ${timeUnit}`);
        
        // Обновляем игрока новыми данными из ответа
        if (result.player) {
          if (process.env.NODE_ENV === 'development') console.log('🔥 Обновляем игрока данными:', result.player);
          setPlayer(result.player);
        }
        
        // Отправляем глобальное событие обновления стейков
        if (process.env.NODE_ENV === 'development') console.log('📢 Отправляем событие обновления стейков');
        window.dispatchEvent(new CustomEvent('stakes-updated'));
        
        // Закрываем модальное окно
        onUnlock();
      } else {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Ошибка выбора тарифа:', err);
      alert(`❌ Ошибка: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const colorStyle = player.color || '#00f0ff';

  if (showAmountSelection) {
    const playerTon = parseFloat(player.ton || '0');
    const canAffordAmount = playerTon >= customAmount;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 30, 60, 0.95))`,
          border: `3px solid ${colorStyle}`,
          borderRadius: '20px',
          boxShadow: `0 0 30px ${colorStyle}`,
          padding: '30px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          color: '#fff'
        }}>
          <h1 style={{
            fontSize: '2rem',
            color: colorStyle,
            textShadow: `0 0 10px ${colorStyle}`,
            marginBottom: '20px'
          }}>
            💰 Выберите сумму стейка
          </h1>
          
          <p style={{ marginBottom: '20px', fontSize: '1.1rem' }}>
            Система 5 уже разблокирована!<br/>
            Создайте новый стейк на любую сумму от 15 до 1000 TON
          </p>
          
          <p style={{ marginBottom: '30px', fontSize: '1rem', color: '#aaa' }}>
            Ваш баланс: {playerTon.toFixed(6)} TON
          </p>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '1.1rem' }}>
              Сумма стейка (TON):
            </label>
            <input
              type="number"
              min="15"
              max="1000"
              step="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(parseInt(e.target.value) || 15)}
              disabled={loading}
              ref={(input) => {
                // 🔥 JAVASCRIPT ПРИНУДИТЕЛЬНОЕ УБИРАНИЕ СТРЕЛОЧЕК
                if (input) {
                  const style = document.createElement('style');
                  style.innerHTML = `
                    input[type="number"]::-webkit-outer-spin-button,
                    input[type="number"]::-webkit-inner-spin-button {
                      -webkit-appearance: none !important;
                      margin: 0 !important;
                      display: none !important;
                      visibility: hidden !important;
                      background: transparent !important;
                      pointer-events: none !important;
                    }
                    input[type="number"] {
                      -moz-appearance: textfield !important;
                      appearance: none !important;
                      -webkit-appearance: none !important;
                    }
                  `;
                  if (!document.head.querySelector('#no-spinner-style')) {
                    style.id = 'no-spinner-style';
                    document.head.appendChild(style);
                  }
                }
              }}
              style={{
                padding: '15px',
                fontSize: '1.2rem',
                width: '200px',
                textAlign: 'center',
                border: `2px solid ${colorStyle}`,
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.5)',
                color: '#fff',
                opacity: loading ? 0.6 : 1,
                // Дополнительные инлайн стили
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                appearance: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowAmountSelection(false)}
              disabled={loading}
              style={{
                padding: '15px 30px',
                background: 'transparent',
                border: `2px solid #666`,
                borderRadius: '10px',
                color: '#666',
                fontSize: '1.1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Назад
            </button>
            
            <button
              onClick={handleAmountConfirm}
              disabled={loading || !canAffordAmount || customAmount < 15 || customAmount > 1000}
              style={{
                padding: '15px 30px',
                background: (canAffordAmount && customAmount >= 15 && customAmount <= 1000 && !loading) ? 
                  `linear-gradient(135deg, ${colorStyle}20, ${colorStyle}40, ${colorStyle}20)` : 
                  'rgba(100, 100, 100, 0.3)',
                border: `2px solid ${(canAffordAmount && customAmount >= 15 && customAmount <= 1000 && !loading) ? colorStyle : '#666'}`,
                borderRadius: '10px',
                color: (canAffordAmount && customAmount >= 15 && customAmount <= 1000 && !loading) ? '#fff' : '#999',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: (canAffordAmount && customAmount >= 15 && customAmount <= 1000 && !loading) ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? '⏳ Загрузка...' : 'Продолжить'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showPlanSelection && planData) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 30, 60, 0.95))`,
          border: `3px solid ${colorStyle}`,
          borderRadius: '20px',
          boxShadow: `0 0 30px ${colorStyle}`,
          padding: '30px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          color: '#fff'
        }}>
          <h1 style={{
            fontSize: '2rem',
            color: colorStyle,
            textShadow: `0 0 10px ${colorStyle}`,
            marginBottom: '20px'
          }}>
            💰 Выберите тариф стейкинга
          </h1>
          
          <p style={{ marginBottom: '30px', fontSize: '1.1rem' }}>
            Вклад: {planData.stake_amount} TON
          </p>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
            {planData.plans.map((plan: any) => (
              <button
                key={plan.type}
                onClick={() => handlePlanSelect(plan.type)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '20px',
                  background: `linear-gradient(135deg, ${colorStyle}20, ${colorStyle}40, ${colorStyle}20)`,
                  border: `3px solid ${colorStyle}`,
                  borderRadius: '15px',
                  color: '#fff',
                  fontSize: '1rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: `0 0 20px ${colorStyle}50`,
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = `0 0 30px ${colorStyle}`;
                  }
                }}
                onMouseLeave={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 0 20px ${colorStyle}50`;
                  }
                }}
              >
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                  {plan.type === 'fast' ? '⚡ Ускоренный' : '🏆 Стандартный'}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  {plan.days} {plan.time_unit || 'дней'}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  +{plan.percent}%
                </div>
                <div style={{ color: '#4ade80', fontWeight: 'bold' }}>
                  Получите: {plan.return_amount} TON
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setShowPlanSelection(false);
              setPlanData(null);
              if (systemId === 5) {
                setShowAmountSelection(true);
              }
            }}
            disabled={loading}
            style={{
              padding: '15px 30px',
              background: 'transparent',
              border: `2px solid #666`,
              borderRadius: '10px',
              color: '#666',
              fontSize: '1.1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '⏳ Обработка...' : 'Назад'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 30, 60, 0.95))`,
        border: `3px solid ${colorStyle}`,
        borderRadius: '20px',
        boxShadow: `0 0 30px ${colorStyle}`,
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        color: '#fff'
      }}>
        <h1 style={{
          fontSize: '2rem',
          color: colorStyle,
          textShadow: `0 0 10px ${colorStyle}`,
          marginBottom: '20px'
        }}>
          🌌 Система {systemId}
        </h1>
        
        <h2 style={{
          fontSize: '1.5rem',
          color: '#fff',
          marginBottom: '20px'
        }}>
          {systemNames[systemId - 1]}
        </h2>

        <p style={{
          fontSize: '1.1rem',
          lineHeight: '1.6',
          marginBottom: '30px',
          color: '#ccc'
        }}>
          {systemDescriptions[systemId - 1]}
        </p>

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          border: `1px solid ${colorStyle}`
        }}>
          <h3 style={{ color: colorStyle, marginBottom: '15px' }}>
            Что вас ждет в этой системе:
          </h3>
          <div style={{ textAlign: 'left', color: '#fff' }}>
            {systemId <= 4 ? (
              <>
                <p>🌍 Уникальные астероиды с ценными ресурсами</p>
                <p>🤖 Продвинутые дроны для автоматической добычи</p>
                <p>📦 Вместительные грузовые отсеки</p>
                <p>💎 Конвертация CCC в CS и TON</p>
                <p>🚀 Путь к космическому могуществу</p>
              </>
            ) : (
              <>
                <p>💰 TON стейкинг с гарантированной доходностью</p>
                <p>⚡ Ускоренный тариф: 20 дней, +3%</p>
                <p>🏆 Стандартный тариф: 40 дней, +7%</p>
                <p>🔄 Неограниченное количество стейков</p>
                <p>🔒 Безопасность и прозрачность операций</p>
              </>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
        }}>
          {systemId > 1 && (
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '15px 30px',
                background: 'transparent',
                border: `2px solid #666`,
                borderRadius: '10px',
                color: '#666',
                fontSize: '1.1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.borderColor = '#999';
                  e.currentTarget.style.color = '#999';
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.borderColor = '#666';
                  e.currentTarget.style.color = '#666';
                }
              }}
            >
              Отмена
            </button>
          )}
          
          <button
            onClick={handleUnlock}
            disabled={!canAfford || loading}
            style={{
              padding: '20px 40px',
              background: (canAfford && !loading) ? 
                `linear-gradient(135deg, ${colorStyle}20, ${colorStyle}40, ${colorStyle}20)` : 
                'linear-gradient(135deg, #44444420, #44444440, #44444420)',
              border: `3px solid ${(canAfford && !loading) ? colorStyle : '#666'}`,
              borderRadius: '15px',
              color: (canAfford && !loading) ? '#fff' : '#999',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: (canAfford && !loading) ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: (canAfford && !loading) ? 
                `0 0 30px ${colorStyle}50, inset 0 0 20px ${colorStyle}20` : 
                '0 0 10px #44444450',
              textShadow: (canAfford && !loading) ? `0 0 10px ${colorStyle}` : 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              if (canAfford && !loading) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 0 50px ${colorStyle}, inset 0 0 30px ${colorStyle}30`;
                e.currentTarget.style.background = `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`;
              }
            }}
            onMouseLeave={e => {
              if (canAfford && !loading) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 0 30px ${colorStyle}50, inset 0 0 20px ${colorStyle}20`;
                e.currentTarget.style.background = `linear-gradient(135deg, ${colorStyle}20, ${colorStyle}40, ${colorStyle}20)`;
              }
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${colorStyle}40, transparent)`,
              animation: (canAfford && !loading) ? 'shimmer 2s infinite' : 'none'
            }} />
            {loading ? '⏳ Загрузка...' :
             system.price === 0 ? 
              '🚀 НАЧАТЬ ИГРУ БЕСПЛАТНО!' : 
              systemId === 5 && player.unlocked_systems?.includes(5) ?
              '💰 СОЗДАТЬ НОВЫЙ СТЕЙК' :
              `🔓 РАЗБЛОКИРОВАТЬ ЗА ${system.price} ${system.currency.toUpperCase()}`
            }
          </button>
        </div>

        {!canAfford && system.price > 0 && !loading && (
          <p style={{
            marginTop: '15px',
            color: '#ff6b6b',
            fontSize: '0.9rem'
          }}>
            Недостаточно {system.currency.toUpperCase()}. 
            У вас: {system.currency === 'cs' ? 
              playerCs.toFixed(2) : 
              playerTon.toFixed(6)
            }
          </p>
        )}
      </div>

      {/* 🔥 МАКСИМАЛЬНО АГРЕССИВНЫЕ СТИЛИ ДЛЯ CHROME */}
      <style>
        {`
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}
      </style>
    </div>
  );
};

export default SystemUnlockModal;