import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

export interface TapperStatus {
  success: boolean;
  energy: number;
  maxEnergy: number;
  cccPerTap: number;
  adsWatched: number;
  canWatchAd: boolean;
  pendingCcc: number;
  error?: string;
}

export interface TapResult {
  success: boolean;
  energy: number;
  cccEarned: number;
  totalTaps: number;
  error?: string;
}

export interface AdResult {
  success: boolean;
  energyAdded: number;
  adsRemaining: number;
  error?: string;
}

export interface CollectResult {
  success: boolean;
  collectedAmount: number;
  message: string;
  error?: string;
}

export const tapperApi = {
  // Получить статус тапалки
  async getStatus(telegramId: string): Promise<TapperStatus> {
    try {
      const response = await axios.get(`${API_URL}/api/games/tapper/status/${telegramId}`);
      return response.data;
    } catch (error) {
      console.error('Get tapper status error:', error);
      return {
        success: false,
        energy: 0,
        maxEnergy: 500,
        cccPerTap: 0.01,
        adsWatched: 0,
        canWatchAd: false,
        pendingCcc: 0,
        error: 'Ошибка загрузки статуса'
      };
    }
  },

  // Тап по астероиду
  async tap(telegramId: string, taps: number = 1): Promise<TapResult> {
    try {
      const response = await axios.post(`${API_URL}/api/games/tapper/tap/${telegramId}`, {
        taps
      });
      return response.data;
    } catch (error: any) {
      console.error('Tap error:', error);
      return {
        success: false,
        energy: 0,
        cccEarned: 0,
        totalTaps: 0,
        error: error.response?.data?.error || 'Ошибка тапа'
      };
    }
  },

  // Собрать накопленные CCC
  async collect(telegramId: string): Promise<CollectResult> {
    try {
      const response = await axios.post(`${API_URL}/api/games/tapper/collect/${telegramId}`);
      return response.data;
    } catch (error: any) {
      console.error('Collect error:', error);
      return {
        success: false,
        collectedAmount: 0,
        message: '',
        error: error.response?.data?.error || 'Ошибка сбора'
      };
    }
  },

  // Посмотреть рекламу за энергию
  async watchAd(telegramId: string): Promise<AdResult> {
    try {
      const response = await axios.post(`${API_URL}/api/games/tapper/watch-ad/${telegramId}`);
      return response.data;
    } catch (error: any) {
      console.error('Watch ad error:', error);
      return {
        success: false,
        energyAdded: 0,
        adsRemaining: 0,
        error: error.response?.data?.error || 'Ошибка рекламы'
      };
    }
  }
};