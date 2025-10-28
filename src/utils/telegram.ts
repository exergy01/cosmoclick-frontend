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
        ready?: () => void;
      };
    };
  }
}

// Получение Telegram ID пользователя
export const getTelegramId = (): string => {
  try {
    if (process.env.NODE_ENV === 'development') console.log('getTelegramId: проверка Telegram объекта...');
    if (process.env.NODE_ENV === 'development') console.log('window.Telegram:', window.Telegram);
    if (process.env.NODE_ENV === 'development') console.log('window.Telegram?.WebApp:', window.Telegram?.WebApp);
    if (process.env.NODE_ENV === 'development') console.log('initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);
    
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (process.env.NODE_ENV === 'development') console.log('Telegram ID from WebApp:', telegramId);
    
    if (telegramId) {
      return telegramId.toString();
    }
    
    // Для тестирования в development режиме
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') console.log('Development mode: using test ID');
      return '123456789'; // Тестовый ID
    }
    
    throw new Error('Telegram ID not found');
  } catch (error) {
    console.error('Error getting Telegram ID:', error);
    return '';
  }
};

// Получение языка пользователя из Telegram
export const getTelegramLanguage = (): string => {
  try {
    const language = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (process.env.NODE_ENV === 'development') console.log('Telegram language:', language);
    return language || 'en';
  } catch (error) {
    console.error('Error getting Telegram language:', error);
    return 'en';
  }
};

// Проверка доступности Telegram WebApp
export const isTelegramWebApp = (): boolean => {
  const isAvailable = typeof window !== 'undefined' && !!window.Telegram?.WebApp;
  if (process.env.NODE_ENV === 'development') console.log('isTelegramWebApp:', isAvailable);
  return isAvailable;
};