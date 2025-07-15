// galactic-slots/hooks/useGalacticSlotsGame.ts

import { useState, useCallback } from 'react';
import { SlotGameState, SlotResult } from '../types';
import { GalacticSlotsApi } from '../services/galacticSlotsApi';
import { adService } from '../../../../services/adsgramService';

export const useGalacticSlotsGame = (
  telegramId: string | undefined,
  gameStatus: any,
  showToast: (message: string, type?: 'success' | 'error' | 'warning', duration?: number) => void,
  t: any,
  onDataUpdate?: () => void
) => {
  const [gameState, setGameState] = useState<SlotGameState>('waiting');
  const [betAmount, setBetAmount] = useState(100);
  const [lastResult, setLastResult] = useState<SlotResult | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // ИСПРАВЛЕНО: Более строгая валидация ставки
  const validateBet = useCallback((amount: number): { valid: boolean; error?: string } => {
    // Проверяем что amount - это число
    const numAmount = Number(amount);
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      return { valid: false, error: 'betTooLow' };
    }
    
    if (numAmount < gameStatus.minBet) {
      return { valid: false, error: 'betTooLow' };
    }
    if (numAmount > gameStatus.maxBet) {
      return { valid: false, error: 'betTooHigh' };
    }
    if (numAmount > gameStatus.balance) {
      return { valid: false, error: 'insufficientFunds' };
    }
    return { valid: true };
  }, [gameStatus]);

  // ИСПРАВЛЕНО: Упрощенный спин без лишних таймаутов
  const spin = useCallback(async (): Promise<boolean> => {
    if (!telegramId || gameState !== 'waiting') {
      console.log('🎰 Hook: Spin blocked:', { telegramId: !!telegramId, gameState });
      return false;
    }
    
    console.log('🎰 Hook: Starting spin with bet:', betAmount, typeof betAmount);
    
    // Валидация ставки
    const validation = validateBet(betAmount);
    if (!validation.valid) {
      const errorKey = validation.error as keyof typeof t.errors;
      showToast(t.errors[errorKey] || t.errors.spinError, 'warning');
      return false;
    }

    // Проверка лимитов
    if (!gameStatus.canPlayFree) {
      showToast(t.errors.dailyLimit, 'warning');
      return false;
    }

    try {
      setGameState('spinning');
      setLastResult(null);

      console.log('🎰 Hook: Calling API with cleaned data');
      
      // ИСПРАВЛЕНО: Убеждаемся что передаем чистое число
      const cleanBetAmount = Number(betAmount);
      const result = await GalacticSlotsApi.spin(telegramId, cleanBetAmount);
      
      console.log('🎰 Hook: API result received:', result);
      
      if (result.success && result.result) {
        setLastResult(result.result);
        
        // ИСПРАВЛЕНО: Упрощенная логика переходов состояний
        // Показываем результат сразу после анимации барабанов (3 сек)
        setTimeout(() => {
          setGameState('revealing');
          
          // Переходим к финишу через 1 сек
          setTimeout(() => {
            setGameState('finished');
            
            // Показываем результат
            const winAmount = result.result!.totalWin;
            const multiplier = Math.round(winAmount / cleanBetAmount);
            
            if (result.result!.isWin) {
              if (multiplier >= 50) {
                showToast(`🎰💎 МЕГА ВЫИГРЫШ! +${winAmount.toLocaleString()} CCC (x${multiplier})`, 'success', 7000);
              } else if (multiplier >= 10) {
                showToast(`🎰⭐ БОЛЬШОЙ ВЫИГРЫШ! +${winAmount.toLocaleString()} CCC (x${multiplier})`, 'success', 5000);
              } else {
                showToast(`🎰✨ Выигрыш! +${winAmount.toLocaleString()} CCC (x${multiplier})`, 'success', 4000);
              }
            } else {
              showToast(`🎰💸 Проигрыш -${cleanBetAmount.toLocaleString()} CCC`, 'error', 3000);
            }
            
            // Обновляем данные без перерисовки игры
            if (onDataUpdate) {
              setTimeout(onDataUpdate, 500);
            }
            
            // ИСПРАВЛЕНО: Быстрее возвращаемся к ожиданию
            setTimeout(() => {
              setGameState('waiting');
            }, 1500); // Уменьшено с 2000 до 1500
            
          }, 1000);
        }, 3000);
        
        return true;
      } else {
        setGameState('waiting');
        showToast(result.error || t.errors.spinError, 'error');
        return false;
      }
    } catch (error) {
      console.error('🎰❌ Hook: Spin error:', error);
      setGameState('waiting');
      showToast('Ошибка подключения к серверу', 'error');
      return false;
    }
  }, [telegramId, gameState, betAmount, gameStatus, validateBet, showToast, t, onDataUpdate]);

  // ИСПРАВЛЕНО: Упрощенный просмотр рекламы
  const watchAd = useCallback(async () => {
    if (!telegramId || !gameStatus.canWatchAd || isWatchingAd) {
      console.log('🎰 Ad watch blocked:', {
        hasTelegramId: !!telegramId,
        canWatchAd: gameStatus.canWatchAd,
        isWatchingAd
      });
      return;
    }
    
    setIsWatchingAd(true);
    
    try {
      console.log('🎰 Starting ad watch for slots...');
      
      // Проверяем доступность рекламного сервиса
      if (!adService.isAvailable()) {
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '10674';
        await adService.initialize(ADSGRAM_BLOCK_ID);
        
        if (!adService.isAvailable()) {
          showToast('Рекламный сервис недоступен. Поверните экран в вертикальное положение.', 'error');
          return;
        }
      }
      
      // Показываем рекламу
      const adResult = await adService.showRewardedAd();
      console.log('🎰 Ad result for slots:', adResult);
      
      if (adResult.success) {
        // Уведомляем backend о просмотре рекламы
        const apiResult = await GalacticSlotsApi.watchAd(telegramId);
        
        if (apiResult.success) {
          let message = '🎰 Дополнительная игра в слоты получена!';
          if (apiResult.adsWatched && apiResult.maxAds) {
            message = `🎰 Дополнительная игра получена! (${apiResult.adsWatched}/${apiResult.maxAds})`;
          }
          
          // Добавляем информацию о провайдере
          const currentProvider = adService.getProviderInfo();
          if (currentProvider.name === 'mock') {
            message += ' [Тест]';
          } else if (currentProvider.name === 'roboforex') {
            message += ' [Партнер]';
          } else {
            message += ' [Реклама]';
          }
          
          showToast(message, 'success', 4000);
          
          // Обновляем данные
          if (onDataUpdate) {
            setTimeout(onDataUpdate, 1000);
          }
          
        } else {
          showToast(apiResult.error || 'Ошибка обработки награды', 'error');
        }
      } else {
        showToast(adResult.error || 'Не удалось показать рекламу', 'error');
      }
      
    } catch (error) {
      console.error('🎰❌ Watch ad error:', error);
      showToast('Произошла ошибка при показе рекламы', 'error');
    } finally {
      // ИСПРАВЛЕНО: Быстрее убираем статус просмотра
      setTimeout(() => {
        setIsWatchingAd(false);
      }, 500); // Уменьшено с 1000
    }
  }, [telegramId, gameStatus.canWatchAd, isWatchingAd, showToast, onDataUpdate]);

  // ИСПРАВЛЕНО: Безопасная установка ставки
  const setBetAmountSafe = useCallback((amount: number) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      console.warn('🎰 Invalid bet amount:', amount);
      return;
    }
    
    // Ограничиваем в пределах минимума и максимума
    const clampedAmount = Math.max(
      gameStatus.minBet, 
      Math.min(numAmount, gameStatus.maxBet, gameStatus.balance)
    );
    
    setBetAmount(clampedAmount);
  }, [gameStatus.minBet, gameStatus.maxBet, gameStatus.balance]);

  // Быстрые ставки
  const setQuickBet = useCallback((amount: number) => {
    setBetAmountSafe(Math.min(amount, gameStatus.maxBet, gameStatus.balance));
  }, [setBetAmountSafe, gameStatus.maxBet, gameStatus.balance]);

  const setMaxBet = useCallback(() => {
    const maxPossible = Math.min(gameStatus.maxBet, gameStatus.balance);
    setBetAmountSafe(maxPossible);
  }, [setBetAmountSafe, gameStatus.maxBet, gameStatus.balance]);

  return {
    gameState,
    betAmount,
    setBetAmount: setBetAmountSafe, // ИСПРАВЛЕНО: используем безопасную версию
    lastResult,
    isWatchingAd,
    spin,
    watchAd,
    setQuickBet,
    setMaxBet,
    validateBet
  };
};