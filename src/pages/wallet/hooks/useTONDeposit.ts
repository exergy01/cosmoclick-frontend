// src/pages/wallet/hooks/useTONDeposit.ts - БЕЗ SETTIMEOUT + УЛУЧШЕННАЯ ПРОВЕРКА
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

      console.log('🚀 Отправляем TON транзакцию:', {
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
      
      console.log('✅ Транзакция отправлена:', result);
      
      // НЕМЕДЛЕННАЯ ПРОВЕРКА ВМЕСТО SETTIMEOUT
      onSuccess?.(`Транзакция отправлена! Используйте кнопку "Обновить баланс" для зачисления.`);
      
      // ДОПОЛНИТЕЛЬНО: попробуем проверить сразу (но не будем полагаться на это)
      try {
        console.log('🔍 Попытка немедленной проверки депозита...');
        
        const checkResponse = await axios.post(`${API_URL}/api/wallet/check-deposit-by-address`, {
          player_id: playerId,
          expected_amount: amount,
          sender_address: userAddress,
          game_wallet: gameWalletAddress
        });
        
        if (checkResponse.data.success && checkResponse.data.message !== 'Deposit already processed') {
          console.log('✅ Депозит найден и зачислен немедленно!');
          onSuccess?.(`🎉 Депозит найден и зачислен автоматически!`);
        } else {
          console.log('⏳ Депозит еще не найден, нужно использовать кнопку обновления');
          // Сообщение уже отправлено выше
        }
        
      } catch (checkError: any) {
        console.log('⚠️ Немедленная проверка не удалась (это нормально):', checkError.message);
        // Сообщение уже отправлено выше
      }
            
      return true;

    } catch (err: any) {
      console.error('❌ Ошибка отправки транзакции:', err);
      
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