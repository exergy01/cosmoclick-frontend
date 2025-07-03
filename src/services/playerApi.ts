// API для работы с игроком (ИСПРАВЛЕНО для CS)
import axios from 'axios';
import { API_URL, fetchWithRetry } from './apiConfig';

export interface CollectData {
  telegramId: string;
  last_collection_time: { [system: string]: string };
  system: number;
  collected_ccc?: number;
  collected_cs?: number; // 🔥 ДОБАВЛЕНО: поддержка CS
}

export const playerApi = {
  // Получить данные игрока
  fetchPlayer: async (telegramId: string) => {
    return await fetchWithRetry(`${API_URL}/api/player/${telegramId}`);
  },

  // Обновить данные игрока
  updatePlayer: async (telegramId: string, data: any) => {
    return await axios.post(`${API_URL}/api/player/${telegramId}`, data);
  },

  // 🔥 ИСПРАВЛЕНО: Регистрация нового игрока через правильный endpoint
  registerNewPlayer: async (telegramId: string) => {
    return await axios.post(`${API_URL}/api/player/create`, {
      telegramId: telegramId
    });
  },

  // 🔥 ИСПРАВЛЕНО: Сбор ресурсов из сейфа с поддержкой CS
  safeCollect: async (data: CollectData) => {
    // 🔥 ИСПРАВЛЕНО: правильно формируем тело запроса
    const requestBody: any = {
      telegramId: data.telegramId,
      last_collection_time: data.last_collection_time || { "1": new Date().toISOString() },
      system: data.system,
    };

    // 🔥 ИСПРАВЛЕНО: добавляем правильное поле в зависимости от системы
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