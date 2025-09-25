// src/pages/wallet/hooks/useTONDeposit.ts - ПРАВИЛЬНЫЙ ФОРМАТ PAYLOAD
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

  // Функция создания ПРАВИЛЬНОГО payload для TON комментария
  const createDepositPayload = (telegramId: string): string => {
    try {
      // Создаем текстовый комментарий
      const comment = `COSMO:${telegramId}:${Date.now()}`;
      
      // Конвертируем текст в UTF-8 байты
      const textEncoder = new TextEncoder();
      const textBytes = textEncoder.encode(comment);
      
      // Создаем правильную структуру для текстового комментария в TON:
      // - Первые 4 байта: 0x00000000 (magic для текстового комментария)
      // - Далее: UTF-8 текст комментария
      const totalLength = 4 + textBytes.length;
      const payload = new Uint8Array(totalLength);
      
      // Устанавливаем magic number для текстового комментария (все нули)
      payload[0] = 0x00;
      payload[1] = 0x00;
      payload[2] = 0x00;
      payload[3] = 0x00;
      
      // Копируем текст комментария
      payload.set(textBytes, 4);
      
      // Конвертируем в base64
      let binary = '';
      for (let i = 0; i < payload.length; i++) {
        binary += String.fromCharCode(payload[i]);
      }
      
      const base64Payload = btoa(binary);
      console.log('Создан payload:', comment, 'Base64 длина:', base64Payload.length);
      
      return base64Payload;
      
    } catch (error) {
      console.error('Ошибка создания payload:', error);
      // Возвращаем null чтобы отправить без payload
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
      console.log('🔐 Создан правильный payload для игрока:', playerId);
      
      const nanoAmount = Math.floor(amount * 1_000_000_000);

      // Создаем транзакцию
      let transaction;
      
      if (depositPayload) {
        // С payload
        transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [{
            address: gameWalletAddress,
            amount: nanoAmount.toString(),
            payload: depositPayload
          }]
        };
        console.log('💳 Отправляем транзакцию С защитным payload...');
      } else {
        // Без payload (fallback)
        transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [{
            address: gameWalletAddress,
            amount: nanoAmount.toString()
          }]
        };
        console.log('💳 Отправляем транзакцию БЕЗ payload (fallback)...');
      }
      
      // Отправляем через TON Connect
      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('✅ Транзакция отправлена успешно:', result);
      
      onSuccess?.('Транзакция отправлена! Проверяем зачисление...');
      
      // АВТОМАТИЧЕСКАЯ ПРОВЕРКА депозитов через 3 секунды
      setTimeout(async () => {
        const autoSuccess = await autoCheckDeposits();
        
        if (!autoSuccess) {
          // Пробуем еще раз через 10 секунд
          setTimeout(async () => {
            const secondTry = await autoCheckDeposits();
            
            if (!secondTry) {
              onSuccess?.('Транзакция отправлена! Нажмите "Обновить баланс" через 1-2 минуты.');
            }
          }, 10000);
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
      } else if (err.message?.includes('Payload is invalid') || err.message?.includes('Invalid magic')) {
        // Если payload не работает - пробуем без него
        console.log('Payload не поддерживается, пробуем без него...');
        
        try {
          const simpleTransaction = {
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{
              address: process.env.REACT_APP_GAME_WALLET_ADDRESS || 'UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60',
              amount: Math.floor(amount * 1_000_000_000).toString()
            }]
          };
          
          const simpleResult = await tonConnectUI.sendTransaction(simpleTransaction);
          console.log('✅ Простая транзакция БЕЗ payload отправлена:', simpleResult);
          
          onSuccess?.('Транзакция отправлена! (без защитного кода) Нажмите "Обновить баланс" через 1-2 минуты.');
          
          // Автопроверка и для простой транзакции
          setTimeout(() => autoCheckDeposits(), 3000);
          
          return true;
        } catch (simpleErr) {
          errorMessage = 'Ошибка транзакции даже без payload';
        }
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