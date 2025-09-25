// src/pages/wallet/hooks/useTONDeposit.ts - СИСТЕМА С ВРЕМЕННЫМ ОКНОМ
import { useState } from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

interface UseTONDepositProps {
  playerId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onBalanceUpdate?: () => void;
}

export const useTONDeposit = ({ playerId, onSuccess, onError, onBalanceUpdate }: UseTONDepositProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  // Функция регистрации ожидаемого депозита
  const registerExpectedDeposit = async (amount: number, playerAddress: string) => {
    try {
      await axios.post(`${API_URL}/api/wallet/ton-deposits/register-expected`, {
        player_id: playerId,
        amount: amount,
        from_address: playerAddress,
        timestamp: Date.now()
      });
      console.log('✅ Зарегистрирован ожидаемый депозит');
    } catch (error) {
      console.error('Ошибка регистрации ожидаемого депозита:', error);
    }
  };

  // Функция автоматической проверки депозитов
  const autoCheckDeposits = async (): Promise<boolean> => {
    if (!playerId) return false;

    try {
      console.log('Автопроверка депозитов после транзакции...');
      
      const response = await axios.post(`${API_URL}/api/wallet/ton-deposits/check-deposits`, {
        player_id: playerId,
        sender_address: userAddress
      });
      
      if (response.data.success && response.data.deposits_found > 0) {
        const { deposits_found, total_amount } = response.data;
        onSuccess?.(`Депозит зачислен автоматически! Получено ${total_amount} TON`);
        onBalanceUpdate?.();
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Автопроверка не удалась, нужно будет обновить вручную:', error);
      return false;
    }
  };

  const sendDepositTransaction = async (amount: number): Promise<boolean> => {
    console.log('🔒 ЗАЩИЩЕННЫЙ депозит с временным окном:', { amount, userAddress, playerId });

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
      const gameWalletAddress = process.env.REACT_APP_GAME_WALLET_ADDRESS || 
        'UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60';
      
      // РЕГИСТРИРУЕМ ОЖИДАЕМЫЙ ДЕПОЗИТ ПЕРЕД ОТПРАВКОЙ
      await registerExpectedDeposit(amount, userAddress);
      
      const nanoAmount = Math.floor(amount * 1_000_000_000);

      // ПРОСТАЯ транзакция БЕЗ payload
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
        messages: [{
          address: gameWalletAddress,
          amount: nanoAmount.toString()
        }]
      };
      
      console.log('💳 Отправляем защищенную транзакцию через временное окно...');
      
      // Отправляем через TON Connect
      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('✅ Транзакция отправлена:', result);
      
      onSuccess?.('Транзакция отправлена! Проверяем зачисление...');
      
      // АВТОМАТИЧЕСКАЯ ПРОВЕРКА депозитов через 3 секунды
      setTimeout(async () => {
        const autoSuccess = await autoCheckDeposits();
        
        if (!autoSuccess) {
          // Пробуем еще раз через 8 секунд
          setTimeout(async () => {
            const secondTry = await autoCheckDeposits();
            
            if (!secondTry) {
              // И еще раз через 15 секунд
              setTimeout(async () => {
                const thirdTry = await autoCheckDeposits();
                
                if (!thirdTry) {
                  onSuccess?.('Транзакция отправлена! Нажмите "Обновить баланс" через 1-2 минуты для зачисления.');
                }
              }, 15000);
            }
          }, 8000);
        }
      }, 3000);
      
      return true;

    } catch (err: any) {
      console.error('Ошибка TON транзакции:', err);
      
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
      } else if (err.message?.includes('No tx found')) {
        errorMessage = 'Ошибка отправки через кошелек, попробуйте еще раз';
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