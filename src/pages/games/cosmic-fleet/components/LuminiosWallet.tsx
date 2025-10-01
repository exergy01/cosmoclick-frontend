import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { triggerSuccessFeedback } from '../../../../utils/feedbackUtils';
import { EXCHANGE_RATE } from '../types/luminios';

interface LuminiosWalletProps {
  luminiosBalance: number;
  csBalance: number;
  onExchange: (csAmount: number) => Promise<boolean>;
}

const LuminiosWallet: React.FC<LuminiosWalletProps> = ({
  luminiosBalance,
  csBalance,
  onExchange
}) => {
  const { t } = useTranslation();
  const [exchangeAmount, setExchangeAmount] = useState(1);
  const [isExchanging, setIsExchanging] = useState(false);

  const luminiosToReceive = exchangeAmount * EXCHANGE_RATE;

  const handleExchange = async () => {
    if (exchangeAmount <= 0 || exchangeAmount > csBalance) return;

    setIsExchanging(true);
    await triggerSuccessFeedback();

    try {
      const success = await onExchange(exchangeAmount);
      if (success) {
        await triggerSuccessFeedback();
        setExchangeAmount(100);
      }
    } catch (error) {
      console.error('Exchange error:', error);
    } finally {
      setIsExchanging(false);
    }
  };

  const presetAmounts = [1, 5, 10, 50, 100];

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '20px',
      padding: '25px',
      border: '2px solid #ff6600',
      boxShadow: '0 0 20px rgba(255, 102, 0, 0.3)',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '2rem', marginRight: '15px' }}>💎</div>
        <div>
          <h3 style={{
            color: '#ff6600',
            margin: 0,
            fontSize: '1.4rem',
            textShadow: '0 0 10px #ff6600'
          }}>
            Luminios Wallet
          </h3>
          <p style={{
            color: '#aaa',
            margin: '5px 0 0 0',
            fontSize: '0.9rem'
          }}>
            Валюта космического флота
          </p>
        </div>
      </div>

      {/* Текущий баланс */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{
          background: 'rgba(255, 102, 0, 0.1)',
          padding: '15px',
          borderRadius: '15px',
          border: '1px solid #ff6600',
          textAlign: 'center'
        }}>
          <div style={{ color: '#ff6600', fontSize: '0.9rem', marginBottom: '5px' }}>
            💎 Luminios
          </div>
          <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {luminiosBalance.toLocaleString()}
          </div>
        </div>
        <div style={{
          background: 'rgba(138, 43, 226, 0.1)',
          padding: '15px',
          borderRadius: '15px',
          border: '1px solid #8a2be2',
          textAlign: 'center'
        }}>
          <div style={{ color: '#8a2be2', fontSize: '0.9rem', marginBottom: '5px' }}>
            💎 CS (Cosmic Shards)
          </div>
          <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {csBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Обмен валют */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '20px',
        borderRadius: '15px',
        border: '1px solid #444'
      }}>
        <h4 style={{
          color: '#fff',
          margin: '0 0 15px 0',
          fontSize: '1.2rem',
          textAlign: 'center'
        }}>
          💱 Обмен CS → Luminios
        </h4>

        <div style={{ marginBottom: '15px' }}>
          <div style={{
            color: '#aaa',
            fontSize: '0.9rem',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Курс: 1 CS = {EXCHANGE_RATE} Luminios
          </div>
        </div>

        {/* Быстрый выбор */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: '15px'
        }}>
          {presetAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => setExchangeAmount(amount)}
              disabled={amount > csBalance}
              style={{
                background: exchangeAmount === amount
                  ? 'linear-gradient(135deg, #ff6600, #ff8800)'
                  : 'rgba(255, 102, 0, 0.2)',
                border: '1px solid #ff6600',
                borderRadius: '10px',
                padding: '8px 4px',
                color: amount > csBalance ? '#666' : '#fff',
                fontSize: '0.8rem',
                cursor: amount > csBalance ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {amount}
            </button>
          ))}
        </div>

        {/* Ввод суммы */}
        <div style={{ marginBottom: '15px' }}>
          <input
            type="number"
            value={exchangeAmount}
            onChange={(e) => setExchangeAmount(Math.max(0, parseInt(e.target.value) || 0))}
            min="1"
            max={csBalance}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '2px solid #ff6600',
              borderRadius: '10px',
              padding: '12px',
              color: '#fff',
              fontSize: '1.2rem',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
            placeholder="Введите количество CS"
          />
        </div>

        {/* Информация об обмене */}
        <div style={{
          background: 'rgba(255, 102, 0, 0.1)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid #ff6600',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#fff', fontSize: '1.1rem' }}>
            {exchangeAmount} CS → {luminiosToReceive.toLocaleString()} Luminios
          </div>
          {exchangeAmount > csBalance && (
            <div style={{ color: '#ff4444', fontSize: '0.9rem', marginTop: '5px' }}>
              Недостаточно CS
            </div>
          )}
        </div>

        {/* Кнопка обмена */}
        <button
          onClick={handleExchange}
          disabled={isExchanging || exchangeAmount <= 0 || exchangeAmount > csBalance}
          style={{
            width: '100%',
            background: isExchanging || exchangeAmount <= 0 || exchangeAmount > csBalance
              ? 'rgba(255, 102, 0, 0.3)'
              : 'linear-gradient(135deg, #ff6600, #ff8800)',
            border: 'none',
            borderRadius: '15px',
            padding: '15px',
            color: '#fff',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: isExchanging || exchangeAmount <= 0 || exchangeAmount > csBalance
              ? 'not-allowed'
              : 'pointer',
            boxShadow: isExchanging || exchangeAmount <= 0 || exchangeAmount > csBalance
              ? 'none'
              : '0 5px 15px rgba(255, 102, 0, 0.4)',
            transition: 'all 0.3s ease',
            transform: isExchanging ? 'scale(0.95)' : 'scale(1)'
          }}
        >
          {isExchanging ? '💎 Обмениваем...' : '💱 Обменять'}
        </button>

        {/* Предупреждение */}
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#ff4444', fontSize: '0.8rem' }}>
            ⚠️ Обмен только в одну сторону: CS → Luminios
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuminiosWallet;