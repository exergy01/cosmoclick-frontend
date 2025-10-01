// Хук для операций с магазином
import { useState } from 'react';
import { shopApi } from '../services';
import { getTelegramId } from '../utils/telegram';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

export const useShopOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔥 ПОЛНОСТЬЮ ПЕРЕПИСАННЫЙ buyAsteroid с правильной логикой валют для бомбы
// 🔥 ОБНОВЛЕННЫЙ buyAsteroid с TON бомбами
const buyAsteroid = async (id: number, price: number, systemId: number, currency?: string) => {
  const telegramId = getTelegramId();
  if (!telegramId) {
    setError('No telegram ID found');
    return null;
  }

  setLoading(true);
  setError(null);
  
  try {
    // 🔥 ОБНОВЛЕННАЯ ЛОГИКА ОПРЕДЕЛЕНИЯ ВАЛЮТЫ
    let currencyToSend = currency;
    
    if (!currencyToSend) {
      if (id === 13) {
        // 💣 БОМБА: Теперь ВСЕ бомбы покупаются за TON (продакшн)
        currencyToSend = 'ton';
      } else {
        // Стандартная логика для обычных товаров
        if (systemId >= 1 && systemId <= 4) {
          currencyToSend = 'cs';
        } else if (systemId >= 5 && systemId <= 7) {
          currencyToSend = 'ton';
        } else {
          currencyToSend = 'ccc';
        }
      }
    }

    const requestData = {
      telegramId,
      itemId: id,
      itemType: 'asteroid',
      systemId,
      currency: currencyToSend
    };

    console.log(`🛒 ОТПРАВКА ЗАПРОСА НА ПОКУПКУ АСТЕРОИДА:`, requestData);
    console.log(`🔍 URL: ${API_URL}/api/shop/buy`);
    console.log(`🔍 Тело запроса:`, JSON.stringify(requestData, null, 2));
    
    // 💣 СПЕЦИАЛЬНОЕ ЛОГИРОВАНИЕ ДЛЯ БОМБЫ
    if (id === 13) {
      console.log(`💣 ПОКУПКА БОМБЫ система ${systemId}: валюта ${currencyToSend} (TON), цена ${price}`);
    }

    // 🔥 ПРЯМОЙ AXIOS ВЫЗОВ (НЕ shopApi!)
    const response = await axios.post(`${API_URL}/api/shop/buy`, requestData);

    console.log(`✅ Астероид ${id} куплен успешно:`, response.data);
    
    // 💣 СПЕЦИАЛЬНОЕ ЛОГИРОВАНИЕ ДЛЯ БОМБЫ
    if (id === 13) {
      console.log(`💣 БОМБА АКТИВИРОВАНА! Лимиты астероидов восстановлены для системы ${systemId}`);
    }
    
    return response.data;
  } catch (err: any) {
    console.error('❌ Ошибка покупки астероида:', err);
    console.error('🔍 ДЕТАЛИ ОШИБКИ:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      requestURL: err.config?.url,
      requestData: err.config?.data
    });
    
    const errorMessage = err.response?.data?.error || err.message;
    setError(`Failed to buy asteroid: ${errorMessage}`);
    throw err;
  } finally {
    setLoading(false);
  }
};

  // Купить дрона (БЕЗ ИЗМЕНЕНИЙ - используем shopApi)
  const buyDrone = async (id: number, price: number, systemId: number) => {
    const telegramId = getTelegramId();
    if (!telegramId) {
      setError('No telegram ID found');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Получаем данные дрона с сервера
      const dronesResponse = await shopApi.getDrones();
      const droneData = dronesResponse.data.find((d: any) => d.id === id && d.system === systemId);
      
      if (!droneData) {
        throw new Error('Drone not found');
      }

      const response = await shopApi.buyDrone(telegramId, id, systemId, droneData.cccPerDay || droneData.csPerDay || 0);
      return response.data;
    } catch (err: any) {
      setError(`Failed to buy drone: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Купить карго (БЕЗ ИЗМЕНЕНИЙ - используем shopApi)
  const buyCargo = async (id: number, price: number, capacity: number, systemId: number) => {
    const telegramId = getTelegramId();
    if (!telegramId) {
      setError('No telegram ID found');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await shopApi.buyCargo(telegramId, id, systemId, capacity);
      return response.data;
    } catch (err: any) {
      setError(`Failed to buy cargo: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Купить систему (БЕЗ ИЗМЕНЕНИЙ - используем shopApi)
  const buySystem = async (id: number, price: number) => {
    const telegramId = getTelegramId();
    if (!telegramId) {
      setError('No telegram ID found');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await shopApi.buySystem(telegramId, id, price);
      return response.data;
    } catch (err: any) {
      setError(`Failed to buy system: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Получить данные магазина (БЕЗ ИЗМЕНЕНИЙ)
  const getShopData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [asteroids, drones, cargo] = await Promise.all([
        shopApi.getAsteroids(),
        shopApi.getDrones(),
        shopApi.getCargo(),
      ]);

      return {
        asteroids: asteroids.data,
        drones: drones.data,
        cargo: cargo.data,
      };
    } catch (err: any) {
      setError(`Failed to fetch shop data: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Получить максимальное количество предметов для системы (БЕЗ ИЗМЕНЕНИЙ)
  const getMaxItems = async (system: number, type: string): Promise<number> => {
    try {
      let response;
      if (type === 'cargo') {
        response = await shopApi.getCargo();
      } else if (type === 'asteroid') {
        response = await shopApi.getAsteroids();
      } else if (type === 'drones') {
        response = await shopApi.getDrones();
      }
      
      const data = response?.data || [];
      return data.filter((item: any) => item.system === system).length;
    } catch (err) {
      console.error(`Error fetching ${type} data:`, err);
      return 0;
    }
  };

  return {
    loading,
    error,
    setError,
    buyAsteroid,
    buyDrone,
    buyCargo,
    buySystem,
    getShopData,
    getMaxItems,
  };
};