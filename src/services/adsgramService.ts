// services/adsgramService.ts - ENHANCED VERSION

interface AdsgramController {
  show(): Promise<void>;
}

interface AdsgramConfig {
  blockId: string;
  debug?: boolean;
  onReward?: () => void;
  onError?: (error: any) => void;
  onClose?: () => void;
}

interface AdsgramResult {
  success: boolean;
  provider: string;
  reward?: string;
  error?: string;
  debug?: string;
  timestamp: number;
}

// Интерфейс для всех провайдеров
interface AdProvider {
  name: string;
  initialize(): Promise<boolean>;
  showRewardedAd(): Promise<AdsgramResult>;
  isAvailable(): boolean;
  getProviderInfo(): any;
}

// Функция определения текущего языка из i18next
function getCurrentLanguageFromI18n(): string {
  const supportedLangs = ['ru', 'en', 'es', 'fr', 'de', 'zh', 'ja'];
  
  try {
    // Пытаемся получить язык из i18next разными способами
    const i18next = (window as any).i18next;
    
    if (i18next) {
      // Проверяем разные свойства i18next
      const lang = i18next.language || i18next.lng || i18next.resolvedLanguage;
      if (lang && supportedLangs.includes(lang)) {
        if (process.env.NODE_ENV === 'development') console.log('🌍 Language from i18next:', lang);
        return lang;
      }
    }
    
    // Пробуем получить из localStorage i18next
    const storedLang = localStorage.getItem('i18nextLng');
    if (storedLang && supportedLangs.includes(storedLang)) {
      if (process.env.NODE_ENV === 'development') console.log('🌍 Language from localStorage i18next:', storedLang);
      return storedLang;
    }
    
    // Пробуем найти React i18next в DOM
    const reactI18next = document.querySelector('[data-i18next-lng]');
    if (reactI18next) {
      const lang = reactI18next.getAttribute('data-i18next-lng');
      if (lang && supportedLangs.includes(lang)) {
        if (process.env.NODE_ENV === 'development') console.log('🌍 Language from React i18next DOM:', lang);
        return lang;
      }
    }
    
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.log('🌍 Error getting language from i18next:', e);
  }
  
  if (process.env.NODE_ENV === 'development') console.log('🌍 Language fallback to: ru');
  return 'ru';
}

// 1. ADSGRAM ПРОВАЙДЕР
declare global {
  interface Window {
    Adsgram?: {
      init: (config: AdsgramConfig) => AdsgramController;
    };
  }
}

class AdsgramProvider implements AdProvider {
  name = 'adsgram';
  private blockId: string;
  private controller: AdsgramController | null = null;
  private isInitialized = false;

  constructor(blockId: string) {
    this.blockId = String(blockId).replace(/^bot-/, '').trim();
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return this.isAvailable();

    try {
      // Попытка загрузить Adsgram SDK
      if (!window.Adsgram) {
        const script = document.createElement('script');
        script.src = 'https://sad.adsgram.ai/js/sad.min.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        
        // Ждем инициализацию
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (window.Adsgram && this.blockId) {
        this.controller = window.Adsgram.init({
          blockId: this.blockId,
          debug: false
        });
        this.isInitialized = true;
        if (process.env.NODE_ENV === 'development') console.log('✅ Adsgram initialized successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.log('❌ Adsgram initialization failed:', error);
      return false;
    }
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    if (!this.controller) {
      return {
        success: false,
        provider: 'adsgram',
        error: 'Adsgram not initialized',
        timestamp: Date.now()
      };
    }

    try {
      await this.controller.show();
      return {
        success: true,
        provider: 'adsgram',
        reward: 'extra_game',
        debug: 'Adsgram ad completed',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        provider: 'adsgram',
        error: 'Adsgram ad failed',
        timestamp: Date.now()
      };
    }
  }

  isAvailable(): boolean {
    return this.isInitialized && this.controller !== null;
  }

  getProviderInfo() {
    return {
      name: 'adsgram',
      available: this.isAvailable(),
      debug: 'Official Telegram ad network'
    };
  }
}

// 2. YANDEX ПРОВАЙДЕР (заглушка)
class YandexProvider implements AdProvider {
  name = 'yandex';

  async initialize(): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') console.log('📍 Yandex provider - заглушка готова к подключению');
    return false; // Пока не реализован
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    return {
      success: false,
      provider: 'yandex',
      error: 'Yandex provider not implemented yet',
      timestamp: Date.now()
    };
  }

  isAvailable(): boolean {
    return false; // Заглушка
  }

  getProviderInfo() {
    return { name: 'yandex', available: false, status: 'stub' };
  }
}

// 3. TELEGA.IN ПРОВАЙДЕР (заглушка)
class TelegaProvider implements AdProvider {
  name = 'telega';

  async initialize(): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') console.log('📍 Telega.in provider - заглушка готова к подключению');
    return false;
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    return {
      success: false,
      provider: 'telega',
      error: 'Telega provider not implemented yet',
      timestamp: Date.now()
    };
  }

  isAvailable(): boolean {
    return false;
  }

  getProviderInfo() {
    return { name: 'telega', available: false, status: 'stub' };
  }
}

// 4. BITMEDIA ПРОВАЙДЕР (заглушка)
class BitmediaProvider implements AdProvider {
  name = 'bitmedia';

