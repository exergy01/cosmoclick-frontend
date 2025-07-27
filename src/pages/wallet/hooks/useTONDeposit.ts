// src/pages/wallet/hooks/useTONDeposit.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
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
      console.log('💰 Начинаем пополнение TON:', amount);
      
      // 🔥 ИСПРАВЛЕНО: Хардкод адреса + fallback
      const gameWalletAddress = process.env.REACT_APP_GAME_WALLET_ADDRESS || 'UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60';
      
      console.log('🏪 Game wallet address:', gameWalletAddress);

      // Проверяем формат адреса
      if (!gameWalletAddress.startsWith('UQ') && !gameWalletAddress.startsWith('EQ')) {
        throw new Error(`Неверный формат адреса кошелька: ${gameWalletAddress}`);
      }

      // Создаем данные для транзакции
      const nanoAmount = Math.floor(amount * 1e9);
      const payloadText = `deposit:${playerId}:${amount}:${Date.now()}`;
      const payload = Buffer.from(payloadText).toString('base64');
      
      console.log('💎 Сумма в nanoton:', nanoAmount);
      console.log('📝 Payload:', payloadText);

      // Создаем транзакцию
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 120, // 2 минуты
        messages: [
          {
            address: gameWalletAddress,
            amount: nanoAmount.toString(),
            payload: payload
          }
        ]
      };

      console.log('🔗 Отправляем транзакцию через TON Connect...');
      console.log('📋 Transaction:', JSON.stringify(transaction, null, 2));
      
      // Отправляем транзакцию
      const result = await tonConnectUI.sendTransaction(transaction);
      
      console.log('✅ Транзакция отправлена успешно!');
      console.log('📄 BOC:', result.boc.slice(0, 20) + '...');
      
      const shortHash = result.boc.slice(0, 10);
      onSuccess?.(`Транзакция отправлена! Hash: ${shortHash}...`);
      
      return true;

    } catch (err: any) {
      console.error('❌ Ошибка пополнения TON:', err);
      
      // Определяем тип ошибки и показываем понятное сообщение
      let errorMessage = 'Ошибка отправки транзакции';
      
      if (err.message?.includes('User declined') || 
          err.message?.includes('rejected') ||
          err.message?.includes('cancelled')) {
        errorMessage = 'Транзакция отклонена пользователем';
      } else if (err.message?.includes('Insufficient') || 
                 err.message?.includes('balance')) {
        errorMessage = 'Недостаточно TON в вашем кошельке';
      } else if (err.message?.includes('Network') || 
                 err.message?.includes('timeout')) {
        errorMessage = 'Ошибка сети. Попробуйте еще раз';
      } else if (err.message?.includes('Invalid') || 
                 err.message?.includes('address')) {
        errorMessage = 'Неверный адрес кошелька';
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