// services/premiumAwareAdService.ts - БЕЗ КЕША - ЗАМЕНИТЬ ВЕСЬ ФАЙЛ

import { adService, AdsgramResult } from './adsgramService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

  constructor() {
    console.log('👑 PremiumAwareAdService initialized (NO CACHE)');
  }

  // Устанавливаем ID игрока
  setTelegramId(telegramId: string) {
    this.telegramId = telegramId;
    console.log(`👑 Telegram ID set to: ${telegramId}`);
  }

  // 🚀 ПРОВЕРКА ПРЕМИУМ СТАТУСА БЕЗ КЕША - ВСЕГДА СВЕЖИЕ ДАННЫЕ
  private async checkPremiumStatus(): Promise<PremiumStatus> {
    if (!this.telegramId) {
      return { hasPremium: false, reason: 'No telegram ID provided' };
    }

    // 🔒 Если уже идет запрос статуса - ждем его завершения
    if (this.statusCheckPromise) {
      console.log('👑 Status check already in progress, waiting...');
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
      console.log(`👑 Checking premium status for ${this.telegramId} (NO CACHE)...`);
      
      const response = await axios.get(`${API_URL}/api/adsgram/check-ad-block/${this.telegramId}`, {
        timeout: 8000, // 🎯 ТАЙМАУТ 8 СЕКУНД для быстроты
      });
      
      if (response.data.success) {
        const premiumData: PremiumStatus = response.data.premium || { 
          hasPremium: false, 
          reason: 'No premium data received' 
        };
        
        console.log(`👑 Fresh premium status:`, premiumData);
        return premiumData;
      } else {
        throw new Error(response.data.error || 'Failed to check premium status');
      }
      
    } catch (err: any) {
      console.error('👑 Error checking premium status:', err.message);
      
      // 🎯 В случае ошибки возвращаем безопасное значение (БЕЗ премиума)
      const fallbackStatus: PremiumStatus = { 
        hasPremium: false, 
        reason: 'Error checking premium status - fallback to no premium' 
      };
      
      return fallbackStatus;
    }
  }

  // 🎯 ОПТИМИЗИРОВАННАЯ ИНИЦИАЛИЗАЦИЯ БЕЗ ДУБЛИРОВАНИЯ
  async initialize(blockId?: string): Promise<void> {
    // Если уже идет инициализация - ждем ее завершения
    if (this.initializationPromise) {
      console.log('👑 Initialization already in progress, waiting...');
      return await this.initializationPromise;
    }

    // Если уже инициализирован - не делаем ничего
    if (this.isInitialized) {
      console.log('👑 Service already initialized');
      return;
    }

    console.log('👑 Starting service initialization...');
    
    this.initializationPromise = this._performInitialization(blockId);
    
    try {
      await this.initializationPromise;
      this.isInitialized = true;
      console.log('👑 Service initialization completed');
    } catch (err) {
      console.error('👑 Service initialization failed:', err);
      throw err;
    } finally {
      this.initializationPromise = null;
    }
  }

  // 🔒 ВНУТРЕННИЙ МЕТОД ИНИЦИАЛИЗАЦИИ
  private async _performInitialization(blockId?: string): Promise<void> {
    // Инициализируем базовый адный сервис
    await adService.initialize(blockId);
    
    console.log('👑 Premium-aware ad service initialized (NO STATUS CHECK)');
  }

  // 🎯 ГЛАВНЫЙ МЕТОД - ВСЕГДА СВЕЖИЕ ДАННЫЕ
  async showRewardedAd(): Promise<PremiumAdResult> {
    console.log('👑 Attempting to show rewarded ad (checking fresh status)...');

    // 🚀 ВСЕГДА ПОЛУЧАЕМ СВЕЖИЙ СТАТУС ПРЕМИУМА
    const premiumStatus = await this.checkPremiumStatus();
    
    if (premiumStatus.hasPremium) {
      console.log('👑 User has premium - skipping ad');
      
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

    console.log('👑 User does not have premium - showing ad');
    
    // 🎯 ПОКАЗЫВАЕМ РЕКЛАМУ
    const adResult = await adService.showRewardedAd();
    
    return {
      ...adResult,
      premium: premiumStatus,
      skipped: false
    };
  }

  // 🎯 БЫСТРАЯ ПРОВЕРКА ДОСТУПНОСТИ
  async isAvailable(): Promise<boolean> {
    // 🚀 ПРОВЕРЯЕМ ПРЕМИУМ СТАТУС В РЕАЛЬНОМ ВРЕМЕНИ
    try {
      const premiumStatus = await this.checkPremiumStatus();
      
      if (premiumStatus.hasPremium) {
        console.log('👑 Ad service available (premium user - auto reward)');
        return true;
      }
    } catch (err) {
      console.log('👑 Premium check failed, falling back to ad service check');
    }
    
    // Если нет премиума, проверяем обычные рекламные сервисы
    const isAdServiceAvailable = adService.isAvailable();
    console.log(`👑 Ad service available (regular user): ${isAdServiceAvailable}`);
    
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
      console.log('👑 Premium check failed for provider info');
    }
    
    return adService.getProviderInfo();
  }

  // 🔥 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ = ОБЫЧНАЯ ПРОВЕРКА (БЕЗ КЕША)
  async refreshPremiumStatus(): Promise<PremiumStatus> {
    console.log('👑 Refreshing premium status (same as regular check - no cache)...');
    return await this.checkPremiumStatus();
  }

  // 🎯 ПОЛУЧЕНИЕ ПОСЛЕДНЕГО СТАТУСА (если есть активная проверка)
  getCurrentPremiumStatus(): PremiumStatus | null {
    // БЕЗ КЕША - возвращаем null, заставляя делать свежий запрос
    console.log('👑 No cached status - use refreshPremiumStatus() for fresh data');
    return null;
  }

  // 🆕 ПРОВЕРКА НУЖНОСТИ ОБНОВЛЕНИЯ (всегда true без кеша)
  shouldRefreshStatus(): boolean {
    return true; // Всегда нужно обновлять без кеша
  }

  // 🆕 ФОНОВОЕ ОБНОВЛЕНИЕ НЕ НУЖНО БЕЗ КЕША
  backgroundRefresh(): void {
    console.log('👑 Background refresh not needed without cache');
  }

  // 🆕 СБРОС СОСТОЯНИЯ
  reset(): void {
    console.log('👑 Resetting premium service state');
    this.statusCheckPromise = null;
  }

  // 🆕 ДИАГНОСТИКА СОСТОЯНИЯ СЕРВИСА
  getDebugInfo() {
    return {
      telegramId: this.telegramId,
      isInitialized: this.isInitialized,
      hasActiveRequest: !!this.statusCheckPromise,
      cacheStrategy: 'NO_CACHE',
      description: 'Always fresh data from server'
    };
  }
}

// Создаем глобальный экземпляр
export const premiumAdService = new PremiumAwareAdService();

// Экспортируем типы
export type { PremiumStatus, PremiumAdResult };