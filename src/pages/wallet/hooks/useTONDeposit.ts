// src/pages/wallet/hooks/useTONDeposit.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useState } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

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
      const gameWalletAddress = process.env.REACT_APP_GAME_WALLET_ADDRESS || 'UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60';
      const nanoAmount = Math.floor(amount * 1_000_000_000);

      console.log('Отправляем TON транзакцию:', {
        amount: amount,
        nanoAmount: nanoAmount,
        from: userAddress,
        to: gameWalletAddress,
        playerId: playerId
      });

      // ПРОСТАЯ ТРАНЗАКЦИЯ БЕЗ payload
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
        messages: [
          {
            address: gameWalletAddress,
            amount: nanoAmount.toString()
            // Убираем payload для простоты
          }
        ]
      };
      
      // Отправляем транзакцию
      const result = await tonConnectUI.sendTransaction(transaction);
      
      console.log('Транзакция отправлена:', result);
      
      // СРАЗУ СООБЩАЕМ ОБ УСПЕХЕ И ПРЕДЛАГАЕМ ОБНОВИТЬ
      onSuccess?.(`Транзакция отправлена! Нажмите "Обновить баланс" через 1-2 минуты для зачисления средств.`);
      
      // ДОПОЛНИТЕЛЬНО: попробуем автоматически проверить через 5 секунд
      setTimeout(async () => {
        try {
          console.log('Автоматическая проверка депозита...');
          
          const checkResponse = await axios.post(`${API_URL}/api/wallet/ton-deposits/check-deposits`, {
            player_id: playerId,
            sender_address: userAddress
          });
          
          if (checkResponse.data.success && checkResponse.data.deposits_found > 0) {
            console.log('Депозит найден и зачислен автоматически!');
            onSuccess?.(`Депозит найден и зачислен автоматически! Баланс обновлен.`);
          } else {
            console.log('Автоматическая проверка: депозит еще не найден');
          }
          
        } catch (checkError: any) {
          console.log('Автоматическая проверка не удалась (это нормально):', checkError.message);
        }
      }, 5000);
            
      return true;

    } catch (err: any) {
      console.error('Ошибка отправки транзакции:', err);
      
      let errorMessage = 'Ошибка отправки транзакции';
      
      if (err.message?.includes('User declined') || err.message?.includes('declined')) {
        errorMessage = 'Вы отклонили транзакцию';
      } else if (err.message?.includes('Insufficient') || err.message?.includes('insufficient')) {
        errorMessage = 'Недостаточно TON в кошельке';
      } else if (err.message?.includes('Network') || err.message?.includes('network')) {
        errorMessage = 'Ошибка сети, попробуйте еще раз';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Превышено время ожидания, попробуйте еще раз';
      } else if (err.message?.includes('connection')) {
        errorMessage = 'Проблема с подключением к кошельку';
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