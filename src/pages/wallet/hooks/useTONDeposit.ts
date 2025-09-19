// src/pages/wallet/hooks/useTONDeposit.ts - ПОЛНАЯ ВЕРСИЯ С ИСПРАВЛЕННЫМ PAYLOAD
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
      
      // ИСПРАВЛЕННОЕ кодирование payload для TON
      const encoder = new TextEncoder();
      const commentBytes = encoder.encode(comment);
      
      // Создаем правильный payload для текстового комментария
      // Формат: 4 байта заголовка (0x00000000) + текст в UTF-8
      const payload = new Uint8Array(4 + commentBytes.length);
      
      // Заголовок для текстового комментария в TON
      payload[0] = 0x00;  // op code для текста
      payload[1] = 0x00;
      payload[2] = 0x00;
      payload[3] = 0x00;
      
      // Копируем байты комментария
      for (let i = 0; i < commentBytes.length; i++) {
        payload[4 + i] = commentBytes[i];
      }
      
      // Конвертируем в hex строку (заглавные буквы)
      let payloadHex = '';
      for (let i = 0; i < payload.length; i++) {
        const hex = payload[i].toString(16).toUpperCase();
        payloadHex += hex.length === 1 ? '0' + hex : hex;
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
        messages: [
          {
            address: gameWalletAddress,
            amount: nanoAmount.toString(),
            payload: payloadHex
          }
        ]
      };
      
      console.log('Отправляем TON транзакцию с комментарием:', {
        amount: amount,
        nanoAmount: nanoAmount,
        to: gameWalletAddress,
        comment: comment,
        payloadLength: payload.length,
        payloadHex: payloadHex.substring(0, 20) + '...'
      });
      
      const result = await tonConnectUI.sendTransaction(transaction);
      
      console.log('TON транзакция отправлена успешно:', {
        boc: result.boc ? result.boc.substring(0, 20) + '...' : 'undefined'
      });
      
      onSuccess?.(`Транзакция отправлена! Средства поступят в течение 1-2 минут.`);
      
      // Через 60 секунд после отправки проверяем зачисление
      setTimeout(async () => {
        try {
          console.log('Запускаем проверку депозита через 60 секунд...');
          
          const checkResponse = await axios.post(`${API_URL}/api/wallet/check-deposit`, {
            player_id: playerId,
            expected_amount: amount,
            transaction_hash: result.boc || 'unknown',
            wallet_address: gameWalletAddress
          });
          
          if (checkResponse.data.success) {
            console.log('Депозит автоматически зачислен!');
          } else {
            console.log('Депозит пока не найден, будет проверен позже');
          }
          
        } catch (checkError: any) {
          console.log('Ошибка проверки депозита:', checkError.message);
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
      } else if (err.message?.includes('magic')) {
        errorMessage = 'Ошибка формата транзакции, попробуйте еще раз';
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