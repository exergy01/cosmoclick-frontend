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
// Регистрация нового игрока с реферальной логикой
const registerNewPlayer = async (telegramId: string) => {
  try {
    const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    
    console.log(`🎯 [STEP 1] Создаем нового игрока: ${telegramId}`);
    
    // 1️⃣ СОЗДАЕМ ИГРОКА СНАЧАЛА
    let response;
    try {
      response = await playerApi.registerNewPlayer(telegramId);
      console.log(`✅ [STEP 1] Игрок создан успешно:`, response.data);
    } catch (createErr: any) {
      console.error(`❌ [STEP 1] Ошибка создания игрока:`, createErr.response?.data || createErr.message);
      throw createErr;
    }
    
    let playerData = response.data;
    
    // 2️⃣ Если есть данные Telegram - обновляем игрока
    if (telegramUser && playerData) {
      try {
        console.log(`🎯 [STEP 2] Обновляем данные Telegram:`, telegramUser);
        
        await playerApi.updatePlayer(telegramId, {
          first_name: telegramUser.first_name || `User${telegramId.slice(-4)}`,
          username: telegramUser.username || `user_${telegramId}`
        });
        
        // Получаем обновленного игрока
        const updatedResponse = await playerApi.fetchPlayer(telegramId);
        playerData = updatedResponse.data;
        console.log(`✅ [STEP 2] Данные Telegram обновлены`);
        
      } catch (updateErr: any) {
        console.error(`❌ [STEP 2] Ошибка обновления Telegram данных:`, updateErr.response?.data || updateErr.message);
        // Продолжаем даже если обновление не удалось
      }
    }
    
    // 3️⃣ ТЕПЕРЬ РЕГИСТРИРУЕМ В РЕФЕРАЛЫ (ИГРОК УЖЕ СОЗДАН)
    try {
      // Получаем реферера из URL или используем дефолтного
      const initData = (window as any).Telegram?.WebApp?.initData;
      const referrerIdFromURL = initData ? new URLSearchParams(initData).get('start') : null;
      const referrerId = referrerIdFromURL || '1222791281'; // дефолтный рефер
      
      console.log(`🎯 [STEP 3] Регистрируем в рефералы: ${telegramId} → ${referrerId}`);
      
      await referralApi.registerReferral(telegramId, referrerId);
      console.log(`✅ [STEP 3] Реферальная регистрация успешна`);
      
    } catch (referralErr: any) {
      console.error(`❌ [STEP 3] Ошибка реферальной регистрации:`, referralErr.response?.data || referralErr.message);
      // НЕ падаем если реферальная регистрация не удалась - игрок уже создан
    }
    
    if (!playerData) {
      throw new Error('Registration failed - no player data');
    }
    
    console.log(`✅ [FINAL] Регистрация завершена успешно`);
    return playerData;
    
  } catch (err: any) {
    console.error('❌ [FINAL] Registration error:', err.response?.data || err.message);
    throw err;
  }
};

// Загрузка полных данных игрока включая рефералов
const fetchInitialData = async () => {
  try {
    setLoading(true);
    const telegramId = getTelegramId();
    
    console.log(`🎯 [INIT] Начинаем загрузку данных для: ${telegramId}`);
    
    // Получаем данные Telegram
    const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    
    if (!telegramId) {
      setError('No telegram ID');
      return;
    }

    let playerData;
    try {
      console.log(`🎯 [INIT] Ищем существующего игрока...`);
      const playerResponse = await playerApi.fetchPlayer(telegramId);
      playerData = playerResponse.data;
      console.log(`✅ [INIT] Игрок найден:`, playerData);
      
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
            console.log(`🎯 [INIT] Обновляем имена игрока...`);
            await playerApi.updatePlayer(telegramId, {
              first_name: telegramUser.first_name || playerData.first_name,
              username: telegramUser.username || playerData.username
            });
            
            // Получаем обновленного игрока
            const updatedResponse = await playerApi.fetchPlayer(telegramId);
            playerData = updatedResponse.data;
            console.log(`✅ [INIT] Имена обновлены`);
          } catch (updateErr: any) {
            console.error('❌ [INIT] Failed to update player with Telegram data:', updateErr.response?.data || updateErr.message);
          }
        }
      }
      
    } catch (err: any) {
      if (err.response?.status === 404) {
        // 🔥 ИГРОК НЕ НАЙДЕН - СОЗДАЕМ С РЕФЕРАЛЬНОЙ ЛОГИКОЙ
        console.log(`🎯 [INIT] Игрок ${telegramId} не найден, создаем нового...`);
        playerData = await registerNewPlayer(telegramId);
      } else {
        console.error(`❌ [INIT] Ошибка поиска игрока:`, err.response?.data || err.message);
        throw err;
      }
    }

    // Загружаем рефералов и доску почета
    let referrals: any[] = [];
    let honorBoard: any[] = [];
    
    try {
      console.log(`🎯 [INIT] Загружаем рефералов...`);
      const referralsResponse = await referralApi.getReferralsList(telegramId);
      referrals = referralsResponse.data || [];
      console.log(`✅ [INIT] Рефералы загружены:`, referrals.length);
    } catch (err: any) {
      console.error('❌ [INIT] Failed to load referrals:', err.response?.data || err.message);
    }

    try {
      console.log(`🎯 [INIT] Загружаем доску почета...`);
      const honorBoardResponse = await referralApi.getHonorBoard();
      honorBoard = honorBoardResponse.data || [];
      console.log(`✅ [INIT] Доска почета загружена:`, honorBoard.length);
    } catch (err: any) {
      console.error('❌ [INIT] Failed to load honor board:', err.response?.data || err.message);
    }

    // Создаем реферальную ссылку если её нет
    if (!playerData.referral_link) {
      try {
        console.log(`🎯 [INIT] Создаем реферальную ссылку...`);
        await referralApi.generateReferralLink(telegramId);
        const updatedResponse = await playerApi.fetchPlayer(telegramId);
        playerData = updatedResponse.data;
        console.log(`✅ [INIT] Реферальная ссылка создана`);
      } catch (err: any) {
        console.error('❌ [INIT] Failed to generate referral link:', err.response?.data || err.message);
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
    
    console.log(`✅ [INIT] Загрузка завершена успешно`);
    return normalizedPlayer;
  } catch (err: any) {
    const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
    console.error('❌ [INIT] Data loading error:', errorMessage);
    setError(`Failed to fetch data: ${errorMessage}`);
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