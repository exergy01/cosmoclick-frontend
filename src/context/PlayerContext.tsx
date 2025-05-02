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
  current_system: number;
  drones: any[];
  asteroids: any[];
  cargo: {
    level: number;
    capacity: number;
    autoCollect: boolean;
  };
}

interface PlayerContextProps {
  player: Player | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  loading: boolean;
}

const PlayerContext = createContext<PlayerContextProps>({
  player: null,
  setPlayer: () => {},
  loading: true,
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
        const telegramId = `${telegramUser?.id ?? 'local_123456789'}`; // Всегда строка

        const response = await axios.get(`http://localhost:3000/player/${telegramId}`);
        setPlayer(response.data);
      } catch (error) {
        console.error('❌ Ошибка при получении/создании игрока:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, []);

  return (
    <PlayerContext.Provider value={{ player, setPlayer, loading }}>
      {children}
    </PlayerContext.Provider>
  );
};
