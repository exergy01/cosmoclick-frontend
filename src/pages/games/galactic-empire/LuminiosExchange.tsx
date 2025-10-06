/**
 * 💱 ОБМЕН ВАЛЮТ: CS → Luminios
 * Galactic Empire v2.0
 */

import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const EXCHANGE_RATE = 100; // 1 CS = 100 Luminios

interface LuminiosExchangeProps {
  telegramId: string;
  luminiosBalance: number;
  csBalance: number;
  onExchangeComplete: () => void;
  lang: string;
  raceColor: string;
}

const LuminiosExchange: React.FC<LuminiosExchangeProps> = ({
  telegramId,
  luminiosBalance,
  csBalance,
  onExchangeComplete,
  lang,
  raceColor
}) => {
  const [exchangeAmount, setExchangeAmount] = useState(1);
  const [isExchanging, setIsExchanging] = useState(false);

  const luminiosToReceive = exchangeAmount * EXCHANGE_RATE;

  const handleExchange = async () => {
    if (exchangeAmount <= 0 || exchangeAmount > csBalance) return;

    setIsExchanging(true);

    try {
      await axios.post(`${API_URL}/api/luminios/exchange`, {
        telegramId,
        csAmount: exchangeAmount
      });

      alert(
        lang === 'ru'
          ? `✅ Обменяно ${exchangeAmount} CS на ${luminiosToReceive} Luminios!`
          : `✅ Exchanged ${exchangeAmount} CS for ${luminiosToReceive} Luminios!`
      );

      setExchangeAmount(1);
      onExchangeComplete();
    } catch (error: any) {
      console.error('Exchange error:', error);
      alert(
        lang === 'ru'
          ? `❌ Ошибка обмена: ${error.response?.data?.error || error.message}`
          : `❌ Exchange error: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setIsExchanging(false);
    }
  };

  const presetAmounts = [1, 5, 10, 50, 100];

  const t = {
    ru: {
      title: 'Обмен валют',
      subtitle: 'Обменяй CS на Luminios',
      luminios: 'Luminios',
      cs: 'CS (Cosmic Shards)',
      exchange: 'Обмен CS → Luminios',
      rate: 'Курс',
      insufficient: 'Недостаточно CS',
      exchangeBtn: 'Обменять',
      exchanging: 'Обмениваем...',
      warning: '⚠️ Обмен только в одну сторону: CS → Luminios',
      enterAmount: 'Введите количество CS'
    },
    en: {
      title: 'Currency Exchange',
      subtitle: 'Exchange CS for Luminios',
      luminios: 'Luminios',
      cs: 'CS (Cosmic Shards)',
      exchange: 'Exchange CS → Luminios',
      rate: 'Rate',
      insufficient: 'Insufficient CS',
      exchangeBtn: 'Exchange',
      exchanging: 'Exchanging...',
      warning: '⚠️ Exchange is one-way only: CS → Luminios',
      enterAmount: 'Enter CS amount'
    }
  };

  const text = t[lang as 'ru' | 'en'] || t.en;

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '20px',
      padding: '25px',
      border: `2px solid ${raceColor}`,
      boxShadow: `0 0 20px ${raceColor}40`
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '2rem', marginRight: '15px' }}>💱</div>
        <div>
          <h3 style={{
            color: raceColor,
            margin: 0,
            fontSize: '1.4rem',
            textShadow: `0 0 10px ${raceColor}`
          }}>
            {text.title}
          </h3>
          <p style={{
            color: '#aaa',
            margin: '5px 0 0 0',
            fontSize: '0.9rem'
          }}>
            {text.subtitle}
          </p>
        </div>
      </div>

      {/* Current Balance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{
          background: 'rgba(255, 170, 0, 0.1)',
          padding: '15px',
          borderRadius: '15px',
          border: '1px solid #ffaa00',
          textAlign: 'center'
        }}>
          <div style={{ color: '#ffaa00', fontSize: '0.9rem', marginBottom: '5px' }}>
            💎 {text.luminios}
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
            💎 {text.cs}
          </div>
          <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {csBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Exchange Section */}
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
          {text.exchange}
        </h4>

        <div style={{ marginBottom: '15px' }}>
          <div style={{
            color: '#aaa',
            fontSize: '0.9rem',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            {text.rate}: 1 CS = {EXCHANGE_RATE} Luminios
          </div>
        </div>

        {/* Quick Select */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
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
                  ? `linear-gradient(135deg, ${raceColor}, ${raceColor}CC)`
                  : `rgba(${raceColor === '#ffaa00' ? '255, 170, 0' : '255, 102, 0'}, 0.2)`,
                border: `1px solid ${raceColor}`,
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

        {/* Amount Input */}
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
              border: `2px solid ${raceColor}`,
              borderRadius: '10px',
              padding: '12px',
              color: '#fff',
              fontSize: '1.2rem',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
            placeholder={text.enterAmount}
          />
        </div>

        {/* Exchange Info */}
        <div style={{
          background: 'rgba(255, 170, 0, 0.1)',
          padding: '15px',
          borderRadius: '10px',
          border: '1px solid #ffaa00',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#fff', fontSize: '1.1rem' }}>
            {exchangeAmount} CS → {luminiosToReceive.toLocaleString()} Luminios
          </div>
          {exchangeAmount > csBalance && (
            <div style={{ color: '#ff4444', fontSize: '0.9rem', marginTop: '5px' }}>
              {text.insufficient}
            </div>
          )}
        </div>

        {/* Exchange Button */}
        <button
          onClick={handleExchange}
          disabled={isExchanging || exchangeAmount <= 0 || exchangeAmount > csBalance}
          style={{
            width: '100%',
            background: isExchanging || exchangeAmount <= 0 || exchangeAmount > csBalance
              ? 'rgba(255, 170, 0, 0.3)'
              : `linear-gradient(135deg, ${raceColor}, ${raceColor}CC)`,
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
              : `0 5px 15px ${raceColor}60`,
            transition: 'all 0.3s ease',
            transform: isExchanging ? 'scale(0.95)' : 'scale(1)'
          }}
        >
          {isExchanging ? `💎 ${text.exchanging}` : `💱 ${text.exchangeBtn}`}
        </button>

        {/* Warning */}
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid #ff4444',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#ff4444', fontSize: '0.8rem' }}>
            {text.warning}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuminiosExchange;
