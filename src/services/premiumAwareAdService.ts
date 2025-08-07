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
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 минут кеш

  constructor() {
    console.log('👑 PremiumAwareAdService initialized');
  }

  // Устанавливаем ID игрока
  setTelegramId(telegramId: string) {
    if (this.telegramId !== telegramId) {
      this.telegramId = telegramId;
      this.premiumCache = { hasPremium: false, reason: 'Player changed' }; // Сбрасываем кеш при смене пользователя
      console.log(`👑 Telegram ID set to: ${telegramId}`);
    }
  }

  // Проверка премиум статуса с кешированием
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

    try {
      console.log(`👑 Checking premium status for ${this.telegramId}...`);
      
      const response = await axios.get(`${API_URL}/api/adsgram/check-ad-block/${this.telegramId}`);
      
      if (response.data.success) {
        const premiumData: PremiumStatus = response.data.premium || { hasPremium: false, reason: 'No premium data received' };
        this.premiumCache = premiumData;
        this.lastPremiumCheck = now;
        
        console.log(`👑 Premium status updated:`, premiumData);
        return premiumData;
      } else {
        throw new Error(response.data.error || 'Failed to check premium status');
      }
      
    } catch (err: any) {
      console.error('👑 Error checking premium status:', err.message);
      
      // В случае ошибки возвращаем безопасное значение
      const fallbackStatus: PremiumStatus = { 
        hasPremium: false, 
        reason: 'Error checking premium status' 
      };
      
      this.premiumCache = fallbackStatus;
      this.lastPremiumCheck = now;
      
      return fallbackStatus;
    }
  }

  // Главный метод для показа рекламы с учетом премиума
  async showRewardedAd(forceCheck: boolean = false): Promise<PremiumAdResult> {
    console.log('👑 Attempting to show rewarded ad...');

    // Проверяем премиум статус
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
    
    // Показываем рекламу как обычно
    const adResult = await adService.showRewardedAd();
    
    return {
      ...adResult,
      premium: premiumStatus,
      skipped: false
    };
  }

  // Проверка доступности рекламного сервиса
  async isAvailable(): Promise<boolean> {
    // Если у пользователя премиум, считаем что сервис "доступен"
    const premiumStatus = await this.checkPremiumStatus();
    
    if (premiumStatus.hasPremium) {
      console.log('👑 Ad service available (premium user - auto reward)');
      return true;
    }
    
    // Если нет премиума, проверяем обычные рекламные сервисы
    const isAdServiceAvailable = adService.isAvailable();
    console.log(`👑 Ad service available (regular user): ${isAdServiceAvailable}`);
    
    return isAdServiceAvailable;
  }

  // Инициализация с учетом премиума
  async initialize(blockId?: string): Promise<void> {
    console.log('👑 Initializing premium-aware ad service...');
    
    // Инициализируем базовый адный сервис
    await adService.initialize(blockId);
    
    console.log('👑 Premium-aware ad service initialized');
  }

  // Получение информации о провайдере с учетом премиума
  async getProviderInfo() {
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
    
    return adService.getProviderInfo();
  }

  // Принудительное обновление премиум кеша
  async refreshPremiumStatus(): Promise<PremiumStatus> {
    console.log('👑 Force refreshing premium status...');
    return await this.checkPremiumStatus(true);
  }

  // Получение текущего статуса без проверки сервера
  getCurrentPremiumStatus(): PremiumStatus {
    return this.premiumCache;
  }
}

// Создаем глобальный экземпляр
export const premiumAdService = new PremiumAwareAdService();

// Экспортируем типы
export type { PremiumStatus, PremiumAdResult };