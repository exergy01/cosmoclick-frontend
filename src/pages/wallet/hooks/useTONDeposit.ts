// src/pages/wallet/hooks/useTONDeposit.ts - С НЕМЕДЛЕННОЙ ПРОВЕРКОЙ
import { useState } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface UseTONDepositProps {
  playerId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useTONDeposit = ({ playerId, onSuccess, onError }: UseTONDepositProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  // Функция проверки депозита (можно вызвать отдельно)
  const checkDeposit = async (amount: number): Promise<boolean> => {
    if (!playerId || !userAddress) {
      onError?.('Данные игрока не найдены');
      return false;
    }

    setIsChecking(true);

    try {
      console.log('Проверяем депозит вручную...');
      
      const checkResponse = await axios.post(`${API_URL}/api/wallet/check-deposit-by-address`, {
        player_id: playerId,
        expected_amount: amount,
        sender_address: userAddress,
        game_wallet: process.env.REACT_APP_GAME_WALLET_ADDRESS || 'UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60'
      });
      
      if (checkResponse.data.success) {
        onSuccess?.('Средства найдены и зачислены на баланс!');
        return true;
      } else {
        onError?.('Депозит пока не найден. Попробуйте через минуту.');
        return false;
      }
      
    } catch (error: any) {
      console.error('Ошибка проверки депозита:', error);
      onError?.('Ошибка проверки. Попробуйте позже.');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const sendDepositTransaction = async (amount: number): Promise<boolean> => {
    if (!tonConnectUI || !userAddress) {
      onError?.('Сначала подключите кошелек');
      return false;
    }

    if (!playerId) {
      onError?.('Player ID не найден');
      return false;
    }

    if (isNaN(amount) || amount <= 0 || amount < 0.01) {
      onError?.('Минимальная сумма: 0.01 TON');
      return false;
    }

    setIsProcessing(true);

    try {
      const gameWalletAddress = process.env.REACT_APP_GAME_WALLET_ADDRESS || 'UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60';
      const nanoAmount = Math.floor(amount * 1_000_000_000);

      // Простая транзакция без payload
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: gameWalletAddress,
            amount: nanoAmount.toString()
          }
        ]
      };
      
      console.log('Отправляем TON транзакцию:', {
        amount: amount,
        to: gameWalletAddress,
        from: userAddress
      });
      
      const result = await tonConnectUI.sendTransaction(transaction);
      
      const shortHash = result.boc?.slice(0, 10) || 'unknown';
      
      // Сначала уведомляем об отправке
      onSuccess?.(`Транзакция отправлена! Hash: ${shortHash}...`);

      // НЕМЕДЛЕННАЯ ПРОВЕРКА (может не найти, если транзакция еще не в блокчейне)
      setTimeout(async () => {
        try {
          console.log('Пытаемся найти депозит через 10 секунд...');
          
          const quickCheck = await axios.post(`${API_URL}/api/wallet/check-deposit-by-address`, {
            player_id: playerId,
            expected_amount: amount,
            sender_address: userAddress,
            game_wallet: gameWalletAddress
          });
          
          if (quickCheck.data.success) {
            console.log('Депозит найден и зачислен быстро!');
            onSuccess?.('Депозит зачислен автоматически!');
          } else {
            console.log('Депозит пока не найден, нужно подождать');
            onSuccess?.('Транзакция в блокчейне. Нажмите "Проверить зачисление" через 1-2 минуты.');
          }
          
        } catch (checkError: any) {
          console.log('Быстрая проверка не удалась:', checkError.message);
          onSuccess?.('Транзакция отправлена. Используйте кнопку проверки через минуту.');
        }
      }, 10000); // 10 секунд
      
      return true;

    } catch (err: any) {
      console.error('Ошибка отправки TON:', err);
      
      let errorMessage = 'Ошибка отправки транзакции';
      
      if (err.message?.includes('User declined')) {
        errorMessage = 'Вы отклонили транзакцию';
      } else if (err.message?.includes('Insufficient')) {
        errorMessage = 'Недостаточно TON в кошельке';
      } else if (err.message?.includes('Network')) {
        errorMessage = 'Ошибка сети, попробуйте еще раз';
      }
      
      onError?.(errorMessage);
      return false;
      
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    sendDepositTransaction,
    checkDeposit, // Добавляем функцию ручной проверки
    isProcessing,
    isChecking
  };
};