// services/premiumAwareAdService.ts - ЧИСТАЯ ВЕРСИЯ - ЗАМЕНИТЬ ВЕСЬ ФАЙЛ

import { adService, AdsgramResult } from './adsgramService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

interface PremiumStatus {
  hasPremium: boolean;
  type?: 'forever' | 'temporary';
  daysLeft?: number;
  reason: string;
}

interface PremiumAdResult extends AdsgramResult {
  premium?: PremiumStatus;
  skipped?: boolean;
}

class PremiumAwareAdService {
  private telegramId: string | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private statusCheckPromise: Promise<PremiumStatus> | null = null;

  // Устанавливаем ID игрока
  setTelegramId(telegramId: string) {
    this.telegramId = telegramId;
  }

  // 🚀 ПРОВЕРКА ПРЕМИУМ СТАТУСА БЕЗ КЕША
  private async checkPremiumStatus(): Promise<PremiumStatus> {
    if (!this.telegramId) {
      return { hasPremium: false, reason: 'No telegram ID provided' };
    }

    // 🔒 Если уже идет запрос статуса - ждем его завершения
    if (this.statusCheckPromise) {
      return await this.statusCheckPromise;
    }

    // 🎯 СОЗДАЕМ ЗАЩИЩЕННЫЙ ПРОМИС
    this.statusCheckPromise = this._performStatusCheck();
    
    try {
      const result = await this.statusCheckPromise;
      return result;
    } finally {
      this.statusCheckPromise = null; // Освобождаем промис
    }
  }

  // 🔒 ВНУТРЕННИЙ МЕТОД ПРОВЕРКИ СТАТУСА
  private async _performStatusCheck(): Promise<PremiumStatus> {
    try {
      const response = await axios.get(`${API_URL}/api/adsgram/check-ad-block/${this.telegramId}`, {
        timeout: 8000,
      });
      
      if (response.data.success) {
        const premiumData: PremiumStatus = response.data.premium || { 
          hasPremium: false, 
          reason: 'No premium data received' 
        };
        
        return premiumData;
      } else {
        throw new Error(response.data.error || 'Failed to check premium status');
      }
      
    } catch (err: any) {
      // 🎯 В случае ошибки возвращаем безопасное значение (БЕЗ премиума)
      const fallbackStatus: PremiumStatus = { 
        hasPremium: false, 
        reason: 'Error checking premium status' 
      };
      
      return fallbackStatus;
    }
  }

  // 🎯 ИНИЦИАЛИЗАЦИЯ БЕЗ ДУБЛИРОВАНИЯ
  async initialize(blockId?: string): Promise<void> {
    // Если уже идет инициализация - ждем ее завершения
    if (this.initializationPromise) {
      return await this.initializationPromise;
    }

    // Если уже инициализирован - не делаем ничего
    if (this.isInitialized) {
      return;
    }
    
    this.initializationPromise = this._performInitialization(blockId);
    
    try {
      await this.initializationPromise;
      this.isInitialized = true;
    } catch (err) {
      throw err;
    } finally {
      this.initializationPromise = null;
    }
  }

  // 🔒 ВНУТРЕННИЙ МЕТОД ИНИЦИАЛИЗАЦИИ
  private async _performInitialization(blockId?: string): Promise<void> {
    // Инициализируем базовый адный сервис
    await adService.initialize(blockId);
  }

  // 🎯 ГЛАВНЫЙ МЕТОД - ВСЕГДА СВЕЖИЕ ДАННЫЕ
  async showRewardedAd(): Promise<PremiumAdResult> {
    // 🚀 ВСЕГДА ПОЛУЧАЕМ СВЕЖИЙ СТАТУС ПРЕМИУМА
    const premiumStatus = await this.checkPremiumStatus();

    if (premiumStatus.hasPremium) {
      // Возвращаем успешный результат без показа рекламы
      return {
        success: true,
        provider: 'premium_skip',
        reward: 'premium_bonus',
        premium: premiumStatus,
        skipped: true,
        timestamp: Date.now()
      };
    }

    // 🎯 ПОКАЗЫВАЕМ РЕКЛАМУ
    const adResult = await adService.showRewardedAd();

    return {
      ...adResult,
      premium: premiumStatus,
      skipped: false
    };
  }

  // 🎯 АЛИАС ДЛЯ СОВМЕСТИМОСТИ
  async showAd(): Promise<PremiumAdResult> {
    return this.showRewardedAd();
  }

  // 🎯 БЫСТРАЯ ПРОВЕРКА ДОСТУПНОСТИ
  async isAvailable(): Promise<boolean> {
    // 🚀 ПРОВЕРЯЕМ ПРЕМИУМ СТАТУС В РЕАЛЬНОМ ВРЕМЕНИ
    try {
      const premiumStatus = await this.checkPremiumStatus();
      
      if (premiumStatus.hasPremium) {
        return true;
      }
    } catch (err) {
      // Тихо обрабатываем ошибку
    }
    
    // Если нет премиума, проверяем обычные рекламные сервисы
    const isAdServiceAvailable = adService.isAvailable();
    
    return isAdServiceAvailable;
  }

  // 🎯 ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ПРОВАЙДЕРЕ
  async getProviderInfo() {
    try {
      const premiumStatus = await this.checkPremiumStatus();
      
      if (premiumStatus.hasPremium) {
        return {
          name: 'premium',
          type: premiumStatus.type,
          daysLeft: premiumStatus.daysLeft,
          available: true,
          description: 'Premium user - ads disabled'
        };
      }
    } catch (err) {
      // Тихо обрабатываем ошибку
    }
    
    return adService.getProviderInfo();
  }

  // 🔥 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ = ОБЫЧНАЯ ПРОВЕРКА (БЕЗ КЕША)
  async refreshPremiumStatus(): Promise<PremiumStatus> {
    return await this.checkPremiumStatus();
  }

  // 🎯 ПОЛУЧЕНИЕ ПОСЛЕДНЕГО СТАТУСА (всегда null без кеша)
  getCurrentPremiumStatus(): PremiumStatus | null {
    // БЕЗ КЕША - возвращаем null
    return null;
  }

  // 🆕 ПРОВЕРКА НУЖНОСТИ ОБНОВЛЕНИЯ (всегда true без кеша)
  shouldRefreshStatus(): boolean {
    return true;
  }

  // 🆕 ФОНОВОЕ ОБНОВЛЕНИЕ НЕ НУЖНО БЕЗ КЕША
  backgroundRefresh(): void {
    // Ничего не делаем
  }

  // 🆕 СБРОС СОСТОЯНИЯ
  reset(): void {
    this.statusCheckPromise = null;
  }

  // 🆕 ДИАГНОСТИКА СОСТОЯНИЯ СЕРВИСА (только для отладки)
  getDebugInfo() {
    return {
      telegramId: this.telegramId,
      isInitialized: this.isInitialized,
      hasActiveRequest: !!this.statusCheckPromise,
      cacheStrategy: 'NO_CACHE'
    };
  }
}

// Создаем глобальный экземпляр
export const premiumAdService = new PremiumAwareAdService();

// Экспортируем типы
export type { PremiumStatus, PremiumAdResult };