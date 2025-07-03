// Хук для управления данными игрока - ИСПРАВЛЕННАЯ ВЕРСИЯ
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

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Универсальное извлечение реферера
  const extractReferrer = () => {
    const telegramWebApp = (window as any).Telegram?.WebApp;
    let referrerId = '1222791281'; // дефолтный рефер
    
    console.log('🔍 Извлекаем реферера...');
    console.log('🔍 TelegramWebApp:', telegramWebApp);
    console.log('🔍 initDataUnsafe:', telegramWebApp?.initDataUnsafe);
    
    // Приоритет 1: start_param из Telegram WebApp (для Mini Apps)
    if (telegramWebApp?.initDataUnsafe?.start_param) {
      referrerId = telegramWebApp.initDataUnsafe.start_param;
      console.log('🎯 Реферер найден в start_param:', referrerId);
      return referrerId;
    }
    
    // Приоритет 2: Парсинг initData
    if (telegramWebApp?.initData) {
      try {
        const urlParams = new URLSearchParams(telegramWebApp.initData);
        const startParam = urlParams.get('start_param');
        if (startParam) {
          referrerId = startParam;
          console.log('🎯 Реферер найден в initData:', referrerId);
          return referrerId;
        }
      } catch (err) {
        console.error('❌ Ошибка парсинга initData:', err);
      }
    }
    
    // Приоритет 3: URL параметры страницы
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tgWebAppStartParam = urlParams.get('tgWebAppStartParam');
      if (tgWebAppStartParam) {
        referrerId = tgWebAppStartParam;
        console.log('🎯 Реферер найден в URL (tgWebAppStartParam):', referrerId);
        return referrerId;
      }
    } catch (err) {
      console.error('❌ Ошибка парсинга URL:', err);
    }
    
    // Приоритет 4: Парсинг текущего URL на наличие реферальных паттернов
    try {
      const currentUrl = window.location.href;
      const patterns = [
        /[?&]start=([^&]+)/,
        /[?&]startapp=([^&]+)/,
        /[?&]startApp=([^&]+)/,
        /[?&]ref=([^&]+)/,
        /[?&]referrer=([^&]+)/
      ];
      
      for (const pattern of patterns) {
        const match = currentUrl.match(pattern);
        if (match && match[1]) {
          referrerId = match[1];
          console.log('🎯 Реферер найден в URL (паттерн):', referrerId);
          return referrerId;
        }
      }
    } catch (err) {
      console.error('❌ Ошибка парсинга URL паттернов:', err);
    }
    
    console.log('⚠️ Реферер не найден, используем дефолтный:', referrerId);
    return referrerId;
  };

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Регистрация нового игрока
  const registerNewPlayer = async (telegramId: string) => {
    try {
      console.log(`🎯 Создаем нового игрока: ${telegramId}`);
      
      // Получаем данные Telegram
      const telegramWebApp = (window as any).Telegram?.WebApp;
      const telegramUser = telegramWebApp?.initDataUnsafe?.user;
      
      // 🔥 ИСПРАВЛЕНО: Извлекаем реферера универсальным способом
      const referrerId = extractReferrer();
      
      const referralData = {
        start_param: telegramWebApp?.initDataUnsafe?.start_param || null,
        initData: telegramWebApp?.initData || null,
        url: window.location.href || null,
        extractedReferrer: referrerId // добавляем извлеченного реферера
      };
      
      console.log('🔗 Данные для создания игрока:', {
        telegramId,
        referrerId,
        referralData
      });
      
      // Создаем игрока через новый endpoint
      const API_URL = process.env.NODE_ENV === 'production'
        ? 'https://cosmoclick-backend.onrender.com'
        : 'http://localhost:5000';
        
      const response = await axios.post(`${API_URL}/api/player/create`, {
        telegramId,
        referralData
      });
      
      console.log('✅ Игрок создан:', response.data);
      
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
      throw err;
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
    extractReferrer, // экспортируем для отладки
  };
};