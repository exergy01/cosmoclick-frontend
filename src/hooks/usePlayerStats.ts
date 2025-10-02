import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'https://cosmoclick-backend.onrender.com';

interface PlayerStats {
  // Основная статистика
  totalPlayTime: number; // в минутах
  totalResourcesCollected: {
    ccc: number;
    cs: number;
    ton: number;
  };
  totalPurchases: number;
  
  // Эффективность
  resourcesPerHour: {
    ccc: number;
    cs: number;
    ton: number;
  };
  
  // Прогресс
  systemProgress: {
    [systemId: number]: {
      cargoLevel: number;
      dronesCount: number;
      asteroidsOwned: number;
      systemUnlocked: boolean;
    };
  };
  
  // Достижения
  achievements: {
    firstMillion: boolean;      // Собрал 1М CCC
    hundredDrones: boolean;     // Купил 100 дронов
    allSystemsUnlocked: boolean; // Открыл все системы
    speedRunner: boolean;       // Быстрая прокачка
  };
  
  // Рейтинги
  ranking: {
    totalResources: number;   // место в рейтинге по ресурсам
    efficiency: number;       // место по эффективности
    progress: number;         // место по прогрессу
  };
  
  // Финансы
  financial: {
    totalSpent: {
      ccc: number;
      cs: number;
      ton: number;
    };
    roi: number; // возврат инвестиций в %
    bestInvestment: string; // лучшая покупка
  };
  
  // История (последние 7 дней)
  history: {
    date: string;
    cccCollected: number;
    csCollected: number;
    tonCollected: number;
    purchases: number;
  }[];
}

interface UsePlayerStatsReturn {
  stats: PlayerStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export const usePlayerStats = (telegramId: string | undefined): UsePlayerStatsReturn => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!telegramId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 🔥 ИСПРАВЛЕНО: используем правильный endpoint
      const response = await axios.get(`${apiUrl}/api/player/stats/${telegramId}`);
      
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch player stats:', err);
      setError(err.response?.data?.error || 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats
  };
};