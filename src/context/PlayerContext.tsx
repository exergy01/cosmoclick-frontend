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
        const telegramWebApp = window.Telegram?.WebApp;
        const telegramUser = telegramWebApp?.initDataUnsafe?.user;
        console.log('Telegram WebApp data:', { telegramWebApp: !!telegramWebApp, user: telegramUser });

        const telegramId = telegramUser?.id ? telegramUser.id.toString() : 'local_123456789';
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
      }
    };

    fetchPlayer();
  }, []); // Пустой массив зависимостей для вызова один раз

  return (
    <PlayerContext.Provider value={{ player, setPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};