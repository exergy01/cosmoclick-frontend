import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

interface UsePremiumPurchaseProps {
  playerId?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export const usePremiumPurchase = ({ playerId, onSuccess, onError }: UsePremiumPurchaseProps = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const purchasePremium = async (packageType: 'no_ads_30_days' | 'no_ads_forever', paymentMethod: 'stars' | 'ton', paymentAmount: number): Promise<boolean> => {
    if (!playerId || !packageType || !paymentMethod || !paymentAmount) {
      onError?.('Missing required fields');
      return false;
    }
    setIsProcessing(true);
    try {
      const response = await axios.post(`${API_URL}/api/wallet/premium-system/purchase`, {
        telegram_id: playerId,
        package_type: packageType,
        payment_method: paymentMethod,
        payment_amount: paymentAmount
      });
      if (response.data.success) {
        onSuccess?.(response.data.message);
        return true;
      } else {
        throw new Error(response.data.error || 'Premium purchase failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Premium purchase failed';
      onError?.(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { purchasePremium, isProcessing };
};