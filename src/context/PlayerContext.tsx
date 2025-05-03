import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

export interface Player {
  id: number;
  telegram_id: string;
  nickname: string | null;
  created_at: string;
  ccc: number;
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
  lastCollectionTime?: number; // Добавляем поле для времени последнего сбора
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

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com'
    : 'http://localhost:5000';

  useEffect(() => {
    const telegramId =
      window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() ?? 'local_123456789';

    const fetchPlayer = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiUrl}/player/${telegramId}`);
        const playerData = {
          ...res.data,
          ccc: parseFloat(res.data.ccc),
          cs: parseFloat(res.data.cs),
          ton: parseFloat(res.data.ton),
          lastCollectionTime: res.data.lastCollectionTime || Date.now(), // Устанавливаем значение по умолчанию
        };
        setPlayer(playerData);
      } catch (err: any) {
        setError(`Ошибка при получении данных игрока: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchExchanges = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiUrl}/exchange-history/${telegramId}`);
        if (Array.isArray(res.data)) {
          setExchanges(res.data);
        } else {
          console.error('Неверный формат данных обменов:', res.data);
        }
      } catch (err: any) {
        setError(`Ошибка при загрузке истории обменов: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTonExchanges = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiUrl}/ton-exchange-history/${telegramId}`);
        if (Array.isArray(res.data)) {
          setTonExchanges(res.data);
        } else {
          console.error('Неверный формат данных TON-обменов:', res.data);
        }
      } catch (err: any) {
        setError(`Ошибка при загрузке истории TON-обменов: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchQuests = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${apiUrl}/api/user-quests/${telegramId}`);
        if (Array.isArray(res.data)) {
          setQuests(res.data);
        } else {
          console.error('Неверный формат данных квестов:', res.data);
        }
      } catch (err: any) {
        setError(`Ошибка при загрузке квестов: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      await Promise.all([
        fetchPlayer(),
        fetchExchanges(),
        fetchTonExchanges(),
        fetchQuests(),
      ]);
    };

    fetchData();
  }, []);

  const generateReferralLink = useCallback(async () => {
    if (!player) return;
    try {
      setLoading(true);
      const res = await axios.post(`${apiUrl}/generate-referral`, {
        telegramId: player.telegram_id,
      });
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

  return (
    <PlayerContext.Provider value={{ player, setPlayer, exchanges, setExchanges, tonExchanges, setTonExchanges, quests, setQuests, generateReferralLink, getReferralStats, loading, error }}>
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