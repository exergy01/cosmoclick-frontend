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

  // ИСПРАВЛЕНО: Один спин с правильной передачей данных в API
  const spin = useCallback(async (customBet?: number): Promise<boolean> => {
    if (!telegramId || gameState === 'spinning') return false;

    const currentBet = customBet || betAmount;
    
    console.log('🎰 Hook: Starting spin with bet:', currentBet, typeof currentBet);
    
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

    try {
      setGameState('spinning');
      setLastResult(null);

      console.log('🎰 Hook: Calling API with clean data');
      
      // ИСПРАВЛЕНО: Убеждаемся что передаем только число, без React объектов
      const cleanBetAmount = Number(currentBet);
      const result = await GalacticSlotsApi.spin(telegramId, cleanBetAmount);
      
      console.log('🎰 Hook: API result received:', result);
      
      if (result.success && result.result) {
        setLastResult(result.result);
        
        // Анимация: 2 сек спин + 1 сек показ результата + 2 сек финиш
        setTimeout(() => {
          setGameState('revealing');
          
          setTimeout(() => {
            setGameState('finished');
            
            // Показываем уведомление о результате
            if (result.result!.isWin) {
              const winAmount = result.result!.totalWin;
              const multiplier = Math.round(winAmount / cleanBetAmount);
              
              if (multiplier >= 20) {
                showToast(`🎰💎 МЕГА ВЫИГРЫШ! +${winAmount.toLocaleString()} CCC (x${multiplier})`, 'success', 6000);
              } else if (multiplier >= 5) {
                showToast(`🎰⭐ БОЛЬШОЙ ВЫИГРЫШ! +${winAmount.toLocaleString()} CCC (x${multiplier})`, 'success', 5000);
              } else {
                showToast(`🎰✨ Выигрыш! +${winAmount.toLocaleString()} CCC (x${multiplier})`, 'success', 4000);
              }
            } else {
              showToast(`🎰💸 Проигрыш -${cleanBetAmount.toLocaleString()} CCC`, 'error', 3000);
            }
            
            // Обновляем данные
            if (onDataUpdate) {
              setTimeout(onDataUpdate, 1000);
            }
            
            // Возвращаемся в ожидание через 2 секунды
            setTimeout(() => {
              setGameState('waiting');
            }, 2000);
            
          }, 1000);
        }, 2000);
        
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

  // ИСПРАВЛЕНО: Безопасная логика автоспинов с проверками лимитов
  const startAutoSpin = useCallback(async (count: number) => {
    if (gameState !== 'waiting' || isAutoSpinning) return;
    
    console.log(`🎰 Starting auto-spin: ${count} spins`);
    setAutoSpinCount(count);
    setIsAutoSpinning(true);
    
    let spinsCompleted = 0;
    let shouldContinue = true;
    
    while (spinsCompleted < count && shouldContinue && isAutoSpinning) {
      console.log(`🎰 Auto-spin ${spinsCompleted + 1}/${count}`);
      
      // КРИТИЧНО: Проверяем актуальные лимиты перед каждым спином
      try {
        const currentStatus = await GalacticSlotsApi.getStatus(telegramId!);
        
        if (!currentStatus.canPlayFree) {
          console.log('🎰 Auto-spin stopped: no games left');
          showToast('Автоспин остановлен: лимит игр исчерпан', 'warning');
          shouldContinue = false;
          break;
        }
        
        if (betAmount > currentStatus.balance) {
          console.log('🎰 Auto-spin stopped: insufficient balance');
          showToast('Автоспин остановлен: недостаточно средств', 'error');
          shouldContinue = false;
          break;
        }
      } catch (error) {
        console.error('🎰❌ Error checking status during auto-spin:', error);
        showToast('Автоспин остановлен: ошибка проверки статуса', 'error');
        shouldContinue = false;
        break;
      }
      
      // Выполняем спин
      const success = await spin();
      if (!success) {
        console.log('🎰 Auto-spin stopped: spin failed');
        shouldContinue = false;
        break;
      }
      
      spinsCompleted++;
      setAutoSpinCount(count - spinsCompleted);
      
      // КРИТИЧНО: Ждем полного завершения анимации (5 секунд)
      // 2 сек спин + 1 сек показ + 2 сек финиш = 5 секунд
      await new Promise(resolve => setTimeout(resolve, 5500));
      
      // Проверяем, не остановили ли автоспин вручную
      if (!isAutoSpinning) {
        console.log('🎰 Auto-spin manually stopped');
        shouldContinue = false;
        break;
      }
    }
    
    console.log(`🎰 Auto-spin completed: ${spinsCompleted}/${count} spins`);
    setIsAutoSpinning(false);
    setAutoSpinCount(0);
    
    // Обновляем данные после завершения автоспинов
    if (onDataUpdate) {
      setTimeout(() => {
        onDataUpdate();
      }, 1000);
    }
    
    // Показываем итоговое уведомление
    if (spinsCompleted > 0) {
      showToast(`🎰 Автоспин завершен: ${spinsCompleted} игр`, 'success');
    }
  }, [gameState, isAutoSpinning, spin, telegramId, betAmount, showToast, onDataUpdate]);

  // ИСПРАВЛЕНО: Немедленная остановка автоспинов
  const stopAutoSpin = useCallback(() => {
    console.log('🎰 Stopping auto-spin manually');
    setIsAutoSpinning(false);
    setAutoSpinCount(0);
    showToast('🎰 Автоспин остановлен', 'warning');
  }, [showToast]);

  // Просмотр рекламы (без изменений)
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
          } else if (currentProvider.name === 'roboforex') {
            message += ' [Partner]';
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