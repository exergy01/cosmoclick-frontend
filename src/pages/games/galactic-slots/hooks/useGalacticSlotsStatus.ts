// galactic-slots/hooks/useGalacticSlotsStatus.ts

import { useState, useEffect, useCallback } from 'react';
import { GalacticSlotsStatus } from '../types';
import { GalacticSlotsApi } from '../services/galacticSlotsApi';

const initialStatus: GalacticSlotsStatus = {
  success: false,
  balance: 0,
  dailyGames: 0,
  dailyAds: 0,
  canPlayFree: false,
  canWatchAd: false,
  gamesLeft: 0,
  adsLeft: 0,
  minBet: 100,
  maxBet: 5000,
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

export const useGalacticSlotsStatus = (telegramId: string | undefined) => {
  const [gameStatus, setGameStatus] = useState<GalacticSlotsStatus>(initialStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGameStatus = useCallback(async () => {
    if (!telegramId) return;
    
    try {
      setLoading(true);
      setError(null);
      const status = await GalacticSlotsApi.getStatus(telegramId);
      
      console.log('🎰 Frontend: Loaded slots game status from backend:', {
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
      console.error('🎰❌ Load slots game status error:', err);
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  // Загрузка при монтировании
  useEffect(() => {
    loadGameStatus();
  }, [loadGameStatus]);

  return {
    gameStatus,
    loading,
    error,
    loadGameStatus
  };
};