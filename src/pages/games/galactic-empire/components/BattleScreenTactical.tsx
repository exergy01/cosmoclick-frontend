import React, { useState, useEffect, useRef } from 'react';
import './BattleSystemTactical.css';

interface Ship {
  id: number;
  ship_type: string;
  current_hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  speed: number;
  destroyed: boolean;
  position?: { x: number; y: number }; // Позиция на сетке
}

interface BattleScreenTacticalProps {
  battleLog: any[];
  playerFleet: any[];
  enemyFleet: any[];
  winner: number;
  reward: number;
  onBattleEnd: () => void;
}

const BattleScreenTactical: React.FC<BattleScreenTacticalProps> = ({
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
  const [battleLogText, setBattleLogText] = useState<string[]>([]);
  const [activeFire, setActiveFire] = useState<{from: number, to: number} | null>(null);

  // Инициализация флотов с позициями
  useEffect(() => {
    const initShips = (fleet: any[], isPlayer: boolean): Ship[] => {
      return fleet.map((ship, index) => {
        // Расставляем корабли по сетке
        const baseY = isPlayer ? 80 : 20; // Игрок снизу, враг сверху
        const spacing = 15;
        const startX = 20 + (index * spacing);

        return {
          id: ship.id,
          ship_type: ship.ship_type,
          current_hp: ship.current_hp,
          max_hp: ship.max_hp,
          attack: ship.attack,
          defense: ship.defense,
          speed: ship.speed,
          destroyed: ship.current_hp <= 0,
          position: { x: startX, y: baseY }
        };
      });
    };

    setPlayerShips(initShips(playerFleet, true));
    setEnemyShips(initShips(enemyFleet, false));
    setBattleActive(true);
  }, [playerFleet, enemyFleet]);

  // Воспроизведение боя
  useEffect(() => {
    if (!battleActive || currentActionIndex >= battleLog.length) {
      if (currentActionIndex >= battleLog.length && battleActive) {
        setBattleActive(false);
        setTimeout(() => setShowResult(true), 1000);
      }
      return;
    }

    const action = battleLog[currentActionIndex];

    const timer = setTimeout(() => {
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

      // Показываем линию выстрела
      setActiveFire({ from: action.attacker.shipId, to: action.target.shipId });
      setTimeout(() => setActiveFire(null), 800);

      // Лог
      const critText = action.isCrit ? ' 💥КРИТ' : '';
      const killText = action.isKill ? ' 💀' : '';
      setBattleLogText(prev => [...prev, `${action.attacker.shipType} → ${action.target.shipType}: -${action.damage}${critText}${killText}`].slice(-8));

      setCurrentActionIndex(prev => prev + 1);
    }, 1200);

    return () => clearTimeout(timer);
  }, [battleActive, currentActionIndex, battleLog]);

  if (showResult) {
    return (
      <div className="tactical-battle-result">
        <div className="result-panel">
          <h1>{winner === 1 ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}</h1>
          {winner === 1 && <p style={{ fontSize: '1.5rem' }}>Награда: {reward} Luminios</p>}
          <button onClick={onBattleEnd} className="result-button">
            Завершить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tactical-battle-container">
      {/* Сетка */}
      <div className="tactical-grid">
        {/* Горизонтальные линии */}
        {[...Array(10)].map((_, i) => (
          <div key={`h-${i}`} className="grid-line horizontal" style={{ top: `${i * 10}%` }} />
        ))}
        {/* Вертикальные линии */}
        {[...Array(10)].map((_, i) => (
          <div key={`v-${i}`} className="grid-line vertical" style={{ left: `${i * 10}%` }} />
        ))}

        {/* Корабли игрока */}
        {playerShips.map((ship) => (
          <div
            key={`player-${ship.id}`}
            className={`tactical-ship player ${ship.destroyed ? 'destroyed' : ''}`}
            style={{
              left: `${ship.position?.x}%`,
              top: `${ship.position?.y}%`
            }}
            data-ship-id={ship.id}
          >
            <div className="ship-icon">🔷</div>
            <div className="ship-hp-bar">
              <div
                className="ship-hp-fill"
                style={{ width: `${(ship.current_hp / ship.max_hp) * 100}%` }}
              />
            </div>
            <div className="ship-label">{ship.ship_type}</div>
          </div>
        ))}

        {/* Корабли врага */}
        {enemyShips.map((ship) => (
          <div
            key={`enemy-${ship.id}`}
            className={`tactical-ship enemy ${ship.destroyed ? 'destroyed' : ''}`}
            style={{
              left: `${ship.position?.x}%`,
              top: `${ship.position?.y}%`
            }}
            data-ship-id={ship.id}
          >
            <div className="ship-icon">🔶</div>
            <div className="ship-hp-bar">
              <div
                className="ship-hp-fill enemy"
                style={{ width: `${(ship.current_hp / ship.max_hp) * 100}%` }}
              />
            </div>
            <div className="ship-label">{ship.ship_type}</div>
          </div>
        ))}

        {/* Линия выстрела */}
        {activeFire && (
          <svg className="fire-line" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <line
              x1={`${getShipPosition(activeFire.from, [...playerShips, ...enemyShips])?.x}%`}
              y1={`${getShipPosition(activeFire.from, [...playerShips, ...enemyShips])?.y}%`}
              x2={`${getShipPosition(activeFire.to, [...playerShips, ...enemyShips])?.x}%`}
              y2={`${getShipPosition(activeFire.to, [...playerShips, ...enemyShips])?.y}%`}
              stroke="#ff6600"
              strokeWidth="3"
              className="tracer-line"
            />
          </svg>
        )}
      </div>

      {/* Боевой лог */}
      <div className="tactical-battle-log">
        <h3>📜 БОЙ</h3>
        <div className="log-entries">
          {battleLogText.map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>
      </div>

      {/* Индикатор прогресса */}
      <div className="battle-progress">
        Действие {currentActionIndex + 1} / {battleLog.length}
      </div>
    </div>
  );
};

// Вспомогательная функция для получения позиции корабля
function getShipPosition(shipId: number, allShips: Ship[]) {
  const ship = allShips.find(s => s.id === shipId);
  return ship?.position || { x: 50, y: 50 };
}

export default BattleScreenTactical;
