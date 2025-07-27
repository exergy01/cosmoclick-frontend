// src/pages/wallet/types/index.ts
export interface Player {
  telegram_id: string;
  ton?: string | number;
  telegram_stars?: string | number;
  telegram_wallet?: string;
  color?: string;
  // ... другие поля игрока
}

export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  isProcessing: boolean;
}

export interface StarsModalProps extends WalletModalProps {
  starsAmount: string;
  setStarsAmount: (amount: string) => void;
  onSubmit: () => void;
}

export interface TONDepositModalProps extends WalletModalProps {
  depositAmount: string;
  setDepositAmount: (amount: string) => void;
  onSubmit: () => void;
}

export interface TONWithdrawModalProps extends WalletModalProps {
  withdrawAmount: string;
  setWithdrawAmount: (amount: string) => void;
  onSubmit: () => void;
  maxAmount: number;
  userAddress?: string;
}

export interface WalletBalance {
  ton: number;
  stars: number;
  tonUSD: number;
}

export interface WalletConnectionInfo {
  isConnected: boolean;
  address?: string;
  walletName?: string;
  platform?: string;
}