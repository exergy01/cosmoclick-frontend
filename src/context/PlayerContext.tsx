import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';

interface Drone {
  id: number;
  system: number;
}

interface Exchange {
  id: number;
  type: 'CCC_TO_CS' | 'CS_TO_CCC';
  amount_from: number;
  amount_to: number;
  timestamp: string;
}

interface TonExchange {
  id: number;
  type: 'CS_TO_TON' | 'TON_TO_CS';
  amount_from: number;
  amount_to: number;
  timestamp: string;
}

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

export interface Player {
  id: number;
  telegram_id: string;
  nickname: string | null;
  created_at: string;
  ccc: number;
  cargoCCC: number;
  cs: number;
  ton: number;
  current_system: number;
  drones: Drone[];
  cargo: {
    level: number;
    capacity: number;
    autoCollect: boolean;
  };
  asteroids: number[];
  referral_link?: string;
  referrals_count?: number;
  lastCollectionTime?: number;
  lastUpdateTime?: number;
}

interface UserQuest {
  id: number;
  user_id: string;
  quest_id: number;
  status: string;
  progress: number;
  title: string;
  description: string;
  reward_type: string;
  reward_amount: number;
  required_amount: number;
  type: string;
  metadata?: {
    channel?: string;
    message_id?: number;
    reaction?: string;
    bot?: string;
    link?: string;
    ref?: string;
    ad_slot?: number;
  };
}

interface PlayerContextType {
  player: Player | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  exchanges: Exchange[];
  setExchanges: React.Dispatch<React.SetStateAction<Exchange[]>>;
  tonExchanges: TonExchange[];
  setTonExchanges: React.Dispatch<React.SetStateAction<TonExchange[]>>;
  quests: UserQuest[];
  setQuests: React.Dispatch<React.SetStateAction<UserQuest[]>>;
  generateReferralLink: () => Promise<void>;
  getReferralStats: () => Promise<void>;
  safeCollect: (accumulatedCCC: number) => Promise<void>;
  refreshPlayer: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [tonExchanges, setTonExchanges] = useState<TonExchange[]>([]);
  const [quests, setQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedStats, setHasFetchedStats] = useState<boolean>(false);
  const [lastPath, setLastPath] = useState<string>(window.location.pathname);
  const [systemData, setSystemData] = useState<{ droneData: DroneData[], asteroidData: AsteroidData[] }>({ droneData: [], asteroidData: [] });
  const lastUpdateTime = useRef<number>(Date.now());
  const miningSpeedRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com'
    : '/api';

  const calculateMiningSpeed = (player: Player) => {
    if (!player.drones || player.drones.length === 0 || !systemData.droneData.length) {
      console.log('No drones or system data:', { drones: player.drones, droneData: systemData.droneData });
      return 0;
    }
    const currentSystem = player.current_system || 1;
    const activeDrones = player.drones.filter(drone => drone.system === currentSystem);
    if (activeDrones.length === 0) {
      console.log('No active drones for current system:', currentSystem);
      return 0;
    }
    const totalCCCPerSecond = activeDrones.reduce((total: number, drone: Drone) => {
      const droneInfo = systemData.droneData.find(d => d.id === drone.id);
      if (!droneInfo) {
        console.log(`Drone ${drone.id} not found in system data`);
        return total;
      }
      const cccPerSecond = droneInfo.cccPerDay / (24 * 60 * 60);
      console.log(`Drone ${drone.id} mining speed: ${cccPerSecond} CCC/second`);
      return total + cccPerSecond;
    }, 0);
    console.log('Total mining speed:', totalCCCPerSecond, 'for', activeDrones.length, 'drones');
    return totalCCCPerSecond > 0 ? totalCCCPerSecond : 0.0001;
  };

