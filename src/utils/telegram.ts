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

export const getTelegramId = (): string | null => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
  }
  if (process.env.NODE_ENV === 'development') {
    return '2097930691';
  }
  return null;
};

export const getTelegramLanguage = (): string | null => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
    return window.Telegram.WebApp.initDataUnsafe.user.language_code;
  }
  if (process.env.NODE_ENV === 'development') {
    return 'en';
  }
  return null;
};