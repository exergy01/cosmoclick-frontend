import React from 'react';

interface ShipData {
  id: number;
  ship_type: string;
  current_hp: number;
  max_hp: number;
}

interface HealthBarsProps {
  playerShips: ShipData[];
  enemyShips: ShipData[];
}

const HealthBars: React.FC<HealthBarsProps> = ({
  playerShips,
  enemyShips
}) => {
  const getHealthPercent = (current: number, max: number): number => {
    return Math.max(0, Math.min(100, (current / max) * 100));
  };

  return (
    <div className="health-bars-container">
      <div className="fleet-health player-health">
        <div className="fleet-health-header">ФЛОТ ИГРОКА</div>
        {playerShips.map((ship) => (
          <div key={ship.id} className="health-bar">
            <div
              className="health-fill"
              style={{ width: `${getHealthPercent(ship.current_hp, ship.max_hp)}%` }}
              data-ship={ship.id}
            ></div>
            <span>{ship.ship_type}</span>
          </div>
        ))}
      </div>

      <div className="fleet-health enemy-health">
        <div className="fleet-health-header">ФЛОТ ПРОТИВНИКА</div>
        {enemyShips.map((ship) => (
          <div key={ship.id} className="health-bar">
            <div
              className="health-fill"
              style={{ width: `${getHealthPercent(ship.current_hp, ship.max_hp)}%` }}
              data-ship={ship.id}
            ></div>
            <span>{ship.ship_type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HealthBars;
