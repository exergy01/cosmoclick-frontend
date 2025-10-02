import React, { useState, useEffect } from 'react';
import { Ship } from '../types/ships';
import { triggerSuccessFeedback } from '../../../../utils/feedbackUtils';

interface BattleSystemProps {
  playerShip: Ship;
  onBattleComplete: (result: BattleResult) => void;
  onClose: () => void;
}

interface BattleResult {
  victory: boolean;
  experienceGained: number;
  luminiosReward: number;
  damageReceived: number;
}

interface Enemy {
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  reward: number;
  emoji: string;
}

const ENEMIES: Enemy[] = [
  {
    name: 'Астероидный пират',
    health: 80,
    maxHealth: 80,
    damage: 15,
    reward: 25,
    emoji: '🏴‍☠️'
  },
  {
    name: 'Дрон-охранник',
    health: 120,
    maxHealth: 120,
    damage: 22,
    reward: 40,
    emoji: '🤖'
  },
  {
    name: 'Космический рейдер',
    health: 180,
    maxHealth: 180,
    damage: 35,
    reward: 75,
    emoji: '👾'
  },
  {
    name: 'Военный корвет',
    health: 250,
    maxHealth: 250,
    damage: 45,
    reward: 120,
    emoji: '🚁'
  }
];

const BattleSystem: React.FC<BattleSystemProps> = ({
  playerShip,
  onBattleComplete,
  onClose
}) => {
  const [enemy, setEnemy] = useState<Enemy>(() => {
    const randomEnemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    return { ...randomEnemy };
  });

  const [playerHealth, setPlayerHealth] = useState(playerShip.health);
  const [enemyHealth, setEnemyHealth] = useState(enemy.health);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battlePhase, setBattlePhase] = useState<'ready' | 'fighting' | 'finished'>('ready');
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [isAnimating, setIsAnimating] = useState(false);

  const addLogMessage = (message: string) => {
    setBattleLog(prev => [...prev, message]);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const playerAttack = async () => {
    if (battlePhase !== 'fighting' || turn !== 'player' || isAnimating) return;

    setIsAnimating(true);
    await triggerSuccessFeedback();

    const damage = Math.floor(playerShip.damage * (0.8 + Math.random() * 0.4));
    const newEnemyHealth = Math.max(0, enemyHealth - damage);

    setEnemyHealth(newEnemyHealth);
    addLogMessage(`${playerShip.name} атакует ${enemy.name} на ${damage} урона!`);

    await sleep(800);

    if (newEnemyHealth <= 0) {
      setBattlePhase('finished');
      const experienceGained = Math.floor(enemy.maxHealth / 10);
      const luminiosReward = enemy.reward;

      addLogMessage(`🎉 Победа! Враг уничтожен!`);
      addLogMessage(`+${experienceGained} опыта, +${luminiosReward} Luminios`);

      await sleep(1000);
      onBattleComplete({
        victory: true,
        experienceGained,
        luminiosReward,
        damageReceived: playerShip.health - playerHealth
      });
    } else {
      setTurn('enemy');
    }

    setIsAnimating(false);
  };

  const enemyAttack = async () => {
    if (battlePhase !== 'fighting' || turn !== 'enemy') return;

    await sleep(1000);

    const damage = Math.floor(enemy.damage * (0.7 + Math.random() * 0.6));
    const newPlayerHealth = Math.max(0, playerHealth - damage);

    setPlayerHealth(newPlayerHealth);
    addLogMessage(`${enemy.name} атакует ${playerShip.name} на ${damage} урона!`);

    await sleep(800);

    if (newPlayerHealth <= 0) {
      setBattlePhase('finished');
      addLogMessage(`💀 Поражение! Корабль уничтожен!`);

      await sleep(1000);
      onBattleComplete({
        victory: false,
        experienceGained: 0,
        luminiosReward: 0,
        damageReceived: playerShip.health
      });
    } else {
      setTurn('player');
    }
  };

  useEffect(() => {
    if (turn === 'enemy' && battlePhase === 'fighting') {
      enemyAttack();
    }
  }, [turn]);

  const startBattle = async () => {
    setBattlePhase('fighting');
    addLogMessage(`🚀 Бой начинается! ${playerShip.name} vs ${enemy.name}`);
    await triggerSuccessFeedback();
  };

  const getHealthColor = (health: number, maxHealth: number): string => {
    const ratio = health / maxHealth;
    if (ratio > 0.7) return '#44ff44';
    if (ratio > 0.3) return '#ffaa00';
    return '#ff4444';
  };

  const getHealthBarWidth = (health: number, maxHealth: number): string => {
    return `${(health / maxHealth) * 100}%`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
        maxWidth: '800px',
        width: '100%',
        border: '2px solid #ff6600',
        boxShadow: '0 0 30px rgba(255, 102, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{
            color: '#ff6600',
            margin: 0,
            fontSize: '1.8rem',
            textShadow: '0 0 10px #ff6600'
          }}>
            ⚔️ Космический бой
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 68, 68, 0.2)',
              border: '1px solid #ff4444',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#ff4444',
              fontSize: '1.2rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Статусы кораблей */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Игрок */}
          <div style={{
            background: 'rgba(0, 240, 255, 0.1)',
            padding: '20px',
            borderRadius: '15px',
            border: '2px solid #00f0ff',
            textAlign: 'center',
            transform: turn === 'player' && isAnimating ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🚀</div>
            <h3 style={{ color: '#00f0ff', margin: '0 0 10px 0' }}>
              {playerShip.name}
            </h3>
            <div style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '5px'
              }}>
                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                  Прочность
                </span>
                <span style={{
                  color: getHealthColor(playerHealth, playerShip.maxHealth),
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  {playerHealth} / {playerShip.maxHealth}
                </span>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                height: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: getHealthColor(playerHealth, playerShip.maxHealth),
                  height: '100%',
                  width: getHealthBarWidth(playerHealth, playerShip.maxHealth),
                  borderRadius: '10px',
                  transition: 'all 0.5s ease'
                }} />
              </div>
            </div>
            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
              ⚔️ Урон: {playerShip.damage}
            </div>
          </div>

          {/* Враг */}
          <div style={{
            background: 'rgba(255, 68, 68, 0.1)',
            padding: '20px',
            borderRadius: '15px',
            border: '2px solid #ff4444',
            textAlign: 'center',
            transform: turn === 'enemy' ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{enemy.emoji}</div>
            <h3 style={{ color: '#ff4444', margin: '0 0 10px 0' }}>
              {enemy.name}
            </h3>
            <div style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '5px'
              }}>
                <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                  Прочность
                </span>
                <span style={{
                  color: getHealthColor(enemyHealth, enemy.maxHealth),
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  {enemyHealth} / {enemy.maxHealth}
                </span>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                height: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: getHealthColor(enemyHealth, enemy.maxHealth),
                  height: '100%',
                  width: getHealthBarWidth(enemyHealth, enemy.maxHealth),
                  borderRadius: '10px',
                  transition: 'all 0.5s ease'
                }} />
              </div>
            </div>
            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
              ⚔️ Урон: {enemy.damage}
            </div>
          </div>
        </div>

        {/* Лог боя */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          height: '150px',
          overflowY: 'auto',
          border: '1px solid #444'
        }}>
          {battleLog.length === 0 ? (
            <div style={{ color: '#aaa', textAlign: 'center', paddingTop: '50px' }}>
              Готов к бою! Нажмите "Начать бой" для старта.
            </div>
          ) : (
            battleLog.map((message, index) => (
              <div
                key={index}
                style={{
                  color: '#fff',
                  marginBottom: '8px',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  opacity: index === battleLog.length - 1 ? 1 : 0.8
                }}
              >
                {message}
              </div>
            ))
          )}
        </div>

        {/* Кнопки управления */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px'
        }}>
          {battlePhase === 'ready' && (
            <button
              onClick={startBattle}
              style={{
                background: 'linear-gradient(135deg, #44ff44, #00aa00)',
                border: 'none',
                borderRadius: '15px',
                padding: '15px 30px',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 5px 15px rgba(68, 255, 68, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              🚀 Начать бой
            </button>
          )}

          {battlePhase === 'fighting' && turn === 'player' && (
            <button
              onClick={playerAttack}
              disabled={isAnimating}
              style={{
                background: isAnimating
                  ? 'rgba(255, 68, 68, 0.3)'
                  : 'linear-gradient(135deg, #ff4444, #cc0000)',
                border: 'none',
                borderRadius: '15px',
                padding: '15px 30px',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: isAnimating ? 'wait' : 'pointer',
                boxShadow: isAnimating ? 'none' : '0 5px 15px rgba(255, 68, 68, 0.4)',
                transition: 'all 0.3s ease',
                transform: isAnimating ? 'scale(0.95)' : 'scale(1)'
              }}
            >
              {isAnimating ? '⚔️ Атакуем...' : '⚔️ Атаковать'}
            </button>
          )}

          {battlePhase === 'fighting' && turn === 'enemy' && (
            <div style={{
              padding: '15px 30px',
              color: '#ffaa00',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              🤖 Ход противника...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleSystem;