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

// ЗАКОММЕНТИРОВАННЫЙ Adsgram сервис (для будущего)
/*
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
    // ... весь код Adsgram закомментирован
    return false;
  }

  // ... остальные методы закомментированы
}
*/

// RoboForex рекламный провайдер
class RoboForexAdProvider {
  private name = 'roboforex';

  async initialize(): Promise<boolean> {
    console.log('🎯✅ RoboForex Ad Provider initialized');
    return true;
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    console.log('🎯 Showing RoboForex ad');
    
    return new Promise(resolve => {
      // Проверяем ориентацию экрана
      const isPortrait = window.innerHeight > window.innerWidth;
      
      if (!isPortrait) {
        // В горизонтальной ориентации не показываем рекламу
        resolve({
          success: false,
          provider: 'roboforex',
          error: 'Please rotate your screen to portrait mode to view ads',
          debug: 'Landscape orientation detected',
          timestamp: Date.now()
        });
        return;
      }

      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.95); display: flex; align-items: center;
        justify-content: center; z-index: 10000; color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center; backdrop-filter: blur(10px);
        padding: 20px; box-sizing: border-box;
      `;
      
      let countdown = 10; // 10 секунд
      const adImagePath = '/assets/ads/5451981655788092083.jpg';
      const partnerLink = 'https://my.roboforex.com/en/?a=hgtd';
      
      modal.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #1a1a2e, #16213e); 
          padding: 30px; 
          border-radius: 25px; 
          border: 3px solid #00f0ff;
          box-shadow: 0 0 30px rgba(0,240,255,0.5);
          max-width: 400px;
          width: 100%;
          animation: slideIn 0.3s ease-out;
          position: relative;
        ">
          <!-- Кнопка закрытия (появится через 3 секунды) -->
          <button id="closeBtn" style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 20px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            display: none;
          ">×</button>
          
          <!-- Заголовок -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: #00f0ff; margin-bottom: 10px; font-size: 1.5rem;">
              📈 Partner Advertisement
            </h2>
            <p style="color: #ccc; font-size: 0.9rem; margin: 0;">
              Earn with RoboForex
            </p>
          </div>
          
          <!-- Рекламное изображение -->
          <div style="margin-bottom: 20px;">
            <img 
              src="${adImagePath}" 
              alt="RoboForex" 
              style="
                width: 100%; 
                height: auto; 
                border-radius: 15px;
                cursor: pointer;
                transition: transform 0.3s ease;
              "
              onclick="window.open('${partnerLink}', '_blank')"
              onmouseover="this.style.transform='scale(1.05)'"
              onmouseout="this.style.transform='scale(1)'"
            />
          </div>
          
          <!-- Счетчик времени -->
          <div style="
            background: rgba(0,0,0,0.3); 
            padding: 15px; 
            border-radius: 15px; 
            border: 1px solid #00f0ff50;
            margin-bottom: 20px;
          ">
            <div id="robo-countdown" style="
              font-size: 2rem; 
              color: #00f0ff; 
              font-weight: bold;
              text-shadow: 0 0 10px #00f0ff;
            ">${countdown}</div>
            <div style="color: #888; font-size: 0.9rem; margin-top: 5px;">
              seconds to get reward
            </div>
          </div>
          
          <!-- Прогресс бар -->
          <div style="
            width: 100%; 
            height: 6px; 
            background: rgba(255,255,255,0.1); 
            border-radius: 3px; 
            overflow: hidden;
            margin-bottom: 15px;
          ">
            <div id="robo-progress" style="
              height: 100%; 
              background: linear-gradient(90deg, #00f0ff, #0080ff); 
              width: 0%; 
              transition: width 1s linear;
              box-shadow: 0 0 10px #00f0ff;
            "></div>
          </div>
          
          <!-- Кнопка перехода -->
          <button onclick="window.open('${partnerLink}', '_blank')" style="
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
            🚀 Open RoboForex
          </button>
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
      const progressBar = document.getElementById('robo-progress');
      if (progressBar) {
        setTimeout(() => {
          progressBar.style.width = '100%';
        }, 100);
      }
      
      // Показать кнопку закрытия через 3 секунды
      setTimeout(() => {
        const closeBtn = document.getElementById('closeBtn');
        if (closeBtn) {
          closeBtn.style.display = 'block';
          closeBtn.onclick = () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
            resolve({ 
              success: true, 
              provider: 'roboforex',
              reward: 'extra_game',
              debug: 'Ad closed early but reward given',
              timestamp: Date.now()
            });
          };
        }
      }, 3000);
      
      // Основной таймер
      const timer = setInterval(() => {
        countdown--;
        const countdownEl = document.getElementById('robo-countdown');
        if (countdownEl) {
          countdownEl.textContent = countdown.toString();
          if (countdown <= 3) {
            countdownEl.style.color = countdown <= 1 ? '#4CAF50' : '#ffd93d';
          }
        }
        
        if (countdown <= 0) {
          clearInterval(timer);
          document.body.removeChild(modal);
          document.head.removeChild(style);
          resolve({ 
            success: true, 
            provider: 'roboforex',
            reward: 'extra_game',
            debug: 'RoboForex ad completed successfully',
            timestamp: Date.now()
          });
        }
      }, 1000);

      // Обработчик изменения ориентации
      const handleOrientationChange = () => {
        const isStillPortrait = window.innerHeight > window.innerWidth;
        if (!isStillPortrait) {
          // Пользователь повернул экран в горизонтальное положение
          clearInterval(timer);
          document.body.removeChild(modal);
          document.head.removeChild(style);
          resolve({
            success: false,
            provider: 'roboforex',
            error: 'Реклама прервана из-за поворота экрана',
            debug: 'Screen rotated to landscape',
            timestamp: Date.now()
          });
        }
      };

      window.addEventListener('orientationchange', handleOrientationChange);
      window.addEventListener('resize', handleOrientationChange);

      // Очистка обработчиков через 11 секунд
      setTimeout(() => {
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('resize', handleOrientationChange);
      }, 11000);
    });
  }

  isAvailable(): boolean {
    // Проверяем ориентацию экрана
    const isPortrait = window.innerHeight > window.innerWidth;
    return isPortrait;
  }

  getProviderInfo() {
    return {
      name: 'roboforex',
      available: this.isAvailable(),
      debug: 'Partner ad provider'
    };
  }
}

// Mock провайдер (fallback)
class MockAdProvider {
  async initialize(): Promise<boolean> {
    console.log('🎯✅ Mock Ad Provider initialized as fallback');
    return true;
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    console.log('🎯 Showing Mock ad (fallback)');
    
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
          <h2 style="color: #00f0ff; margin-bottom: 15px;">Test Advertisement</h2>
          <p style="color: #ccc; margin-bottom: 20px;">Ad service unavailable</p>
          <p style="color: #888; font-size: 0.9rem;">(future ads will be here)</p>
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

// Главный сервис
class AdService {
  // private adsgramService: AdsgramService | null = null; // ЗАКОММЕНТИРОВАНО
  private roboforexService: RoboForexAdProvider;
  private mockService: MockAdProvider;
  private currentProvider: 'roboforex' | 'mock' = 'roboforex';

  constructor() {
    this.roboforexService = new RoboForexAdProvider();
    this.mockService = new MockAdProvider();
  }

  async initialize(blockId?: string): Promise<void> {
    await this.roboforexService.initialize();
    await this.mockService.initialize();

    // Определяем провайдера по ориентации экрана
    this.currentProvider = this.roboforexService.isAvailable() ? 'roboforex' : 'mock';

    // ЗАКОММЕНТИРОВАННЫЙ код Adsgram
    /*
    if (blockId && blockId.trim()) {
      this.adsgramService = new AdsgramService(blockId.trim());
      const ready = await this.adsgramService.initialize();
      this.currentProvider = ready ? 'adsgram' : 'roboforex';
    }
    */
  }

  async showRewardedAd(): Promise<AdsgramResult> {
    // Проверяем ориентацию перед показом
    const isPortrait = window.innerHeight > window.innerWidth;
    
    if (isPortrait && this.roboforexService.isAvailable()) {
      const result = await this.roboforexService.showRewardedAd();
      return result;
    }

    // Fallback на Mock
    return await this.mockService.showRewardedAd();
  }

  isAvailable(): boolean {
    if (this.currentProvider === 'roboforex') {
      return this.roboforexService.isAvailable();
    }
    return this.mockService.isAvailable();
  }

  getProviderInfo() {
    if (this.currentProvider === 'roboforex' && this.roboforexService.isAvailable()) {
      return this.roboforexService.getProviderInfo();
    }
    return this.mockService.getProviderInfo();
  }
}

export const adService = new AdService();
export type { AdsgramResult, AdsgramConfig };
export {};