// ShopContext - операции с магазином (ИСПРАВЛЕНО)
import React, { createContext, useContext, ReactNode } from 'react';
import { useNewPlayer } from './NewPlayerContext';
import { useShopOperations } from '../hooks';
import { createPlayerWithDefaults } from '../utils/dataTransforms';

interface ShopContextType {
  loading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  buyAsteroid: (id: number, price: number, systemId: number) => Promise<void>;
  buyDrone: (id: number, price: number, systemId: number) => Promise<void>;
  buyCargo: (id: number, price: number, capacity: number, systemId: number) => Promise<void>;
  buySystem: (id: number, price: number) => Promise<void>;
  getShopData: () => Promise<any>;
  getMaxItems: (system: number, type: string) => Promise<number>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { player, setPlayer } = useNewPlayer();
  const {
    loading,
    error,
    setError,
    buyAsteroid: buyAsteroidAPI,
    buyDrone: buyDroneAPI,
    buyCargo: buyCargoAPI,
    buySystem: buySystemAPI,
    getShopData,
    getMaxItems,
  } = useShopOperations();

  // Обертка для покупки астероида с обновлением игрока
  const buyAsteroid = async (id: number, price: number, systemId: number) => {
    try {
      const result = await buyAsteroidAPI(id, price, systemId);
      if (result && player) {
        // Обновляем данные игрока
        const updatedPlayer = createPlayerWithDefaults(result, systemId);
        setPlayer(updatedPlayer);
      }
    } catch (err) {
      console.error('Error buying asteroid:', err);
      throw err;
    }
  };

  // Обертка для покупки дрона с обновлением игрока
  const buyDrone = async (id: number, price: number, systemId: number) => {
    try {
      const result = await buyDroneAPI(id, price, systemId);
      if (result && player) {
        // Обновляем данные игрока
        const updatedPlayer = createPlayerWithDefaults(result, systemId);
        setPlayer(updatedPlayer);
      }
    } catch (err) {
      console.error('Error buying drone:', err);
      throw err;
    }
  };

  // Обертка для покупки карго с обновлением игрока
  const buyCargo = async (id: number, price: number, capacity: number, systemId: number) => {
    try {
      const result = await buyCargoAPI(id, price, capacity, systemId);
      if (result && player) {
        // Обновляем данные игрока
        const updatedPlayer = createPlayerWithDefaults(result, systemId);
        setPlayer(updatedPlayer);
      }
    } catch (err) {
      console.error('Error buying cargo:', err);
      throw err;
    }
  };

  // 🔥 ИСПРАВЛЕНО: Покупка системы с новой логикой для системы 5
  const buySystem = async (id: number, price: number) => {
    console.log('🛒 ShopContext buySystem called:', { id, price, player: !!player });
    
    try {
      const result = await buySystemAPI(id, price);
      console.log('🛒 buySystemAPI result:', result);
      
      if (result) {
        // 🔥 ИСПРАВЛЕНО: проверяем тип ответа
        if (result.status === 'choose_plan') {
          // Для TON систем - не обновляем игрока, возвращаем результат
          console.log('🔥 TON система - выбор тарифа');
          return result;
        } else if (result.status === 'already_unlocked_system_5') {
          // 🔥 НОВАЯ ЛОГИКА: Система 5 уже разблокирована - показываем выбор суммы
          console.log('🔥 Система 5 уже разблокирована - выбор суммы стейка');
          return {
            status: 'choose_amount',
            system_id: 5,
            min_amount: 15,
            max_amount: 1000,
            message: 'Выберите сумму для нового стейка (15-1000 TON)'
          };
        } else if (result.player || result.telegram_id) {
          // Обычная покупка - обновляем игрока СЫРЫМИ данными
          console.log('🔥 Обычная система - обновляем игрока');
          const updatedPlayer = result.player || result;
          setPlayer(updatedPlayer);
        }
      }
      
      return result;
    } catch (err) {
      console.error('❌ Error buying system:', err);
      throw err;
    }
  };

  const value: ShopContextType = {
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

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};