  const fetchData = useCallback(async (telegramId: string) => {
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return player;
    }
    isFetchingRef.current = true;
    try {
      setLoading(true);
      console.log('Fetching player data for telegramId:', telegramId);

      const now = Date.now();
      const checkRes = await axios.get(`${apiUrl}/player/${telegramId}`);
      console.log('Raw response from server:', checkRes.data);
      let serverPlayer = {
        ...checkRes.data,
        ccc: parseFloat(checkRes.data.ccc || 0),
        cargoCCC: parseFloat(checkRes.data.cargoCCC || 0),
        cs: parseFloat(checkRes.data.cs || 0),
        ton: parseFloat(checkRes.data.ton || 0),
        lastCollectionTime: new Date(checkRes.data.last_collection_time || now).getTime(),
        lastUpdateTime: new Date(checkRes.data.last_update_time || now).getTime(),
      };

      const elapsedTime = (now - serverPlayer.lastUpdateTime) / 1000;
      console.log('Elapsed time (seconds):', elapsedTime, 'since last update:', new Date(serverPlayer.lastUpdateTime).toISOString());

      const miningSpeed = calculateMiningSpeed(serverPlayer);
      console.log('Calculated mining speed:', miningSpeed, 'CCC/second');
      let adjustedCargoCCC = serverPlayer.cargoCCC;
      if (elapsedTime > 0) {
        const offlineCCC = miningSpeed * elapsedTime;
        console.log('Offline CCC accumulated:', offlineCCC);
        adjustedCargoCCC = Math.min(
          serverPlayer.cargo.capacity || 1000,
          Math.max(0, serverPlayer.cargoCCC + offlineCCC)
        );
        console.log('Adjusted cargoCCC after offline mining:', adjustedCargoCCC);
      }

      const updatedPlayer = { ...serverPlayer, cargoCCC: adjustedCargoCCC, lastUpdateTime: now };
      setPlayer(updatedPlayer);
      lastUpdateTime.current = now;
      miningSpeedRef.current = miningSpeed;

      return updatedPlayer;
    } catch (err: any) {
      console.error('Fetch error:', err.message, err.response?.status, err.response?.data);
      if (err.response?.status === 404) {
        const now = Date.now();
        const newPlayer = {
          telegram_id: telegramId,
          nickname: null,
          ccc: 1000,
          cargoCCC: 0,
          cs: 500,
          ton: 0,
          current_system: 1,
          drones: [],
          asteroids: [],
          cargo: { level: 1, capacity: 1000, autoCollect: false },
          lastCollectionTime: now,
          lastUpdateTime: now,
        };
        try {
          console.log('Creating new player:', newPlayer);
          const createRes = await axios.post(`${apiUrl}/player`, newPlayer);
          console.log('Raw create response:', createRes.data);
          let createdPlayer = {
            ...createRes.data,
            ccc: parseFloat(createRes.data.ccc || 0),
            cargoCCC: 0,
            cs: parseFloat(createRes.data.cs || 0),
            ton: parseFloat(createRes.data.ton || 0),
            lastCollectionTime: now,
            lastUpdateTime: now,
          };

          const miningSpeed = calculateMiningSpeed(createdPlayer);
          setPlayer(createdPlayer);
          lastUpdateTime.current = now;
          miningSpeedRef.current = miningSpeed;

          return createdPlayer;
        } catch (createErr: any) {
          console.error('Create player error:', createErr.message, createErr.response?.data);
          setError(`Ошибка создания игрока: ${createErr.message}`);
        }
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
    return null;
  }, [apiUrl, systemData.droneData]);

  const fetchAdditionalData = useCallback(async (telegramId: string) => {
    try {
      await Promise.all([
        axios.get(`${apiUrl}/exchange-history/${telegramId}`).then(res => setExchanges(res.data)),
        axios.get(`${apiUrl}/ton-exchange-history/${telegramId}`).then(res => setTonExchanges(res.data)),
        axios.get(`${apiUrl}/user-quests/${telegramId}`).then(res => setQuests(res.data)),
      ]);
    } catch (err: any) {
      console.error('Ошибка загрузки дополнительных данных:', err);
      setExchanges([]);
      setTonExchanges([]);
      setQuests([]);
    }
  }, [apiUrl]);

  const refreshPlayer = useCallback(async () => {
    if (!player?.telegram_id) return;
    const updatedPlayer = await fetchData(player.telegram_id);
    if (updatedPlayer) {
      await fetchAdditionalData(player.telegram_id);
    }
    setLoading(false);
  }, [fetchData, fetchAdditionalData, player]);

  useEffect(() => {
    if (!window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      console.error('Telegram WebApp not initialized or user ID missing');
      setError('Запустите приложение через Telegram');
      setLoading(false);
      return;
    }

    const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    console.log('Using telegramId:', telegramId);
    console.log('Telegram WebApp data:', window.Telegram?.WebApp);

    fetchData(telegramId).then(updatedPlayer => {
      if (updatedPlayer) {
        fetchAdditionalData(telegramId);
      } else {
        console.error('Failed to load or create player');
      }
      setLoading(false);
    });
  }, [fetchData, fetchAdditionalData]);

  useEffect(() => {
    const loadSystemData = async () => {
      if (!player) return;
      const systemId = player.current_system || 1;
      try {
        const module = await import(`../data/shopDataSystem${systemId}.ts`);
        const data = {
          droneData: module.droneData,
          asteroidData: module.asteroidData,
        };
        setSystemData(data);
        console.log('Loaded system data:', data);
      } catch (err) {
        console.error(`Ошибка загрузки данных системы ${systemId}:`, err);
        setSystemData({ droneData: [], asteroidData: [] });
      }
    };
    loadSystemData();
  }, [player?.current_system]);

  const calculateRemainingResources = () => {
    if (!player?.asteroids || player.asteroids.length === 0 || !systemData.asteroidData.length) {
      console.log('No asteroids, infinite resources');
      return Infinity;
    }
    const currentSystem = player.current_system || 1;
    const activeAsteroids = player.asteroids.filter((asteroidId: number) => {
      const asteroid = systemData.asteroidData.find(a => a.id === asteroidId);
      return asteroid && (asteroid.system || 1) === currentSystem;
    });
    const totalCapacity = activeAsteroids.reduce((total: number, asteroidId: number) => {
      const asteroid = systemData.asteroidData.find(a => a.id === asteroidId);
      return total + (asteroid ? asteroid.capacity : 0);
    }, 0);
    const remaining = Math.max(0, totalCapacity - (player.cargoCCC || 0));
    console.log('Remaining resources:', remaining);
    return remaining;
  };

  useEffect(() => {
    if (!player || !systemData.droneData.length) {
      console.log('Skipping update: player or systemData not ready', { player, droneDataLength: systemData.droneData.length });
      return;
    }
    const miningSpeed = miningSpeedRef.current || calculateMiningSpeed(player);
    if (miningSpeed === 0) {
      console.log('Mining speed is 0, interval not started');
      return;
    }
    console.log('Starting interval with mining speed:', miningSpeed);

    const intervalId = setInterval(() => {
      if (player) {
        const now = Date.now();
        const deltaTime = (now - lastUpdateTime.current) / 1000;
        if (deltaTime < 0) {
          console.warn('Negative deltaTime detected, skipping update:', deltaTime);
          lastUpdateTime.current = now;
          return;
        }
        const cargoCapacity = player.cargo?.capacity || 1000;
        const remainingResources = calculateRemainingResources();
        const increment = miningSpeed * deltaTime;
        const maxCCC = Math.min(remainingResources, cargoCapacity - player.cargoCCC);
        const newCargoCCC = Math.min(Math.max(player.cargoCCC + increment, 0), maxCCC);
        console.log('Updating cargoCCC:', { deltaTime, increment, newCargoCCC, maxCCC });
        setPlayer(prev => prev ? { ...prev, cargoCCC: newCargoCCC } : prev);
        lastUpdateTime.current = now;
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [player?.id, systemData.droneData.length, player?.drones?.length, player?.current_system]);

  useEffect(() => {
    const handlePathChange = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath && player) {
        setLastPath(currentPath);
        refreshPlayer();
      }
    };

    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, [lastPath, player, refreshPlayer]);

  const generateReferralLink = useCallback(async () => {
    if (!player) return;
    try {
      setLoading(true);
      const res = await axios.post(`${apiUrl}/generate-referral`, { telegramId: player.telegram_id });
      setPlayer(prev => prev ? { ...prev, referral_link: res.data.link } : prev);
    } catch (err: any) {
      setError(`Ошибка при генерации реферальной ссылки: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [player, apiUrl]);

  const getReferralStats = useCallback(async () => {
    if (!player || hasFetchedStats) return;
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/referrals/${player.telegram_id}`);
      setPlayer(prev => prev ? { ...prev, referrals_count: res.data.count } : prev);
      setHasFetchedStats(true);
    } catch (err: any) {
      setError(`Ошибка при загрузке статистики рефералов: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [player, apiUrl, hasFetchedStats]);

  const safeCollect = useCallback(async (accumulatedCCC: number) => {
    if (!player) return;
    try {
      setLoading(true);
      const now = Date.now();
      const res = await axios.post(`${apiUrl}/player/${player.telegram_id}/safe-collect`, { 
        accumulatedCCC,
        lastUpdateTime: now
      });
      const updatedPlayer = {
        ...player,
        ...res.data.player,
        ccc: parseFloat(res.data.player.ccc),
        cargoCCC: 0,
        cs: parseFloat(res.data.player.cs),
        ton: parseFloat(res.data.player.ton),
        lastCollectionTime: new Date(res.data.player.last_collection_time).getTime() || now,
        lastUpdateTime: now,
      };
      setPlayer(updatedPlayer);
      lastUpdateTime.current = now;
      miningSpeedRef.current = calculateMiningSpeed(updatedPlayer);
      console.log('Player updated after safeCollect:', updatedPlayer);
    } catch (err: any) {
      setError(`Ошибка при сборе сейфом: ${err.message}`);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [player, apiUrl]);

  return (
    <PlayerContext.Provider value={{ player, setPlayer, exchanges, setExchanges, tonExchanges, setTonExchanges, quests, setQuests, generateReferralLink, getReferralStats, safeCollect, refreshPlayer, loading, error }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};