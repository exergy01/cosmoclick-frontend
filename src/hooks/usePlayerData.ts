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
      
      const playerData = createPlayerWithDefaults(response.data, currentSystem);
      setPlayer(playerData);
      setError(null);
      
      return playerData;
    } catch (err: any) {
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
      
      const playerData = createPlayerWithDefaults(response.data, currentSystem);
      setPlayer(playerData);
      setError(null);
      
      return playerData;
    } catch (err: any) {
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
      
      const playerData = createPlayerWithDefaults(response.data, currentSystem);
      setPlayer(playerData);
      setError(null);
      
      return playerData;
    } catch (err: any) {
      setError(`Failed to refresh player: ${err.message}`);
      throw err;
    }
  };

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Регистрация нового игрока с реферальной логикой
  const registerNewPlayer = async (telegramId: string) => {
    try {
      const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      
      console.log(`🎯 Создаем нового игрока: ${telegramId}`);
      
      // 1️⃣ СОЗДАЕМ ИГРОКА СНАЧАЛА
      const response = await playerApi.registerNewPlayer(telegramId);
      let playerData = response.data;
      
      // 2️⃣ Если есть данные Telegram - обновляем игрока
      if (telegramUser && playerData) {
        try {
          await playerApi.updatePlayer(telegramId, {
            first_name: telegramUser.first_name || `User${telegramId.slice(-4)}`,
            username: telegramUser.username || `user_${telegramId}`
          });
          
          // Получаем обновленного игрока
          const updatedResponse = await playerApi.fetchPlayer(telegramId);
          playerData = updatedResponse.data;
          
        } catch (updateErr) {
          console.error('Failed to update player with Telegram data:', updateErr);
        }
      }
      
      // 3️⃣ ТЕПЕРЬ РЕГИСТРИРУЕМ В РЕФЕРАЛЫ (ИГРОК УЖЕ СОЗДАН)
      try {
        // Получаем реферера из URL или используем дефолтного
        const initData = (window as any).Telegram?.WebApp?.initData;
        const referrerIdFromURL = initData ? new URLSearchParams(initData).get('start') : null;
        const referrerId = referrerIdFromURL || '1222791281'; // дефолтный рефер
        
        console.log(`🎯 Регистрируем нового игрока ${telegramId} под рефером ${referrerId}`);
        
        await referralApi.registerReferral(telegramId, referrerId);
        console.log(`✅ Реферальная регистрация успешна: ${telegramId} → ${referrerId}`);
        
      } catch (referralErr: any) {
        console.error('❌ Failed to register referral:', referralErr);
        // НЕ падаем если реферальная регистрация не удалась - игрок уже создан
      }
      
      if (!playerData) {
        throw new Error('Registration failed');
      }
      
      return playerData;
      
    } catch (err: any) {
      console.error('❌ Registration error:', err.message);
      throw err;
    }
  };

  // Загрузка полных данных игрока включая рефералов
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const telegramId = getTelegramId();
      
      // Получаем данные Telegram
      const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      
      if (!telegramId) {
        setError('No telegram ID');
        return;
      }

      let playerData;
      try {
        const playerResponse = await playerApi.fetchPlayer(telegramId);
        playerData = playerResponse.data;
        
        // Если игрок существует, но у него дефолтные имена - обновляем
        if (telegramUser && playerData) {
          const needsUpdate = (
            playerData.first_name?.startsWith('User') || 
            playerData.username?.startsWith('user_') ||
            !playerData.first_name ||
            !playerData.username
          );
          
          if (needsUpdate) {
            try {
              await playerApi.updatePlayer(telegramId, {
                first_name: telegramUser.first_name || playerData.first_name,
                username: telegramUser.username || playerData.username
              });
              
              // Получаем обновленного игрока
              const updatedResponse = await playerApi.fetchPlayer(telegramId);
              playerData = updatedResponse.data;
            } catch (updateErr) {
              console.error('Failed to update player with Telegram data:', updateErr);
            }
          }
        }
        
      } catch (err: any) {
        if (err.response?.status === 404) {
          // 🔥 ИГРОК НЕ НАЙДЕН - СОЗДАЕМ С РЕФЕРАЛЬНОЙ ЛОГИКОЙ
          console.log(`🎯 Игрок ${telegramId} не найден, создаем нового...`);
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
      } catch (err) {
        console.error('Failed to load referrals:', err);
      }

      try {
        const honorBoardResponse = await referralApi.getHonorBoard();
        honorBoard = honorBoardResponse.data || [];
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
        language: playerData.language,
      };

      const normalizedPlayer = createPlayerWithDefaults(fullPlayerData, 1);
      setPlayer(normalizedPlayer);
      setError(null);
      
      return normalizedPlayer;
    } catch (err: any) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Data loading error:', err);
      throw err;
    } finally {
      setLoading(false);
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