// src/pages/wallet/hooks/useTONDeposit.ts - С АВТОМАТИЧЕСКОЙ ПРОВЕРКОЙ
import { useState } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

interface UseTONDepositProps {
  playerId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onBalanceUpdate?: () => void; // Колбэк для обновления баланса
}

export const useTONDeposit = ({ playerId, onSuccess, onError, onBalanceUpdate }: UseTONDepositProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  // Функция автоматической проверки депозитов
  const autoCheckDeposits = async (): Promise<boolean> => {
    if (!playerId) return false;

    try {
      console.log('Auto-checking deposits after transaction...');
      
      const response = await axios.post(`${API_URL}/api/wallet/ton-deposits/check-deposits`, {
        player_id: playerId,
        sender_address: userAddress
      });
      
      if (response.data.success && response.data.deposits_found > 0) {
        const { deposits_found, total_amount } = response.data;
        onSuccess?.(`Депозит зачислен автоматически! Получено ${total_amount} TON`);
        onBalanceUpdate?.(); // Обновляем баланс игрока
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Auto-check failed, user will need manual refresh:', error);
      return false;
    }
  };

  const sendDepositTransaction = async (amount: number): Promise<boolean> => {
    console.log('Starting TON deposit transaction:', { amount, userAddress, playerId });

    // Валидация
    if (!tonConnectUI) {
      onError?.('TON Connect не инициализирован');
      return false;
    }

    if (!userAddress) {
      onError?.('Сначала подключите кошелек TON');
      return false;
    }

    if (!playerId) {
      onError?.('ID игрока не найден');
      return false;
    }

    if (isNaN(amount) || amount <= 0 || amount < 0.01) {
      onError?.('Минимальная сумма пополнения: 0.01 TON');
      return false;
    }

    setIsProcessing(true);

    try {
      const gameWalletAddress = process.env.REACT_APP_GAME_WALLET_ADDRESS || 'UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60';
      const nanoAmount = Math.floor(amount * 1_000_000_000);

      // Создаем транзакцию
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: gameWalletAddress,
          amount: nanoAmount.toString()
        }]
      };
      
      // Отправляем через TON Connect
      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('Transaction sent successfully:', result);
      
      // Показываем сообщение о том что транзакция отправлена
      onSuccess?.('Транзакция отправлена! Проверяем зачисление...');
      
      // АВТОМАТИЧЕСКАЯ ПРОВЕРКА депозитов через 3 секунды
      setTimeout(async () => {
        const autoSuccess = await autoCheckDeposits();
        
        if (!autoSuccess) {
          // Пробуем еще раз через 10 секунд
          setTimeout(async () => {
            const secondTry = await autoCheckDeposits();
            
            if (!secondTry) {
              // Если автоматически не получилось - показываем инструкцию
              onSuccess?.('Транзакция отправлена успешно! Если баланс не обновился автоматически, нажмите "Обновить баланс" через 1-2 минуты.');
            }
          }, 10000);
        }
      }, 3000);
      
      return true;

    } catch (err: any) {
      console.error('TON deposit transaction error:', err);
      
      let errorMessage = 'Ошибка отправки транзакции';
      
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