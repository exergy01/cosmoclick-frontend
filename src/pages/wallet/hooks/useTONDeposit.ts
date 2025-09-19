// src/pages/wallet/hooks/useTONDeposit.ts - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ
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
      
      // Создаем комментарий с telegram_id игрока
      const comment = playerId;
      
      // Кодируем комментарий для TON
      const commentBytes = new TextEncoder().encode(comment);
      const payload = new Uint8Array(commentBytes.length + 4);
      payload.set([0x00, 0x00, 0x00, 0x00], 0);
      payload.set(commentBytes, 4);
      const payloadHex = Array.from(payload).map(byte => byte.toString(16).padStart(2, '0')).join('');

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: gameWalletAddress,
            amount: nanoAmount.toString(),
            payload: payloadHex
          }
        ]
      };
      
      console.log('Отправляем TON транзакцию:', {
        amount: amount,
        to: gameWalletAddress,
        comment: comment
      });
      
      const result = await tonConnectUI.sendTransaction(transaction);
      
      console.log('Транзакция отправлена, результат:', result);
      
      onSuccess?.(`Транзакция отправлена! Средства поступят в течение 1-2 минут.`);
      
      // Через 60 секунд после отправки проверяем зачисление
      setTimeout(async () => {
        try {
          console.log('Проверяем зачисление депозита...');
          
          const checkResponse = await axios.post(`${API_URL}/api/wallet/check-deposit`, {
            player_id: playerId,
            expected_amount: amount,
            transaction_hash: result.boc || 'unknown',
            wallet_address: gameWalletAddress
          });
          
          if (checkResponse.data.success) {
            console.log('Депозит успешно зачислен автоматически');
          } else {
            console.log('Депозит пока не найден, будет проверен позже');
          }
          
        } catch (checkError) {
          console.log('Ошибка проверки депозита:', checkError);
        }
      }, 60000); // 60 секунд
      
      return true;

    } catch (err: any) {
      console.error('Ошибка отправки TON транзакции:', err);
      
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