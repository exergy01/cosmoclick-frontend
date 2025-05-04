import React, { useState, useEffect, useRef } from 'react';
import { usePlayer, Player } from '../context/PlayerContext';
import axios from 'axios';

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
  const [accumulatedCCC, setAccumulatedCCC] = useState<number>(0);
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [systemData, setSystemData] = useState<SystemData>({ droneData: [], asteroidData: [], cargoData: [] });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const lastPlayerData = useRef<Player | null>(player);

  // Сохранение последнего известного состояния
  useEffect(() => {
    if (player) lastPlayerData.current = player;
  }, [player]);

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
    if (!lastPlayerData.current?.drones || lastPlayerData.current.drones.length === 0 || !systemData.droneData.length) return 0;
    const currentSystem = lastPlayerData.current.current_system || 1;
    const activeDrones = lastPlayerData.current.drones.filter(drone => drone.system === currentSystem);
    if (activeDrones.length === 0) return 0;
    const totalCCCPerSecond = activeDrones.reduce((total: number, drone: Drone) => {
      const droneInfo = systemData.droneData.find(d => d.id === drone.id);
      if (!droneInfo) return total;
      return total + (droneInfo.cccPerDay / (24 * 60 * 60));
    }, 0);
    return totalCCCPerSecond || 0.04405;
  };

  const calculateRemainingResources = () => {
    if (!lastPlayerData.current?.asteroids || lastPlayerData.current.asteroids.length === 0 || !systemData.asteroidData.length) return 0;
    const currentSystem = lastPlayerData.current.current_system || 1;
    const activeAsteroids = lastPlayerData.current.asteroids.filter((asteroidId: number) => {
      const asteroid = systemData.asteroidData.find(a => a.id === asteroidId);
      return asteroid && (asteroid.system || 1) === currentSystem;
    });
    const totalCapacity = activeAsteroids.reduce((total: number, asteroidId: number) => {
      const asteroid = systemData.asteroidData.find(a => a.id === asteroidId);
      return total + (asteroid ? asteroid.capacity : 0);
    }, 0);
    return Math.max(0, totalCapacity - (lastPlayerData.current.ccc || 0));
  };

  // Синхронизация с сервером при изменении ключевых данных
  useEffect(() => {
    const syncPlayerData = async () => {
      if (!player || !player.telegram_id || isSyncing) return;
      setIsSyncing(true);
      try {
        const res = await axios.get(`https://cosmoclick-backend.onrender.com/api/player/${player.telegram_id}`);
        setPlayer(res.data);
      } catch (err: any) {
        console.error('Ошибка синхронизации данных игрока:', err);
        if (err.response?.status === 404) {
          // Создание нового игрока
          const newPlayer = {
            telegram_id: player.telegram_id,
            nickname: null,
            ccc: 0,
            cs: 0,
            ton: 0,
            current_system: 1,
            auto_collect: false,
            drones: [],
            asteroids: [],
            cargo: { level: 1, capacity: 50, price: 0, system: 1 },
            lastCollectionTime: Date.now()
          };
          try {
            const createRes = await axios.post('https://cosmoclick-backend.onrender.com/api/player', newPlayer);
            setPlayer(createRes.data);
            lastPlayerData.current = createRes.data;
          } catch (createErr) {
            console.error('Ошибка создания игрока:', createErr);
          }
        } else if (lastPlayerData.current) {
          setPlayer(lastPlayerData.current);
        }
      } finally {
        setIsSyncing(false);
      }
    };
    syncPlayerData();
  }, [player?.drones?.length, player?.asteroids?.length, player?.cargo?.level, player?.telegram_id]);

  // Накопление CCC
  useEffect(() => {
    if (!lastPlayerData.current || !systemData.droneData.length || isSyncing) return;
    const miningSpeed = calculateMiningSpeed();
    const interval = setInterval(() => {
      setAccumulatedCCC(prev => {
        const remainingResources = calculateRemainingResources();
        const cargoCapacity = lastPlayerData.current!.cargo.capacity || 50;
        const newCCC = prev + miningSpeed;
        if (newCCC >= 0 && remainingResources > newCCC && (lastPlayerData.current!.ccc || 0) + newCCC <= cargoCapacity) {
          return newCCC;
        }
        return Math.min(Math.max(newCCC, 0), remainingResources, cargoCapacity - (lastPlayerData.current!.ccc || 0));
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lastPlayerData.current, systemData, isSyncing]);

  const collectCCC = async () => {
    if (!lastPlayerData.current || accumulatedCCC <= 0) return;
    const remainingResources = calculateRemainingResources();
    const cargoCapacity = lastPlayerData.current.cargo.capacity || 50;
    if (remainingResources > 0 && (lastPlayerData.current.ccc || 0) + accumulatedCCC <= cargoCapacity) {
      const updatedCCC = (lastPlayerData.current.ccc || 0) + accumulatedCCC;
      const updatedPlayer = {
        ...lastPlayerData.current,
        ccc: updatedCCC,
        lastCollectionTime: Date.now(),
        drones: [...lastPlayerData.current.drones],
        asteroids: [...lastPlayerData.current.asteroids],
        cargo: { ...lastPlayerData.current.cargo }
      };
      try {
        const res = await axios.put(
          `https://cosmoclick-backend.onrender.com/api/player/${lastPlayerData.current.telegram_id}`,
          updatedPlayer
        );
        setPlayer(res.data);
      } catch (err) {
        console.error('Ошибка записи в базу:', err);
      }
      setAccumulatedCCC(0);
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
      <div style={{
        fontSize: '36px',
        fontFamily: 'Cursive, Orbitron, sans-serif',
        color: '#00f0ff',
        textShadow: '0 0 8px #00f0ff'
      }}>
        {accumulatedCCC.toFixed(4)}
      </div>
    </div>
  );
};

export default CenterPanel;