import React, { useState, useEffect } from 'react';
import './BattleSystemCinematic.css';

interface Ship {
  id: number;
  ship_type: string;
  current_hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  speed: number;
  destroyed: boolean;
  position?: { x: number; y: number; z: number };
  velocity?: { x: number; y: number };
}

interface BattleScreenCinematicProps {
  battleLog: any[];
  playerFleet: any[];
  enemyFleet: any[];
  winner: number;
  reward: number;
  onBattleEnd: () => void;
}

const BattleScreenCinematic: React.FC<BattleScreenCinematicProps> = ({
  battleLog,
  playerFleet,
  enemyFleet,
  winner,
  reward,
  onBattleEnd
}) => {
  const [playerShips, setPlayerShips] = useState<Ship[]>([]);
  const [enemyShips, setEnemyShips] = useState<Ship[]>([]);
  const [battleActive, setBattleActive] = useState(false);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [cameraFocus, setCameraFocus] = useState<{x: number, y: number} | null>(null);
  const [activeShot, setActiveShot] = useState<{from: number, to: number, isCrit: boolean} | null>(null);
  const [slowMotion, setSlowMotion] = useState(false);

  // Инициализация флотов с 3D позициями
  useEffect(() => {
    const initShips = (fleet: any[], isPlayer: boolean): Ship[] => {
      return fleet.map((ship, index) => {
        const baseX = isPlayer ? 20 : 80;
        const baseY = 30 + (index * 12);
        const z = Math.random() * 20 - 10; // Глубина для эффекта 3D

        return {
          id: ship.id,
          ship_type: ship.ship_type,
          current_hp: ship.current_hp,
          max_hp: ship.max_hp,
          attack: ship.attack,
          defense: ship.defense,
          speed: ship.speed,
          destroyed: ship.current_hp <= 0,
          position: { x: baseX, y: baseY, z },
          velocity: { x: 0, y: 0 }
        };
      });
    };

    setPlayerShips(initShips(playerFleet, true));
    setEnemyShips(initShips(enemyFleet, false));
    setBattleActive(true);
  }, [playerFleet, enemyFleet]);

  // Воспроизведение боя с кинематографическими эффектами
  useEffect(() => {
    if (!battleActive || currentActionIndex >= battleLog.length) {
      if (currentActionIndex >= battleLog.length && battleActive) {
        setBattleActive(false);
        setTimeout(() => setShowResult(true), 1500);
      }
      return;
    }

    const action = battleLog[currentActionIndex];
    const delay = action.isCrit ? 1800 : 1000; // Замедление на критах

    const timer = setTimeout(() => {
      // Фокусировка камеры на атакующем
      const attacker = [...playerShips, ...enemyShips].find(s => s.id === action.attacker.shipId);
      if (attacker?.position) {
        setCameraFocus({ x: attacker.position.x, y: attacker.position.y });
      }

      // Slow motion эффект на критах
      if (action.isCrit) {
        setSlowMotion(true);
        setTimeout(() => setSlowMotion(false), 1500);
      }

      // Обновляем HP
      if (action.target.isPlayer) {
        setPlayerShips(prev => prev.map(ship =>
          ship.id === action.target.shipId
            ? { ...ship, current_hp: action.targetRemainingHP, destroyed: action.isKill }
            : ship
        ));
      } else {
        setEnemyShips(prev => prev.map(ship =>
          ship.id === action.target.shipId
            ? { ...ship, current_hp: action.targetRemainingHP, destroyed: action.isKill }
            : ship
        ));
      }

      // Эффект выстрела
      setActiveShot({
        from: action.attacker.shipId,
        to: action.target.shipId,
        isCrit: action.isCrit
      });
      setTimeout(() => setActiveShot(null), 1000);

      setCurrentActionIndex(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [battleActive, currentActionIndex, battleLog, playerShips, enemyShips]);

  if (showResult) {
    return (
      <div className="cinematic-battle-result">
        <div className={`cinematic-result-panel ${winner === 1 ? 'victory' : 'defeat'}`}>
          <h1 className="cinematic-result-title">
            {winner === 1 ? '🏆 VICTORY' : '💀 DEFEAT'}
          </h1>
          {winner === 1 && (
            <p className="cinematic-reward">+{reward} Luminios</p>
          )}
          <button onClick={onBattleEnd} className="cinematic-result-button">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`cinematic-battle-container ${slowMotion ? 'slow-motion' : ''}`}>
      {/* Фон с движущимися звездами */}
      <div className="cinematic-starfield">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Космическая сцена */}
      <div
        className="cinematic-scene"
        style={{
          transform: cameraFocus
            ? `translate(${50 - cameraFocus.x}%, ${50 - cameraFocus.y}%) scale(1.2)`
            : 'translate(0, 0) scale(1)'
        }}
      >
        {/* Корабли игрока */}
        {playerShips.map((ship) => (
          <div
            key={`player-${ship.id}`}
            className={`cinematic-ship player ${ship.destroyed ? 'destroyed' : ''}`}
            style={{
              left: `${ship.position?.x}%`,
              top: `${ship.position?.y}%`,
              transform: `translateZ(${ship.position?.z}px) rotateY(90deg)`
            }}
            data-ship-id={ship.id}
          >
            <div className="ship-model">
              <div className="ship-body">🚀</div>
              <div className="ship-engine-glow"></div>
            </div>
            <div className="ship-hp-indicator">
              <div className="hp-bar-container">
                <div
                  className="hp-bar-fill player"
                  style={{ width: `${(ship.current_hp / ship.max_hp) * 100}%` }}
                />
              </div>
              <div className="ship-name">{ship.ship_type}</div>
            </div>
          </div>
        ))}

        {/* Корабли врага */}
        {enemyShips.map((ship) => (
          <div
            key={`enemy-${ship.id}`}
            className={`cinematic-ship enemy ${ship.destroyed ? 'destroyed' : ''}`}
            style={{
              left: `${ship.position?.x}%`,
              top: `${ship.position?.y}%`,
              transform: `translateZ(${ship.position?.z}px) rotateY(-90deg)`
            }}
            data-ship-id={ship.id}
          >
            <div className="ship-model">
              <div className="ship-body">🛸</div>
              <div className="ship-engine-glow enemy"></div>
            </div>
            <div className="ship-hp-indicator">
              <div className="hp-bar-container">
                <div
                  className="hp-bar-fill enemy"
                  style={{ width: `${(ship.current_hp / ship.max_hp) * 100}%` }}
                />
              </div>
              <div className="ship-name">{ship.ship_type}</div>
            </div>
          </div>
        ))}

        {/* Эффект выстрела */}
        {activeShot && (
          <svg className="cinematic-shot-effect" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <line
              x1={`${getShipPosition(activeShot.from, [...playerShips, ...enemyShips])?.x}%`}
              y1={`${getShipPosition(activeShot.from, [...playerShips, ...enemyShips])?.y}%`}
              x2={`${getShipPosition(activeShot.to, [...playerShips, ...enemyShips])?.x}%`}
              y2={`${getShipPosition(activeShot.to, [...playerShips, ...enemyShips])?.y}%`}
              stroke={activeShot.isCrit ? '#ff00ff' : '#00d4ff'}
              strokeWidth={activeShot.isCrit ? '6' : '4'}
              filter="url(#glow)"
              className="laser-beam"
            />
          </svg>
        )}
      </div>

      {/* HUD элементы */}
      <div className="cinematic-hud">
        <div className="hud-corner top-left"></div>
        <div className="hud-corner top-right"></div>
        <div className="hud-corner bottom-left"></div>
        <div className="hud-corner bottom-right"></div>

        <div className="battle-counter">
          ACTION {currentActionIndex + 1}/{battleLog.length}
        </div>
      </div>

      {/* Эффект виньетки */}
      <div className="vignette"></div>
    </div>
  );
};

// Вспомогательная функция для получения позиции корабля
function getShipPosition(shipId: number, allShips: Ship[]) {
  const ship = allShips.find(s => s.id === shipId);
  return ship?.position || { x: 50, y: 50 };
}

export default BattleScreenCinematic;
