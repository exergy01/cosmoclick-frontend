// src/pages/wallet/components/StarsModal.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

interface StarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  starsAmount: string;
  setStarsAmount: (amount: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  colorStyle: string;
  validAmounts: number[];
  popularPackages: number[];
}

export const StarsModal: React.FC<StarsModalProps> = ({
  isOpen,
  onClose,
  starsAmount,
  setStarsAmount,
  onSubmit,
  isProcessing,
  colorStyle,
  validAmounts,
  popularPackages
}) => {
  const { t } = useTranslation();

  // Функция для получения актуального количества Stars, которое будет куплено
  const getActualStarsAmount = (inputAmount: string): number => {
    const amount = parseInt(inputAmount);
    if (!amount || amount < 100) return 100;
    if (amount > 150000) return 150000;
    
    // Находим ближайшее валидное значение (большее или равное)
    return validAmounts.find(validAmount => validAmount >= amount) || 150000;
  };

  const actualAmount = getActualStarsAmount(starsAmount);
  const inputAmount = parseInt(starsAmount);

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
          ⭐ {t('wallet.stars_modal.title')}
        </h2>
        
        {/* Предустановленные пакеты */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '10px',
            marginBottom: '15px'
          }}>
            {popularPackages.map(amount => (
              <button
                key={amount}
                onClick={() => setStarsAmount(amount.toString())}
                disabled={isProcessing}
                style={{
                  padding: '12px 8px',
                  background: starsAmount === amount.toString() 
                    ? `linear-gradient(135deg, ${colorStyle}60, ${colorStyle}90, ${colorStyle}60)`
                    : `linear-gradient(135deg, ${colorStyle}20, ${colorStyle}40, ${colorStyle}20)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  opacity: isProcessing ? 0.7 : 1,
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
              >
                ⭐ {amount.toLocaleString()}
                {amount === 250 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: colorStyle,
                    color: '#000',
                    fontSize: '0.6rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 'bold'
                  }}>
                    {t('wallet.stars_modal.packages.popular')}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>
            {t('wallet.stars_modal.amount_label')}
          </label>
          <input
            type="number"
            value={starsAmount}
            onChange={(e) => setStarsAmount(e.target.value)}
            placeholder="100"
            step="50"
            min="100"
            max="150000"
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${colorStyle}`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1.1rem',
              opacity: isProcessing ? 0.7 : 1
            }}
          />
          <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>
            {t('wallet.stars_modal.min_max', { min: 100, max: 150000 })}
          </p>
          
          {/* Информация о том, что будет куплено */}
          {starsAmount && inputAmount >= 100 && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px',
              background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.1)`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px'
            }}>
              <p style={{ color: colorStyle, fontSize: '0.9rem', margin: 0 }}>
                {inputAmount === actualAmount 
                  ? `✅ Будет куплено: ${actualAmount.toLocaleString()} Stars`
                  : `⬆️ Будет куплено: ${actualAmount.toLocaleString()} Stars (округлено вверх)`
                }
              </p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ color: colorStyle, fontSize: '1rem' }}>
            💰 {t('wallet.stars_modal.cost', { amount: actualAmount })}
          </p>
          <p style={{ color: '#888', fontSize: '0.8rem' }}>
            {t('wallet.stars_modal.payment_method')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={onSubmit}
            disabled={isProcessing || !starsAmount || parseInt(starsAmount) < 100 || parseInt(starsAmount) > 150000}
            style={{
              flex: 1,
              padding: '15px',
              background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
              border: `2px solid ${colorStyle}`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1.1rem',
              cursor: (isProcessing || !starsAmount || parseInt(starsAmount) < 100 || parseInt(starsAmount) > 150000) ? 'not-allowed' : 'pointer',
              opacity: (isProcessing || !starsAmount || parseInt(starsAmount) < 100 || parseInt(starsAmount) > 150000) ? 0.5 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            {isProcessing ? `🔄 ${t('wallet.stars_modal.creating')}` : `⭐ ${t('wallet.stars_modal.buy_button')}`}
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
            ❌ {t('wallet.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};