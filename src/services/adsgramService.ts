// services/adsgramService.ts

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
  
    constructor(blockId: string) {
      this.blockId = String(blockId).replace(/^bot-/, '').trim();
    }
  
    async initialize(): Promise<boolean> {
      if (this.isInitialized) return true;
      
      if (this.isLoading) {
        await new Promise<void>(resolve => {
          const check = (): void => {
            if (this.isLoading) {
              setTimeout(check, 100);
            } else {
              resolve();
            }
          };
          check();
        });
        return this.isInitialized;
      }
  
      this.isLoading = true;
  
      try {
        // ПРИНУДИТЕЛЬНО загружаем SDK независимо от среды
        if (!window.Adsgram) {
          await this.loadAdsgramScript();
        }
  
        // Ждем дополнительное время для инициализации
        await new Promise(resolve => setTimeout(resolve, 2000));
  
        if (!window.Adsgram) {
          throw new Error('Adsgram SDK не загрузился');
        }
  
        // Тестируем что SDK работает
        try {
          const testController = window.Adsgram.init({
            blockId: this.blockId,
            debug: true
          });
          if (!testController) {
            throw new Error('Не удалось создать контроллер');
          }
        } catch (err) {
          throw new Error(`Ошибка инициализации контроллера: ${err}`);
        }
  
        this.isInitialized = true;
        return true;
  
      } catch (error) {
        this.isInitialized = false;
        return false;
      } finally {
        this.isLoading = false;
      }
    }
  
    private loadAdsgramScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        // Удаляем старые скрипты
        const oldScripts = document.querySelectorAll('script[src*="adsgram"]');
        oldScripts.forEach(script => script.remove());
  
        const script = document.createElement('script');
        script.src = 'https://sad.adsgram.ai/js/adsgram.min.js';
        script.async = true;
        
        let retryCount = 0;
        const maxRetries = 20; // Увеличили количество попыток
  
        const checkSDK = (): void => {
          if (window.Adsgram) {
            resolve();
            return;
          }
          
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(checkSDK, 500); // Уменьшили интервал
          } else {
            // Пробуем альтернативный URL
            this.loadAlternativeScript().then(resolve).catch(reject);
          }
        };
  
        script.onload = () => {
          setTimeout(checkSDK, 100);
        };
        
        script.onerror = () => {
          // Пробуем альтернативный URL при ошибке
          this.loadAlternativeScript().then(resolve).catch(reject);
        };
  
        document.head.appendChild(script);
      });
    }
  
    // Пробуем альтернативный URL
    private loadAlternativeScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sad.adsgram.ai/js/sad.min.js'; // Альтернативный URL
        script.async = true;
        
        let retryCount = 0;
        const maxRetries = 10;
  
        const checkSDK = (): void => {
          if (window.Adsgram) {
            resolve();
            return;
          }
          
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(checkSDK, 1000);
          } else {
            reject(new Error('Все попытки загрузки SDK провалились'));
          }
        };
  
        script.onload = () => {
          setTimeout(checkSDK, 500);
        };
        
        script.onerror = () => {
          reject(new Error('Альтернативный SDK тоже не загрузился'));
        };
  
        document.head.appendChild(script);
      });
    }
  
    async showRewardedAd(): Promise<AdsgramResult> {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            provider: 'adsgram',
            error: 'SDK не инициализирован',
            debug: `Block ID: ${this.blockId}`,
            timestamp: Date.now()
          };
        }
      }
  
      return new Promise((resolve) => {
        try {
          let adClosed = false;
  
          this.controller = window.Adsgram!.init({
            blockId: this.blockId,
            debug: true
          });
  
          this.controller.show().then(() => {
            if (!adClosed) {
              adClosed = true;
              resolve({
                success: true,
                provider: 'adsgram',
                reward: 'extra_game',
                debug: `Success with Block ID: ${this.blockId}`,
                timestamp: Date.now()
              });
            }
          }).catch((result) => {
            if (!adClosed) {
              adClosed = true;
              let errorMessage = 'Реклама не завершена';
              
              switch (result?.error) {
                case 'AdBlock':
                  errorMessage = 'Отключите AdBlock';
                  break;
                case 'TimeLimit':
                  errorMessage = 'Слишком часто';
                  break;
                case 'NotReady':
                  errorMessage = 'Загружается...';
                  break;
                default:
                  errorMessage = 'Попробуйте позже';
                  break;
              }
              
              resolve({
                success: false,
                provider: 'adsgram',
                error: errorMessage,
                debug: `Error: ${result?.error}, Block ID: ${this.blockId}`,
                timestamp: Date.now()
              });
            }
          });
  
          setTimeout(() => {
            if (!adClosed) {
              adClosed = true;
              resolve({
                success: false,
                provider: 'adsgram',
                error: 'Таймаут',
                debug: `Timeout with Block ID: ${this.blockId}`,
                timestamp: Date.now()
              });
            }
          }, 30000);
  
        } catch (error) {
          resolve({
            success: false,
            provider: 'adsgram',
            error: `Ошибка: ${error}`,
            debug: `Exception: ${error}, Block ID: ${this.blockId}`,
            timestamp: Date.now()
          });
        }
      });
    }
  
    isAvailable(): boolean {
      return this.isInitialized && !!window.Adsgram;
    }
  
    getProviderInfo() {
      return {
        name: 'adsgram',
        available: this.isAvailable(),
        blockId: this.blockId
      };
    }
  }
  
  class MockAdProvider {
    async initialize(): Promise<boolean> {
      return true;
    }
  
    async showRewardedAd(): Promise<AdsgramResult> {
      return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.9); display: flex; align-items: center;
          justify-content: center; z-index: 10000; color: white;
          font-family: Arial, sans-serif; text-align: center;
        `;
        
        modal.innerHTML = `
          <div style="
            background: #222; padding: 40px; border-radius: 20px; 
            border: 2px solid #00f0ff; max-width: 350px;
          ">
            <div style="font-size: 3rem; margin-bottom: 20px;">📺</div>
            <h2 style="color: #00f0ff; margin-bottom: 15px;">Тестовая реклама</h2>
            <p style="color: #ccc; margin-bottom: 20px;">Adsgram недоступен</p>
            <p style="color: #888; font-size: 0.9rem;">(в Telegram будет настоящая)</p>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
          document.body.removeChild(modal);
          resolve({ 
            success: true, 
            provider: 'mock',
            reward: 'extra_game',
            debug: 'Mock ad completed',
            timestamp: Date.now()
          });
        }, 3000);
      });
    }
  
    isAvailable(): boolean {
      return true;
    }
  
    getProviderInfo() {
      return { name: 'mock', available: true };
    }
  }
  
  class AdService {
    private adsgramService: AdsgramService | null = null;
    private mockService: MockAdProvider;
    private currentProvider: 'adsgram' | 'mock' = 'mock';
  
    constructor() {
      this.mockService = new MockAdProvider();
    }
  
    async initialize(blockId?: string): Promise<void> {
      await this.mockService.initialize();
  
      // ПРИНУДИТЕЛЬНО пытаемся инициализировать Adsgram с любым Block ID
      if (blockId && blockId.trim()) {
        this.adsgramService = new AdsgramService(blockId.trim());
        
        // Даем больше времени для инициализации
        const ready = await this.adsgramService.initialize();
        
        if (ready) {
          this.currentProvider = 'adsgram';
        } else {
          // Если не получилось, пробуем еще раз через 3 секунды
          setTimeout(async () => {
            const retryReady = await this.adsgramService!.initialize();
            if (retryReady) {
              this.currentProvider = 'adsgram';
            }
          }, 3000);
          
          this.currentProvider = 'mock';
        }
      }
    }
  
    async showRewardedAd(): Promise<AdsgramResult> {
      if (this.currentProvider === 'adsgram' && this.adsgramService) {
        const result = await this.adsgramService.showRewardedAd();
        if (!result.success) {
          return await this.mockService.showRewardedAd();
        }
        return result;
      }
      return await this.mockService.showRewardedAd();
    }
  
    isAvailable(): boolean {
      if (this.currentProvider === 'adsgram' && this.adsgramService) {
        return this.adsgramService.isAvailable();
      }
      return this.mockService.isAvailable();
    }
  
    getProviderInfo() {
      if (this.currentProvider === 'adsgram' && this.adsgramService) {
        return this.adsgramService.getProviderInfo();
      }
      return this.mockService.getProviderInfo();
    }
  }
  
  export const adService = new AdService();
  export type { AdsgramResult, AdsgramConfig };
  export {};