  async initialize(): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') console.log('📍 Bitmedia provider - заглушка готова к подключению');
    return false;
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    return {
      success: false,
      provider: 'bitmedia',
      error: 'Bitmedia provider not implemented yet',
      timestamp: Date.now()
    };
  }

  isAvailable(): boolean {
    return false;
  }

  getProviderInfo() {
    return { name: 'bitmedia', available: false, status: 'stub' };
  }
}

// 5. PROPELLERADS ПРОВАЙДЕР (заглушка)
class PropellerAdsProvider implements AdProvider {
  name = 'propellerads';

  async initialize(): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') console.log('📍 PropellerAds provider - заглушка готова к подключению');
    return false;
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    return {
      success: false,
      provider: 'propellerads',
      error: 'PropellerAds provider not implemented yet',
      timestamp: Date.now()
    };
  }

  isAvailable(): boolean {
    return false;
  }

  getProviderInfo() {
    return { name: 'propellerads', available: false, status: 'stub' };
  }
}

// 6. TELEGRAM ADS API ПРОВАЙДЕР (заглушка)
class TelegramAdsProvider implements AdProvider {
  name = 'telegram_ads';

  async initialize(): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') console.log('📍 Telegram Ads API provider - заглушка готова к подключению');
    return false;
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    return {
      success: false,
      provider: 'telegram_ads',
      error: 'Telegram Ads API provider not implemented yet',
      timestamp: Date.now()
    };
  }

  isAvailable(): boolean {
    return false;
  }

  getProviderInfo() {
    return { name: 'telegram_ads', available: false, status: 'stub' };
  }
}

// 7. CUSTOM BLOCK ПРОВАЙДЕР (наша реклама)
interface CustomAd {
  name: string;
  title: { [key: string]: string };
  description: { [key: string]: string };
  buttonText: { [key: string]: string };
  targetUrl: string;
  imageUrl: string;
  duration: number; // в секундах
  isHorizontal?: boolean; // для особых эффектов
}

