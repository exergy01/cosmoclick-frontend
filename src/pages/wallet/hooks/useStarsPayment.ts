// src/pages/wallet/hooks/useStarsPayment.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

interface UseStarsPaymentProps {
  playerId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const useStarsPayment = ({ playerId, onSuccess, onError }: UseStarsPaymentProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const createStarsInvoice = async (amount: number): Promise<boolean> => {
    console.log('Creating Stars invoice:', { playerId, amount });

    // Валидация
    if (!playerId) {
      console.error('Player ID не найден');
      onError?.('Player ID не найден');
      return false;
    }

    if (isNaN(amount) || amount <= 0) {
      console.error('Неверная сумма:', amount);
      onError?.('Неверная сумма');
      return false;
    }

    if (amount < 100) {
      console.error('Минимальная сумма: 100 Stars');
      onError?.('Минимальная сумма: 100 Stars');
      return false;
    }

    if (amount > 150000) {
      console.error('Максимальная сумма: 150000 Stars');
      onError?.('Максимальная сумма: 150000 Stars');
      return false;
    }

    setIsProcessing(true);

    try {
      console.log('Sending request to create Stars invoice...');
      
      // ИСПРАВЛЕНО: Используем legacy endpoint который должен работать
      const response = await axios.post(`${API_URL}/api/wallet/create-stars-invoice`, {
        telegram_id: playerId,
        amount: amount,
        description: `Пополнение CosmoClick на ${amount} Stars`
      });

      console.log('Stars invoice API response:', response.data);

      if (response.data.success && response.data.invoice_url) {
        console.log('Invoice created successfully:', response.data.invoice_url);
        
        // Используем правильный Telegram WebApp API для открытия ссылки
        let telegramUrl = response.data.invoice_url;
        
        // Убедимся, что ссылка в правильном формате для Telegram
        if (!telegramUrl.startsWith('t.me') && !telegramUrl.startsWith('https://t.me')) {
          telegramUrl = telegramUrl.replace(/^https?:\/\//, 'https://t.me/');
        }
        
        console.log('Opening Telegram link:', telegramUrl);
        
        // Используем Telegram WebApp API вместо window.open
        if ((window as any).Telegram?.WebApp?.openTelegramLink) {
          console.log('Using Telegram WebApp API...');
          (window as any).Telegram.WebApp.openTelegramLink(telegramUrl);
        } else {
          console.log('Fallback to window.open...');
          // Fallback для тестирования вне Telegram
          window.open(telegramUrl, '_blank');
        }
        
        onSuccess?.('Счет создан! Откройте ссылку для оплаты');
        
        return true;
      } else {
        console.error('API returned unsuccessful response:', response.data);
        throw new Error(response.data.error || 'Ошибка создания счета');
      }

    } catch (err: any) {
      console.error('Stars invoice creation error:', err);
      
      let errorMessage = 'Ошибка создания счета Stars';
      
      if (err.response?.data?.error) {
        errorMessage = `Ошибка: ${err.response.data.error}`;
      } else if (err.response?.status === 404) {
        errorMessage = 'API endpoint не найден';
      } else if (err.response?.status === 500) {
        errorMessage = 'Ошибка сервера';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Ошибка сети';
      } else if (err.message) {
        errorMessage = `Ошибка: ${err.message}`;
      }
      
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