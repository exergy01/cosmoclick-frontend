import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getTelegramId } from '../utils/telegram';

interface Exchange {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
}

interface Quest {
  quest_id: number;
  telegram_id: string;
  completed: boolean;
  reward_cs: number;
  timestamp: string;
}

interface Referral {
  telegram_id: string;
  username: string;
  cs_earned: number;
  ton_earned: number;
}

interface HonorBoardEntry {
  telegram_id: string;
  username?: string;
  referrals_count: number;
}

interface Player {
  telegram_id: string;
  username: string;
  language: string;
  ccc: number | string;
  cs: number | string;
  ton: number | string;
  auto_collect: boolean;
  last_collection_time: { [system: string]: string };
  systems: number[];
  referral_link: string;
  referrer_id: string | null;
  referrals_count: number;
  verified: boolean;
  ad_views: number;
  last_ad_reset: string | null;
  cargo_capacity: number;
  mathccc: number | string;
  last_update_time: string;
  collected_ccc: string;
  referrals: Referral[];
  honor_board: HonorBoardEntry[];
  totalCollected?: number;
  totalcollected: string;
  token?: string;
  id?: string;
  color?: string;
  cargo_levels: { system: number; level: number }[];
  collected_by_system: { [key: string]: number };
  drones?: { id: number; system: number }[];
}

