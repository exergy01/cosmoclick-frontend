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

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com'
    : 'http://localhost:5000';

  const fetchData = useCallback(async (telegramId: string) => {
    try {
      setLoading(true);
      console.log('Fetching player data for telegramId:', telegramId);
      const checkRes = await axios.get(`${apiUrl}/api/player/${telegramId}`);
      console.log('Raw response from server:', checkRes);
      const serverPlayer = {
        ...checkRes.data,
        ccc: parseFloat(checkRes.data.ccc),
        cargoCCC: parseFloat(localStorage.getItem(`cargoCCC_${telegramId}`) || '0'),
        cs: parseFloat(checkRes.data.cs),
        ton: parseFloat(checkRes.data.ton),
        lastCollectionTime: new Date(checkRes.data.last_collection_time).getTime() || Date.now(),
      };
      console.log('Player data fetched:', serverPlayer);

      const updatedPlayer = { ...serverPlayer };
      setPlayer(updatedPlayer);
      localStorage.setItem(`cargoCCC_${telegramId}`, updatedPlayer.cargoCCC.toString());
      localStorage.setItem(`lastUpdateTime_${telegramId}`, Date.now().toString());
      lastUpdateTime.current = Date.now();

      return updatedPlayer;
    } catch (err: any) {
      console.error('Fetch error:', err.response?.status, err.message, err.response?.data);
      if (err.response?.status === 404) {
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
          lastCollectionTime: Date.now(),
        };
        try {
          console.log('Creating new player:', newPlayer);
          const createRes = await axios.post(`${apiUrl}/api/player`, newPlayer);
          console.log('Raw create response:', createRes);
          const createdPlayer = {
            ...createRes.data,
            ccc: parseFloat(createRes.data.ccc),
            cargoCCC: 0,
            cs: parseFloat(createRes.data.cs),
            ton: parseFloat(createRes.data.ton),
            lastCollectionTime: Date.now(),
          };
          console.log('New player created:', createdPlayer);
          setPlayer(createdPlayer);
          localStorage.setItem(`cargoCCC_${telegramId}`, '0');
          localStorage.setItem(`lastUpdateTime_${telegramId}`, Date.now().toString());
          return createdPlayer;
        } catch (createErr: any) {
          console.error('Create player error:', createErr.message, createErr.response?.data);
          setError(`Ошибка создания игрока: ${createErr.message}`);
        }
      } else {
        setError(`Ошибка загрузки данных: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, [apiUrl]);

  const fetchAdditionalData = useCallback(async (telegramId: string) => {
    try {
      await Promise.all([
        axios.get(`${apiUrl}/exchange-history/${telegramId}`).then(res => setExchanges(res.data)),
        axios.get(`${apiUrl}/ton-exchange-history/${telegramId}`).then(res => setTonExchanges(res.data)),
        axios.get(`${apiUrl}/api/user-quests/${telegramId}`).then(res => setQuests(res.data)),
      ]);
    } catch (err: any) {
      console.error('Ошибка загрузки дополнительных данных:', err);
    }
  }, [apiUrl]);

  const refreshPlayer = useCallback(async () => {
    const telegramId = localStorage.getItem('telegram_id');
    if (!telegramId || !player) return;

    const updatedPlayer = await fetchData(telegramId);
    if (updatedPlayer) {
      await fetchAdditionalData(telegramId);
    }
    setLoading(false);
  }, [fetchData, fetchAdditionalData, player]);

  useEffect(() => {
    const telegramId = localStorage.getItem('telegram_id') || 
      (window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || 
       `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
    console.log('Using telegramId:', telegramId);
    console.log('Telegram WebApp data:', window.Telegram?.WebApp);
    localStorage.setItem('telegram_id', telegramId);

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

  const calculateMiningSpeed = () => {
    if (!player?.drones || player.drones.length === 0 || !systemData.droneData.length) {
      console.log('No drones or system data:', { drones: player?.drones, droneData: systemData.droneData });
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
    console.log('Total mining speed:', totalCCCPerSecond);
    return totalCCCPerSecond > 0 ? totalCCCPerSecond : 0.0001;
  };

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
    const miningSpeed = calculateMiningSpeed();
    if (miningSpeed === 0) {
      console.log('Mining speed is 0, interval not started');
      return;
    }
    console.log('Starting interval with mining speed:', miningSpeed);

    let animationFrameId: number;
    const updateCargoCCC = (currentTime: number) => {
      if (player) {
        const telegramId = localStorage.getItem('telegram_id');
        if (!telegramId) return;
        const deltaTime = (currentTime - lastUpdateTime.current) / 1000;
        const cargoCapacity = player.cargo?.capacity || 1000;
        const remainingResources = calculateRemainingResources();
        const increment = miningSpeed * deltaTime;
        const maxCCC = Math.min(remainingResources, cargoCapacity - player.cargoCCC);
        const newCargoCCC = Math.min(Math.max(player.cargoCCC + increment, 0), maxCCC);
        console.log('Updating cargoCCC:', { deltaTime, increment, newCargoCCC, maxCCC });
        setPlayer(prev => prev ? { ...prev, cargoCCC: newCargoCCC } : prev);
        localStorage.setItem(`cargoCCC_${telegramId}`, newCargoCCC.toString());
        localStorage.setItem(`lastUpdateTime_${telegramId}`, currentTime.toString());
        lastUpdateTime.current = currentTime;
      }
      animationFrameId = requestAnimationFrame(updateCargoCCC);
    };

    animationFrameId = requestAnimationFrame(updateCargoCCC);
    return () => cancelAnimationFrame(animationFrameId);
  }, [player, systemData.droneData]);

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
      const res = await axios.post(`${apiUrl}/api/player/${player.telegram_id}/safe-collect`, { accumulatedCCC });
      const telegramId = localStorage.getItem('telegram_id');
      if (!telegramId) return;
      const updatedPlayer = {
        ...player,
        ...res.data.player,
        ccc: parseFloat(res.data.player.ccc),
        cargoCCC: 0,
        cs: parseFloat(res.data.player.cs),
        ton: parseFloat(res.data.player.ton),
        lastCollectionTime: new Date(res.data.player.last_collection_time).getTime() || Date.now(),
      };
      setPlayer(updatedPlayer);
      localStorage.setItem(`cargoCCC_${telegramId}`, '0');
      localStorage.setItem(`lastUpdateTime_${telegramId}`, updatedPlayer.lastCollectionTime.toString());
      lastUpdateTime.current = updatedPlayer.lastCollectionTime;
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