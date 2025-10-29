import React, { useState, useEffect, useRef } from 'react';
import './BattleScreenElite.css';

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
  isKill: boolean;
  targetRemainingHP: number;
}

interface ShipData {
  id: number | string;
  ship_type: string;
  current_hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  speed: number;
  destroyed: boolean;
}

interface BattleScreenEliteProps {
  battleLog: BattleAction[];
  playerFleet: any[];
  enemyFleet: any[];
  winner: number;
  reward: number;
  onBattleEnd: () => void;
}

// Эмодзи для разных типов кораблей
const SHIP_EMOJIS: Record<string, string> = {
  frigate: '🚀',
  destroyer: '✈️',
  cruiser: '🛸',
  battleship: '🚁',
  default: '🛩️',
};

const getShipEmoji = (shipType: string): string => {
  const type = shipType.split('_')[0].toLowerCase();
  return SHIP_EMOJIS[type] || SHIP_EMOJIS.default;
};

const BattleScreenElite: React.FC<BattleScreenEliteProps> = ({
  battleLog,
  playerFleet,
  enemyFleet,
  winner,
  reward,
  onBattleEnd,
}) => {
  const [playerShips, setPlayerShips] = useState<ShipData[]>([]);
  const [enemyShips, setEnemyShips] = useState<ShipData[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [battleActive, setBattleActive] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [activeLasers, setActiveLasers] = useState<any[]>([]);

  // Группируем действия по раундам
  const roundsData = useRef<BattleAction[][]>([]);

  useEffect(() => {
    // Группируем battleLog по раундам
    const grouped: Record<number, BattleAction[]> = {};
    battleLog.forEach(action => {
      if (!grouped[action.round]) {
        grouped[action.round] = [];
      }
      grouped[action.round].push(action);
    });

    roundsData.current = Object.values(grouped);

    // Инициализация данных кораблей
    setPlayerShips(
      playerFleet.map(s => ({
        id: s.id,
        ship_type: s.ship_type,
        current_hp: s.current_hp,
        max_hp: s.max_hp,
        attack: s.attack,
        defense: s.defense,
        speed: s.speed,
        destroyed: s.current_hp <= 0,
      }))
    );

    setEnemyShips(
      enemyFleet.map(s => ({
        id: s.id,
        ship_type: s.ship_type,
        current_hp: s.current_hp,
        max_hp: s.max_hp,
        attack: s.attack,
        defense: s.defense,
        speed: s.speed,
        destroyed: s.current_hp <= 0,
      }))
    );
  }, [battleLog, playerFleet, enemyFleet]);

  // Воспроизведение раундов
  useEffect(() => {
    if (!battleActive || currentRound >= roundsData.current.length) {
      if (currentRound >= roundsData.current.length && battleActive) {
        setBattleActive(false);
        setTimeout(() => setShowResult(true), 1500);
      }
      return;
    }

    const roundActions = roundsData.current[currentRound];

    const timer = setTimeout(() => {
      // Создаем ВСЕ лазеры одновременно для этого раунда
      const newLasers = roundActions.map((action, idx) => ({
        id: `${currentRound}-${idx}`,
        fromFleet: action.attacker.fleet,
        fromIndex: action.attacker.index,
        toFleet: action.target.fleet,
        toIndex: action.target.index,
        isCrit: action.isCrit,
      }));

      setActiveLasers(newLasers);

      // Удаляем лазеры через 400мс
      setTimeout(() => {
        setActiveLasers([]);
      }, 400);

      // Применяем весь урон одновременно через 200мс (когда лазеры долетят)
      setTimeout(() => {
        roundActions.forEach(action => {
          if (action.target.fleet === 1) {
            setPlayerShips(prev =>
              prev.map(ship =>
                ship.id === action.target.shipId
                  ? {
                      ...ship,
                      current_hp: action.targetRemainingHP,
                      destroyed: action.isKill,
                    }
                  : ship
              )
            );
          } else {
            setEnemyShips(prev =>
              prev.map(ship =>
                ship.id === action.target.shipId
                  ? {
                      ...ship,
                      current_hp: action.targetRemainingHP,
                      destroyed: action.isKill,
                    }
                  : ship
              )
            );
          }
        });
      }, 200);

      setCurrentRound(prev => prev + 1);
    }, 1200); // 1.2 сек на раунд

    return () => clearTimeout(timer);
  }, [battleActive, currentRound]);

  // Получить позицию корабля
  const getShipPosition = (fleet: ShipData[], index: number, isPlayer: boolean) => {
    const shipCount = fleet.length;
    const spacing = 100 / (shipCount + 1);
    const left = spacing * (index + 1);
    const top = isPlayer ? 70 : 20;

    return { left: `${left}%`, top: `${top}%` };
  };

  return (
    <div className="elite-battle-container">
      {/* Космический фон */}
      <div className="space-background">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Корабли игрока */}
      <div className="fleet player-fleet">
        {playerShips.map((ship, index) => {
          const pos = getShipPosition(playerShips, index, true);
          return (
            <div
              key={ship.id}
              className={`ship ${ship.destroyed ? 'destroyed' : ''}`}
              style={{ left: pos.left, top: pos.top }}
              data-ship-id={ship.id}
              data-fleet="1"
              data-index={index}
            >
              <div className="ship-emoji">{getShipEmoji(ship.ship_type)}</div>
              <div className="ship-hp-bar">
                <div
                  className="ship-hp-fill"
                  style={{
                    width: `${(ship.current_hp / ship.max_hp) * 100}%`,
                    backgroundColor: ship.current_hp / ship.max_hp > 0.5 ? '#00ff88' : ship.current_hp / ship.max_hp > 0.25 ? '#ffaa00' : '#ff3333',
                  }}
                />
              </div>
              <div className="ship-hp-text">
                {ship.current_hp} / {ship.max_hp}
              </div>
            </div>
          );
        })}
      </div>

      {/* Корабли врага */}
      <div className="fleet enemy-fleet">
        {enemyShips.map((ship, index) => {
          const pos = getShipPosition(enemyShips, index, false);
          return (
            <div
              key={ship.id}
              className={`ship ${ship.destroyed ? 'destroyed' : ''}`}
              style={{ left: pos.left, top: pos.top }}
              data-ship-id={ship.id}
              data-fleet="2"
              data-index={index}
            >
              <div className="ship-emoji enemy">{getShipEmoji(ship.ship_type)}</div>
              <div className="ship-hp-bar">
                <div
                  className="ship-hp-fill"
                  style={{
                    width: `${(ship.current_hp / ship.max_hp) * 100}%`,
                    backgroundColor: ship.current_hp / ship.max_hp > 0.5 ? '#00ff88' : ship.current_hp / ship.max_hp > 0.25 ? '#ffaa00' : '#ff3333',
                  }}
                />
              </div>
              <div className="ship-hp-text">
                {ship.current_hp} / {ship.max_hp}
              </div>
            </div>
          );
        })}
      </div>

      {/* Лазеры */}
      <svg className="lasers-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
        {activeLasers.map(laser => {
          const fromEl = document.querySelector(
            `[data-fleet="${laser.fromFleet}"][data-index="${laser.fromIndex}"]`
          ) as HTMLElement;
          const toEl = document.querySelector(
            `[data-fleet="${laser.toFleet}"][data-index="${laser.toIndex}"]`
          ) as HTMLElement;

          if (!fromEl || !toEl) return null;

          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();

          const fromX = fromRect.left + fromRect.width / 2;
          const fromY = fromRect.top + fromRect.height / 2;
          const toX = toRect.left + toRect.width / 2;
          const toY = toRect.top + toRect.height / 2;

          return (
            <line
              key={laser.id}
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke={laser.isCrit ? '#ff00ff' : laser.fromFleet === 1 ? '#00ffff' : '#ff0000'}
              strokeWidth={laser.isCrit ? 4 : 2}
              className="laser-beam"
            />
          );
        })}
      </svg>

      {/* HUD */}
      <div className="elite-hud">
        <div className="elite-hud-top">
          <div className="elite-status">
            <div className="status-line">⚔️ GALACTIC BATTLE</div>
            <div className="status-line">
              ROUND: {currentRound + 1} / {roundsData.current.length}
            </div>
            <div className="status-line">
              🔵 PLAYER: {playerShips.filter(s => !s.destroyed).length} / {playerShips.length}
            </div>
            <div className="status-line">
              🔴 ENEMY: {enemyShips.filter(s => !s.destroyed).length} / {enemyShips.length}
            </div>
          </div>
        </div>
      </div>

      {/* Результат боя */}
      {showResult && (
        <div className="elite-result-overlay">
          <div className="elite-result-box">
            <div className="elite-result-title">
              {winner === 1 ? '🏆 VICTORY 🏆' : '💀 DEFEAT 💀'}
            </div>
            <div className="elite-result-reward">REWARD: {reward} CS</div>
            <button className="elite-result-btn" onClick={onBattleEnd}>
              ← RETURN TO BASE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleScreenElite;
