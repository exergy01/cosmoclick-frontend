// cosmic-shells/types/index.ts

export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
  duration: number;
}

export interface GameHistory {
  id: number;
  date: string;
  betAmount: number;
  winAmount: number;
  profit: number;
  result: 'win' | 'loss';
  chosenPosition: number | null;
  winningPosition: number | null;
  positions: string[];
  jackpotContribution: number;
  isCompleted: boolean;
}

export interface CosmicShellsStatus {
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
  winMultiplier: number;
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

export interface StartGameResponse {
  success: boolean;
  gameId?: string;
  message?: string;
  error?: string;
}

export interface GameResult {
  success: boolean;
  result?: {
    isWin: boolean;
    chosenPosition: number;
    winningPosition: number;
    positions: string[]; // ['galaxy', 'blackhole', 'blackhole']
    betAmount: number;
    winAmount: number;
    profit: number;
  };
  error?: string;
}

// ИСПРАВЛЕНО: Добавлены новые поля для прогресса рекламы
export interface AdWatchResult {
  success: boolean;
  adsRemaining: number;
  adsWatched?: number;  // ДОБАВЛЕНО
  maxAds?: number;      // ДОБАВЛЕНО
  message?: string;
  error?: string;
}

export interface GameHistoryResponse {
  success: boolean;
  history: GameHistory[];
  total: number;
  hasMore: boolean;
  error?: string;
}

export type GameState = 'waiting' | 'shuffling' | 'choosing' | 'revealing' | 'finished';

export interface CosmicShellsTranslations {
  title: string;
  howToPlay: string;
  rule1: string;
  rule2: string;
  rule3: string;
  rule4: string;
  rule5: string;
  placeBet: string;
  betAmount: string;
  possibleWin: string;
  startGame: string;
  newGame: string;
  backToGames: string;
  lastGames: string;
  fullHistory: string;
  time: string;
  bet: string;
  result: string;
  outcome: string;
  win: string;
  loss: string;
  profit: string;
  multiplier: string;
  gamesLeft: string;
  loading: string;
  shuffling: string;
  chooseShell: string;
  revealing: string;
  extraGame: string;
  watching: string;
  min: string;
  max: string;
  lost: string;
  emptyHistory: string;
  makeBetToStart: string;
  choose: string;
  gameStates: {
    waiting: string;
    shuffling: string;
    choosing: string;
    revealing: string;
  };
  errors: {
    betRange: string;
    insufficientFunds: string;
    dailyLimit: string;
    gameNotFound: string;
    gameCompleted: string;
    adLimit: string;
    createGame: string;
    makeChoice: string;
    watchAd: string;
  };
  notifications: {
    winMessage: string;
    lossMessage: string;
    extraGameReceived: string;
    confirmBigBet: string;
  };
}

export {};