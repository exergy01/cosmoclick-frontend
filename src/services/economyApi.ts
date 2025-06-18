// API для работы с экономикой и обменами
import axios from 'axios';
import { API_URL, fetchWithRetry } from './apiConfig';

export const economyApi = {
  // Обменять валюту
  convertCurrency: async (
    telegramId: string, 
    amount: number, 
    fromCurrency: 'ccc' | 'cs', 
    toCurrency: 'ccc' | 'cs'
  ) => {
    return await axios.post(`${API_URL}/api/exchange/convert`, {
      telegramId,
      amount,
      fromCurrency,
      toCurrency,
    });
  },

  // Получить список обменов
  getExchanges: async () => {
    return await fetchWithRetry(`${API_URL}/api/exchange`);
  },

  // Купить обмен
  buyExchange: async (telegramId: string, exchangeId: number) => {
    return await axios.post(`${API_URL}/api/exchange/buy`, {
      telegramId,
      exchangeId,
    });
  },
};