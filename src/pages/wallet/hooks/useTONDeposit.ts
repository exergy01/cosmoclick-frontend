// src/pages/wallet/hooks/useTONDeposit.ts - ОКОНЧАТЕЛЬНО ИСПРАВЛЕННАЯ ВЕРСИЯ
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
    console.log('Starting TON deposit transaction:', { amount, userAddress, playerId });

    // Валидация
    if (!tonConnectUI) {
      console.error('TON Connect UI not available');
      onError?.('TON Connect не инициализирован');
      return false;
    }

    if (!userAddress) {
      console.error('User address not available');
      onError?.('Сначала подключите кошелек TON');
      return false;
    }

    if (!playerId) {
      console.error('Player ID not provided');
      onError?.('ID игрока не найден');
      return false;
    }

    if (isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', amount);
      onError?.('Неверная сумма');
      return false;
    }

    if (amount < 0.01) {
      console.error('Amount too small:', amount);
      onError?.('Минимальная сумма пополнения: 0.01 TON');
      return false;
    }

    setIsProcessing(true);

    try {
      const gameWalletAddress = process.env.REACT_APP_GAME_WALLET_ADDRESS || 'UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60';
      const nanoAmount = Math.floor(amount * 1_000_000_000);

      console.log('Preparing transaction:', {
        from: userAddress,
        to: gameWalletAddress,
        amount: amount,
        nanoAmount: nanoAmount
      });

      // Создаем простую транзакцию
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
        messages: [
          {
            address: gameWalletAddress,
            amount: nanoAmount.toString()
          }
        ]
      };
      
      console.log('Sending transaction through TON Connect:', transaction);
      
      // Отправляем транзакцию через TON Connect
      const result = await tonConnectUI.sendTransaction(transaction);
      
      console.log('Transaction sent successfully:', result);
      
      // Сообщаем об успехе
      onSuccess?.('Транзакция отправлена успешно! Нажмите "Обновить баланс" через 1-2 минуты для зачисления.');
      
      return true;

    } catch (err: any) {
      console.error('TON deposit transaction error:', err);
      
      let errorMessage = 'Ошибка отправки транзакции';
      
      // Обработка различных типов ошибок
      if (err.message?.includes('User declined') || err.message?.includes('declined') || err.message?.includes('rejected')) {
        errorMessage = 'Транзакция была отклонена';
      } else if (err.message?.includes('Insufficient') || err.message?.includes('insufficient')) {
        errorMessage = 'Недостаточно TON в кошельке';
      } else if (err.message?.includes('Network') || err.message?.includes('network')) {
        errorMessage = 'Ошибка сети, попробуйте еще раз';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Превышено время ожидания';
      } else if (err.message?.includes('connection')) {
        errorMessage = 'Проблема с подключением к кошельку';
      } else if (err.message?.includes('not connected')) {
        errorMessage = 'Кошелек не подключен';
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