// galactic-slots/services/galacticSlotsApi.ts

import { 
    GalacticSlotsStatus, 
    SpinResponse, 
    AdWatchResponse, 
    SlotHistoryResponse 
  } from '../types';
  
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://cosmoclick-backend.onrender.com'
    : 'http://localhost:5000';
  
  class GalacticSlotsApiService {
    // Получить статус игры
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
            best_win: 0,
            worst_loss: 0
          },
          error: 'Ошибка подключения к серверу'
        };
      }
    }
  
    // Крутить слоты
    async spin(telegramId: string, betAmount: number): Promise<SpinResponse> {
      try {
        const response = await fetch(`${API_BASE}/api/games/galactic-slots/spin/${telegramId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ betAmount }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || 'Ошибка сервера'
          };
        }
  
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('🎰❌ API Error - spin:', error);
        return {
          success: false,
          error: 'Ошибка подключения к серверу'
        };
      }
    }
  
    // Посмотреть рекламу
    async watchAd(telegramId: string): Promise<AdWatchResponse> {
      try {
        const response = await fetch(`${API_BASE}/api/games/galactic-slots/watch-ad/${telegramId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          return {
            success: false,
            adsRemaining: 0,
            adsWatched: 0,
            maxAds: 20,
            error: errorData.error || 'Ошибка сервера'
          };
        }
  
        const data = await response.json();
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
  
    // Получить историю игр
    async getHistory(telegramId: string, limit = 20, offset = 0): Promise<SlotHistoryResponse> {
      try {
        const response = await fetch(
          `${API_BASE}/api/games/galactic-slots/history/${telegramId}?limit=${limit}&offset=${offset}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
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