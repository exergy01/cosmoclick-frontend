import React from 'react';

interface ShipProps {
  ship: {
    id: number;
    ship_type: string;
    current_hp: number;
    max_hp: number;
    attack: number;
    defense: number;
    speed: number;
    destroyed: boolean;
  };
  isPlayer: boolean;
  isActive: boolean;
}

const Ship: React.FC<ShipProps> = ({ ship, isPlayer, isActive }) => {
  const getShipIcon = (shipType: string): string => {
    // Frigate
    if (shipType.includes('frigate')) return '🚤';
    // Destroyer
    if (shipType.includes('destroyer')) return '🛸';
    // Cruiser
    if (shipType.includes('cruiser')) return '🚢';
    // Battlecruiser
    if (shipType.includes('battlecruiser')) return '🛡️';
    // Battleship
    if (shipType.includes('battleship')) return '⚓';
    // Carrier
    if (shipType.includes('carrier')) return '🎪';
    // Dreadnought
    if (shipType.includes('dreadnought')) return '🏰';
    // Titan
    if (shipType.includes('titan')) return '👑';

    return '🚀';
  };

  const getShieldSize = (): { width: string; height: string } => {
    if (ship.ship_type.includes('titan') || ship.ship_type.includes('dreadnought')) {
      return { width: '130%', height: '130%' };
    }
    if (ship.ship_type.includes('battleship') || ship.ship_type.includes('carrier')) {
      return { width: '110%', height: '110%' };
    }
    if (ship.ship_type.includes('cruiser') || ship.ship_type.includes('battlecruiser')) {
      return { width: '100%', height: '100%' };
    }
    return { width: '90%', height: '90%' };
  };

  const shipClassName = `ship ${isPlayer ? 'player-ship' : 'enemy-ship'} ${ship.destroyed ? 'destroyed' : ''}`;
  const shieldSize = getShieldSize();
  const shipIcon = getShipIcon(ship.ship_type);

  return (
    <div className={shipClassName} data-ship-id={ship.id}>
      <div className="ship-icon">{shipIcon}</div>
      <div className="ship-name">{ship.ship_type}</div>

      {/* Щиты */}
      {!ship.destroyed && (
        <div
          className={`shields ${isPlayer ? 'player-shields' : 'enemy-shields'}`}
          style={{ width: shieldSize.width, height: shieldSize.height }}
        ></div>
      )}
    </div>
  );
};

export default Ship;
