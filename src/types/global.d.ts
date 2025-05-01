interface TelegramWebAppUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  }
  
  interface TelegramWebAppInitDataUnsafe {
    user?: TelegramWebAppUser;
  }
  
  interface TelegramWebApp {
    initDataUnsafe: TelegramWebAppInitDataUnsafe;
  }
  
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
  