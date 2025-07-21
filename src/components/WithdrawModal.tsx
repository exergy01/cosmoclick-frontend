// components/WithdrawModal.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import React from 'react';
import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { useState } from 'react';

interface WithdrawModalProps {
  playerBalance: number;
  onClose?: () => void;
  onSuccess?: (amount: number) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ 
  playerBalance, 
  onClose,
  onSuccess 
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const address = useTonAddress();

  const handleWithdraw = async () => {
    if (!address) {
      setError('Please connect wallet first');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Invalid amount');
      return;
    }

    if (withdrawAmount > playerBalance) {
      setError('Insufficient balance');
      return;
    }

    if (withdrawAmount < 0.1) {
      setError('Minimum withdrawal: 0.1 TON');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Конвертация баланса в TON (1 TON = 1,000,000,000 nanoton)
      const nanotons = Math.floor(withdrawAmount * 1e9);

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // 60 секунд
        messages: [
          {
            address: address, // Адрес игрока
            amount: nanotons.toString()
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('Transaction sent:', result);
      
      // Вызываем колбэк успеха
      if (onSuccess) {
        onSuccess(withdrawAmount);
      }
      
      // Закрываем модал
      if (onClose) {
        onClose();
      }

    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      if (error.message?.includes('Wallet declined')) {
        setError('Transaction declined by wallet');
      } else {
        setError('Transaction failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const maxAmount = Math.max(0, playerBalance - 0.01); // Оставляем запас на комиссию

  return (
    <div className="withdraw-modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.95)',
        padding: '30px',
        borderRadius: '20px',
        border: '2px solid #00f0ff',
        maxWidth: '400px',
        width: '100%',
        color: '#fff'
      }}>
        <h3 style={{ color: '#00f0ff', marginBottom: '20px', textAlign: 'center' }}>
          💸 Withdraw TON
        </h3>
        
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
            Amount (TON):
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            step="0.01"
            min="0.1"
            max={maxAmount}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #00f0ff',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem'
            }}
          />
          <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>
            Available: {maxAmount.toFixed(8)} TON
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
            Recipient Address:
          </label>
          <p style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '10px',
            borderRadius: '8px',
            wordBreak: 'break-all',
            fontSize: '0.9rem',
            color: '#00f0ff'
          }}>
            {address || 'Not connected'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleWithdraw}
            disabled={isProcessing || !amount || parseFloat(amount) < 0.1 || !address}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #00f0ff80, #00f0ff40)',
              border: '2px solid #00f0ff',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              cursor: (isProcessing || !amount || parseFloat(amount) < 0.1 || !address) ? 'not-allowed' : 'pointer',
              opacity: (isProcessing || !amount || parseFloat(amount) < 0.1 || !address) ? 0.5 : 1
            }}
          >
            {isProcessing ? '🔄 Processing...' : '✅ Withdraw'}
          </button>
          
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};