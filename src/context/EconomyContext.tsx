// EconomyContext - валюты и обмены
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNewPlayer } from './NewPlayerContext';
import { economyApi } from '../services';
import { createPlayerWithDefaults } from '../utils/dataTransforms';
import { getTelegramId } from '../utils/telegram';

interface EconomyContextType {
  loading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  convertCurrency: (amount: number, fromCurrency: 'ccc' | 'cs', toCurrency: 'ccc' | 'cs') => Promise<void>;
  buyExchange: (exchangeId: number) => Promise<void>;
  getExchanges: () => Promise<any>;
}

const EconomyContext = createContext<EconomyContextType | undefined>(undefined);

export const EconomyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { player, setPlayer } = useNewPlayer();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Конвертация валют
  const convertCurrency = async (
    amount: number, 
    fromCurrency: 'ccc' | 'cs', 
    toCurrency: 'ccc' | 'cs'
  ) => {
    const telegramId = getTelegramId();
    if (!telegramId) {
      setError('No telegram ID found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await economyApi.convertCurrency(telegramId, amount, fromCurrency, toCurrency);
      
      if (response.data && player) {
        // Обновляем данные игрока после конвертации
        const updatedPlayer = createPlayerWithDefaults(response.data, 1);
        setPlayer({
          ...updatedPlayer,
          referrals: player.referrals || [],
          honor_board: player.honor_board || [],
        });
      }
    } catch (err: any) {
      setError(`Failed to convert currency: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Покупка обмена
  const buyExchange = async (exchangeId: number) => {
    const telegramId = getTelegramId();
    if (!telegramId) {
      setError('No telegram ID found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await economyApi.buyExchange(telegramId, exchangeId);
      // Здесь можно обновить игрока или показать уведомление
    } catch (err: any) {
      setError(`Failed to buy exchange: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Получить список обменов
  const getExchanges = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await economyApi.getExchanges();
      return response.data;
    } catch (err: any) {
      setError(`Failed to fetch exchanges: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value: EconomyContextType = {
    loading,
    error,
    setError,
    convertCurrency,
    buyExchange,
    getExchanges,
  };

  return <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>;
};

export const useEconomy = () => {
  const context = useContext(EconomyContext);
  if (context === undefined) {
    throw new Error('useEconomy must be used within a EconomyProvider');
  }
  return context;
};