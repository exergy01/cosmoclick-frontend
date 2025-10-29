import React, { useState, useEffect, useRef } from 'react';
import './BattleScreenElite.css';

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
  id: number | string;
  ship_type: string;
  current_hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  speed: number;
  destroyed: boolean;
  // Elite-specific
  rotation: number; // текущий угол поворота
  targetRotation: number; // целевой угол
  scale: number; // масштаб для анимации
}

interface BattleScreenEliteProps {
  battleLog: BattleAction[];
  playerFleet: any[];
  enemyFleet: any[];
  winner: number;
  reward: number;
  onBattleEnd: () => void;
}

// Определения 3D wireframe моделей кораблей (в виде линий)
const SHIP_MODELS: Record<string, number[][]> = {
  // Frigate - простой треугольный корабль
  frigate: [
    [0, -30, 0, 15, -15, 15], // нос -> правый борт
    [-15, 15, 15, 15, -15, 15], // левый борт -> правый борт
    [0, -30, -15, 15, -15, 15], // нос -> левый борт
    [0, -30, 0, 0, 30, 0], // нос -> центр кормы (киль)
    [-15, 15, 0, 0, 30, 0], // левый борт -> корма
    [15, 15, 0, 0, 30, 0], // правый борт -> корма
  ],

  // Destroyer - более крупный с крыльями
  destroyer: [
    [0, -40, 0, 20, -10, 0], // нос -> правое крыло
    [0, -40, 0, -20, -10, 0], // нос -> левое крыло
    [-20, -10, 0, -20, 20, 0], // левое крыло
    [20, -10, 0, 20, 20, 0], // правое крыло
    [-20, 20, 0, 0, 35, 0], // левая корма
    [20, 20, 0, 0, 35, 0], // правая корма
    [0, -40, 0, 0, 35, 0], // центральная линия
    [-10, 0, 0, 10, 0, 0], // поперечина
  ],

  // Cruiser - сложная форма с несколькими секциями
  cruiser: [
    [0, -50, 0, 25, -20, 0],
    [0, -50, 0, -25, -20, 0],
    [-25, -20, 0, -25, 0, 0],
    [25, -20, 0, 25, 0, 0],
    [-25, 0, 0, -15, 30, 0],
    [25, 0, 0, 15, 30, 0],
    [-15, 30, 0, 0, 40, 0],
    [15, 30, 0, 0, 40, 0],
    // Дополнительные крылья
    [-25, -10, 0, -35, 10, 0],
    [25, -10, 0, 35, 10, 0],
    [-35, 10, 0, -25, 20, 0],
    [35, 10, 0, 25, 20, 0],
  ],

  // Battleship - массивный корабль
  battleship: [
    [0, -60, 0, 30, -30, 0],
    [0, -60, 0, -30, -30, 0],
    [-30, -30, 0, -30, 10, 0],
    [30, -30, 0, 30, 10, 0],
    [-30, 10, 0, -20, 40, 0],
    [30, 10, 0, 20, 40, 0],
    [-20, 40, 0, 0, 50, 0],
    [20, 40, 0, 0, 50, 0],
    // Башни
    [-15, -10, 0, -15, 5, 0],
    [15, -10, 0, 15, 5, 0],
    // Крылья
    [-40, -10, 0, -30, -5, 0],
    [40, -10, 0, 30, -5, 0],
  ],

  // Default - базовый корабль
  default: [
    [0, -25, 0, 12, 12, 0],
    [0, -25, 0, -12, 12, 0],
    [-12, 12, 0, 12, 12, 0],
    [0, -25, 0, 0, 25, 0],
  ],
};

