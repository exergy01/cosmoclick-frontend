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

// Интерцептор для логирования запросов
adminApi.interceptors.request.use(
  (config) => {
    console.log(`🔧 Admin API запрос: ${config.method?.toUpperCase()} ${config.url}`, config.data);
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
  async checkAdminStatus(telegramId: string): Promise<AdminAuthStatus> {
    try {
      const response = await adminApi.get(`/check/${telegramId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка проверки админского статуса:', error);
      throw error;
    }
  },

  // Загрузка общей статистики
  async getStats(telegramId: string): Promise<AdminStats> {
    try {
      const response = await adminApi.get(`/stats/${telegramId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки статистики:', error);
      throw error;
    }
  },

  // Поиск игроков
  async searchPlayers(telegramId: string, query: string): Promise<SearchResult[]> {
    try {
      if (!query.trim()) {
        return [];
      }
      
      const response = await adminApi.get(`/search/${telegramId}`, {
        params: { q: query }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('❌ Ошибка поиска игроков:', error);
      throw error;
    }
  },

  // Получение подробных данных игрока
  async getPlayerData(telegramId: string, playerId: string): Promise<PlayerData> {
    try {
      const response = await adminApi.get(`/player/${telegramId}/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки данных игрока:', error);
      throw error;
    }
  },

  // Изменение баланса игрока
  async updatePlayerBalance(telegramId: string, form: BalanceManageForm): Promise<BalanceUpdateResult> {
    try {
      if (!form.playerId || !form.amount) {
        throw new Error('Заполните все поля');
      }

      const response = await adminApi.post(`/update-balance/${telegramId}`, {
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
  async verifyPlayer(telegramId: string, playerId: string, verified: boolean): Promise<void> {
    try {
      await adminApi.post(`/verify-player/${telegramId}`, {
        playerId,
        verified
      });
    } catch (error) {
      console.error('❌ Ошибка верификации игрока:', error);
      throw error;
    }
  },

  // Обновление курса TON
  async updateTonRate(telegramId: string, form: TonRateForm): Promise<TonRateUpdateResult> {
    try {
      if (!form.newRate || parseFloat(form.newRate) <= 0) {
        throw new Error('Введите корректный курс TON');
      }

      const response = await adminApi.post(`/update-ton-rate/${telegramId}`, {
        newRate: parseFloat(form.newRate)
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления курса TON:', error);
      throw error;
    }
  },

  // Снятие блокировки обмена
  async unblockExchange(telegramId: string, exchangeType: string = 'stars_to_cs'): Promise<void> {
    try {
      await adminApi.post(`/unblock-exchange/${telegramId}`, {
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