// pages/admin/services/adminApi.ts - ДОПОЛНЕНО функциями для квестов
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

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

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
    console.log('📦 Данные ответа (первые 500 символов):', JSON.stringify(response.data).slice(0, 500) + '...');
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

  // Загрузка статистики
  async getStats(telegramId?: string): Promise<AdminStats> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      console.log('📊 Загружаем статистику. ID:', id);
      console.log('🔗 URL будет:', `${API_URL}/api/admin/stats/${encodeURIComponent(id)}`);
      
      const response = await adminApi.get(`/stats/${encodeURIComponent(id)}`);
      const stats = response.data as AdminStats;
      
      console.log('✅ Статистика загружена успешно. Размер данных:', JSON.stringify(stats).length);
      return stats;
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
  },

  // 🆕 ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ КВЕСТАМИ
  
  // Получить список всех квестов
  async getQuestsList(telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      console.log('📋 Загружаем список квестов. ID:', id);
      const response = await adminApi.get(`/quests/list/${encodeURIComponent(id)}`);
      
      console.log('✅ Список квестов загружен:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки списка квестов:', error);
      throw error;
    }
  },

  // Получить детали конкретного квеста
  async getQuestDetails(telegramId?: string, questKey?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      if (!questKey) {
        throw new Error('Ключ квеста не указан');
      }
      
      console.log('📝 Загружаем детали квеста. ID:', id, 'Quest Key:', questKey);
      const response = await adminApi.get(`/quests/get/${encodeURIComponent(questKey)}/${encodeURIComponent(id)}`);
      
      console.log('✅ Детали квеста загружены:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки деталей квеста:', error);
      throw error;
    }
  },

  // Создать новый квест
  async createQuest(telegramId?: string, questData?: any): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      if (!questData) {
        throw new Error('Данные квеста не предоставлены');
      }
      
      console.log('🧪 Создаем новый квест. ID:', id, 'данные:', questData);
      const response = await adminApi.post(`/quests/create/${encodeURIComponent(id)}`, questData);
      
      console.log('✅ Квест создан:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка создания квеста:', error);
      throw error;
    }
  },

  // Обновить квест
  async updateQuest(telegramId?: string, questKey?: string, questData?: any): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      if (!questKey || !questData) {
        throw new Error('Ключ квеста и данные обязательны');
      }
      
      console.log('✏️ Обновляем квест. ID:', id, 'Quest Key:', questKey);
      const response = await adminApi.put(`/quests/update/${encodeURIComponent(questKey)}/${encodeURIComponent(id)}`, questData);
      
      console.log('✅ Квест обновлен:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка обновления квеста:', error);
      throw error;
    }
  },

  // Удалить квест
  async deleteQuest(telegramId?: string, questKey?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      if (!questKey) {
        throw new Error('Ключ квеста не указан');
      }
      
      console.log('🗑️ Удаляем квест. ID:', id, 'Quest Key:', questKey);
      const response = await adminApi.delete(`/quests/delete/${encodeURIComponent(questKey)}/${encodeURIComponent(id)}`);
      
      console.log('✅ Квест удален:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка удаления квеста:', error);
      throw error;
    }
  },

  // Переключить активность квеста
  async toggleQuestStatus(telegramId?: string, questKey?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      if (!questKey) {
        throw new Error('Ключ квеста не указан');
      }
      
      console.log('🔄 Переключаем статус квеста. ID:', id, 'Quest Key:', questKey);
      const response = await adminApi.post(`/quests/toggle-status/${encodeURIComponent(questKey)}/${encodeURIComponent(id)}`);
      
      console.log('✅ Статус квеста изменен:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка изменения статуса квеста:', error);
      throw error;
    }
  },

  // Создать тестовый квест (упрощенная версия для кнопки)
  async createTestQuest(telegramId?: string): Promise<any> {
    const timestamp = Date.now();
    const testQuestData = {
      quest_key: `test_quest_${timestamp}`,
      quest_type: 'partner_link',
      reward_cs: 100,
      quest_data: {
        url: 'https://example.com',
        timer_seconds: 30
      },
      target_languages: ['ru', 'en'],
      sort_order: 999,
      translations: {
        ru: {
          quest_name: `Тестовое задание ${new Date().toLocaleTimeString()}`,
          description: 'Это тестовое задание, созданное из админ-панели'
        },
        en: {
          quest_name: `Test Quest ${new Date().toLocaleTimeString()}`,
          description: 'This is a test quest created from admin panel'
        }
      }
    };

    return await this.createQuest(telegramId, testQuestData);
  },

  // Получить статистику по квестам (сборная функция)
  async getQuestsStatistics(telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      console.log('📊 Собираем статистику по квестам. ID:', id);
      
      // Получаем список квестов
      const questsList = await this.getQuestsList(id);
      
      // Формируем статистику
      const stats = {
        total_quests: questsList.total_quests || 0,
        active_quests: questsList.active_quests || 0,
        inactive_quests: questsList.inactive_quests || 0,
        quests: questsList.quests || [],
        summary: {
          total_completions: 0,
          unique_players: 0,
          total_rewards_given: 0
        }
      };

      // Подсчитываем суммарную статистику
      if (questsList.quests) {
        stats.summary.total_completions = questsList.quests.reduce(
          (sum: number, quest: any) => sum + (quest.stats?.total_completions || 0), 0
        );
        stats.summary.unique_players = questsList.quests.reduce(
          (sum: number, quest: any) => sum + (quest.stats?.unique_players || 0), 0
        );
        stats.summary.total_rewards_given = questsList.quests.reduce(
          (sum: number, quest: any) => sum + (quest.reward_cs * (quest.stats?.total_completions || 0)), 0
        );
      }
      
      console.log('✅ Статистика квестов собрана:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Ошибка получения статистики квестов:', error);
      throw error;
    }
  },

  // Массовое удаление тестовых квестов
  async bulkDeleteTestQuests(telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();
      
      console.log('🧹 Запускаем массовое удаление тестовых квестов. ID:', id);
      
      // Получаем список всех квестов
      const questsList = await this.getQuestsList(id);
      
      if (!questsList.quests || questsList.quests.length === 0) {
        return { message: 'Нет квестов для удаления', deleted_count: 0 };
      }
      
      // Ищем тестовые квесты (начинающиеся с test_)
      const testQuests = questsList.quests.filter((quest: any) => 
        quest.quest_key && quest.quest_key.startsWith('test_')
      );
      
      if (testQuests.length === 0) {
        return { message: 'Тестовые квесты не найдены', deleted_count: 0 };
      }
      
      console.log(`🎯 Найдено ${testQuests.length} тестовых квестов для удаления`);
      
      // Удаляем каждый тестовый квест
      const results = [];
      for (const quest of testQuests) {
        try {
          await this.deleteQuest(id, quest.quest_key);
          results.push({ quest_key: quest.quest_key, status: 'deleted' });
          console.log(`✅ Удален тестовый квест: ${quest.quest_key}`);
        } catch (deleteError) {
          results.push({ quest_key: quest.quest_key, status: 'error', error: deleteError });
          console.error(`❌ Ошибка удаления ${quest.quest_key}:`, deleteError);
        }
      }
      
      const deletedCount = results.filter(r => r.status === 'deleted').length;
      
      console.log(`🧹 Массовое удаление завершено. Удалено: ${deletedCount}/${testQuests.length}`);
      
      return {
        message: `Удаление завершено: ${deletedCount}/${testQuests.length}`,
        deleted_count: deletedCount,
        total_found: testQuests.length,
        results: results
      };
    } catch (error) {
      console.error('❌ Ошибка массового удаления:', error);
      throw error;
    }
  },

  // 🆕 TON DEPOSIT MANAGEMENT FUNCTIONS

  // Получить список TON депозитов
  async getTONDeposits(status: string = 'unidentified', telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('💎 Загружаем TON депозиты. ID:', id, 'статус:', status);
      const response = await adminApi.get(`/ton-deposits?status=${status}&admin_id=${encodeURIComponent(id)}`);

      console.log('✅ TON депозиты загружены:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка загрузки TON депозитов:', error);
      throw error;
    }
  },

  // Получить статистику TON
  async getTONStats(telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('📊 Загружаем статистику TON. ID:', id);
      const response = await adminApi.get(`/ton-stats?admin_id=${encodeURIComponent(id)}`);

      console.log('✅ Статистика TON загружена:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка загрузки статистики TON:', error);
      throw error;
    }
  },

  // Обработать неопознанный депозит
  async processTONDeposit(depositId: number, playerId: string, telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('⚡ Обрабатываем TON депозит. Admin ID:', id, 'Deposit ID:', depositId, 'Player ID:', playerId);
      const response = await adminApi.post(`/process-ton-deposit`, {
        admin_id: id,
        deposit_id: depositId,
        player_id: playerId
      });

      console.log('✅ TON депозит обработан:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка обработки TON депозита:', error);
      throw error;
    }
  },

  // Обновить курс TON вручную
  async updateTONRate(newRate: number, telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('💱 Обновляем курс TON. Admin ID:', id, 'новый курс:', newRate);
      const response = await adminApi.post(`/update-ton-rate/${encodeURIComponent(id)}`, {
        new_rate: newRate,
        source: 'manual_admin'
      });

      console.log('✅ Курс TON обновлен:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка обновления курса TON:', error);
      throw error;
    }
  },

  // 🆕 СИСТЕМА ПОДТВЕРЖДЕНИЯ ВЫВОДОВ

  // Получить ожидающие выводы
  async getPendingWithdrawals(telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('💸 Загружаем ожидающие выводы. ID:', id);
      const response = await adminApi.get(`/withdrawals/pending?admin_id=${encodeURIComponent(id)}`);

      console.log('✅ Ожидающие выводы загружены:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка загрузки выводов:', error);
      throw error;
    }
  },

  // Подтвердить или отклонить вывод
  async approveWithdrawal(withdrawalId: number, action: 'approve' | 'reject', reason?: string, telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log(`✅ ${action} вывода ${withdrawalId}. Admin ID:`, id);
      const response = await adminApi.post('/withdrawals/approve', {
        admin_id: id,
        withdrawal_id: withdrawalId,
        action: action,
        reason: reason
      });

      console.log('✅ Вывод обработан:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка обработки вывода:', error);
      throw error;
    }
  },

  // 🆕 ПОИСК ПОТЕРЯННЫХ ДЕПОЗИТОВ

  // Получить потерянные депозиты
  async getOrphanedDeposits(minAmount = 0, timeHours = 24, telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('🔍 Загружаем потерянные депозиты. ID:', id);
      const response = await adminApi.get(`/deposits/orphaned?admin_id=${encodeURIComponent(id)}&min_amount=${minAmount}&time_hours=${timeHours}`);

      console.log('✅ Потерянные депозиты загружены:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка загрузки потерянных депозитов:', error);
      throw error;
    }
  },

  // Расследовать депозит
  async investigateDeposit(depositId: number, searchParams = {}, telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('🕵️ Расследуем депозит. Admin ID:', id, 'Deposit ID:', depositId);
      const response = await adminApi.post('/deposits/investigate', {
        admin_id: id,
        deposit_id: depositId,
        search_params: searchParams
      });

      console.log('✅ Расследование завершено:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка расследования:', error);
      throw error;
    }
  },

  // 🆕 СИСТЕМА АЛЕРТОВ

  // Получить критические уведомления
  async getCriticalAlerts(telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('🚨 Загружаем критические алерты. ID:', id);
      const response = await adminApi.get(`/alerts/critical?admin_id=${encodeURIComponent(id)}`);

      console.log('✅ Алерты загружены:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка загрузки алертов:', error);
      throw error;
    }
  },

  // 🆕 АНАЛИТИКА

  // Получить ежедневную финансовую статистику
  async getDailyFinanceStats(days = 30, telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('📈 Загружаем ежедневную статистику. ID:', id);
      const response = await adminApi.get(`/analytics/daily-finance?admin_id=${encodeURIComponent(id)}&days=${days}`);

      console.log('✅ Статистика загружена:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка загрузки статистики:', error);
      throw error;
    }
  },

  // Получить топ игроков
  async getTopPlayers(period = 30, limit = 50, telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('👑 Загружаем топ игроков. ID:', id);
      const response = await adminApi.get(`/analytics/top-players?admin_id=${encodeURIComponent(id)}&period=${period}&limit=${limit}`);

      console.log('✅ Топ игроков загружен:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка загрузки топа игроков:', error);
      throw error;
    }
  },

  // Получить подозрительные паттерны
  async getSuspiciousPatterns(telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('🔍 Загружаем подозрительные паттерны. ID:', id);
      const response = await adminApi.get(`/analytics/suspicious-patterns?admin_id=${encodeURIComponent(id)}`);

      console.log('✅ Паттерны загружены:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка загрузки паттернов:', error);
      throw error;
    }
  },

  // 🆕 РАССЛЕДОВАНИЯ

  // Универсальный поиск
  async universalSearch(query: string, searchType = 'all', telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('🔍 Универсальный поиск. ID:', id, 'запрос:', query);
      const response = await adminApi.post('/investigation/search', {
        admin_id: id,
        query: query,
        search_type: searchType
      });

      console.log('✅ Поиск завершен:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка поиска:', error);
      throw error;
    }
  },

  // Анализ игрока
  async analyzePlayer(playerId: string, telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('📊 Анализируем игрока. Admin ID:', id, 'Player ID:', playerId);
      const response = await adminApi.get(`/investigation/player-analysis/${encodeURIComponent(playerId)}?admin_id=${encodeURIComponent(id)}`);

      console.log('✅ Анализ игрока завершен:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка анализа игрока:', error);
      throw error;
    }
  },

  // Анализ связей между игроками
  async analyzeConnections(playerIds: string[], analysisDepth = 2, telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('🔗 Анализируем связи. Admin ID:', id, 'игроки:', playerIds);
      const response = await adminApi.post('/investigation/connection-analysis', {
        admin_id: id,
        player_ids: playerIds,
        analysis_depth: analysisDepth
      });

      console.log('✅ Анализ связей завершен:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка анализа связей:', error);
      throw error;
    }
  },

  // Создать отчет о подозрительной активности
  async reportSuspiciousActivity(playerId: string, activityType: string, description: string, riskLevel = 'medium', details = {}, telegramId?: string): Promise<any> {
    try {
      const id = telegramId || forceGetTelegramId();

      console.log('🚨 Создаем отчет о подозрительной активности. Admin ID:', id);
      const response = await adminApi.post('/investigation/report-suspicious', {
        admin_id: id,
        telegram_id: playerId,
        activity_type: activityType,
        description: description,
        risk_level: riskLevel,
        details: details
      });

      console.log('✅ Отчет создан:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка создания отчета:', error);
      throw error;
    }
  },

  // 🆕 ФУНКЦИИ ДЛЯ РУЧНОЙ ПРОВЕРКИ ЗАДАНИЙ

  // Получить список заявок на ручную проверку
  async getManualChecks(status: 'all' | 'pending' | 'approved' | 'rejected' = 'all'): Promise<any> {
    try {
      const id = forceGetTelegramId();

      console.log('📋 Загружаем заявки на ручную проверку. ID:', id, 'статус:', status);
      const response = await adminApi.get(`/manual-checks/list/${encodeURIComponent(id)}`, {
        params: { status }
      });

      console.log('✅ Заявки загружены:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка загрузки заявок:', error);
      throw error;
    }
  },

  // Одобрить или отклонить заявку
  async reviewManualCheck(
    submissionId: number,
    action: 'approve' | 'reject',
    reviewNotes?: string
  ): Promise<any> {
    try {
      const id = forceGetTelegramId();

      console.log('✅ Проверяем заявку. ID:', id, 'submission:', submissionId, 'action:', action);
      const response = await adminApi.post(`/manual-checks/review/${encodeURIComponent(id)}`, {
        submission_id: submissionId,
        action,
        review_notes: reviewNotes
      });

      console.log('✅ Заявка обработана:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка проверки заявки:', error);
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

export default adminApiService;