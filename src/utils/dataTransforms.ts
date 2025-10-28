// Утилиты для нормализации и трансформации данных
import { shopApi } from '../services';

export interface Item {
  id: number;
  system: number;
  totalCcc?: number;
  capacity?: number;
  cccPerDay?: number;
}

// Нормализация данных предметов из сервера (упрощенная версия)
export const normalizeItemData = (items: any[], type: string): Item[] => {
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (err) {
      console.error(`Failed to parse ${type}:`, err);
      return [];
    }
  }
  
  if (!Array.isArray(items)) {
    console.error(`${type} is not an array:`, items);
    return [];
  }
  
  return items.map((item: any) => {
    const baseItem = { id: item.id || 0, system: item.system };
    
    // Упрощенная версия - используем данные которые уже есть в объекте
    if (type === 'cargo_levels') {
      return { 
        ...baseItem, 
        capacity: item.capacity || 0 
      };
    } else if (type === 'drones') {
      return { 
        ...baseItem, 
        cccPerDay: item.cccPerDay || 0 
      };
    } else if (type === 'asteroids') {
      return { 
        ...baseItem, 
        totalCcc: item.totalCcc || 0 
      };
    }
    
    return baseItem;
  });
};

// Асинхронная нормализация с загрузкой данных с сервера (для случаев когда нужны точные данные)
export const normalizeItemDataWithServerData = async (items: any[], type: string): Promise<Item[]> => {
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (err) {
      console.error(`Failed to parse ${type}:`, err);
      return [];
    }
  }
  
  if (!Array.isArray(items)) {
    console.error(`${type} is not an array:`, items);
    return [];
  }

  try {
    let serverData: any[] = [];
    
    if (type === 'cargo_levels') {
      const response = await shopApi.getCargo();
      serverData = response.data;
    } else if (type === 'drones') {
      const response = await shopApi.getDrones();
      serverData = response.data;
    } else if (type === 'asteroids') {
      const response = await shopApi.getAsteroids();
      serverData = response.data;
    }
    
    return items.map((item: any) => {
      const baseItem = { id: item.id || 0, system: item.system };
      const serverItem = serverData.find(s => s.id === item.id && s.system === item.system);
      
      if (type === 'cargo_levels') {
        return { 
          ...baseItem, 
          capacity: item.capacity || serverItem?.capacity || 0 
        };
      } else if (type === 'drones') {
        return { 
          ...baseItem, 
          cccPerDay: item.cccPerDay || serverItem?.cccPerDay || 0 
        };
      } else if (type === 'asteroids') {
        return { 
          ...baseItem, 
          totalCcc: item.totalCcc || serverItem?.totalCcc || 0 
        };
      }
      
      return baseItem;
    });
  } catch (err) {
    console.error(`Failed to load server data for ${type}:`, err);
    // Fallback to simple normalization
    return normalizeItemData(items, type);
  }
};

// Безопасное преобразование валют в числа
export const parsePlayerCurrency = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return parseFloat(value || '0');
};

// Валидация времени последнего сбора
export const validateLastCollectionTime = (
  lastCollectionTime: any
): { [key: string]: string } => {
  if (!lastCollectionTime || typeof lastCollectionTime !== 'object') {
    return { "1": new Date().toISOString() };
  }
  
  return Object.keys(lastCollectionTime).reduce((acc, key) => {
    const value = lastCollectionTime[key];
    acc[key] = typeof value === 'string' ? value : new Date().toISOString();
    return acc;
  }, {} as { [key: string]: string });
};

// Инициализация данных по системам
export const initializeSystemData = (): { [key: string]: number } => {
  return { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0 };
};

// 🔥 ИСПРАВЛЕННАЯ функция создания полного объекта игрока с значениями по умолчанию
export const createPlayerWithDefaults = (playerData: any, currentSystem: number) => {
  if (process.env.NODE_ENV === 'development') console.log('🔧 createPlayerWithDefaults вызван с данными:', {
    referrals: playerData.referrals,
    referrals_type: typeof playerData.referrals,
    referrals_length: playerData.referrals?.length,
    honor_board: playerData.honor_board,
    honor_board_type: typeof playerData.honor_board,
    honor_board_length: playerData.honor_board?.length
  });

  const normalizedCargoLevels = normalizeItemData(playerData.cargo_levels || [], 'cargo_levels');
  const cargoLevel = normalizedCargoLevels.find((c: Item) => c.system === currentSystem)?.id || 0;
  
  // Используем данные из cargo_levels для определения capacity
  const cargoCapacity = normalizedCargoLevels.find((c: Item) => c.system === currentSystem)?.capacity || 0;
  
  const validLastCollectionTime = validateLastCollectionTime(playerData.last_collection_time);
  
  // 🔥 ИСПРАВЛЕНИЕ: НЕ перезаписываем referrals и honor_board если они уже есть!
  const safeReferrals = Array.isArray(playerData.referrals) ? playerData.referrals : [];
  const safeHonorBoard = Array.isArray(playerData.honor_board) ? playerData.honor_board : [];

  if (process.env.NODE_ENV === 'development') console.log('🔧 createPlayerWithDefaults обработка рефералов:', {
    original_referrals: playerData.referrals,
    safe_referrals: safeReferrals,
    safe_referrals_length: safeReferrals.length,
    original_honor_board: playerData.honor_board,
    safe_honor_board: safeHonorBoard,
    safe_honor_board_length: safeHonorBoard.length
  });

  const result = {
    ...playerData,
    cargo_level: cargoLevel,
    cargo_capacity: cargoCapacity,
    last_collection_time: validLastCollectionTime,
    collected_by_system: playerData.collected_by_system || initializeSystemData(),
    referrals: safeReferrals,           // 🔥 ИСПОЛЬЗУЕМ БЕЗОПАСНЫЕ ДАННЫЕ
    honor_board: safeHonorBoard,        // 🔥 ИСПОЛЬЗУЕМ БЕЗОПАСНЫЕ ДАННЫЕ
    drones: normalizeItemData(playerData.drones || [], 'drones'),
    asteroids: normalizeItemData(playerData.asteroids || [], 'asteroids'),
    cargo_levels: normalizedCargoLevels,
    mining_speed_data: playerData.mining_speed_data || initializeSystemData(),
    asteroid_total_data: playerData.asteroid_total_data || initializeSystemData(),
    max_cargo_capacity_data: playerData.max_cargo_capacity_data || initializeSystemData(),
    unlocked_systems: playerData.unlocked_systems || [1],
    current_system: playerData.current_system || 1,
  };

  if (process.env.NODE_ENV === 'development') console.log('🔧 createPlayerWithDefaults результат:', {
    result_referrals: result.referrals,
    result_referrals_type: typeof result.referrals,
    result_referrals_length: result.referrals?.length,
    result_honor_board: result.honor_board,
    result_honor_board_type: typeof result.honor_board,
    result_honor_board_length: result.honor_board?.length
  });

  return result;
};