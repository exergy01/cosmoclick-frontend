// components/DailyBonusButton.tsx - Кнопка ежедневных бонусов
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface DailyBonusButtonProps {
  telegramId: string;
  playerColor: string;
  onClick: () => void;
}

interface BonusStatus {
  can_claim: boolean;
  current_streak: number;
  next_bonus_amount: number;
}

const DailyBonusButton: React.FC<DailyBonusButtonProps> = ({
  telegramId,
  playerColor,
  onClick
}) => {
  const [bonusStatus, setBonusStatus] = useState<BonusStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (telegramId) {
      loadBonusStatus();

      // Обновляем статус каждые 5 минут
      const interval = setInterval(loadBonusStatus, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [telegramId]);

  const loadBonusStatus = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/daily-bonus/status/${telegramId}`);
      setBonusStatus(response.data);
    } catch (err) {
      console.error('Error loading bonus status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!bonusStatus) {
    return null; // Не показываем кнопку пока не загружен статус
  }

  const hasNotification = bonusStatus.can_claim;

  return (
    <button
      onClick={onClick}
      style={{
        background: hasNotification
          ? `linear-gradient(135deg, ${playerColor}, ${playerColor}88)`
          : 'rgba(255, 255, 255, 0.1)',
        border: hasNotification
          ? `2px solid ${playerColor}`
          : '2px solid #444',
        borderRadius: '15px',
        padding: '12px 16px',
        color: hasNotification ? '#fff' : '#aaa',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: hasNotification ? `0 0 20px ${playerColor}40` : 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>🎁</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.8rem', lineHeight: '1' }}>
          Бонус
        </span>
        {bonusStatus.current_streak > 0 && (
          <span style={{ fontSize: '0.7rem', opacity: 0.8, lineHeight: '1' }}>
            День {bonusStatus.current_streak}
          </span>
        )}
      </div>

      {/* Уведомление о доступности */}
      {hasNotification && (
        <div style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          background: '#ff4444',
          color: '#fff',
          borderRadius: '10px',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          animation: 'pulse 1.5s infinite'
        }}>
          !
        </div>
      )}
    </button>
  );
};

export default DailyBonusButton;