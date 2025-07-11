// cosmic-shells/utils/gameLogic.ts

export const GAME_CONSTANTS = {
    MIN_BET: 100,
    MAX_BET: 100000,
    WIN_MULTIPLIER: 2,
    DAILY_GAME_LIMIT: 5,
    MAX_AD_GAMES: 20,
    BIG_BET_THRESHOLD: 0.1 // 10% от баланса
  };
  
  export const validateBet = (betAmount: number, minBet: number, maxBet: number, balance: number) => {
    if (!betAmount || betAmount < minBet || betAmount > maxBet) {
      return { valid: false, error: 'betRange', params: { min: minBet, max: maxBet } };
    }
    
    if (betAmount > balance) {
      return { valid: false, error: 'insufficientFunds' };
    }
    
    return { valid: true };
  };
  
  export const isBigBet = (betAmount: number, balance: number): boolean => {
    return betAmount > balance * GAME_CONSTANTS.BIG_BET_THRESHOLD;
  };
  
  export const canStartGame = (canPlayFree: boolean, canWatchAd: boolean) => {
    return canPlayFree || canWatchAd;
  };
  
  export const calculateWin = (betAmount: number, isWin: boolean): { winAmount: number; profit: number } => {
    const winAmount = isWin ? betAmount * GAME_CONSTANTS.WIN_MULTIPLIER : 0;
    const profit = winAmount - betAmount;
    return { winAmount, profit };
  };
  
  export const getGameStateMessage = (gameState: string, t: any): string => {
    switch (gameState) {
      case 'waiting':
        return '🎯 Сделайте ставку чтобы начать игру';
      case 'shuffling':
        return `🌀 ${t.shuffling}`;
      case 'choosing':
        return `👆 ${t.chooseTarелка}`;
      case 'revealing':
        return `✨ ${t.revealing}`;
      default:
        return '';
    }
  };
  export {}; 
