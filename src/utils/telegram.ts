// Утилиты для работы с Telegram WebApp
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
      };
    };
  }
}

// Получение Telegram ID пользователя
export const getTelegramId = (): string => {
  try {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (telegramId) {
      return telegramId.toString();
    }
    
    // Для тестирования в development режиме
    if (process.env.NODE_ENV === 'development') {
      return '123456789'; // Тестовый ID
    }
    
    // 🔥 ДОБАВЛЕНО: Fallback для продакшена
    console.warn('Telegram WebApp not available, using test ID');
    return '123456789'; // Тестовый ID для продакшена
    
  } catch (error) {
    console.error('Error getting Telegram ID:', error);
    return '123456789'; // 🔥 ИСПРАВЛЕНО: возвращаем тестовый ID вместо пустой строки
  }
};

// Получение языка пользователя из Telegram
export const getTelegramLanguage = (): string => {
  try {
    const language = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    return language || 'en';
  } catch (error) {
    console.error('Error getting Telegram language:', error);
    return 'en';
  }
};

// Проверка доступности Telegram WebApp
export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
};