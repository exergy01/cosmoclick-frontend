// cosmic-shells/hooks/useGameStatus.ts
// ✅ УНИФИЦИРОВАНО: Добавлены функции локального обновления как в слотах

import { useState, useEffect, useCallback } from 'react';
import { CosmicShellsStatus } from '../types';
import { CosmicShellsApi } from '../services/cosmicShellsApi';

const initialStatus: CosmicShellsStatus = {
  success: false,
  balance: 0,
  dailyGames: 0,
  dailyAds: 0,
  canPlayFree: false,
  canWatchAd: false,
  gamesLeft: 0,
  adsLeft: 0,
  minBet: 100,
  maxBet: 100000,
  winMultiplier: 2,
  stats: {
    total_games: 0,
    total_wins: 0,
    total_losses: 0,
    total_bet: 0,
    total_won: 0,
    best_streak: 0,
    worst_streak: 0
  }
};

export const useGameStatus = (telegramId: string | undefined) => {
  const [gameStatus, setGameStatus] = useState<CosmicShellsStatus>(initialStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGameStatus = useCallback(async () => {
    if (!telegramId) return;
    
    try {
      setLoading(true);
      setError(null);
      const status = await CosmicShellsApi.getStatus(telegramId);
      
      if (process.env.NODE_ENV === 'development') console.log('🛸 Frontend: Loaded game status from backend:', {
        dailyGames: status.dailyGames,
        dailyAds: status.dailyAds,
        gamesLeft: status.gamesLeft,
        canPlayFree: status.canPlayFree,
        canWatchAd: status.canWatchAd,
        balance: status.balance
      });
      
      setGameStatus(status);
      
      if (!status.success && status.error) {
        setError(status.error);
      }
    } catch (err) {
      setError('Ошибка загрузки игры');
      console.error('🛸❌ Load game status error:', err);
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  // ✅ НОВАЯ ФУНКЦИЯ: Локальное обновление статуса без перезагрузки (как в слотах)
  const updateLocalStatus = useCallback((newStatus: Partial<CosmicShellsStatus>) => {
    setGameStatus(prev => ({
      ...prev,
      ...newStatus
    }));
    
    if (process.env.NODE_ENV === 'development') console.log('🛸 Status updated locally:', newStatus);
  }, []);

  // ✅ НОВАЯ ФУНКЦИЯ: Принудительное обновление с сервера (для критических случаев)
  const forceRefresh = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') console.log('🛸 Force refreshing status from server...');
    await loadGameStatus();
  }, [loadGameStatus]);

  // Загрузка при монтировании
  useEffect(() => {
    loadGameStatus();
  }, [loadGameStatus]);

  return {
    gameStatus,
    loading,
    error,
    loadGameStatus,
    updateLocalStatus, // ✅ Экспортируем новую функцию
    forceRefresh // ✅ Экспортируем принудительное обновление
  };
};