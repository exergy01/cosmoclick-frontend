// src/context/PlayerContext.tsx
import React, { createContext, useEffect, useState } from 'react';
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

export const PlayerContext = createContext<PlayerContextType>({
  player: null,
  loading: true,
});

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const isTelegram = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const telegramId = isTelegram
          ? window.Telegram.WebApp.initDataUnsafe.user.id.toString()
          : 'local_123456789';

        const res = await axios.get(`/user/${telegramId}`);
        setPlayer(res.data);
      } catch (err) {
        console.error('Ошибка при получении/создании игрока:', err);
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
