// components/DailyWelcomeModal.tsx - Простое приветственное окно с календарем
import React, { useState } from 'react';
import axios from 'axios';

// Функция для создания звука успеха
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Создаем приятный звук монетки/успеха
    const duration = 0.3; // 300ms
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Частоты для приятного звука
    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5

    oscillator1.type = 'sine';
    oscillator2.type = 'sine';

    // Настройка громкости с плавным затуханием
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    // Подключение узлов
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Воспроизведение
    oscillator1.start(audioContext.currentTime);
    oscillator2.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + duration);
    oscillator2.stop(audioContext.currentTime + duration);

    console.log('🔊 Звук успеха воспроизведен');
  } catch (error) {
    console.log('🔇 Звук недоступен:', error);
  }
};

// Функция для вибрации через Telegram WebApp
const triggerHapticFeedback = () => {
  try {
    // Telegram WebApp API для вибрации
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      console.log('📳 Вибрация через Telegram WebApp');
    } else if (navigator.vibrate) {
      // Резервный вариант для обычных браузеров
      navigator.vibrate([100, 50, 100]); // Двойная вибрация
      console.log('📳 Вибрация через Navigator API');
    } else {
      console.log('📳 Вибрация недоступна');
    }
  } catch (error) {
    console.log('📳 Ошибка вибрации:', error);
  }
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface DailyWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBonusClaimed: (amount: number) => void;
  playerColor: string;
  telegramId: string;
  currentDay: number;
}

// Награды за каждый день
const DAILY_REWARDS = [10, 20, 30, 40, 50, 60, 100];

const DailyWelcomeModal: React.FC<DailyWelcomeModalProps> = ({
  isOpen,
  onClose,
  onBonusClaimed,
  playerColor,
  telegramId,
  currentDay
}) => {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);

    // 🎉 МГНОВЕННАЯ ВИБРАЦИЯ при клике для лучшего UX
    triggerHapticFeedback();
    const requestUrl = `${API_URL}/api/daily-bonus/claim/${telegramId}`;
    console.log(`🎁 Попытка получить бонус для ${telegramId}`);
    console.log(`🔗 URL запроса: ${requestUrl}`);

    // Сначала тестируем GET запрос статуса
    try {
      const statusResponse = await axios.get(`${API_URL}/api/daily-bonus/status/${telegramId}`);
      console.log(`📊 Статус работает:`, statusResponse.data);
    } catch (statusError) {
      console.error(`❌ Ошибка статуса:`, statusError);
    }

    try {
      const response = await axios.post(requestUrl, {}, {
        timeout: 10000 // 10 секунд таймаут
      });
      console.log('🎁 Ответ сервера:', response.data);

      if (response.data.success) {
        console.log(`✅ Бонус получен: ${response.data.bonus_amount} CCC`);

        // 🎉 ДОБАВЛЯЕМ ЗВУК И ВИБРАЦИЮ
        triggerHapticFeedback(); // Вибрация
        setTimeout(() => {
          playSuccessSound(); // Звук с небольшой задержкой для лучшего эффекта
        }, 100);

        setClaimed(true);
        onBonusClaimed(response.data.bonus_amount);

        // Автоматически закрываем через 2 секунды
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        // Обрабатываем ошибку с сервера
        console.error('❌ Ошибка сервера:', response.data.error);
        setClaiming(false);
      }
    } catch (error: any) {
      console.error('❌ Ошибка запроса:', error.response?.data || error.message);
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  const todayReward = DAILY_REWARDS[currentDay - 1] || DAILY_REWARDS[0];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '400px',
        width: '100%',
        border: `2px solid ${playerColor}`,
        boxShadow: `0 0 30px ${playerColor}60`,
        textAlign: 'center'
      }}>
        {/* Заголовок */}
        <h2 style={{
          color: playerColor,
          margin: '0 0 10px 0',
          fontSize: '1.8rem',
          textShadow: `0 0 10px ${playerColor}`
        }}>
          🎁 Ежедневная награда
        </h2>

        <p style={{
          color: '#aaa',
          margin: '0 0 25px 0',
          fontSize: '0.9rem'
        }}>
          Добро пожаловать! Получи свою награду дня {currentDay}
        </p>

        {/* Календарь */}
        <div style={{
          marginBottom: '25px'
        }}>
          {/* Первые 6 дней в 2 столбца */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '10px'
          }}>
            {DAILY_REWARDS.slice(0, 6).map((amount, index) => {
              const day = index + 1;
              const isToday = day === currentDay;
              const isPast = day < currentDay;

              return (
                <div
                  key={day}
                  style={{
                    background: isToday
                      ? `linear-gradient(135deg, ${playerColor}, ${playerColor}88)`
                      : isPast
                      ? 'rgba(68, 255, 68, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: isToday
                      ? `2px solid ${playerColor}`
                      : isPast
                      ? '2px solid #44ff44'
                      : '2px solid #444',
                    borderRadius: '12px',
                    padding: '15px 10px',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#aaa',
                    marginBottom: '5px'
                  }}>
                    День {day}
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: isToday ? '#fff' : isPast ? '#44ff44' : '#aaa'
                  }}>
                    {amount} CCC
                  </div>
                  {isPast && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      color: '#44ff44',
                      fontSize: '0.9rem'
                    }}>
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Седьмой день на всю ширину */}
          <div style={{
            background: currentDay === 7
              ? `linear-gradient(135deg, ${playerColor}, ${playerColor}88)`
              : currentDay > 7
              ? 'rgba(68, 255, 68, 0.2)'
              : 'rgba(255, 255, 255, 0.1)',
            border: currentDay === 7
              ? `2px solid ${playerColor}`
              : currentDay > 7
              ? '2px solid #44ff44'
              : '2px solid #444',
            borderRadius: '15px',
            padding: '20px',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '1rem',
              color: '#aaa',
              marginBottom: '8px'
            }}>
              День 7 - Большая награда!
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: currentDay === 7 ? '#fff' : currentDay > 7 ? '#44ff44' : '#aaa'
            }}>
              🎉 100 CCC 🎉
            </div>
            {currentDay > 7 && (
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                color: '#44ff44',
                fontSize: '1.2rem'
              }}>
                ✓
              </div>
            )}
          </div>
        </div>

        {/* Кнопка получения */}
        {!claimed ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            style={{
              width: '100%',
              background: `linear-gradient(135deg, ${playerColor}, ${playerColor}dd)`,
              border: 'none',
              borderRadius: '15px',
              padding: '15px',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: claiming ? 'wait' : 'pointer',
              boxShadow: `0 5px 15px ${playerColor}40`,
              transition: 'all 0.3s ease',
              transform: claiming ? 'scale(0.95)' : 'scale(1)', // Анимация нажатия
              opacity: claiming ? 0.8 : 1
            }}
          >
            {claiming ? '⏳ Получение...' : `🎁 Получить ${todayReward} CCC`}
          </button>
        ) : (
          <div style={{
            width: '100%',
            background: 'rgba(68, 255, 68, 0.2)',
            border: '2px solid #44ff44',
            borderRadius: '15px',
            padding: '15px',
            color: '#44ff44',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}>
            ✅ Награда получена! Увидимся завтра!
          </div>
        )}

        {/* Подсказка */}
        <p style={{
          color: '#666',
          fontSize: '0.8rem',
          margin: '15px 0 0 0'
        }}>
          Заходи каждый день, чтобы не сбросить прогресс!
        </p>
      </div>
    </div>
  );
};

export default DailyWelcomeModal;