/**
 * 📺 ПОВТОР БОЯ - ГАЛАКТИЧЕСКАЯ ИМПЕРИЯ
 * Визуальное воспроизведение боевого лога
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ship {
  id: number | string;
  ship_type: string;
  ship_class: string;
  tier: number;
  current_hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  speed: number;
}

interface BattleAction {
  round: number;
  attacker: {
    fleet: number;
    index: number;
    shipId: number | string;
    shipType: string;
  };
  target: {
    fleet: number;
    index: number;
    shipId: number | string;
    shipType: string;
  };
  damage: number;
  isCrit: boolean;
  blocked: number;
  targetRemainingHP: number;
  isKill: boolean;
}

interface BattleReplayProps {
  battleLog: BattleAction[];
  playerFleet: Ship[];
  enemyFleet: Ship[];
  winner: number | 'draw' | null;
  onClose: () => void;
  lang: string;
  raceColor: string;
  speed?: number; // ms между действиями
}

const CLASS_EMOJI: any = {
  frigate: '🚤',
  destroyer: '🛸',
  cruiser: '🚀',
  battleship: '🚢',
  premium: '👑',
  drones: '🤖',
  torpedoes: '🚀',
  reb: '📡',
  ai: '🧠'
};

const SHIP_NAMES: any = {
  frigate_t1: { ru: 'Лёгкий фрегат', en: 'Light Frigate' },
  frigate_t2: { ru: 'Штурмовой фрегат', en: 'Assault Frigate' },
  destroyer_t1: { ru: 'Лёгкий эсминец', en: 'Light Destroyer' },
  destroyer_t2: { ru: 'Тяжёлый эсминец', en: 'Heavy Destroyer' },
  cruiser_t1: { ru: 'Боевой крейсер', en: 'Combat Cruiser' },
  cruiser_t2: { ru: 'Тяжёлый штурмовой крейсер', en: 'Heavy Assault Cruiser' },
  battleship_t1: { ru: 'Линкор', en: 'Battleship' },
  battleship_t2: { ru: 'Дредноут', en: 'Dreadnought' }
};

const BattleReplay: React.FC<BattleReplayProps> = ({
  battleLog,
  playerFleet: initialPlayerFleet,
  enemyFleet: initialEnemyFleet,
  winner,
  onClose,
  lang,
  raceColor,
  speed = 500
}) => {
  const [currentAction, setCurrentAction] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(speed);
  const [playerFleet, setPlayerFleet] = useState(initialPlayerFleet.map(s => ({ ...s })));
  const [enemyFleet, setEnemyFleet] = useState(initialEnemyFleet.map(s => ({ ...s })));
  const [lastHit, setLastHit] = useState<{ fleet: number; index: number } | null>(null);

  // Debug: Log winner type and value
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') console.log('🔍 BattleReplay winner:', winner, 'type:', typeof winner);
    if (process.env.NODE_ENV === 'development') console.log('🔍 winner === 1:', winner === 1);
    if (process.env.NODE_ENV === 'development') console.log('🔍 winner === 2:', winner === 2);
    if (process.env.NODE_ENV === 'development') console.log('🔍 winner === "draw":', winner === "draw");
  }, [winner]);

  const t = {
    ru: {
      replay: 'Повтор боя',
      round: 'Раунд',
      damage: 'урона',
      crit: 'КРИТ!',
      blocked: 'заблок.',
      killed: 'уничтожен!',
      victory: 'ПОБЕДА!',
      defeat: 'ПОРАЖЕНИЕ',
      draw: 'НИЧЬЯ',
      close: 'Закрыть',
      play: 'Воспроизвести',
      pause: 'Пауза',
      speed: 'Скорость',
      restart: 'Сначала'
    },
    en: {
      replay: 'Battle Replay',
      round: 'Round',
      damage: 'damage',
      crit: 'CRIT!',
      blocked: 'blocked',
      killed: 'destroyed!',
      victory: 'VICTORY!',
      defeat: 'DEFEAT',
      draw: 'DRAW',
      close: 'Close',
      play: 'Play',
      pause: 'Pause',
      speed: 'Speed',
      restart: 'Restart'
    }
  };

  const text = t[lang as 'ru' | 'en'] || t.en;

  // Автовоспроизведение
  useEffect(() => {
    if (!isPlaying || currentAction >= battleLog.length) return;

    const timer = setTimeout(() => {
      const action = battleLog[currentAction];

      // Применяем урон
      if (action.target.fleet === 1) {
        setPlayerFleet(prev => prev.map((ship, i) =>
          i === action.target.index
            ? { ...ship, current_hp: action.targetRemainingHP }
            : ship
        ));
      } else {
        setEnemyFleet(prev => prev.map((ship, i) =>
          i === action.target.index
            ? { ...ship, current_hp: action.targetRemainingHP }
            : ship
        ));
      }

      // Показываем эффект удара
      setLastHit({ fleet: action.target.fleet, index: action.target.index });
      setTimeout(() => setLastHit(null), 300);

      setCurrentAction(prev => prev + 1);
    }, playbackSpeed);

    return () => clearTimeout(timer);
  }, [currentAction, isPlaying, playbackSpeed, battleLog]);

  const handleRestart = () => {
    setCurrentAction(0);
    setPlayerFleet(initialPlayerFleet.map(s => ({ ...s })));
    setEnemyFleet(initialEnemyFleet.map(s => ({ ...s })));
    setIsPlaying(true);
  };

  const toggleSpeed = () => {
    if (playbackSpeed === 500) setPlaybackSpeed(200);
    else if (playbackSpeed === 200) setPlaybackSpeed(1000);
    else setPlaybackSpeed(500);
  };

  const currentRound = currentAction > 0 ? battleLog[currentAction - 1]?.round || 1 : 1;
  const isFinished = currentAction >= battleLog.length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderBottom: `2px solid ${raceColor}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{
          color: raceColor,
          margin: 0,
          fontSize: '1.5rem',
          textShadow: `0 0 10px ${raceColor}`
        }}>
          ⚔️ {text.replay} - {text.round} {currentRound}
        </h2>

        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 68, 68, 0.8)',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 20px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {text.close}
        </button>
      </div>

      {/* Battle Arena */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '40px',
        position: 'relative'
      }}>
        {/* Player Fleet */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {playerFleet.map((ship, index) => {
            const isHit = lastHit?.fleet === 1 && lastHit?.index === index;
            const isDead = ship.current_hp === 0;
            const hpPercent = (ship.current_hp / ship.max_hp) * 100;
            const emoji = CLASS_EMOJI[ship.ship_class] || '🚀';

            return (
              <motion.div
                key={index}
                animate={{
                  scale: isHit ? [1, 1.2, 1] : 1,
                  opacity: isDead ? 0.3 : 1
                }}
                transition={{ duration: 0.3 }}
                style={{
                  background: isHit
                    ? 'rgba(255, 68, 68, 0.5)'
                    : `linear-gradient(135deg, ${raceColor}22, ${raceColor}11)`,
                  border: `2px solid ${isDead ? '#555' : raceColor}`,
                  borderRadius: '15px',
                  padding: '15px',
                  minWidth: '200px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '2rem', marginRight: '10px' }}>{emoji}</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {SHIP_NAMES[ship.ship_type]?.[lang] || ship.ship_type}
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.7rem' }}>
                      ⚔️ {ship.attack} | 🛡️ {ship.defense}
                    </div>
                  </div>
                </div>

                {/* HP Bar */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    animate={{ width: `${hpPercent}%` }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: hpPercent > 50 ? '#44ff44' : hpPercent > 20 ? '#ffaa00' : '#ff4444',
                      height: '100%',
                      borderRadius: '10px'
                    }}
                  />
                </div>
                <div style={{
                  color: '#aaa',
                  fontSize: '0.7rem',
                  marginTop: '5px',
                  textAlign: 'center'
                }}>
                  {ship.current_hp} / {ship.max_hp} HP
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* VS Divider */}
        <div style={{
          fontSize: '3rem',
          color: raceColor,
          fontWeight: 'bold',
          textShadow: `0 0 20px ${raceColor}`
        }}>
          ⚔️
        </div>

        {/* Enemy Fleet */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {enemyFleet.map((ship, index) => {
            const isHit = lastHit?.fleet === 2 && lastHit?.index === index;
            const isDead = ship.current_hp === 0;
            const hpPercent = (ship.current_hp / ship.max_hp) * 100;
            const emoji = CLASS_EMOJI[ship.ship_class] || '🚀';

            return (
              <motion.div
                key={index}
                animate={{
                  scale: isHit ? [1, 1.2, 1] : 1,
                  opacity: isDead ? 0.3 : 1
                }}
                transition={{ duration: 0.3 }}
                style={{
                  background: isHit
                    ? 'rgba(255, 68, 68, 0.5)'
                    : 'linear-gradient(135deg, rgba(255, 68, 68, 0.2), rgba(255, 68, 68, 0.1))',
                  border: `2px solid ${isDead ? '#555' : '#ff4444'}`,
                  borderRadius: '15px',
                  padding: '15px',
                  minWidth: '200px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '2rem', marginRight: '10px' }}>{emoji}</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {SHIP_NAMES[ship.ship_type]?.[lang] || ship.ship_type}
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.7rem' }}>
                      ⚔️ {ship.attack} | 🛡️ {ship.defense}
                    </div>
                  </div>
                </div>

                {/* HP Bar */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    animate={{ width: `${hpPercent}%` }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: hpPercent > 50 ? '#44ff44' : hpPercent > 20 ? '#ffaa00' : '#ff4444',
                      height: '100%',
                      borderRadius: '10px'
                    }}
                  />
                </div>
                <div style={{
                  color: '#aaa',
                  fontSize: '0.7rem',
                  marginTop: '5px',
                  textAlign: 'center'
                }}>
                  {ship.current_hp} / {ship.max_hp} HP
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Battle Log */}
      {currentAction > 0 && battleLog[currentAction - 1] && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0, 0, 0, 0.9)',
              border: '2px solid #ffaa00',
              borderRadius: '15px',
              padding: '20px 40px',
              textAlign: 'center',
              zIndex: 100
            }}
          >
            <div style={{
              color: battleLog[currentAction - 1].isCrit ? '#ff4444' : '#ffaa00',
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              {battleLog[currentAction - 1].isCrit && `${text.crit} `}
              {battleLog[currentAction - 1].damage} {text.damage}
            </div>
            {battleLog[currentAction - 1].isKill && (
              <div style={{ color: '#ff4444', fontSize: '1.2rem', fontWeight: 'bold' }}>
                💥 {text.killed}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Result Overlay */}
      {isFinished && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: winner === 1
              ? `linear-gradient(135deg, ${raceColor}44, ${raceColor}22)`
              : 'linear-gradient(135deg, rgba(255, 68, 68, 0.4), rgba(255, 68, 68, 0.2))',
            border: `3px solid ${winner === 1 ? raceColor : '#ff4444'}`,
            borderRadius: '20px',
            padding: '40px 60px',
            textAlign: 'center',
            zIndex: 200
          }}
        >
          <div style={{
            fontSize: '3rem',
            marginBottom: '20px'
          }}>
            {winner === 1 ? '🏆' : winner === 2 ? '💀' : '🤝'}
          </div>
          <h2 style={{
            color: winner === 1 ? raceColor : '#ff4444',
            fontSize: '2.5rem',
            margin: '0 0 20px 0',
            textShadow: winner === 1 ? `0 0 20px ${raceColor}` : '0 0 20px #ff4444'
          }}>
            {winner === 1 ? text.victory : winner === 2 ? text.defeat : text.draw}
          </h2>
        </motion.div>
      )}

      {/* Controls */}
      <div style={{
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'center',
        gap: '15px'
      }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={isFinished}
          style={{
            background: raceColor,
            border: 'none',
            borderRadius: '10px',
            padding: '10px 25px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: isFinished ? 'not-allowed' : 'pointer',
            opacity: isFinished ? 0.5 : 1
          }}
        >
          {isPlaying ? '⏸️ ' : '▶️ '} {isPlaying ? text.pause : text.play}
        </button>

        <button
          onClick={toggleSpeed}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            padding: '10px 25px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ⚡ {text.speed}: {playbackSpeed === 200 ? '2x' : playbackSpeed === 500 ? '1x' : '0.5x'}
        </button>

        <button
          onClick={handleRestart}
          style={{
            background: 'rgba(255, 170, 0, 0.3)',
            border: '1px solid #ffaa00',
            borderRadius: '10px',
            padding: '10px 25px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🔄 {text.restart}
        </button>
      </div>
    </div>
  );
};

export default BattleReplay;
