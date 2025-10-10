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

  return (
    <div className="battle-container">
      <div className="battle-screen" ref={battleScreenRef}>
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

        {/* Лог боя */}
        <BattleLog messages={battleMessages} />

        {/* Индикаторы здоровья */}
        <HealthBars playerShips={playerShips} enemyShips={enemyShips} />
      </div>

      {/* Результат боя */}
      {showResult && <BattleResult winner={winner} reward={reward} onRestart={onBattleEnd} />}
    </div>
  );
};

export default BattleScreen;
