// src/pages/wallet/components/TONDepositModal.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import React from 'react';

interface TONDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositAmount: string;
  setDepositAmount: (amount: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  colorStyle: string;
}

export const TONDepositModal: React.FC<TONDepositModalProps> = ({
  isOpen,
  onClose,
  depositAmount,
  setDepositAmount,
  onSubmit,
  isProcessing,
  colorStyle
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
      {/* Стили для убирания стрелочек в input */}
      <style>
        {`
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>

      <div style={{
        background: 'rgba(0, 0, 0, 0.95)',
        padding: '30px',
        borderRadius: '20px',
        border: `2px solid ${colorStyle}`,
        maxWidth: '400px',
        width: '100%',
        boxShadow: `0 0 30px rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.3)`
      }}>
        <h2 style={{ 
          color: colorStyle, 
          marginBottom: '20px', 
          textAlign: 'center',
          textShadow: `0 0 10px ${colorStyle}`,
          fontSize: '1.5rem'
        }}>
          Пополнить TON
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>
            Сумма для пополнения:
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.01"
            step="0.01"
            min="0.01"
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${colorStyle}`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1.1rem',
              opacity: isProcessing ? 0.7 : 1,
              boxSizing: 'border-box'
            }}
          />
          <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>
            Минимальная сумма: 0.01 TON
          </p>
        </div>

        <div style={{ marginBottom: '15px', textAlign: 'center' }}>
          <p style={{ color: colorStyle, fontSize: '1rem' }}>
            К пополнению: {parseFloat(depositAmount || '0').toFixed(4)} TON
          </p>
          <p style={{ color: '#888', fontSize: '0.8rem' }}>
            Отправится на игровой кошелек
          </p>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={onSubmit}
            disabled={isProcessing || !depositAmount || parseFloat(depositAmount) < 0.01}
            style={{
              flex: 1,
              padding: '15px',
              background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
              border: `2px solid ${colorStyle}`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1.1rem',
              cursor: (isProcessing || !depositAmount || parseFloat(depositAmount) < 0.01) ? 'not-allowed' : 'pointer',
              opacity: (isProcessing || !depositAmount || parseFloat(depositAmount) < 0.01) ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {isProcessing ? 'Отправка...' : 'Отправить TON'}
          </button>
          
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '15px',
              background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.2)`,
              border: `2px solid ${colorStyle}`,
              borderRadius: '10px',
              color: colorStyle,
              fontSize: '1.1rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};