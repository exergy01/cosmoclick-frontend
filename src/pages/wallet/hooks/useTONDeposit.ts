// src/pages/wallet/hooks/useTONDeposit.ts - ОЧИЩЕННАЯ ВЕРСИЯ
import { useState } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';

interface UseTONDepositProps {
  playerId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useTONDeposit = ({ playerId, onSuccess, onError }: UseTONDepositProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  const sendDepositTransaction = async (amount: number): Promise<boolean> => {
    // Валидация
    if (!tonConnectUI || !userAddress) {
      onError?.('Сначала подключите кошелек');
      return false;
    }

    if (!playerId) {
      onError?.('Player ID не найден');
      return false;
    }

    if (isNaN(amount) || amount <= 0) {
      onError?.('Неверная сумма');
      return false;
    }

    if (amount < 0.01) {
      onError?.('Минимальная сумма пополнения: 0.01 TON');
      return false;
    }

    setIsProcessing(true);

    try {
      // Адрес игрового кошелька из переменных окружения
      const gameWalletAddress = process.env.REACT_APP_GAME_WALLET_ADDRESS || 'UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60';
      
      // Сумма в нанотонах
      const nanoAmount = Math.floor(amount * 1_000_000_000);

      // Упрощенная транзакция без payload
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
        messages: [
          {
            address: gameWalletAddress,
            amount: nanoAmount.toString()
            // Без payload - самая простая транзакция
          }
        ]
      };
      
      // Отправляем транзакцию
      const result = await tonConnectUI.sendTransaction(transaction);
      
      const shortHash = result.boc?.slice(0, 10) || 'unknown';
      onSuccess?.(`Транзакция отправлена! Hash: ${shortHash}...`);
      
      return true;

    } catch (err: any) {
      // Детальная диагностика ошибок
      let errorMessage = 'Ошибка отправки транзакции';
      
      if (err.message?.includes('User declined') || 
          err.message?.includes('rejected') ||
          err.message?.includes('cancelled') ||
          err.message?.includes('user rejected')) {
        errorMessage = 'Вы отклонили транзакцию';
      } else if (err.message?.includes('Insufficient') || 
                 err.message?.includes('balance') ||
                 err.message?.includes('not enough')) {
        errorMessage = 'Недостаточно TON в кошельке';
      } else if (err.message?.includes('Network') || 
                 err.message?.includes('timeout') ||
                 err.message?.includes('connection')) {
        errorMessage = 'Ошибка сети, попробуйте еще раз';
      } else if (err.message?.includes('Invalid') || 
                 err.message?.includes('address') ||
                 err.message?.includes('format')) {
        errorMessage = 'Неверный адрес кошелька';
      } else if (err.message?.includes('подключиться') ||
                 err.message?.includes('connect') ||
                 err.message?.includes('wallet')) {
        errorMessage = 'Ошибка подключения к кошельку';
      } else if (err.code) {
        errorMessage = `Ошибка ${err.code}: ${err.message}`;
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
    sendDepositTransaction,
    isProcessing
  };
};