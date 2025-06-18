// Хук для управления данными игрока
import { useState } from 'react';
import { playerApi, referralApi } from '../services';
import { createPlayerWithDefaults } from '../utils/dataTransforms';
import { getTelegramId } from '../utils/telegram';

interface Player {
  telegram_id: string;
  username: string;
  language?: string;
  ccc: number | string;
  cs: number | string;
  ton: number | string;
  // ... остальные поля
  [key: string]: any;
}

export const usePlayerData = () => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка игрока
  const fetchPlayer = async (telegramId: string, currentSystem: number = 1) => {
    try {
      setLoading(true);
      const response = await playerApi.fetchPlayer(telegramId);
      console.log('Player data from server:', response.data);
      
      const playerData = createPlayerWithDefaults(response.data, currentSystem);
      setPlayer(playerData);
      setError(null);
      
      return playerData;
    } catch (err: any) {
      console.log('Fetch player error:', err.message);
      setError(`Failed to fetch player: ${err.message}`);
      setPlayer(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Обновление игрока
  const updatePlayer = async (telegramId: string, currentSystem: number = 1) => {
    try {
      setLoading(true);
      const response = await playerApi.fetchPlayer(telegramId);
      console.log('Player data from server:', response.data);
      
      const playerData = createPlayerWithDefaults(response.data, currentSystem);
      setPlayer(playerData);
      setError(null);
      
      return playerData;
    } catch (err: any) {
      console.log('Update player error:', err.message);
      setError(`Failed to update player: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Обновление игрока без лоадера
  const refreshPlayer = async (currentSystem: number = 1) => {
    const telegramId = getTelegramId();
    if (!telegramId) {
      setError('No telegram ID');
      return;
    }
    
    try {
      const response = await playerApi.fetchPlayer(telegramId);
      console.log('Player data from server (refresh):', response.data);
      
      const playerData = createPlayerWithDefaults(response.data, currentSystem);
      setPlayer(playerData);
      setError(null);
      
      return playerData;
    } catch (err: any) {
      console.log('Refresh player error:', err.message);
      setError(`Failed to refresh player: ${err.message}`);
      throw err;
    }
  };

  // Регистрация нового игрока
  const registerNewPlayer = async (telegramId: string) => {
    try {
      const response = await playerApi.registerNewPlayer(telegramId);
      if (!response.data) {
        throw new Error('Registration failed');
      }
      return response.data;
    } catch (err: any) {
      console.error('Registration error:', err.message);
      throw err;
    }
  };

  // Загрузка полных данных игрока включая рефералов
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const telegramId = getTelegramId();
      if (!telegramId) {
        setError('No telegram ID');
        return;
      }
      
      console.log(`Starting data load for telegramId: ${telegramId}`);

      let playerData;
      try {
        const playerResponse = await playerApi.fetchPlayer(telegramId);
        console.log('Raw player response:', playerResponse.data);
        playerData = playerResponse.data;
      } catch (err: any) {
        console.log('Player fetch error:', err.message);
        if (err.response?.status === 404) {
          console.log('Player not found, registering new player');
          playerData = await registerNewPlayer(telegramId);
        } else {
          throw err;
        }
      }

      // Загружаем рефералов и доску почета
      let referrals: any[] = [];
      let honorBoard: any[] = [];
      
      try {
        const referralsResponse = await referralApi.getReferralsList(telegramId);
        referrals = referralsResponse.data || [];
        console.log('Referrals loaded:', referrals);
      } catch (err) {
        console.error('Failed to load referrals:', err);
      }

      try {
        const honorBoardResponse = await referralApi.getHonorBoard();
        honorBoard = honorBoardResponse.data || [];
        console.log('Honor board loaded:', honorBoard);
      } catch (err) {
        console.error('Failed to load honor board:', err);
      }

      // Создаем реферальную ссылку если её нет
      if (!playerData.referral_link) {
        try {
          await referralApi.generateReferralLink(telegramId);
          const updatedResponse = await playerApi.fetchPlayer(telegramId);
          playerData = updatedResponse.data;
        } catch (err) {
          console.error('Failed to generate referral link:', err);
        }
      }

      // Добавляем рефералов к данным игрока
      const fullPlayerData = {
        ...playerData,
        referrals,
        honor_board: honorBoard,
        language: playerData.language || 'en',
      };

      const normalizedPlayer = createPlayerWithDefaults(fullPlayerData, 1);
      setPlayer(normalizedPlayer);
      setError(null);
      
      console.log('Player data successfully loaded:', normalizedPlayer);
      return normalizedPlayer;
    } catch (err: any) {
      console.log('Fetch initial data error:', err.message);
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Data loading error:', err);
      throw err;
    } finally {
      setLoading(false);
      console.log('Data loading completed, loading:', loading);
    }
  };

  return {
    player,
    setPlayer,
    loading,
    error,
    setError,
    fetchPlayer,
    updatePlayer,
    refreshPlayer,
    fetchInitialData,
    registerNewPlayer,
  };
};