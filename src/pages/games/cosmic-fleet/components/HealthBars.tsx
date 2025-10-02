import React from 'react';

interface ShipData {
  id: number;
  name: string;
  health: number;
  maxHealth: number;
}

interface HealthBarsProps {
  playerShips: ShipData[];
  enemyShips: ShipData[];
  playerFighterHealth: number[];
  enemyFighterHealth: number[];
}

const HealthBars: React.FC<HealthBarsProps> = ({
  playerShips,
  enemyShips,
  playerFighterHealth,
  enemyFighterHealth
}) => {
  const getHealthPercent = (current: number, max: number): number => {
    return Math.max(0, Math.min(100, (current / max) * 100));
  };

  return (
    <>
      {/* Индикаторы здоровья кораблей */}
      <div className="health-bars-container">
        <div className="fleet-health player-health">
          <div className="fleet-health-header">ФЛОТ ИГРОКА</div>
          {playerShips.map((ship) => (
            <div key={ship.id} className="health-bar">
              <div
                className="health-fill"
                style={{ width: `${getHealthPercent(ship.health, ship.maxHealth)}%` }}
                data-ship={ship.id}
              ></div>
              <span>{ship.name}</span>
            </div>
          ))}
        </div>

        <div className="fleet-health enemy-health">
          <div className="fleet-health-header">ФЛОТ ПРОТИВНИКА</div>
          {enemyShips.map((ship) => (
            <div key={ship.id} className="health-bar">
              <div
                className="health-fill"
                style={{ width: `${getHealthPercent(ship.health, ship.maxHealth)}%` }}
                data-ship={ship.id}
              ></div>
              <span>{ship.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Индикаторы здоровья истребителей */}
      <div className="fighter-health-bars">
        <div className="fighter-health-group player-fighter-health">
          {playerFighterHealth.map((health, index) => (
            <div key={index} className="fighter-health-bar">
              <div
                className="fighter-health-fill"
                style={{ width: `${health}%` }}
                data-fighter={index + 1}
              ></div>
            </div>
          ))}
        </div>

        <div className="fighter-health-group enemy-fighter-health">
          {enemyFighterHealth.map((health, index) => (
            <div key={index} className="fighter-health-bar">
              <div
                className="fighter-health-fill"
                style={{ width: `${health}%` }}
                data-fighter={index + 1}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HealthBars;
