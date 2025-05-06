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
  loadProgress: number;
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
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const lastUpdateTime = useRef<number>(Date.now());
  const miningSpeedRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  const apiUrl = 'https://cosmoclick-backend.onrender.com';

  const calculateMiningSpeed = (player: Player): number => {
    if (!player.drones || player.drones.length === 0 || !systemData.droneData.length) {
      return 0;
    }
    const currentSystem = player.current_system || 1;
    const activeDrones = player.drones.filter(drone => drone.system === currentSystem);
    if (activeDrones.length === 0) {
      return 0;
    }
    const totalCCCPerSecond = activeDrones.reduce((total: number, drone: Drone) => {
      const droneInfo = systemData.droneData.find(d => d.id === drone.id);
      if (!droneInfo) {
        return total;
      }
      const cccPerSecond = droneInfo.cccPerDay / (24 * 60 * 60);
      return total + cccPerSecond;
    }, 0);
    return totalCCCPerSecond > 0 ? totalCCCPerSecond : 0.0001;
  };

  const calculateRemainingResources = (player: Player): number => {
    if (!player.asteroids || player.asteroids.length === 0 || !systemData.asteroidData.length) {
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
    return Math.max(0, totalCapacity - (player.cargoCCC || 0));
  };

  const fetchAllData = useCallback(async (telegramId: string) => {
    if (isFetchingRef.current) {
      return player;
    }
    isFetchingRef.current = true;
    try {
      console.log('Starting fetchAllData for', telegramId); // Проверка вызова
      setLoading(true);
      setLoadProgress(0);
      const now = Date.now();

      const requests = [
        axios.get(`${apiUrl}/api/player/${telegramId}`),
        axios.get(`${apiUrl}/exchange-history/${telegramId}`),
        axios.get(`${apiUrl}/ton-exchange-history/${telegramId}`),
        axios.get(`${apiUrl}/api/user-quests/${telegramId}`),
      ];

      const results = await Promise.allSettled(requests);
      let completed = 0;

      const [playerRes, exchangesRes, tonExchangesRes, questsRes] = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          completed += 25;
          setLoadProgress(completed);
          return result.value;
        }
        console.error(`Request ${index + 1} failed:`, result.reason);
        return null;
      });

      if (!playerRes) {
        throw new Error('Failed to fetch player data');
      }

      let serverPlayer = {
        ...playerRes.data,
        ccc: parseFloat(playerRes.data.ccc || 0),
        cargoCCC: parseFloat(playerRes.data.cargoCCC || 0),
        cs: parseFloat(playerRes.data.cs || 0),
        ton: parseFloat(playerRes.data.ton || 0),
        lastCollectionTime: new Date(playerRes.data.last_collection_time || now).getTime(),
        lastUpdateTime: new Date(playerRes.data.last_update_time || now).getTime(),
      };

      console.log('Server data:', {
        lastUpdateTime: serverPlayer.lastUpdateTime,
        cargoCCC: serverPlayer.cargoCCC,
        miningSpeed: calculateMiningSpeed(serverPlayer),
      });

      const elapsedTime = (now - serverPlayer.lastUpdateTime) / 1000;
      const miningSpeed = calculateMiningSpeed(serverPlayer);
      let adjustedCargoCCC = serverPlayer.cargoCCC;

      if (elapsedTime > 0 && miningSpeed > 0) {
        const offlineCCC = miningSpeed * elapsedTime;
        const cargoCapacity = serverPlayer.cargo?.capacity || 1000;
        const remainingResources = calculateRemainingResources(serverPlayer);
        adjustedCargoCCC = Math.min(
          cargoCapacity,
          remainingResources,
          serverPlayer.cargoCCC + offlineCCC
        );
        console.log('Offline calculation:', {
          elapsedTime,
          miningSpeed,
          offlineCCC,
          cargoCapacity,
          remainingResources,
          adjustedCargoCCC,
        });
      }

      const updatedPlayer = {
        ...serverPlayer,
        cargoCCC: adjustedCargoCCC,
        lastUpdateTime: now,
      };
      setPlayer(updatedPlayer);
      setExchanges(exchangesRes?.data || []);
      setTonExchanges(tonExchangesRes?.data || []);
      setQuests(questsRes?.data || []);
      lastUpdateTime.current = now;
      miningSpeedRef.current = miningSpeed;

      return updatedPlayer;
    } catch (err: any) {
      console.error('Fetch error:', err.message, err.response?.status, err.response?.data);
      if (err.response?.status === 404) {
        const now = Date.now();
        const newPlayer = {
          telegram_id: telegramId,
          nickname: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'Капитан',
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
          const createRes = await axios.post(`${apiUrl}/api/auth/register`, newPlayer);
          let createdPlayer = {
            ...createRes.data,
            ccc: parseFloat(createRes.data.ccc || 0),
            cargoCCC: 0,
            cs: parseFloat(createRes.data.cs || 0),
            ton: parseFloat(createRes.data.ton || 0),
            lastCollectionTime: now,
            lastUpdateTime: now,
          };
          setPlayer(createdPlayer);
          setExchanges([]);
          setTonExchanges([]);
          setQuests([]);
          lastUpdateTime.current = now;
          miningSpeedRef.current = calculateMiningSpeed(createdPlayer);
          setLoadProgress(100);
          return createdPlayer;
        } catch (createErr: any) {
          setError(`Ошибка создания игрока: ${createErr.message}`);
        }
      } else {
        setError(`Ошибка загрузки данных: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setLoadProgress(100);
      isFetchingRef.current = false;
    }
    return null;
  }, [apiUrl, systemData.droneData]);

  const refreshPlayer = useCallback(async () => {
    if (!player?.telegram_id) return;
    await fetchAllData(player.telegram_id);
  }, [fetchAllData, player]);

  useEffect(() => {
    if (!window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      setError('Запустите приложение через Telegram');
      setLoading(false);
      setLoadProgress(100);
      return;
    }

    const telegramId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    fetchAllData(telegramId);
  }, [fetchAllData]);

  useEffect(() => {
    if (!player) return;
    const systemId = player.current_system || 1;
    const loadSystemData = async () => {
      try {
        const module = await import(`../data/shopDataSystem${systemId}.ts`);
        const data = {
          droneData: module.droneData,
          asteroidData: module.asteroidData,
        };
        setSystemData(data);
      } catch (err) {
        setSystemData({ droneData: [], asteroidData: [] });
      }
    };
    loadSystemData();
  }, [player?.current_system]);

  useEffect(() => {
    if (!player || !systemData.droneData.length) {
      return;
    }

    const miningSpeed = miningSpeedRef.current || calculateMiningSpeed(player);
    if (miningSpeed === 0) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!player) return;

      const now = Date.now();
      const deltaTime = (now - lastUpdateTime.current) / 1000;
      if (deltaTime <= 0) {
        lastUpdateTime.current = now;
        return;
      }

      setPlayer(prev => {
        if (!prev) return prev;

        const cargoCapacity = prev.cargo?.capacity || 1000;
        const remainingResources = calculateRemainingResources(prev);
        const increment = miningSpeed * deltaTime;
        const maxCCC = Math.min(remainingResources, cargoCapacity);
        const newCargoCCC = Math.min(maxCCC, prev.cargoCCC + increment);

        return {
          ...prev,
          cargoCCC: newCargoCCC,
          lastUpdateTime: now,
        };
      });

      lastUpdateTime.current = now;
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
    } finally {
      setLoading(false);
    }
  }, [player, apiUrl, hasFetchedStats]);

  const safeCollect = useCallback(async (accumulatedCCC: number) => {
    if (!player) return;
    try {
      setLoading(true);
      const now = Date.now();
      const res = await axios.post(`${apiUrl}/api/player/${player.telegram_id}/safe-collect`, { 
        accumulatedCCC,
        lastUpdateTime: now
      });
      const updatedPlayer = {
        ...player,
        ...res.data.player,
        ccc: parseFloat(res.data.player.ccc),
        cargoCCC: 0,
        cs: parseFloat(res.data.player.cs),
        ton: parseFloat(res.data.ton || 0),
        lastCollectionTime: new Date(res.data.player.last_collection_time).getTime() || now,
        lastUpdateTime: now,
      };
      setPlayer(updatedPlayer);
      lastUpdateTime.current = now;
      miningSpeedRef.current = calculateMiningSpeed(updatedPlayer);
    } catch (err: any) {
      setError(`Ошибка при сборе сейфом: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [player, apiUrl]);

  return (
    <PlayerContext.Provider value={{ player, setPlayer, exchanges, setExchanges, tonExchanges, setTonExchanges, quests, setQuests, generateReferralLink, getReferralStats, safeCollect, refreshPlayer, loading, error, loadProgress }}>
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