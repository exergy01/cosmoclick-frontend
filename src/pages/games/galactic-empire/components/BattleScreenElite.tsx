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
  warpProgress?: number; // 0-1, прогресс warp-эффекта появления
}

interface BattleScreenEliteProps {
  battleLog: BattleAction[];
  playerFleet: any[];
  enemyFleet: any[];
  winner: number;
  reward: number;
  onBattleEnd: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'engine' | 'explosion' | 'debris';
}

type WeaponType = 'laser' | 'missile' | 'plasma' | 'projectile' | 'railgun';

interface Weapon {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  color: string;
  isCrit: boolean;
  type: WeaponType;
  // Для ракет
  rotation?: number;
  trailParticles?: {x: number, y: number, life: number}[];
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  pulsePhase: number;
}

interface ShieldImpact {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  radius: number;
  angle: number;
}

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
  const [currentRound, setCurrentRound] = useState(0);
  const [battleActive, setBattleActive] = useState(true);
  const [showResult, setShowResult] = useState(false);

  // Refs for animation (weapons system)
  const particlesRef = useRef<Particle[]>([]);
  const weaponsRef = useRef<Weapon[]>([]);
  const starsRef = useRef<{x: number, y: number, z: number, speed: number}[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const shieldImpactsRef = useRef<ShieldImpact[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // 📷 Тряска камеры (camera shake)
  const cameraShakeRef = useRef<{x: number, y: number, intensity: number}>({x: 0, y: 0, intensity: 0});

  const roundsData = useRef<BattleAction[][]>([]);

  // Инициализация
  useEffect(() => {
    // Группируем battleLog по раундам
    const grouped: Record<number, BattleAction[]> = {};
    battleLog.forEach(action => {
      if (!grouped[action.round]) {
        grouped[action.round] = [];
      }
      grouped[action.round].push(action);
    });
    roundsData.current = Object.values(grouped);

    // Инициализация кораблей
    setPlayerShips(
      playerFleet.map(s => ({
        id: s.id,
        ship_type: s.ship_type,
        current_hp: s.current_hp,
        max_hp: s.max_hp,
        attack: s.attack,
        defense: s.defense,
        speed: s.speed,
        destroyed: s.current_hp <= 0,
        warpProgress: 0, // 🌀 Начинаем с warp-эффекта
      }))
    );

    setEnemyShips(
      enemyFleet.map(s => ({
        id: s.id,
        ship_type: s.ship_type,
        current_hp: s.current_hp,
        max_hp: s.max_hp,
        attack: s.attack,
        defense: s.defense,
        speed: s.speed,
        destroyed: s.current_hp <= 0,
        warpProgress: 0, // 🌀 Начинаем с warp-эффекта
      }))
    );

    // Создаем звёзды для параллакса
    for (let i = 0; i < 200; i++) {
      starsRef.current.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        z: Math.random() * 1000,
        speed: Math.random() * 0.5 + 0.1,
      });
    }

    // 🌌 Создаем туманности (EVE стиль)
    const nebulaColors = [
      '#ff006680', // Красная
      '#00ff8880', // Зелёная
      '#0088ff80', // Синяя
      '#ff66ff80', // Пурпурная
      '#ffaa0080', // Оранжевая
    ];
    for (let i = 0; i < 5; i++) {
      nebulaeRef.current.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        radius: Math.random() * 200 + 150,
        color: nebulaColors[i % nebulaColors.length],
        opacity: Math.random() * 0.3 + 0.1,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }, [battleLog, playerFleet, enemyFleet]);

  // 🌀 Анимация warp-эффекта появления кораблей
  useEffect(() => {
    const warpInterval = setInterval(() => {
      setPlayerShips(prev =>
        prev.map(ship => ({
          ...ship,
          warpProgress: ship.warpProgress !== undefined && ship.warpProgress < 1
            ? Math.min(ship.warpProgress + 0.02, 1)
            : 1
        }))
      );

      setEnemyShips(prev =>
        prev.map(ship => ({
          ...ship,
          warpProgress: ship.warpProgress !== undefined && ship.warpProgress < 1
            ? Math.min(ship.warpProgress + 0.02, 1)
            : 1
        }))
      );
    }, 50); // Обновляем каждые 50мс

    return () => clearInterval(warpInterval);
  }, []);

  // Функция отрисовки корабля на Canvas
  const drawShip = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    ship: ShipData,
    isPlayer: boolean
  ) => {
    // 🌀 Warp-эффект появления
    const warpProg = ship.warpProgress !== undefined ? ship.warpProgress : 1;
    const isWarping = warpProg < 1;

    if (isWarping) {
      // Эффект растяжения и искажения
      ctx.save();
      ctx.translate(x, y);

      // Растягиваем корабль по горизонтали
      const stretchScale = 1 + (1 - warpProg) * 3;
      ctx.scale(stretchScale, 1);

      // Warp-линии за кораблем
      ctx.strokeStyle = isPlayer ? '#00bfff88' : '#ff444488';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const offsetX = -50 * (1 - warpProg) - i * 30;
        ctx.beginPath();
        ctx.moveTo(offsetX, -10 - i * 5);
        ctx.lineTo(offsetX - 30, -10 - i * 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(offsetX, 10 + i * 5);
        ctx.lineTo(offsetX - 30, 10 + i * 5);
        ctx.stroke();
      }

      ctx.restore();

      // Прозрачность растет с прогрессом
      ctx.globalAlpha = warpProg * 0.8;
    } else if (ship.destroyed) {
      ctx.globalAlpha = 0.3;
    }

    const shipClass = ship.ship_type.split('_')[0].toLowerCase();
    const color = isPlayer ? '#00bfff' : '#ff4444';
    const darkColor = isPlayer ? '#004466' : '#661111';
    const lightColor = isPlayer ? '#66ddff' : '#ff8888';
    const angle = isPlayer ? -Math.PI / 2 : Math.PI / 2; // Направление

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.sin(Date.now() * 0.001) * 0.1); // Легкое покачивание

    // Свечение вокруг корабля (bloom)
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    gradient.addColorStop(0, color + '88');
    gradient.addColorStop(0.5, color + '33');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.fillRect(-50, -50, 100, 100);

    // Рисуем корабль в зависимости от класса (EVE стиль)
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    if (shipClass === 'frigate') {
      // 🚀 Frigate - быстрый истребитель (EVE Punisher style)
      // Основной корпус с градиентом
      const bodyGrad = ctx.createLinearGradient(-10, 0, 20, 0);
      bodyGrad.addColorStop(0, darkColor);
      bodyGrad.addColorStop(0.5, color);
      bodyGrad.addColorStop(1, lightColor);
      ctx.fillStyle = bodyGrad;

      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Крылья с деталями
      ctx.fillStyle = color + '99';
      ctx.fillRect(-10, -12, 15, 3);
      ctx.fillRect(-10, 9, 15, 3);

      // Панели на крыльях
      ctx.fillStyle = lightColor;
      ctx.fillRect(-8, -11, 3, 1);
      ctx.fillRect(-8, 10, 3, 1);
      ctx.fillRect(0, -11, 3, 1);
      ctx.fillRect(0, 10, 3, 1);

      // Кабина со свечением
      ctx.fillStyle = isPlayer ? '#88ddff' : '#ffaa88';
      ctx.shadowColor = isPlayer ? '#88ddff' : '#ffaa88';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(5, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 15;

      // Двигатели с ярким свечением
      ctx.fillStyle = isPlayer ? '#00ffff' : '#ff6600';
      ctx.shadowColor = isPlayer ? '#00ffff' : '#ff6600';
      ctx.shadowBlur = 15;
      ctx.fillRect(-11, -4, 4, 2);
      ctx.fillRect(-11, 2, 4, 2);

    } else if (shipClass === 'destroyer') {
      // ⚔️ Destroyer - средний корабль (EVE Corax style)
      // Основной корпус с 3D эффектом
      const bodyGrad = ctx.createLinearGradient(-15, -6, -15, 6);
      bodyGrad.addColorStop(0, darkColor);
      bodyGrad.addColorStop(0.5, color);
      bodyGrad.addColorStop(1, darkColor);
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(-15, -6, 30, 12);

      // Нос корабля
      ctx.fillStyle = lightColor;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(25, -5);
      ctx.lineTo(25, 5);
      ctx.closePath();
      ctx.fill();

      // Детали на корпусе
      ctx.fillStyle = darkColor;
      ctx.fillRect(-10, -4, 4, 8);
      ctx.fillRect(2, -4, 4, 8);

      // Крылья с деталями
      ctx.fillStyle = color + '99';
      ctx.fillRect(-10, -15, 20, 4);
      ctx.fillRect(-10, 11, 20, 4);

      // Панели на крыльях
      ctx.fillStyle = lightColor;
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(-8 + i * 7, -14, 4, 2);
        ctx.fillRect(-8 + i * 7, 12, 4, 2);
      }

      // Кабина со свечением
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fillRect(5, -3, 6, 6);
      ctx.shadowBlur = 15;

      // Двигатели
      ctx.fillStyle = isPlayer ? '#00ffff' : '#ff6600';
      ctx.shadowColor = isPlayer ? '#00ffff' : '#ff6600';
      ctx.shadowBlur = 16;
      ctx.fillRect(-16, -4, 5, 2.5);
      ctx.fillRect(-16, 1.5, 5, 2.5);

      // Турели
      ctx.fillStyle = color;
      ctx.shadowBlur = 10;
      ctx.fillRect(8, -8, 5, 5);
      ctx.fillRect(8, 3, 5, 5);

    } else if (shipClass === 'cruiser') {
      // 🛡️ Cruiser - тяжелый крейсер (EVE Moa style)
      // Основной корпус с металлическим эффектом
      const bodyGrad = ctx.createLinearGradient(-20, -8, -20, 8);
      bodyGrad.addColorStop(0, darkColor);
      bodyGrad.addColorStop(0.3, color);
      bodyGrad.addColorStop(0.5, lightColor);
      bodyGrad.addColorStop(0.7, color);
      bodyGrad.addColorStop(1, darkColor);
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(-20, -8, 40, 16);

      // Нос корабля
      ctx.fillStyle = lightColor;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(30, -6);
      ctx.lineTo(30, 6);
      ctx.closePath();
      ctx.fill();

      // Детали корпуса
      ctx.fillStyle = darkColor;
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-15 + i * 10, -6, 6, 12);
      }

      // Большие крылья с панелями
      ctx.fillStyle = color + '99';
      ctx.fillRect(-15, -18, 30, 5);
      ctx.fillRect(-15, 13, 30, 5);

      // Детали на крыльях
      ctx.fillStyle = lightColor;
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(-12 + i * 7, -17, 4, 3);
        ctx.fillRect(-12 + i * 7, 14, 4, 3);
      }

      // Башни с деталями
      ctx.fillStyle = color;
      ctx.fillRect(-10, -5, 8, 10);
      ctx.fillRect(10, -5, 8, 10);

      // Стволы орудий со свечением
      ctx.fillStyle = lightColor;
      ctx.shadowBlur = 12;
      ctx.fillRect(-10, -2, 11, 1.5);
      ctx.fillRect(-10, 0.5, 11, 1.5);
      ctx.fillRect(10, -2, 11, 1.5);
      ctx.fillRect(10, 0.5, 11, 1.5);

      // Мостик
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 14;
      ctx.fillRect(0, -4, 8, 8);
      ctx.shadowBlur = 15;

      // Мощные двигатели
      ctx.fillStyle = isPlayer ? '#00ffff' : '#ff6600';
      ctx.shadowColor = isPlayer ? '#00ffff' : '#ff6600';
      ctx.shadowBlur = 20;
      ctx.fillRect(-21, -6, 6, 3);
      ctx.fillRect(-21, 3, 6, 3);

    } else if (shipClass === 'battleship') {
      // ⚡ Battleship - массивный линкор (EVE Raven style)
      // Основной корпус с массивным эффектом
      const bodyGrad = ctx.createLinearGradient(-25, -10, -25, 10);
      bodyGrad.addColorStop(0, darkColor);
      bodyGrad.addColorStop(0.2, color);
      bodyGrad.addColorStop(0.5, lightColor);
      bodyGrad.addColorStop(0.8, color);
      bodyGrad.addColorStop(1, darkColor);
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(-25, -10, 50, 20);

      // Нос корабля
      ctx.fillStyle = lightColor;
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(35, -8);
      ctx.lineTo(35, 8);
      ctx.closePath();
      ctx.fill();

      // Детали корпуса
      ctx.fillStyle = darkColor;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(-20 + i * 8, -8, 5, 16);
      }

      // Массивные крылья с бронёй
      ctx.fillStyle = color + '99';
      ctx.fillRect(-20, -22, 40, 6);
      ctx.fillRect(-20, 16, 40, 6);

      // Броневые пластины
      ctx.fillStyle = lightColor;
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(-18 + i * 6, -21, 4, 4);
        ctx.fillRect(-18 + i * 6, 17, 4, 4);
      }

      // Множество башен с деталями
      ctx.fillStyle = color;
      ctx.shadowBlur = 12;
      ctx.fillRect(-18, -6, 10, 12);
      ctx.fillRect(-5, -6, 10, 12);
      ctx.fillRect(8, -6, 10, 12);

      // Орудийные стволы
      ctx.fillStyle = lightColor;
      ctx.shadowBlur = 14;
      ctx.fillRect(-18, -3, 13, 2);
      ctx.fillRect(-18, 1, 13, 2);
      ctx.fillRect(-5, -3, 13, 2);
      ctx.fillRect(-5, 1, 13, 2);
      ctx.fillRect(8, -3, 13, 2);
      ctx.fillRect(8, 1, 13, 2);

      // Командный центр
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 16;
      ctx.fillRect(-3, -5, 12, 10);
      ctx.shadowBlur = 15;

      // Огромные двигатели
      ctx.fillStyle = isPlayer ? '#00ffff' : '#ff6600';
      ctx.shadowColor = isPlayer ? '#00ffff' : '#ff6600';
      ctx.shadowBlur = 24;
      ctx.fillRect(-26, -8, 7, 4);
      ctx.fillRect(-26, 4, 7, 4);

      // Дополнительные детали - антенны
      ctx.strokeStyle = lightColor;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-15, -14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(5, -14);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    // HP бар
    const barWidth = 60;
    const barHeight = 6;
    const barX = x - barWidth / 2;
    const barY = y + 35;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const hpPercent = ship.current_hp / ship.max_hp;
    const hpColor = hpPercent > 0.5 ? '#00ff88' : hpPercent > 0.25 ? '#ffaa00' : '#ff3333';
    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    ctx.shadowBlur = 0;
  };

  // 🔥 Добавить продвинутые частицы двигателя (EVE стиль с дымкой)
  const addEngineParticles = (x: number, y: number, isPlayer: boolean) => {
    const color = isPlayer ? '#00ffff' : '#ff6600';
    const smokeColor = isPlayer ? '#0088aa' : '#884400';
    const angle = isPlayer ? Math.PI / 2 : -Math.PI / 2;

    // 1. Яркое ядро - самые горячие частицы
    for (let i = 0; i < 2; i++) {
      const spread = (Math.random() - 0.5) * 8;
      const speedVar = Math.random() * 2 + 2.5;

      particlesRef.current.push({
        x: x + spread,
        y: y,
        vx: Math.cos(angle) * speedVar + (Math.random() - 0.5) * 0.3,
        vy: Math.sin(angle) * speedVar + (Math.random() - 0.5) * 0.3,
        life: 35 + Math.random() * 15,
        maxLife: 50,
        size: Math.random() * 5 + 4, // Крупнее
        color,
        type: 'engine',
      });
    }

    // 2. Средний слой - тёплые частицы с турбулентностью
    for (let i = 0; i < 3; i++) {
      const spread = (Math.random() - 0.5) * 18;
      const speedVar = Math.random() * 1.5 + 1.5;

      particlesRef.current.push({
        x: x + spread,
        y: y + (Math.random() - 0.5) * 5,
        vx: Math.cos(angle) * speedVar + (Math.random() - 0.5) * 0.8, // Больше турбулентность
        vy: Math.sin(angle) * speedVar + (Math.random() - 0.5) * 0.8,
        life: 50 + Math.random() * 30, // Дольше живут
        maxLife: 80,
        size: Math.random() * 4 + 3,
        color: isPlayer ? '#66ddff' : '#ffaa44',
        type: 'engine',
      });
    }

    // 3. Дымка - большие рассеивающиеся частицы
    if (Math.random() > 0.3) {
      for (let i = 0; i < 2; i++) {
        const spread = (Math.random() - 0.5) * 25;
        const speedVar = Math.random() * 1 + 0.8;

        particlesRef.current.push({
          x: x + spread,
          y: y + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speedVar + (Math.random() - 0.5) * 1.2, // Много турбулентности
          vy: Math.sin(angle) * speedVar + (Math.random() - 0.5) * 1.2,
          life: 70 + Math.random() * 40, // Очень долго
          maxLife: 110,
          size: Math.random() * 7 + 5, // Большие
          color: smokeColor + '44', // Полупрозрачные
          type: 'engine',
        });
      }
    }

    // 4. Мелкие яркие искры
    if (Math.random() > 0.6) {
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 12,
          vx: Math.cos(angle) * (Math.random() * 1.5 + 0.5) + (Math.random() - 0.5) * 2,
          vy: Math.sin(angle) * (Math.random() * 1.5 + 0.5) + (Math.random() - 0.5) * 2,
          life: 20 + Math.random() * 15,
          maxLife: 35,
          size: Math.random() * 2 + 1,
          color: '#ffffff', // Белые искры
          type: 'engine',
        });
      }
    }
  };

  // 📷 Тряска камеры при взрывах
  const shakeCamera = (intensity: number) => {
    cameraShakeRef.current.intensity = intensity;
  };

  // 💥 Создать мощный взрыв с тряской камеры
  const createExplosion = (x: number, y: number, isCrit: boolean, isKill: boolean = false) => {
    const count = isCrit ? 50 : 30;
    const colors = ['#ff6600', '#ff9900', '#ffcc00', '#ff3300', '#ffffff'];

    // Тряска камеры при взрыве
    if (isCrit) {
      shakeCamera(15); // Сильная тряска при крите
    } else if (isKill) {
      shakeCamera(20); // Очень сильная тряска при уничтожении
    } else {
      shakeCamera(8); // Обычная тряска
    }

    // Основной взрыв
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = Math.random() * 6 + 3;

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60 + Math.random() * 30,
        maxLife: 90,
        size: Math.random() * 4 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'explosion',
      });
    }

    // Осколки обломков
    const debrisCount = isKill ? 20 : 10;
    for (let i = 0; i < debrisCount; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 50 + Math.random() * 30,
        maxLife: 80,
        size: Math.random() * 3 + 1,
        color: '#666666',
        type: 'debris',
      });
    }

    // Дополнительная ударная волна при крите или убийстве
    if (isCrit || isKill) {
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * 10,
          vy: Math.sin(angle) * 10,
          life: 30,
          maxLife: 30,
          size: 6,
          color: '#ffffff88',
          type: 'explosion',
        });
      }
    }
  };

  // 🛡️ Создать эффект щита при попадании (EVE стиль)
  const createShieldImpact = (x: number, y: number) => {
    const impactAngle = Math.random() * Math.PI * 2;
    shieldImpactsRef.current.push({
      x,
      y,
      life: 30,
      maxLife: 30,
      radius: 60,
      angle: impactAngle,
    });
  };

  // 🎯 Определить тип оружия по типу корабля
  const getWeaponType = (shipType: string): WeaponType => {
    const shipClass = shipType.split('_')[0].toLowerCase();

    switch (shipClass) {
      case 'frigate':
        return 'laser';      // Фрегаты = быстрые лазеры
      case 'destroyer':
        return 'railgun';    // Эсминцы = рельсы (мгновенные лучи)
      case 'cruiser':
        return 'plasma';     // Крейсеры = плазма (толстые сгустки)
      case 'battleship':
        return 'projectile'; // Линкоры = снаряды (баллистика)
      default:
        return 'laser';
    }
  };

  // Главный цикл отрисовки
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Очистка
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, width, height);

    // 📷 Применяем тряску камеры
    if (cameraShakeRef.current.intensity > 0) {
      // Генерируем случайное смещение
      cameraShakeRef.current.x = (Math.random() - 0.5) * cameraShakeRef.current.intensity;
      cameraShakeRef.current.y = (Math.random() - 0.5) * cameraShakeRef.current.intensity;

      // Плавно уменьшаем интенсивность
      cameraShakeRef.current.intensity *= 0.9;

      // Останавливаем тряску, если она стала слабой
      if (cameraShakeRef.current.intensity < 0.1) {
        cameraShakeRef.current.intensity = 0;
        cameraShakeRef.current.x = 0;
        cameraShakeRef.current.y = 0;
      }

      // Применяем смещение к контексту
      ctx.save();
      ctx.translate(cameraShakeRef.current.x, cameraShakeRef.current.y);
    }

    // Звёзды с параллаксом
    ctx.fillStyle = '#ffffff';
    starsRef.current.forEach(star => {
      star.z -= star.speed;
      if (star.z <= 0) {
        star.z = 1000;
        star.x = Math.random() * 2000 - 1000;
        star.y = Math.random() * 2000 - 1000;
      }

      const sx = (star.x / star.z) * 200 + width / 2;
      const sy = (star.y / star.z) * 200 + height / 2;
      const size = (1000 - star.z) / 1000 * 2;

      if (sx > 0 && sx < width && sy > 0 && sy < height) {
        ctx.fillRect(sx, sy, size, size);
      }
    });

    // 🌌 Рисуем туманности с пульсацией (EVE стиль)
    const time = Date.now() * 0.001;
    nebulaeRef.current.forEach(nebula => {
      const pulse = Math.sin(time * 0.5 + nebula.pulsePhase) * 0.1 + 0.9;
      const radius = nebula.radius * pulse;

      // Создаем радиальный градиент для bloom эффекта
      const gradient = ctx.createRadialGradient(
        nebula.x, nebula.y, 0,
        nebula.x, nebula.y, radius
      );
      gradient.addColorStop(0, nebula.color);
      gradient.addColorStop(0.5, nebula.color.replace('80', '40'));
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.globalAlpha = nebula.opacity * pulse;
      ctx.beginPath();
      ctx.arc(nebula.x, nebula.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Получить позицию корабля
    const getShipPos = (fleet: ShipData[], index: number, isPlayer: boolean) => {
      const shipCount = fleet.length;
      const spacing = width / (shipCount + 1);
      const x = spacing * (index + 1);
      const y = isPlayer ? height - 150 : 150;
      return { x, y };
    };

    // Рисуем корабли игрока
    playerShips.forEach((ship, index) => {
      const pos = getShipPos(playerShips, index, true);
      drawShip(ctx, pos.x, pos.y, ship, true);
      if (!ship.destroyed) {
        addEngineParticles(pos.x, pos.y, true);
      }
    });

    // Рисуем корабли врага
    enemyShips.forEach((ship, index) => {
      const pos = getShipPos(enemyShips, index, false);
      drawShip(ctx, pos.x, pos.y, ship, false);
      if (!ship.destroyed) {
        addEngineParticles(pos.x, pos.y, false);
      }
    });

    // 🎯 Рисуем оружие (разные типы)
    weaponsRef.current.forEach((weapon, idx) => {
      const speed = weapon.type === 'railgun' ? 0.15 : weapon.type === 'missile' ? 0.03 : 0.05;
      weapon.progress += speed;

      if (weapon.progress < 1) {
        const x = weapon.fromX + (weapon.toX - weapon.fromX) * weapon.progress;
        const y = weapon.fromY + (weapon.toY - weapon.fromY) * weapon.progress;

        ctx.save();

        // Отрисовка в зависимости от типа оружия
        switch (weapon.type) {
          case 'laser': {
            // 🔵 Лазер - тонкий яркий луч
            const gradient = ctx.createLinearGradient(weapon.fromX, weapon.fromY, x, y);
            gradient.addColorStop(0, weapon.color + '00');
            gradient.addColorStop(0.5, weapon.color);
            gradient.addColorStop(1, weapon.color);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = weapon.isCrit ? 4 : 2;
            ctx.shadowColor = weapon.color;
            ctx.shadowBlur = weapon.isCrit ? 20 : 12;

            ctx.beginPath();
            ctx.moveTo(weapon.fromX, weapon.fromY);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Яркая точка на конце
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(x, y, weapon.isCrit ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case 'railgun': {
            // ⚡ Рельса - мгновенный толстый луч с электрическими разрядами
            ctx.strokeStyle = weapon.color;
            ctx.lineWidth = weapon.isCrit ? 8 : 5;
            ctx.shadowColor = weapon.color;
            ctx.shadowBlur = 30;

            // Основной луч
            ctx.beginPath();
            ctx.moveTo(weapon.fromX, weapon.fromY);
            ctx.lineTo(weapon.toX, weapon.toY);
            ctx.stroke();

            // Электрические разряды
            for (let i = 0; i < 3; i++) {
              const t = Math.random();
              const px = weapon.fromX + (weapon.toX - weapon.fromX) * t;
              const py = weapon.fromY + (weapon.toY - weapon.fromY) * t;
              const offset = (Math.random() - 0.5) * 20;
              const angle = Math.atan2(weapon.toY - weapon.fromY, weapon.toX - weapon.fromX) + Math.PI / 2;

              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px + Math.cos(angle) * offset, py + Math.sin(angle) * offset);
              ctx.stroke();
            }

            // Яркая вспышка на конце
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.arc(x, y, weapon.isCrit ? 10 : 7, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case 'plasma': {
            // 🟢 Плазма - толстый светящийся сгусток
            const plasmaGradient = ctx.createRadialGradient(x, y, 0, x, y, weapon.isCrit ? 15 : 10);
            plasmaGradient.addColorStop(0, '#ffffff');
            plasmaGradient.addColorStop(0.3, weapon.color);
            plasmaGradient.addColorStop(1, weapon.color + '00');

            ctx.fillStyle = plasmaGradient;
            ctx.shadowColor = weapon.color;
            ctx.shadowBlur = weapon.isCrit ? 35 : 25;

            ctx.beginPath();
            ctx.arc(x, y, weapon.isCrit ? 12 : 8, 0, Math.PI * 2);
            ctx.fill();

            // Внутреннее ядро
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(x, y, weapon.isCrit ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();

            // След плазмы
            for (let i = 1; i < 5; i++) {
              const trailT = weapon.progress - i * 0.05;
              if (trailT > 0) {
                const tx = weapon.fromX + (weapon.toX - weapon.fromX) * trailT;
                const ty = weapon.fromY + (weapon.toY - weapon.fromY) * trailT;
                const trailAlpha = 0.3 * (1 - i / 5);

                ctx.fillStyle = weapon.color + Math.floor(trailAlpha * 255).toString(16).padStart(2, '0');
                ctx.beginPath();
                ctx.arc(tx, ty, (weapon.isCrit ? 10 : 6) * (1 - i / 5), 0, Math.PI * 2);
                ctx.fill();
              }
            }
            break;
          }

          case 'projectile': {
            // 🔴 Снаряд - физический объект с трассером
            const angle = Math.atan2(weapon.toY - weapon.fromY, weapon.toX - weapon.fromX);

            // Снаряд
            ctx.fillStyle = weapon.color;
            ctx.shadowColor = weapon.color;
            ctx.shadowBlur = 15;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // Тело снаряда
            ctx.fillRect(-6, -3, 12, 6);

            // Острый нос
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(10, -4);
            ctx.lineTo(10, 4);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            // Огненный след
            for (let i = 1; i < 8; i++) {
              const trailT = weapon.progress - i * 0.02;
              if (trailT > 0 && trailT < 1) {
                const tx = weapon.fromX + (weapon.toX - weapon.fromX) * trailT;
                const ty = weapon.fromY + (weapon.toY - weapon.fromY) * trailT;
                const trailAlpha = 0.5 * (1 - i / 8);
                const trailColors = ['#ffaa00', '#ff6600', '#ff3300'];
                const color = trailColors[i % trailColors.length];

                ctx.fillStyle = color + Math.floor(trailAlpha * 255).toString(16).padStart(2, '0');
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(tx, ty, 4 * (1 - i / 8), 0, Math.PI * 2);
                ctx.fill();
              }
            }
            break;
          }
        }

        ctx.restore();
        ctx.shadowBlur = 0;
      }
    });

    // Удаляем завершённое оружие
    weaponsRef.current = weaponsRef.current.filter(w => w.progress < 1);

    // 🛡️ Рисуем эффекты щитов (EVE стиль)
    shieldImpactsRef.current.forEach(impact => {
      impact.life--;
      const alpha = impact.life / impact.maxLife;
      const radius = impact.radius * (1 + (1 - alpha) * 0.5);

      // Внешний bloom
      const gradient = ctx.createRadialGradient(impact.x, impact.y, 0, impact.x, impact.y, radius);
      gradient.addColorStop(0, `rgba(0, 150, 255, ${alpha * 0.6})`);
      gradient.addColorStop(0.5, `rgba(100, 200, 255, ${alpha * 0.3})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(impact.x, impact.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Шестиугольный контур щита
      ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + impact.angle;
        const x = impact.x + Math.cos(angle) * radius * 0.8;
        const y = impact.y + Math.sin(angle) * radius * 0.8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Удаляем завершённые эффекты щитов
    shieldImpactsRef.current = shieldImpactsRef.current.filter(s => s.life > 0);

    // Рисуем и обновляем частицы
    particlesRef.current.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;

      if (p.type === 'explosion') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    // Удаляем мёртвые частицы
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // 🎯 Рисуем HUD с радаром (EVE стиль) - ПОВЕРХ ВСЕГО, БЕЗ ТРЯСКИ
    // Восстанавливаем контекст перед HUD, чтобы HUD не трясло
    if (cameraShakeRef.current.intensity > 0 || cameraShakeRef.current.x !== 0 || cameraShakeRef.current.y !== 0) {
      ctx.restore();
    }

    // === RADAR (Радар в правом нижнем углу) ===
    const radarSize = 180;
    const radarX = width - radarSize - 20;
    const radarY = height - radarSize - 20;

    // Фон радара
    ctx.fillStyle = 'rgba(0, 15, 30, 0.8)';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(radarX + radarSize / 2, radarY + radarSize / 2, radarSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Сетка радара
    ctx.strokeStyle = '#00ffff33';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(radarX + radarSize / 2, radarY + radarSize / 2, (radarSize / 2) * (i / 3), 0, Math.PI * 2);
      ctx.stroke();
    }
    // Перекрестие
    ctx.beginPath();
    ctx.moveTo(radarX, radarY + radarSize / 2);
    ctx.lineTo(radarX + radarSize, radarY + radarSize / 2);
    ctx.moveTo(radarX + radarSize / 2, radarY);
    ctx.lineTo(radarX + radarSize / 2, radarY + radarSize);
    ctx.stroke();

    // Отображаем корабли игрока на радаре (синие точки)
    playerShips.forEach(ship => {
      if (!ship.destroyed) {
        const radarPx = radarX + radarSize / 2 + (Math.random() - 0.5) * radarSize * 0.3;
        const radarPy = radarY + radarSize * 0.7;
        ctx.fillStyle = '#00bfff';
        ctx.shadowColor = '#00bfff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(radarPx, radarPy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Отображаем корабли врага на радаре (красные точки)
    enemyShips.forEach(ship => {
      if (!ship.destroyed) {
        const radarEx = radarX + radarSize / 2 + (Math.random() - 0.5) * radarSize * 0.3;
        const radarEy = radarY + radarSize * 0.3;
        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(radarEx, radarEy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Анимированное сканирование радара
    const scanAngle = (Date.now() * 0.002) % (Math.PI * 2);
    ctx.strokeStyle = '#00ffff44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(radarX + radarSize / 2, radarY + radarSize / 2);
    ctx.lineTo(
      radarX + radarSize / 2 + Math.cos(scanAngle) * radarSize / 2,
      radarY + radarSize / 2 + Math.sin(scanAngle) * radarSize / 2
    );
    ctx.stroke();

    // Надпись "RADAR"
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('RADAR', radarX + radarSize / 2 - 25, radarY - 5);

    // === BATTLE INFO (Информация о бое слева сверху) ===
    ctx.fillStyle = 'rgba(0, 15, 30, 0.7)';
    ctx.fillRect(10, 10, 250, 120);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 250, 120);

    // Заголовок
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('⚔️ BATTLE STATUS', 20, 35);

    // Статистика
    const alivePlayer = playerShips.filter(s => !s.destroyed).length;
    const aliveEnemy = enemyShips.filter(s => !s.destroyed).length;
    const totalPlayer = playerShips.length;
    const totalEnemy = enemyShips.length;

    ctx.font = '14px monospace';
    ctx.fillStyle = '#00bfff';
    ctx.fillText(`🔵 FRIENDLY: ${alivePlayer}/${totalPlayer}`, 20, 60);

    ctx.fillStyle = '#ff4444';
    ctx.fillText(`🔴 HOSTILE:  ${aliveEnemy}/${totalEnemy}`, 20, 85);

    ctx.fillStyle = '#00ff88';
    ctx.fillText(`⚡ ROUND: ${currentRound + 1}`, 20, 110);

    // === DAMAGE STATS (Панель статистики урона справа сверху) ===
    const statsX = width - 280;
    const statsY = 10;

    ctx.fillStyle = 'rgba(0, 15, 30, 0.7)';
    ctx.fillRect(statsX, statsY, 270, 150);
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 2;
    ctx.strokeRect(statsX, statsY, 270, 150);

    // Заголовок
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('📊 COMBAT LOG', statsX + 10, statsY + 25);

    // Подсчитываем статистику из текущего раунда
    const currentRoundActions = roundsData.current[currentRound] || [];
    const totalDamage = currentRoundActions.reduce((sum, action) => sum + action.damage, 0);
    const critHits = currentRoundActions.filter(a => a.isCrit).length;
    const kills = currentRoundActions.filter(a => a.isKill).length;
    const totalShots = currentRoundActions.length;

    ctx.font = '13px monospace';
    ctx.fillStyle = '#ffaa00';
    ctx.fillText(`💥 TOTAL DMG: ${totalDamage}`, statsX + 10, statsY + 55);

    ctx.fillStyle = '#ff00ff';
    ctx.fillText(`⚡ CRITS: ${critHits}/${totalShots}`, statsX + 10, statsY + 80);

    ctx.fillStyle = '#ff3333';
    ctx.fillText(`💀 KILLS: ${kills}`, statsX + 10, statsY + 105);

    // Точность (примерная)
    const accuracy = totalShots > 0 ? 100 : 0;
    ctx.fillStyle = '#00ff88';
    ctx.fillText(`🎯 ACCURACY: ${accuracy}%`, statsX + 10, statsY + 130);

    animationFrameRef.current = requestAnimationFrame(draw);
  };

  // Запуск анимации
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    draw();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playerShips, enemyShips]);

  // Воспроизведение раундов
  useEffect(() => {
    if (!battleActive || currentRound >= roundsData.current.length) {
      if (currentRound >= roundsData.current.length && battleActive) {
        setBattleActive(false);
        setTimeout(() => setShowResult(true), 2000);
      }
      return;
    }

    const roundActions = roundsData.current[currentRound];

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const width = canvas.width;
      const height = canvas.height;

      const getShipPos = (fleet: ShipData[], index: number, isPlayer: boolean) => {
        const shipCount = fleet.length;
        const spacing = width / (shipCount + 1);
        const x = spacing * (index + 1);
        const y = isPlayer ? height - 150 : 150;
        return { x, y };
      };

      // 🎯 Создаем оружие в зависимости от типа корабля
      roundActions.forEach(action => {
        const attackerFleet = action.attacker.fleet === 1 ? playerShips : enemyShips;
        const targetFleet = action.target.fleet === 1 ? playerShips : enemyShips;

        const fromPos = getShipPos(attackerFleet, action.attacker.index, action.attacker.fleet === 1);
        const toPos = getShipPos(targetFleet, action.target.index, action.target.fleet === 1);

        // Определяем тип оружия по типу атакующего корабля
        const attackerShip = attackerFleet[action.attacker.index];
        const weaponType = getWeaponType(attackerShip.ship_type);

        // Цвета для разных типов оружия
        let weaponColor = action.attacker.fleet === 1 ? '#00ffff' : '#ff0000';
        if (weaponType === 'plasma') weaponColor = action.attacker.fleet === 1 ? '#00ff88' : '#ff6600';
        if (weaponType === 'railgun') weaponColor = action.attacker.fleet === 1 ? '#88ddff' : '#ff8844';
        if (action.isCrit) weaponColor = '#ff00ff';

        weaponsRef.current.push({
          fromX: fromPos.x,
          fromY: fromPos.y,
          toX: toPos.x,
          toY: toPos.y,
          progress: 0,
          color: weaponColor,
          isCrit: action.isCrit,
          type: weaponType,
        });
      });

      // Применяем урон и взрывы через 600мс
      setTimeout(() => {
        roundActions.forEach(action => {
          const targetFleet = action.target.fleet === 1 ? playerShips : enemyShips;
          const toPos = getShipPos(targetFleet, action.target.index, action.target.fleet === 1);

          // 🛡️ Сначала эффект щита
          createShieldImpact(toPos.x, toPos.y);
          // Затем взрыв с тряской камеры
          createExplosion(toPos.x, toPos.y, action.isCrit, action.isKill);

          if (action.target.fleet === 1) {
            setPlayerShips(prev =>
              prev.map(ship =>
                ship.id === action.target.shipId
                  ? {
                      ...ship,
                      current_hp: action.targetRemainingHP,
                      destroyed: action.isKill,
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
                    }
                  : ship
              )
            );
          }
        });
      }, 600);

      setCurrentRound(prev => prev + 1);
    }, 1500); // 1.5 сек на раунд

    return () => clearTimeout(timer);
  }, [battleActive, currentRound, playerShips, enemyShips]);

  return (
    <div className="elite-battle-container">
      <canvas ref={canvasRef} className="battle-canvas" />

      {/* HUD */}
      <div className="elite-hud">
        <div className="elite-hud-top">
          <div className="elite-status">
            <div className="status-line">⚔️ GALACTIC BATTLE</div>
            <div className="status-line">
              ROUND: {currentRound + 1} / {roundsData.current.length}
            </div>
            <div className="status-line">
              🔵 PLAYER: {playerShips.filter(s => !s.destroyed).length} / {playerShips.length}
            </div>
            <div className="status-line">
              🔴 ENEMY: {enemyShips.filter(s => !s.destroyed).length} / {enemyShips.length}
            </div>
          </div>
        </div>
      </div>

      {/* Результат */}
      {showResult && (
        <div className="elite-result-overlay">
          <div className="elite-result-box">
            <div className="elite-result-title">
              {winner === 1 ? '🏆 VICTORY 🏆' : '💀 DEFEAT 💀'}
            </div>
            <div className="elite-result-reward">REWARD: {reward} CS</div>
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
