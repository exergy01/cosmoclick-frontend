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
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Начинаем загрузку статистики...');
      console.log('📱 Player данные:', {
        telegram_id: player?.telegram_id,
        username: player?.username,
        first_name: player?.first_name
      });
      
      // Пытаемся получить Telegram ID разными способами
      let telegramId = player?.telegram_id;
      
      if (!telegramId) {
        console.log('⚠️ Telegram ID не найден в player, пробуем другие источники...');
        
        // Проверяем Telegram WebApp
        if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
          telegramId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
          console.log('📱 Найден ID в Telegram WebApp:', telegramId);
        }
        
        // Проверяем localStorage
        if (!telegramId) {
          const savedId = localStorage.getItem('telegramId');
          if (savedId) {
            telegramId = savedId;
            console.log('💾 Найден сохраненный ID:', telegramId);
          }
        }
      }
      
      if (!telegramId) {
        throw new Error('Не удалось получить Telegram ID. Попробуйте перезапустить приложение из Telegram.');
      }
      
      console.log('🔍 Используем Telegram ID для запроса:', telegramId);
      
      const result = await adminApiService.getStats(telegramId);
      
      setStats(result);
      console.log('✅ Статистика загружена успешно:', result);
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