import { useState } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

interface UseWalletConnectionProps {
  playerId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useWalletConnection = ({ playerId, onSuccess, onError }: UseWalletConnectionProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();

  const connectWallet = async (walletAddress: string): Promise<boolean> => {
    if (!playerId || !walletAddress) {
      onError?.('Missing player ID or wallet address');
      return false;
    }
    setIsProcessing(true);
    try {
      const response = await axios.post(`${API_URL}/api/wallet/wallet-connection/connect`, {
        telegram_id: playerId,
        wallet_address: walletAddress,
        signature: 'ton-connect-verified'
      });
      if (response.data.success) {
        onSuccess?.('Wallet connected successfully');
        return true;
      } else {
        throw new Error(response.data.error || 'Connection failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Wallet connection failed';
      onError?.(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const disconnectWallet = async (): Promise<boolean> => {
    if (!playerId) {
      onError?.('Missing player ID');
      return false;
    }
    setIsProcessing(true);
    try {
      await tonConnectUI.disconnect();
      const response = await axios.post(`${API_URL}/api/wallet/wallet-connection/disconnect`, {
        telegram_id: playerId
      });
      if (response.data.success) {
        onSuccess?.('Wallet disconnected successfully');
        return true;
      } else {
        throw new Error(response.data.error || 'Disconnection failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Wallet disconnection failed';
      onError?.(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { connectWallet, disconnectWallet, isProcessing };
};