class CustomBlockProvider implements AdProvider {
  name = 'custom_block';
  private ads: CustomAd[] = [
    {
      name: 'roboforex',
      title: {
        ru: 'RoboForex - Твой путь к успеху!',
        en: 'RoboForex - Your Path to Success!',
        es: 'RoboForex - ¡Tu Camino al Éxito!',
        fr: 'RoboForex - Votre Chemin vers le Succès!',
        de: 'RoboForex - Ihr Weg zum Erfolg!',
        zh: 'RoboForex - 您成功之路！',
        ja: 'RoboForex - 成功への道！'
      },
      description: {
        ru: 'Торгуй на Форекс, акциями, криптой и сырьем. Бонусы до $120! Лицензированный брокер.',
        en: 'Trade Forex, stocks, crypto and commodities. Bonuses up to $120! Licensed broker.',
        es: 'Opera en Forex, acciones, cripto y materias primas. ¡Bonos hasta $120! Bróker con licencia.',
        fr: 'Tradez le Forex, les actions, la crypto et les matières premières. Bonus jusqu\'à 120$! Courtier agréé.',
        de: 'Handeln Sie Forex, Aktien, Krypto und Rohstoffe. Boni bis zu 120$! Lizenzierter Broker.',
        zh: '交易外汇、股票、加密货币和大宗商品。高达120美元奖金！持牌经纪商。',
        ja: 'フォレックス、株式、暗号通貨、商品を取引。最大120ドルのボーナス！ライセンス取得ブローカー。'
      },
      buttonText: {
        ru: 'Открыть счет',
        en: 'Open Account',
        es: 'Abrir Cuenta',
        fr: 'Ouvrir un Compte',
        de: 'Konto Eröffnen',
        zh: '开设账户',
        ja: 'アカウント開設'
      },
      targetUrl: 'https://my.roboforex.com/en/?a=hgtd',
      imageUrl: '/assets/ads/robo.png',
      duration: 8
    },
    {
      name: 'bybit',
      title: {
        ru: 'Bybit - Криптотрейдинг №1',
        en: 'Bybit - #1 Crypto Trading',
        es: 'Bybit - Trading de Cripto #1',
        fr: 'Bybit - Trading Crypto #1',
        de: 'Bybit - #1 Krypto-Trading',
        zh: 'Bybit - 第一加密货币交易',
        ja: 'Bybit - ナンバー1暗号通貨取引'
      },
      description: {
        ru: 'Торгуй криптовалютами с плечом до 100x. Бонусы новичкам до $1000!',
        en: 'Trade cryptocurrencies with up to 100x leverage. Newbie bonuses up to $1000!',
        es: 'Opera criptomonedas con apalancamiento hasta 100x. ¡Bonos para principiantes hasta $1000!',
        fr: 'Tradez les cryptomonnaies avec un effet de levier jusqu\'à 100x. Bonus débutants jusqu\'à 1000$!',
        de: 'Handeln Sie Kryptowährungen mit bis zu 100x Hebel. Neuling-Boni bis zu 1000$!',
        zh: '使用高达100倍杠杆交易加密货币。新手奖金高达1000美元！',
        ja: '最大100倍のレバレッジで暗号通貨を取引。新規ボーナス最大1000ドル！'
      },
      buttonText: {
        ru: 'Начать торговлю',
        en: 'Start Trading',
        es: 'Comenzar Trading',
        fr: 'Commencer le Trading',
        de: 'Trading Beginnen',
        zh: '开始交易',
        ja: '取引開始'
      },
      targetUrl: 'https://t.me/Bybitglobal_Official_Bot/referral?startapp=3ABPWRK',
      imageUrl: '/assets/ads/bybit.png',
      duration: 8
    },
    {
      name: 'alfabank',
      title: {
        ru: 'Альфа-Банк - Лучший банк!',
        en: 'Alfa-Bank - Best Bank!',
        es: 'Alfa-Bank - ¡El Mejor Banco!',
        fr: 'Alfa-Bank - Meilleure Banque!',
        de: 'Alfa-Bank - Beste Bank!',
        zh: 'Alfa银行 - 最佳银行！',
        ja: 'アルファ銀行 - ベストバンク！'
      },
      description: {
        ru: 'Откройте карту Альфа-Банка и получите кэшбэк до 33% и бесплатное обслуживание!',
        en: 'Open an Alfa-Bank card and get up to 33% cashback and free service!',
        es: '¡Abra una tarjeta Alfa-Bank y obtenga hasta 33% de cashback y servicio gratuito!',
        fr: 'Ouvrez une carte Alfa-Bank et obtenez jusqu\'à 33% de cashback et un service gratuit!',
        de: 'Eröffnen Sie eine Alfa-Bank-Karte und erhalten Sie bis zu 33% Cashback und kostenlosen Service!',
        zh: '开设Alfa银行卡，获得高达33%的现金返还和免费服务！',
        ja: 'アルファ銀行カードを開設し、最大33%のキャッシュバックと無料サービスを受けましょう！'
      },
      buttonText: {
        ru: 'Оформить карту',
        en: 'Apply for Card',
        es: 'Solicitar Tarjeta',
        fr: 'Demander une Carte',
        de: 'Karte Beantragen',
        zh: '申请卡片',
        ja: 'カード申込'
      },
      targetUrl: 'https://alfa.me/7zCY9A',
      imageUrl: '/assets/ads/alfa.png',
      duration: 8,
      isHorizontal: true // Помечаем как горизонтальную для эффекта
    }
  ];

