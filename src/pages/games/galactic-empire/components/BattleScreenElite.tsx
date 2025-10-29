import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
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
}

interface BattleScreenEliteProps {
  battleLog: BattleAction[];
  playerFleet: any[];
  enemyFleet: any[];
  winner: number;
  reward: number;
  onBattleEnd: () => void;
}

// Создание 3D модели корабля из геометрии
const createShipMesh = (type: string, color: number): THREE.Group => {
  const group = new THREE.Group();

  const shipClass = type.split('_')[0].toLowerCase();

  // Материал с эффектом свечения
  const material = new THREE.MeshPhongMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.3,
    shininess: 100,
  });

  const lineMaterial = new THREE.LineBasicMaterial({ color: color });

  // Разные модели для разных классов
  if (shipClass === 'frigate') {
    // Фрегат - легкий истребитель (треугольник)
    const noseGeom = new THREE.ConeGeometry(0.3, 1.5, 4);
    const nose = new THREE.Mesh(noseGeom, material);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);

    // Крылья
    const wingGeom = new THREE.BoxGeometry(2, 0.1, 0.8);
    const wings = new THREE.Mesh(wingGeom, material);
    wings.position.z = 0.3;
    group.add(wings);

    // Двигатели
    const engineGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8);
    const engine1 = new THREE.Mesh(engineGeom, material);
    engine1.rotation.x = Math.PI / 2;
    engine1.position.set(-0.7, 0, 0.7);
    group.add(engine1);

    const engine2 = engine1.clone();
    engine2.position.set(0.7, 0, 0.7);
    group.add(engine2);

  } else if (shipClass === 'destroyer') {
    // Эсминец - средний корабль
    const bodyGeom = new THREE.BoxGeometry(0.8, 0.5, 2);
    const body = new THREE.Mesh(bodyGeom, material);
    group.add(body);

    // Нос
    const noseGeom = new THREE.ConeGeometry(0.4, 0.8, 4);
    const nose = new THREE.Mesh(noseGeom, material);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -1.4;
    group.add(nose);

    // Крылья
    const wingGeom = new THREE.BoxGeometry(2.5, 0.15, 1);
    const wings = new THREE.Mesh(wingGeom, material);
    wings.position.z = 0.5;
    group.add(wings);

    // Башня
    const towerGeom = new THREE.BoxGeometry(0.4, 0.6, 0.4);
    const tower = new THREE.Mesh(towerGeom, material);
    tower.position.y = 0.5;
    group.add(tower);

  } else if (shipClass === 'cruiser') {
    // Крейсер - тяжелый корабль
    const bodyGeom = new THREE.BoxGeometry(1.2, 0.8, 3);
    const body = new THREE.Mesh(bodyGeom, material);
    group.add(body);

    // Нос
    const noseGeom = new THREE.ConeGeometry(0.6, 1.2, 6);
    const nose = new THREE.Mesh(noseGeom, material);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -2.1;
    group.add(nose);

    // Крылья
    const wingGeom = new THREE.BoxGeometry(3, 0.2, 1.5);
    const wings = new THREE.Mesh(wingGeom, material);
    wings.position.z = 0.5;
    group.add(wings);

    // Башни
    for (let i = 0; i < 2; i++) {
      const towerGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
      const tower = new THREE.Mesh(towerGeom, material);
      tower.position.set(i === 0 ? -0.5 : 0.5, 0.6, -0.5);
      group.add(tower);
    }

  } else if (shipClass === 'battleship') {
    // Линкор - огромный корабль
    const bodyGeom = new THREE.BoxGeometry(1.5, 1.2, 4);
    const body = new THREE.Mesh(bodyGeom, material);
    group.add(body);

    // Нос
    const noseGeom = new THREE.ConeGeometry(0.75, 1.5, 6);
    const nose = new THREE.Mesh(noseGeom, material);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -2.75;
    group.add(nose);

    // Большие крылья
    const wingGeom = new THREE.BoxGeometry(4, 0.3, 2);
    const wings = new THREE.Mesh(wingGeom, material);
    wings.position.z = 1;
    group.add(wings);

    // Множество башен
    for (let i = 0; i < 3; i++) {
      const towerGeom = new THREE.CylinderGeometry(0.4, 0.4, 1, 8);
      const tower = new THREE.Mesh(towerGeom, material);
      tower.position.set((i - 1) * 0.7, 0.8, -1 + i * 0.8);
      group.add(tower);
    }

  } else {
    // Default - простой корабль
    const bodyGeom = new THREE.BoxGeometry(0.6, 0.4, 1.5);
    const body = new THREE.Mesh(bodyGeom, material);
    group.add(body);
  }

  // Добавляем слабое свечение
  const light = new THREE.PointLight(color, 0.5, 10);
  light.position.set(0, 0, 0);
  group.add(light);

  return group;
};

