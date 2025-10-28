// galactic-slots/services/galacticSlotsApi.ts

import { 
  GalacticSlotsStatus, 
  SpinResponse, 
  AdWatchResponse, 
  SlotHistoryResponse 
} from '../types';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://cosmoclick-backend.onrender.com'
  : 'https://cosmoclick-backend.onrender.com';

class GalacticSlotsApiService {
  // ИСПРАВЛЕНО: Правильный роут
  async getStatus(telegramId: string): Promise<GalacticSlotsStatus> {
    try {
      const response = await fetch(`${API_BASE}/api/games/galactic-slots/status/${telegramId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (process.env.NODE_ENV === 'development') console.log('🎰 API: Status received:', data);
      return data;
    } catch (error) {
      console.error('🎰❌ API Error - getStatus:', error);
      return {
        success: false,
        balance: 0,
        dailyGames: 0,
        dailyAds: 0,
        canPlayFree: false,
        canWatchAd: false,
        gamesLeft: 0,
        adsLeft: 0,
        minBet: 100,
        maxBet: 5000,
        stats: {
          total_games: 0,
          total_wins: 0,
          total_losses: 0,
          total_bet: 0,
          total_won: 0,
          best_streak: 0,    // ИСПРАВЛЕНО
          worst_streak: 0    // ИСПРАВЛЕНО
        },
        error: 'Ошибка подключения к серверу'
      };
    }
  }

  // ИСПРАВЛЕНО: Чистый спин без circular структур
  async spin(telegramId: string, betAmount: number): Promise<SpinResponse> {
    try {
      if (process.env.NODE_ENV === 'development') console.log('🎰 API: Sending spin request:', { telegramId, betAmount, type: typeof betAmount });
      
      // Очищаем данные перед отправкой
      const cleanBetAmount = Number(betAmount);
      if (isNaN(cleanBetAmount)) {
        throw new Error('Invalid bet amount');
      }
      
      const response = await fetch(`${API_BASE}/api/games/galactic-slots/spin/${telegramId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          betAmount: cleanBetAmount
        }),
      });

      if (process.env.NODE_ENV === 'development') console.log('🎰 API: Spin response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🎰❌ API Error response:', errorData);
        return {
          success: false,
          error: errorData.error || 'Ошибка сервера'
        };
      }

      const data = await response.json();
      if (process.env.NODE_ENV === 'development') console.log('🎰✅ API: Spin success:', data);
      return data;
    } catch (error) {
      console.error('🎰❌ API Error - spin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка подключения к серверу'
      };
    }
  }

  // ИСПРАВЛЕНО: Правильный роут для рекламы
  async watchAd(telegramId: string): Promise<AdWatchResponse> {
    try {
      if (process.env.NODE_ENV === 'development') console.log('🎰 API: Sending watch ad request:', { telegramId });
      
      const response = await fetch(`${API_BASE}/api/games/galactic-slots/watch-ad/${telegramId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (process.env.NODE_ENV === 'development') console.log('🎰 API: Watch ad response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🎰❌ API Watch ad error:', errorData);
        return {
          success: false,
          adsRemaining: 0,
          adsWatched: 0,
          maxAds: 20,
          error: errorData.error || 'Ошибка сервера'
        };
      }

      const data = await response.json();
      if (process.env.NODE_ENV === 'development') console.log('🎰✅ API: Watch ad success:', data);
      return data;
    } catch (error) {
      console.error('🎰❌ API Error - watchAd:', error);
      return {
        success: false,
        adsRemaining: 0,
        adsWatched: 0,
        maxAds: 20,
        error: 'Ошибка подключения к серверу'
      };
    }
  }

  // ИСПРАВЛЕНО: Правильный роут для истории
  async getHistory(telegramId: string, limit = 20, offset = 0): Promise<SlotHistoryResponse> {
    try {
      if (process.env.NODE_ENV === 'development') console.log('🎰 API: Getting history:', { telegramId, limit, offset });
      
      const response = await fetch(
        `${API_BASE}/api/games/galactic-slots/history/${telegramId}?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (process.env.NODE_ENV === 'development') console.log('🎰 API: History response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (process.env.NODE_ENV === 'development') console.log('🎰✅ API: History success:', data);
      return data;
    } catch (error) {
      console.error('🎰❌ API Error - getHistory:', error);
      return {
        success: false,
        history: [],
        total: 0,
        hasMore: false,
        error: 'Ошибка подключения к серверу'
      };
    }
  }
}

export const GalacticSlotsApi = new GalacticSlotsApiService();