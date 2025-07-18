// cosmic-shells/hooks/useCosmicShellsGame.ts
// ✅ ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ без экспериментов

import { useState, useCallback, useEffect } from 'react';
import { GameState, GameResult, CosmicShellsStatus } from '../types';
import { CosmicShellsApi } from '../services/cosmicShellsApi';
import { validateBet, isBigBet } from '../utils/gameLogic';
import { formatTranslation } from '../utils/formatters';
import { adService } from '../../../../services/adsgramService';

export const useCosmicShellsGame = (
  telegramId: string | undefined,
  gameStatus: CosmicShellsStatus,
  showToast: (message: string, type?: 'success' | 'error' | 'warning', duration?: number) => void,
  t: any,
  onDataUpdate?: () => void
) => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [betAmount, setBetAmount] = useState(100);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResult['result'] | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // Инициализация рекламного сервиса
  useEffect(() => {
    const initAds = async () => {
      try {
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '10674';
        await adService.initialize(ADSGRAM_BLOCK_ID);
        console.log('🛸 Ad Service initialized');
      } catch (error) {
        console.error('🛸❌ Ad service initialization failed:', error);
      }
    };
    initAds();
  }, []);

  // Простая функция startGame
  const startGame = useCallback(async () => {
    if (!telegramId || gameState !== 'waiting') return;
    
    console.log('🛸 Starting game with bet:', betAmount);
    
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
    if (!gameStatus.canPlayFree) {
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
        
        console.log('🛸 Game started successfully');
        
        // Переходим к выбору через 5 секунд
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

  // Простая функция makeChoice
  const makeChoice = useCallback(async (position: number) => {
    if (!telegramId || !currentGameId || gameState !== 'choosing') return;
    
    setGameState('revealing');
    
    try {
      const result = await CosmicShellsApi.makeChoice(telegramId, currentGameId, position);
      
      if (result.success && result.result) {
        setGameResult(result.result);
        
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
          
          // Автоматически скрываем результат через 4 секунды
          setTimeout(() => {
            setGameState('waiting');
            setGameResult(null);
            setCurrentGameId(null);
            
            // Обновляем данные
            if (onDataUpdate) {
              onDataUpdate();
            }
          }, 4000);
          
        }, 2000);
        
      } else {
        setGameState('choosing');
        showToast(result.error || t.errors.makeChoice, 'error');
      }
    } catch (err) {
      setGameState('choosing');
      showToast(t.errors.makeChoice, 'error');
    }
  }, [telegramId, currentGameId, gameState, showToast, t, onDataUpdate]);

  const newGame = useCallback(() => {
    setGameState('waiting');
    setCurrentGameId(null);
    setGameResult(null);
  }, []);

  // Простая функция watchAd
  const watchAd = useCallback(async () => {
    if (!telegramId || !gameStatus.canWatchAd || isWatchingAd) return;
    
    setIsWatchingAd(true);
    
    try {
      console.log('🛸 Starting ad watch...');
      
      if (!adService.isAvailable()) {
        await adService.initialize();
        if (!adService.isAvailable()) {
          showToast('Ad service unavailable', 'error');
          return;
        }
      }
      
      const adResult = await adService.showRewardedAd();
      
      if (adResult.success) {
        const apiResult = await CosmicShellsApi.watchAd(telegramId);
        
        if (apiResult.success) {
          let message = '🛸 Extra game received!';
          if (apiResult.adsWatched && apiResult.maxAds) {
            message = `🛸 Extra game received! (${apiResult.adsWatched}/${apiResult.maxAds})`;
          }
          
          showToast(message, 'success', 4000);
          
          // Обновляем данные
          if (onDataUpdate) {
            onDataUpdate();
          }
          
        } else {
          showToast(apiResult.error || 'Ошибка обработки награды', 'error');
        }
      } else {
        showToast(adResult.error || 'Failed to show advertisement', 'error');
      }
      
    } catch (error) {
      console.error('🛸❌ Watch ad error:', error);
      showToast('An error occurred while showing advertisement', 'error');
    } finally {
      setTimeout(() => {
        setIsWatchingAd(false);
      }, 1000);
    }
  }, [telegramId, gameStatus.canWatchAd, isWatchingAd, showToast, onDataUpdate]);

  // Безопасная установка ставки
  const setBetAmountSafe = useCallback((amount: number) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      return;
    }
    
    const clampedAmount = Math.max(
      gameStatus.minBet, 
      Math.min(numAmount, gameStatus.maxBet, gameStatus.balance)
    );
    
    setBetAmount(clampedAmount);
  }, [gameStatus.minBet, gameStatus.maxBet, gameStatus.balance]);

  return {
    gameState,
    betAmount,
    setBetAmount: setBetAmountSafe,
    currentGameId,
    gameResult,
    isWatchingAd,
    startGame,
    makeChoice,
    newGame,
    watchAd
  };
};