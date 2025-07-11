// services/adsgramService.ts

interface AdsgramController {
    show(): Promise<void>;
  }
  
  interface AdsgramConfig {
    blockId: string;
    onReward?: () => void;
    onError?: (error: any) => void;
    onClose?: () => void;
  }
  
  interface AdsgramResult {
    success: boolean;
    provider: string;
    reward?: string;
    error?: string;
    timestamp: number;
    debug?: string;
  }
  
  declare global {
    interface Window {
      Adsgram?: {
        init: (config: AdsgramConfig) => AdsgramController;
      };
    }
  }
  
  class AdsgramService {
    private blockId: string;
    private controller: AdsgramController | null = null;
    private isInitialized = false;
    private isLoading = false;
    private initAttempts = 0;
    private maxAttempts = 3;
  
    constructor(blockId: string) {
      this.blockId = blockId;
      console.log('🎯 AdsgramService created with Block ID:', blockId);
    }
  
    // Инициализация Adsgram SDK с множественными попытками
    async initialize(): Promise<boolean> {
      if (this.isInitialized) {
        console.log('🎯 Adsgram already initialized');
        return true;
      }
  
      if (this.isLoading) {
        console.log('🎯 Adsgram initialization in progress, waiting...');
        return new Promise((resolve) => {
          const checkInit = () => {
            if (!this.isLoading) {
              resolve(this.isInitialized);
            } else {
              setTimeout(checkInit, 200);
            }
          };
          checkInit();
        });
      }
  
      this.isLoading = true;
      this.initAttempts++;
  
      console.log(`🎯 Starting Adsgram initialization attempt ${this.initAttempts}/${this.maxAttempts}`);
  
      try {
        // Проверяем среду выполнения
                const isInTelegram = !!(window as any).Telegram?.WebApp;
        const isLocalhost = window.location.hostname === 'localhost';
        
        console.log('🎯 Environment check:', {
          isInTelegram: !!isInTelegram,
          isLocalhost,
          hostname: window.location.hostname,
          protocol: window.location.protocol
        });
  
        // В среде разработки пропускаем реальный Adsgram
        if (isLocalhost && !isInTelegram) {
          console.log('🎯⚠️ Development environment detected, will use Mock ads');
          this.isInitialized = false;
          return false;
        }
  
        // Загружаем Adsgram SDK если еще не загружен
        if (!window.Adsgram) {
          console.log('🎯 Loading Adsgram SDK...');
          await this.loadAdsgramScript();
        }
  
        // Проверяем что SDK загрузился
        if (!window.Adsgram) {
          throw new Error('Adsgram SDK не загрузился после скрипта');
        }
  
        // Проверяем что метод init доступен
        if (typeof window.Adsgram.init !== 'function') {
          throw new Error('Adsgram.init не является функцией');
        }
  
        console.log('🎯✅ Adsgram SDK loaded successfully');
        this.isInitialized = true;
        return true;
  
      } catch (error) {
        console.error(`🎯❌ Adsgram initialization failed (attempt ${this.initAttempts}):`, error);
        
        // Повторная попытка если не превышен лимит
        if (this.initAttempts < this.maxAttempts) {
          console.log(`🎯 Retrying in 2 seconds... (${this.initAttempts}/${this.maxAttempts})`);
          this.isLoading = false;
          await new Promise(resolve => setTimeout(resolve, 2000));
          return await this.initialize();
        }
        
        console.log('🎯❌ All Adsgram initialization attempts failed, will use Mock');
        this.isInitialized = false;
        return false;
      } finally {
        this.isLoading = false;
      }
    }
  
    // Загрузка скрипта Adsgram с таймаутом
    private loadAdsgramScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        // Проверяем что скрипт еще не загружен
        const existingScript = document.querySelector('script[src*="sad.min.js"]');
        if (existingScript) {
          console.log('🎯 Adsgram script already exists');
          resolve();
          return;
        }
  
        console.log('🎯 Creating Adsgram script tag...');
        const script = document.createElement('script');
        script.src = 'https://sad.adsgram.ai/js/sad.min.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        // Таймаут для загрузки скрипта
        const timeout = setTimeout(() => {
          console.error('🎯❌ Adsgram script load timeout');
          reject(new Error('Таймаут загрузки Adsgram SDK'));
        }, 10000);
  
        script.onload = () => {
          console.log('🎯✅ Adsgram script loaded from CDN');
          clearTimeout(timeout);
          // Даем время SDK инициализироваться
          setTimeout(resolve, 500);
        };
        
        script.onerror = (error) => {
          console.error('🎯❌ Adsgram script load error:', error);
          clearTimeout(timeout);
          reject(new Error('Не удалось загрузить Adsgram SDK'));
        };
  
        document.head.appendChild(script);
        console.log('🎯 Adsgram script added to DOM');
      });
    }
  
    // Показ rewarded рекламы
    async showRewardedAd(): Promise<AdsgramResult> {
      console.log('🎯 Attempting to show Adsgram rewarded ad');
  
      if (!this.isInitialized) {
        console.log('🎯 Adsgram not initialized, trying to initialize...');
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            provider: 'adsgram',
            error: 'SDK не инициализирован после попыток загрузки',
            debug: `Attempts: ${this.initAttempts}, Block ID: ${this.blockId}`,
            timestamp: Date.now()
          };
        }
      }
  
      return new Promise((resolve) => {
        try {
          let rewardReceived = false;
          let adClosed = false;
          const startTime = Date.now();
  
          console.log('🎯 Creating Adsgram controller with Block ID:', this.blockId);
          console.log('🎯 Block ID type:', typeof this.blockId, 'length:', this.blockId.length);
  
          // Создаем контроллер рекламы
          this.controller = window.Adsgram!.init({
            blockId: this.blockId,
            onReward: () => {
              console.log('🎯✅ Adsgram reward received');
              rewardReceived = true;
            },
            onError: (error: any) => {
              console.error('🎯❌ Adsgram ad error:', error);
              if (!adClosed) {
                adClosed = true;
                resolve({
                  success: false,
                  provider: 'adsgram',
                  error: `Ошибка показа рекламы: ${error}`,
                  debug: `Block ID: ${this.blockId}, Time: ${Date.now() - startTime}ms`,
                  timestamp: Date.now()
                });
              }
            },
            onClose: () => {
              console.log('🎯 Adsgram ad closed, reward received:', rewardReceived);
              if (!adClosed) {
                adClosed = true;
                resolve({
                  success: rewardReceived,
                  provider: 'adsgram',
                  reward: rewardReceived ? 'extra_game' : undefined,
                  error: rewardReceived ? undefined : 'Реклама была закрыта до завершения',
                  debug: `Block ID: ${this.blockId}, Duration: ${Date.now() - startTime}ms`,
                  timestamp: Date.now()
                });
              }
            }
          });
  
          console.log('🎯 Adsgram controller created, showing ad...');
  
          // Показываем рекламу
          this.controller.show().catch((error: any) => {
            console.error('🎯❌ Failed to show Adsgram ad:', error);
            if (!adClosed) {
              adClosed = true;
              resolve({
                success: false,
                provider: 'adsgram',
                error: `Не удалось показать рекламу: ${error}`,
                debug: `Block ID: ${this.blockId}, Show error`,
                timestamp: Date.now()
              });
            }
          });
  
          // Таймаут для показа рекламы
          setTimeout(() => {
            if (!adClosed) {
              console.error('🎯❌ Adsgram ad show timeout');
              adClosed = true;
              resolve({
                success: false,
                provider: 'adsgram',
                error: 'Таймаут показа рекламы',
                debug: `Block ID: ${this.blockId}, Timeout: 30s`,
                timestamp: Date.now()
              });
            }
          }, 30000);
  
        } catch (error) {
          console.error('🎯❌ Adsgram show ad critical error:', error);
          resolve({
            success: false,
            provider: 'adsgram',
            error: `Критическая ошибка: ${error}`,
            debug: `Block ID: ${this.blockId}, Critical error`,
            timestamp: Date.now()
          });
        }
      });
    }
  
    // Проверка доступности рекламы
    isAvailable(): boolean {
      const available = this.isInitialized && !!window.Adsgram;
      console.log('🎯 Adsgram availability check:', {
        isInitialized: this.isInitialized,
        hasWindow: !!window.Adsgram,
        available
      });
      return available;
    }
  
    // Получение информации о провайдере
    getProviderInfo() {
      return {
        name: 'adsgram',
        available: this.isAvailable(),
        blockId: this.blockId,
        attempts: this.initAttempts,
        isLoading: this.isLoading
      };
    }
  }
  
  // Улучшенный Mock провайдер
  class MockAdProvider {
    private name = 'mock';
  
    async initialize(): Promise<boolean> {
      console.log('🎯✅ Mock Ad Provider initialized as fallback');
      return true;
    }
  
    async showRewardedAd(): Promise<AdsgramResult> {
      console.log('🎯 Showing Mock ad (Adsgram not available)');
      
      return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.95); display: flex; align-items: center;
          justify-content: center; z-index: 10000; color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center; backdrop-filter: blur(10px);
        `;
        
        let countdown = 5;
        modal.innerHTML = `
          <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e); 
            padding: 50px; 
            border-radius: 25px; 
            border: 3px solid #00f0ff;
            box-shadow: 0 0 30px rgba(0,240,255,0.5);
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
          ">
            <div style="font-size: 3rem; margin-bottom: 20px;">📺</div>
            <h2 style="color: #00f0ff; margin-bottom: 15px; font-size: 1.5rem;">
              Тестовая реклама
            </h2>
            <p style="font-size: 1rem; margin-bottom: 10px; color: #ccc;">
              Adsgram недоступен
            </p>
            <p style="font-size: 0.9rem; margin-bottom: 25px; color: #888;">
              (в реальном Telegram будет настоящая реклама)
            </p>
            <div style="
              background: rgba(0,0,0,0.3); 
              padding: 15px; 
              border-radius: 15px; 
              border: 1px solid #00f0ff50;
              margin-bottom: 20px;
            ">
              <div id="mock-countdown" style="
                font-size: 2.5rem; 
                color: #00f0ff; 
                font-weight: bold;
                text-shadow: 0 0 10px #00f0ff;
              ">${countdown}</div>
              <div style="color: #888; font-size: 0.9rem; margin-top: 5px;">
                секунд до завершения
              </div>
            </div>
            <div style="
              width: 100%; 
              height: 6px; 
              background: rgba(255,255,255,0.1); 
              border-radius: 3px; 
              overflow: hidden;
            ">
              <div id="mock-progress" style="
                height: 100%; 
                background: linear-gradient(90deg, #00f0ff, #0080ff); 
                width: 0%; 
                transition: width 1s linear;
                box-shadow: 0 0 10px #00f0ff;
              "></div>
            </div>
          </div>
        `;
        
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
        
        // Запуск прогресса
        const progressBar = document.getElementById('mock-progress');
        if (progressBar) {
          setTimeout(() => {
            progressBar.style.width = '100%';
          }, 100);
        }
        
        const timer = setInterval(() => {
          countdown--;
          const countdownEl = document.getElementById('mock-countdown');
          if (countdownEl) {
            countdownEl.textContent = countdown.toString();
            if (countdown <= 2) {
              countdownEl.style.color = countdown <= 1 ? '#ff6b6b' : '#ffd93d';
            }
          }
          
          if (countdown <= 0) {
            clearInterval(timer);
            document.body.removeChild(modal);
            document.head.removeChild(style);
            resolve({ 
              success: true, 
              provider: 'mock',
              reward: 'extra_game',
              debug: 'Mock ad completed successfully',
              timestamp: Date.now()
            });
          }
        }, 1000);
      });
    }
  
    isAvailable(): boolean {
      return true; // Mock всегда доступен
    }
  
    getProviderInfo() {
      return {
        name: 'mock',
        available: true,
        debug: 'Fallback provider'
      };
    }
  }
  
  // Главный сервис управления рекламой
  class AdService {
    private adsgramService: AdsgramService | null = null;
    private mockService: MockAdProvider;
    private currentProvider: 'adsgram' | 'mock' = 'mock';
    private isInitialized = false;
  
    constructor() {
      this.mockService = new MockAdProvider();
      console.log('🎯 AdService created');
    }
  
    // Инициализация с Block ID от Adsgram
    async initialize(blockId?: string): Promise<void> {
      if (this.isInitialized) {
        console.log('🎯 AdService already initialized');
        return;
      }
  
      console.log('🎯 Initializing AdService with Block ID:', blockId);
  
      // Всегда инициализируем Mock как fallback
      await this.mockService.initialize();
  
      if (blockId && blockId.trim()) {
        console.log('🎯 Attempting Adsgram initialization...');
        this.adsgramService = new AdsgramService(blockId.trim());
        const adsgramReady = await this.adsgramService.initialize();
        
        if (adsgramReady) {
          this.currentProvider = 'adsgram';
          console.log('🎯✅ Primary provider: Adsgram');
        } else {
          console.log('🎯⚠️ Fallback to Mock provider');
          this.currentProvider = 'mock';
        }
      } else {
        console.log('🎯⚠️ No valid Block ID, using Mock provider');
        this.currentProvider = 'mock';
      }
  
      this.isInitialized = true;
      const providerInfo = this.getProviderInfo();
      console.log('🎯✅ AdService initialized:', providerInfo);
    }
  
    // Показ rewarded рекламы
    async showRewardedAd(): Promise<AdsgramResult> {
      if (!this.isInitialized) {
        return {
          success: false,
          provider: 'none',
          error: 'AdService не инициализирован',
          timestamp: Date.now()
        };
      }
  
      console.log(`🎯 Showing ${this.currentProvider} rewarded ad`);
  
      if (this.currentProvider === 'adsgram' && this.adsgramService) {
        const result = await this.adsgramService.showRewardedAd();
        
        // Если Adsgram не сработал, пробуем Mock
        if (!result.success && this.mockService.isAvailable()) {
          console.log('🎯 Adsgram failed, using Mock fallback');
          return await this.mockService.showRewardedAd();
        }
        
        return result;
      }
  
      // Используем Mock
      return await this.mockService.showRewardedAd();
    }
  
    // Проверка доступности рекламы
    isAvailable(): boolean {
      if (!this.isInitialized) {
        console.log('🎯 AdService not initialized yet');
        return false;
      }
  
      if (this.currentProvider === 'adsgram' && this.adsgramService) {
        return this.adsgramService.isAvailable();
      }
      return this.mockService.isAvailable();
    }
  
    // Информация о текущем провайдере
    getProviderInfo() {
      const baseInfo = {
        initialized: this.isInitialized,
        currentProvider: this.currentProvider
      };
  
      if (this.currentProvider === 'adsgram' && this.adsgramService) {
        return { ...baseInfo, ...this.adsgramService.getProviderInfo() };
      }
      return { ...baseInfo, ...this.mockService.getProviderInfo() };
    }
  }
  
  // Экспортируем singleton
  export const adService = new AdService();
  
  // Экспорт типов
  export type { AdsgramResult, AdsgramConfig };
  
  // Фикс для TypeScript isolatedModules
  export {};