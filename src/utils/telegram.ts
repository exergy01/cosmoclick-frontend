// Утилиты для работы с Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id?: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          start_param?: string;
        };
        ready?: () => void;
        expand?: () => void;
        version?: string;
      };
    };
  }
}

// 🔥 УЛУЧШЕННОЕ получение Telegram ID
export const getTelegramId = (): string => {
  try {
    console.log('🔍 Проверка Telegram WebApp...');
    
    // Проверяем доступность Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      console.log('📱 Telegram WebApp найден:', {
        version: webApp.version,
        hasInitData: !!webApp.initData,
        hasInitDataUnsafe: !!webApp.initDataUnsafe,
        initDataLength: webApp.initData?.length || 0
      });
      
      // Инициализируем WebApp
      if (webApp.ready) {
        webApp.ready();
        console.log('✅ Telegram WebApp готов');
      }
      
      if (webApp.expand) {
        webApp.expand();
        console.log('📱 Telegram WebApp развернут');
      }
      
      // Пытаемся получить ID пользователя
      const userId = webApp.initDataUnsafe?.user?.id;
      if (userId) {
        console.log('🎯 Реальный Telegram ID получен:', userId);
        return userId.toString();
      }
      
      // Если initDataUnsafe пустой, проверяем initData
      if (webApp.initData) {
        console.log('📊 InitData доступен, длина:', webApp.initData.length);
        // Можно попробовать парсить initData, но это сложнее
      }
      
      console.warn('⚠️ Telegram WebApp найден, но пользователь недоступен');
    } else {
      console.log('❌ Telegram WebApp недоступен');
    }
    
    // 🔥 Проверяем URL параметры (для Web версии через ссылку)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const startParam = urlParams.get('start');
      const tgWebAppStartParam = urlParams.get('tgWebAppStartParam');
      
      if (startParam) {
        console.log('🔗 ID из URL start параметра:', startParam);
        return startParam;
      }
      
      if (tgWebAppStartParam) {
        console.log('🔗 ID из tgWebAppStartParam:', tgWebAppStartParam);
        return tgWebAppStartParam;
      }
    }
    
    // 🔥 Для разработки используем тестовый ID
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development режим - тестовый ID');
      return '123456789';
    }
    
    // 🔥 В продакшене если в браузере - тестовый ID
    const isInBrowser = !window.Telegram?.WebApp?.initData;
    if (isInBrowser) {
      console.log('🌐 Браузерная версия - тестовый ID');
      return '123456789';
    }
    
    console.warn('⚠️ Не удалось получить Telegram ID, используем fallback');
    return '123456789';
    
  } catch (error) {
    console.error('❌ Ошибка получения Telegram ID:', error);
    return '123456789';
  }
};

// 🔥 УЛУЧШЕННОЕ получение данных пользователя
export const getTelegramUser = () => {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      console.log('👤 Данные пользователя Telegram:', user);
      
      return {
        id: user.id?.toString() || '123456789',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        languageCode: user.language_code || 'en'
      };
    }
    
    console.log('👤 Используем тестовые данные пользователя');
    return {
      id: '123456789',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      languageCode: 'ru'
    };
  } catch (error) {
    console.error('❌ Ошибка получения данных пользователя:', error);
    return {
      id: '123456789',
      firstName: 'Test',
      lastName: 'User', 
      username: 'testuser',
      languageCode: 'ru'
    };
  }
};

// Получение языка пользователя из Telegram
export const getTelegramLanguage = (): string => {
  try {
    const language = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (language) {
      console.log('🌐 Язык из Telegram:', language);
      return language;
    }
    return 'ru';
  } catch (error) {
    console.error('❌ Ошибка получения языка:', error);
    return 'ru';
  }
};

// Проверка доступности Telegram WebApp
export const isTelegramWebApp = (): boolean => {
  const isWebApp = typeof window !== 'undefined' && !!window.Telegram?.WebApp;
  console.log('🔍 Проверка Telegram WebApp:', isWebApp);
  return isWebApp;
};

// 🔥 НОВАЯ функция: отладочная информация
export const getTelegramDebugInfo = () => {
  if (typeof window === 'undefined') {
    return { error: 'Window недоступен' };
  }
  
  const webApp = window.Telegram?.WebApp;
  
  return {
    hasTelegram: !!window.Telegram,
    hasWebApp: !!webApp,
    version: webApp?.version,
    hasInitData: !!webApp?.initData,
    initDataLength: webApp?.initData?.length || 0,
    hasInitDataUnsafe: !!webApp?.initDataUnsafe,
    hasUser: !!webApp?.initDataUnsafe?.user,
    userId: webApp?.initDataUnsafe?.user?.id,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
};