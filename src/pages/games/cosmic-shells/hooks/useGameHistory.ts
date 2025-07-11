 
// cosmic-shells/hooks/useGameHistory.ts

import { useState, useCallback } from 'react';
import { GameHistory } from '../types';
import { CosmicShellsApi } from '../services/cosmicShellsApi';

export const useGameHistory = (telegramId: string | undefined) => {
  const [recentHistory, setRecentHistory] = useState<GameHistory[]>([]);
  const [fullHistory, setFullHistory] = useState<GameHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Загрузка последних игр (10 штук)
  const loadRecentHistory = useCallback(async () => {
    if (!telegramId) return;
    
    try {
      const response = await CosmicShellsApi.getHistory(telegramId, 10, 0);
      if (response.success) {
        setRecentHistory(response.history || []);
      }
    } catch (err) {
      console.error('Error loading recent game history:', err);
    }
  }, [telegramId]);

  // Загрузка полной истории игр
  const loadFullHistory = useCallback(async () => {
    if (!telegramId) return;
    
    setHistoryLoading(true);
    try {
      const response = await CosmicShellsApi.getHistory(telegramId);
      if (response.success) {
        setFullHistory(response.history || []);
      }
    } catch (err) {
      console.error('Error loading full game history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [telegramId]);

  // Открыть полную историю
  const openFullHistory = useCallback(() => {
    setShowFullHistory(true);
    loadFullHistory();
  }, [loadFullHistory]);

  // Закрыть полную историю
  const closeFullHistory = useCallback(() => {
    setShowFullHistory(false);
  }, []);

  // Обновить историю после игры
  const refreshHistory = useCallback(() => {
    loadRecentHistory();
    if (showFullHistory) {
      loadFullHistory();
    }
  }, [loadRecentHistory, loadFullHistory, showFullHistory]);

  return {
    recentHistory,
    fullHistory,
    historyLoading,
    showFullHistory,
    loadRecentHistory,
    loadFullHistory,
    openFullHistory,
    closeFullHistory,
    refreshHistory
  };
};export {}; 
