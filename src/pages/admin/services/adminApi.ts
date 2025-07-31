// pages/admin/services/adminApi.ts
import axios from 'axios';
import type {
  AdminStats,
  PlayerData,
  SearchResult,
  BalanceManageForm,
  BalanceUpdateResult,
  TonRateForm,
  TonRateUpdateResult,
  AdminAuthStatus,
  AdminApiError
} from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Создаем экземпляр axios с базовой конфигурацией
const adminApi = axios.create({
  baseURL: `${API_URL}/api/admin`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Функция для безопасного получения Telegram ID
const getTelegramId = (): string | null => {
  try {
    // Безопасный доступ к Telegram WebApp через any
    const telegramWebApp = (window as any)?.Telegram?.WebApp;
    
    if (telegramWebApp?.initDataUnsafe?.user?.id) {
      return String(telegramWebApp.initDataUnsafe.user.id);
    }
    
    // Проверяем в URL параметрах
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('tgWebAppStartParam');
    if (startParam) {
      console.log('🔍 Found startParam:', startParam);
    }
    
    // Проверяем localStorage (может быть сохранен ранее)
    const savedId = localStorage.getItem('telegramId');
    if (savedId) {
      console.log('💾 Found saved Telegram ID:', savedId);
      return savedId;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Ошибка получения Telegram ID:', error);
    return null;
  }
};

// Интерцептор для логирования запросов
adminApi.interceptors.request.use(
  (config) => {
    console.log(`🔧 Admin API запрос: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    
    // Отладочная информация для мобильных устройств
    const telegramWebApp = (window as any)?.Telegram?.WebApp;
    
    console.log('📱 Debug info:', {
      userAgent: navigator.userAgent,
      isMobile: /Mobi|Android/i.test(navigator.userAgent),
      telegramWebApp: !!telegramWebApp,
      hasInitDataUnsafe: !!telegramWebApp?.initDataUnsafe,
      hasUser: !!telegramWebApp?.initDataUnsafe?.user,
      userId: telegramWebApp?.initDataUnsafe?.user?.id,
      userName: telegramWebApp?.initDataUnsafe?.user?.first_name,
      userUsername: telegramWebApp?.initDataUnsafe?.user?.username,
      location: window.location.href,
      webAppKeys: telegramWebApp ? Object.keys(telegramWebApp) : []
    });
    
    return config;
  },
  (error) => {
    console.error('🔧 Ошибка конфигурации запроса:', error);
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов
adminApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Admin API ответ: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Admin API ошибка:', error.response?.data || error.message);
    
    // Создаем стандартизированную ошибку
    const adminError: AdminApiError = {
      message: error.response?.data?.error || error.message || 'Неизвестная ошибка',
      status: error.response?.status,
      code: error.code
    };
    
    return Promise.reject(adminError);
  }
);

// Функции API
export const adminApiService = {
  
  // Проверка статуса админа
  async checkAdminStatus(telegramId?: string): Promise<AdminAuthStatus> {
    try {
      const id = telegramId || getTelegramId();
      
      if (!id) {
        console.error('❌ Telegram ID не найден в checkAdminStatus');
        
        const telegramWebApp = (window as any)?.Telegram?.WebApp;
        console.log('🔍 Доступные данные Telegram:', {
          telegramExists: !!(window as any)?.Telegram,
          webAppExists: !!telegramWebApp,
          initDataUnsafe: telegramWebApp?.initDataUnsafe,
          user: telegramWebApp?.initDataUnsafe?.user,
          webAppProps: telegramWebApp ? Object.keys(telegramWebApp) : [],
          locationSearch: window.location.search,
          savedId: localStorage.getItem('telegramId')
        });
        
        throw new Error('Не удалось получить Telegram ID. Убедитесь, что приложение запущено из Telegram.');
      }
      
      console.log('🔍 Проверяем админский статус для ID:', id);
      const response = await adminApi.get(`/check/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка проверки админского статуса:', error);
      throw error;
    }
  },

  // Загрузка общей статистики
  async getStats(telegramId?: string): Promise<AdminStats> {
    try {
      const id = telegramId || getTelegramId();
      
      if (!id) {
        console.error('❌ Telegram ID не найден в getStats');
        
        const telegramWebApp = (window as any)?.Telegram?.WebApp;
        console.log('🔍 Telegram WebApp данные:', {
          exists: !!telegramWebApp,
          initDataUnsafe: telegramWebApp?.initDataUnsafe,
          user: telegramWebApp?.initDataUnsafe?.user,
          allTelegramProps: (window as any)?.Telegram ? Object.keys((window as any).Telegram) : []
        });
        
        throw new Error('Не удалось получить Telegram ID для загрузки статистики');
      }
      
      console.log('📊 Загружаем статистику для ID:', id);
      const response = await adminApi.get(`/stats/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки статистики:', error);
      throw error;
    }
  },

  // Поиск игроков
  async searchPlayers(telegramId?: string, query?: string): Promise<SearchResult[]> {
    try {
      const id = telegramId || getTelegramId();
      
      if (!id) {
        throw new Error('Не удалось получить Telegram ID для поиска');
      }
      
      if (!query?.trim()) {
        return [];
      }
      
      const response = await adminApi.get(`/search/${id}`, {
        params: { q: query }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('❌ Ошибка поиска игроков:', error);
      throw error;
    }
  },

  // Получение подробных данных игрока
  async getPlayerData(telegramId?: string, playerId?: string): Promise<PlayerData> {
    try {
      const id = telegramId || getTelegramId();
      
      if (!id || !playerId) {
        throw new Error('Не хватает данных для загрузки информации об игроке');
      }
      
      const response = await adminApi.get(`/player/${id}/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки данных игрока:', error);
      throw error;
    }
  },

  // Изменение баланса игрока
  async updatePlayerBalance(telegramId?: string, form?: BalanceManageForm): Promise<BalanceUpdateResult> {
    try {
      const id = telegramId || getTelegramId();
      
      if (!id || !form) {
        throw new Error('Не хватает данных для обновления баланса');
      }

      if (!form.playerId || !form.amount) {
        throw new Error('Заполните все поля');
      }

      const response = await adminApi.post(`/update-balance/${id}`, {
        playerId: form.playerId,
        currency: form.currency,
        operation: form.operation,
        amount: parseFloat(form.amount)
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления баланса:', error);
      throw error;
    }
  },

  // Верификация игрока
  async verifyPlayer(telegramId?: string, playerId?: string, verified?: boolean): Promise<void> {
    try {
      const id = telegramId || getTelegramId();
      
      if (!id || !playerId || verified === undefined) {
        throw new Error('Не хватает данных для верификации игрока');
      }
      
      await adminApi.post(`/verify-player/${id}`, {
        playerId,
        verified
      });
    } catch (error) {
      console.error('❌ Ошибка верификации игрока:', error);
      throw error;
    }
  },

  // Обновление курса TON
  async updateTonRate(telegramId?: string, form?: TonRateForm): Promise<TonRateUpdateResult> {
    try {
      const id = telegramId || getTelegramId();
      
      if (!id || !form) {
        throw new Error('Не хватает данных для обновления курса TON');
      }

      if (!form.newRate || parseFloat(form.newRate) <= 0) {
        throw new Error('Введите корректный курс TON');
      }

      const response = await adminApi.post(`/update-ton-rate/${id}`, {
        newRate: parseFloat(form.newRate)
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления курса TON:', error);
      throw error;
    }
  },

  // Снятие блокировки обмена
  async unblockExchange(telegramId?: string, exchangeType: string = 'stars_to_cs'): Promise<void> {
    try {
      const id = telegramId || getTelegramId();
      
      if (!id) {
        throw new Error('Не удалось получить Telegram ID для снятия блокировки');
      }
      
      await adminApi.post(`/unblock-exchange/${id}`, {
        exchangeType
      });
    } catch (error) {
      console.error('❌ Ошибка снятия блокировки:', error);
      throw error;
    }
  }
};

// Вспомогательные функции для обработки ошибок
export const handleAdminApiError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as AdminApiError).message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Произошла неожиданная ошибка';
};

// Проверка доступности API
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('❌ API недоступен:', error);
    return false;
  }
};

export default adminApiService;