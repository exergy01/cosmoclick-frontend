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

export interface SlotResult {
  gameId: string;
  symbols: SlotSymbol[];
  winningLines: WinningLine[];
  totalWin: number;
  profit: number;
  isWin: boolean;
  betAmount: number;
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
    best_win: number;
    worst_loss: number;
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

export const SYMBOL_INFO: Record<SlotSymbol, SymbolInfo> = {
  '🌟': { id: 'wild', multipliers: [50, 500, 5000], probability: 0.5 },
  '🚀': { id: 'ship', multipliers: [15, 75, 500], probability: 2.0 },
  '🌌': { id: 'galaxy', multipliers: [10, 50, 250], probability: 4.0 },
  '⭐': { id: 'star', multipliers: [8, 40, 150], probability: 8.0 },
  '🌍': { id: 'planet', multipliers: [4, 15, 50], probability: 20.0 },
  '☄️': { id: 'asteroid', multipliers: [2, 5, 15], probability: 65.5 }
};

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

export interface GalacticSlotsTranslations {
  title: string;
  subtitle: string;
  howToPlay: string;
  placeBet: string;
  betAmount: string;
  spin: string;
  autoSpin: string;
  maxBet: string;
  gamesLeft: string;
  extraGame: string;
  watching: string;
  backToGames: string;
  paytable: string;
  history: string;
  fullHistory: string;
  totalWin: string;
  bigWin: string;
  megaWin: string;
  loading: string;
  spinning: string;
  celebrating: string;
  symbols: {
    wild: string;
    ship: string;
    galaxy: string;
    star: string;
    planet: string;
    asteroid: string;
  };
  rules: {
    rule1: string;
    rule2: string;
    rule3: string;
    rule4: string;
    rule5: string;
  };
  errors: {
    betRange: string;
    insufficientFunds: string;
    dailyLimit: string;
    spinError: string;
    watchAd: string;
  };
  notifications: {
    winMessage: string;
    bigWinMessage: string;
    lossMessage: string;
    extraGameReceived: string;
  };
}

export {};