const BattleScreenElite: React.FC<BattleScreenEliteProps> = ({
  battleLog,
  playerFleet,
  enemyFleet,
  winner,
  reward,
  onBattleEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerShips, setPlayerShips] = useState<ShipData[]>([]);
  const [enemyShips, setEnemyShips] = useState<ShipData[]>([]);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [battleActive, setBattleActive] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [lasers, setLasers] = useState<any[]>([]);
  const [explosions, setExplosions] = useState<any[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Инициализация флотов с параметрами для анимации
  useEffect(() => {
    const initShips = (fleet: any[], baseRotation: number): ShipData[] => {
      return fleet.map((ship, index) => ({
        id: ship.id,
        ship_type: ship.ship_type,
        current_hp: ship.current_hp,
        max_hp: ship.max_hp,
        attack: ship.attack,
        defense: ship.defense,
        speed: ship.speed,
        destroyed: ship.current_hp <= 0,
        rotation: baseRotation + (Math.random() - 0.5) * 30, // Случайное начальное вращение
        targetRotation: baseRotation,
        scale: 1.0,
      }));
    };

    setPlayerShips(initShips(playerFleet, 0)); // Игрок смотрит вверх
    setEnemyShips(initShips(enemyFleet, 180)); // Враг смотрит вниз
  }, [playerFleet, enemyFleet]);

  // Получить модель корабля по типу
  const getShipModel = (shipType: string): number[][] => {
    const type = shipType.split('_')[0].toLowerCase();
    return SHIP_MODELS[type] || SHIP_MODELS.default;
  };

  // Функция для проекции 3D точки в 2D (простая перспектива)
  const project3D = (x: number, y: number, z: number, rotation: number, scale: number = 1) => {
    // Поворот вокруг оси Z (yaw)
    const rad = (rotation * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    const x2 = x * cosR - y * sinR;
    const y2 = x * sinR + y * cosR;

    // Масштабирование
    return {
      x: x2 * scale,
      y: y2 * scale,
    };
  };

  // Отрисовка каркасного корабля
  const drawWireframeShip = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    ship: ShipData,
    color: string
  ) => {
    if (ship.destroyed) return;

    const model = getShipModel(ship.ship_type);
    const scale = ship.scale * 0.8; // Базовый масштаб

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // Рисуем все линии модели
    model.forEach(([x1, y1, z1, x2, y2, z2]) => {
      const p1 = project3D(x1, y1, z1, ship.rotation, scale);
      const p2 = project3D(x2, y2, z2, ship.rotation, scale);

      ctx.beginPath();
      ctx.moveTo(x + p1.x, y + p1.y);
      ctx.lineTo(x + p2.x, y + p2.y);
      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    // HP бар над кораблем
    const barWidth = 50;
    const barHeight = 4;
    const barX = x - barWidth / 2;
    const barY = y - 50;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpPercent = ship.current_hp / ship.max_hp;
    ctx.fillStyle = hpPercent > 0.5 ? '#00ff88' : hpPercent > 0.25 ? '#ffaa00' : '#ff3333';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
  };

  // Отрисовка лазера
  const drawLaser = (ctx: CanvasRenderingContext2D, laser: any) => {
    const progress = laser.progress;

    if (progress >= 1) return;

    const x = laser.fromX + (laser.toX - laser.fromX) * progress;
    const y = laser.fromY + (laser.toY - laser.fromY) * progress;

    // Основной луч
    ctx.strokeStyle = laser.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = laser.color;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(laser.fromX, laser.fromY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Яркая точка на конце
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  };

  // Отрисовка взрыва
  const drawExplosion = (ctx: CanvasRenderingContext2D, explosion: any) => {
    const progress = explosion.progress;

    if (progress >= 1) return;

    const x = explosion.x;
    const y = explosion.y;
    const radius = 30 * progress;
    const alpha = 1 - progress;

    // Внешнее кольцо
    ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Внутреннее свечение
    ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Искры
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const sparkDist = radius * 1.2;
      const sparkX = x + Math.cos(angle) * sparkDist;
      const sparkY = y + Math.sin(angle) * sparkDist;

      ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  };

  // Главный цикл отрисовки
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Очистка с эффектом звездного неба
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Звезды (статичные точки)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 73) % width; // Псевдослучайное распределение
      const y = (i * 137) % height;
      const size = (i % 3) * 0.5 + 0.5;
      ctx.fillRect(x, y, size, size);
    }

    // Плавное вращение кораблей к целевому углу
    const updateRotation = (ships: ShipData[]) => {
      return ships.map(ship => {
        if (ship.destroyed) return ship;

        const diff = ship.targetRotation - ship.rotation;
        const step = diff * 0.1; // Плавное вращение

        return {
          ...ship,
          rotation: ship.rotation + step,
        };
      });
    };

    setPlayerShips(prev => updateRotation(prev));
    setEnemyShips(prev => updateRotation(prev));

    // Отрисовка кораблей игрока (внизу)
    const playerY = height - 150;
    playerShips.forEach((ship, index) => {
      const x = (width / (playerShips.length + 1)) * (index + 1);
      drawWireframeShip(ctx, x, playerY, ship, '#00bfff');
    });

    // Отрисовка кораблей врага (вверху)
    const enemyY = 150;
    enemyShips.forEach((ship, index) => {
      const x = (width / (enemyShips.length + 1)) * (index + 1);
      drawWireframeShip(ctx, x, enemyY, ship, '#ff4444');
    });

    // Отрисовка лазеров
    lasers.forEach(laser => drawLaser(ctx, laser));

    // Отрисовка взрывов
    explosions.forEach(explosion => drawExplosion(ctx, explosion));

    // Обновление прогресса анимаций
    setLasers(prev =>
      prev
        .map(l => ({ ...l, progress: l.progress + 0.05 }))
        .filter(l => l.progress < 1)
    );

    setExplosions(prev =>
      prev
        .map(e => ({ ...e, progress: e.progress + 0.04 }))
        .filter(e => e.progress < 1)
    );

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  // Запуск анимационного цикла
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playerShips, enemyShips, lasers, explosions]);

  // Получить позицию корабля на канвасе
  const getShipPosition = (fleet: ShipData[], shipId: number | string, isPlayer: boolean) => {
    const index = fleet.findIndex(s => s.id === shipId);
    if (index === -1) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;

    const x = (canvas.width / (fleet.length + 1)) * (index + 1);
    const y = isPlayer ? canvas.height - 150 : 150;

    return { x, y };
  };

  // Воспроизведение боя
  useEffect(() => {
    if (!battleActive || currentActionIndex >= battleLog.length) {
      if (currentActionIndex >= battleLog.length && battleActive) {
        setBattleActive(false);
        setTimeout(() => setShowResult(true), 2000);
      }
      return;
    }

    const action = battleLog[currentActionIndex];

    const timer = setTimeout(() => {
      // Обновляем HP и добавляем вращение при попадании
      if (action.target.fleet === 1) {
        setPlayerShips(prev =>
          prev.map(ship =>
            ship.id === action.target.shipId
              ? {
                  ...ship,
                  current_hp: action.targetRemainingHP,
                  destroyed: action.isKill,
                  targetRotation: ship.targetRotation + (action.isCrit ? 60 : 30), // Поворот при попадании
                  scale: action.isCrit ? 0.8 : 0.9, // Эффект сжатия
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
                  destroyed: action.isKill,
                  targetRotation: ship.targetRotation - (action.isCrit ? 60 : 30),
                  scale: action.isCrit ? 0.8 : 0.9,
                }
              : ship
          )
        );
      }

      // Восстанавливаем масштаб через 200мс
      setTimeout(() => {
        const resetScale = (ships: ShipData[]) =>
          ships.map(s => s.id === action.target.shipId ? { ...s, scale: 1.0 } : s);

        if (action.target.fleet === 1) {
          setPlayerShips(prev => resetScale(prev));
        } else {
          setEnemyShips(prev => resetScale(prev));
        }
      }, 200);

      // Создаем лазер
      const attackerFleet = action.attacker.fleet === 1 ? playerShips : enemyShips;
      const targetFleet = action.target.fleet === 1 ? playerShips : enemyShips;

      const fromPos = getShipPosition(attackerFleet, action.attacker.shipId, action.attacker.fleet === 1);
      const toPos = getShipPosition(targetFleet, action.target.shipId, action.target.fleet === 1);

      if (fromPos && toPos) {
        setLasers(prev => [
          ...prev,
          {
            fromX: fromPos.x,
            fromY: fromPos.y,
            toX: toPos.x,
            toY: toPos.y,
            progress: 0,
            color: action.attacker.fleet === 1 ? '#00ffff' : '#ff0000',
          },
        ]);

        // Создаем взрыв после полета лазера
        setTimeout(() => {
          setExplosions(prev => [
            ...prev,
            {
              x: toPos.x,
              y: toPos.y,
              progress: 0,
            },
          ]);
        }, 600);
      }

      setCurrentActionIndex(prev => prev + 1);
    }, 1200); // 1.2 сек на действие

    return () => clearTimeout(timer);
  }, [battleActive, currentActionIndex, battleLog, playerShips, enemyShips]);

  return (
    <div className="elite-battle-container">
      <canvas ref={canvasRef} className="elite-canvas" />

      {/* HUD в стиле Elite */}
      <div className="elite-hud">
        <div className="elite-hud-top">
          <div className="elite-scanner">
            <div className="scanner-grid"></div>
            {playerShips.filter(s => !s.destroyed).map((_, i) => (
              <div key={i} className="scanner-dot player-dot" style={{ left: `${20 + i * 15}%`, top: '70%' }} />
            ))}
            {enemyShips.filter(s => !s.destroyed).map((_, i) => (
              <div key={i} className="scanner-dot enemy-dot" style={{ left: `${20 + i * 15}%`, top: '30%' }} />
            ))}
          </div>
          <div className="elite-status">
            <div className="status-line">BATTLE IN PROGRESS</div>
            <div className="status-line">ROUND: {currentActionIndex + 1} / {battleLog.length}</div>
          </div>
        </div>
      </div>

      {/* Результат боя */}
      {showResult && (
        <div className="elite-result-overlay">
          <div className="elite-result-box">
            <div className="elite-result-title">
              {winner === 1 ? '🏆 VICTORY 🏆' : '💀 DEFEAT 💀'}
            </div>
            <div className="elite-result-reward">
              REWARD: {reward} CS
            </div>
            <button className="elite-result-btn" onClick={onBattleEnd}>
              ← RETURN TO BASE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleScreenElite;
