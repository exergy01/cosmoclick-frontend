// cosmic-shells/hooks/useCosmicShellsGame.ts
// ✅ ИСПРАВЛЕНО: Переводы через react-i18next

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
  t: (key: string) => string, // ✅ ИСПРАВЛЕНО: правильный тип
  onLocalStatusUpdate?: (newStatus: Partial<CosmicShellsStatus>) => void,
  onHistoryUpdate?: () => void,
  onPlayerBalanceUpdate?: (newBalance: number) => void
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
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '13245';
        await adService.initialize(ADSGRAM_BLOCK_ID);
        if (process.env.NODE_ENV === 'development') console.log('🛸 Ad Service initialized');
      } catch (error) {
        console.error('🛸❌ Ad service initialization failed:', error);
      }
    };
    initAds();
  }, []);

  // ✅ ИСПРАВЛЕНО: Функция получения сообщения об ошибке валидации
  const getValidationErrorMessage = (validation: any) => {
    switch (validation.error) {
      case 'betRange':
        return formatTranslation(t('games.shells.errors.betRange'), validation.params || {});
      case 'insufficientFunds':
        return t('games.shells.errors.insufficientFunds');
      default:
        return t('games.shells.errors.createGame');
    }
  };

  // Простая функция startGame
  const startGame = useCallback(async () => {
    if (!telegramId || gameState !== 'waiting') return;
    
    if (process.env.NODE_ENV === 'development') console.log('🛸 Starting game with bet:', betAmount);
    
    // Валидация ставки
    const validation = validateBet(betAmount, gameStatus.minBet, gameStatus.maxBet, gameStatus.balance);
    if (!validation.valid) {
      const errorMessage = getValidationErrorMessage(validation);
      showToast(errorMessage, 'warning');
      return;
    }

    // Проверка лимитов
    if (!gameStatus.canPlayFree) {
      showToast(t('games.shells.errors.dailyLimit'), 'warning');
      return;
    }

    // Предупреждение о большой ставке
    if (isBigBet(betAmount, gameStatus.balance)) {
      const confirmed = window.confirm(t('games.shells.notifications.confirmBigBet'));
      if (!confirmed) return;
    }

    try {
      // ✅ ДОБАВЛЕНО: Получаем свежий баланс перед игрой
      const freshStatus = await CosmicShellsApi.getStatus(telegramId);
      if (!freshStatus.success) {
        showToast(t('games.shells.errors.createGame'), 'error');
        return;
      }
      
      const currentBalance = freshStatus.balance;
      if (process.env.NODE_ENV === 'development') console.log('🛸 Fresh balance before game:', currentBalance);
      
      // ✅ ДОБАВЛЕНО: Мгновенно показываем баланс после ставки
      const balanceAfterBet = currentBalance - betAmount;
      if (onPlayerBalanceUpdate) {
        onPlayerBalanceUpdate(balanceAfterBet);
      }
      if (onLocalStatusUpdate) {
        onLocalStatusUpdate({ 
          balance: balanceAfterBet,
          dailyGames: freshStatus.dailyGames,
          gamesLeft: freshStatus.gamesLeft,
          canPlayFree: freshStatus.canPlayFree,
          canWatchAd: freshStatus.canWatchAd
        });
      }
      
      const result = await CosmicShellsApi.startGame(telegramId, betAmount);
      
      if (result.success && result.gameId) {
        setCurrentGameId(result.gameId);
        setGameState('shuffling');
        setGameResult(null);
        
        if (process.env.NODE_ENV === 'development') console.log('🛸 Game started successfully');
        
        // Переходим к выбору через 5 секунд
        setTimeout(() => {
          setGameState('choosing');
        }, 5000);
        
      } else {
        showToast(result.error || t('games.shells.errors.createGame'), 'error');
      }
    } catch (err) {
      showToast(t('games.shells.errors.createGame'), 'error');
    }
  }, [telegramId, gameState, betAmount, gameStatus, showToast, t, onPlayerBalanceUpdate, onLocalStatusUpdate]);

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
            const message = formatTranslation(t('games.shells.notifications.winMessage'), {
              amount: result.result!.winAmount,
              profit: result.result!.profit
            });
            showToast(message, 'success', 5000);
          } else {
            const message = formatTranslation(t('games.shells.notifications.lossMessage'), {
              amount: result.result!.betAmount
            });
            showToast(message, 'error', 4000);
          }
          
          // Автоматически скрываем результат через 4 секунды
          setTimeout(() => {
            setGameState('waiting');
            setGameResult(null);
            setCurrentGameId(null);
            
            // ✅ ДОБАВЛЕНО: Получаем финальный баланс из базы и обновляем
            setTimeout(async () => {
              try {
                const finalStatus = await CosmicShellsApi.getStatus(telegramId);
                if (finalStatus.success) {
                  if (process.env.NODE_ENV === 'development') console.log('🛸 Final balance from database:', finalStatus.balance);
                  
                  if (onPlayerBalanceUpdate) {
                    onPlayerBalanceUpdate(finalStatus.balance);
                  }
                  if (onLocalStatusUpdate) {
                    onLocalStatusUpdate({
                      balance: finalStatus.balance,
                      dailyGames: finalStatus.dailyGames,
                      gamesLeft: finalStatus.gamesLeft,
                      canPlayFree: finalStatus.canPlayFree,
                      canWatchAd: finalStatus.canWatchAd
                    });
                  }
                  if (onHistoryUpdate) {
                    onHistoryUpdate();
                  }
                }
              } catch (error) {
                console.error('❌ Failed to get final status:', error);
              }
            }, 500);
          }, 4000);
          
        }, 2000);
        
      } else {
        setGameState('choosing');
        showToast(result.error || t('games.shells.errors.makeChoice'), 'error');
      }
    } catch (err) {
      setGameState('choosing');
      showToast(t('games.shells.errors.makeChoice'), 'error');
    }
  }, [telegramId, currentGameId, gameState, showToast, t, onPlayerBalanceUpdate, onLocalStatusUpdate, onHistoryUpdate]);

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
      if (process.env.NODE_ENV === 'development') console.log('🛸 Starting ad watch...');
      
      if (!adService.isAvailable()) {
        await adService.initialize();
        if (!adService.isAvailable()) {
          showToast(t('errors.adServiceUnavailable'), 'error');
          return;
        }
      }
      
      const adResult = await adService.showRewardedAd();
      
      if (adResult.success) {
        const apiResult = await CosmicShellsApi.watchAd(telegramId);
        
        if (apiResult.success) {
          let message = t('games.shells.notifications.extraGameReceived');
          if (apiResult.adsWatched && apiResult.maxAds) {
            message = `${t('games.shells.notifications.extraGameReceived')} (${apiResult.adsWatched}/${apiResult.maxAds})`;
          }
          
          showToast(message, 'success', 4000);
          
          // ✅ ДОБАВЛЕНО: Локальное обновление статуса
          const newStatus: Partial<CosmicShellsStatus> = {
            dailyAds: gameStatus.dailyAds + 1,
            gamesLeft: gameStatus.gamesLeft + 20, // 20 игр за рекламу
            canPlayFree: true,
            canWatchAd: gameStatus.dailyAds + 1 < 10 // максимум 10 реклам
          };
          
          if (onLocalStatusUpdate) {
            onLocalStatusUpdate(newStatus);
          }
          
        } else {
          showToast(apiResult.error || t('games.shells.errors.watchAd'), 'error');
        }
      } else {
        showToast(adResult.error || t('errors.adError'), 'error');
      }
      
    } catch (error) {
      console.error('🛸❌ Watch ad error:', error);
      showToast(t('errors.adError'), 'error');
    } finally {
      setTimeout(() => {
        setIsWatchingAd(false);
      }, 1000);
    }
  }, [telegramId, gameStatus.canWatchAd, isWatchingAd, showToast, t, onLocalStatusUpdate]);

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