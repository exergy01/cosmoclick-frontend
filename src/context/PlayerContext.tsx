import React, { createContext, useContext, useEffect, useState } from 'react';
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
  current_system: number;
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
      const tgUser = window?.Telegram?.WebApp?.initDataUnsafe?.user;
      const isTelegram = tgUser && tgUser.id;

      let telegram_id = '';
      let username = 'unknown';

      if (isTelegram) {
        telegram_id = tgUser.id.toString();
        username = tgUser.username || 'unknown';
      } else {
        telegram_id = 'local_123456789';
        username = 'LocalTester';
      }

      const res = await axios.get(`/api/auth/player/${telegram_id}`);
      setPlayer(res.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        try {
          const tgUser = window?.Telegram?.WebApp?.initDataUnsafe?.user;
          const isTelegram = tgUser && tgUser.id;

          let telegram_id = '';
          let username = 'unknown';

          if (isTelegram) {
            telegram_id = tgUser.id.toString();
            username = tgUser.username || 'unknown';
          } else {
            telegram_id = 'local_123456789';
            username = 'LocalTester';
          }

          const res = await axios.post('/api/auth/register', { telegram_id, username });
          setPlayer(res.data);
        } catch (err) {
          console.error('❌ Ошибка при регистрации игрока:', err);
        }
      } else {
        console.error('❌ Ошибка при загрузке игрока:', error);
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
  if (!context) throw new Error('usePlayer должен использоваться внутри PlayerProvider');
  return context;
};
