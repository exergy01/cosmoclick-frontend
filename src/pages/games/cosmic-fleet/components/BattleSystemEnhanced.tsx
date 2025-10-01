import React, { useState, useEffect, useRef } from 'react';
import { Ship } from '../types/ships';
import { triggerSuccessFeedback } from '../../../../utils/feedbackUtils';
import './BattleSystem.css';

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

const BattleSystemEnhanced: React.FC<BattleSystemProps> = ({
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

  const [showLaser, setShowLaser] = useState(false);
  const [laserDirection, setLaserDirection] = useState<'toEnemy' | 'toPlayer'>('toEnemy');
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPosition, setExplosionPosition] = useState({ x: 0, y: 0 });

  const playerRef = useRef<HTMLDivElement>(null);
  const enemyRef = useRef<HTMLDivElement>(null);

  const addLogMessage = (message: string) => {
    setBattleLog(prev => [...prev, message]);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const triggerLaser = async (direction: 'toEnemy' | 'toPlayer') => {
    setLaserDirection(direction);
    setShowLaser(true);
    await sleep(500);
    setShowLaser(false);
  };

  const triggerExplosion = async (targetRef: React.RefObject<HTMLDivElement | null>) => {
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setExplosionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      setShowExplosion(true);
      await sleep(800);
      setShowExplosion(false);
    }
  };

  const playerAttack = async () => {
    if (battlePhase !== 'fighting' || turn !== 'player' || isAnimating) return;

    setIsAnimating(true);
    await triggerSuccessFeedback();

    // Показываем лазер
    await triggerLaser('toEnemy');

    const damage = Math.floor(playerShip.damage * (0.8 + Math.random() * 0.4));
    const newEnemyHealth = Math.max(0, enemyHealth - damage);

    setEnemyHealth(newEnemyHealth);
    addLogMessage(`${playerShip.name} атакует ${enemy.name} на ${damage} урона!`);

    // Показываем взрыв при попадании
    await triggerExplosion(enemyRef);

    await sleep(300);

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

    // Показываем лазер врага
    await triggerLaser('toPlayer');

    const damage = Math.floor(enemy.damage * (0.7 + Math.random() * 0.6));
    const newPlayerHealth = Math.max(0, playerHealth - damage);

    setPlayerHealth(newPlayerHealth);
    addLogMessage(`${enemy.name} атакует ${playerShip.name} на ${damage} урона!`);

    // Показываем взрыв
    await triggerExplosion(playerRef);

    await sleep(300);

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

    // Запускаем автоматический бой
    setTimeout(() => {
      autoBattle();
    }, 1000);
  };

  const autoBattle = async () => {
    while (battlePhase === 'fighting' && playerHealth > 0 && enemyHealth > 0) {
      if (turn === 'player') {
        await playerAttack();
      }
      await sleep(500);
    }
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
    <div className="battle-overlay">
      <div className="battle-screen">
        {/* Звёздный фон */}
        <div className="stars-background" />

        {/* Лазерный луч */}
        {showLaser && (
          <div className={`laser-beam ${laserDirection === 'toEnemy' ? 'to-enemy' : 'to-player'}`} />
        )}

        {/* Взрыв */}
        {showExplosion && (
          <div
            className="explosion-effect"
            style={{
              left: explosionPosition.x,
              top: explosionPosition.y
            }}
          />
        )}

        <div className="battle-container">
          {/* Закрыть */}
          <button
            onClick={onClose}
            className="close-button"
          >
            ✕
          </button>

          {/* HUD сверху */}
          <div className="battle-hud">
            {/* Игрок слева */}
            <div className="player-hud">
              <div ref={playerRef} className="hud-ship-icon">🚀</div>
              <div className="hud-info">
                <div className="hud-name">{playerShip.name}</div>
                <div className="hud-health-bar">
                  <div
                    className="hud-health-fill"
                    style={{ width: getHealthBarWidth(playerHealth, playerShip.maxHealth) }}
                  />
                </div>
                <div className="hud-health-text">
                  {playerHealth} / {playerShip.maxHealth} HP
                </div>
              </div>
            </div>

            {/* Враг справа */}
            <div className="enemy-hud">
              <div className="hud-info" style={{ textAlign: 'right' }}>
                <div className="hud-name">{enemy.name}</div>
                <div className="hud-health-bar">
                  <div
                    className="hud-health-fill"
                    style={{ width: getHealthBarWidth(enemyHealth, enemy.maxHealth) }}
                  />
                </div>
                <div className="hud-health-text">
                  {enemyHealth} / {enemy.maxHealth} HP
                </div>
              </div>
              <div ref={enemyRef} className="hud-ship-icon">{enemy.emoji}</div>
            </div>
          </div>

          {/* Кнопка старта по центру */}
          {battlePhase === 'ready' && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20
            }}>
              <button onClick={startBattle} className="battle-button start-button">
                🚀 Начать бой
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleSystemEnhanced;
