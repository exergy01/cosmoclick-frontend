import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  commission: number;
  minAmount: number;
  maxAmount: number;
}

// Курсы обмена валют
const EXCHANGE_RATES: ExchangeRate[] = [
  {
    from: 'CCC',
    to: 'CS',
    rate: 200, // 200 CCC = 1 CS
    commission: 0,
    minAmount: 1,
    maxAmount: 1000000
  },
  {
    from: 'CS',
    to: 'CCC',
    rate: 0.005, // 1 CS = 200 CCC
    commission: 0,
    minAmount: 0.001,
    maxAmount: 10000
  },
  {
    from: 'CS',
    to: 'TON',
    rate: 100, // 100 CS = 1 TON
    commission: 2, // 2% комиссия
    minAmount: 1,
    maxAmount: 50000
  },
  {
    from: 'TON',
    to: 'CS',
    rate: 0.01, // 1 TON = 100 CS
    commission: 2, // 2% комиссия
    minAmount: 0.01,
    maxAmount: 1000
  }
];

const ExchangePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { player, currentSystem, convertCurrency } = usePlayer();
  
  const [fromCurrency, setFromCurrency] = useState<'CCC' | 'CS' | 'TON'>('CCC');
  const [toCurrency, setToCurrency] = useState<'CS' | 'CCC' | 'TON'>('CS');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);

  const colorStyle = player?.color || '#00f0ff';

  // Находим текущий курс обмена
  useEffect(() => {
    const rate = EXCHANGE_RATES.find(r => r.from === fromCurrency && r.to === toCurrency);
    setSelectedRate(rate || null);
    if (fromAmount && rate) {
      calculateToAmount(fromAmount, rate);
    } else {
      setToAmount('');
    }
  }, [fromCurrency, toCurrency, fromAmount]);

  // Вычисление суммы получения
  const calculateToAmount = (amount: string, rate: ExchangeRate) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setToAmount('');
      return;
    }

    let result = 0;
    if (rate.from === 'CCC' && rate.to === 'CS') {
      result = num / 200; // 200 CCC = 1 CS
    } else if (rate.from === 'CS' && rate.to === 'CCC') {
      result = num * 200; // 1 CS = 200 CCC
    } else if (rate.from === 'CS' && rate.to === 'TON') {
      result = num / 100; // 100 CS = 1 TON
      // Применяем комиссию если не верифицирован
      if (!player?.verified && rate.commission > 0) {
        result = result * (1 - rate.commission / 100);
      }
    } else if (rate.from === 'TON' && rate.to === 'CS') {
      result = num * 100; // 1 TON = 100 CS
      // Применяем комиссию если не верифицирован
      if (!player?.verified && rate.commission > 0) {
        result = result * (1 - rate.commission / 100);
      }
    }

    setToAmount(result.toFixed(8));
  };

  // Обработка изменения валюты "От"
  const handleFromCurrencyChange = (currency: 'CCC' | 'CS' | 'TON') => {
    setFromCurrency(currency);
    setError(null);
    
    // Автоматически меняем валюту "К" на доступную
    if (currency === 'CCC') {
      setToCurrency('CS');
    } else if (currency === 'CS') {
      setToCurrency('CCC');
    } else if (currency === 'TON') {
      setToCurrency('CS');
    }
  };

  // Обработка изменения валюты "К"
  const handleToCurrencyChange = (currency: 'CS' | 'CCC' | 'TON') => {
    setToCurrency(currency);
    setError(null);
    
    // Проверяем доступность направления
    if (currency === 'TON' && fromCurrency !== 'CS') {
      setFromCurrency('CS');
    } else if (currency === 'CS' && fromCurrency === 'CS') {
      setFromCurrency('CCC');
    } else if (currency === 'CCC' && fromCurrency === 'CCC') {
      setFromCurrency('CS');
    }
  };

  // Получение доступных валют для обмена
  const getAvailableToCurrencies = () => {
    const available = ['CCC', 'CS', 'TON'].filter(curr => curr !== fromCurrency);
    return available;
  };

  // Получение баланса валюты
  const getBalance = (currency: string) => {
    if (!player) return 0;
    switch (currency) {
      case 'CCC': return player.ccc || 0;
      case 'CS': return player.cs || 0;
      case 'TON': return player.ton || 0;
      default: return 0;
    }
  };

  // Проверка возможности обмена
  const canExchange = () => {
    if (!selectedRate || !fromAmount) return false;
    
    const amount = parseFloat(fromAmount);
    const balance = getBalance(fromCurrency);
    
    if (isNaN(amount) || amount <= 0) return false;
    if (amount > balance) return false;
    if (amount < selectedRate.minAmount) return false;
    if (amount > selectedRate.maxAmount) return false;
    
    return true;
  };

  // Выполнение обмена
  const handleExchange = async () => {
    if (!canExchange() || !selectedRate) return;
    
    setIsCalculating(true);
    setError(null);
    
    try {
      const amount = parseFloat(fromAmount);
      
      // Отправляем запрос на сервер
      const response = await axios.post(`${API_URL}/api/player/exchange`, {
        telegram_id: player?.telegram_id,
        fromCurrency: fromCurrency.toLowerCase(),
        toCurrency: toCurrency.toLowerCase(),
        amount: amount,
        expectedResult: parseFloat(toAmount),
        verified: player?.verified || false
      });
      
      if (response.data.success) {
        // Обновляем данные игрока через контекст
        await convertCurrency(amount, fromCurrency.toLowerCase() as any, toCurrency.toLowerCase() as any);
        
        // Очищаем форму
        setFromAmount('');
        setToAmount('');
        setError(null);
      } else {
        setError(response.data.message || t('exchange.exchange_error'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('failed_to_convert_currency'));
    } finally {
      setIsCalculating(false);
    }
  };

  // Установка максимальной суммы
  const setMaxAmount = () => {
    const balance = getBalance(fromCurrency);
    const maxAllowed = selectedRate?.maxAmount || balance;
    const maxAmount = Math.min(balance, maxAllowed);
    setFromAmount(maxAmount.toString());
  };

  // Получение информации о комиссии
  const getCommissionInfo = () => {
    if (!selectedRate || selectedRate.commission === 0) return null;
    
    const isVerified = player?.verified;
    if (isVerified) {
      return {
        text: t('exchange.commission_verified'),
        color: '#4ade80'
      };
    } else {
      return {
        text: t('exchange.commission_unverified', { rate: selectedRate.commission }),
        color: '#f59e0b'
      };
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        position: 'relative'
      }}
    >
      {/* Верхняя панель с валютами */}
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />

      {/* Основной контент */}
      <div style={{ marginTop: '150px', paddingBottom: '130px' }}>
        <div style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <h1 style={{ 
            color: colorStyle, 
            textShadow: `0 0 20px ${colorStyle}`, 
            fontSize: '2.5rem', 
            marginBottom: '30px',
            fontWeight: 'bold'
          }}>
            💱 {t('exchange')}
          </h1>
          
          {/* Основная форма обмена */}
          <div style={{
            margin: '20px auto',
            padding: '40px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            border: `2px solid ${colorStyle}40`,
            borderRadius: '25px',
            boxShadow: `0 0 40px ${colorStyle}20`,
            maxWidth: '450px',
            position: 'relative'
          }}>
            {/* Декоративный элемент */}
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              background: `linear-gradient(45deg, ${colorStyle}30, transparent, ${colorStyle}30)`,
              borderRadius: '25px',
              zIndex: -1
            }} />

            {/* Блок "От" */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '25px',
              marginBottom: '20px',
              border: `1px solid ${colorStyle}30`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <label style={{ color: '#ccc', fontSize: '1.1rem', fontWeight: '500' }}>
                  {t('exchange.from')}
                </label>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>
                  {t('exchange.balance')}: {getBalance(fromCurrency).toLocaleString()} {fromCurrency}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <select
                  value={fromCurrency}
                  onChange={(e) => handleFromCurrencyChange(e.target.value as 'CCC' | 'CS' | 'TON')}
                  style={{
                    padding: '15px',
                    minWidth: '100px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: `2px solid ${colorStyle}60`,
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  <option value="CCC">💠 CCC</option>
                  <option value="CS">✨ CS</option>
                  <option value="TON">💎 TON</option>
                </select>
                
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder={t('exchange.enter_amount')}
                    style={{
                      padding: '15px',
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: `2px solid ${colorStyle}60`,
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      boxSizing: 'border-box',
                      textAlign: 'right'
                    }}
                  />
                  <button
                    onClick={setMaxAmount}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: colorStyle,
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {t('exchange.max')}
                  </button>
                </div>
              </div>
            </div>

            {/* Стрелка обмена */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              margin: '20px 0'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colorStyle}60, ${colorStyle}40)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                boxShadow: `0 0 20px ${colorStyle}40`,
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) rotate(180deg)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
              ⇅
            </div>
            </div>

            {/* Блок "К" */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              padding: '25px',
              marginBottom: '25px',
              border: `1px solid ${colorStyle}30`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <label style={{ color: '#ccc', fontSize: '1.1rem', fontWeight: '500' }}>
                  {t('exchange.to')}
                </label>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>
                  {t('exchange.balance')}: {getBalance(toCurrency).toLocaleString()} {toCurrency}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <select
                  value={toCurrency}
                  onChange={(e) => handleToCurrencyChange(e.target.value as 'CS' | 'CCC' | 'TON')}
                  style={{
                    padding: '15px',
                    minWidth: '100px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: `2px solid ${colorStyle}60`,
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  {getAvailableToCurrencies().map(currency => (
                    <option key={currency} value={currency}>
                      {currency === 'CCC' ? '💠 CCC' : 
                       currency === 'CS' ? '✨ CS' : '💎 TON'}
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  value={toAmount}
                  readOnly
                  placeholder={t('exchange.enter_amount')}
                  style={{
                    padding: '15px',
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: `2px solid ${colorStyle}30`,
                    borderRadius: '12px',
                    color: colorStyle,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    textAlign: 'right',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Информация о курсе и комиссии */}
            {selectedRate && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '15px',
                padding: '20px',
                marginBottom: '25px',
                border: `1px solid ${colorStyle}20`
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{ color: '#ccc' }}>{t('exchange.rate')}:</span>
                  <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                    {selectedRate.from === 'CCC' ? t('exchange.rate_ccc_cs') : 
                     selectedRate.from === 'CS' && selectedRate.to === 'CCC' ? t('exchange.rate_cs_ccc') :
                     selectedRate.from === 'CS' && selectedRate.to === 'TON' ? t('exchange.rate_cs_ton') :
                     selectedRate.from === 'TON' && selectedRate.to === 'CS' ? t('exchange.rate_ton_cs') : 
                     `1 ${selectedRate.from} = ${selectedRate.rate} ${selectedRate.to}`}
                  </span>
                </div>
                
                {getCommissionInfo() && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{ color: '#ccc' }}>{t('exchange.commission')}:</span>
                    <span style={{ color: getCommissionInfo()?.color, fontWeight: 'bold' }}>
                      {player?.verified ? t('exchange.commission_verified') : 
                       t('exchange.commission_unverified', { rate: selectedRate.commission })}
                    </span>
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.9rem',
                  color: '#888'
                }}>
                  <span>{t('exchange.limits')}:</span>
                  <span>{selectedRate.minAmount} - {selectedRate.maxAmount.toLocaleString()} {selectedRate.from}</span>
                </div>
              </div>
            )}

            {/* Кнопка обмена */}
            <button
              onClick={handleExchange}
              disabled={!canExchange() || isCalculating}
              style={{
                padding: '18px 40px',
                width: '100%',
                background: canExchange() && !isCalculating
                  ? `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}40, ${colorStyle}80)` 
                  : 'rgba(128, 128, 128, 0.3)',
                boxShadow: canExchange() && !isCalculating
                  ? `0 0 30px ${colorStyle}60` 
                  : 'none',
                color: '#fff',
                border: `2px solid ${canExchange() && !isCalculating ? colorStyle : '#555'}`,
                borderRadius: '15px',
                cursor: canExchange() && !isCalculating ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                if (canExchange() && !isCalculating) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 0 40px ${colorStyle}80`;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = canExchange() && !isCalculating
                  ? `0 0 30px ${colorStyle}60` 
                  : 'none';
              }}
            >
              {isCalculating ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: `3px solid ${colorStyle}30`,
                    borderTop: `3px solid ${colorStyle}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  {t('exchange.processing')}
                </span>
              ) : (
                <>🔄 {t('exchange.exchange_button')}</>
              )}
            </button>

            {/* Ошибка */}
            {error && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid #ef4444',
                borderRadius: '12px',
                color: '#ef4444',
                textAlign: 'center',
                fontWeight: '500'
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Информационные карточки */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            margin: '30px auto',
            maxWidth: '900px'
          }}>
            {/* Курсы валют */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: `1px solid ${colorStyle}30`,
              boxShadow: `0 0 25px ${colorStyle}15`
            }}>
              <h3 style={{ color: colorStyle, marginBottom: '20px', fontSize: '1.4rem', textAlign: 'center' }}>
                📊 {t('exchange.rates_title')}
              </h3>
              <div style={{ lineHeight: '1.8', color: '#ccc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>💠 CCC → ✨ CS</span>
                  <span style={{ color: colorStyle, fontWeight: 'bold' }}>200:1</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>✨ CS → 💠 CCC</span>
                  <span style={{ color: colorStyle, fontWeight: 'bold' }}>1:200</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>✨ CS → 💎 TON</span>
                  <span style={{ color: colorStyle, fontWeight: 'bold' }}>100:1</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span>💎 TON → ✨ CS</span>
                  <span style={{ color: colorStyle, fontWeight: 'bold' }}>1:100</span>
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#aaa', 
                  textAlign: 'center',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px'
                }}>
                  💡 {t('exchange.rates_info')}
                </div>
              </div>
            </div>

            {/* Комиссии */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: `1px solid ${colorStyle}30`,
              boxShadow: `0 0 25px ${colorStyle}15`
            }}>
              <h3 style={{ color: colorStyle, marginBottom: '20px', fontSize: '1.4rem', textAlign: 'center' }}>
                💰 {t('exchange.commissions_title')}
              </h3>
              <div style={{ lineHeight: '1.8', color: '#ccc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>CCC ⇄ CS</span>
                  <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{t('exchange.no_commission')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>CS ⇄ TON</span>
                  <span style={{ color: player?.verified ? '#4ade80' : '#f59e0b', fontWeight: 'bold' }}>
                    {player?.verified ? t('exchange.no_commission') : '2%'}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#aaa', 
                  textAlign: 'center',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  marginTop: '15px'
                }}>
                  {player?.verified ? (
                    <span style={{ color: '#4ade80' }}>✅ {t('exchange.verified_status')}</span>
                  ) : (
                    <span>🔒 {t('exchange.verification_hint')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
      
      {/* CSS для анимации */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ExchangePage;