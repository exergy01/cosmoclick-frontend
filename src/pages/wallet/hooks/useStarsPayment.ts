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

    if (amount < 1) {
      onError?.('Минимальная сумма: 1 Star');
      return false;
    }

    if (amount > 2500) {
      onError?.('Максимальная сумма: 2500 Stars');
      return false;
    }

    setIsProcessing(true);

    try {
      console.log('🌟 Создаем счет на оплату Stars:', amount);
      
      const response = await axios.post(`${API_URL}/api/wallet/create-stars-invoice`, {
        telegram_id: playerId,
        amount: amount,
        description: `Пополнение CosmoClick на ${amount} Stars`
      });

      if (response.data.success && response.data.invoice_url) {
        // Открываем ссылку на оплату в Telegram
        window.open(response.data.invoice_url, '_blank');
        
        onSuccess?.('Счет создан! Откройте ссылку для оплаты');
        console.log('✅ Stars счет создан успешно:', response.data.invoice_url);
        
        return true;
      } else {
        throw new Error(response.data.error || 'Ошибка создания счета');
      }

    } catch (err: any) {
      console.error('❌ Ошибка создания счета Stars:', err);
      
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