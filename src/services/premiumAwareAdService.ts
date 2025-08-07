// services/premiumAwareAdService.ts - ЗАМЕНИТЬ ВЕСЬ ФАЙЛ

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
  private lastPremiumCheck: number = 0;
  private premiumCache: PremiumStatus = { hasPremium: false, reason: 'Not initialized' };
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 🎯 УВЕЛИЧИВАЕМ КЕШ ДО 15 МИНУТ
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private statusCheckPromise: Promise<PremiumStatus> | null = null; // 🔒 Предотвращаем дублирующие запросы

  constructor() {
    console.log('👑 PremiumAwareAdService initialized');
  }

  // Устанавливаем ID игрока
  setTelegramId(telegramId: string) {
    if (this.telegramId !== telegramId) {
      this.telegramId = telegramId;
      // 🎯 НЕ СБРАСЫВАЕМ КЕШ при смене пользователя - проверим позже
      console.log(`👑 Telegram ID set to: ${telegramId}`);
    }
  }

  // 🔒 ЗАЩИЩЕННАЯ ПРОВЕРКА ПРЕМИУМ СТАТУСА С ПРЕДОТВРАЩЕНИЕМ ДУБЛИРОВАНИЯ
  private async checkPremiumStatus(force: boolean = false): Promise<PremiumStatus> {
    if (!this.telegramId) {
      return { hasPremium: false, reason: 'No telegram ID provided' };
    }

    const now = Date.now();
    
    // Используем кеш если он свежий и не форсируем обновление
    if (!force && (now - this.lastPremiumCheck) < this.CACHE_DURATION) {
      console.log('👑 Using cached premium status:', this.premiumCache);
      return this.premiumCache;
    }

    // 🔒 Если уже идет запрос статуса - ждем его завершения
    if (this.statusCheckPromise) {
      console.log('👑 Status check already in progress, waiting...');
      return await this.statusCheckPromise;
    }

    // 🎯 СОЗДАЕМ ЗАЩИЩЕННЫЙ ПРОМИС
    this.statusCheckPromise = this._performStatusCheck(now);
    
    try {
      const result = await this.statusCheckPromise;
      return result;
    } finally {
      this.statusCheckPromise = null; // Освобождаем промис
    }
  }

  // 🔒 ВНУТРЕННИЙ МЕТОД ПРОВЕРКИ СТАТУСА
  private async _performStatusCheck(timestamp: number): Promise<PremiumStatus> {
    try {
      console.log(`👑 Checking premium status for ${this.telegramId}...`);
      
      const response = await axios.get(`${API_URL}/api/adsgram/check-ad-block/${this.telegramId}`, {
        timeout: 10000, // 🎯 ТАЙМАУТ 10 СЕКУНД
      });
      
      if (response.data.success) {
        const premiumData: PremiumStatus = response.data.premium || { 
          hasPremium: false, 
          reason: 'No premium data received' 
        };
        
        this.premiumCache = premiumData;
        this.lastPremiumCheck = timestamp;
        
        console.log(`👑 Premium status updated:`, premiumData);
        return premiumData;
      } else {
        throw new Error(response.data.error || 'Failed to check premium status');
      }
      
    } catch (err: any) {
      console.error('👑 Error checking premium status:', err.message);
      
      // 🎯 В случае ошибки используем старый кеш если он есть и не очень старый (1 час)
      if (this.premiumCache && (timestamp - this.lastPremiumCheck) < (60 * 60 * 1000)) {
        console.log('👑 Using stale cache due to error');
        return this.premiumCache;
      }
      
      // В крайнем случае возвращаем безопасное значение
      const fallbackStatus: PremiumStatus = { 
        hasPremium: false, 
        reason: 'Error checking premium status' 
      };
      
      this.premiumCache = fallbackStatus;
      this.lastPremiumCheck = timestamp;
      
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
    
    // 🎯 НЕ ВЫЗЫВАЕМ ПРОВЕРКУ СТАТУСА ЗДЕСЬ - будет вызвана при необходимости
    console.log('👑 Premium-aware ad service initialized without status check');
  }

  // 🎯 ГЛАВНЫЙ МЕТОД С ОПТИМИЗАЦИЕЙ
  async showRewardedAd(forceCheck: boolean = false): Promise<PremiumAdResult> {
    console.log('👑 Attempting to show rewarded ad...');

    // Проверяем премиум статус ТОЛЬКО при необходимости
    const premiumStatus = await this.checkPremiumStatus(forceCheck);
    
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
    
    // 🎯 ПОКАЗЫВАЕМ РЕКЛАМУ БЕЗ ДОПОЛНИТЕЛЬНЫХ ЗАДЕРЖЕК
    const adResult = await adService.showRewardedAd();
    
    return {
      ...adResult,
      premium: premiumStatus,
      skipped: false
    };
  }

  // 🎯 БЫСТРАЯ ПРОВЕРКА ДОСТУПНОСТИ
  async isAvailable(): Promise<boolean> {
    // 🎯 СНАЧАЛА ПРОВЕРЯЕМ КЕШ БЕЗ ЗАПРОСОВ К СЕРВЕРУ
    const cachedStatus = this.getCurrentPremiumStatus();
    
    if (cachedStatus.hasPremium && this.isCacheValid()) {
      console.log('👑 Ad service available (premium user - auto reward from cache)');
      return true;
    }
    
    // Если нет премиума в кеше, проверяем обычные рекламные сервисы
    const isAdServiceAvailable = adService.isAvailable();
    console.log(`👑 Ad service available (regular user): ${isAdServiceAvailable}`);
    
    return isAdServiceAvailable;
  }

  // 🎯 ПРОВЕРКА ВАЛИДНОСТИ КЕША
  private isCacheValid(): boolean {
    const now = Date.now();
    return (now - this.lastPremiumCheck) < this.CACHE_DURATION;
  }

  // 🎯 ПОЛУЧЕНИЕ ИНФОРМАЦИИ О ПРОВАЙДЕРЕ БЕЗ ЗАПРОСОВ
  getProviderInfo() {
    const cachedStatus = this.getCurrentPremiumStatus();
    
    if (cachedStatus.hasPremium && this.isCacheValid()) {
      return {
        name: 'premium',
        type: cachedStatus.type,
        daysLeft: cachedStatus.daysLeft,
        available: true,
        description: 'Premium user - ads disabled'
      };
    }
    
    return adService.getProviderInfo();
  }

  // 🔥 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ С ЗАЩИТОЙ ОТ ДУБЛИРОВАНИЯ
  async refreshPremiumStatus(): Promise<PremiumStatus> {
    console.log('👑 Force refreshing premium status...');
    return await this.checkPremiumStatus(true);
  }

  // 🎯 БЫСТРОЕ ПОЛУЧЕНИЕ ТЕКУЩЕГО СТАТУСА БЕЗ ЗАПРОСОВ
  getCurrentPremiumStatus(): PremiumStatus {
    return { ...this.premiumCache }; // Возвращаем копию для безопасности
  }

  // 🆕 НОВЫЙ МЕТОД - ПРОВЕРКА НУЖНОСТИ ОБНОВЛЕНИЯ СТАТУСА
  shouldRefreshStatus(): boolean {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastPremiumCheck;
    
    // Если кеш старше 15 минут или никогда не проверяли
    return timeSinceLastCheck > this.CACHE_DURATION || this.lastPremiumCheck === 0;
  }

  // 🆕 ФОНОВОЕ ОБНОВЛЕНИЕ СТАТУСА (НЕ БЛОКИРУЮЩЕЕ)
  backgroundRefresh(): void {
    if (!this.shouldRefreshStatus() || this.statusCheckPromise) {
      return; // Не нужно обновлять или уже идет обновление
    }

    console.log('👑 Starting background status refresh...');
    
    // 🎯 ЗАПУСКАЕМ В ФОНЕ, НЕ БЛОКИРУЕМ UI
    this.checkPremiumStatus(true).catch(err => {
      console.log('👑 Background refresh failed (non-critical):', err.message);
    });
  }

  // 🆕 МЕТОД ДЛЯ ОЧИСТКИ СОСТОЯНИЯ
  reset(): void {
    console.log('👑 Resetting premium service state');
    this.lastPremiumCheck = 0;
    this.premiumCache = { hasPremium: false, reason: 'Reset' };
    this.statusCheckPromise = null;
  }

  // 🆕 ДИАГНОСТИКА СОСТОЯНИЯ СЕРВИСА
  getDebugInfo() {
    return {
      telegramId: this.telegramId,
      isInitialized: this.isInitialized,
      cacheAge: Date.now() - this.lastPremiumCheck,
      cacheValid: this.isCacheValid(),
      hasActiveRequest: !!this.statusCheckPromise,
      currentStatus: this.premiumCache
    };
  }
}

// Создаем глобальный экземпляр
export const premiumAdService = new PremiumAwareAdService();

// Экспортируем типы
export type { PremiumStatus, PremiumAdResult };