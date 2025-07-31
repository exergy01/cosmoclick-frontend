import { useState, useCallback, useRef } from 'react';
import { SlotGameState, SlotResult, GalacticSlotsStatus } from '../types';
import { GalacticSlotsApi } from '../services/galacticSlotsApi';
import { adService } from '../../../../services/adsgramService';
import { formatTranslation } from '../utils/formatters';

export const useGalacticSlotsGame = (
  telegramId: string | undefined,
  gameStatus: GalacticSlotsStatus,
  showToast: (message: string, type?: 'success' | 'error' | 'warning', duration?: number) => void,
  t: (key: string) => string, // ✅ ИСПРАВЛЕНО: правильный тип
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
    
    try {
      setIsProcessing(true);
      setGameState('spinning');
      setLastResult(null);
      
      console.log('🔄 Getting fresh balance before spin...');
      const freshStatus = await GalacticSlotsApi.getStatus(telegramId);
      
      if (!freshStatus.success) {
        setIsProcessing(false);
        setGameState('waiting');
        showToast(t('errors.connectionError'), 'error');
        return false;
      }
      
      const currentBalance = freshStatus.balance;
      console.log('🎰 Using FRESH current balance from API:', currentBalance);
      
      if (onPlayerBalanceUpdate) {
        onPlayerBalanceUpdate(currentBalance);
      }
      if (onLocalStatusUpdate) {
        onLocalStatusUpdate({
          balance: currentBalance,
          dailyGames: freshStatus.dailyGames,
          dailyAds: freshStatus.dailyAds,
          gamesLeft: freshStatus.gamesLeft,
          canPlayFree: freshStatus.canPlayFree,
          canWatchAd: freshStatus.canWatchAd
        });
      }
      
      const numAmount = Number(betAmount);
      if (isNaN(numAmount) || !isFinite(numAmount)) {
        setIsProcessing(false);
        setGameState('waiting');
        showToast(t('games.slots.errors.spinError'), 'warning');
        return false;
      }
      
      if (numAmount < freshStatus.minBet) {
        setIsProcessing(false);
        setGameState('waiting');
        showToast(formatTranslation(t('games.slots.errors.betTooLow'), { min: freshStatus.minBet }), 'warning');
        return false;
      }
      
      if (numAmount > freshStatus.maxBet) {
        setIsProcessing(false);
        setGameState('waiting');
        showToast(formatTranslation(t('games.slots.errors.betTooHigh'), { max: freshStatus.maxBet }), 'warning');
        return false;
      }
      
      if (numAmount > currentBalance) {
        setIsProcessing(false);
        setGameState('waiting');
        showToast(t('games.slots.errors.insufficientFunds'), 'warning');
        return false;
      }

      if (!freshStatus.canPlayFree) {
        setIsProcessing(false);
        setGameState('waiting');
        showToast(t('games.slots.errors.dailyLimit'), 'warning');
        return false;
      }

      const cleanBetAmount = numAmount;
      const balanceAfterBet = currentBalance - cleanBetAmount;
      console.log('💰 Deducting bet correctly:', { 
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
        
        setTimeout(() => {
          setGameState('revealing');
          console.log('🎰 Animation: Revealing result...');
          
          setTimeout(() => {
            setGameState('finished');
            console.log('🎰 Animation: Showing winning lines...');
            
            const winAmount = result.result!.totalWin;
            const multiplier = winAmount > 0 ? Math.round(winAmount / cleanBetAmount) : 0;
            
            if (result.result!.isWin) {
              if (multiplier >= 10) {
                showToast(
                  formatTranslation(`🎰💎 ${t('games.slots.notifications.excellentWinMessage')}! +{amount} CCC (x{multiplier})`, {
                    amount: winAmount.toLocaleString(),
                    multiplier: multiplier.toString()
                  }), 
                  'success', 
                  5000
                );
              } else if (multiplier >= 3) {
                showToast(
                  formatTranslation(`🎰⭐ ${t('games.slots.notifications.goodWinMessage')}! +{amount} CCC (x{multiplier})`, {
                    amount: winAmount.toLocaleString(),
                    multiplier: multiplier.toString()
                  }), 
                  'success', 
                  4000
                );
              } else {
                showToast(
                  formatTranslation(`🎰✨ ${t('games.slots.notifications.winMessage')}! +{amount} CCC (x{multiplier})`, {
                    amount: winAmount.toLocaleString(),
                    multiplier: multiplier.toString()
                  }), 
                  'success', 
                  3000
                );
              }
            } else {
              showToast(
                formatTranslation(`🎰💸 ${t('games.slots.notifications.lossMessage')}! -{amount} CCC`, {
                  amount: cleanBetAmount.toLocaleString()
                }), 
                'error', 
                2000
              );
            }
            
            setTimeout(async () => {
              try {
                console.log('🔄 Fetching FINAL balance after game...');
                const finalStatus = await GalacticSlotsApi.getStatus(telegramId);
                if (finalStatus.success) {
                  console.log('✅ Final status after game:', {
                    balance: finalStatus.balance,
                    dailyGames: finalStatus.dailyGames,
                    gamesLeft: finalStatus.gamesLeft
                  });
                  
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
                  
                  setTimeout(() => {
                    setIsProcessing(false);
                    console.log('✅ Processing unlocked, ready for next spin');
                  }, 1000);
                } else {
                  setIsProcessing(false);
                }
              } catch (statusError) {
                console.error('❌ Failed to fetch final status after game:', statusError);
                setIsProcessing(false);
              }
            }, 500);
            
            if (onHistoryUpdate) {
              setTimeout(onHistoryUpdate, 100);
            }
            
            setTimeout(() => {
              setGameState('waiting');
              console.log('🎰 Animation: Ready for next spin');
            }, 3000);
            
          }, 1000);
        }, 3000);
        
        return true;
      } else {
        if (onPlayerBalanceUpdate) {
          onPlayerBalanceUpdate(currentBalance);
        }
        if (onLocalStatusUpdate) {
          onLocalStatusUpdate({ balance: currentBalance });
        }
        
        setIsProcessing(false);
        setGameState('waiting');
        showToast(result.error || t('games.slots.errors.spinError'), 'error');
        return false;
      }
    } catch (error) {
      console.error('🎰❌ Hook: Spin error:', error);
      
      setIsProcessing(false);
      setGameState('waiting');
      showToast(t('errors.connectionError'), 'error');
      return false;
    }
  }, [telegramId, gameState, betAmount, showToast, t, onPlayerBalanceUpdate, onLocalStatusUpdate, onHistoryUpdate, isProcessing]);

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
      const maxSpins = 20;
      
      while (spinsDone < maxSpins && autoSpinRef.current) {
        console.log(`🎰 AutoSpin: Spin ${spinsDone + 1}/${maxSpins}`);
        
        try {
          const success = await spin();
          if (!success) {
            console.log('🎰 AutoSpin: Spin failed, stopping');
            break;
          }
          
          spinsDone++;
          setAutoSpinCount(spinsDone);
          
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          if (!autoSpinRef.current) {
            console.log('🎰 AutoSpin: Stopped by user');
            break;
          }
          
        } catch (error) {
          console.error('❌ AutoSpin: Error in spin loop:', error);
          showToast(t('games.slots.errors.spinError') + ', ' + formatTranslation(t('games.slots.notifications.autoSpinStopped'), { count: spinsDone.toString() }), 'error');
          break;
        }
      }
      
      setAutoSpinActive(false);
      autoSpinRef.current = false;
      
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
        showToast(`🎰 ${t('games.slots.notifications.autoSpinCompleted')}`, 'success');
      } else {
        showToast(
          formatTranslation(`🎰 ${t('games.slots.notifications.autoSpinStopped')}`, {
            count: spinsDone.toString()
          }), 
          'warning'
        );
      }
    };    
    runAutoSpin();
  }, [telegramId, autoSpinActive, betAmount, spin, showToast, t, onPlayerBalanceUpdate, onLocalStatusUpdate]);

  const stopAutoSpin = useCallback(() => {
    console.log('🎰 AutoSpin: Stopping...');
    autoSpinRef.current = false;
    setAutoSpinActive(false);
    
    if (autoSpinIntervalRef.current) {
      clearInterval(autoSpinIntervalRef.current);
      autoSpinIntervalRef.current = null;
    }
    
    showToast(formatTranslation(`🎰 ${t('games.slots.notifications.autoSpinStopped')}`, { count: autoSpinCount.toString() }), 'warning');
  }, [showToast, t, autoSpinCount]);

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
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '13245';
        await adService.initialize(ADSGRAM_BLOCK_ID);
        
        if (!adService.isAvailable()) {
          showToast(t('errors.adServiceUnavailable'), 'error');
          return;
        }
      }
      
      const adResult = await adService.showRewardedAd();
      console.log('🎰 Ad result for slots:', adResult);
      
      if (adResult.success) {
        const apiResult = await GalacticSlotsApi.watchAd(telegramId);
        
        if (apiResult.success) {
          let message = `🎰 ${t('games.slots.notifications.extraGameReceived')}`;
          if (apiResult.adsWatched && apiResult.maxAds) {
            message = formatTranslation(`🎰 ${t('games.slots.notifications.extraGameReceived')} ({current}/{max})`, {
              current: apiResult.adsWatched.toString(),
              max: apiResult.maxAds.toString()
            });
          }
          
          const currentProvider = adService.getProviderInfo();
          if (currentProvider.name === 'mock') {
            message += ` ${t('notifications.testMode')}`;
          } else if (currentProvider.name === 'roboforex') {
            message += ` ${t('notifications.partnerMode')}`;
          } else {
            message += ` ${t('notifications.adMode')}`;
          }
          
          showToast(message, 'success', 4000);
          
          const newStatus: Partial<GalacticSlotsStatus> = {
            dailyAds: gameStatus.dailyAds + 1,
            gamesLeft: gameStatus.gamesLeft + 20,
            canPlayFree: true,
            canWatchAd: gameStatus.dailyAds + 1 < 10
          };
          
          if (onLocalStatusUpdate) {
            onLocalStatusUpdate(newStatus);
          }
          
        } else {
          showToast(apiResult.error || t('errors.adError'), 'error');
        }
      } else {
        showToast(adResult.error || t('errors.adError'), 'error');
      }
      
    } catch (error) {
      console.error('🎰❌ Watch ad error:', error);
      showToast(t('errors.adError'), 'error');
    } finally {
      setTimeout(() => {
        setIsWatchingAd(false);
      }, 500);
    }
  }, [telegramId, gameStatus, isWatchingAd, showToast, t, onLocalStatusUpdate]);

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

  const setQuickBet = useCallback((amount: number) => {
    setBetAmountSafe(Math.min(amount, gameStatus.maxBet, gameStatus.balance));
  }, [setBetAmountSafe, gameStatus.maxBet, gameStatus.balance]);

  const setMaxBet = useCallback(() => {
    const maxPossible = Math.min(gameStatus.maxBet, gameStatus.balance);
    setBetAmountSafe(maxPossible);
  }, [setBetAmountSafe, gameStatus.maxBet, gameStatus.balance]);

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