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
  energy?: number;
  asteroidresources?: number;
  cargoccc?: number;
  cargolevel?: number;
  drones: any[];
  asteroids: any[];
  tasks?: any;
}

interface PlayerContextType {
  player: Player | null;
  loading: boolean;
  refreshPlayer: () => void;
}

export const PlayerContext = createContext<PlayerContextType>({
  player: null,
  loading: true,
  refreshPlayer: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayer = async () => {
    try {
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const telegramId = user?.id ? user.id.toString() : 'local_123456789';

      const res = await axios.get(`http://localhost:3000/player/${telegramId}`);
      setPlayer(res.data);
    } catch (error: any) {
      console.error('❌ Ошибка при получении/создании игрока:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayer();
  }, []);

  const refreshPlayer = () => {
    setLoading(true);
    fetchPlayer();
  };

  return (
    <PlayerContext.Provider value={{ player, loading, refreshPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};
