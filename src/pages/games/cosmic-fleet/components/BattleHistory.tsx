import React, { useState, useEffect } from 'react';

interface BattleHistoryItem {
  battle_id: number;
  battle_type: string;
  bot_difficulty: string;
  result: 'win' | 'loss';
  rounds_count: number;
  damage_dealt: number;
  damage_received: number;
  ships_lost: number;
  is_perfect_win: boolean;
  reward_luminios: number;
  created_at: string;
}

interface BattleHistoryProps {
  telegramId: number;
  onReplay: (battleId: number) => void;
}

const BattleHistory: React.FC<BattleHistoryProps> = ({ telegramId, onReplay }) => {
  const [battles, setBattles] = useState<BattleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBattleHistory();
  }, [telegramId]);

  const loadBattleHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/cosmic-fleet/battle/history/${telegramId}?limit=20`
      );

      if (!response.ok) {
        throw new Error('Failed to load battle history');
      }

      const data = await response.json();
      setBattles(data.battles || []);
    } catch (err: any) {
      console.error('Error loading battle history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      easy: '🟢 Легкий',
      medium: '🟡 Средний',
      hard: '🔴 Сложный',
      adaptive: '🔵 Адаптивный'
    };
    return labels[difficulty] || difficulty;
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#00f0ff', fontSize: '1.2rem' }}>⏳ Загрузка истории боёв...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'rgba(255, 0, 0, 0.1)',
        border: '2px solid #ff4444',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#ff4444', fontSize: '1.2rem' }}>❌ Ошибка загрузки: {error}</div>
      </div>
    );
  }

  if (battles.length === 0) {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '20px',
        padding: '40px',
        border: '2px solid #444',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚔️</div>
        <h3 style={{ color: '#fff', marginBottom: '15px' }}>
          История боёв пуста
        </h3>
        <p style={{ color: '#aaa', lineHeight: '1.6' }}>
          Проведите свой первый бой и здесь появится запись!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '20px',
      padding: '25px',
      border: '2px solid #00f0ff',
      boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '2rem', marginRight: '15px' }}>📜</div>
        <div>
          <h3 style={{
            color: '#00f0ff',
            margin: 0,
            fontSize: '1.4rem',
            textShadow: '0 0 10px #00f0ff'
          }}>
            История боёв
          </h3>
          <p style={{
            color: '#aaa',
            margin: '5px 0 0 0',
            fontSize: '0.9rem'
          }}>
            {battles.length} боёв в истории
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {battles.map(battle => {
          const isWin = battle.result === 'win';
          const resultColor = isWin ? '#44ff44' : '#ff4444';
          const resultIcon = isWin ? '✓' : '✗';

          return (
            <div
              key={battle.battle_id}
              style={{
                background: isWin
                  ? 'linear-gradient(135deg, rgba(68, 255, 68, 0.1), rgba(68, 255, 68, 0.05))'
                  : 'linear-gradient(135deg, rgba(255, 68, 68, 0.1), rgba(255, 68, 68, 0.05))',
                border: `2px solid ${resultColor}`,
                borderRadius: '15px',
                padding: '20px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      background: resultColor,
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 'bold',
                      marginRight: '10px'
                    }}>
                      {resultIcon}
                    </span>
                    <h4 style={{
                      color: '#fff',
                      margin: 0,
                      fontSize: '1.2rem'
                    }}>
                      {isWin ? 'Победа' : 'Поражение'}
                      {battle.is_perfect_win && ' 🏆'}
                    </h4>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap',
                    marginBottom: '8px'
                  }}>
                    <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                      {getDifficultyLabel(battle.bot_difficulty)}
                    </span>
                    <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                      ⏱️ {battle.rounds_count} раундов
                    </span>
                    <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                      💀 {battle.ships_lost} потеряно
                    </span>
                  </div>

                  <div style={{ color: '#888', fontSize: '0.8rem' }}>
                    {formatDate(battle.created_at)}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '8px'
                }}>
                  <div style={{
                    background: 'rgba(255, 170, 0, 0.2)',
                    border: '1px solid #ffaa00',
                    borderRadius: '10px',
                    padding: '8px 15px',
                    color: '#ffaa00',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    +{battle.reward_luminios} 💎
                  </div>

                  <button
                    onClick={() => onReplay(battle.battle_id)}
                    style={{
                      background: 'linear-gradient(135deg, #00f0ff, #0088ff)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 3px 10px rgba(0, 240, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 240, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 240, 255, 0.3)';
                    }}
                  >
                    🎬 Просмотреть
                  </button>
                </div>
              </div>

              {/* Статистика */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '10px',
                paddingTop: '15px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff6666', fontSize: '0.8rem' }}>⚔️ Нанесено урона</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{battle.damage_dealt}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ffaa66', fontSize: '0.8rem' }}>🛡️ Получено урона</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{battle.damage_received}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BattleHistory;
