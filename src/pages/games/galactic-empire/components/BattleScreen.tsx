import React, { useState, useEffect, useRef } from 'react';
import Ship from './Ship';
import BattleEffects from './BattleEffects';
import BattleLog from './BattleLog';
import HealthBars from './HealthBars';
import BattleResult from './BattleResult';
import './BattleSystem.css';

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
  id: number;
  ship_type: string;
  current_hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  speed: number;
  destroyed: boolean;
}

interface BattleScreenProps {
  battleLog: BattleAction[];
  playerFleet: any[];
  enemyFleet: any[];
  winner: number;
  reward: number;
  onBattleEnd: () => void;
}

type BattleViewMode = 'classic' | 'tactical' | 'detailed';

const BattleScreen: React.FC<BattleScreenProps> = ({
  battleLog,
  playerFleet,
  enemyFleet,
  winner,
  reward,
  onBattleEnd
}) => {
  const [playerShips, setPlayerShips] = useState<ShipData[]>([]);
  const [enemyShips, setEnemyShips] = useState<ShipData[]>([]);
  const [battleMessages, setBattleMessages] = useState<string[]>(['--- 🚀 Начало боя ---']);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [battleActive, setBattleActive] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [viewMode, setViewMode] = useState<BattleViewMode>('classic');

  const battleScreenRef = useRef<HTMLDivElement>(null);

  // Инициализация флотов
  useEffect(() => {
    const initShips = (fleet: any[]): ShipData[] => {
      return fleet.map((ship) => ({
        id: ship.id,
        ship_type: ship.ship_type,
        current_hp: ship.current_hp,
        max_hp: ship.max_hp,
        attack: ship.attack,
        defense: ship.defense,
        speed: ship.speed,
        destroyed: ship.current_hp <= 0
      }));
    };

    setPlayerShips(initShips(playerFleet));
    setEnemyShips(initShips(enemyFleet));
  }, [playerFleet, enemyFleet]);

  const addToBattleLog = (message: string) => {
    setBattleMessages(prev => [...prev.slice(-49), message]);
  };

  // Функция для создания визуального эффекта лазера
  const fireLaser = (fromSelector: string, toSelector: string, laserClass: string) => {
    const fromEl = document.querySelector(fromSelector);
    const toEl = document.querySelector(toSelector);
    const laserEl = document.querySelector(`.${laserClass}`) as HTMLElement;

    if (!fromEl || !toEl || !laserEl || !battleScreenRef.current) return;

    const battleRect = battleScreenRef.current.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const fromX = fromRect.left + fromRect.width / 2 - battleRect.left;
    const fromY = fromRect.top + fromRect.height / 2 - battleRect.top;
    const toX = toRect.left + toRect.width / 2 - battleRect.left;
    const toY = toRect.top + toRect.height / 2 - battleRect.top;

    const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);

    laserEl.style.left = `${fromX}px`;
    laserEl.style.top = `${fromY}px`;
    laserEl.style.transform = `rotate(${angle}deg)`;
    laserEl.style.setProperty('--laser-distance', `${distance}px`);
    laserEl.style.animation = 'none';
    laserEl.offsetHeight; // Триггер перерисовки
    laserEl.style.animation = 'fireLaser 0.5s linear';
  };

  // Функция для создания эффекта взрыва
  const createExplosion = (targetSelector: string, explosionClass: string) => {
    const targetEl = document.querySelector(targetSelector);
    const explosionEl = document.querySelector(`.${explosionClass}`) as HTMLElement;

    if (!targetEl || !explosionEl || !battleScreenRef.current) return;

    const battleRect = battleScreenRef.current.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const x = targetRect.left + targetRect.width / 2 - battleRect.left;
    const y = targetRect.top + targetRect.height / 2 - battleRect.top;

    explosionEl.style.left = `${x - 20}px`;
    explosionEl.style.top = `${y - 20}px`;
    explosionEl.style.animation = 'none';
    explosionEl.offsetHeight;
    explosionEl.style.animation = 'explode 0.5s ease-out';

    // Добавляем тряску корабля
    const shipEl = targetEl.closest('.ship');
    if (shipEl) {
      shipEl.classList.add('hit');
      setTimeout(() => shipEl.classList.remove('hit'), 300);
    }
  };

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
      // Обновляем HP кораблей
      if (action.target.fleet === 1) {
        setPlayerShips(prev =>
          prev.map(ship =>
            ship.id === action.target.shipId
              ? {
                  ...ship,
                  current_hp: action.targetRemainingHP,
                  destroyed: action.isKill
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
                  destroyed: action.isKill
                }
              : ship
          )
        );
      }

      // Визуальные эффекты - используем shipId для точного таргетинга
      const fromSelector = `[data-ship-id="${action.attacker.shipId}"] .ship-icon`;
      const toSelector = `[data-ship-id="${action.target.shipId}"] .ship-icon`;
      const laserClass = action.attacker.fleet === 1 ? 'sl1' : 'sl2';
      const explosionClass = action.target.fleet === 1 ? 'explosion1' : 'explosion2';

      fireLaser(fromSelector, toSelector, laserClass);
      setTimeout(() => {
        createExplosion(toSelector, explosionClass);
      }, 500);

      // Лог боя
      const critText = action.isCrit ? ' 💥КРИТ' : '';
      const killText = action.isKill ? ' 💀УНИЧТОЖЕН' : '';
      const attackerName = action.attacker.fleet === 1 ? '🔵' : '🔴';
      addToBattleLog(
        `${attackerName} ${action.attacker.shipType} → ${action.target.shipType}: -${action.damage}${critText}${killText}`
      );

      setCurrentActionIndex(prev => prev + 1);
    }, 1500); // 1.5 секунды на действие

    return () => clearTimeout(timer);
  }, [battleActive, currentActionIndex, battleLog]);

  // Рендер для классического вида
  const renderClassicView = () => (
    <>
      {/* Звездное небо */}
      <div className="stars-background"></div>

      {/* Флот игрока */}
      <div className="fleet player-fleet">
        {playerShips.map((ship) => (
          <Ship key={ship.id} ship={ship} isPlayer={true} isActive={battleActive} />
        ))}
      </div>

      {/* Флот противника */}
      <div className="fleet enemy-fleet">
        {enemyShips.map((ship) => (
          <Ship key={ship.id} ship={ship} isPlayer={false} isActive={battleActive} />
        ))}
      </div>

      {/* Эффекты боя */}
      <BattleEffects />
    </>
  );

  // Рендер для тактического вида (вид сверху)
  const renderTacticalView = () => (
    <>
      <div className="tactical-grid">
        {/* Сетка координат */}
        {[...Array(8)].map((_, i) => (
          <div key={`grid-h-${i}`} className="grid-line grid-horizontal" style={{top: `${i * 12.5}%`}} />
        ))}
        {[...Array(8)].map((_, i) => (
          <div key={`grid-v-${i}`} className="grid-line grid-vertical" style={{left: `${i * 12.5}%`}} />
        ))}
      </div>

      {/* Флот игрока (синие точки) */}
      <div className="tactical-fleet player-tactical">
        {playerShips.map((ship, index) => (
          <div
            key={ship.id}
            data-ship-id={ship.id}
            className={`tactical-ship ${ship.destroyed ? 'destroyed' : ''}`}
            style={{
              left: `${20 + index * 10}%`,
              top: '70%',
              backgroundColor: '#00bfff',
            }}
          >
            <div className="tactical-ship-icon">●</div>
            <div className="tactical-ship-label">{ship.ship_type.split('_')[0]}</div>
            <div className="tactical-hp-bar">
              <div
                className="tactical-hp-fill"
                style={{ width: `${(ship.current_hp / ship.max_hp) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Флот противника (красные точки) */}
      <div className="tactical-fleet enemy-tactical">
        {enemyShips.map((ship, index) => (
          <div
            key={ship.id}
            data-ship-id={ship.id}
            className={`tactical-ship ${ship.destroyed ? 'destroyed' : ''}`}
            style={{
              left: `${20 + index * 10}%`,
              top: '20%',
              backgroundColor: '#ff4444',
            }}
          >
            <div className="tactical-ship-icon">●</div>
            <div className="tactical-ship-label">{ship.ship_type.split('_')[0]}</div>
            <div className="tactical-hp-bar">
              <div
                className="tactical-hp-fill"
                style={{ width: `${(ship.current_hp / ship.max_hp) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Траектории выстрелов */}
      <svg className="tactical-trajectories" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
        {/* Траектории будут добавляться динамически */}
      </svg>
    </>
  );

  // Рендер для детального вида (с кулдаунами)
  const renderDetailedView = () => (
    <>
      {/* Звездное небо */}
      <div className="stars-background"></div>

      {/* Флот игрока с деталями */}
      <div className="fleet player-fleet detailed">
        {playerShips.map((ship) => (
          <div key={ship.id} className="detailed-ship-container" data-ship-id={ship.id}>
            <Ship ship={ship} isPlayer={true} isActive={battleActive} />
            <div className="ship-details">
              <div className="detail-stat">⚔️ {ship.attack}</div>
              <div className="detail-stat">🛡️ {ship.defense}</div>
              <div className="detail-stat">⚡ {ship.speed}</div>
              <div className="detail-cooldown">
                <div className="cooldown-bar" style={{width: '0%'}}>🔫</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Флот противника с деталями */}
      <div className="fleet enemy-fleet detailed">
        {enemyShips.map((ship) => (
          <div key={ship.id} className="detailed-ship-container" data-ship-id={ship.id}>
            <Ship ship={ship} isPlayer={false} isActive={battleActive} />
            <div className="ship-details">
              <div className="detail-stat">⚔️ {ship.attack}</div>
              <div className="detail-stat">🛡️ {ship.defense}</div>
              <div className="detail-stat">⚡ {ship.speed}</div>
              <div className="detail-cooldown">
                <div className="cooldown-bar" style={{width: '0%'}}>🔫</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Эффекты боя */}
      <BattleEffects />
    </>
  );

  return (
    <div className="battle-container">
      {/* Кнопки переключения вида */}
      <div className="battle-view-controls">
        <button
          className={`view-btn ${viewMode === 'classic' ? 'active' : ''}`}
          onClick={() => setViewMode('classic')}
          disabled={battleActive}
        >
          📺 Классический
        </button>
        <button
          className={`view-btn ${viewMode === 'tactical' ? 'active' : ''}`}
          onClick={() => setViewMode('tactical')}
          disabled={battleActive}
        >
          🗺️ Тактический
        </button>
        <button
          className={`view-btn ${viewMode === 'detailed' ? 'active' : ''}`}
          onClick={() => setViewMode('detailed')}
          disabled={battleActive}
        >
          📊 Детальный
        </button>
      </div>

      <div className={`battle-screen battle-view-${viewMode}`} ref={battleScreenRef}>
        {/* Рендер выбранного вида */}
        {viewMode === 'classic' && renderClassicView()}
        {viewMode === 'tactical' && renderTacticalView()}
        {viewMode === 'detailed' && renderDetailedView()}

        {/* Лог боя (общий для всех видов) */}
        <BattleLog messages={battleMessages} />

        {/* Индикаторы здоровья (для классического и детального) */}
        {viewMode !== 'tactical' && (
          <HealthBars playerShips={playerShips} enemyShips={enemyShips} />
        )}
      </div>

      {/* Результат боя */}
      {showResult && <BattleResult winner={winner} reward={reward} onRestart={onBattleEnd} />}
    </div>
  );
};

export default BattleScreen;
