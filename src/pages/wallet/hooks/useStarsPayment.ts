// src/pages/wallet/hooks/useStarsPayment.ts
import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface UseStarsPaymentProps {
  playerId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useStarsPayment = ({ playerId, onSuccess, onError }: UseStarsPaymentProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const createStarsInvoice = async (amount: number): Promise<boolean> => {
    // Валидация
    if (!playerId) {
      onError?.('Player ID не найден');
      return false;
    }

    if (isNaN(amount) || amount <= 0) {
      onError?.('Неверная сумма');
      return false;
    }

    if (amount < 100) {
      onError?.('Минимальная сумма: 100 Stars');
      return false;
    }

    if (amount > 150000) {
      onError?.('Максимальная сумма: 150000 Stars');
      return false;
    }

    setIsProcessing(true);

    try {
      const response = await axios.post(`${API_URL}/api/wallet/create-stars-invoice`, {
        telegram_id: playerId,
        amount: amount,
        description: `Пополнение CosmoClick на ${amount} Stars`
      });

      if (response.data.success && response.data.invoice_url) {
        // Используем правильный Telegram WebApp API для открытия ссылки
        let telegramUrl = response.data.invoice_url;
        
        // Убедимся, что ссылка в правильном формате для Telegram
        if (!telegramUrl.startsWith('t.me') && !telegramUrl.startsWith('https://t.me')) {
          telegramUrl = telegramUrl.replace(/^https?:\/\//, 'https://t.me/');
        }
        
        // Используем Telegram WebApp API вместо window.open
        if (window.Telegram?.WebApp?.openTelegramLink) {
          window.Telegram.WebApp.openTelegramLink(telegramUrl);
        } else {
          // Fallback для тестирования вне Telegram
          window.open(telegramUrl, '_blank');
        }
        
        onSuccess?.('Счет создан! Откройте ссылку для оплаты');
        
        return true;
      } else {
        throw new Error(response.data.error || 'Ошибка создания счета');
      }

    } catch (err: any) {
      const errorMessage = `Ошибка: ${err.response?.data?.error || err.message}`;
      onError?.(errorMessage);
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createStarsInvoice,
    isProcessing
  };
};