// src/pages/wallet/hooks/useTONWithdrawal.ts
import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

interface UseTONWithdrawalProps {
  playerId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onBalanceUpdate?: () => void;
}

export const useTONWithdrawal = ({ 
  playerId, 
  onSuccess, 
  onError, 
  onBalanceUpdate 
}: UseTONWithdrawalProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Создает заявку на вывод TON
   * Администратор должен обработать её вручную
   */
  const createWithdrawalRequest = async (
    amount: number, 
    walletAddress: string
  ): Promise<boolean> => {
    
    // Валидация
    if (!playerId) {
      onError?.('ID игрока не найден');
      return false;
    }

    if (!walletAddress) {
      onError?.('Адрес кошелька не указан');
      return false;
    }

    if (isNaN(amount) || amount <= 0 || amount < 0.1) {
      onError?.('Минимальная сумма вывода: 0.1 TON');
      return false;
    }

    setIsProcessing(true);

    try {
      console.log('Creating withdrawal request:', { playerId, amount, walletAddress });

      // Создаем заявку на вывод
      const response = await axios.post(`${API_URL}/api/wallet/ton-withdrawals/prepare`, {
        telegram_id: playerId,
        amount: amount,
        wallet_address: walletAddress
      });

      if (response.data.success) {
        const message = `Заявка на вывод ${amount} TON создана! Администратор обработает её в ближайшее время.`;
        console.log('Withdrawal request created successfully');
        onSuccess?.(message);
        onBalanceUpdate?.(); // Обновляем баланс
        return true;
      } else {
        throw new Error(response.data.error || 'Ошибка создания заявки на вывод');
      }

    } catch (err: any) {
      console.error('Withdrawal request error:', err);
      
      let errorMessage = 'Ошибка создания заявки на вывод';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 400) {
        errorMessage = 'Неверные данные запроса';
      } else if (err.response?.status === 404) {
        errorMessage = 'Игрок не найден';
      } else if (err.response?.status === 500) {
        errorMessage = 'Ошибка сервера, попробуйте позже';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Ошибка сети';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      onError?.(errorMessage);
      return false;
      
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createWithdrawalRequest,
    isProcessing
  };
};