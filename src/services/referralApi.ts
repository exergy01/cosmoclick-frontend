// API для работы с рефералами
import axios from 'axios';
import { API_URL, fetchWithRetry } from './apiConfig';

export const referralApi = {
  // Создать реферальную ссылку
  generateReferralLink: async (telegramId: string) => {
    return await axios.post(`${API_URL}/api/referrals/create`, {
      telegramId,
    });
  },

  // Получить статистику рефералов
  getReferralStats: async (telegramId: string) => {
    return await fetchWithRetry(`${API_URL}/api/referrals/stats/${telegramId}`);
  },

  // Получить список рефералов
  getReferralsList: async (telegramId: string) => {
    return await fetchWithRetry(`${API_URL}/api/referrals/list/${telegramId}`);
  },

  // Получить доску почета
  getHonorBoard: async () => {
    return await fetchWithRetry(`${API_URL}/api/referrals/honor-board`);
  },
};