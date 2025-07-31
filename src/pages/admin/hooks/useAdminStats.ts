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
      
      // Пытаемся получить Telegram ID разными способами с приоритетом localStorage
      let telegramId: string | null = null;
      
      // 1. Сначала проверяем localStorage (приоритет)
      const savedId = localStorage.getItem('telegramId');
      if (savedId && savedId.trim()) {
        telegramId = savedId.trim();
        console.log('💾 Используем сохраненный ID для статистики:', telegramId);
      }
      
      // 2. Если нет сохраненного, пробуем получить из player
      if (!telegramId && player?.telegram_id) {
        telegramId = String(player.telegram_id);
        console.log('👤 Используем ID из player для статистики:', telegramId);
      }
      
      // 3. Если нет в player, пробуем Telegram WebApp
      if (!telegramId) {
        console.log('⚠️ Telegram ID не найден в сохраненных, пробуем другие источники...');
        
        const webApp = (window as any)?.Telegram?.WebApp;
        if (webApp?.initDataUnsafe?.user?.id) {
          telegramId = String(webApp.initDataUnsafe.user.id);
          console.log('📱 Найден ID в Telegram WebApp для статистики:', telegramId);
          
          // Сохраняем для будущего использования
          try {
            localStorage.setItem('telegramId', telegramId);
            console.log('💾 ID сохранен в localStorage');
          } catch (storageError) {
            console.warn('⚠️ Не удалось сохранить ID:', storageError);
          }
        }
      }
      
      if (!telegramId) {
        throw new Error('Не удалось получить Telegram ID. Попробуйте перезапустить приложение из Telegram.');
      }
      
      console.log('🔍 Используем Telegram ID для запроса статистики:', telegramId);
      console.log('🔍 Ожидаемый админский ID: 1222791281');
      console.log('🔍 ID совпадает:', telegramId === '1222791281');
      
      const result = await adminApiService.getStats(telegramId);
      
      setStats(result);
      console.log('✅ Статистика загружена успешно:', result);
      
      // Показываем краткую сводку загруженных данных
      if (result) {
        console.log('📊 Краткая сводка статистики:', {
          totalPlayers: result.players?.total_players || 0,
          totalCS: result.currencies?.total_cs?.toFixed(2) || '0',
          totalExchanges: result.stars_exchange?.total_exchanges || 0,
          topPlayersCount: result.top_players?.length || 0,
          hasRates: !!(result.current_rates && Object.keys(result.current_rates).length > 0)
        });
      }
    } catch (err) {
      const errorMessage = handleAdminApiError(err);
      console.error('❌ Ошибка загрузки статистики:', errorMessage);
      
      setError(errorMessage);
      setStats(null);
      
      // Дополнительная диагностика при ошибке
      const webApp = (window as any)?.Telegram?.WebApp;
      console.log('🔍 Диагностика при ошибке загрузки статистики:', {
        savedId: localStorage.getItem('telegramId'),
        playerTelegramId: player?.telegram_id,
        webAppExists: !!webApp,
        webAppUserId: webApp?.initDataUnsafe?.user?.id,
        errorType: typeof err,
        errorMessage: errorMessage
      });
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