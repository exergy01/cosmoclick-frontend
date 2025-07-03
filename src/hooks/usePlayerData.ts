// Хук для управления данными игрока - ФИНАЛЬНАЯ ВЕРСИЯ
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

  // 🔥 ФУНКЦИЯ: Извлечение реферера из всех источников
  const extractReferralData = () => {
    const telegramWebApp = (window as any).Telegram?.WebApp;
    
    console.log('🔍 === ИЗВЛЕЧЕНИЕ РЕФЕРАЛЬНЫХ ДАННЫХ ===');
    console.log('🔍 TelegramWebApp:', telegramWebApp);
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 URL Search:', window.location.search);
    
    const referralData: any = {};
    
    // 🎯 ИСТОЧНИК 1: URL параметр tgWebAppStartParam (самый важный!)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tgWebAppStartParam = urlParams.get('tgWebAppStartParam');
      if (tgWebAppStartParam) {
        referralData.tgWebAppStartParam = tgWebAppStartParam;
        console.log('🎯 НАЙДЕН tgWebAppStartParam:', tgWebAppStartParam);
      }
      
      // Другие URL параметры
      const possibleParams = ['startapp', 'startApp', 'start', 'ref', 'referrer'];
      possibleParams.forEach(param => {
        const value = urlParams.get(param);
        if (value) {
          referralData[param] = value;
          console.log(`🎯 НАЙДЕН ${param}:`, value);
        }
      });
    } catch (err) {
      console.error('❌ Ошибка парсинга URL:', err);
    }
    
    // 🎯 ИСТОЧНИК 2: Telegram WebApp start_param
    if (telegramWebApp?.initDataUnsafe?.start_param) {
      referralData.start_param = telegramWebApp.initDataUnsafe.start_param;
      console.log('🎯 НАЙДЕН start_param:', referralData.start_param);
    }
    
    // 🎯 ИСТОЧНИК 3: Парсинг initData
    if (telegramWebApp?.initData) {
      try {
        const urlParams = new URLSearchParams(telegramWebApp.initData);
        const startParam = urlParams.get('start_param');
        if (startParam && !referralData.start_param) {
          referralData.start_param_from_initData = startParam;
          console.log('🎯 НАЙДЕН start_param из initData:', startParam);
        }
      } catch (err) {
        console.error('❌ Ошибка парсинга initData:', err);
      }
    }
    
    console.log('🔍 === ИТОГОВЫЕ РЕФЕРАЛЬНЫЕ ДАННЫЕ ===');
    console.log(referralData);
    
    return referralData;
  };

  // 🔥 ИСПРАВЛЕННАЯ регистрация нового игрока
  const registerNewPlayer = async (telegramId: string) => {
    try {
      console.log(`🎯 Создаем нового игрока: ${telegramId}`);
      
      // Получаем данные Telegram
      const telegramWebApp = (window as any).Telegram?.WebApp;
      const telegramUser = telegramWebApp?.initDataUnsafe?.user;
      
      // 🔍 Извлекаем ВСЕ реферальные данные
      const referralData = extractReferralData();
      
      // Создаем игрока через новый endpoint с реферальными данными
      const API_URL = process.env.NODE_ENV === 'production'
        ? 'https://cosmoclick-backend.onrender.com'
        : 'http://localhost:5000';
        
      console.log('🎯 Отправляем запрос на создание игрока с реферальными данными...');
      const response = await axios.post(`${API_URL}/api/player/create-with-referrer`, {
        telegramId,
        referralData
      });
      
      console.log('✅ Игрок создан через новый endpoint:', response.data);
      
      // Обновляем Telegram данные если доступны
      if (telegramUser && response.data) {
        try {
          await playerApi.updatePlayer(telegramId, {
            first_name: telegramUser.first_name || `User${telegramId.slice(-4)}`,
            username: telegramUser.username || `user_${telegramId}`
          });
          
          const updatedResponse = await playerApi.fetchPlayer(telegramId);
          console.log('✅ Telegram данные обновлены');
          return updatedResponse.data;
        } catch (updateErr) {
          console.error('❌ Ошибка обновления Telegram данных:', updateErr);
          return response.data;
        }
      }
      
      return response.data;
      
    } catch (err: any) {
      console.error('❌ Ошибка создания игрока:', err.response?.data || err.message);
      
      // Если новый endpoint не работает - fallback на старый способ
      console.log('🔄 Fallback на старый способ создания игрока...');
      try {
        const response = await playerApi.fetchPlayer(telegramId);
        return response.data;
      } catch (fallbackErr) {
        console.error('❌ Fallback тоже не работает:', fallbackErr);
        throw err;
      }
    }
  };

  // Загрузка полных данных игрока
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const telegramId = getTelegramId();
      
      console.log(`🎯 [INIT] Загрузка данных для: ${telegramId}`);
      
      if (!telegramId) {
        setError('No telegram ID');
        return;
      }

      let playerData;
      try {
        console.log('🎯 [INIT] Ищем игрока в БД...');
        const playerResponse = await playerApi.fetchPlayer(telegramId);
        playerData = playerResponse.data;
        console.log('✅ [INIT] Игрок найден:', playerData);
        
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
              console.log('✅ [INIT] Telegram данные обновлены');
            } catch (updateErr: any) {
              console.error('❌ [INIT] Ошибка обновления Telegram данных:', updateErr);
            }
          }
        }
        
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.log('🎯 [INIT] Игрок не найден, создаем нового...');
          playerData = await registerNewPlayer(telegramId);
        } else {
          throw err;
        }
      }

      // Загружаем рефералов
      let referrals: any[] = [];
      let honorBoard: any[] = [];
      
      try {
        const referralsResponse = await referralApi.getReferralsList(telegramId);
        referrals = referralsResponse.data || [];
        console.log('✅ [INIT] Рефералы загружены:', referrals.length);
      } catch (err: any) {
        console.error('❌ [INIT] Ошибка загрузки рефералов:', err);
      }

      try {
        const honorBoardResponse = await referralApi.getHonorBoard();
        honorBoard = honorBoardResponse.data || [];
        console.log('✅ [INIT] Доска почета загружена:', honorBoard.length);
      } catch (err: any) {
        console.error('❌ [INIT] Ошибка загрузки доски почета:', err);
      }

      // Создаем реферальную ссылку если её нет
      if (!playerData.referral_link) {
        try {
          console.log('🎯 [INIT] Создаем реферальную ссылку...');
          await referralApi.generateReferralLink(telegramId);
          const updatedResponse = await playerApi.fetchPlayer(telegramId);
          playerData = updatedResponse.data;
          console.log('✅ [INIT] Реферальная ссылка создана');
        } catch (err: any) {
          console.error('❌ [INIT] Ошибка создания реферальной ссылки:', err);
        }
      }

      const fullPlayerData = {
        ...playerData,
        referrals,
        honor_board: honorBoard,
        language: playerData.language,
      };

      const normalizedPlayer = createPlayerWithDefaults(fullPlayerData, 1);
      setPlayer(normalizedPlayer);
      setError(null);
      
      console.log('✅ [INIT] Загрузка завершена успешно');
      return normalizedPlayer;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      console.error('❌ [INIT] Ошибка загрузки данных:', errorMessage);
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
    extractReferralData, // экспортируем для отладки
  };
};