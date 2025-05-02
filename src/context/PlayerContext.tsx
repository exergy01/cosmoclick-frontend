import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface Cargo {
  level: number;
  capacity: number;
  autoCollect: boolean;
}

interface Player {
  id: number;
  telegram_id: string;
  nickname: string | null;
  created_at: string;
  ccc: number;
  cs: number;
  ton: number;
  current_system: number;
  drones: any[];
  cargo: Cargo;
  asteroids: any[];
}

interface PlayerContextType {
  player: Player | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
}

const PlayerContext = createContext<PlayerContextType>({
  player: null,
  setPlayer: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const telegramId = telegramUser ? telegramUser.id.toString() : 'local_123456789';

        const res = await axios.get(`http://localhost:5000/player/${telegramId}`);
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
