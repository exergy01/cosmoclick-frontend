// src/pages/wallet/components/StarsModal.tsx
import React from 'react';

interface StarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  starsAmount: string;
  setStarsAmount: (amount: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export const StarsModal: React.FC<StarsModalProps> = ({
  isOpen,
  onClose,
  starsAmount,
  setStarsAmount,
  onSubmit,
  isProcessing
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
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
        border: '2px solid #FFD700',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
      }}>
        <h2 style={{ 
          color: '#FFD700', 
          marginBottom: '20px', 
          textAlign: 'center',
          textShadow: '0 0 10px #FFD700',
          fontSize: '1.5rem'
        }}>
          ⭐ Купить Telegram Stars
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>
            Количество Stars:
          </label>
          <input
            type="number"
            value={starsAmount}
            onChange={(e) => setStarsAmount(e.target.value)}
            placeholder="1"
            step="1"
            min="1"
            max="2500"
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #FFD700',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1.1rem',
              opacity: isProcessing ? 0.7 : 1
            }}
          />
          <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>
            От 1 до 2500 Stars
          </p>
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ color: '#FFD700', fontSize: '1rem' }}>
            💰 Стоимость: {parseInt(starsAmount || '0')} Stars
          </p>
          <p style={{ color: '#888', fontSize: '0.8rem' }}>
            Оплата через Telegram
          </p>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={onSubmit}
            disabled={isProcessing || !starsAmount || parseInt(starsAmount) < 1}
            style={{
              flex: 1,
              padding: '15px',
              background: 'linear-gradient(135deg, #FFD70030, #FFD70060, #FFD70030)',
              border: '2px solid #FFD700',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1.1rem',
              cursor: (isProcessing || !starsAmount || parseInt(starsAmount) < 1) ? 'not-allowed' : 'pointer',
              opacity: (isProcessing || !starsAmount || parseInt(starsAmount) < 1) ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {isProcessing ? '🔄 Создание...' : '⭐ Купить Stars'}
          </button>
          
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '15px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '2px solid #ef4444',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: '1.1rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            ❌ Отмена
          </button>
        </div>
      </div>
    </div>
  );
};