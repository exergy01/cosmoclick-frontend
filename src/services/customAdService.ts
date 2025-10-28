// services/customAdService.ts

export interface CustomAdData {
  title: string;
  description: string;
  buttonText: string;
  targetUrl: string;
  duration: number;
  imageUrl: string; // Добавляем обязательное поле
}

export interface AdResult {
  success: boolean;
  error?: string;
  timestamp: number;
  adData?: CustomAdData;
}

class CustomAdService {
  private isOrientationVertical(): boolean {
    return window.innerHeight > window.innerWidth;
  }

  private createMockAd(): CustomAdData {
    return {
      title: "RoboForex Trading",
      description: "Начните торговать на мировых рынках с RoboForex! Более 12,000 инструментов, спреды от 0 пипсов.",
      buttonText: "Начать торговлю",
      targetUrl: "https://my.roboforex.com/en/?a=hgtd",
      duration: 10000,
      imageUrl: "/assets/ads/5451981655788092083.jpg" // Добавляем imageUrl
    };
  }

  private createRoboForexAd(): CustomAdData {
    return {
      title: "RoboForex - Твой путь к успеху!",
      description: "Торгуй на Форекс, акциями, криптой и сырьем. Бонусы до $120! Лицензированный брокер.",
      buttonText: "Открыть счет",
      targetUrl: "https://my.roboforex.com/en/?a=hgtd",
      duration: 10000,
      imageUrl: "/assets/ads/5451981655788092083.jpg" // Добавляем imageUrl
    };
  }

  async showCustomAd(): Promise<AdResult> {
    return new Promise((resolve) => {
      // Проверяем ориентацию экрана
      if (!this.isOrientationVertical()) {
        if (process.env.NODE_ENV === 'development') console.log('📱 Горизонтальная ориентация - показываем mock рекламу');
        const adData = this.createMockAd();
        
        setTimeout(() => {
          resolve({
            success: true,
            timestamp: Date.now(),
            adData // Теперь adData содержит imageUrl
          });
        }, 3000);
        return;
      }

      // Вертикальная ориентация - показываем RoboForex
      if (process.env.NODE_ENV === 'development') console.log('📱 Вертикальная ориентация - показываем RoboForex рекламу');
      const adData = this.createRoboForexAd();

      // Создаем overlay для рекламы
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: Arial, sans-serif;
      `;

      // Контейнер рекламы
      const adContainer = document.createElement('div');
      adContainer.style.cssText = `
        max-width: 90vw;
        max-height: 90vh;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 20px;
        border: 2px solid #00f0ff;
        box-shadow: 0 0 30px rgba(0, 240, 255, 0.3);
        padding: 20px;
        text-align: center;
        position: relative;
        overflow: hidden;
      `;

      // Изображение
      const img = document.createElement('img');
      img.src = adData.imageUrl;
      img.style.cssText = `
        width: 100%;
        max-width: 300px;
        height: auto;
        border-radius: 15px;
        margin-bottom: 20px;
        box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
      `;

      // Заголовок
      const title = document.createElement('h2');
      title.textContent = adData.title;
      title.style.cssText = `
        color: #00f0ff;
        font-size: 1.8rem;
        margin: 0 0 15px 0;
        text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
      `;

      // Описание
      const description = document.createElement('p');
      description.textContent = adData.description;
      description.style.cssText = `
        color: #ccc;
        font-size: 1rem;
        line-height: 1.4;
        margin: 0 0 25px 0;
      `;

      // Кнопка
      const button = document.createElement('button');
      button.textContent = adData.buttonText;
      button.style.cssText = `
        background: linear-gradient(45deg, #00f0ff, #0080ff);
        border: none;
        color: white;
        padding: 15px 30px;
        font-size: 1.1rem;
        font-weight: bold;
        border-radius: 10px;
        cursor: pointer;
        margin: 10px;
        transition: all 0.3s ease;
        box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
      `;

      // Таймер и кнопка закрытия
      const closeButton = document.createElement('button');
      closeButton.style.cssText = `
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 0.9rem;
        display: none;
      `;

      let timeLeft = Math.floor(adData.duration / 1000);
      closeButton.textContent = timeLeft.toString();

      // Таймер
      const timer = setInterval(() => {
        timeLeft--;
        closeButton.textContent = timeLeft.toString();
        
        if (timeLeft <= 7) {
          closeButton.style.display = 'block';
          closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
        }
        
        if (timeLeft <= 0) {
          clearInterval(timer);
          closeButton.textContent = '✕';
          closeButton.style.background = 'rgba(255, 0, 0, 0.7)';
        }
      }, 1000);

      // Обработчики событий
      const handleClose = (success: boolean) => {
        clearInterval(timer);
        document.body.removeChild(overlay);
        resolve({
          success,
          error: success ? undefined : 'Реклама была закрыта',
          timestamp: Date.now(),
          adData // Теперь adData точно содержит все необходимые поля включая imageUrl
        });
      };

      button.addEventListener('click', () => {
        window.open(adData.targetUrl, '_blank');
        handleClose(true);
      });

      closeButton.addEventListener('click', () => {
        if (timeLeft <= 0 || timeLeft <= 7) {
          handleClose(true);
        }
      });

      // Собираем элементы
      adContainer.appendChild(img);
      adContainer.appendChild(title);
      adContainer.appendChild(description);
      adContainer.appendChild(button);
      adContainer.appendChild(closeButton);
      overlay.appendChild(adContainer);
      document.body.appendChild(overlay);

      // Эффекты при наведении
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.5)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.3)';
      });
    });
  }

  isAvailable(): boolean {
    return true;
  }

  getProviderInfo() {
    return {
      name: 'roboforex',
      version: '1.0.0',
      description: 'RoboForex Partner Integration'
    };
  }
}

export const customAdService = new CustomAdService();