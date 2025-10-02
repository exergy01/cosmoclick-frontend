import React from 'react';

interface ShipProps {
  ship: {
    id: number;
    name: string;
    type: 'battleship' | 'cruiser' | 'frigate';
    icon: string;
    health: number;
    maxHealth: number;
    fighters?: number[];
    torpedoBombers?: number[];
    modules?: string[];
    destroyed: boolean;
  };
  isPlayer: boolean;
  isActive: boolean;
}

const Ship: React.FC<ShipProps> = ({ ship, isPlayer, isActive }) => {
  const getModuleIcon = (module: string): string => {
    const moduleIcons: Record<string, string> = {
      'shield-extender': '🛡️',
      'damage-amplifier': '⚔️',
      'ewar-module': '📡',
      'armor-repairer': '🔧'
    };
    return moduleIcons[module] || '⚙️';
  };

  const getShieldSize = (): { width: string; height: string } => {
    switch (ship.type) {
      case 'battleship': return { width: '110%', height: '110%' };
      case 'cruiser': return { width: '100%', height: '100%' };
      case 'frigate': return { width: '90%', height: '90%' };
      default: return { width: '100%', height: '100%' };
    }
  };

  const shipClassName = `ship ${isPlayer ? 'player-ship' : 'enemy-ship'} ${ship.type} ${ship.destroyed ? 'destroyed' : ''}`;
  const shieldSize = getShieldSize();

  return (
    <div className={shipClassName} data-ship-id={ship.id}>
      <div className="ship-icon">{ship.icon}</div>
      <div className="ship-name">{ship.name}</div>

      {/* Истребители */}
      {ship.fighters && ship.fighters.length > 0 && (
        <div className={`fighters ${isPlayer ? 'player-fighters' : 'enemy-fighters'}`}>
          {ship.fighters.map((fighterId, index) => (
            <div key={index} className={`fighter fighter${fighterId}`}>
              ✈️
            </div>
          ))}
        </div>
      )}

      {/* Торпедоносцы */}
      {ship.torpedoBombers && ship.torpedoBombers.length > 0 && (
        <div className={`torpedo-bombers ${isPlayer ? 'player-torpedo-bombers' : 'enemy-torpedo-bombers'}`}>
          {ship.torpedoBombers.map((bomberId, index) => (
            <div key={index} className={`torpedo-bomber tb${bomberId}`}>
              🚀
            </div>
          ))}
        </div>
      )}

      {/* Модули */}
      {ship.modules && ship.modules.length > 0 && (
        <div className={`modules ${isPlayer ? 'player-modules' : 'enemy-modules'}`}>
          {ship.modules.map((module, index) => (
            <div key={index} className={`module ${module}`}>
              {getModuleIcon(module)}
            </div>
          ))}
        </div>
      )}

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
