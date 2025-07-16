// galactic-slots/types/index.ts

export type SlotSymbol = '🌟' | '🚀' | '🌌' | '⭐' | '🌍' | '☄️' | '💀';

// Конфиг анимации для SlotMachine
export const ANIMATION_CONFIG = {
  SPIN_DURATION_BASE: 1500,
  SPIN_DURATION_INCREMENT: 300,
  SPIN_SPEED: 50,
  REVEAL_DELAY: 1000,
  WIN_ANIMATION_DURATION: 2000
};

export interface WinningLine {
  line: number;
  symbol: SlotSymbol;
  count: number;
  multiplier: number;
  hasWild: boolean;
  winAmount: number;
}

export interface SlotResult {
  gameId: string;
  symbols: SlotSymbol[];
  winningLines: WinningLine[];
  totalWin: number;
  profit: number;
  isWin: boolean;
  betAmount: number;
  timestamp?: number;
}

export interface GalacticSlotsStatus {
  success: boolean;
  balance: number;
  dailyGames: number;
  dailyAds: number;
  canPlayFree: boolean;
  canWatchAd: boolean;
  gamesLeft: number;
  adsLeft: number;
  minBet: number;
  maxBet: number;
  stats: {
    total_games: number;
    total_wins: number;
    total_losses: number;
    total_bet: number;
    total_won: number;
    best_streak: number;
    worst_streak: number;
  };
  error?: string;
}

export interface SpinResponse {
  success: boolean;
  result?: SlotResult;
  error?: string;
}

export interface AdWatchResponse {
  success: boolean;
  adsRemaining: number;
  adsWatched: number;
  maxAds: number;
  message?: string;
  error?: string;
}

export interface SlotGameHistory {
  id: number;
  date: string;
  betAmount: number;
  winAmount: number;
  profit: number;
  result: 'win' | 'loss';
  symbols: SlotSymbol[];
  winningLines: WinningLine[];
  jackpotContribution: number;
}

export interface SlotHistoryResponse {
  success: boolean;
  history: SlotGameHistory[];
  total: number;
  hasMore: boolean;
  error?: string;
}

export type SlotGameState = 'waiting' | 'spinning' | 'revealing' | 'finished';

export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
  duration: number;
}

export interface SymbolInfo {
  id: string;
  multipliers: number[];
  probability: number;
}

// ИСПРАВЛЕНО: Включает мертвый символ 💀
export const SYMBOL_INFO: Record<SlotSymbol, SymbolInfo> = {
  '🌟': { id: 'wild', multipliers: [10, 40, 200], probability: 0.0 },
  '🚀': { id: 'ship', multipliers: [8, 25, 150], probability: 0.0 },
  '🌌': { id: 'galaxy', multipliers: [5, 15, 80], probability: 0.0 },
  '⭐': { id: 'star', multipliers: [3, 8, 40], probability: 0.0 },
  '🌍': { id: 'planet', multipliers: [2, 5, 20], probability: 0.0 },
  '☄️': { id: 'asteroid', multipliers: [1, 2, 8], probability: 0.0 },
  '💀': { id: 'void', multipliers: [0, 0, 0], probability: 0.0 }
};

// 20 линий выплат
export const PAYLINES = [
  [0, 1, 2, 3, 4],     // Линия 1: верхний ряд
  [5, 6, 7, 8, 9],     // Линия 2: средний ряд  
  [10, 11, 12, 13, 14], // Линия 3: нижний ряд
  [0, 6, 12, 8, 4],    // Линия 4: диагональ
  [10, 6, 2, 8, 14],   // Линия 5: диагональ
  [5, 1, 7, 3, 9],     // Линия 6: зигзаг
  [5, 11, 7, 13, 9],   // Линия 7: зигзаг
  [0, 1, 7, 3, 4],     // Линия 8: V-образная
  [10, 11, 7, 13, 14], // Линия 9: V-образная
  [0, 6, 7, 8, 4],     // Линия 10: волна
  [10, 6, 7, 8, 14],   // Линия 11: волна
  [5, 1, 2, 3, 9],     // Линия 12: купол
  [5, 11, 12, 13, 9],  // Линия 13: купол
  [0, 11, 2, 13, 4],   // Линия 14: зигзаг
  [10, 1, 12, 3, 14],  // Линия 15: зигзаг
  [5, 6, 2, 8, 9],     // Линия 16: стрела вверх
  [5, 6, 12, 8, 9],    // Линия 17: стрела вниз
  [0, 6, 2, 8, 14],    // Линия 18: M-образная
  [10, 6, 12, 8, 4],   // Линия 19: W-образная
  [0, 1, 12, 3, 4]     // Линия 20: дуга
];

export interface SlotTranslations {
  title: string;
  subtitle: string;
  placeBet: string;
  betAmount: string;
  spin: string;
  gamesLeft: string;
  extraGame: string;
  watching: string;
  backToGames: string;
  loading: string;
  lastGames: string;
  fullHistory: string;
  time: string;
  bet: string;
  result: string;
  outcome: string;
  win: string;
  loss: string;
  errors: {
    betTooLow: string;
    betTooHigh: string;
    insufficientFunds: string;
    dailyLimit: string;
    spinError: string;
  };
  notifications: {
    winMessage: string;
    bigWinMessage: string;
    lossMessage: string;
    extraGameReceived: string;
  };
}

export {};