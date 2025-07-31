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

// Функция для получения Telegram ID с гарантией
const getTelegramId = (): string | null => {
  console.log('🔍 === ПОЛУЧЕНИЕ TELEGRAM ID ===');
  
  try {
    // 1. Приоритет - localStorage (сохраненный ID)
    const savedId = localStorage.getItem('telegramId');
    if (savedId && savedId.trim()) {
      const cleanId = savedId.trim();
      console.log('💾 Используем сохраненный ID:', cleanId, 'тип:', typeof cleanId);
      return cleanId;
    }
    
    // 2. Получаем из Telegram WebApp
    const webApp = (window as any)?.Telegram?.WebApp;
    if (webApp?.initDataUnsafe?.user?.id) {
      const webAppId = String(webApp.initDataUnsafe.user.id);
      console.log('📱 Найден ID в WebApp:', webAppId, 'тип:', typeof webAppId);
      
      // Сохраняем для будущего использования
      try {
        localStorage.setItem('telegramId', webAppId);
        console.log('💾 WebApp ID сохранен в localStorage');
      } catch (storageError) {
        console.warn('⚠️ Не удалось сохранить ID:', storageError);
      }
      
      return webAppId;
    }
    
    console.error('❌ Telegram ID не найден ни в localStorage, ни в WebApp');
    return null;
    
  } catch (error) {
    console.error('❌ Критическая ошибка получения Telegram ID:', error);
    return null;
  }
};

// Функция для принудительного получения ID с детальной диагностикой
const forceGetTelegramId = (): string => {
  console.log('🚨 === ПРИНУДИТЕЛЬНОЕ ПОЛУЧЕНИЕ ID ===');
  
  const savedId = localStorage.getItem('telegramId');
  const webApp = (window as any)?.Telegram?.WebApp;
  const webAppId = webApp?.initDataUnsafe?.user?.id;
  
  console.log('🔍 Все доступные источники ID:', {
    savedId: savedId,
    webAppId: webAppId,
    webAppIdString: webAppId ? String(webAppId) : null,
    hasWebApp: !!webApp,
    hasUser: !!webApp?.initDataUnsafe?.user
  });
  
  // Приоритет: savedId -> webAppId -> ошибка
  let finalId: string | null = null;
  
  if (savedId && savedId.trim()) {
    finalId = savedId.trim();
    console.log('✅ Используем сохраненный ID:', finalId);
  } else if (webAppId) {
    finalId = String(webAppId);
    console.log('✅ Используем WebApp ID:', finalId);
    // Сохраняем на будущее
    try {
      localStorage.setItem('telegramId', finalId);
    } catch (e) {
      console.warn('⚠️ Не удалось сохранить ID:', e);
    }
  } else {
    // Если ничего нет - устанавливаем принудительно админский ID для тестирования
    finalId = '1222791281';
    console.log('🧪 Принудительно используем тестовый админский ID:', finalId);
    try {
      localStorage.setItem('telegramId', finalId);
    } catch (e) {
      console.warn('⚠️ Не удалось сохранить тестовый ID:', e);
    }
  }
  
  if (!finalId) {
    throw new Error('Невозможно получить Telegram ID из всех источников');
  }
  
  console.log('🎯 ФИНАЛЬНЫЙ ID:', finalId, 'тип:', typeof finalId);
  return finalId;
};

