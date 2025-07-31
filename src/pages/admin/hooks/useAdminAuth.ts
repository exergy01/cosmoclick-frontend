// pages/admin/hooks/useAdminAuth.ts
import { useState, useEffect, useCallback } from 'react';
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

  const checkAdminStatus = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Начинаем проверку админских прав...');
      console.log('📱 Информация об устройстве:', {
        userAgent: navigator.userAgent,
        isMobile: /Mobi|Android/i.test(navigator.userAgent),
        platform: navigator.platform,
        location: window.location.href
      });
      
      // Пытаемся получить Telegram ID разными способами
      let telegramId = player?.telegram_id;
      
      console.log('📱 Player данные:', {
        telegram_id: player?.telegram_id,
        username: player?.username,
        first_name: player?.first_name,
        hasPlayer: !!player
      });
      
      if (!telegramId) {
        console.log('⚠️ Telegram ID не найден в player, пробуем Telegram WebApp...');
        
        // Проверяем Telegram WebApp
        if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
          telegramId = String(window.Telegram.WebApp.initDataUnsafe.user.id);
          console.log('📱 Найден ID в Telegram WebApp:', telegramId);
          
          // Сохраняем для будущего использования
          localStorage.setItem('telegramId', telegramId);
        }
        
        // Проверяем localStorage
        if (!telegramId) {
          const savedId = localStorage.getItem('telegramId');
          if (savedId) {
            telegramId = savedId;
            console.log('💾 Найден сохраненный ID:', telegramId);
          }
        }
        
        // Проверяем URL параметры
        if (!telegramId) {
          const urlParams = new URLSearchParams(window.location.search);
          const startParam = urlParams.get('tgWebAppStartParam');
          if (startParam) {
            console.log('🔗 Найден startParam:', startParam);
            // startParam может содержать referral info, но не telegram_id
          }
        }
      }
      
      if (!telegramId) {
        setError('Не удалось получить Telegram ID. Убедитесь, что приложение запущено из Telegram.');
        setIsAdmin(false);
        
        // На мобильных устройствах даем больше времени
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 5000);
        return;
      }
      
      console.log('🔍 Проверяем админский статус для ID:', telegramId);
      
      const result = await adminApiService.checkAdminStatus(telegramId);
      
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
  }, [player?.telegram_id, navigate]);

  // Автоматическая проверка при монтировании компонента или изменении игрока
  useEffect(() => {
    // Даем немного времени для инициализации Telegram WebApp на мобильных
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