  async initialize(): Promise<boolean> {
    if (process.env.NODE_ENV === 'development') console.log('✅ Custom Block Provider initialized with', this.ads.length, 'ads');
    return true;
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    if (process.env.NODE_ENV === 'development') console.log('🎯 Showing Custom Block carousel');

    return new Promise(resolve => {
      const isPortrait = window.innerHeight > window.innerWidth;
      
      if (!isPortrait) {
        resolve({
          success: false,
          provider: 'custom_block',
          error: 'Please rotate your screen to portrait mode to view ads',
          debug: 'Landscape orientation detected',
          timestamp: Date.now()
        });
        return;
      }

      // Получаем текущий язык из i18next автоматически
      const currentLanguage = getCurrentLanguageFromI18n();
      if (process.env.NODE_ENV === 'development') console.log('🌍 Using language for ads:', currentLanguage);

      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.95); display: flex; align-items: center;
        justify-content: center; z-index: 10000; color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center; backdrop-filter: blur(10px);
        padding: 20px; box-sizing: border-box;
      `;

      const container = document.createElement('div');
      container.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e, #16213e); 
        padding: 30px; 
        border-radius: 25px; 
        border: 3px solid #00f0ff;
        box-shadow: 0 0 30px rgba(0,240,255,0.5);
        max-width: 400px;
        width: 100%;
        animation: slideIn 0.3s ease-out;
        position: relative;
      `;

      let currentAdIndex = 0;
      let adTimer: NodeJS.Timeout;
      let mainTimer: NodeJS.Timeout;
      const totalDuration = this.ads.reduce((sum, ad) => sum + ad.duration, 0) * 1000;
      const startTime = Date.now();

      // Контейнер для рекламы
      const adContent = document.createElement('div');
      adContent.style.cssText = `
        transition: all 0.5s ease;
        min-height: 350px;
      `;

      // Прогресс бар
      const progressContainer = document.createElement('div');
      progressContainer.style.cssText = `
        width: 100%; 
        height: 6px; 
        background: rgba(255,255,255,0.1); 
        border-radius: 3px; 
        overflow: hidden;
        margin-bottom: 15px;
      `;

      const progressBar = document.createElement('div');
      progressBar.style.cssText = `
        height: 100%; 
        background: linear-gradient(90deg, #00f0ff, #0080ff); 
        width: 0%; 
        transition: width 0.1s linear;
        box-shadow: 0 0 10px #00f0ff;
      `;
      progressContainer.appendChild(progressBar);

      // Функция обновления рекламы
      const updateAd = () => {
        const ad = this.ads[currentAdIndex];
        const title = ad.title[currentLanguage] || ad.title['ru'];
        const description = ad.description[currentLanguage] || ad.description['ru'];
        const buttonText = ad.buttonText[currentLanguage] || ad.buttonText['ru'];
        
        // Особая логика для Альфа-банка (горизонтальная картинка)
        if (ad.isHorizontal) {
          adContent.innerHTML = `
            <!-- Заголовок -->
            <div style="margin-bottom: 20px;">
              <h2 style="color: #00f0ff; margin-bottom: 10px; font-size: 1.5rem;">
                📈 ${title}
              </h2>
              <p style="color: #ccc; font-size: 0.9rem; margin: 0;">
                ${description}
              </p>
            </div>
            
            <!-- Горизонтальное рекламное изображение с эффектом движения -->
            <div style="
              margin-bottom: 20px; 
              overflow: hidden; 
              border-radius: 15px; 
              height: 360px; 
              position: relative;
              cursor: pointer;
            " onclick="window.open('${ad.targetUrl}', '_blank')">
              <img 
                id="alfa-image-${currentAdIndex}"
                src="${ad.imageUrl}" 
                alt="${ad.name}" 
                style="
                  height: 360px; 
                  width: auto; 
                  position: absolute;
                  right: -50%;
                  transition: none;
                  cursor: pointer;
                "
              />
            </div>
            
            <!-- Кнопка перехода -->
            <button onclick="window.open('${ad.targetUrl}', '_blank')" style="
              width: 100%;
              padding: 12px;
              background: linear-gradient(45deg, #ff6b6b, #ee5a24);
              border: none;
              border-radius: 10px;
              color: white;
              font-size: 1rem;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
            " onmouseover="this.style.transform='scale(1.05)'" 
               onmouseout="this.style.transform='scale(1)'">
              🚀 ${buttonText}
            </button>
          `;
          
          // Анимация для Альфы: 1сек стоим → 6сек движение → 1сек стоим на краю
          setTimeout(() => {
            const img = document.getElementById(`alfa-image-${currentAdIndex}`);
            if (img) {
              // Через 1 секунду начинаем движение (6 секунд до края)
              img.style.transition = 'right 6s linear';
              img.style.right = '0%'; // Останавливаемся на краю, не уходим за границу
            }
          }, 1000);
        } else {
          // Обычная реклама (RoboForex, Bybit) с движением
          const imageHeight = ad.name === 'roboforex' ? '95vh' : 'auto';
          const imageMaxHeight = ad.name === 'roboforex' ? '500px' : 'none';
          
          // Проверяем если это Bybit - тоже делаем горизонтальное движение
          if (ad.name === 'bybit') {
            adContent.innerHTML = `
              <!-- Заголовок -->
              <div style="margin-bottom: 20px;">
                <h2 style="color: #00f0ff; margin-bottom: 10px; font-size: 1.5rem;">
                  📈 ${title}
                </h2>
                <p style="color: #ccc; font-size: 0.9rem; margin: 0;">
                  ${description}
                </p>
              </div>
              
              <!-- Bybit горизонтальное рекламное изображение с эффектом движения -->
              <div style="
                margin-bottom: 20px; 
                overflow: hidden; 
                border-radius: 15px; 
                height: 360px; 
                position: relative;
                cursor: pointer;
              " onclick="window.open('${ad.targetUrl}', '_blank')">
                <img 
                  id="bybit-image-${currentAdIndex}"
                  src="${ad.imageUrl}" 
                  alt="${ad.name}" 
                  style="
                    height: 360px; 
                    width: auto; 
                    position: absolute;
                    right: -50%;
                    transition: none;
                    cursor: pointer;
                  "
                />
              </div>
              
              <!-- Кнопка перехода -->
              <button onclick="window.open('${ad.targetUrl}', '_blank')" style="
                width: 100%;
                padding: 12px;
                background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
              " onmouseover="this.style.transform='scale(1.05)'" 
                 onmouseout="this.style.transform='scale(1)'">
                🚀 ${buttonText}
              </button>
            `;
            
            // Анимация для Bybit: 1сек стоим → 6сек движение справа налево → 1сек стоим на краю
            setTimeout(() => {
              const img = document.getElementById(`bybit-image-${currentAdIndex}`);
              if (img) {
                // Через 1 секунду начинаем движение (6 секунд до края)
                img.style.transition = 'right 6s linear';
                img.style.right = '0%'; // Останавливаемся на краю
              }
            }, 1000);
          } else {
            // RoboForex - статичное изображение
            adContent.innerHTML = `
              <!-- Заголовок -->
              <div style="margin-bottom: 20px;">
                <h2 style="color: #00f0ff; margin-bottom: 10px; font-size: 1.5rem;">
                  📈 ${title}
                </h2>
                <p style="color: #ccc; font-size: 0.9rem; margin: 0;">
                  ${description}
                </p>
              </div>
              
              <!-- Рекламное изображение -->
              <div style="margin-bottom: 20px;">
                <img 
                  src="${ad.imageUrl}" 
                  alt="${ad.name}" 
                  style="
                    width: 100%; 
                    height: ${imageHeight};
                    max-height: ${imageMaxHeight};
                    object-fit: ${ad.name === 'roboforex' ? 'contain' : 'cover'};
                    border-radius: 15px;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                  "
                  onclick="window.open('${ad.targetUrl}', '_blank')"
                  onmouseover="this.style.transform='scale(1.05)'"
                  onmouseout="this.style.transform='scale(1)'"
                />
              </div>
              
              <!-- Кнопка перехода -->
              <button onclick="window.open('${ad.targetUrl}', '_blank')" style="
                width: 100%;
                padding: 12px;
                background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
              " onmouseover="this.style.transform='scale(1.05)'" 
                 onmouseout="this.style.transform='scale(1)'">
                🚀 ${buttonText}
              </button>
            `;
          }
        }
      };

      // Функция переключения на следующую рекламу
      const nextAd = () => {
        currentAdIndex = (currentAdIndex + 1) % this.ads.length;
        updateAd();
        
        if (currentAdIndex < this.ads.length - 1 || this.ads.length === 1) {
          adTimer = setTimeout(nextAd, this.ads[currentAdIndex].duration * 1000);
        }
      };

      // Сборка модального окна (БЕЗ КНОПКИ ЗАКРЫТИЯ)
      container.appendChild(adContent);
      container.appendChild(progressContainer);
      modal.appendChild(container);

      // CSS анимации
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(modal);

      // Инициализация
      updateAd();
      
      // Запуск прогресса
      setTimeout(() => {
        progressBar.style.width = '100%';
        progressBar.style.transition = `width ${totalDuration}ms linear`;
      }, 100);

      // Запуск карусели
      if (this.ads.length > 1) {
        adTimer = setTimeout(nextAd, this.ads[0].duration * 1000);
      }

      // Основной таймер завершения (НАГРАДА ВСЕГДА ЗАСЧИТЫВАЕТСЯ)
      mainTimer = setTimeout(() => {
        clearTimeout(adTimer);
        document.body.removeChild(modal);
        document.head.removeChild(style);
        resolve({ 
          success: true, 
          provider: 'custom_block',
          reward: 'extra_game',
          debug: `Custom block completed - showed ${this.ads.length} ads in ${currentLanguage}`,
          timestamp: Date.now()
        });
      }, totalDuration);

      // Обработчик изменения ориентации
      const handleOrientationChange = () => {
        const isStillPortrait = window.innerHeight > window.innerWidth;
        if (!isStillPortrait) {
          clearTimeout(adTimer);
          clearTimeout(mainTimer);
          document.body.removeChild(modal);
          document.head.removeChild(style);
          resolve({
            success: false,
            provider: 'custom_block',
            error: 'Реклама прервана из-за поворота экрана',
            debug: 'Screen rotated to landscape',
            timestamp: Date.now()
          });
        }
      };

      window.addEventListener('orientationchange', handleOrientationChange);
      window.addEventListener('resize', handleOrientationChange);

      // Очистка обработчиков
      setTimeout(() => {
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('resize', handleOrientationChange);
      }, totalDuration + 1000);
    });
  }

  isAvailable(): boolean {
    const isPortrait = window.innerHeight > window.innerWidth;
    return isPortrait && this.ads.length > 0;
  }

  getProviderInfo() {
    return {
      name: 'custom_block',
      available: this.isAvailable(),
      adsCount: this.ads.length,
      language: getCurrentLanguageFromI18n(),
      debug: 'Internal ad carousel with auto language detection'
    };
  }
}

