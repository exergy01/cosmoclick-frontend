import React, { useState, useEffect } from 'react';
import { registerPlayer } from '../services/authService';
import TelegramWebApp from 'telegram-web-app';

const StartPage: React.FC = () => {
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [telegramData, setTelegramData] = useState<{ id: number; username: string } | null>(null);

  // Получаем данные из Telegram WebApp
  useEffect(() => {
    const initData = TelegramWebApp.initDataUnsafe?.user;

    if (initData) {
      setTelegramData({
        id: initData.id,
        username: initData.username || '',
      });
    }
  }, []);

  const handleStart = async () => {
    if (!telegramData) {
      alert('Данные Telegram не получены. Запустите игру через Telegram WebApp.');
      return;
    }

    try {
      setLoading(true);

      const newPlayer = await registerPlayer(telegramData.id, telegramData.username);
      setPlayer(newPlayer);
    } catch (error) {
      console.error('Ошибка при старте игры:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      {!player ? (
        <>
          <h1>Добро пожаловать в CosmoClick 🚀</h1>
          {telegramData ? (
            <button onClick={handleStart} disabled={loading}>
              {loading ? 'Запуск...' : 'Начать игру'}
            </button>
          ) : (
            <p>Пожалуйста, запустите игру через Telegram WebApp</p>
          )}
        </>
      ) : (
        <>
          <h2>Привет, {player.username || 'Игрок'}!</h2>
          <p>Ваш баланс CCC: {player.ccc_balance}</p>
          <p>Ваш баланс CS: {player.cs_balance}</p>
          <p>Ваш баланс TON: {player.ton_balance}</p>
        </>
      )}
    </div>
  );
};

export default StartPage;
