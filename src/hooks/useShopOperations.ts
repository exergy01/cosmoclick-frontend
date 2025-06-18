// Хук для операций с магазином (С ДИАГНОСТИКОЙ)
import { useState } from 'react';
import { shopApi } from '../services';
import { getTelegramId } from '../utils/telegram';

export const useShopOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Купить астероид
  const buyAsteroid = async (id: number, price: number, systemId: number) => {
    const telegramId = getTelegramId();
    if (!telegramId) {
      setError('No telegram ID found');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Получаем данные астероида с сервера
      const asteroidsResponse = await shopApi.getAsteroids();
      const asteroidData = asteroidsResponse.data.find((a: any) => a.id === id && a.system === systemId);
      
      if (!asteroidData) {
        throw new Error('Asteroid not found');
      }

      const response = await shopApi.buyAsteroid(telegramId, id, systemId, asteroidData.totalCcc);
      return response.data;
    } catch (err: any) {
      setError(`Failed to buy asteroid: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Купить дрона
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

      const response = await shopApi.buyDrone(telegramId, id, systemId, droneData.cccPerDay);
      return response.data;
    } catch (err: any) {
      setError(`Failed to buy drone: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Купить карго
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

  // 🔥 ИСПРАВЛЕНО: Купить систему с диагностикой и таймаутом
  const buySystem = async (id: number, price: number) => {
    console.log('🔍 useShopOperations buySystem start:', { id, price });
    
    const telegramId = getTelegramId();
    console.log('🔍 getTelegramId result:', telegramId);
    
    if (!telegramId) {
      console.log('❌ No telegram ID found!');
      setError('No telegram ID found');
      return null;
    }

    console.log('🔍 Setting loading true...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Calling shopApi.buySystem...');
      
      // 🔥 ДОБАВЛЯЕМ ТАЙМАУТ 10 СЕКУНД
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
      );
      
      const apiPromise = shopApi.buySystem(telegramId, id, price);
      
      const response = await Promise.race([apiPromise, timeoutPromise]) as any;
      console.log('🔍 shopApi.buySystem response:', response);
      
      console.log('🔍 Returning response.data:', response.data);
      return response.data;
    } catch (err: any) {
      console.log('❌ buySystem error:', err.message);
      setError(`Failed to buy system: ${err.message}`);
      throw err;
    } finally {
      console.log('🔍 Setting loading false...');
      setLoading(false);
    }
  };

  // Получить данные магазина
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

  // Получить максимальное количество предметов для системы
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