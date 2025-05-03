import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import axios from 'axios';

// Типы для данных системы
interface DroneData {
  id: number;
  cccPerDay: number;
  price: number;
  system: number;
}

interface AsteroidData {
  id: number;
  capacity: number;
  price: number;
  system: number;
}

interface CargoData {
  level: number;
  capacity: number;
  price: number;
  system: number;
}

interface SystemData {
  droneData: DroneData[];
  asteroidData: AsteroidData[];
  cargoData: CargoData[];
}

interface Drone {
  id: number;
  system: number;
}

const CenterPanel: React.FC = () => {
  const { player, setPlayer } = usePlayer();
  const [lastCollectionTime, setLastCollectionTime] = useState<number>(Date.now());
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [pendingCCC, setPendingCCC] = useState<number>(0);
  const [systemData, setSystemData] = useState<SystemData>({ droneData: [], asteroidData: [], cargoData: [] });
  const animationFrameId = useRef<number | null>(null);
  const startTime = useRef<number>(0);

  // Динамическая загрузка данных системы
  useEffect(() => {
    const loadSystemData = async () => {
      if (!player) return;
      const systemId = player.current_system || 1;
      try {
        const module = await import(`../data/shopDataSystem${systemId}.ts`);
        setSystemData({
          droneData: module.droneData,
          asteroidData: module.asteroidData,
          cargoData: module.cargoData
        });
      } catch (err) {
        console.error(`Ошибка загрузки данных системы ${systemId}:`, err);
        setSystemData({ droneData: [], asteroidData: [], cargoData: [] });
      }
    };
    loadSystemData();
  }, [player?.current_system]);

  const calculateMiningSpeed = () => {
    if (!player?.drones || player.drones.length === 0 || !systemData.droneData.length) return 0;
    const currentSystem = player.current_system || 1;
    const activeDrones = player.drones.filter(drone => drone.system === currentSystem);
    if (activeDrones.length === 0) return 0;
    const totalCCCPerSecond = activeDrones.reduce((total: number, drone: Drone) => {
      const droneInfo = systemData.droneData.find(d => d.id === drone.id);
      if (!droneInfo) return total;
      return total + (droneInfo.cccPerDay / (24 * 60 * 60));
    }, 0);
    return totalCCCPerSecond || 0.04405; // Базовая скорость
  };

  const calculateRemainingResources = () => {
    if (!player?.asteroids || player.asteroids.length === 0 || !systemData.asteroidData.length) return 0;
    const currentSystem = player.current_system || 1;
    const activeAsteroids = player.asteroids.filter((asteroidId: number) => {
      const asteroid = systemData.asteroidData.find(a => a.id === asteroidId);
      return asteroid && (asteroid.system || 1) === currentSystem;
    });
    const totalCapacity = activeAsteroids.reduce((total: number, asteroidId: number) => {
      const asteroid = systemData.asteroidData.find(a => a.id === asteroidId);
      return total + (asteroid ? asteroid.capacity : 0);
    }, 0);
    return Math.max(0, totalCapacity - (player.ccc || 0));
  };

  const animateMining = () => {
    if (!player || !player.drones || player.drones.length === 0 || !player.asteroids || player.asteroids.length === 0) return;

    const animate = (currentTime: number) => {
      if (!startTime.current) startTime.current = currentTime;
      const elapsed = (currentTime - startTime.current) / 1000;
      const miningSpeed = calculateMiningSpeed();
      const newPendingCCC = miningSpeed * elapsed;
      const remainingResources = calculateRemainingResources();
      const cargoCapacity = player.cargo?.capacity || 50;

      if (newPendingCCC >= 0 && remainingResources > newPendingCCC && (player.ccc || 0) + newPendingCCC <= cargoCapacity) {
        setPendingCCC(newPendingCCC);
      } else {
        const maxPending = Math.min(cargoCapacity - (player.ccc || 0), remainingResources);
        setPendingCCC(Math.min(newPendingCCC, maxPending));
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    animationFrameId.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!player || !systemData.droneData.length) return;
    console.log('Player:', player);
    console.log('lastCollectionTime:', player.lastCollectionTime);
    setLastCollectionTime(player.lastCollectionTime || Date.now());
    const elapsed = (Date.now() - (player.lastCollectionTime || Date.now())) / 1000;
    const initialCCC = calculateMiningSpeed() * elapsed;
    console.log('Initial CCC:', initialCCC, 'Mining Speed:', calculateMiningSpeed(), 'Elapsed:', elapsed);
    setPendingCCC(initialCCC > 0 ? initialCCC : 0);
    startTime.current = 0;
    animateMining();
  }, [player, systemData]);

  const collectCCC = async () => {
    if (!player || pendingCCC <= 0) return;
    const remainingResources = calculateRemainingResources();
    const cargoCapacity = player.cargo?.capacity || 50;

    if (remainingResources > 0 && (player.ccc || 0) + pendingCCC <= cargoCapacity) {
      const updatedCCC = (player.ccc || 0) + pendingCCC;
      const updatedPlayer = {
        ...player,
        ccc: updatedCCC,
        lastCollectionTime: Date.now(),
        drones: [...player.drones],
        asteroids: [...player.asteroids],
        cargo: { ...player.cargo }
      };
      try {
        const res = await axios.put(
          `https://cosmoclick-backend.onrender.com/api/player/${player.telegram_id}`,
          updatedPlayer
        );
        setPlayer(res.data);
      } catch (err) {
        console.error('Ошибка записи в базу:', err);
      }
      setPendingCCC(0);
      startTime.current = 0;
      animateMining();
    }
  };

  return (
    <div style={{
      marginTop: '20px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      justifyContent: 'center',
      width: '100%',
      paddingRight: '20px'
    }}>
      {/* Сейф */}
      <div
        style={{
          width: '240px',
          height: '240px',
          backgroundImage: 'url(/images/safe.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'drop-shadow(0 0 25px #00f0ff)',
          cursor: 'pointer',
          marginBottom: '15px',
          transform: isPressed ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.2s ease'
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => {
          setIsPressed(false);
          collectCCC();
        }}
        onMouseLeave={() => setIsPressed(false)}
      >
      </div>

      {/* Счётчик */}
      <div style={{
        fontSize: '36px',
        fontFamily: 'Cursive, Orbitron, sans-serif',
        color: '#00f0ff',
        textShadow: '0 0 8px #00f0ff'
      }}>
        {pendingCCC.toFixed(4)}
      </div>
    </div>
  );
};

export default CenterPanel;