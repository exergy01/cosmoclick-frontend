import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

interface UseDepositCheckProps {
  playerId?: string;
  userAddress?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useDepositCheck = ({ playerId, userAddress, onSuccess, onError }: UseDepositCheckProps = {}) => {
  const [isChecking, setIsChecking] = useState(false);

  const checkDeposits = async (): Promise<boolean> => {
    if (!playerId) {
      onError?.('Player ID not found');
      return false;
    }
    setIsChecking(true);
    try {
      console.log('Checking deposits for player:', playerId);
      const response = await axios.post(`${API_URL}/api/wallet/ton-deposits/check-deposits`, {
        player_id: playerId,
        sender_address: userAddress
      });
      if (response.data.success) {
        if (response.data.deposits_found > 0) {
          const { deposits_found, total_amount } = response.data;
          onSuccess?.(`✅ SUCCESS! Found and processed ${deposits_found} deposits totaling ${total_amount} TON!`);
        } else {
          onSuccess?.('Deposit check complete. No new deposits found.');
        }
        return true;
      } else {
        throw new Error(response.data.error || 'Deposit check failed');
      }
    } catch (err: any) {
      let errorMessage = 'Deposit check failed: ';
      if (err.response?.status === 500) {
        errorMessage += 'Server problem, try again later.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage += 'Network problem, check connection.';
      } else if (err.message?.includes('timeout')) {
        errorMessage += 'Request timeout, try again.';
      } else {
        errorMessage += err.response?.data?.error || err.message || 'Unknown error';
      }
      onError?.(errorMessage);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return { checkDeposits, isChecking };
};