// МЕНЕДЖЕР ПРИОРИТЕТОВ
class AdPriorityManager {
  private providers: AdProvider[] = [];

  constructor() {
    // Порядок приоритетов (сверху вниз)
    this.providers = [
      new AdsgramProvider(''), // Инициализируется позже
      new YandexProvider(),
      new TelegaProvider(),
      new BitmediaProvider(),
      new PropellerAdsProvider(),
      new TelegramAdsProvider(),
      new CustomBlockProvider() // Всегда последний
    ];
  }

  async initialize(adsgramBlockId?: string): Promise<void> {
    // Инициализация Adsgram с реальным ID
    if (adsgramBlockId) {
      this.providers[0] = new AdsgramProvider(adsgramBlockId);
    }

    // Инициализируем все провайдеры
    for (const provider of this.providers) {
      try {
        await provider.initialize();
        if (process.env.NODE_ENV === 'development') console.log(`📍 Provider ${provider.name} initialized`);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.log(`❌ Provider ${provider.name} failed to initialize:`, error);
      }
    }
  }

  async getAvailableProvider(): Promise<AdProvider> {
    // Ищем первый доступный провайдер по приоритету
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        if (process.env.NODE_ENV === 'development') console.log(`✅ Using provider: ${provider.name}`);
        return provider;
      }
    }

    // Fallback - всегда возвращаем Custom Block (он всегда доступен в портретной ориентации)
    const customProvider = this.providers[this.providers.length - 1];
    if (process.env.NODE_ENV === 'development') console.log(`🔄 Fallback to: ${customProvider.name}`);
    return customProvider;
  }

  getProvidersStatus() {
    return this.providers.map(provider => ({
      name: provider.name,
      available: provider.isAvailable(),
      info: provider.getProviderInfo()
    }));
  }
}

