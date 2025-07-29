// cosmic-shells/services/cosmicShellsApi.ts

import axios from 'axios';
import { CosmicShellsStatus, StartGameResponse, GameResult, AdWatchResult, GameHistoryResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export class CosmicShellsApi {
  // Получить статус игры
  static async getStatus(telegramId: string): Promise<CosmicShellsStatus> {
    try {
      const response = await axios.get(`${API_URL}/api/games/cosmic-shells/status/${telegramId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get cosmic shells status error:', error);
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
        maxBet: 5000, // ✅ ИСПРАВЛЕНО: как в backend
        winMultiplier: 2,
        stats: {
          total_games: 0,
          total_wins: 0,
          total_losses: 0,
          total_bet: 0,
          total_won: 0,
          best_streak: 0,
          worst_streak: 0
        },
        error: error.response?.data?.error || 'Ошибка загрузки статуса'
      };
    }
  }

  // Начать новую игру
  static async startGame(telegramId: string, betAmount: number): Promise<StartGameResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/games/cosmic-shells/start-game/${telegramId}`, {
        betAmount
      });
      return response.data;
    } catch (error: any) {
      console.error('Start cosmic shells game error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка создания игры'
      };
    }
  }

  // Сделать выбор тарелки
  static async makeChoice(telegramId: string, gameId: string, chosenPosition: number): Promise<GameResult> {
    try {
      const response = await axios.post(`${API_URL}/api/games/cosmic-shells/make-choice/${telegramId}`, {
        gameId,
        chosenPosition
      });
      return response.data;
    } catch (error: any) {
      console.error('Make choice cosmic shells error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка выбора'
      };
    }
  }

  // Посмотреть рекламу за дополнительную игру
  static async watchAd(telegramId: string): Promise<AdWatchResult> {
    try {
      const response = await axios.post(`${API_URL}/api/games/cosmic-shells/watch-ad/${telegramId}`);
      return response.data;
    } catch (error: any) {
      console.error('Watch ad cosmic shells error:', error);
      return {
        success: false,
        adsRemaining: 0,
        error: error.response?.data?.error || 'Ошибка рекламы'
      };
    }
  }

  // ✅ ИСПРАВЛЕНО: Получить историю игр с увеличенным лимитом
  static async getHistory(telegramId: string, limit: number = 1000, offset: number = 0): Promise<GameHistoryResponse> {
    try {
      const response = await axios.get(`${API_URL}/api/games/cosmic-shells/history/${telegramId}`, {
        params: { limit, offset }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get cosmic shells history error:', error);
      return {
        success: false,
        history: [],
        total: 0,
        hasMore: false,
        error: error.response?.data?.error || 'Ошибка загрузки истории'
      };
    }
  }
}

export {};