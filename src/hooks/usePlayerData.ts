// Хук для управления данными игрока (ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ)
import { useState } from 'react';
import { playerApi, referralApi } from '../services';
import { createPlayerWithDefaults } from '../utils/dataTransforms';
import { getTelegramId, getTelegramUserData } from '../utils/telegram';

interface Player {
  telegram_id: string;
  username: string;
  first_name?: string;
  language?: string;
  ccc: number | string;
  cs: number | string;
  ton: number | string;
  [key: string]: any;
}

export const usePlayerData = () => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Создание/получение игрока с реальными данными Telegram
  const createOrGetPlayer = async (telegramId: string, telegramData?: any) => {
    try {
      console.log('🚀 usePlayerData.createOrGetPlayer начался');
      console.log('📱 Telegram ID:', telegramId);
      console.log('📱 Telegram Data:', telegramData);
      
      const response = await playerApi.createOrGetPlayer({
        telegramId,
        telegramData
      });
      
      console.log('✅ usePlayerData: Игрок создан/получен:', response.data);
      return response.data;
    } catch (err: any) {
      console.error('❌ usePlayerData.createOrGetPlayer ошибка:', err);
      throw err;
    }
  };

  // Загрузка игрока ЧЕРЕЗ СТАРЫЙ ЭНДПОИНТ
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
      console.log('🔄 registerNewPlayer вызвана (используем новую логику)');
      const telegramData = getTelegramUserData();
      const response = await createOrGetPlayer(telegramId, telegramData);
      
      if (!response) {
        throw new Error('Registration failed');
      }
      return response;
    } catch (err: any) {
      console.error('Registration error:', err.message);
      throw err;
    }
  };

  // 🔥 КРИТИЧЕСКИ ВАЖНО: ВСЕГДА ИСПОЛЬЗУЕМ НОВЫЙ ЭНДПОИНТ
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const telegramId = getTelegramId();
      const telegramData = getTelegramUserData();
      
      console.log('🚨 === ДИАГНОСТИКА fetchInitialData ===');
      console.log('telegramId:', telegramId);
      console.log('telegramData:', telegramData);
      console.log('🚨 === КОНЕЦ ДИАГНОСТИКИ ===');
      
      if (!telegramId) {
        setError('No telegram ID');
        return;
      }
      
      console.log(`🚀 fetchInitialData: Запуск для telegramId: ${telegramId}`);

      // 🔥 ВАЖНО: ВСЕГДА ИСПОЛЬЗУЕМ НОВЫЙ ЭНДПОИНТ
      console.log('🆕 Используем НОВЫЙ эндпоинт createOrGetPlayer');
      console.log('📱 Передаем telegramData:', telegramData);
      
      const playerData = await createOrGetPlayer(telegramId, telegramData);
      console.log('✅ Игрок создан/получен с данными:', {
        telegram_id: playerData.telegram_id,
        username: playerData.username,
        first_name: playerData.first_name
      });

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
          // Получаем обновленные данные через НОВЫЙ эндпоинт
          const updatedPlayerData = await createOrGetPlayer(telegramId, telegramData);
          playerData.referral_link = updatedPlayerData.referral_link;
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
      
      console.log('✅ fetchInitialData: Данные игрока успешно загружены:', {
        telegram_id: normalizedPlayer.telegram_id,
        username: normalizedPlayer.username,
        first_name: normalizedPlayer.first_name,
        language: normalizedPlayer.language
      });
      return normalizedPlayer;
    } catch (err: any) {
      console.log('❌ fetchInitialData ошибка:', err.message);
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Data loading error:', err);
      throw err;
    } finally {
      setLoading(false);
      console.log('🏁 fetchInitialData завершен');
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
    createOrGetPlayer,
  };
};