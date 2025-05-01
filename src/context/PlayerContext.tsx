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
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      const telegram_id = user?.id;
      const username = user?.username || 'unknown';

      if (!telegram_id) throw new Error('Telegram ID не найден');

      // Пытаемся получить игрока
      const response = await axios.get(`/api/auth/player/${telegram_id}`);
      setPlayer(response.data);
    } catch (error: any) {
      // Если игрок не найден — регистрируем
      if (error.response?.status === 404) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        const telegram_id = user?.id;
        const username = user?.username || 'unknown';

        if (telegram_id) {
          await axios.post('/api/auth/register', { telegram_id, username });
          const newResponse = await axios.get(`/api/auth/player/${telegram_id}`);
          setPlayer(newResponse.data);
        }
      } else {
        console.error('Ошибка при загрузке или создании игрока:', error);
      }
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
