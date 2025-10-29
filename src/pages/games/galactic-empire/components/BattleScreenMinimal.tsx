import React, { useState, useEffect } from 'react';
import './BattleSystemMinimal.css';

interface Ship {
  id: number;
  ship_type: string;
  current_hp: number;
  max_hp: number;
  destroyed: boolean;
}

interface BattleScreenMinimalProps {
  battleLog: any[];
  playerFleet: any[];
  enemyFleet: any[];
  winner: number;
  reward: number;
  onBattleEnd: () => void;
}

const BattleScreenMinimal: React.FC<BattleScreenMinimalProps> = ({
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
  const [lastAction, setLastAction] = useState<string>('');

  // Инициализация флотов
  useEffect(() => {
    const initShips = (fleet: any[]): Ship[] => {
      return fleet.map(ship => ({
        id: ship.id,
        ship_type: ship.ship_type,
        current_hp: ship.current_hp,
        max_hp: ship.max_hp,
        destroyed: ship.current_hp <= 0
      }));
    };

    setPlayerShips(initShips(playerFleet));
    setEnemyShips(initShips(enemyFleet));
    setBattleActive(true);
  }, [playerFleet, enemyFleet]);

  // Воспроизведение боя
  useEffect(() => {
    if (!battleActive || currentActionIndex >= battleLog.length) {
      if (currentActionIndex >= battleLog.length && battleActive) {
        setBattleActive(false);
        setTimeout(() => setShowResult(true), 500);
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

      // Обновляем текст последнего действия
      const critText = action.isCrit ? ' [CRIT]' : '';
      const killText = action.isKill ? ' [DESTROYED]' : '';
      setLastAction(`${action.attacker.shipType} → ${action.target.shipType}: -${action.damage} HP${critText}${killText}`);

      setCurrentActionIndex(prev => prev + 1);
    }, 600);

    return () => clearTimeout(timer);
  }, [battleActive, currentActionIndex, battleLog]);

  if (showResult) {
    return (
      <div className="minimal-battle-result">
        <div className="minimal-result-box">
          <div className={`result-status ${winner === 1 ? 'win' : 'loss'}`}>
            {winner === 1 ? 'VICTORY' : 'DEFEAT'}
          </div>
          {winner === 1 && <div className="result-reward">+{reward} Luminios</div>}
          <button onClick={onBattleEnd} className="minimal-button">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="minimal-battle-container">
      {/* Заголовок */}
      <div className="minimal-header">
        <div className="battle-title">COMBAT</div>
        <div className="battle-progress">
          {currentActionIndex + 1} / {battleLog.length}
        </div>
      </div>

      {/* Флоты */}
      <div className="fleets-container">
        {/* Флот игрока */}
        <div className="fleet-column player-fleet">
          <div className="fleet-label">YOUR FLEET</div>
          <div className="ships-list">
            {playerShips.map((ship) => (
              <div
                key={`player-${ship.id}`}
                className={`minimal-ship ${ship.destroyed ? 'destroyed' : ''}`}
              >
                <div className="ship-name">{ship.ship_type}</div>
                <div className="ship-hp-bar">
                  <div
                    className="hp-fill player"
                    style={{ width: `${(ship.current_hp / ship.max_hp) * 100}%` }}
                  />
                </div>
                <div className="ship-hp-text">
                  {ship.current_hp} / {ship.max_hp}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Разделитель */}
        <div className="fleet-divider">
          <div className="vs-text">VS</div>
        </div>

        {/* Флот врага */}
        <div className="fleet-column enemy-fleet">
          <div className="fleet-label">ENEMY FLEET</div>
          <div className="ships-list">
            {enemyShips.map((ship) => (
              <div
                key={`enemy-${ship.id}`}
                className={`minimal-ship ${ship.destroyed ? 'destroyed' : ''}`}
              >
                <div className="ship-name">{ship.ship_type}</div>
                <div className="ship-hp-bar">
                  <div
                    className="hp-fill enemy"
                    style={{ width: `${(ship.current_hp / ship.max_hp) * 100}%` }}
                  />
                </div>
                <div className="ship-hp-text">
                  {ship.current_hp} / {ship.max_hp}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Лог последнего действия */}
      <div className="action-log">
        {lastAction && <div className="action-text">{lastAction}</div>}
      </div>
    </div>
  );
};

export default BattleScreenMinimal;
