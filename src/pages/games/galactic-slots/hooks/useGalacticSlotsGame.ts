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
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);

  // Валидация ставки
  const validateBet = useCallback((amount: number): { valid: boolean; error?: string } => {
    if (amount < gameStatus.minBet) {
      return { valid: false, error: 'betTooLow' };
    }
    if (amount > gameStatus.maxBet) {
      return { valid: false, error: 'betTooHigh' };
    }
    if (amount > gameStatus.balance) {
      return { valid: false, error: 'insufficientFunds' };
    }
    return { valid: true };
  }, [gameStatus]);

  // Один спин
  const spin = useCallback(async (customBet?: number): Promise<boolean> => {
    if (!telegramId || gameState === 'spinning') return false;

    const currentBet = customBet || betAmount;
    
    // Валидация ставки
    const validation = validateBet(currentBet);
    if (!validation.valid) {
      const errorKey = validation.error as keyof typeof t.errors;
      showToast(t.errors[errorKey] || t.errors.spinError, 'warning');
      return false;
    }

    // Проверка лимитов
    if (!gameStatus.canPlayFree && !gameStatus.canWatchAd) {
      showToast(t.errors.dailyLimit, 'warning');
      return false;
    }

    setGameState('spinning');
    setLastResult(null);

    try {
      const result = await GalacticSlotsApi.spin(telegramId, currentBet);
      
      if (result.success && result.result) {
        setLastResult(result.result);
        
        // Анимация спина (2 секунды)
        setTimeout(() => {
          setGameState('revealing');
          
          // Показываем результат через 1 секунду
          setTimeout(() => {
            setGameState('finished');
            
            if (result.result!.isWin) {
              const winAmount = result.result!.totalWin;
              const profit = result.result!.profit;
              
              if (profit >= currentBet * 10) {
                showToast(`🎰💎 МЕГА ВЫИГРЫШ! +${winAmount} CCC (x${Math.round(winAmount/currentBet)})`, 'success', 6000);
              } else if (profit >= currentBet * 3) {
                showToast(`🎰⭐ БОЛЬШОЙ ВЫИГРЫШ! +${winAmount} CCC`, 'success', 5000);
              } else {
                showToast(`🎰✨ Выигрыш! +${winAmount} CCC`, 'success', 4000);
              }
            } else {
              showToast(`🎰💸 Проигрыш -${currentBet} CCC`, 'error', 3000);
            }
            
            // Обновляем данные
            if (onDataUpdate) {
              setTimeout(onDataUpdate, 1000);
            }
            
            // Возвращаемся в ожидание через 3 секунды
            setTimeout(() => {
              setGameState('waiting');
            }, 3000);
            
          }, 1000);
        }, 2000);
        
        return true;
      } else {
        setGameState('waiting');
        showToast(result.error || t.errors.spinError, 'error');
        return false;
      }
    } catch (error) {
      setGameState('waiting');
      showToast(t.errors.spinError, 'error');
      return false;
    }
  }, [telegramId, gameState, betAmount, gameStatus, validateBet, showToast, t, onDataUpdate]);

  // Автоспины
  const startAutoSpin = useCallback(async (count: number) => {
    if (gameState !== 'waiting' || isAutoSpinning) return;
    
    setAutoSpinCount(count);
    setIsAutoSpinning(true);
    
    for (let i = 0; i < count; i++) {
      if (!isAutoSpinning) break; // Остановка автоспинов
      
      const success = await spin();
      if (!success) break; // Прерываем при ошибке
      
      setAutoSpinCount(count - i - 1);
      
      // Ждем завершения текущего спина
      await new Promise(resolve => {
        const checkState = () => {
          if (gameState === 'waiting') {
            resolve(undefined);
          } else {
            setTimeout(checkState, 100);
          }
        };
        checkState();
      });
      
      // Пауза между спинами
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsAutoSpinning(false);
    setAutoSpinCount(0);
  }, [gameState, isAutoSpinning, spin]);

  // Остановка автоспинов
  const stopAutoSpin = useCallback(() => {
    setIsAutoSpinning(false);
    setAutoSpinCount(0);
  }, []);

  // Просмотр рекламы
  const watchAd = useCallback(async () => {
    if (!telegramId || !gameStatus.canWatchAd || isWatchingAd) return;
    
    setIsWatchingAd(true);
    
    try {
      console.log('🎰 Starting ad watch for slots...');
      
      // Проверяем доступность рекламного сервиса
      if (!adService.isAvailable()) {
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '10674';
        await adService.initialize(ADSGRAM_BLOCK_ID);
        
        if (!adService.isAvailable()) {
          showToast('Рекламный сервис недоступен. Попробуйте позже.', 'error');
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
          
          const currentProvider = adService.getProviderInfo();
          if (currentProvider.name === 'mock') {
            message += ' [Тест]';
          } else {
            message += ' [Adsgram]';
          }
          
          showToast(message, 'success', 4000);
          
          // Обновляем данные
          if (onDataUpdate) {
            setTimeout(() => {
              onDataUpdate();
            }, 2000);
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
      setTimeout(() => {
        setIsWatchingAd(false);
      }, 1000);
    }
  }, [telegramId, gameStatus.canWatchAd, isWatchingAd, showToast, onDataUpdate]);

  // Быстрые ставки
  const setQuickBet = useCallback((amount: number) => {
    setBetAmount(Math.min(amount, gameStatus.maxBet, gameStatus.balance));
  }, [gameStatus.maxBet, gameStatus.balance]);

  const setMaxBet = useCallback(() => {
    const maxPossible = Math.min(gameStatus.maxBet, gameStatus.balance);
    setBetAmount(maxPossible);
  }, [gameStatus.maxBet, gameStatus.balance]);

  return {
    gameState,
    betAmount,
    setBetAmount,
    lastResult,
    isWatchingAd,
    autoSpinCount,
    isAutoSpinning,
    spin,
    startAutoSpin,
    stopAutoSpin,
    watchAd,
    setQuickBet,
    setMaxBet,
    validateBet
  };
};