const BattleScreenElite: React.FC<BattleScreenEliteProps> = ({
  battleLog,
  playerFleet,
  enemyFleet,
  winner,
  reward,
  onBattleEnd,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerShipsRef = useRef<THREE.Group[]>([]);
  const enemyShipsRef = useRef<THREE.Group[]>([]);
  const lasersRef = useRef<THREE.Line[]>([]);

  const [playerShips, setPlayerShips] = useState<ShipData[]>([]);
  const [enemyShips, setEnemyShips] = useState<ShipData[]>([]);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [battleActive, setBattleActive] = useState(true);
  const [showResult, setShowResult] = useState(false);

  // Инициализация Three.js сцены
  useEffect(() => {
    if (!mountRef.current) return;

    // Сцена
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Камера
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Рендерер
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Освещение
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Звезды
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });

    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Создаем корабли игрока
    playerFleet.forEach((shipData, index) => {
      const shipMesh = createShipMesh(shipData.ship_type, 0x00bfff);
      shipMesh.position.set((index - playerFleet.length / 2) * 5, -5, 10);
      shipMesh.rotation.y = Math.PI; // Смотрят вперед
      scene.add(shipMesh);
      playerShipsRef.current.push(shipMesh);
    });

    // Создаем корабли врага
    enemyFleet.forEach((shipData, index) => {
      const shipMesh = createShipMesh(shipData.ship_type, 0xff4444);
      shipMesh.position.set((index - enemyFleet.length / 2) * 5, 5, -10);
      // Враги уже смотрят на игрока (0 rotation)
      scene.add(shipMesh);
      enemyShipsRef.current.push(shipMesh);
    });

    // Инициализация данных кораблей
    setPlayerShips(playerFleet.map(s => ({
      id: s.id,
      ship_type: s.ship_type,
      current_hp: s.current_hp,
      max_hp: s.max_hp,
      attack: s.attack,
      defense: s.defense,
      speed: s.speed,
      destroyed: s.current_hp <= 0,
    })));

    setEnemyShips(enemyFleet.map(s => ({
      id: s.id,
      ship_type: s.ship_type,
      current_hp: s.current_hp,
      max_hp: s.max_hp,
      attack: s.attack,
      defense: s.defense,
      speed: s.speed,
      destroyed: s.current_hp <= 0,
    })));

    // Анимационный цикл
    const animate = () => {
      requestAnimationFrame(animate);

      // Вращение звезд
      stars.rotation.y += 0.0002;

      // Легкая анимация кораблей (покачивание)
      playerShipsRef.current.forEach((ship, i) => {
        if (ship.visible) {
          ship.position.y = -5 + Math.sin(Date.now() * 0.001 + i) * 0.2;
          ship.rotation.z = Math.sin(Date.now() * 0.0015 + i) * 0.05;
        }
      });

      enemyShipsRef.current.forEach((ship, i) => {
        if (ship.visible) {
          ship.position.y = 5 + Math.sin(Date.now() * 0.001 + i + 10) * 0.2;
          ship.rotation.z = Math.sin(Date.now() * 0.0015 + i + 10) * 0.05;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Обработка изменения размера окна
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [playerFleet, enemyFleet]);

  // Создание лазерного выстрела
  const createLaser = (fromPos: THREE.Vector3, toPos: THREE.Vector3, color: number) => {
    if (!sceneRef.current) return;

    const points = [fromPos, toPos];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: color, linewidth: 3 });
    const laser = new THREE.Line(geometry, material);

    sceneRef.current.add(laser);
    lasersRef.current.push(laser);

    // Удаляем лазер через 300мс
    setTimeout(() => {
      if (sceneRef.current) {
        sceneRef.current.remove(laser);
        lasersRef.current = lasersRef.current.filter(l => l !== laser);
      }
    }, 300);
  };

  // Создание взрыва
  const createExplosion = (pos: THREE.Vector3) => {
    if (!sceneRef.current) return;

    // Создаем частицы взрыва
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.3,
      transparent: true,
    });

    const particlesCount = 20;
    const positions = [];

    for (let i = 0; i < particlesCount; i++) {
      positions.push(pos.x, pos.y, pos.z);
    }

    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    sceneRef.current.add(particles);

    // Анимация разлета частиц
    let frame = 0;
    const animateExplosion = () => {
      frame++;
      const posArray = particlesGeometry.attributes.position.array as Float32Array;

      for (let i = 0; i < particlesCount; i++) {
        const i3 = i * 3;
        const angle = (i / particlesCount) * Math.PI * 2;
        const speed = 0.1;
        posArray[i3] += Math.cos(angle) * speed;
        posArray[i3 + 1] += Math.sin(angle) * speed;
      }

      particlesGeometry.attributes.position.needsUpdate = true;
      particlesMaterial.opacity = 1 - (frame / 30);

      if (frame < 30) {
        requestAnimationFrame(animateExplosion);
      } else {
        if (sceneRef.current) {
          sceneRef.current.remove(particles);
        }
      }
    };

    animateExplosion();
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
      // Получаем индексы атакующего и цели
      const attackerIndex = action.attacker.index;
      const targetIndex = action.target.index;

      // Получаем 3D модели
      const attackerMesh = action.attacker.fleet === 1
        ? playerShipsRef.current[attackerIndex]
        : enemyShipsRef.current[attackerIndex];

      const targetMesh = action.target.fleet === 1
        ? playerShipsRef.current[targetIndex]
        : enemyShipsRef.current[targetIndex];

      if (attackerMesh && targetMesh) {
        // Создаем лазер
        const color = action.attacker.fleet === 1 ? 0x00ffff : 0xff0000;
        createLaser(
          attackerMesh.position.clone(),
          targetMesh.position.clone(),
          color
        );

        // Анимация попадания через 200мс
        setTimeout(() => {
          createExplosion(targetMesh.position.clone());

          // Тряска цели
          const originalPos = targetMesh.position.clone();
          targetMesh.position.x += (Math.random() - 0.5) * 0.5;
          targetMesh.position.y += (Math.random() - 0.5) * 0.5;

          setTimeout(() => {
            targetMesh.position.copy(originalPos);
          }, 100);
        }, 200);
      }

      // Обновляем HP
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

        // Скрываем уничтоженный корабль
        if (action.isKill) {
          const targetMesh = playerShipsRef.current[targetIndex];
          if (targetMesh) {
            targetMesh.visible = false;
          }
        }
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

        // Скрываем уничтоженный корабль
        if (action.isKill) {
          const targetMesh = enemyShipsRef.current[targetIndex];
          if (targetMesh) {
            targetMesh.visible = false;
          }
        }
      }

      setCurrentActionIndex(prev => prev + 1);
    }, 800); // 800мс на действие

    return () => clearTimeout(timer);
  }, [battleActive, currentActionIndex, battleLog]);

  return (
    <div className="elite-battle-container">
      <div ref={mountRef} className="threejs-container" />

      {/* HUD */}
      <div className="elite-hud">
        <div className="elite-hud-top">
          <div className="elite-status">
            <div className="status-line">BATTLE IN PROGRESS</div>
            <div className="status-line">
              ROUND: {Math.min(currentActionIndex + 1, battleLog.length)} / {battleLog.length}
            </div>
            <div className="status-line">
              PLAYER: {playerShips.filter(s => !s.destroyed).length} / {playerShips.length}
            </div>
            <div className="status-line">
              ENEMY: {enemyShips.filter(s => !s.destroyed).length} / {enemyShips.length}
            </div>
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
