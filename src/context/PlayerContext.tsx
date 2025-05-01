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
    let telegram_id = '';
    let username = '';

    const telegramUser = window?.Telegram?.WebApp?.initDataUnsafe?.user;

    if (telegramUser) {
      telegram_id = telegramUser.id.toString();
      username = telegramUser.username || 'unknown';
    } else {
      telegram_id = 'local_123456789';
      username = 'LocalTester';
    }

    try {
      const response = await axios.get(`/api/player/by-telegram/${telegram_id}`);
      setPlayer(response.data);
    } catch (error: any) {
      console.warn('⚠️ Игрок не найден, пробуем зарегистрировать...');

      try {
        const response = await axios.post(`/api/player/register`, { telegram_id, username });
        setPlayer(response.data);
      } catch (registerError) {
        console.error('❌ Ошибка при регистрации игрока:', registerError);
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
