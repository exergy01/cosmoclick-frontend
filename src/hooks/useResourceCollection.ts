// Хук для сбора ресурсов (ИСПРАВЛЕНО для CS)
import { useState } from 'react';
import { playerApi } from '../services';

interface Player {
  telegram_id: string;
  asteroid_total_data: { [key: number]: number };
  collected_by_system: { [key: string]: number };
  last_collection_time: { [key: string]: string };
  // ... остальные поля
  [key: string]: any;
}

export const useResourceCollection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ СБОРА с правильной передачей параметров
  const safeCollect = async (player: Player, system: number, collectedAmount: number) => {
    if (!player?.telegram_id) {
      setError('No telegram ID found');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 🔥 ИСПРАВЛЕНО: правильно формируем данные для отправки
      const collectData: any = {
        telegramId: player.telegram_id,
        last_collection_time: player.last_collection_time || {},
        system: system,
      };

      // 🔥 ИСПРАВЛЕНО: для системы 4 отправляем collected_cs, для остальных collected_ccc
      if (system === 4) {
        collectData.collected_cs = collectedAmount;
        if (process.env.NODE_ENV === 'development') console.log(`💰 useResourceCollection: отправляем ${collectedAmount} CS из системы 4`);
      } else {
        collectData.collected_ccc = collectedAmount;
        if (process.env.NODE_ENV === 'development') console.log(`💰 useResourceCollection: отправляем ${collectedAmount} CCC из системы ${system}`);
      }

      if (process.env.NODE_ENV === 'development') console.log('🔍 useResourceCollection: полные данные запроса:', collectData);

      // Отправляем запрос через playerApi
      const response = await playerApi.safeCollect(collectData);
      
      if (process.env.NODE_ENV === 'development') console.log(`✅ useResourceCollection: успешный сбор из системы ${system}:`, response.data);
      
      return response.data;
    } catch (err: any) {
      const errorMessage = `Failed to collect resources: ${err.response?.data?.error || err.message}`;
      setError(errorMessage);
      console.error('❌ Error in safeCollect:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 ИСПРАВЛЕНО: Получить оставшиеся ресурсы из asteroid_total_data
  const getRemainingResources = (player: Player, system: number): number => {
    if (!player) return 0;
    
    // 🎯 ПРИОРИТЕТ: используем asteroid_total_data (актуальные остатки после сбора)
    const remainingFromTotalData = player.asteroid_total_data?.[system];
    if (remainingFromTotalData !== undefined) {
      if (process.env.NODE_ENV === 'development') console.log(`🪨 Остатки система ${system}: из asteroid_total_data = ${remainingFromTotalData}`);
      return remainingFromTotalData;
    }
    
    // Фоллбэк: считаем из массива asteroids (для новых игроков)
    const remainingFromArray = player.asteroids
      ?.filter((a: any) => a.system === system)
      ?.reduce((sum: number, a: any) => {
        if (system === 4) {
          return sum + (a.totalCs || 0);
        } else {
          return sum + (a.totalCcc || 0);
        }
      }, 0) || 0;
    
    if (process.env.NODE_ENV === 'development') console.log(`🪨 Остатки система ${system}: из asteroids массива = ${remainingFromArray}`);
    return remainingFromArray;
  };

  // Получить собранные ресурсы
  const getCollectedResources = (player: Player, system: number): number => {
    if (!player) return 0;
    
    const systemStr = String(system);
    const collected = player.collected_by_system?.[systemStr] || 0;
    if (process.env.NODE_ENV === 'development') console.log(`💰 Собрано система ${system}: ${collected}`);
    return collected;
  };

  // Проверить можно ли собирать ресурсы
  const canCollectResources = (player: Player, system: number): boolean => {
    if (!player) return false;
    
    const remainingResources = getRemainingResources(player, system);
    const collectedResources = getCollectedResources(player, system);
    
    const canCollect = remainingResources > 0 && collectedResources >= 0;
    if (process.env.NODE_ENV === 'development') console.log(`🔧 Можно собирать система ${system}: остатки=${remainingResources}, собрано=${collectedResources} => ${canCollect}`);
    return canCollect;
  };

  // Получить информацию о ресурсах системы
  const getSystemResourceInfo = (player: Player, system: number) => {
    if (!player) {
      return {
        currency: system === 4 ? 'CS' : 'CCC',
        remaining: 0,
        collected: 0,
        canCollect: false,
      };
    }

    const remaining = getRemainingResources(player, system);
    const collected = getCollectedResources(player, system);
    const canCollect = canCollectResources(player, system);

    return {
      currency: system === 4 ? 'CS' : 'CCC',
      remaining,
      collected,
      canCollect,
    };
  };

  // 🔧 ДОБАВЛЕНО: Получить отладочную информацию
  const getDebugInfo = (player: Player, system: number) => {
    if (!player) return {};
    
    return {
      system,
      asteroid_total_data: player.asteroid_total_data?.[system],
      collected_by_system: player.collected_by_system?.[String(system)],
      last_collection_time: player.last_collection_time?.[String(system)],
      asteroids_in_system: player.asteroids?.filter((a: any) => a.system === system) || [],
      drones_in_system: player.drones?.filter((d: any) => d.system === system) || [],
      cargo_in_system: player.cargo_levels?.filter((c: any) => c.system === system) || [],
      mining_speed: player.mining_speed_data?.[system],
      max_cargo: player.max_cargo_capacity_data?.[system],
    };
  };

  return {
    loading,
    error,
    setError,
    safeCollect,
    getRemainingResources,
    getCollectedResources,
    canCollectResources,
    getSystemResourceInfo,
    getDebugInfo, // 🔧 Для отладки
  };
};