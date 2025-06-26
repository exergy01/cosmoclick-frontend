// API для работы с магазином
import axios from 'axios';
import { API_URL, fetchWithRetry } from './apiConfig';

export const shopApi = {
  // Получить список астероидов
  getAsteroids: async () => {
    return await fetchWithRetry(`${API_URL}/api/shop/asteroids`);
  },

  // Получить список дронов
  getDrones: async () => {
    return await fetchWithRetry(`${API_URL}/api/shop/drones`);
  },

  // Получить список карго
  getCargo: async () => {
    return await fetchWithRetry(`${API_URL}/api/shop/cargo`);
  },

  // Получить астероиды игрока
  getPlayerAsteroids: async (telegramId: string) => {
    return await fetchWithRetry(`${API_URL}/api/shop/asteroids/${telegramId}`);
  },

  // Получить дронов игрока
  getPlayerDrones: async (telegramId: string) => {
    return await fetchWithRetry(`${API_URL}/api/shop/drones/${telegramId}`);
  },

  // Получить карго игрока
  getPlayerCargo: async (telegramId: string) => {
    return await fetchWithRetry(`${API_URL}/api/shop/cargo/${telegramId}`);
  },

  // Купить астероид
  buyAsteroid: async (telegramId: string, itemId: number, systemId: number, totalCcc: number) => {
    return await axios.post(`${API_URL}/api/shop/buy`, {
      telegramId,
      itemId,
      itemType: 'asteroid',
      systemId,
      totalCcc,
      currency: 'cs',
    });
  },

  // Купить дрона
  buyDrone: async (telegramId: string, itemId: number, systemId: number, cccPerDay: number) => {
    return await axios.post(`${API_URL}/api/shop/buy`, {
      telegramId,
      itemId,
      itemType: 'drone',
      systemId,
      cccPerDay,
      currency: 'cs',
    });
  },

  // Купить карго
  buyCargo: async (telegramId: string, itemId: number, systemId: number, capacity: number) => {
    return await axios.post(`${API_URL}/api/shop/buy`, {
      telegramId,
      itemId,
      itemType: 'cargo',
      systemId,
      capacity,
      currency: 'cs',
    });
  },

  // Купить систему - ИСПРАВЛЕНО
  buySystem: async (telegramId: string, systemId: number, price: number) => {
    return await axios.post(`${API_URL}/api/shop/buy-system`, {
      telegramId,
      systemId,
      customPrice: price, // ИСПРАВЛЕНО: изменено с price на customPrice
    });
  },
};