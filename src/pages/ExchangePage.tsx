import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
    rate: 200,
    rateText: '200 CCC = 1 CS',
    hasCommission: false,
    minAmount: 100
  },
  {
    id: 'cs-ccc',
    fromCurrency: 'CS',
    toCurrency: 'CCC',
    fromIcon: '✨',
    toIcon: '💠',
    rate: 0.005,
    rateText: '1 CS = 200 CCC',
    hasCommission: false,
    minAmount: 1
  },
  {
    id: 'cs-ton',
    fromCurrency: 'CS',
    toCurrency: 'TON',
    fromIcon: '✨',
    toIcon: '💎',
    rate: 100,
    rateText: '100 CS = 1 TON',
    hasCommission: true,
    minAmount: 1
  },
  {
    id: 'ton-cs',
    fromCurrency: 'TON',
    toCurrency: 'CS',
    fromIcon: '💎',
    toIcon: '✨',
    rate: 0.01,
    rateText: '1 TON = 100 CS',
    hasCommission: true,
    minAmount: 0.01
  }
];

const ExchangePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const playerContext = usePlayer(); // Получаем весь контекст
  const { player, currentSystem, convertCurrency } = playerContext;
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

  // Расчет результата обмена (правильные курсы)
  const calculateResult = (pair: ExchangePair, inputAmount: string) => {
    const num = parseFloat(inputAmount);
    if (isNaN(num) || num <= 0) return '';

    let result = 0;
    
    if (pair.fromCurrency === 'CCC' && pair.toCurrency === 'CS') {
      result = num / 200; // 200 CCC = 1 CS
    } else if (pair.fromCurrency === 'CS' && pair.toCurrency === 'CCC') {
      result = num * 200; // 1 CS = 200 CCC
    } else if (pair.fromCurrency === 'CS' && pair.toCurrency === 'TON') {
      result = num / 100; // 100 CS = 1 TON
      if (!player?.verified) {
        result = result * 0.98; // 2% комиссия
      }
    } else if (pair.fromCurrency === 'TON' && pair.toCurrency === 'CS') {
      result = num * 100; // 1 TON = 100 CS
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

  // Проверка ошибок ввода
  const getInputError = () => {
    if (!selectedPair || !amount) return null;
    
    const inputAmount = parseFloat(amount);
    const balance = getBalance(selectedPair.fromCurrency);
    
    if (isNaN(inputAmount) || inputAmount <= 0) {
      return t('exchange_page.enter_valid_amount');
    }
    if (inputAmount < selectedPair.minAmount) {
      return t('exchange_page.minimum_amount', { amount: selectedPair.minAmount, currency: selectedPair.fromCurrency });
    }
    if (inputAmount > balance) {
      return t('exchange_page.insufficient_funds', { available: balance.toLocaleString(), currency: selectedPair.fromCurrency });
    }
    
    return null;
  };

  // Выполнение обмена
  const handleExchange = async () => {
    if (!canExchange() || !selectedPair) return;
    
    setIsExchanging(true);
    setError(null);
    setSuccess(null);
    
    try {
      const inputAmount = parseFloat(amount);
      
      console.log('Отправка запроса на обмен:', {
        telegramId: player?.telegram_id,
        fromCurrency: selectedPair.fromCurrency.toLowerCase(),
        toCurrency: selectedPair.toCurrency.toLowerCase(),
        amount: inputAmount
      });
      
      // Используем API endpoint /api/exchange/convert
      const response = await axios.post(`${API_URL}/api/exchange/convert`, {
        telegramId: player?.telegram_id,
        fromCurrency: selectedPair.fromCurrency.toLowerCase(),
        toCurrency: selectedPair.toCurrency.toLowerCase(),
        amount: inputAmount
      });
      
      console.log('Ответ от сервера:', response.data);
      
      if (response.data && response.data.success) {
        // Успешный обмен
        setSuccess(t('exchange_page.exchange_success'));
        setAmount('');
        setResult('');
        setSelectedPair(null);
        
        console.log('Обмен успешен! Новые данные игрока:', response.data.player);
        
        // 🔥 ОБНОВЛЯЕМ ДАННЫЕ ИГРОКА МГНОВЕННО
        if (response.data.player) {
          console.log('Доступные функции в контексте:', Object.keys(playerContext));
          
          // Пробуем разные методы обновления контекста
          if (typeof playerContext.setPlayer === 'function') {
            console.log('Обновляем через setPlayer');
            playerContext.setPlayer(response.data.player);
          } else if (typeof playerContext.updatePlayer === 'function') {
            console.log('Обновляем через updatePlayer');
            playerContext.updatePlayer();
          } else if (typeof playerContext.refreshPlayer === 'function') {
            console.log('Обновляем через refreshPlayer');
            playerContext.refreshPlayer();
  //        } else if (typeof playerContext.refreshPlayer === 'function') {
  //          console.log('Обновляем через refreshPlayer');
  //          playerContext.refreshPlayer();
          } else {
            console.warn('Не найдена функция для обновления игрока. Доступные функции:', Object.keys(playerContext));
            
            // В крайнем случае обновляем балансы напрямую
            const newPlayer = response.data.player;
            console.log('Пытаемся обновить балансы напрямую:', {
              старый_ccc: player?.ccc,
              новый_ccc: newPlayer.ccc,
              старый_cs: player?.cs,
              новый_cs: newPlayer.cs,
              старый_ton: player?.ton,
              новый_ton: newPlayer.ton
            });
          }
        }
        
        // Убираем уведомление через 3 секунды
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(t('exchange_page.exchange_error'));
      }
      
    } catch (err: any) {
      console.error('Exchange error:', err);
      
      if (err.response?.status === 400 && err.response?.data?.error) {
        // Переводим ошибки с сервера
        const errorMessage = err.response.data.error;
        switch (errorMessage) {
          case 'Not enough CCC':
            setError(t('exchange_page.not_enough_ccc'));
            break;
          case 'Not enough CS':
            setError(t('exchange_page.not_enough_cs'));
            break;
          case 'Not enough TON':
            setError(t('exchange_page.not_enough_ton'));
            break;
          case 'Invalid conversion pair':
            setError(t('exchange_page.invalid_pair'));
            break;
          case 'Player not found':
            setError(t('exchange_page.player_not_found'));
            break;
          case 'Missing required fields or invalid amount':
            setError(t('exchange_page.enter_valid_amount'));
            break;
          default:
            setError(errorMessage);
        }
      } else if (err.response?.status === 500) {
        setError('Ошибка сервера. Попробуйте позже.');
      } else if (err.code === 'ECONNABORTED' || err.code === 'NETWORK_ERROR') {
        setError('Ошибка сети. Проверьте подключение.');
      } else {
        setError(t('exchange_page.exchange_error'));
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
      <div style={{ marginTop: '80px', paddingBottom: '130px' }}>
        <div style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <h3 style={{ 
            color: colorStyle, 
            textShadow: `0 0 20px ${colorStyle}`, 
            fontSize: '2rem', 
            marginBottom: '30px',
            fontWeight: 'bold'
          }}>
            💱 {t('exchange')}
          </h3>

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
                    borderRadius: '15px',
                    padding: '20px',
                    border: `2px solid ${colorStyle}30`,
                    boxShadow: `0 0 20px ${colorStyle}15`,
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
                      top: '10px',
                      right: '10px',
                      background: '#f59e0b',
                      color: '#000',
                      padding: '3px 6px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      2%
                    </div>
                  )}
                  
                  {/* Валютная пара - горизонтальный стиль */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '15px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>{pair.fromIcon}</span>
                    <span style={{ color: colorStyle }}>{pair.fromCurrency}</span>
                    <span style={{ color: '#aaa', margin: '0 4px' }}>→</span>
                    <span style={{ color: colorStyle }}>{pair.toCurrency}</span>
                    <span style={{ fontSize: '1.5rem' }}>{pair.toIcon}</span>
                  </div>

                  {/* Курс обмена */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      color: colorStyle,
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      marginBottom: hasCommission ? '4px' : '0'
                    }}>
                      {pair.rateText}
                    </div>
                    {hasCommission && (
                      <div style={{
                        color: '#f59e0b',
                        fontSize: '0.8rem'
                      }}>
                        {t('exchange_page.commission')}: 2%
                      </div>
                    )}
                  </div>

                  {/* Баланс */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#aaa',
                    fontSize: '0.85rem'
                  }}>
                    <span>{t('exchange_page.available')}:</span>
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
                💰 {t('exchange_page.commissions_title')}
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
                    <span style={{ color: '#4ade80' }}>✅ {t('exchange_page.verified_status')}</span>
                  ) : (
                    <span>🔒 {t('exchange_page.verification_hint')}</span>
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
                📊 {t('exchange_page.minimum_amounts')}
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
                  {t('exchange_page.commission')}: 2%
                </div>
              )}
            </div>

            {/* Ввод суммы */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#ccc', marginBottom: '10px', display: 'block' }}>
                {t('exchange_page.amount')} ({selectedPair.fromCurrency}):
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`${t('exchange_page.minimum')} ${selectedPair.minAmount}`}
                style={{
                  padding: '15px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${getInputError() ? '#ef4444' : colorStyle}60`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  boxSizing: 'border-box',
                  // Убираем стрелочки
                  MozAppearance: 'textfield'
                }}
              />
              {/* Показываем доступную сумму */}
              <div style={{
                marginTop: '8px',
                fontSize: '0.9rem',
                color: '#aaa',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{t('exchange_page.available')}:</span>
                <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                  {getBalance(selectedPair.fromCurrency).toLocaleString()} {selectedPair.fromCurrency}
                </span>
              </div>
              
              {/* Ошибка валидации */}
              {getInputError() && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef444460',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.85rem'
                }}>
                  ⚠️ {getInputError()}
                </div>
              )}
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
                  <span style={{ color: '#ccc' }}>{t('exchange_page.you_receive')}:</span>
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
                {t('exchange_page.cancel')}
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
                    {t('exchange_page.processing')}
                  </span>
                ) : (
                  t('exchange_page.exchange_button')
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