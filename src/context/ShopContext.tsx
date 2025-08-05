// ShopContext - операции с магазином
import React, { createContext, useContext, ReactNode } from 'react';
import { useNewPlayer } from './NewPlayerContext';
import { useShopOperations } from '../hooks';
import { createPlayerWithDefaults } from '../utils/dataTransforms';

interface ShopContextType {
  loading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  buyAsteroid: (id: number, price: number, systemId: number, currency?: string) => Promise<void>; // 🔥 Добавлен currency
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

  // 🔥 ИСПРАВЛЕННАЯ Обертка для покупки астероида с поддержкой валюты
  const buyAsteroid = async (id: number, price: number, systemId: number, currency?: string) => {
    try {
      // 🔥 ПЕРЕДАЕМ currency в API функцию
      const result = await buyAsteroidAPI(id, price, systemId, currency);
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

  // Обертка для покупки системы с обновлением игрока
  const buySystem = async (id: number, price: number) => {
    try {
      const result = await buySystemAPI(id, price);
      if (result && player) {
        // Обновляем данные игрока
        const updatedPlayer = createPlayerWithDefaults(result, id);
        setPlayer(updatedPlayer);
      }
    } catch (err) {
      console.error('Error buying system:', err);
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