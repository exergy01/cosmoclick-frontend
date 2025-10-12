// components/WithdrawModal.tsx - FIXED VERSION (Backend API approach)
import React from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { useState } from 'react';
import axios from 'axios';

interface WithdrawModalProps {
  playerBalance: number;
  telegramId: string;
  onClose?: () => void;
  onSuccess?: (amount: number) => void;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  playerBalance,
  telegramId,
  onClose,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    setSuccess(null);

    try {
      // 🔒 SECURITY: Call backend API to prepare withdrawal
      const response = await axios.post(`${API_URL}/api/wallet/ton-withdrawals/prepare`, {
        telegram_id: telegramId,
        amount: withdrawAmount,
        wallet_address: address
      });

      console.log('Withdrawal request created:', response.data);

      setSuccess(`✅ Withdrawal request submitted!\nAmount: ${withdrawAmount} TON\nRequest ID: ${response.data.withdrawal_id}\n\nAdmin will process your request soon.`);

      // Вызываем колбэк успеха
      if (onSuccess) {
        onSuccess(withdrawAmount);
      }

      // Закрываем модал через 3 секунды
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 3000);

    } catch (error: any) {
      console.error('Withdrawal request failed:', error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);

        // Show detailed balance info if available
        if (error.response.data.available_balance !== undefined) {
          const details = error.response.data;
          setError(`${details.error}\n\nAvailable: ${details.available_balance} TON\nTotal balance: ${details.total_balance} TON\nReserved: ${details.reserved} TON\nStaked: ${details.staked} TON`);
        }
      } else if (error.message?.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Withdrawal request failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const maxAmount = Math.max(0, playerBalance - 0.01); // Reserve for potential fees

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
            fontSize: '0.85rem',
            whiteSpace: 'pre-line'
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#22c55e',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '0.85rem',
            whiteSpace: 'pre-line'
          }}>
            {success}
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
            disabled={isProcessing || success !== null}
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

        <div style={{
          background: 'rgba(255, 165, 0, 0.1)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '15px',
          fontSize: '0.75rem',
          color: '#ffa500'
        }}>
          ℹ️ Your withdrawal request will be reviewed by an admin. Processing time: 1-24 hours.
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleWithdraw}
            disabled={isProcessing || !amount || parseFloat(amount) < 0.1 || !address || success !== null}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #00f0ff80, #00f0ff40)',
              border: '2px solid #00f0ff',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              cursor: (isProcessing || !amount || parseFloat(amount) < 0.1 || !address || success !== null) ? 'not-allowed' : 'pointer',
              opacity: (isProcessing || !amount || parseFloat(amount) < 0.1 || !address || success !== null) ? 0.5 : 1
            }}
          >
            {isProcessing ? '🔄 Processing...' : success ? '✅ Sent' : '✅ Withdraw'}
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
            ❌ {success ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
