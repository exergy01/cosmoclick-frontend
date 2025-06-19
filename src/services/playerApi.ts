// API для работы с игроком (ПОЛНОЕ ИСПРАВЛЕНИЕ)
import axios from 'axios';
import { API_URL, fetchWithRetry } from './apiConfig';

export interface CollectData {
  telegramId: string;
  last_collection_time: { [system: string]: string };
  system: number;
  collected_ccc?: number;
  collected_cs?: number;
}

// 🆕 НОВЫЙ ИНТЕРФЕЙС для создания игрока
export interface CreatePlayerData {
  telegramId: string;
  telegramData?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
}

export const playerApi = {
  // Получить данные игрока
  fetchPlayer: async (telegramId: string) => {
    return await fetchWithRetry(`${API_URL}/api/player/${telegramId}`);
  },

  // 🆕 КРИТИЧЕСКИ ВАЖНАЯ ФУНКЦИЯ: Создать/получить игрока с реальными данными Telegram
  createOrGetPlayer: async (data: CreatePlayerData) => {
    console.log('🔍 playerApi.createOrGetPlayer вызван с данными:', data);
    
    // 🚨 ДИАГНОСТИКА ЗАПРОСА
    console.log('📡 Отправляем POST запрос на /api/auth/player');
    console.log('📡 Данные запроса:', {
      telegramId: data.telegramId,
      telegramData: data.telegramData
    });
    
    const response = await axios.post(`${API_URL}/api/auth/player`, {
      telegramId: data.telegramId,
      telegramData: data.telegramData
    });
    
    console.log('✅ playerApi.createOrGetPlayer ответ:', response.data);
    return response;
  },

  // Обновить данные игрока
  updatePlayer: async (telegramId: string, data: any) => {
    return await axios.post(`${API_URL}/api/player/${telegramId}`, data);
  },

  // 🔄 СТАРАЯ ФУНКЦИЯ: Регистрация нового игрока (оставлена для совместимости)
  registerNewPlayer: async (telegramId: string) => {
    console.log('⚠️ playerApi.registerNewPlayer (старая функция) вызвана для:', telegramId);
    
    return await axios.post(`${API_URL}/api/register/${telegramId}`, {
      telegram_id: telegramId,
      username: `User${telegramId.slice(-4)}`,
      language: 'en',
      ccc: 0,
      cs: 0,
      ton: 0,
      last_collection_time: { "1": new Date().toISOString() },
      cargo_levels: [],
      collected_by_system: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
      drones: [],
      asteroids: [],
      mining_speed_data: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
      asteroid_total_data: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
      max_cargo_capacity_data: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 },
    });
  },

  // Сбор ресурсов из сейфа с поддержкой CS
  safeCollect: async (data: CollectData) => {
    const requestBody: any = {
      telegramId: data.telegramId,
      last_collection_time: data.last_collection_time || { "1": new Date().toISOString() },
      system: data.system,
    };

    if (data.system === 4) {
      requestBody.collected_cs = data.collected_cs;
      console.log('🔍 playerApi: отправляем collected_cs =', data.collected_cs);
    } else {
      requestBody.collected_ccc = data.collected_ccc;
      console.log('🔍 playerApi: отправляем collected_ccc =', data.collected_ccc);
    }

    console.log('🔍 playerApi: полный запрос =', requestBody);

    return await axios.post(`${API_URL}/api/safe/collect`, requestBody);
  },

  // Обновить язык игрока
  updateLanguage: async (telegramId: string, language: string) => {
    return await axios.post(`${API_URL}/api/player/language`, {
      telegramId,
      language,
    });
  },

  // Обновить цвет игрока
  updateColor: async (telegramId: string, color: string) => {
    return await axios.post(`${API_URL}/api/player/color`, {
      telegramId,
      color,
    });
  },
};