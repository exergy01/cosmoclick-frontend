// ========================================
// 1. ИСПРАВЛЕННЫЙ usePlayerData.ts
// ========================================

import { useState } from 'react';
import axios from 'axios';
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
  [key: string]: any;
}

export const usePlayerData = () => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // 🔥 ГЛАВНАЯ ФУНКЦИЯ: Извлечение реферальных данных
  const extractReferralData = () => {
    const telegramWebApp = (window as any).Telegram?.WebApp;
    const referralData: any = {};
    
    console.log('🔍 === ИЗВЛЕЧЕНИЕ РЕФЕРАЛЬНЫХ ДАННЫХ ===');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 URL Search:', window.location.search);
    
    // 🎯 ИСТОЧНИК 1: URL параметр tgWebAppStartParam (САМЫЙ ВАЖНЫЙ!)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tgWebAppStartParam = urlParams.get('tgWebAppStartParam');
      if (tgWebAppStartParam) {
        referralData.tgWebAppStartParam = tgWebAppStartParam;
        console.log('🎯🎯 НАЙДЕН tgWebAppStartParam:', tgWebAppStartParam);
      }
    } catch (err) {
      console.error('❌ Ошибка парсинга URL:', err);
    }
    
    // 🎯 ИСТОЧНИК 2: Telegram WebApp start_param
    if (telegramWebApp?.initDataUnsafe?.start_param) {
      referralData.start_param = telegramWebApp.initDataUnsafe.start_param;
      console.log('🎯 start_param:', referralData.start_param);
    }
    
    console.log('🔍 ИТОГОВЫЕ ДАННЫЕ:', referralData);
    return referralData;
  };

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Использует НОВЫЙ ENDPOINT
  const registerNewPlayer = async (telegramId: string) => {
    try {
      console.log(`🎯 СОЗДАЕМ ИГРОКА ЧЕРЕЗ НОВЫЙ ENDPOINT: ${telegramId}`);
      
      const telegramWebApp = (window as any).Telegram?.WebApp;
      const telegramUser = telegramWebApp?.initDataUnsafe?.user;
      
      // Извлекаем реферальные данные
      const referralData = extractReferralData();
      
      const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';
              
      console.log('🚀 ОТПРАВЛЯЕМ ЗАПРОС НА НОВЫЙ ENDPOINT...');
      console.log('📦 Данные:', { telegramId, referralData });
      
      // 🔥 ВЫЗЫВАЕМ НОВЫЙ ENDPOINT
      const response = await axios.post(`${API_URL}/api/player/create-with-referrer`, {
        telegramId,
        referralData
      });
      
      console.log('✅ ОТВЕТ ОТ НОВОГО ENDPOINT:', response.data);
      
      // Обновляем Telegram данные если доступны
      if (telegramUser && response.data) {
        try {
          await playerApi.updatePlayer(telegramId, {
            first_name: telegramUser.first_name || `User${telegramId.slice(-4)}`,
            username: telegramUser.username || `user_${telegramId}`
          });
          
          const updatedResponse = await playerApi.fetchPlayer(telegramId);
          return updatedResponse.data;
        } catch (updateErr) {
          console.error('❌ Ошибка обновления Telegram данных:', updateErr);
          return response.data;
        }
      }
      
      return response.data;
      
    } catch (err: any) {
      console.error('❌ ОШИБКА НОВОГО ENDPOINT:', err.response?.data || err.message);
      
      // Fallback на старый способ
      console.log('🔄 Fallback на старый способ...');
      try {
        const response = await playerApi.fetchPlayer(telegramId);
        return response.data;
      } catch (fallbackErr) {
        throw err;
      }
    }
  };

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Правильный порядок добавления рефералов
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const telegramId = getTelegramId();
      
      console.log(`🎯 [INIT] Загрузка для: ${telegramId}`);
      
      if (!telegramId) {
        setError('No telegram ID');
        return;
      }

      let playerData;
      try {
        console.log('🎯 [INIT] Ищем игрока...');
        const playerResponse = await playerApi.fetchPlayer(telegramId);
        playerData = playerResponse.data;
        console.log('✅ [INIT] Игрок найден');
        
        // Обновляем Telegram данные если нужно
        const telegramUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
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
              
              const updatedResponse = await playerApi.fetchPlayer(telegramId);
              playerData = updatedResponse.data;
            } catch (updateErr: any) {
              console.error('❌ [INIT] Ошибка обновления Telegram данных:', updateErr);
            }
          }
        }
        
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.log('🎯 [INIT] Игрок не найден, создаем...');
          playerData = await registerNewPlayer(telegramId);
        } else {
          throw err;
        }
      }

      // Загружаем рефералов
      let referrals: any[] = [];
      let honorBoard: any[] = [];
      
      try {
        console.log('🔄 [INIT] Загружаем рефералов...');
        const referralsResponse = await referralApi.getReferralsList(telegramId);
        referrals = Array.isArray(referralsResponse.data) ? referralsResponse.data : [];
        console.log(`✅ [INIT] Загружено рефералов: ${referrals.length}`, referrals);
      } catch (err: any) {
        console.error('❌ [INIT] Ошибка загрузки рефералов:', err);
        referrals = [];
      }

      try {
        console.log('🔄 [INIT] Загружаем доску почета...');
        const honorBoardResponse = await referralApi.getHonorBoard();
        honorBoard = Array.isArray(honorBoardResponse.data) ? honorBoardResponse.data : [];
        console.log(`✅ [INIT] Загружена доска почета: ${honorBoard.length}`, honorBoard);
      } catch (err: any) {
        console.error('❌ [INIT] Ошибка загрузки доски почета:', err);
        honorBoard = [];
      }

      // Создаем реферальную ссылку если её нет
      if (!playerData.referral_link) {
        try {
          await referralApi.generateReferralLink(telegramId);
          const updatedResponse = await playerApi.fetchPlayer(telegramId);
          playerData = updatedResponse.data;
        } catch (err: any) {
          console.error('❌ [INIT] Ошибка создания реферальной ссылки:', err);
        }
      }

      // 🔥 ИСПРАВЛЕНИЕ: Добавляем рефералов ПЕРЕД createPlayerWithDefaults
      const fullPlayerData = {
        ...playerData,
        language: playerData.language,
        referrals: referrals,           // ← ПЕРЕНЕСЕНО СЮДА!
        honor_board: honorBoard,        // ← ПЕРЕНЕСЕНО СЮДА!
      };
      
      console.log('🔍 [INIT] Данные перед нормализацией:', {
        referrals_count: fullPlayerData.referrals_count,
        referrals_length: fullPlayerData.referrals?.length,
        referrals_type: typeof fullPlayerData.referrals,
        honor_board_length: fullPlayerData.honor_board?.length,
        honor_board_type: typeof fullPlayerData.honor_board
      });
      
      // 🔥 ТЕПЕРЬ createPlayerWithDefaults получает рефералов и не перезаписывает их
      const normalizedPlayer = createPlayerWithDefaults(fullPlayerData, 1);
      
      console.log('🔍 [INIT] Данные после нормализации:', {
        referrals_count: normalizedPlayer.referrals_count,
        referrals_length: normalizedPlayer.referrals?.length,
        referrals_type: typeof normalizedPlayer.referrals,
        honor_board_length: normalizedPlayer.honor_board?.length,
        honor_board_type: typeof normalizedPlayer.honor_board
      });
      
      setPlayer(normalizedPlayer);
      setError(null);
      
      console.log('✅ [INIT] Загрузка завершена с рефералами!');
      return normalizedPlayer;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      console.error('❌ [INIT] Ошибка:', errorMessage);
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
    extractReferralData,
  };
};