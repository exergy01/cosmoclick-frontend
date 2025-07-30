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
  isDynamic?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
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
  },
  // 🌟 НОВАЯ ПАРА: STARS → CS (ИСПРАВЛЕНО)
  {
    id: 'stars-cs',
    fromCurrency: 'STARS',
    toCurrency: 'CS',
    fromIcon: '⭐',
    toIcon: '✨',
    rate: 0.4,
    rateText: '10 Stars = 4 CS', // 🔧 ИСПРАВЛЕНО: базовый курс для 10 Stars
    hasCommission: false,
    minAmount: 10,
    isDynamic: true
  }
];
const ExchangePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const playerContext = usePlayer();
  const { player, currentSystem } = playerContext;
  const [selectedPair, setSelectedPair] = useState<ExchangePair | null>(null);
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 🌟 Новые состояния для Stars
  const [starsRates, setStarsRates] = useState<any>(null);
  const [starsExchangeBlocked, setStarsExchangeBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState<any>(null);

  const colorStyle = player?.color || '#00f0ff';

  // 🌟 Функция получения курсов Stars
  const fetchStarsRates = async () => {
    try {
      console.log('📊 Получаем курсы Stars...');
      const response = await axios.get(`${API_URL}/api/stars/rates`);
      
      if (response.data) {
        setStarsRates(response.data.rates);
        setStarsExchangeBlocked(!response.data.exchange_available);
        setBlockInfo(response.data.block_info);
        
        console.log('📊 Курсы Stars получены:', {
          rates: response.data.rates,
          blocked: !response.data.exchange_available
        });
      }
    } catch (error) {
      console.error('❌ Ошибка получения курсов Stars:', error);
    }
  };

  // 🌟 Загрузка курсов при открытии страницы
  useEffect(() => {
    fetchStarsRates();
    const interval = setInterval(fetchStarsRates, 5 * 60 * 1000); // каждые 5 минут
    return () => clearInterval(interval);
  }, []);

  // Получение баланса валюты
  const getBalance = (currency: string) => {
    if (!player) return 0;
    switch (currency) {
      case 'CCC': return player.ccc || 0;
      case 'CS': return player.cs || 0;
      case 'TON': return player.ton || 0;
      case 'STARS': return player.telegram_stars || 0; // 🌟 НОВОЕ
      default: return 0;
    }
  };

  // Расчет результата обмена
  const calculateResult = (pair: ExchangePair, inputAmount: string) => {
    const num = parseFloat(inputAmount);
    if (isNaN(num) || num <= 0) return '';

    let result = 0;
    
    if (pair.fromCurrency === 'CCC' && pair.toCurrency === 'CS') {
      result = num / 200;
    } else if (pair.fromCurrency === 'CS' && pair.toCurrency === 'CCC') {
      result = num * 200;
    } else if (pair.fromCurrency === 'CS' && pair.toCurrency === 'TON') {
      result = num / 100;
      if (!player?.verified) {
        result = result * 0.98;
      }
    } else if (pair.fromCurrency === 'TON' && pair.toCurrency === 'CS') {
      result = num * 100;
      if (!player?.verified) {
        result = result * 0.98;
      }
    } else if (pair.fromCurrency === 'STARS' && pair.toCurrency === 'CS') {
      // 🌟 НОВЫЙ РАСЧЕТ STARS → CS
      const starsRate = starsRates?.STARS_CS?.rate || 0.4;
      result = num * starsRate;
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
  }, [selectedPair, amount, player?.verified, starsRates]);

  // Проверка возможности обмена
  const canExchange = () => {
    if (!selectedPair || !amount || !result) return false;
    
    const inputAmount = parseFloat(amount);
    const balance = getBalance(selectedPair.fromCurrency);
    
    if (isNaN(inputAmount) || inputAmount <= 0) return false;
    if (inputAmount > balance) return false;
    if (inputAmount < selectedPair.minAmount) return false;
    
    // Проверяем блокировку для Stars
    if (selectedPair.fromCurrency === 'STARS' && starsExchangeBlocked) return false;
    
    return true;
  };

  // Проверка ошибок ввода
  const getInputError = () => {
    if (!selectedPair || !amount) return null;
    
    const inputAmount = parseFloat(amount);
    const balance = getBalance(selectedPair.fromCurrency);
    
    if (isNaN(inputAmount) || inputAmount <= 0) {
      return 'Введите корректную сумму';
    }
    if (inputAmount < selectedPair.minAmount) {
      return `Минимум ${selectedPair.minAmount} ${selectedPair.fromCurrency}`;
    }
    if (inputAmount > balance) {
      return `Недостаточно средств (доступно: ${balance.toLocaleString()})`;
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
      
      let response;
      
      if (selectedPair.fromCurrency === 'STARS') {
        // 🌟 СПЕЦИАЛЬНЫЙ ЗАПРОС ДЛЯ STARS
        console.log('Отправка запроса на обмен Stars:', {
          telegramId: player?.telegram_id,
          starsAmount: inputAmount
        });
        
        response = await axios.post(`${API_URL}/api/stars/exchange`, {
          telegramId: player?.telegram_id,
          starsAmount: inputAmount
        });
      } else {
        // Обычный обмен валют
        console.log('Отправка запроса на обмен:', {
          telegramId: player?.telegram_id,
          fromCurrency: selectedPair.fromCurrency.toLowerCase(),
          toCurrency: selectedPair.toCurrency.toLowerCase(),
          amount: inputAmount
        });
        
        response = await axios.post(`${API_URL}/api/exchange/convert`, {
          telegramId: player?.telegram_id,
          fromCurrency: selectedPair.fromCurrency.toLowerCase(),
          toCurrency: selectedPair.toCurrency.toLowerCase(),
          amount: inputAmount
        });
      }
      
      console.log('Ответ от сервера:', response.data);
      
      if (response.data && response.data.success) {
        setSuccess('Обмен выполнен успешно!');
        setAmount('');
        setResult('');
        setSelectedPair(null);
        
        // Обновляем курсы Stars после успешного обмена
        if (selectedPair.fromCurrency === 'STARS') {
          await fetchStarsRates();
        }
        
        // Обновляем данные игрока
        if (response.data.player && typeof playerContext.setPlayer === 'function') {
          playerContext.setPlayer(response.data.player);
        }
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Ошибка при выполнении обмена');
      }
      
    } catch (err: any) {
      console.error('Exchange error:', err);
      
      if (err.response?.status === 423) {
        setError(`Обмен временно заблокирован: ${err.response.data.reason || 'Защита курса'}`);
      } else if (err.response?.status === 400 && err.response?.data?.error) {
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
          case 'Not enough Stars':
            setError('Недостаточно Stars');
            break;
          default:
            setError(errorMessage);
        }
      } else {
        setError('Ошибка при выполнении обмена');
      }
    } finally {
      setIsExchanging(false);
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
      <div style={{ marginTop: '80px', paddingBottom: '130px' }}>
        <div style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <h3 style={{ 
            color: colorStyle, 
            textShadow: `0 0 20px ${colorStyle}`, 
            fontSize: '2rem', 
            marginBottom: '30px',
            fontWeight: 'bold'
          }}>
            💱 Обмен валют
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
            maxWidth: '1000px'
          }}>
            {EXCHANGE_PAIRS.map((pair) => {
              const balance = getBalance(pair.fromCurrency);
              const hasCommission = pair.hasCommission && !player?.verified;
              
              // 🌟 Для Stars получаем динамический курс (ИСПРАВЛЕНО)
              let currentRate = pair.rate;
              let currentRateText = pair.rateText;
              let isPairBlocked = false;
              
              if (pair.fromCurrency === 'STARS') {
                const starsRate = starsRates?.STARS_CS?.rate || 0.4;
                currentRate = starsRate;
                
                // 🔧 ИСПРАВЛЕНО: показываем курс для минимального обмена 10 Stars
                const csFor10Stars = (10 * starsRate).toFixed(2);
                currentRateText = `10 Stars = ${csFor10Stars} CS`;
                
                isPairBlocked = starsExchangeBlocked;
              }
              
              return (
                <div
                  key={pair.id}
                  onClick={() => !isPairBlocked && setSelectedPair(pair)}
                  style={{
                    background: isPairBlocked 
                      ? 'rgba(128, 128, 128, 0.3)' 
                      : 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '15px',
                    padding: '20px',
                    border: `2px solid ${isPairBlocked ? '#666' : colorStyle}30`,
                    boxShadow: `0 0 20px ${isPairBlocked ? '#66666615' : colorStyle}15`,
                    cursor: isPairBlocked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    opacity: isPairBlocked ? 0.6 : 1
                  }}
                  onMouseEnter={!isPairBlocked ? e => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 0 35px ${colorStyle}25`;
                  } : undefined}
                  onMouseLeave={!isPairBlocked ? e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = `0 0 25px ${colorStyle}15`;
                  } : undefined}
                >
                  {/* Иконка блокировки */}
                  {isPairBlocked && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#ef4444',
                      color: '#fff',
                      padding: '3px 6px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      🚫 БЛОК
                    </div>
                  )}
                  
                  {/* Иконка динамического курса */}
                  {pair.isDynamic && !isPairBlocked && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#10b981',
                      color: '#fff',
                      padding: '3px 6px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      📈 LIVE
                    </div>
                  )}
                  
                  {/* Иконка комиссии */}
                  {hasCommission && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: pair.isDynamic ? '70px' : '10px',
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
                  
                  {/* Валютная пара */}
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
                      marginBottom: hasCommission || isPairBlocked ? '4px' : '0'
                    }}>
                      {currentRateText}
                    </div>
                    {hasCommission && (
                      <div style={{
                        color: '#f59e0b',
                        fontSize: '0.8rem'
                      }}>
                        Комиссия: 2%
                      </div>
                    )}
                    {isPairBlocked && blockInfo && (
                      <div style={{
                        color: '#ef4444',
                        fontSize: '0.8rem',
                        marginTop: '4px'
                      }}>
                        🚫 {blockInfo.reason || 'Обмен заблокирован'}
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
                    <span>Доступно:</span>
                    <span style={{ color: '#fff', fontWeight: '500' }}>
                      {balance.toLocaleString()} {pair.fromCurrency}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* 🌟 Информация о курсах Stars (ИСПРАВЛЕНО) */}
          {starsRates && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: `1px solid ${colorStyle}30`,
              boxShadow: `0 0 25px ${colorStyle}15`,
              margin: '30px auto',
              maxWidth: '600px'
            }}>
              <h3 style={{ 
                color: colorStyle, 
                marginBottom: '20px', 
                fontSize: '1.3rem', 
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                ⭐ Live курсы Stars
                <div style={{
                  background: '#10b981',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  LIVE
                </div>
              </h3>
              
              {/* Текущий курс TON */}
              {starsRates.TON_USD && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ color: '#ccc', fontSize: '0.9rem' }}>
                      💎 TON/USD:
                    </span>
                    <span style={{ 
                      color: colorStyle, 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem' 
                    }}>
                      ${parseFloat(starsRates.TON_USD.rate).toFixed(4)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: '#aaa'
                  }}>
                    <span>Источник: {starsRates.TON_USD.source}</span>
                    <span>
                      {new Date(starsRates.TON_USD.last_updated).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Текущий курс Stars → CS (ИСПРАВЛЕНО) */}
              {starsRates.STARS_CS && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ color: '#ccc', fontSize: '0.9rem' }}>
                      ⭐ 10 Stars → CS:
                    </span>
                    <span style={{ 
                      color: colorStyle, 
                      fontWeight: 'bold', 
                      fontSize: '1.1rem' 
                    }}>
                      {/* 🔧 ИСПРАВЛЕНО: показываем курс для 10 Stars */}
                      {(10 * parseFloat(starsRates.STARS_CS.rate)).toFixed(2)} CS
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: '#aaa'
                  }}>
                    <span>
                      {/* 🔧 ИСПРАВЛЕНО: показываем точный курс за 1 Star */}
                      1 Star = {parseFloat(starsRates.STARS_CS.rate).toFixed(4)} CS
                    </span>
                    <span>
                      Курс привязан к TON
                    </span>
                  </div>
                </div>
              )}
              
              {/* Статус обмена */}
              <div style={{
                background: starsExchangeBlocked 
                  ? 'rgba(239, 68, 68, 0.1)' 
                  : 'rgba(34, 197, 94, 0.1)',
                border: `1px solid ${starsExchangeBlocked ? '#ef4444' : '#22c55e'}`,
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {starsExchangeBlocked ? '🚫' : '✅'}
                  </span>
                  <span style={{
                    color: starsExchangeBlocked ? '#ef4444' : '#22c55e',
                    fontWeight: 'bold'
                  }}>
                    {starsExchangeBlocked ? 'Обмен заблокирован' : 'Обмен доступен'}
                  </span>
                </div>
                {starsExchangeBlocked && blockInfo && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#ef4444',
                    lineHeight: '1.4'
                  }}>
                    <div><strong>Причина:</strong> {blockInfo.reason}</div>
                    {blockInfo.blocked_until && (
                      <div>
                        <strong>До:</strong> {new Date(blockInfo.blocked_until).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
                {!starsExchangeBlocked && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#22c55e'
                  }}>
                    Курс обновляется автоматически каждый час
                  </div>
                )}
              </div>

              {/* 🔧 НОВОЕ: Примеры обмена */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                padding: '15px',
                fontSize: '0.85rem',
                color: '#ccc'
              }}>
                <div style={{ 
                  color: colorStyle, 
                  fontWeight: 'bold', 
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  📝 Примеры обмена:
                </div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>10 Stars (минимум)</span>
                    <span style={{ color: colorStyle }}>
                      {(10 * parseFloat(starsRates.STARS_CS.rate)).toFixed(2)} CS
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>50 Stars</span>
                    <span style={{ color: colorStyle }}>
                      {(50 * parseFloat(starsRates.STARS_CS.rate)).toFixed(2)} CS
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>100 Stars</span>
                    <span style={{ color: colorStyle }}>
                      {(100 * parseFloat(starsRates.STARS_CS.rate)).toFixed(2)} CS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
              onClick={() => setSelectedPair(null)}
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
                  border: `2px solid ${getInputError() ? '#ef4444' : colorStyle}60`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                marginTop: '8px',
                fontSize: '0.9rem',
                color: '#aaa',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Доступно:</span>
                <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                  {getBalance(selectedPair.fromCurrency).toLocaleString()} {selectedPair.fromCurrency}
                </span>
              </div>
              
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
                onClick={() => setSelectedPair(null)}
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