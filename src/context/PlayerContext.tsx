import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface Player {
  id: number;
  telegram_id: string;
  nickname: string | null;
  created_at: string;
  ccc: string;
  cs: string;
  ton: string;
  current_system: number;
  drones: any[];
  cargo: {
    level: number;
    capacity: number;
    autoCollect: boolean;
  };
  asteroids: any[];
}

interface PlayerContextType {
  player: Player | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

        if (!user || !user.id) {
          console.warn('⚠️ WebApp не инициализирован в Telegram. Пропускаем загрузку игрока.');
          return;
        }

        const telegramId = user.id.toString();
        const res = await axios.get(`http://localhost:5000/player/${telegramId}`);
        setPlayer(res.data);
      } catch (error: any) {
        console.error("❌ Ошибка при получении/создании игрока:", error);
      }
    };

    fetchPlayer();
  }, []);

  return (
    <PlayerContext.Provider value={{ player, setPlayer }}>
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
