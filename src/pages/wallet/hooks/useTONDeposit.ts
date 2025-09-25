// src/pages/wallet/hooks/useTONDeposit.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ С ПРАВИЛЬНЫМ PAYLOAD
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

  // Функция создания правильного payload для TON комментария
  const createDepositPayload = (telegramId: string): string => {
    try {
      // Создаем текстовый комментарий
      const comment = `COSMO:${telegramId}:${Date.now()}`;
      
      // Конвертируем в правильный формат для TON Connect
      // Используем простой base64 для текстового комментария
      const commentBytes = new TextEncoder().encode(comment);
      
      // Создаем правильную структуру payload для комментария
      // Формат: 4 байта (0x00000000) + текст
      const payload = new Uint8Array(4 + commentBytes.length);
      payload.set([0, 0, 0, 0], 0); // 4 нулевых байта в начале
      payload.set(commentBytes, 4); // текст комментария
      
      // Конвертируем в base64
      let binary = '';
      payload.forEach(byte => {
        binary += String.fromCharCode(byte);
      });
      
      return btoa(binary);
      
    } catch (error) {
      console.error('Ошибка создания payload:', error);
      // Fallback - отправляем без payload
      return '';
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
    console.log('🚀 БЕЗОПАСНЫЙ депозит TON:', { amount, userAddress, playerId });

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
      
      // СОЗДАЕМ ПРАВИЛЬНЫЙ PAYLOAD
      const depositPayload = createDepositPayload(playerId);
      console.log('🔐 Создан безопасный payload для игрока:', playerId);
      
      const nanoAmount = Math.floor(amount * 1_000_000_000);

      // Создаем защищенную транзакцию с правильным payload
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
        messages: [{
          address: gameWalletAddress,
          amount: nanoAmount.toString(),
          // ИСПРАВЛЕНО: Добавляем payload только если он создался успешно
          ...(depositPayload && { payload: depositPayload })
        }]
      };
      
      console.log('💳 Отправляем транзакцию с защитным payload...');
      
      // Отправляем через TON Connect
      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('✅ Защищенная транзакция отправлена:', result);
      
      onSuccess?.('Защищенная транзакция отправлена! Проверяем зачисление...');
      
      // АВТОМАТИЧЕСКАЯ ПРОВЕРКА депозитов через 3 секунды
      setTimeout(async () => {
        const autoSuccess = await autoCheckDeposits();
        
        if (!autoSuccess) {
          // Пробуем еще раз через 10 секунд
          setTimeout(async () => {
            const secondTry = await autoCheckDeposits();
            
            if (!secondTry) {
              onSuccess?.('Защищенная транзакция отправлена! Если баланс не обновился, нажмите "Обновить баланс" через 1-2 минуты.');
            }
          }, 10000);
        }
      }, 3000);
      
      return true;

    } catch (err: any) {
      console.error('Ошибка безопасной TON транзакции:', err);
      
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
      } else if (err.message?.includes('Payload is invalid') || err.message?.includes('Invalid magic')) {
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