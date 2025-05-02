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

export interface Player {
  id: number;
  telegram_id: string;
  nickname: string | null;
  created_at: string;
  ccc: number; // Изменено на number
  cs: number; // Изменено на number
  ton: number; // Изменено на number
  current_system: number;
  drones: Drone[];
  cargo: {
    level: number;
    capacity: number;
    autoCollect: boolean;
  };
  asteroids: number[]; // Предполагаем, что это массив чисел
}

interface PlayerContextType {
  player: Player | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  exchanges: Exchange[];
  setExchanges: React.Dispatch<React.SetStateAction<Exchange[]>>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com'
    : 'http://localhost:5000';

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const telegramId =
          window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() ?? 'local_123456789';
        const res = await axios.get(`${apiUrl}/player/${telegramId}`);
        // Преобразуем строки в числа
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

    fetchPlayer();
    fetchExchanges();
  }, []);

  return (
    <PlayerContext.Provider value={{ player, setPlayer, exchanges, setExchanges }}>
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