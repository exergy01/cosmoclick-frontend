import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface Player {
  id: number;
  telegram_id: string;
  ccc: number;
  cs: number;
  ton: number;
  current_system: number;
  drones: Record<string, number[]>;
  cargo: Record<string, { level: number }>;
  asteroids: Record<string, number[]>;
}

interface PlayerContextType {
  player: Player | null;
  loading: boolean;
}

const PlayerContext = createContext<PlayerContextType>({
  player: null,
  loading: true,
});

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const telegramId = telegramUser?.id?.toString() ?? 'local_123456789';

        const res = await axios.get(`/user/${telegramId}`);
        setPlayer(res.data);
      } catch (err) {
        console.error('❌ Ошибка при получении/создании игрока:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, []);

  return (
    <PlayerContext.Provider value={{ player, loading }}>
      {children}
    </PlayerContext.Provider>
  );
};

// 🔄 Добавим usePlayer
export const usePlayer = () => useContext(PlayerContext);

export { PlayerContext };
