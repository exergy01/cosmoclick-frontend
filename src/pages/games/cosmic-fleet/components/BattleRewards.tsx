import React, { useState, useEffect } from 'react';

interface BattleRewardsProps {
  result: 'win' | 'loss';
  luminiosReward: number;
  stats: {
    playerDamageDealt: number;
    playerDamageReceived: number;
    playerShipsLost: number;
    isPerfectWin: boolean;
  };
  rounds: number;
  onClose: () => void;
  onRetry: () => void;
}

const BattleRewards: React.FC<BattleRewardsProps> = ({
  result,
  luminiosReward,
  stats,
  rounds,
  onClose,
  onRetry
}) => {
  const [animatedReward, setAnimatedReward] = useState(0);
  const [showStats, setShowStats] = useState(false);

  const isWin = result === 'win';

  // Анимация счётчика наград
  useEffect(() => {
    if (luminiosReward > 0) {
      const duration = 1500; // 1.5 секунды
      const steps = 60;
      const increment = luminiosReward / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= luminiosReward) {
          setAnimatedReward(luminiosReward);
          clearInterval(timer);
        } else {
          setAnimatedReward(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [luminiosReward]);

  // Показать статистику после анимации
  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: '30px',
        padding: '40px',
        maxWidth: '600px',
        width: '90%',
        border: `3px solid ${isWin ? '#44ff44' : '#ff4444'}`,
        boxShadow: `0 0 40px ${isWin ? 'rgba(68, 255, 68, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
        animation: 'scaleIn 0.5s ease'
      }}>
        {/* Заголовок результата */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '15px',
            animation: 'bounce 0.8s ease'
          }}>
            {isWin ? '🎉' : '💥'}
          </div>
          <h1 style={{
            color: isWin ? '#44ff44' : '#ff4444',
            fontSize: '2.5rem',
            margin: '0 0 10px 0',
            textShadow: `0 0 20px ${isWin ? '#44ff44' : '#ff4444'}`,
            animation: 'glow 2s ease-in-out infinite'
          }}>
            {isWin ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
          </h1>
          {stats.isPerfectWin && (
            <div style={{
              color: '#ffd700',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textShadow: '0 0 15px #ffd700',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              ⭐ БЕЗУПРЕЧНАЯ ПОБЕДА ⭐
            </div>
          )}
        </div>

        {/* Награда Luminios */}
        {luminiosReward > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.2), rgba(255, 136, 0, 0.1))',
            border: '2px solid #ff6600',
            borderRadius: '20px',
            padding: '25px',
            marginBottom: '25px',
            textAlign: 'center',
            animation: 'slideUp 0.6s ease'
          }}>
            <div style={{ color: '#ff6600', fontSize: '1rem', marginBottom: '10px' }}>
              💎 Получено Luminios
            </div>
            <div style={{
              color: '#fff',
              fontSize: '3rem',
              fontWeight: 'bold',
              textShadow: '0 0 20px #ff6600',
              animation: animatedReward === luminiosReward ? 'flash 0.5s ease' : 'none'
            }}>
              +{animatedReward.toLocaleString()}
            </div>
          </div>
        )}

        {/* Статистика боя */}
        {showStats && (
          <div style={{
            animation: 'fadeInUp 0.5s ease',
            marginBottom: '25px'
          }}>
            <h3 style={{
              color: '#aaa',
              fontSize: '1.1rem',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              📊 Статистика боя
            </h3>

            <div style={{
              display: 'grid',
              gap: '12px'
            }}>
              {/* Раунды */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px 20px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#aaa' }}>⏱️ Раундов</span>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {rounds}
                </span>
              </div>

              {/* Урон нанесён */}
              <div style={{
                background: 'rgba(68, 255, 68, 0.1)',
                padding: '12px 20px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(68, 255, 68, 0.3)'
              }}>
                <span style={{ color: '#44ff44' }}>⚔️ Урон нанесён</span>
                <span style={{ color: '#44ff44', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {stats.playerDamageDealt.toLocaleString()}
                </span>
              </div>

              {/* Урон получен */}
              <div style={{
                background: 'rgba(255, 68, 68, 0.1)',
                padding: '12px 20px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(255, 68, 68, 0.3)'
              }}>
                <span style={{ color: '#ff4444' }}>🛡️ Урон получен</span>
                <span style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {stats.playerDamageReceived.toLocaleString()}
                </span>
              </div>

              {/* Корабли потеряны */}
              <div style={{
                background: 'rgba(255, 136, 0, 0.1)',
                padding: '12px 20px',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(255, 136, 0, 0.3)'
              }}>
                <span style={{ color: '#ff8800' }}>💀 Корабли потеряны</span>
                <span style={{ color: '#ff8800', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {stats.playerShipsLost}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginTop: '30px'
        }}>
          <button
            onClick={onRetry}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #ff6600, #ff8800)',
              border: '2px solid #ff6600',
              borderRadius: '15px',
              padding: '15px',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 5px 15px rgba(255, 102, 0, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 102, 0, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 5px 15px rgba(255, 102, 0, 0.4)';
            }}
          >
            🔄 Ещё бой
          </button>

          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #8a2be2, #6a0dad)',
              border: '2px solid #8a2be2',
              borderRadius: '15px',
              padding: '15px',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 5px 15px rgba(138, 43, 226, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(138, 43, 226, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 5px 15px rgba(138, 43, 226, 0.4)';
            }}
          >
            ✅ Вернуться
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px currentColor; }
          50% { text-shadow: 0 0 40px currentColor, 0 0 60px currentColor; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }

        @keyframes flash {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default BattleRewards;
