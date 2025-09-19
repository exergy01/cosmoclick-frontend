// src/pages/wallet/hooks/useTONDeposit.ts - ОРИГИНАЛЬНАЯ ВЕРСИЯ + ПРОВЕРКА
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
      // ОРИГИНАЛЬНАЯ ЛОГИКА - БЕЗ ИЗМЕНЕНИЙ
      const gameWalletAddress = process.env.REACT_APP_GAME_WALLET_ADDRESS || 'UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60';
      const nanoAmount = Math.floor(amount * 1_000_000_000);

      // ПРОСТАЯ ТРАНЗАКЦИЯ - КАК БЫЛО РАНЬШЕ
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: gameWalletAddress,
            amount: nanoAmount.toString()
            // БЕЗ payload - как работало раньше
          }
        ]
      };
      
      // Отправляем транзакцию
      const result = await tonConnectUI.sendTransaction(transaction);
      
      const shortHash = result.boc?.slice(0, 10) || 'unknown';
      onSuccess?.(`Транзакция отправлена! Hash: ${shortHash}... Средства поступят в течение 1-2 минут.`);
      
      // НОВОЕ: Через 90 секунд проверяем зачисление по адресу отправителя
      setTimeout(async () => {
        try {
          console.log('Проверяем зачисление депозита...');
          
          const checkResponse = await axios.post(`${API_URL}/api/wallet/check-deposit-by-address`, {
            player_id: playerId,
            expected_amount: amount,
            sender_address: userAddress, // адрес кошелька игрока
            game_wallet: gameWalletAddress
          });
          
          if (checkResponse.data.success) {
            console.log('Депозит автоматически зачислен!');
          } else {
            console.log('Депозит пока не найден');
          }
          
        } catch (checkError: any) {
          console.log('Ошибка проверки депозита:', checkError.message);
        }
      }, 90000); // 90 секунд - больше времени на подтверждение в блокчейне
      
      return true;

    } catch (err: any) {
      // ОРИГИНАЛЬНАЯ ОБРАБОТКА ОШИБОК
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
    isProcessing
  };
};