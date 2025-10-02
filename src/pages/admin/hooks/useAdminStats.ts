// pages/admin/hooks/useAdminStats.ts
import { useState, useCallback } from 'react';
import { useNewPlayer } from '../../../context/NewPlayerContext';
import type { AdminStats, UseAdminStatsReturn } from '../types';
import axios from 'axios';

// Используем тот же подход что и в ReferralsPage
const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'https://cosmoclick-backend.onrender.com';

export const useAdminStats = (): UseAdminStatsReturn => {
  const { player } = useNewPlayer();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (): Promise<void> => {
    // Проверяем наличие player и его telegram_id - как в ReferralsPage
    if (!player?.telegram_id) {
      setError('Не удалось получить Telegram ID игрока');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📊 Начинаем загрузку статистики для:', player.telegram_id);
      
      // Используем прямой axios запрос как в ReferralsPage
      const response = await axios.get(`${apiUrl}/api/admin/stats/${player.telegram_id}`);
      
      console.log('✅ Статистика загружена успешно:', response.data);
      setStats(response.data);
      
    } catch (err: any) {
      console.error('❌ Ошибка загрузки статистики:', err);
      
      // Обрабатываем ошибки как в ReferralsPage
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Произошла неожиданная ошибка при загрузке статистики');
      }
      
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [player?.telegram_id]);

  const refresh = useCallback(async (): Promise<void> => {
    console.log('🔄 Обновление статистики...');
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