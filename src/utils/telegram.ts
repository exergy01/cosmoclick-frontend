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

// 🔥 НОВАЯ функция: парсинг данных из URL hash
const parseUrlHash = (): any => {
  try {
    if (typeof window === 'undefined') return null;
    
    const hash = window.location.hash;
    console.log('🔗 URL hash:', hash.slice(0, 100) + '...');
    
    if (!hash.includes('tgWebAppData=')) {
      console.log('❌ tgWebAppData не найден в URL');
      return null;
    }
    
    // Извлекаем tgWebAppData
    const params = new URLSearchParams(hash.slice(1));
    const tgWebAppData = params.get('tgWebAppData');
    
    if (!tgWebAppData) {
      console.log('❌ tgWebAppData пустой');
      return null;
    }
    
    console.log('📊 tgWebAppData найден:', tgWebAppData.slice(0, 100) + '...');
    
    // Декодируем URL
    const decodedData = decodeURIComponent(tgWebAppData);
    console.log('🔓 Декодированные данные:', decodedData.slice(0, 100) + '...');
    
    // Парсим параметры
    const dataParams = new URLSearchParams(decodedData);
    const userStr = dataParams.get('user');
    
    if (!userStr) {
      console.log('❌ Параметр user не найден');
      return null;
    }
    
    console.log('👤 User string:', userStr);
    
    // Парсим JSON пользователя
    const user = JSON.parse(userStr);
    console.log('✅ Parsed user:', user);
    
    return {
      user: user,
      query_id: dataParams.get('query_id'),
      auth_date: dataParams.get('auth_date'),
      hash: dataParams.get('hash')
    };
    
  } catch (error) {
    console.error('❌ Ошибка парсинга URL hash:', error);
    return null;
  }
};

// 🔥 УЛУЧШЕННОЕ получение Telegram ID
export const getTelegramId = (): string => {
  try {
    console.log('🔍 Получение Telegram ID...');
    
    // 1. Сначала пробуем стандартный WebApp API
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      const userId = window.Telegram.WebApp.initDataUnsafe.user.id;
      console.log('✅ ID из WebApp API:', userId);
      return userId.toString();
    }
    
    // 2. Парсим данные из URL hash
    const urlData = parseUrlHash();
    if (urlData?.user?.id) {
      console.log('✅ ID из URL hash:', urlData.user.id);
      return urlData.user.id.toString();
    }
    
    // 3. Проверяем URL параметры
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const startParam = urlParams.get('start');
      if (startParam) {
        console.log('✅ ID из URL start параметра:', startParam);
        return startParam;
      }
    }
    
    // 4. Fallback для разработки
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development режим - тестовый ID');
      return '123456789';
    }
    
    // 5. Fallback для браузера
    console.log('🌐 Fallback - тестовый ID');
    return '123456789';
    
  } catch (error) {
    console.error('❌ Ошибка получения Telegram ID:', error);
    return '123456789';
  }
};

// 🔥 НОВАЯ функция: получение данных пользователя
export const getTelegramUser = () => {
  try {
    console.log('👤 Получение данных пользователя...');
    
    // 1. Из WebApp API
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      console.log('✅ Пользователь из WebApp API:', user);
      return {
        id: user.id?.toString() || '123456789',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        languageCode: user.language_code || 'ru'
      };
    }
    
    // 2. Из URL hash
    const urlData = parseUrlHash();
    if (urlData?.user) {
      const user = urlData.user;
      console.log('✅ Пользователь из URL hash:', user);
      return {
        id: user.id?.toString() || '123456789',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        username: user.username || '',
        languageCode: user.language_code || 'ru'
      };
    }
    
    // 3. Fallback
    console.log('🔄 Fallback пользователь');
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

// Получение языка пользователя
export const getTelegramLanguage = (): string => {
  try {
    const user = getTelegramUser();
    return user.languageCode || 'ru';
  } catch (error) {
    console.error('❌ Ошибка получения языка:', error);
    return 'ru';
  }
};

// Проверка доступности Telegram WebApp
export const isTelegramWebApp = (): boolean => {
  // Проверяем либо WebApp API, либо данные в URL
  const hasWebApp = typeof window !== 'undefined' && !!window.Telegram?.WebApp;
  const hasUrlData = typeof window !== 'undefined' && window.location.hash.includes('tgWebAppData=');
  
  const isWebApp = hasWebApp || hasUrlData;
  console.log('🔍 Проверка Telegram WebApp:', { hasWebApp, hasUrlData, isWebApp });
  return isWebApp;
};

// 🔥 НОВАЯ функция: получение всех данных для диагностики
export const getTelegramDebugInfo = () => {
  if (typeof window === 'undefined') {
    return { error: 'Window недоступен' };
  }
  
  const webApp = window.Telegram?.WebApp;
  const urlData = parseUrlHash();
  const user = getTelegramUser();
  
  return {
    // WebApp API
    hasTelegram: !!window.Telegram,
    hasWebApp: !!webApp,
    webAppVersion: webApp?.version,
    hasInitData: !!webApp?.initData,
    initDataLength: webApp?.initData?.length || 0,
    hasInitDataUnsafe: !!webApp?.initDataUnsafe,
    hasWebAppUser: !!webApp?.initDataUnsafe?.user,
    webAppUserId: webApp?.initDataUnsafe?.user?.id,
    
    // URL данные
    hasUrlData: !!urlData,
    urlUserId: urlData?.user?.id,
    urlUserName: urlData?.user?.first_name,
    urlUsername: urlData?.user?.username,
    
    // Финальные данные
    finalId: getTelegramId(),
    finalUser: user,
    
    // Браузер
    userAgent: navigator.userAgent.slice(0, 100),
    url: window.location.href.slice(0, 100),
    hash: window.location.hash.slice(0, 100)
  };
};