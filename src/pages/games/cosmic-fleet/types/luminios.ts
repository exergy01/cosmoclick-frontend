export interface LuminiosBalance {
  balance: number;
  totalSpent: number;
  totalEarned: number;
}

export interface LuminiosTransaction {
  id: string;
  type: 'exchange' | 'purchase' | 'reward';
  amount: number;
  cccAmount?: number;
  exchangeRate?: number;
  description: string;
  timestamp: number;
}

export interface ExchangeRequest {
  telegramId: number;
  cccAmount: number;
  luminiosAmount: number;
}

export interface CosmicFleetPlayer {
  telegramId: number;
  luminiosBalance: number;
  totalBattles: number;
  wins: number;
  losses: number;
  rankPoints: number;
  createdAt: number;
  updatedAt: number;
}

export const EXCHANGE_RATE = 10; // 1 CCC = 10 Luminios