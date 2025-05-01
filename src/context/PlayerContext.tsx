// src/context/PlayerContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface SystemProgress {
  asteroids: number[];
  drones: number[];
  cargo: { level: number };
}

interface PlayerData {
  id: number;
  telegram_id: string;
  username: string;
  ccc: number;
  cs: number;
  ton: number;
  currentSystem: number;
  systems: Record<number, SystemProgress>;
}

interface PlayerContextType {
  player: PlayerData | null;
  loading: boolean;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData | null>>;
  refreshPlayer: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPlayerData = async () => {
    setLoading(true);
    try {
      const user = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user || {
        id: 123456789,
        username: 'dev_user',
      };

      const telegram_id = user?.id;
      const username = user?.username || 'unknown';

      try {
        const response = await axios.get(`/api/auth/player/${telegram_id}`);
        setPlayer(response.data);
      } catch (error: any) {
        if (error.response?.status === 404) {
          const registerRes = await axios.post('/api/auth/register', {
            telegram_id,
            username,
          });
          setPlayer(registerRes.data);
        } else {
          console.error('Ошибка при загрузке или создании игрока:', error);
        }
      }
    } catch (e) {
      console.error('Ошибка инициализации пользователя:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData();
  }, []);

  return (
    <PlayerContext.Provider value={{ player, loading, setPlayer, refreshPlayer: fetchPlayerData }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer должен использоваться внутри PlayerProvider');
  }
  return context;
};
