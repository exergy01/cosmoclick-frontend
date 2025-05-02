import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface Player {
  id: number;
  telegram_id: string;
  nickname: string | null;
  created_at: string;
  ccc: number;
  cs: number;
  ton: number;
  energy?: number;
  current_system: number;
  drones: any[];
  asteroids: any[];
  cargo: {
    ccc: number;
    level: number;
  };
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
        const isTelegram = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const telegramId = isTelegram
          ? window.Telegram.WebApp.initDataUnsafe.user.id.toString()
          : 'local_123456789';

        const res = await axios.get(`http://localhost:3000/player/${telegramId}`);
        setPlayer(res.data);
      } catch (err: any) {
        console.error('❌ Ошибка при получении/создании игрока:', err);
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

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
