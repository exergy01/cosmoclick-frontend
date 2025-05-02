import React, { createContext, useContext, useEffect, useState } from 'react';
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
}

interface PlayerContextType {
  player: Player | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  exchanges: Exchange[];
  setExchanges: React.Dispatch<React.SetStateAction<Exchange[]>>;
  tonExchanges: TonExchange[];
  setTonExchanges: React.Dispatch<React.SetStateAction<TonExchange[]>>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [tonExchanges, setTonExchanges] = useState<TonExchange[]>([]);

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com'
    : 'http://localhost:5000';

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const telegramId =
          window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() ?? 'local_123456789';
        const res = await axios.get(`${apiUrl}/player/${telegramId}`);
        const playerData = {
          ...res.data,
          ccc: parseFloat(res.data.ccc),
          cs: parseFloat(res.data.cs),
          ton: parseFloat(res.data.ton),
        };
        setPlayer(playerData);
      } catch (error) {
        console.error('Ошибка при получении данных игрока:', error);
      }
    };

    const fetchExchanges = async () => {
      try {
        const telegramId =
          window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() ?? 'local_123456789';
        const res = await axios.get(`${apiUrl}/exchange-history/${telegramId}`);
        if (Array.isArray(res.data)) {
          setExchanges(res.data);
        } else {
          console.error('Неверный формат данных обменов:', res.data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке истории обменов:', error);
      }
    };

    const fetchTonExchanges = async () => {
      try {
        const telegramId =
          window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() ?? 'local_123456789';
        const res = await axios.get(`${apiUrl}/ton-exchange-history/${telegramId}`);
        if (Array.isArray(res.data)) {
          setTonExchanges(res.data);
        } else {
          console.error('Неверный формат данных TON-обменов:', res.data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке истории TON-обменов:', error);
      }
    };

    fetchPlayer();
    fetchExchanges();
    fetchTonExchanges();
  }, []);

  return (
    <PlayerContext.Provider value={{ player, setPlayer, exchanges, setExchanges, tonExchanges, setTonExchanges }}>
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