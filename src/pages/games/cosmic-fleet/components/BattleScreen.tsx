import React, { useState, useEffect, useRef } from 'react';
import Ship from './Ship';
import BattleEffects from './BattleEffects';
import BattleLog from './BattleLog';
import ControlPanel from './ControlPanel';
import HealthBars from './HealthBars';
import BattleResult from './BattleResult';
import './BattleSystem.css';

interface ShipData {
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
}

interface BattleState {
  playerShips: ShipData[];
  enemyShips: ShipData[];
  playerFighterHealth: number[];
  enemyFighterHealth: number[];
  battlePhase: 'fighters' | 'ships';
  battleActive: boolean;
  winner: 'player' | 'enemy' | null;
}

interface BattleScreenProps {
  playerFleet: any[];
  enemyFleet: any[];
  onBattleEnd: (result: { winner: string; rewards: any }) => void;
  telegramId?: string;
}

const BattleScreen: React.FC<BattleScreenProps> = ({ playerFleet, enemyFleet, onBattleEnd, telegramId }) => {
  const [battleState, setBattleState] = useState<BattleState>({
    playerShips: [],
    enemyShips: [],
    playerFighterHealth: [100, 100, 100, 100, 100],
    enemyFighterHealth: [100, 100, 100, 100, 100],
    battlePhase: 'fighters',
    battleActive: true,
    winner: null
  });

  const [battleLog, setBattleLog] = useState<string[]>(['--- Начало боя ---']);
  const [targetShipId, setTargetShipId] = useState<number | null>(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const [ewarActive, setEwarActive] = useState(false);

  const battleScreenRef = useRef<HTMLDivElement>(null);

  // Инициализация флотов
  useEffect(() => {
    const initShips = (fleet: any[], isPlayer: boolean) => {
      return fleet.map((ship, index) => ({
        id: ship.id || index + 1,
        name: ship.name || `Корабль-${index + 1}`,
        type: ship.type || 'frigate',
        icon: getShipIcon(ship.type),
        health: ship.health || 100,
        maxHealth: ship.maxHealth || 100,
        fighters: ship.fighters || [],
        torpedoBombers: ship.torpedoBombers || [],
        modules: ship.modules || [],
        destroyed: false
      }));
    };

    setBattleState(prev => ({
      ...prev,
      playerShips: initShips(playerFleet, true),
      enemyShips: initShips(enemyFleet, false)
    }));
  }, [playerFleet, enemyFleet]);

  const getShipIcon = (type: string): string => {
    switch (type) {
      case 'battleship': return '🚢';
      case 'cruiser': return '🛸';
      case 'frigate': return '🚤';
      default: return '🚀';
    }
  };

  const addToBattleLog = (message: string) => {
    setBattleLog(prev => [...prev.slice(-49), message]);
  };

  const handleTargetSelect = (shipId: number) => {
    setTargetShipId(shipId);
    addToBattleLog(`Цель выбрана: ${battleState.enemyShips.find(s => s.id === shipId)?.name}`);
  };

  const handleEwarActivate = () => {
    if (!ewarActive) {
      setEwarActive(true);
      addToBattleLog('РЭБ активирован!');
      setTimeout(() => setEwarActive(false), 5000);
    }
  };

  const handleAutoBattle = () => {
    setAutoBattle(!autoBattle);
    addToBattleLog(autoBattle ? 'Автобой выключен' : 'Автобой включен');
  };

  const handleRestart = async () => {
    if (battleState.winner) {
      // Вызываем API для начисления наград
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';
        const response = await fetch(`${apiUrl}/api/cosmic-fleet/battles/bot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            telegramId: telegramId || '',
            difficulty: 'easy',
            result: battleState.winner === 'player' ? 'win' : 'loss'
          })
        });

        const data = await response.json();

        const rewards = {
          luminios: data.reward || (battleState.winner === 'player' ? 1500 : 0),
          xp: battleState.winner === 'player' ? 100 : 50
        };

        addToBattleLog(`💰 Награда: ${rewards.luminios} Luminios`);

        onBattleEnd({ winner: battleState.winner, rewards });
      } catch (error) {
        console.error('Ошибка при начислении наград:', error);
        // Даже если API не сработал, закрываем бой
        const rewards = {
          luminios: battleState.winner === 'player' ? 1500 : 0,
          xp: battleState.winner === 'player' ? 100 : 50
        };
        onBattleEnd({ winner: battleState.winner, rewards });
      }
    }
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

  // Функция атаки
  const performAttack = () => {
    setBattleState(prev => {
      const newPlayerShips = [...prev.playerShips];
      const newEnemyShips = [...prev.enemyShips];

      // Игрок атакует
      const alivePlayerShips = newPlayerShips.filter(s => !s.destroyed);
      const aliveEnemyShips = newEnemyShips.filter(s => !s.destroyed);

      if (alivePlayerShips.length > 0 && aliveEnemyShips.length > 0) {
        // Выбираем случайную цель врага
        const targetEnemy = aliveEnemyShips[Math.floor(Math.random() * aliveEnemyShips.length)];
        const enemyIndex = newEnemyShips.findIndex(s => s.id === targetEnemy.id);

        // Визуальный эффект - лазер
        setTimeout(() => {
          fireLaser('.player-ship .ship-icon', '.enemy-ship .ship-icon', 'sl1');
          setTimeout(() => {
            createExplosion('.enemy-ship .ship-icon', 'explosion1');
          }, 500);
        }, 0);

        // Наносим урон (10-30)
        const damage = Math.floor(Math.random() * 21) + 10;
        newEnemyShips[enemyIndex].health = Math.max(0, newEnemyShips[enemyIndex].health - damage);

        addToBattleLog(`⚔️ Игрок атакует ${targetEnemy.name}: -${damage} HP`);

        // Проверяем уничтожение
        if (newEnemyShips[enemyIndex].health <= 0) {
          newEnemyShips[enemyIndex].destroyed = true;
          addToBattleLog(`💥 ${targetEnemy.name} уничтожен!`);
        }
      }

      // Враг атакует
      const stillAlivePlayerShips = newPlayerShips.filter(s => !s.destroyed);
      const stillAliveEnemyShips = newEnemyShips.filter(s => !s.destroyed);

      if (stillAliveEnemyShips.length > 0 && stillAlivePlayerShips.length > 0) {
        // Выбираем случайную цель игрока
        const targetPlayer = stillAlivePlayerShips[Math.floor(Math.random() * stillAlivePlayerShips.length)];
        const playerIndex = newPlayerShips.findIndex(s => s.id === targetPlayer.id);

        // Визуальный эффект - лазер (с задержкой)
        setTimeout(() => {
          fireLaser('.enemy-ship .ship-icon', '.player-ship .ship-icon', 'sl2');
          setTimeout(() => {
            createExplosion('.player-ship .ship-icon', 'explosion2');
          }, 500);
        }, 1000);

        // Наносим урон (10-30)
        const damage = Math.floor(Math.random() * 21) + 10;
        newPlayerShips[playerIndex].health = Math.max(0, newPlayerShips[playerIndex].health - damage);

        addToBattleLog(`🔴 Враг атакует ${targetPlayer.name}: -${damage} HP`);

        // Проверяем уничтожение
        if (newPlayerShips[playerIndex].health <= 0) {
          newPlayerShips[playerIndex].destroyed = true;
          addToBattleLog(`💥 ${targetPlayer.name} уничтожен!`);
        }
      }

      return {
        ...prev,
        playerShips: newPlayerShips,
        enemyShips: newEnemyShips
      };
    });
  };

  // Боевой цикл
  useEffect(() => {
    if (!battleState.battleActive) return;

    const battleInterval = setInterval(() => {
      const playerAlive = battleState.playerShips.some(s => !s.destroyed);
      const enemyAlive = battleState.enemyShips.some(s => !s.destroyed);

      if (playerAlive && enemyAlive) {
        performAttack();
      } else {
        // Бой окончен
        setBattleState(prev => ({
          ...prev,
          battleActive: false,
          winner: !playerAlive ? 'enemy' : 'player'
        }));
        addToBattleLog(!playerAlive ? '--- ПОРАЖЕНИЕ ---' : '--- ПОБЕДА ---');
      }
    }, 2000); // Атака каждые 2 секунды

    return () => clearInterval(battleInterval);
  }, [battleState.battleActive, battleState.playerShips, battleState.enemyShips]);

  return (
    <div className="battle-container">
      <div className="battle-screen" ref={battleScreenRef}>
        {/* Звездное небо */}
        <div className="stars-background"></div>

        {/* Флот игрока */}
        <div className="fleet player-fleet">
          {battleState.playerShips.map((ship) => (
            <Ship
              key={ship.id}
              ship={ship}
              isPlayer={true}
              isActive={battleState.battleActive}
            />
          ))}
        </div>

        {/* Флот противника */}
        <div className="fleet enemy-fleet">
          {battleState.enemyShips.map((ship) => (
            <Ship
              key={ship.id}
              ship={ship}
              isPlayer={false}
              isActive={battleState.battleActive}
            />
          ))}
        </div>

        {/* Эффекты боя */}
        <BattleEffects />

        {/* Лог боя */}
        <BattleLog messages={battleLog} />

        {/* Панель управления */}
        <ControlPanel
          onTargetSelect={handleTargetSelect}
          onEwarActivate={handleEwarActivate}
          onAutoBattle={handleAutoBattle}
          targetShips={battleState.enemyShips}
          ewarActive={ewarActive}
          autoBattle={autoBattle}
        />

        {/* Индикаторы здоровья */}
        <HealthBars
          playerShips={battleState.playerShips}
          enemyShips={battleState.enemyShips}
          playerFighterHealth={battleState.playerFighterHealth}
          enemyFighterHealth={battleState.enemyFighterHealth}
        />
      </div>

      {/* Результат боя */}
      {battleState.winner && (
        <BattleResult
          winner={battleState.winner}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default BattleScreen;