interface PlayerContextType {
  player: Player | null;
  setPlayer: (player: Player | null) => void;
  exchanges: Exchange[];
  quests: Quest[];
  setQuests: (quests: Quest[]) => void;
  currentSystem: number;
  cccCounter: { [system: string]: number };
  setCccCounter: React.Dispatch<React.SetStateAction<{ [system: string]: number }>>;
  startTime: number;
  setStartTime: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  error: string | null;
  updatePlayer: (telegramId: string) => Promise<void>;
  buyExchange: (exchange: Exchange) => Promise<void>;
  setCurrentSystem: (system: number) => void;
  safeCollect: (data: { telegramId: string; last_collection_time: { [system: string]: string }; system: number }) => Promise<void>;
  generateReferralLink: () => Promise<void>;
  getReferralStats: () => Promise<void>;
  fetchInitialData: () => Promise<void>;
  convertCurrency: (amount: number, fromCurrency: 'ccc' | 'cs', toCurrency: 'ccc' | 'cs') => Promise<void>;
  buyAsteroid: (id: number, price: number) => Promise<void>;
  buyDrone: (id: number, price: number) => Promise<void>;
  buyCargo: (id: number, price: number, capacity: number) => Promise<void>;
  buySystem: (id: number, price: number) => Promise<void>;
  totalCollected: number;
  setTotalCollected: React.Dispatch<React.SetStateAction<number>>;
  refreshPlayer: () => Promise<void>;
  fetchPlayer: (telegramId: string) => Promise<void>;
  asteroidTotal: number;
  remaining: number;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const API_URL = 'http://localhost:5000';

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [player, setPlayer] = useState<Player | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [currentSystem, setCurrentSystem] = useState<number>(1);
  const [cccCounter, setCccCounter] = useState<{ [system: string]: number }>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCollected, setTotalCollected] = useState<number>(0);
  const [asteroidTotal, setAsteroidTotal] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (player?.language && i18n.language !== player.language) {
      i18n.changeLanguage(player.language);
    }
  }, [player, i18n]);

  useEffect(() => {
    const telegramId = getTelegramId();
    if (telegramId && player) {
      localStorage.setItem('totalCollected_' + telegramId, totalCollected.toString());
    }
  }, [player, totalCollected]);

  useEffect(() => {
    const telegramId = getTelegramId();
    if (telegramId && player) {
      updateCounter(telegramId);
      const interval = setInterval(() => updateCounter(telegramId), 5000);
      return () => clearInterval(interval);
    }
  }, [currentSystem, player]);

  const updateCounter = async (telegramId: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/safe/update-counter`, {
        telegramId,
        last_collection_time: new Date().toISOString(),
        system: currentSystem,
      });
      setCccCounter(prev => ({ ...prev, [currentSystem]: Number(response.data.cccCounter || 0) }));
      setAsteroidTotal(Number(response.data.asteroidTotal || 0));
      const collected = response.data.collected_by_system?.[currentSystem.toString()] || 0;
      setTotalCollected(Number(collected));
      setRemaining(Number(response.data.asteroidTotal || 0) - Number(collected));
      setError(null);
    } catch (err: any) {
      setError(t('failed_to_update_counter'));
    }
  };

  const fetchWithRetry = async (url: string, retries: number = 3, delay: number = 1000): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url);
        return response;
      } catch (err: any) {
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const registerNewPlayer = async (telegramId: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/register/${telegramId}`);
      if (!response.data) throw new Error('Registration failed');
      return response.data;
    } catch (err: any) {
      console.error('Registration error:', err.message);
      throw err;
    }
  };

  const fetchPlayer = async (telegramId: string) => {
    try {
      setLoading(true);
      const response = await fetchWithRetry(`${API_URL}/api/player/${telegramId}`);
      const playerData = response.data;
      const cargoLevel = playerData.cargo_levels?.find((c: { system: number }) => c.system === currentSystem)?.level || 0;
      setPlayer({
        ...playerData,
        cargo_level: cargoLevel,
        last_collection_time: playerData.last_collection_time || {},
        collected_by_system: playerData.collected_by_system || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
        referrals: playerData.referrals || [],
        honor_board: playerData.honor_board || [],
        drones: playerData.drones || [],
        cargo_levels: playerData.cargo_levels || [],
      });
      setError(null);
    } catch (err: any) {
      setError(t('failed_to_fetch_player'));
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  const updatePlayer = async (telegramId: string) => {
    try {
      setLoading(true);
      const response = await fetchWithRetry(`${API_URL}/api/player/${telegramId}`);
      const playerData = response.data;
      const cargoLevel = playerData.cargo_levels?.find((c: { system: number }) => c.system === currentSystem)?.level || 0;
      setPlayer({
        ...playerData,
        cargo_level: cargoLevel,
        last_collection_time: playerData.last_collection_time || {},
        collected_by_system: playerData.collected_by_system || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
        referrals: playerData.referrals || [],
        honor_board: playerData.honor_board || [],
        drones: playerData.drones || [],
        cargo_levels: playerData.cargo_levels || [],
      });
      if (playerData.last_collection_time?.[currentSystem]) {
        setStartTime(new Date(playerData.last_collection_time[currentSystem]).getTime());
      }
      const collected = playerData.collected_by_system?.[currentSystem.toString()] || 0;
      setTotalCollected(Number(collected));
      setError(null);
    } catch (err: any) {
      setError(t('failed_to_fetch_player'));
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const telegramId = getTelegramId();
      if (!telegramId) {
        setError(t('no_telegram_id'));
        return;
      }
      let playerData;
      try {
        const playerResponse = await fetchWithRetry(`${API_URL}/api/player/${telegramId}`);
        playerData = playerResponse.data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          playerData = await registerNewPlayer(telegramId);
        } else {
          throw err;
        }
      }

      let referrals: Referral[] = [];
      let honorBoard: HonorBoardEntry[] = [];
      try {
        const referralsResponse = await axios.get(`${API_URL}/api/referrals/list/${telegramId}`);
        referrals = referralsResponse.data || [];
      } catch (err) {
        console.error('Failed to fetch referrals:', err);
      }

      try {
        const honorBoardResponse = await axios.get(`${API_URL}/api/referrals/honor-board`);
        honorBoard = honorBoardResponse.data || [];
      } catch (err) {
        console.error('Failed to fetch honor board:', err);
      }

      const cargoLevel = playerData.cargo_levels?.find((c: { system: number }) => c.system === currentSystem)?.level || 0;
      setPlayer({
        ...playerData,
        referrals,
        honor_board: honorBoard,
        cargo_level: cargoLevel,
        last_collection_time: playerData.last_collection_time || {},
        collected_by_system: playerData.collected_by_system || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
        drones: playerData.drones || [],
        cargo_levels: playerData.cargo_levels || [],
      });
      setCurrentSystem(playerData.systems[0] || 1);
      if (playerData.last_collection_time?.[currentSystem]) {
        setStartTime(new Date(playerData.last_collection_time[currentSystem]).getTime());
      }
      const collected = playerData.collected_by_system?.[currentSystem.toString()] || 0;
      setTotalCollected(Number(collected));
      setError(null);
    } catch (err: any) {
      setError(t('failed_to_fetch_data'));
    } finally {
      setLoading(false);
    }
  };

  const refreshPlayer = async () => {
    const telegramId = getTelegramId();
    if (!telegramId) {
      setError(t('no_telegram_id'));
      return;
    }
    await updatePlayer(telegramId);
  };

  const buyExchange = async (exchange: Exchange) => {
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        setError(t('no_telegram_id'));
        return;
      }
      await axios.post(`${API_URL}/api/exchange/buy`, { telegramId, exchangeId: exchange.id });
      await refreshPlayer();
    } catch (err: any) {
      setError(t('failed_to_buy_exchange'));
    }
  };

  const convertCurrency = async (amount: number, fromCurrency: 'ccc' | 'cs', toCurrency: 'ccc' | 'cs') => {
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        setError(t('no_telegram_id'));
        return;
      }
      const response = await axios.post(`${API_URL}/api/exchange/convert`, {
        telegramId,
        amount,
        fromCurrency,
        toCurrency,
      });
      setPlayer({
        ...response.data,
        last_collection_time: response.data.last_collection_time || {},
        collected_by_system: response.data.collected_by_system || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
        referrals: player?.referrals || [],
        honor_board: player?.honor_board || [],
        drones: response.data.drones || [],
        cargo_levels: response.data.cargo_levels || [],
      });
      setError(null);
    } catch (err: any) {
      setError(t('failed_to_convert_currency'));
    }
  };

  const buyAsteroid = async (id: number, price: number) => {
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        setError(t('no_telegram_id'));
        return;
      }
      const response = await axios.post(`${API_URL}/api/shop/buy`, {
        telegramId,
        type: 'asteroid',
        id,
        price,
        system: currentSystem,
      });
      const cargoLevel = response.data.cargo_levels?.find((c: { system: number }) => c.system === currentSystem)?.level || 0;
      setPlayer({
        ...response.data,
        cargo_level: cargoLevel,
        last_collection_time: response.data.last_collection_time || {},
        collected_by_system: response.data.collected_by_system || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
        referrals: player?.referrals || [],
        honor_board: player?.honor_board || [],
        drones: response.data.drones || [],
        cargo_levels: response.data.cargo_levels || [],
      });
      setError(null);
    } catch (err: any) {
      setError(t('failed_to_buy_asteroid'));
      throw err;
    }
  };

  const buyDrone = async (id: number, price: number) => {
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        setError(t('no_telegram_id'));
        return;
      }
      const response = await axios.post(`${API_URL}/api/shop/buy`, {
        telegramId,
        type: 'drone',
        id,
        price,
        system: currentSystem,
      });
      const cargoLevel = response.data.cargo_levels?.find((c: { system: number }) => c.system === currentSystem)?.level || 0;
      setPlayer({
        ...response.data,
        cargo_level: cargoLevel,
        last_collection_time: response.data.last_collection_time || {},
        collected_by_system: response.data.collected_by_system || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
        referrals: player?.referrals || [],
        honor_board: player?.honor_board || [],
        drones: response.data.drones || [],
        cargo_levels: response.data.cargo_levels || [],
      });
      setError(null);
    } catch (err: any) {
      setError(t('failed_to_buy_drone'));
      throw err;
    }
  };

  const buyCargo = async (id: number, price: number, capacity: number) => {
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        setError(t('no_telegram_id'));
        return;
      }
      const response = await axios.post(`${API_URL}/api/shop/buy`, {
        telegramId,
        type: 'cargo',
        id,
        price,
        system: currentSystem,
        cargo_capacity: capacity,
      });
      const cargoLevel = response.data.cargo_levels?.find((c: { system: number }) => c.system === currentSystem)?.level || 0;
      setPlayer({
        ...response.data,
        cargo_level: cargoLevel,
        last_collection_time: response.data.last_collection_time || {},
        collected_by_system: response.data.collected_by_system || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
        referrals: player?.referrals || [],
        honor_board: player?.honor_board || [],
        drones: response.data.drones || [],
        cargo_levels: response.data.cargo_levels || [],
      });
      setError(null);
    } catch (err: any) {
      setError(t('failed_to_buy_cargo'));
      throw err;
    }
  };

  const buySystem = async (id: number, price: number) => {
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        setError(t('no_telegram_id'));
        return;
      }
      const response = await axios.post(`${API_URL}/api/shop/buy`, {
        telegramId,
        type: 'system',
        id,
        price,
      });
      const cargoLevel = response.data.cargo_levels?.find((c: { system: number }) => c.system === currentSystem)?.level || 0;
      setPlayer({
        ...response.data,
        cargo_level: cargoLevel,
        last_collection_time: response.data.last_collection_time || {},
        collected_by_system: response.data.collected_by_system || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
        referrals: player?.referrals || [],
        honor_board: player?.honor_board || [],
        drones: response.data.drones || [],
        cargo_levels: response.data.cargo_levels || [],
      });
      setCurrentSystem(id);
      setError(null);
    } catch (err: any) {
      setError(t('failed_to_buy_system'));
      throw err;
    }
  };

  const safeCollect = async (data: { telegramId: string; last_collection_time: { [system: string]: string }; system: number }) => {
    try {
      const { telegramId, last_collection_time, system } = data;
      if (!telegramId) {
        throw new Error(t('no_telegram_id'));
      }
      const response = await axios.post(`${API_URL}/api/safe/collect`, {
        telegramId,
        last_collection_time,
        system,
      });
      const updatedPlayer = response.data;
      const cargoLevel = updatedPlayer.cargo_levels?.find((c: { system: number }) => c.system === currentSystem)?.level || 0;
      setPlayer({
        ...updatedPlayer,
        cargo_level: cargoLevel,
        last_collection_time: updatedPlayer.last_collection_time || {},
        collected_by_system: updatedPlayer.collected_by_system || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
        referrals: player?.referrals || [],
        honor_board: player?.honor_board || [],
        drones: updatedPlayer.drones || [],
        cargo_levels: updatedPlayer.cargo_levels || [],
      });
      setCccCounter(prev => ({ ...prev, [system]: 0 }));
      setStartTime(new Date(updatedPlayer.last_collection_time[system]).getTime());
      const collected = updatedPlayer.collected_by_system?.[system.toString()] || 0;
      setTotalCollected(Number(collected));
      setRemaining(Number(asteroidTotal) - Number(collected));
    } catch (err: any) {
      throw new Error(t('failed_to_collect', { error: err.message }));
    }
  };

  const generateReferralLink = async () => {
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        setError(t('no_telegram_id'));
        return;
      }
      const response = await axios.post(`${API_URL}/api/referrals/create`, { telegramId });
      setPlayer({ ...player!, referral_link: response.data.referral_link, referrals: player?.referrals || [], honor_board: player?.honor_board || [], drones: player?.drones || [], cargo_levels: player?.cargo_levels || [] });
    } catch (err: any) {
      setError(t('failed_to_generate_referral_link'));
    }
  };

  const getReferralStats = async () => {
    try {
      const telegramId = getTelegramId();
      if (!telegramId) {
        setError(t('no_telegram_id'));
        return;
      }
      const response = await axios.get(`${API_URL}/api/referrals/stats/${telegramId}`);
      setPlayer({ ...player!, referrals_count: response.data.referrals_count, referrals: player?.referrals || [], honor_board: player?.honor_board || [], drones: player?.drones || [], cargo_levels: player?.cargo_levels || [] });
    } catch (err: any) {
      setError(t('failed_to_fetch_referral_stats'));
    }
  };

  const value = {
    player,
    setPlayer,
    exchanges,
    quests,
    setQuests,
    currentSystem,
    cccCounter,
    setCccCounter,
    startTime,
    setStartTime,
    loading,
    error,
    updatePlayer,
    buyExchange,
    convertCurrency,
    setCurrentSystem,
    safeCollect,
    generateReferralLink,
    getReferralStats,
    fetchInitialData,
    buyAsteroid,
    buyDrone,
    buyCargo,
    buySystem,
    totalCollected,
    setTotalCollected,
    refreshPlayer,
    fetchPlayer,
    asteroidTotal,
    remaining,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};