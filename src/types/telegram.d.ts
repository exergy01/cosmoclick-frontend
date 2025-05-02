interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
      user?: {
        id: number;
        first_name?: string;
        last_name?: string;
        username?: string;
        language_code?: string;
      };
    };
    [key: string]: any;
  }
  
  interface Telegram {
    WebApp: TelegramWebApp;
  }
  
  declare global {
    interface Window {
      Telegram: Telegram;
    }
  }