// pages/admin/hooks/useAdminStats.ts
import { useState, useCallback } from 'react';
import { useNewPlayer } from '../../../context/NewPlayerContext';
import { adminApiService, handleAdminApiError } from '../services/adminApi';
import type { AdminStats, UseAdminStatsReturn } from '../types';

export const useAdminStats = (): UseAdminStatsReturn => {
  const { player } = useNewPlayer();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (): Promise<void> => {
    if (!player?.telegram_id) {
      setError('Не удалось получить Telegram ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📊 Загружаем админскую статистику...');
      
      const result = await adminApiService.getStats(player.telegram_id);
      
      setStats(result);
      console.log('✅ Статистика загружена:', result);
    } catch (err) {
      const errorMessage = handleAdminApiError(err);
      console.error('❌ Ошибка загрузки статистики:', errorMessage);
      
      setError(errorMessage);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [player?.telegram_id]);

  const refresh = useCallback(async (): Promise<void> => {
    await loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats,
    refresh
  };
};