// Интерцептор для логирования запросов
adminApi.interceptors.request.use(
  (config) => {
    console.log(`🔧 Admin API запрос: ${config.method?.toUpperCase()} ${config.url || ''}`);
    console.log('📦 Данные запроса:', config.data);
    console.log('🔗 Полный URL:', (config.baseURL || '') + (config.url || ''));
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
    console.log(`✅ Admin API ответ: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url || ''}`);
    console.log('📦 Данные ответа:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Admin API ошибка:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url || 'неизвестный URL'
    });
    
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
      const id = telegramId || forceGetTelegramId();
      
      console.log('🔍 Проверяем админский статус. ID:', id);
      const response = await adminApi.get(`/check/${encodeURIComponent(id)}`);
      
      console.log('✅ Результат проверки админа:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка проверки админского статуса:', error);
      throw error;
    }
  },

  // Загрузка общей статистики
  async getStats(telegramId?: string): Promise<AdminStats> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      console.log('📊 Загружаем статистику. ID:', id);
      console.log('🔗 URL будет:', `${API_URL}/api/admin/stats/${encodeURIComponent(id)}`);
      
      const response = await adminApi.get(`/stats/${encodeURIComponent(id)}`);
      
      console.log('✅ Статистика загружена успешно. Размер данных:', JSON.stringify(response.data).length);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки статистики:', error);
      throw error;
    }
  },

  // Поиск игроков
  async searchPlayers(telegramId?: string, query?: string): Promise<SearchResult[]> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      if (!query?.trim()) {
        return [];
      }
      
      console.log('🔍 Поиск игроков. ID:', id, 'запрос:', query);
      const response = await adminApi.get(`/search/${encodeURIComponent(id)}`, {
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
      const id = telegramId || forceGetTelegramId();
      
      if (!playerId) {
        throw new Error('ID игрока не указан');
      }
      
      console.log('👤 Загружаем данные игрока. Admin ID:', id, 'Player ID:', playerId);
      const response = await adminApi.get(`/player/${encodeURIComponent(id)}/${encodeURIComponent(playerId)}`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки данных игрока:', error);
      throw error;
    }
  },

  // Изменение баланса игрока
  async updatePlayerBalance(telegramId?: string, form?: BalanceManageForm): Promise<BalanceUpdateResult> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      if (!form) {
        throw new Error('Данные формы не предоставлены');
      }

      if (!form.playerId || !form.amount) {
        throw new Error('Заполните все поля');
      }

      console.log('💰 Обновляем баланс. Admin ID:', id, 'данные:', form);
      const response = await adminApi.post(`/update-balance/${encodeURIComponent(id)}`, {
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
      const id = telegramId || forceGetTelegramId();
      
      if (!playerId || verified === undefined) {
        throw new Error('Не хватает данных для верификации игрока');
      }
      
      console.log('🔧 Верифицируем игрока. Admin ID:', id, 'Player ID:', playerId, 'статус:', verified);
      await adminApi.post(`/verify-player/${encodeURIComponent(id)}`, {
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
      const id = telegramId || forceGetTelegramId();
      
      if (!form) {
        throw new Error('Данные формы не предоставлены');
      }

      if (!form.newRate || parseFloat(form.newRate) <= 0) {
        throw new Error('Введите корректный курс TON');
      }

      console.log('📈 Обновляем курс TON. Admin ID:', id, 'новый курс:', form.newRate);
      const response = await adminApi.post(`/update-ton-rate/${encodeURIComponent(id)}`, {
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
      const id = telegramId || forceGetTelegramId();
      
      console.log('🔓 Снимаем блокировку обмена. Admin ID:', id, 'тип:', exchangeType);
      await adminApi.post(`/unblock-exchange/${encodeURIComponent(id)}`, {
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

// Функция для принудительного сохранения Telegram ID
export const forceSaveTelegramId = (): string | null => {
  try {
    const webApp = (window as any)?.Telegram?.WebApp;
    
    if (webApp?.initDataUnsafe?.user?.id) {
      const id = String(webApp.initDataUnsafe.user.id);
      localStorage.setItem('telegramId', id);
      console.log('💾 Принудительно сохранен Telegram ID:', id);
      return id;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Ошибка принудительного сохранения ID:', error);
    return null;
  }
};

// Функция для установки тестового админского ID
export const setTestAdminId = (): void => {
  try {
    const adminId = '1222791281';
    localStorage.setItem('telegramId', adminId);
    console.log('🧪 Установлен тестовый админский ID:', adminId);
  } catch (error) {
    console.error('❌ Ошибка установки тестового ID:', error);
  }
};

// Функция для отладочного тестирования API
export const testAdminApi = async (): Promise<void> => {
  console.log('🧪 === ТЕСТИРОВАНИЕ ADMIN API ===');
  
  try {
    const id = forceGetTelegramId();
    console.log('1. Получен ID для тестирования:', id);
    
    // Тест проверки админа
    console.log('2. Тестируем проверку админа...');
    const authResult = await adminApiService.checkAdminStatus(id);
    console.log('✅ Результат проверки админа:', authResult);
    
    if (authResult.isAdmin) {
      // Тест загрузки статистики
      console.log('3. Тестируем загрузку статистики...');
      const statsResult = await adminApiService.getStats(id);
      console.log('✅ Результат загрузки статистики:', {
        totalPlayers: statsResult.players?.total_players,
        totalCS: statsResult.currencies?.total_cs,
        topPlayersCount: statsResult.top_players?.length
      });
    } else {
      console.log('❌ Не является админом, статистику не загружаем');
    }
  } catch (error) {
    console.error('❌ Ошибка тестирования API:', error);
  }
};

export default adminApiService;