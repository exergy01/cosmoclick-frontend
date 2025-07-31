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
      let telegramId: string | null = null;
      
      console.log('📱 Player данные:', {
        telegram_id: player?.telegram_id,
        username: player?.username,
        first_name: player?.first_name,
        hasPlayer: !!player
      });
      
      // 1. Сначала проверяем localStorage (приоритет для сохраненных значений)
      const savedId = localStorage.getItem('telegramId');
      if (savedId && savedId.trim()) {
        telegramId = savedId.trim();
        console.log('💾 Используем сохраненный ID:', telegramId);
      }
      
      // 2. Если нет сохраненного, пробуем получить из player
      if (!telegramId && player?.telegram_id) {
        telegramId = String(player.telegram_id);
        console.log('👤 Используем ID из player:', telegramId);
      }
      
      // 3. Если нет в player, пробуем Telegram WebApp
      if (!telegramId) {
        console.log('⚠️ Telegram ID не найден в сохраненных, пробуем Telegram WebApp...');
        
        const webApp = (window as any)?.Telegram?.WebApp;
        if (webApp?.initDataUnsafe?.user?.id) {
          telegramId = String(webApp.initDataUnsafe.user.id);
          console.log('📱 Найден ID в Telegram WebApp:', telegramId);
          
          // Сохраняем для будущего использования
          try {
            localStorage.setItem('telegramId', telegramId);
            console.log('💾 ID сохранен в localStorage для будущего использования');
          } catch (storageError) {
            console.warn('⚠️ Не удалось сохранить ID:', storageError);
          }
        }
      }
      
      if (!telegramId) {
        const errorMsg = 'Не удалось получить Telegram ID. Убедитесь, что приложение запущено из Telegram.';
        setError(errorMsg);
        setIsAdmin(false);
        
        console.error('❌ Telegram ID не найден во всех источниках');
        
        // Показываем подробную диагностику
        const webApp = (window as any)?.Telegram?.WebApp;
        console.log('🔍 Полная диагностика:', {
          telegram: !!(window as any)?.Telegram,
          webApp: !!webApp,
          initDataUnsafe: webApp?.initDataUnsafe,
          user: webApp?.initDataUnsafe?.user,
          userId: webApp?.initDataUnsafe?.user?.id,
          savedId: localStorage.getItem('telegramId'),
          playerTelegramId: player?.telegram_id
        });
        
        // На мобильных устройствах даем больше времени
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 5000);
        return;
      }
      
      console.log('🔍 Проверяем админский статус для ID:', telegramId);
      console.log('🔍 Ожидаемый админский ID: 1222791281');
      console.log('🔍 ID совпадает локально:', telegramId === '1222791281');
      
      const result = await adminApiService.checkAdminStatus(telegramId);
      
      setIsAdmin(result.isAdmin);
      console.log('🔐 Результат проверки админа:', result.isAdmin);
      
      if (!result.isAdmin) {
        setError('Доступ запрещен! Только для администратора.');
        console.log('❌ Доступ запрещен - не админ. Telegram ID:', telegramId);
        
        // Показываем предупреждение и перенаправляем через 3 секунды
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } else {
        console.log('✅ Админские права подтверждены для ID:', telegramId);
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