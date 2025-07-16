import { useState, useCallback, useRef } from 'react';
import { SlotGameState, SlotResult, GalacticSlotsStatus } from '../types';
import { GalacticSlotsApi } from '../services/galacticSlotsApi';
import { adService } from '../../../../services/adsgramService';

export const useGalacticSlotsGame = (
  telegramId: string | undefined,
  gameStatus: GalacticSlotsStatus,
  showToast: (message: string, type?: 'success' | 'error' | 'warning', duration?: number) => void,
  t: any,
  onLocalStatusUpdate?: (newStatus: Partial<GalacticSlotsStatus>) => void,
  onHistoryUpdate?: () => void,
  onPlayerBalanceUpdate?: (newBalance: number) => void
) => {
  const [gameState, setGameState] = useState<SlotGameState>('waiting');
  const [betAmount, setBetAmount] = useState(100);
  const [lastResult, setLastResult] = useState<SlotResult | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [autoSpinActive, setAutoSpinActive] = useState(false);
  const [autoSpinCount, setAutoSpinCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const autoSpinRef = useRef(false);
  const autoSpinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Валидация ставки
  const validateBet = useCallback((amount: number): { valid: boolean; error?: string } => {
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

  // ✅ ИСПРАВЛЕНО: Спин с актуальным балансом из gameStatus
  const spin = useCallback(async (): Promise<boolean> => {
    if (!telegramId || gameState !== 'waiting' || isProcessing) {
      console.log('🎰 Hook: Spin blocked:', { 
        telegramId: !!telegramId, 
        gameState, 
        isProcessing 
      });
      return false;
    }
    
    console.log('🎰 Hook: Starting spin with bet:', betAmount);
    
    // ✅ ИСПРАВЛЕНО: Используем gameStatus.balance как актуальный баланс
    const currentBalance = gameStatus.balance;
    console.log('🎰 Using current balance from gameStatus:', currentBalance);
    
    const validation = validateBet(betAmount);
    if (!validation.valid) {
      const errorKey = validation.error as keyof typeof t.errors;
      showToast(t.errors[errorKey] || t.errors.spinError, 'warning');
      return false;
    }

    if (!gameStatus.canPlayFree) {
      showToast(t.errors.dailyLimit, 'warning');
      return false;
    }

    const cleanBetAmount = Number(betAmount);
    
    try {
      setIsProcessing(true);
      setGameState('spinning');
      setLastResult(null);
      
      // ✅ ИСПРАВЛЕНО: Используем актуальный баланс
      const balanceAfterBet = currentBalance - cleanBetAmount;
      console.log('💰 Deducting bet visually (FIXED):', { 
        currentBalance, 
        betAmount: cleanBetAmount, 
        newBalance: balanceAfterBet 
      });
      
      if (onPlayerBalanceUpdate) {
        onPlayerBalanceUpdate(balanceAfterBet);
      }
      if (onLocalStatusUpdate) {
        onLocalStatusUpdate({ balance: balanceAfterBet });
      }
      
      console.log('🎰 Making API call to spin...');
      const result = await GalacticSlotsApi.spin(telegramId, cleanBetAmount);
      
      console.log('🎰 API result received:', result);
      
      if (result.success && result.result) {
        setLastResult(result.result);
        
        // 1. Крутим барабаны 3 секунды
        setTimeout(() => {
          setGameState('revealing');
          console.log('🎰 Animation: Revealing result...');
          
          // 2. Показываем результат 1 секунду
          setTimeout(() => {
            setGameState('finished');
            console.log('🎰 Animation: Showing winning lines...');
            
            const winAmount = result.result!.totalWin;
            const multiplier = winAmount > 0 ? Math.round(winAmount / cleanBetAmount) : 0;
            
            // Показываем уведомление о результате
            if (result.result!.isWin) {
              if (multiplier >= 10) {
                showToast(`🎰💎 БОЛЬШОЙ ВЫИГРЫШ! +${winAmount.toLocaleString()} CCC (x${multiplier})`, 'success', 5000);
              } else if (multiplier >= 3) {
                showToast(`🎰⭐ Хороший выигрыш! +${winAmount.toLocaleString()} CCC (x${multiplier})`, 'success', 4000);
              } else {
                showToast(`🎰✨ Выигрыш! +${winAmount.toLocaleString()} CCC (x${multiplier})`, 'success', 3000);
              }
            } else {
              showToast(`🎰💸 Проигрыш -${cleanBetAmount.toLocaleString()} CCC`, 'error', 2000);
            }
            
            // Получаем актуальный баланс из базы
            setTimeout(async () => {
              try {
                console.log('🔄 Fetching fresh status after win animation...');
                const freshStatus = await GalacticSlotsApi.getStatus(telegramId);
                if (freshStatus.success) {
                  console.log('✅ Fresh status after game:', {
                    balance: freshStatus.balance,
                    dailyGames: freshStatus.dailyGames,
                    gamesLeft: freshStatus.gamesLeft
                  });
                  
                  // Обновляем баланс с выигрышем
                  if (onPlayerBalanceUpdate) {
                    onPlayerBalanceUpdate(freshStatus.balance);
                  }
                  
                  // Обновляем статус игры
                  if (onLocalStatusUpdate) {
                    onLocalStatusUpdate({
                      balance: freshStatus.balance,
                      dailyGames: freshStatus.dailyGames,
                      dailyAds: freshStatus.dailyAds,
                      gamesLeft: freshStatus.gamesLeft,
                      canPlayFree: freshStatus.canPlayFree,
                      canWatchAd: freshStatus.canWatchAd
                    });
                  }
                  
                  // Дополнительная задержка для записи в базу
                  console.log('⏳ Waiting additional 1 second for database write...');
                  setTimeout(() => {
                    setIsProcessing(false);
                    console.log('✅ Processing unlocked, ready for next spin');
                  }, 1000);
                } else {
                  setIsProcessing(false);
                }
              } catch (statusError) {
                console.error('❌ Failed to fetch fresh status after game:', statusError);
                setIsProcessing(false);
              }
            }, 500);
            
            // Обновляем историю
            if (onHistoryUpdate) {
              setTimeout(onHistoryUpdate, 100);
            }
            
            // 3. Показываем результат 3 секунды, затем готов к новому спину
            setTimeout(() => {
              setGameState('waiting');
              console.log('🎰 Animation: Ready for next spin');
            }, 3000);
            
          }, 1000);
        }, 3000);
        
        return true;
      } else {
        // При ошибке возвращаем баланс и разблокируем
        if (onPlayerBalanceUpdate) {
          onPlayerBalanceUpdate(currentBalance);
        }
        if (onLocalStatusUpdate) {
          onLocalStatusUpdate({ balance: currentBalance });
        }
        
        setIsProcessing(false);
        setGameState('waiting');
        showToast(result.error || t.errors.spinError, 'error');
        return false;
      }
    } catch (error) {
      console.error('🎰❌ Hook: Spin error:', error);
      
      // При ошибке возвращаем баланс и разблокируем
      if (onPlayerBalanceUpdate) {
        onPlayerBalanceUpdate(currentBalance);
      }
      if (onLocalStatusUpdate) {
        onLocalStatusUpdate({ balance: currentBalance });
      }
      
      setIsProcessing(false);
      setGameState('waiting');
      showToast('Ошибка подключения к серверу', 'error');
      return false;
    }
  }, [telegramId, gameState, betAmount, gameStatus, validateBet, showToast, t, onPlayerBalanceUpdate, onLocalStatusUpdate, onHistoryUpdate, isProcessing]);

  // ✅ ИСПРАВЛЕНО: Автоспин БЕЗ локального кэша, с обновлением из базы
  const autoSpin = useCallback(async () => {
    if (!telegramId || !gameStatus.canPlayFree || autoSpinActive) {
      console.log('🎰 AutoSpin: Blocked:', { 
        telegramId: !!telegramId, 
        canPlayFree: gameStatus.canPlayFree, 
        autoSpinActive 
      });
      return;
    }
    
    console.log('🎰 AutoSpin: Starting...');
    
    setAutoSpinActive(true);
    autoSpinRef.current = true;
    setAutoSpinCount(0);
    
    const runAutoSpin = async () => {
      let spinsDone = 0;
      const maxSpins = 100;
      
      while (spinsDone < maxSpins && autoSpinRef.current) {
        console.log(`🎰 AutoSpin: Spin ${spinsDone + 1}/${maxSpins}`);
        
        try {
          // Перед каждым спином проверяем актуальный статус из базы
          console.log('🔄 AutoSpin: Checking fresh status from database...');
          const freshStatus = await GalacticSlotsApi.getStatus(telegramId);
          
          if (!freshStatus.success) {
            console.error('❌ AutoSpin: Failed to get status, stopping');
            showToast('Ошибка получения статуса, автоспин остановлен', 'error');
            break;
          }
          
          console.log('✅ AutoSpin: Fresh status:', {
            balance: freshStatus.balance,
            canPlayFree: freshStatus.canPlayFree,
            gamesLeft: freshStatus.gamesLeft
          });
          
          // Обновляем локальное состояние актуальными данными
          if (onPlayerBalanceUpdate) {
            onPlayerBalanceUpdate(freshStatus.balance);
          }
          if (onLocalStatusUpdate) {
            onLocalStatusUpdate({
              balance: freshStatus.balance,
              dailyGames: freshStatus.dailyGames,
              dailyAds: freshStatus.dailyAds,
              gamesLeft: freshStatus.gamesLeft,
              canPlayFree: freshStatus.canPlayFree,
              canWatchAd: freshStatus.canWatchAd
            });
          }
          
          // Проверяем можем ли играть
          if (!freshStatus.canPlayFree) {
            console.log('🎰 AutoSpin: No more games available, stopping');
            showToast('Игры закончились, автоспин остановлен', 'warning');
            break;
          }
          
          // Проверяем баланс
          if (freshStatus.balance < betAmount) {
            console.log('❌ AutoSpin: Insufficient balance, stopping');
            showToast(`Недостаточно средств (${freshStatus.balance} < ${betAmount}), автоспин остановлен`, 'error');
            break;
          }
          
          const success = await spin();
          if (!success) {
            console.log('🎰 AutoSpin: Spin failed, stopping');
            break;
          }
          
          spinsDone++;
          setAutoSpinCount(spinsDone);
          
          // Пауза между спинами (8 секунд)
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          // Проверяем, не остановили ли автоспин
          if (!autoSpinRef.current) {
            console.log('🎰 AutoSpin: Stopped by user');
            break;
          }
          
        } catch (error) {
          console.error('❌ AutoSpin: Error in spin loop:', error);
          showToast('Ошибка в автоспине, остановка', 'error');
          break;
        }
      }
      
      // Завершаем автоспин
      setAutoSpinActive(false);
      autoSpinRef.current = false;
      
      // Финальная синхронизация с базой данных
      try {
        console.log('🔄 AutoSpin: Final sync with database...');
        const finalStatus = await GalacticSlotsApi.getStatus(telegramId);
        if (finalStatus.success) {
          if (onPlayerBalanceUpdate) {
            onPlayerBalanceUpdate(finalStatus.balance);
          }
          if (onLocalStatusUpdate) {
            onLocalStatusUpdate({
              balance: finalStatus.balance,
              dailyGames: finalStatus.dailyGames,
              dailyAds: finalStatus.dailyAds,
              gamesLeft: finalStatus.gamesLeft,
              canPlayFree: finalStatus.canPlayFree,
              canWatchAd: finalStatus.canWatchAd
            });
          }
          console.log('✅ AutoSpin: Final balance from database:', finalStatus.balance);
        }
      } catch (finalSyncError) {
        console.warn('⚠️ AutoSpin: Final sync failed', finalSyncError);
      }
      
      if (spinsDone >= maxSpins) {
        showToast('🎰 Автоспин завершен! Выполнено 100 спинов', 'success');
      } else {
        showToast(`🎰 Автоспин остановлен! Выполнено ${spinsDone} спинов`, 'warning');
      }
    };
    
    runAutoSpin();
  }, [telegramId, autoSpinActive, betAmount, spin, showToast, onPlayerBalanceUpdate, onLocalStatusUpdate]);

  // Остановка автоспина
  const stopAutoSpin = useCallback(() => {
    console.log('🎰 AutoSpin: Stopping...');
    autoSpinRef.current = false;
    setAutoSpinActive(false);
    
    if (autoSpinIntervalRef.current) {
      clearInterval(autoSpinIntervalRef.current);
      autoSpinIntervalRef.current = null;
    }
    
    showToast('🎰 Автоспин остановлен', 'warning');
  }, [showToast]);

  // Реклама с локальным обновлением
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
      
      if (!adService.isAvailable()) {
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '10674';
        await adService.initialize(ADSGRAM_BLOCK_ID);
        
        if (!adService.isAvailable()) {
          showToast('Рекламный сервис недоступен. Поверните экран в вертикальное положение.', 'error');
          return;
        }
      }
      
      const adResult = await adService.showRewardedAd();
      console.log('🎰 Ad result for slots:', adResult);
      
      if (adResult.success) {
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
            message += ' [Партнер]';
          } else {
            message += ' [Реклама]';
          }
          
          showToast(message, 'success', 4000);
          
          // Локальное обновление статуса после рекламы
          const newStatus: Partial<GalacticSlotsStatus> = {
            dailyAds: gameStatus.dailyAds + 1,
            gamesLeft: gameStatus.gamesLeft + 1,
            canPlayFree: true,
            canWatchAd: gameStatus.dailyAds + 1 < 200
          };
          
          if (onLocalStatusUpdate) {
            onLocalStatusUpdate(newStatus);
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
      }, 500);
    }
  }, [telegramId, gameStatus, isWatchingAd, showToast, onLocalStatusUpdate]);

  // Безопасная установка ставки
  const setBetAmountSafe = useCallback((amount: number) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      console.warn('🎰 Invalid bet amount:', amount);
      return;
    }
    
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

  // Очистка при размонтировании
  const cleanup = useCallback(() => {
    autoSpinRef.current = false;
    if (autoSpinIntervalRef.current) {
      clearInterval(autoSpinIntervalRef.current);
      autoSpinIntervalRef.current = null;
    }
  }, []);

  return {
    gameState,
    betAmount,
    setBetAmount: setBetAmountSafe,
    lastResult,
    isWatchingAd,
    autoSpinActive,
    autoSpinCount,
    spin,
    autoSpin,
    stopAutoSpin,
    watchAd,
    setQuickBet,
    setMaxBet,
    validateBet,
    cleanup
  };
};