// ГЛАВНЫЙ СЕРВИС (совместимый с существующим API)
class AdService {
  private priorityManager: AdPriorityManager;

  constructor() {
    this.priorityManager = new AdPriorityManager();
  }

  async initialize(blockId?: string): Promise<void> {
    await this.priorityManager.initialize(blockId);
    if (process.env.NODE_ENV === 'development') console.log('🎯 AdService initialized with priority system');
    if (process.env.NODE_ENV === 'development') console.log('🌍 Current language from i18next:', getCurrentLanguageFromI18n());
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    try {
      const provider = await this.priorityManager.getAvailableProvider();
      const result = await provider.showRewardedAd();
      
      if (process.env.NODE_ENV === 'development') console.log(`📺 Ad shown via ${provider.name}:`, result);
      return result;
    } catch (error) {
      console.error('❌ Error showing ad:', error);
      return {
        success: false,
        provider: 'error',
        error: 'Failed to show ad',
        timestamp: Date.now()
      };
    }
  }

  isAvailable(): boolean {
    // Проверяем, была ли инициализация (есть ли хотя бы один инициализированный провайдер)
    const providersStatus = this.priorityManager.getProvidersStatus();
    if (process.env.NODE_ENV === 'development') console.log('🔍 isAvailable() - статус провайдеров:', providersStatus);
    
    const hasInitializedProviders = providersStatus.some(p => p.info.debug && p.info.debug !== 'stub');
    if (process.env.NODE_ENV === 'development') console.log('🔍 isAvailable() - есть инициализированные провайдеры:', hasInitializedProviders);
    
    if (!hasInitializedProviders) {
      if (process.env.NODE_ENV === 'development') console.log('🔍 Провайдеры не инициализированы, нужна инициализация');
      return false;
    }
    
    // Если провайдеры инициализированы, проверяем доступность
    const result = providersStatus.some(p => p.available);
    if (process.env.NODE_ENV === 'development') console.log('🔍 isAvailable() - итоговый результат:', result);
    return result;
  }

  getProviderInfo() {
    const availableProvider = this.priorityManager.getProvidersStatus().find(p => p.available);
    return availableProvider?.info || { name: 'none', available: false };
  }

  // Дополнительный метод для отладки
  getProvidersStatus() {
    return this.priorityManager.getProvidersStatus();
  }

  // Метод для получения текущего языка из i18next
  getCurrentLanguage() {
    return getCurrentLanguageFromI18n();
  }
}

// Экспорт (тот же API что и раньше)
export const adService = new AdService();
export type { AdsgramResult, AdsgramConfig };