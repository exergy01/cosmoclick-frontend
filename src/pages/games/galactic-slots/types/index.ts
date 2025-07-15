// galactic-slots/types/index.ts

export type SlotSymbol = '🌟' | '🚀' | '🌌' | '⭐' | '🌍' | '☄️';

export interface WinningLine {
  line: number;
  symbol: SlotSymbol;
  count: number;
  multiplier: number;
  hasWild: boolean;
  winAmount: number;
}

// ИСПРАВЛЕНО: Полная синхронизация с backend ответом
export interface SlotResult {
  gameId: string;
  symbols: SlotSymbol[];
  winningLines: WinningLine[];
  totalWin: number;
  profit: number;
  isWin: boolean;
  betAmount: number;
  timestamp?: number; // Опционально для совместимости
}

// ИСПРАВЛЕНО: Синхронизация с backend статусом
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
    best_streak: number;    // Изменено с best_win
    worst_streak: number;   // Изменено с worst_loss
  };
  error?: string;
}

export interface SpinResponse {
  success: boolean;
  result?: SlotResult;
  error?: string;
}

// ИСПРАВЛЕНО: Полная синхронизация с backend ответом
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

// ИСПРАВЛЕНО: Сбалансированные символы (синхронизация с backend)
export interface SymbolInfo {
  id: string;
  multipliers: number[];
  probability: number;
}

export const SYMBOL_INFO: Record<SlotSymbol, SymbolInfo> = {
  '🌟': { id: 'wild', multipliers: [50, 500, 5000], probability: 0.8 },    // Исправлено
  '🚀': { id: 'ship', multipliers: [15, 75, 500], probability: 2.5 },      // Исправлено
  '🌌': { id: 'galaxy', multipliers: [10, 50, 250], probability: 5.0 },    // Исправлено
  '⭐': { id: 'star', multipliers: [8, 40, 150], probability: 8.0 },        // Без изменений
  '🌍': { id: 'planet', multipliers: [4, 15, 50], probability: 15.0 },      // Исправлено
  '☄️': { id: 'asteroid', multipliers: [2, 5, 15], probability: 68.7 }      // Исправлено
};

// 20 линий выплат (точная копия из backend)
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

// ИСПРАВЛЕНО: Убрал большой интерфейс локализации - упростил
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