// cosmic-shells/hooks/useCosmicShellsGame.ts

import { useState, useCallback } from 'react';
import { GameState, GameResult } from '../types';
import { CosmicShellsApi } from '../services/cosmicShellsApi';
import { validateBet, isBigBet } from '../utils/gameLogic';
import { formatTranslation } from '../utils/formatters';

// Mock Ad Service
const mockAdService = {
  async showRewardedAd(type: string, game: string) {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 1000; color: white;
        font-family: Arial; text-align: center;
      `;
      
      let countdown = 3;
      modal.innerHTML = `
        <div style="background: #222; padding: 40px; border-radius: 20px; border: 2px solid #00f0ff;">
          <h2 style="color: #00f0ff; margin-bottom: 20px;">📺 Реклама</h2>
          <p style="font-size: 1.2rem; margin-bottom: 20px;">Просмотр рекламы...</p>
          <div id="countdown" style="font-size: 2rem; color: #00f0ff;">${countdown}</div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const timer = setInterval(() => {
        countdown--;
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
          countdownEl.textContent = countdown.toString();
        }
        
        if (countdown <= 0) {
          clearInterval(timer);
          document.body.removeChild(modal);
          resolve({ success: true, provider: 'mock' });
        }
      }, 1000);
    });
  }
};

// ИСПРАВЛЕНО: Убрал все локальные функции управления счетчиками
export const useCosmicShellsGame = (
  telegramId: string | undefined,
  gameStatus: any,
  showToast: (message: string, type?: 'success' | 'error' | 'warning', duration?: number) => void,
  t: any
) => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [betAmount, setBetAmount] = useState(100);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResult['result'] | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // ИСПРАВЛЕНО: Простая логика начала игры без локальных изменений
  const startGame = useCallback(async () => {
    if (!telegramId || gameState !== 'waiting') return;
    
    console.log('🎮 Frontend: Starting game with backend validation');
    
    // Валидация ставки
    const validation = validateBet(betAmount, gameStatus.minBet, gameStatus.maxBet, gameStatus.balance);
    if (!validation.valid) {
      const errorKey = validation.error as keyof typeof t.errors;
      const errorMessage = t.errors[errorKey] 
        ? formatTranslation(t.errors[errorKey], validation.params || {})
        : t.errors.createGame;
      showToast(errorMessage, 'warning');
      return;
    }

    // Проверка лимитов
    if (!gameStatus.canPlayFree && !gameStatus.canWatchAd) {
      showToast(t.errors.dailyLimit, 'warning');
      return;
    }

    // Предупреждение о большой ставке
    if (isBigBet(betAmount, gameStatus.balance)) {
      const confirmed = window.confirm(t.notifications.confirmBigBet);
      if (!confirmed) return;
    }

    try {
      const result = await CosmicShellsApi.startGame(telegramId, betAmount);
      
      if (result.success && result.gameId) {
        setCurrentGameId(result.gameId);
        setGameState('shuffling');
        setGameResult(null);
        
        console.log('🎮 Frontend: Game started successfully');
        
        // Автоматически переходим к выбору через 5 секунд
        setTimeout(() => {
          setGameState('choosing');
        }, 5000);
        
      } else {
        showToast(result.error || t.errors.createGame, 'error');
      }
    } catch (err) {
      showToast(t.errors.createGame, 'error');
    }
  }, [telegramId, gameState, betAmount, gameStatus, showToast, t]);

  // Выбор тарелки
  const makeChoice = useCallback(async (position: number) => {
    if (!telegramId || !currentGameId || gameState !== 'choosing') return;
    
    setGameState('revealing');
    
    try {
      const result = await CosmicShellsApi.makeChoice(telegramId, currentGameId, position);
      
      if (result.success && result.result) {
        setGameResult(result.result);
        
        console.log('🎮 Frontend: Game completed, backend manages all data');
        
        // Показываем результат через 2 секунды
        setTimeout(() => {
          setGameState('finished');
          
          if (result.result!.isWin) {
            const message = formatTranslation(t.notifications.winMessage, {
              amount: result.result!.winAmount,
              profit: result.result!.profit
            });
            showToast(message, 'success', 5000);
          } else {
            const message = formatTranslation(t.notifications.lossMessage, {
              amount: result.result!.betAmount
            });
            showToast(message, 'error', 4000);
          }
        }, 2000);
        
      } else {
        setGameState('choosing');
        showToast(result.error || t.errors.makeChoice, 'error');
      }
    } catch (err) {
      setGameState('choosing');
      showToast(t.errors.makeChoice, 'error');
    }
  }, [telegramId, currentGameId, gameState, showToast, t]);

  // Новая игра
  const newGame = useCallback(() => {
    setGameState('waiting');
    setCurrentGameId(null);
    setGameResult(null);
  }, []);

  // ИСПРАВЛЕНО: Простой просмотр рекламы с обновлением страницы
  const watchAd = useCallback(async () => {
    if (!telegramId || !gameStatus.canWatchAd || isWatchingAd) return;
    
    setIsWatchingAd(true);
    
    try {
      await mockAdService.showRewardedAd('extra_game', 'cosmic_shells');
      
      const result = await CosmicShellsApi.watchAd(telegramId);
      
      if (result.success) {
        // ИСПРАВЛЕНО: Показываем сообщение с прогрессом если есть данные
        const message = result.message || t.notifications.extraGameReceived;
        showToast(message, 'success');
        console.log('🎮 Frontend: Ad watched, backend updated counters');
        
        // ИСПРАВЛЕНО: Принудительно обновляем страницу через 2 секунды
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
      } else {
        showToast(result.error || t.errors.watchAd, 'error');
      }
    } catch (err) {
      showToast(t.errors.watchAd, 'error');
    } finally {
      setIsWatchingAd(false);
    }
  }, [telegramId, gameStatus.canWatchAd, isWatchingAd, showToast, t]);

  return {
    gameState,
    betAmount,
    setBetAmount,
    currentGameId,
    gameResult,
    isWatchingAd,
    startGame,
    makeChoice,
    newGame,
    watchAd
  };
};