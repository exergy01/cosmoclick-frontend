// cosmic-shells/hooks/useCosmicShellsGame.ts

import { useState, useCallback, useEffect } from 'react';
import { GameState, GameResult } from '../types';
import { CosmicShellsApi } from '../services/cosmicShellsApi';
import { validateBet, isBigBet } from '../utils/gameLogic';
import { formatTranslation } from '../utils/formatters';
import { adService } from '../../../../services/adsgramService';

export const useCosmicShellsGame = (
  telegramId: string | undefined,
  gameStatus: any,
  showToast: (message: string, type?: 'success' | 'error' | 'warning', duration?: number) => void,
  t: any,
  onDataUpdate?: () => void
) => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [betAmount, setBetAmount] = useState(100);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResult['result'] | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // Инициализация рекламного сервиса с диагностикой
  useEffect(() => {
    const initAds = async () => {
      try {
        // Ваш Block ID от Adsgram (только числовая часть)
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '10674';
        
        console.log('🎯 Starting ad service initialization...');
        console.log('🎯 Block ID from env:', ADSGRAM_BLOCK_ID);
        console.log('🎯 Block ID type:', typeof ADSGRAM_BLOCK_ID);
        console.log('🎯 Environment variables:', {
          nodeEnv: process.env.NODE_ENV,
          hasBlockId: !!ADSGRAM_BLOCK_ID
        });
        
        await adService.initialize(ADSGRAM_BLOCK_ID);
        
        const providerInfo = adService.getProviderInfo();
        console.log('🎯✅ Ad Service initialization complete:', providerInfo);
        
        if (providerInfo.name === 'mock') {
          console.log('🎯ℹ️ Using Mock ads - в реальном Telegram будет Adsgram');
        }
        
      } catch (error) {
        console.error('🎯❌ Ad service initialization failed:', error);
      }
    };

    initAds();
  }, []);

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
          
          // Обновляем данные после завершения игры
          if (onDataUpdate) {
            setTimeout(onDataUpdate, 2000);
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
  }, [telegramId, currentGameId, gameState, showToast, t, onDataUpdate]);

  const newGame = useCallback(() => {
    setGameState('waiting');
    setCurrentGameId(null);
    setGameResult(null);
  }, []);

  // Улучшенный просмотр рекламы с диагностикой
  const watchAd = useCallback(async () => {
    if (!telegramId || !gameStatus.canWatchAd || isWatchingAd) {
      console.log('🎯 Ad watch blocked:', {
        hasTelegramId: !!telegramId,
        canWatchAd: gameStatus.canWatchAd,
        isWatchingAd
      });
      return;
    }
    
    setIsWatchingAd(true);
    
    try {
      console.log('🎯 Starting ad watch process...');
      
      // Проверяем инициализацию сервиса
      const providerInfo = adService.getProviderInfo();
      console.log('🎯 Current ad service state:', providerInfo);
      
      // Проверяем доступность рекламного сервиса
      const isServiceAvailable = adService.isAvailable();
      console.log('🎯 Ad service availability:', isServiceAvailable);
      
      if (!isServiceAvailable) {
        // Пытаемся переинициализировать
        console.log('🎯 Service not available, attempting re-initialization...');
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '10674';
        await adService.initialize(ADSGRAM_BLOCK_ID);
        
        if (!adService.isAvailable()) {
          showToast('Рекламный сервис недоступен. Попробуйте позже.', 'error');
          return;
        }
      }
      
      console.log('🎯 Ad service confirmed available, showing ad...');
      
      // Показываем рекламу через Adsgram или Mock
      const adResult = await adService.showRewardedAd();
      console.log('🎯 Ad result received:', adResult);
      
      if (adResult.success) {
        console.log('🎯 Ad watched successfully, notifying backend...');
        
        // Уведомляем backend о просмотре рекламы
        const apiResult = await CosmicShellsApi.watchAd(telegramId);
        console.log('🎯 Backend API result:', apiResult);
        
        if (apiResult.success) {
          console.log('🎯✅ Ad reward processed successfully');
          
          // Формируем сообщение с информацией о провайдере
          let message = '🎮 Дополнительная игра получена!';
          if (apiResult.adsWatched && apiResult.maxAds) {
            message = `🎮 Дополнительная игра получена! (${apiResult.adsWatched}/${apiResult.maxAds})`;
          } else if (apiResult.message) {
            message = apiResult.message;
          }
          
          // Добавляем информацию о типе рекламы
          const currentProvider = adService.getProviderInfo();
          if (currentProvider.name === 'mock') {
            message += ' [Тест]';
          } else {
            message += ' [Adsgram]';
          }
          
          showToast(message, 'success', 4000);
          
          // Обновляем данные после успешного просмотра
          if (onDataUpdate) {
            console.log('🎯 Scheduling data update...');
            setTimeout(() => {
              onDataUpdate();
            }, 2000);
          }
          
        } else {
          console.error('🎯❌ Backend API error:', apiResult.error);
          showToast(apiResult.error || 'Ошибка обработки награды', 'error');
        }
      } else {
        console.error('🎯❌ Ad service error:', adResult.error);
        let errorMessage = 'Не удалось показать рекламу';
        if (adResult.debug) {
          console.log('🎯 Debug info:', adResult.debug);
        }
        showToast(adResult.error || errorMessage, 'error');
      }
      
    } catch (error) {
      console.error('🎯❌ Watch ad error:', error);
      showToast('Произошла ошибка при показе рекламы', 'error');
    } finally {
      // Убираем статус просмотра через задержку для плавности UI
      setTimeout(() => {
        setIsWatchingAd(false);
      }, 1000);
    }
  }, [telegramId, gameStatus.canWatchAd, isWatchingAd, showToast, t, onDataUpdate]);

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