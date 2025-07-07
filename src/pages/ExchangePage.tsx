import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

interface ExchangePair {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  fromIcon: string;
  toIcon: string;
  rate: number;
  rateText: string;
  hasCommission: boolean;
  minAmount: number;
}

const EXCHANGE_PAIRS: ExchangePair[] = [
  {
    id: 'ccc-cs',
    fromCurrency: 'CCC',
    toCurrency: 'CS',
    fromIcon: '💠',
    toIcon: '✨',
    rate: 0.001,
    rateText: '1000 CCC = 1 CS',
    hasCommission: false,
    minAmount: 100
  },
  {
    id: 'cs-ccc',
    fromCurrency: 'CS',
    toCurrency: 'CCC',
    fromIcon: '✨',
    toIcon: '💠',
    rate: 1000,
    rateText: '1 CS = 1000 CCC',
    hasCommission: false,
    minAmount: 1
  },
  {
    id: 'cs-ton',
    fromCurrency: 'CS',
    toCurrency: 'TON',
    fromIcon: '✨',
    toIcon: '💎',
    rate: 0.0001,
    rateText: '10000 CS = 1 TON',
    hasCommission: true,
    minAmount: 1
  },
  {
    id: 'ton-cs',
    fromCurrency: 'TON',
    toCurrency: 'CS',
    fromIcon: '💎',
    toIcon: '✨',
    rate: 10000,
    rateText: '1 TON = 10000 CS',
    hasCommission: true,
    minAmount: 0.01
  }
];

const ExchangePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { player, currentSystem, convertCurrency } = usePlayer();
  const [selectedPair, setSelectedPair] = useState<ExchangePair | null>(null);
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const colorStyle = player?.color || '#00f0ff';

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

  // Расчет результата обмена (по курсам из API)
  const calculateResult = (pair: ExchangePair, inputAmount: string) => {
    const num = parseFloat(inputAmount);
    if (isNaN(num) || num <= 0) return '';

    let result = 0;
    
    // Курсы из вашего API: ccc_to_cs: 0.001, cs_to_ton: 0.0001, ton_to_cs: 10000, cs_to_ccc: 1000
    if (pair.fromCurrency === 'CCC' && pair.toCurrency === 'CS') {
      result = num * 0.001; // 1000 CCC = 1 CS
    } else if (pair.fromCurrency === 'CS' && pair.toCurrency === 'CCC') {
      result = num * 1000; // 1 CS = 1000 CCC
    } else if (pair.fromCurrency === 'CS' && pair.toCurrency === 'TON') {
      result = num * 0.0001; // 10000 CS = 1 TON
      if (!player?.verified) {
        result = result * 0.98; // 2% комиссия
      }
    } else if (pair.fromCurrency === 'TON' && pair.toCurrency === 'CS') {
      result = num * 10000; // 1 TON = 10000 CS
      if (!player?.verified) {
        result = result * 0.98; // 2% комиссия
      }
    }

    return result.toFixed(8);
  };

  // Обновление результата при изменении суммы
  useEffect(() => {
    if (selectedPair && amount) {
      const calculatedResult = calculateResult(selectedPair, amount);
      setResult(calculatedResult);
    } else {
      setResult('');
    }
  }, [selectedPair, amount, player?.verified]);

  // Проверка возможности обмена
  const canExchange = () => {
    if (!selectedPair || !amount || !result) return false;
    
    const inputAmount = parseFloat(amount);
    const balance = getBalance(selectedPair.fromCurrency);
    
    if (isNaN(inputAmount) || inputAmount <= 0) return false;
    if (inputAmount > balance) return false;
    if (inputAmount < selectedPair.minAmount) return false;
    
    return true;
  };

  // Выполнение обмена
  const handleExchange = async () => {
    if (!canExchange() || !selectedPair) return;
    
    setIsExchanging(true);
    setError(null);
    setSuccess(null);
    
    try {
      const inputAmount = parseFloat(amount);
      
      // Используем API endpoint /api/exchange/convert
      const response = await axios.post(`${API_URL}/api/exchange/convert`, {
        telegramId: player?.telegram_id,
        fromCurrency: selectedPair.fromCurrency.toLowerCase(),
        toCurrency: selectedPair.toCurrency.toLowerCase(),
        amount: inputAmount
      });
      
      if (response.data) {
        // Обновляем данные игрока из ответа сервера
        setSuccess('Обмен выполнен успешно!');
        setAmount('');
        setResult('');
        setSelectedPair(null);
        
        // Перезагружаем данные игрока
        window.location.reload();
        
        // Убираем уведомление через 3 секунды
        setTimeout(() => setSuccess(null), 3000);
      }
      
    } catch (err: any) {
      console.error('Exchange error:', err);
      if (err.response?.data?.error) {
        // Переводим ошибки с сервера
        const errorMessage = err.response.data.error;
        switch (errorMessage) {
          case 'Not enough CCC':
            setError('Недостаточно CCC');
            break;
          case 'Not enough CS':
            setError('Недостаточно CS');
            break;
          case 'Not enough TON':
            setError('Недостаточно TON');
            break;
          case 'Invalid conversion pair':
            setError('Недопустимая валютная пара');
            break;
          case 'Player not found':
            setError('Игрок не найден');
            break;
          default:
            setError(errorMessage);
        }
      } else {
        setError('Ошибка при обмене валют');
      }
    } finally {
      setIsExchanging(false);
    }
  };

  // Закрытие модального окна обмена
  const closeExchangeModal = () => {
    setSelectedPair(null);
    setAmount('');
    setResult('');
    setError(null);
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

          {/* Уведомления */}
          {success && (
            <div style={{
              margin: '20px auto',
              padding: '15px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              borderRadius: '15px',
              color: '#22c55e',
              maxWidth: '500px',
              fontWeight: '500'
            }}>
              ✅ {success}
            </div>
          )}

          {/* Валютные пары */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            margin: '30px auto',
            maxWidth: '800px'
          }}>
            {EXCHANGE_PAIRS.map((pair) => {
              const balance = getBalance(pair.fromCurrency);
              const hasCommission = pair.hasCommission && !player?.verified;
              
              return (
                <div
                  key={pair.id}
                  onClick={() => setSelectedPair(pair)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '25px',
                    border: `2px solid ${colorStyle}30`,
                    boxShadow: `0 0 25px ${colorStyle}15`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 0 35px ${colorStyle}25`;
                    e.currentTarget.style.borderColor = `${colorStyle}60`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 0 25px ${colorStyle}15`;
                    e.currentTarget.style.borderColor = `${colorStyle}30`;
                  }}
                >
                  {/* Иконка комиссии */}
                  {hasCommission && (
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      background: '#f59e0b',
                      color: '#000',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      2%
                    </div>
                  )}
                  
                  {/* Валютная пара */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <div style={{
                        fontSize: '2.5rem',
                        filter: `drop-shadow(0 0 10px ${colorStyle}60)`
                      }}>
                        {pair.fromIcon}
                      </div>
                      <span style={{
                        color: colorStyle,
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}>
                        {pair.fromCurrency}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '1.5rem',
                      color: '#aaa'
                    }}>
                      →
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <div style={{
                        fontSize: '2.5rem',
                        filter: `drop-shadow(0 0 10px ${colorStyle}60)`
                      }}>
                        {pair.toIcon}
                      </div>
                      <span style={{
                        color: colorStyle,
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}>
                        {pair.toCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Курс обмена */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '15px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      color: colorStyle,
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      marginBottom: '5px'
                    }}>
                      {pair.rateText}
                    </div>
                    {hasCommission && (
                      <div style={{
                        color: '#f59e0b',
                        fontSize: '0.9rem'
                      }}>
                        Комиссия: 2%
                      </div>
                    )}
                  </div>

                  {/* Баланс */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#aaa',
                    fontSize: '0.9rem'
                  }}>
                    <span>Доступно:</span>
                    <span style={{ color: '#fff', fontWeight: '500' }}>
                      {balance.toLocaleString()} {pair.fromCurrency}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Информационные карточки */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            margin: '40px auto',
            maxWidth: '800px'
          }}>
            {/* Комиссии */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: `1px solid ${colorStyle}30`,
              boxShadow: `0 0 25px ${colorStyle}15`
            }}>
              <h3 style={{ color: colorStyle, marginBottom: '20px', fontSize: '1.3rem', textAlign: 'center' }}>
                💰 {t('exchange.commissions_title')}
              </h3>
              <div style={{ lineHeight: '1.6', color: '#ccc', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>CCC ⇄ CS</span>
                  <span style={{ color: '#4ade80', fontWeight: 'bold' }}>0%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span>CS ⇄ TON</span>
                  <span style={{ color: player?.verified ? '#4ade80' : '#f59e0b', fontWeight: 'bold' }}>
                    {player?.verified ? '0%' : '2%'}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#aaa', 
                  textAlign: 'center',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px'
                }}>
                  {player?.verified ? (
                    <span style={{ color: '#4ade80' }}>✅ Вы верифицированы</span>
                  ) : (
                    <span>🔒 Пройдите верификацию для отмены комиссий</span>
                  )}
                </div>
              </div>
            </div>

            {/* Лимиты */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: `1px solid ${colorStyle}30`,
              boxShadow: `0 0 25px ${colorStyle}15`
            }}>
              <h3 style={{ color: colorStyle, marginBottom: '20px', fontSize: '1.3rem', textAlign: 'center' }}>
                📊 Минимальные суммы
              </h3>
              <div style={{ lineHeight: '1.6', color: '#ccc', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>CCC → CS</span>
                  <span style={{ color: colorStyle, fontWeight: 'bold' }}>100 CCC</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>CS → CCC</span>
                  <span style={{ color: colorStyle, fontWeight: 'bold' }}>1 CS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>CS → TON</span>
                  <span style={{ color: colorStyle, fontWeight: 'bold' }}>1 CS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>TON → CS</span>
                  <span style={{ color: colorStyle, fontWeight: 'bold' }}>0.01 TON</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно обмена */}
      {selectedPair && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            borderRadius: '25px',
            padding: '40px',
            maxWidth: '450px',
            width: '100%',
            border: `2px solid ${colorStyle}40`,
            boxShadow: `0 0 50px ${colorStyle}30`,
            position: 'relative'
          }}>
            {/* Кнопка закрытия */}
            <button
              onClick={closeExchangeModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ✕
            </button>

            <h3 style={{ 
              color: colorStyle, 
              marginBottom: '25px', 
              fontSize: '1.5rem',
              textAlign: 'center'
            }}>
              {selectedPair.fromIcon} {selectedPair.fromCurrency} → {selectedPair.toIcon} {selectedPair.toCurrency}
            </h3>

            {/* Курс */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: colorStyle, fontWeight: 'bold', marginBottom: '5px' }}>
                {selectedPair.rateText}
              </div>
              {selectedPair.hasCommission && !player?.verified && (
                <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                  Комиссия: 2%
                </div>
              )}
            </div>

            {/* Ввод суммы */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#ccc', marginBottom: '10px', display: 'block' }}>
                Сумма ({selectedPair.fromCurrency}):
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Минимум ${selectedPair.minAmount}`}
                style={{
                  padding: '15px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${colorStyle}60`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  boxSizing: 'border-box',
                  // Убираем стрелочки
                  MozAppearance: 'textfield'
                }}
              />
            </div>

            {/* Результат */}
            {result && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#ccc' }}>Получите:</span>
                  <span style={{ color: colorStyle, fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {result} {selectedPair.toCurrency}
                  </span>
                </div>
              </div>
            )}

            {/* Ошибка */}
            {error && (
              <div style={{
                marginBottom: '20px',
                padding: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.9rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={closeExchangeModal}
                style={{
                  padding: '15px 25px',
                  flex: 1,
                  background: 'rgba(128, 128, 128, 0.3)',
                  border: '2px solid #666',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              
              <button
                onClick={handleExchange}
                disabled={!canExchange() || isExchanging}
                style={{
                  padding: '15px 25px',
                  flex: 1,
                  background: canExchange() && !isExchanging
                    ? `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}40)`
                    : 'rgba(128, 128, 128, 0.3)',
                  border: `2px solid ${canExchange() && !isExchanging ? colorStyle : '#666'}`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: canExchange() && !isExchanging ? 'pointer' : 'not-allowed'
                }}
              >
                {isExchanging ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: `2px solid ${colorStyle}30`,
                      borderTop: `2px solid ${colorStyle}`,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Обмен...
                  </span>
                ) : (
                  'Обменять'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
      
      {/* CSS для анимации */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Убираем стрелочки в input type="number" для всех браузеров */
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
    </div>
  );
};

export default ExchangePage;