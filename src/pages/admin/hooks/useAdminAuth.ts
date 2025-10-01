// pages/admin/hooks/useAdminAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../../context/NewPlayerContext';
import type { UseAdminAuthReturn } from '../types';
import axios from 'axios';

// Используем тот же подход что и в ReferralsPage
const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5002';

export const useAdminAuth = (): UseAdminAuthReturn => {
  const { player } = useNewPlayer();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminStatus = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Начинаем проверку админских прав...');
      console.log('📱 Player данные:', {
        telegram_id: player?.telegram_id,
        username: player?.username,
        first_name: player?.first_name,
        hasPlayer: !!player
      });
      
      // Проверяем наличие player и его telegram_id - как в ReferralsPage
      if (!player?.telegram_id) {
        console.log('⚠️ Player не загружен или нет telegram_id');
        
        // Пытаемся получить ID из Telegram WebApp как fallback
        const webApp = (window as any)?.Telegram?.WebApp;
        if (webApp?.initDataUnsafe?.user?.id) {
          const telegramId = String(webApp.initDataUnsafe.user.id);
          console.log('📱 Найден ID в Telegram WebApp:', telegramId);
          
          // Проверяем админа с ID из WebApp
          const response = await axios.get(`${apiUrl}/api/admin/check/${telegramId}`);
          setIsAdmin(response.data.isAdmin);
          console.log('🔐 Результат проверки админа (WebApp ID):', response.data.isAdmin);
          
          if (!response.data.isAdmin) {
            setError('Доступ запрещен! Только для администратора.');
            setTimeout(() => navigate('/', { replace: true }), 3000);
          }
        } else {
          setError('Не удалось получить Telegram ID. Убедитесь, что приложение запущено из Telegram.');
          setTimeout(() => navigate('/', { replace: true }), 5000);
        }
        return;
      }
      
      console.log('🔍 Проверяем админский статус для ID:', player.telegram_id);
      
      // Используем прямой axios запрос как в ReferralsPage
      const response = await axios.get(`${apiUrl}/api/admin/check/${player.telegram_id}`);
      
      setIsAdmin(response.data.isAdmin);
      console.log('🔐 Результат проверки админа:', response.data.isAdmin);
      
      if (!response.data.isAdmin) {
        setError('Доступ запрещен! Только для администратора.');
        console.log('❌ Доступ запрещен - не админ. Player telegram_id:', player.telegram_id);
        
        // Показываем предупреждение и перенаправляем через 3 секунды
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } else {
        console.log('✅ Админские права подтверждены для ID:', player.telegram_id);
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка проверки админа:', err);
      
      // Обрабатываем ошибки как в ReferralsPage
      let errorMessage = 'Произошла ошибка при проверке админских прав';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setIsAdmin(false);
      setError(errorMessage);
      
      // При ошибке API также перенаправляем на главную
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
    } finally {
      setLoading(false);
    }
  }, [player?.telegram_id, navigate]);

  // Автоматическая проверка при монтировании компонента или изменении игрока
  useEffect(() => {
    // Даем немного времени для инициализации как в ReferralsPage
    const timer = setTimeout(() => {
      checkAdminStatus();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [checkAdminStatus]);

  return {
    isAdmin,
    loading,
    error,
    checkAdminStatus
  };
};