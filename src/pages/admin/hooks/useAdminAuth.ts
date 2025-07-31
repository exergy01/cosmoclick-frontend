// pages/admin/hooks/useAdminAuth.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../../context/NewPlayerContext';
import { adminApiService, handleAdminApiError } from '../services/adminApi';
import type { UseAdminAuthReturn } from '../types';

export const useAdminAuth = (): UseAdminAuthReturn => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = async (): Promise<void> => {
    if (!player?.telegram_id) {
      setIsAdmin(false);
      setLoading(false);
      setError('Не удалось получить Telegram ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Проверяем админский статус для:', player.telegram_id);
      
      const result = await adminApiService.checkAdminStatus(player.telegram_id);
      
      setIsAdmin(result.isAdmin);
      console.log('🔐 Результат проверки админа:', result.isAdmin);
      
      if (!result.isAdmin) {
        setError('Доступ запрещен! Только для администратора.');
        // Показываем предупреждение и перенаправляем через 3 секунды
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    } catch (err) {
      const errorMessage = handleAdminApiError(err);
      console.error('❌ Ошибка проверки админа:', errorMessage);
      
      setIsAdmin(false);
      setError(errorMessage);
      
      // При ошибке API также перенаправляем на главную
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Автоматическая проверка при монтировании компонента или изменении игрока
  useEffect(() => {
    checkAdminStatus();
  }, [player?.telegram_id]); // Убираем комментарий с eslint-disable-line

  return {
    isAdmin,
    loading,
    error,
    checkAdminStatus
  };
};