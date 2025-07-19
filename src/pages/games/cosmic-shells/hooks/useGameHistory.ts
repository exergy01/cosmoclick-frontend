// cosmic-shells/hooks/useGameHistory.ts
// ✅ СОЗДАН: Недостающий хук для истории игр

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
      console.error('Error loading recent cosmic shells history:', err);
    }
  }, [telegramId]);

  // Загрузка полной истории игр БЕЗ ЛИМИТА
  const loadFullHistory = useCallback(async () => {
    if (!telegramId) return;
    
    setHistoryLoading(true);
    try {
      // ✅ ИСПРАВЛЕНО: Запрашиваем БЕЗ лимита для полной истории
      const response = await CosmicShellsApi.getHistory(telegramId); // Без параметров = все игры
      if (response.success) {
        setFullHistory(response.history || []);
        console.log('🛸 Loaded full history:', response.history?.length || 0, 'games total');
      }
    } catch (err) {
      console.error('Error loading full cosmic shells history:', err);
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
};