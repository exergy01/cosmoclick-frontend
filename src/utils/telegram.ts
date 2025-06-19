// src/utils/telegram.ts - УЛУЧШЕННАЯ ВЕРСИЯ
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id?: number;
            language_code?: string;
          };
        };
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

export const getTelegramId = (): string => {
  try {
    // 🔥 ИСПРАВЛЕНО: Проверяем Telegram WebApp более тщательно
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Инициализируем WebApp если нужно
      if (webApp.ready) {
        webApp.ready();
      }
      if (webApp.expand) {
        webApp.expand();
      }
      
      const telegramId = webApp.initDataUnsafe?.user?.id;
      if (telegramId) {
        console.log('🔥 Настоящий Telegram ID:', telegramId);
        return telegramId.toString();
      }
    }
    
    // Для тестирования в development режиме
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development режим - тестовый ID');
      return '123456789';
    }
    
    // 🔥 В продакшене попробуем получить из URL параметров
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('start');
    if (startParam) {
      console.log('🔗 ID из URL параметра:', startParam);
      return startParam;
    }
    
    console.warn('⚠️ Telegram WebApp недоступен, используем тестовый ID');
    return '123456789';
    
  } catch (error) {
    console.error('❌ Ошибка получения Telegram ID:', error);
    return '123456789';
  }
};