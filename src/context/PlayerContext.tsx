import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const [isFetching, setIsFetching] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || isFetching) return;
    hasFetched.current = true;
    setIsFetching(true);

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
    script.onload = () => console.log('telegram-web-app.js loaded');
    script.onerror = () => console.error('Failed to load telegram-web-app.js');
    document.head.appendChild(script);

    const fetchPlayer = async (telegramId: string) => {
      try {
        console.log('Fetching player with telegramId:', telegramId);
        const res = await axios.get(`https://cosmoclick-backend.onrender.com/player/${telegramId}`);
        console.log('Player response:', res.data);
        setPlayer(res.data);
      } catch (err: any) {
        console.error('❌ Ошибка при получении/создании игрока:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
      } finally {
        setIsFetching(false);
      }
    };

    const tryFetchTelegramId = () => {
      const telegramWebApp = window.Telegram?.WebApp;
      const initDataUnsafe = telegramWebApp?.initDataUnsafe;
      const telegramUser = initDataUnsafe?.user;
      console.log('Telegram WebApp data:', {
        telegramWebApp: !!telegramWebApp,
        initDataUnsafe,
        user: telegramUser,
        initData: telegramWebApp?.initData || 'No initData',
        rawInitDataUnsafe: JSON.stringify(initDataUnsafe),
      });

      const telegramId = telegramUser?.id ? telegramUser.id.toString() : 'local_123456789';
      fetchPlayer(telegramId);
    };

    console.log('Checking if telegram-web-app.js is loaded:', !!window.Telegram);
    tryFetchTelegramId();

    let interval: NodeJS.Timeout | null = null;
    if (!window.Telegram?.WebApp) {
      interval = setInterval(() => {
        if (window.Telegram?.WebApp) {
          console.log('Telegram WebApp initialized after delay');
          tryFetchTelegramId();
          clearInterval(interval!);
        }
      }, 500);

      setTimeout(() => {
        if (interval && !window.Telegram?.WebApp) {
          console.warn('Telegram WebApp not initialized after 10s, using local_123456789');
          fetchPlayer('local_123456789');
          clearInterval(interval);
        }
      }, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <PlayerContext.Provider value={{ player, setPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};