// components/DailyBonusModal.tsx - Модалка ежедневных бонусов
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBonusClaimed: (amount: number) => void;
  playerColor: string;
  telegramId: string;
}

interface BonusStatus {
  can_claim: boolean;
  current_streak: number;
  next_day: number;
  next_bonus_amount: number;
  last_claim_date: string | null;
  total_claims: number;
  bonus_schedule: number[];
}

const DailyBonusModal: React.FC<DailyBonusModalProps> = ({
  isOpen,
  onClose,
  onBonusClaimed,
  playerColor,
  telegramId
}) => {
  const [bonusStatus, setBonusStatus] = useState<BonusStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && telegramId) {
      loadBonusStatus();
    }
  }, [isOpen, telegramId]);

  const loadBonusStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/daily-bonus/status/${telegramId}`);
      setBonusStatus(response.data);
    } catch (err: any) {
      console.error('Error loading bonus status:', err);
      setError('Ошибка загрузки статуса бонусов');
    } finally {
      setLoading(false);
    }
  };

  const claimBonus = async () => {
    if (!bonusStatus?.can_claim) return;

    setClaiming(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/daily-bonus/claim/${telegramId}`);

      if (response.data.success) {
        onBonusClaimed(response.data.bonus_amount);
        await loadBonusStatus(); // Обновляем статус

        // Показываем поздравление
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error claiming bonus:', err);
      setError(err.response?.data?.error || 'Ошибка получения бонуса');
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        border: `2px solid ${playerColor}`,
        boxShadow: `0 0 30px ${playerColor}40`,
        position: 'relative'
      }}>
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            color: '#aaa',
            fontSize: '24px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>

        {/* Заголовок */}
        <div style={{
          textAlign: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{
            color: playerColor,
            margin: '0 0 10px 0',
            fontSize: '1.8rem',
            textShadow: `0 0 10px ${playerColor}`
          }}>
            🎁 Ежедневный бонус
          </h2>
          <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>
            Заходи каждый день и получай все больше CCC!
          </p>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#aaa'
          }}>
            🔄 Загрузка...
          </div>
        ) : error ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#ff4444',
            background: 'rgba(255, 68, 68, 0.1)',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            ❌ {error}
          </div>
        ) : bonusStatus ? (
          <>
            {/* Календарь бонусов */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              marginBottom: '25px'
            }}>
              {bonusStatus.bonus_schedule.map((amount, index) => {
                const dayNumber = index + 1;
                const isCurrentDay = dayNumber === bonusStatus.next_day;
                const isCompleted = dayNumber <= bonusStatus.current_streak;
                const isClaimed = bonusStatus.current_streak >= dayNumber && bonusStatus.last_claim_date;

                return (
                  <div
                    key={dayNumber}
                    style={{
                      background: isCurrentDay
                        ? `linear-gradient(135deg, ${playerColor}, ${playerColor}88)`
                        : isCompleted
                        ? 'rgba(68, 255, 68, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: isCurrentDay
                        ? `2px solid ${playerColor}`
                        : isCompleted
                        ? '2px solid #44ff44'
                        : '2px solid #444',
                      borderRadius: '12px',
                      padding: '12px 8px',
                      textAlign: 'center',
                      position: 'relative',
                      minHeight: '70px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#aaa',
                      marginBottom: '4px'
                    }}>
                      День {dayNumber}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: isCurrentDay ? '#fff' : isCompleted ? '#44ff44' : '#aaa'
                    }}>
                      {amount} CCC
                    </div>
                    {isCompleted && !isCurrentDay && (
                      <div style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        color: '#44ff44',
                        fontSize: '0.8rem'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Информация о стрике */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: playerColor, fontWeight: 'bold', marginBottom: '5px' }}>
                📊 Текущий стрик: {bonusStatus.current_streak} дней
              </div>
              <div style={{ color: '#aaa', fontSize: '0.8rem' }}>
                Всего получено бонусов: {bonusStatus.total_claims}
              </div>
            </div>

            {/* Кнопка получения бонуса */}
            {bonusStatus.can_claim ? (
              <button
                onClick={claimBonus}
                disabled={claiming}
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${playerColor}, ${playerColor}dd)`,
                  border: 'none',
                  borderRadius: '15px',
                  padding: '15px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: claiming ? 'wait' : 'pointer',
                  boxShadow: `0 5px 15px ${playerColor}40`,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!claiming) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!claiming) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {claiming ? '⏳ Получение...' : `🎁 Получить ${bonusStatus.next_bonus_amount} CCC`}
              </button>
            ) : (
              <div style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid #444',
                borderRadius: '15px',
                padding: '15px',
                color: '#aaa',
                fontSize: '1rem',
                textAlign: 'center'
              }}>
                {bonusStatus.last_claim_date
                  ? `✅ Бонус уже получен сегодня! Возвращайтесь завтра за ${bonusStatus.next_bonus_amount} CCC`
                  : '⏰ Бонус недоступен'
                }
              </div>
            )}

            {/* Предупреждение о сбросе */}
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: 'rgba(255, 165, 0, 0.1)',
              border: '1px solid #FFA500',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#FFA500',
              textAlign: 'center'
            }}>
              ⚠️ Пропуск дня сбрасывает стрик на начало!
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default DailyBonusModal;