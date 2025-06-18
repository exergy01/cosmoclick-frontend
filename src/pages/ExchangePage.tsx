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

const ExchangePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { player, currentSystem, convertCurrency } = usePlayer();
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState<'ccc' | 'cs'>('ccc');
  const [error, setError] = useState<string | null>(null);
  const [totalPerHour, setTotalPerHour] = useState({ totalCccPerHour: 0, totalCsPerHour: 0 });

  const calculateTotalPerHour = useCallback(async () => {
    if (!player || !player.drones || !player.telegram_id) return { ccc: 0, cs: 0, ton: 0 };
    try {
      const dronesData = await axios.get(`${API_URL}/api/shop/drones/${player.telegram_id}`).then(res => res.data);
      const totalCccPerHour = player.drones.reduce((sum: number, d: any) => {
        const drone = dronesData.find((item: any) => item.id === d.id && item.system === d.system);
        return sum + (drone?.cccPerDay ? drone.cccPerDay / 24 : 0);
      }, 0);
      return { ccc: Number(totalCccPerHour.toFixed(5)), cs: 0, ton: 0 };
    } catch (err) {
      console.error('Error fetching drones for total per hour:', err);
      return { ccc: 0, cs: 0, ton: 0 };
    }
  }, [player?.drones, player?.telegram_id]);

  useEffect(() => {
    const fetchTotalPerHour = async () => {
      const { ccc: totalCccPerHour } = await calculateTotalPerHour();
      setTotalPerHour({ totalCccPerHour, totalCsPerHour: 0 });
    };
    fetchTotalPerHour();
  }, [calculateTotalPerHour]);

  const colorStyle = player?.color || '#00f0ff';

  const handleConvert = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t('invalid_amount'));
      return;
    }

    const toCurrency = fromCurrency === 'ccc' ? 'cs' : 'ccc';
    try {
      await convertCurrency(parsedAmount, fromCurrency, toCurrency);
      setAmount('');
      setError(null);
    } catch (err: any) {
      setError(t('failed_to_convert_currency'));
    }
  };

  const getExchangeRate = () => {
    if (fromCurrency === 'ccc') {
      return '1 CCC = 0.001 CS';
    } else {
      return '1 CS = 1000 CCC';
    }
  };

  const calculateResult = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return '0';
    
    if (fromCurrency === 'ccc') {
      return (parsedAmount * 0.001).toFixed(3);
    } else {
      return (parsedAmount * 1000).toFixed(2);
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
          <h2 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2.5rem', 
            marginBottom: '30px'
          }}>
            🔄 {t('exchange')}
          </h2>
          
          <div style={{
            margin: '20px auto',
            padding: '30px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '20px',
            boxShadow: `0 0 30px ${colorStyle}30`,
            maxWidth: '400px'
          }}>
            <h3 style={{ color: colorStyle, marginBottom: '20px', fontSize: '1.5rem' }}>
              💱 Обмен валют
            </h3>
            
            {/* Выбор валюты */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#ccc', marginBottom: '10px', display: 'block' }}>
                Из какой валюты:
              </label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as 'ccc' | 'cs')}
                style={{
                  padding: '12px',
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${colorStyle}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              >
                <option value="ccc">💠 CCC</option>
                <option value="cs">✨ CS</option>
              </select>
            </div>

            {/* Ввод количества */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#ccc', marginBottom: '10px', display: 'block' }}>
                Количество:
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('enter_amount')}
                style={{
                  padding: '12px',
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: `1px solid ${colorStyle}`,
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Информация о курсе */}
            <div style={{
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ color: '#ccc', marginBottom: '10px' }}>
                📊 Курс обмена: {getExchangeRate()}
              </p>
              {amount && (
                <p style={{ color: colorStyle, fontWeight: 'bold' }}>
                  Вы получите: {calculateResult()} {fromCurrency === 'ccc' ? 'CS' : 'CCC'}
                </p>
              )}
            </div>

            {/* Кнопка обмена */}
            <button
              onClick={handleConvert}
              disabled={!amount || parseFloat(amount) <= 0}
              style={{
                padding: '15px 30px',
                width: '100%',
                background: amount && parseFloat(amount) > 0 
                  ? `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)` 
                  : 'rgba(128, 128, 128, 0.3)',
                boxShadow: amount && parseFloat(amount) > 0 
                  ? `0 0 20px ${colorStyle}` 
                  : 'none',
                color: '#fff',
                border: `2px solid ${amount && parseFloat(amount) > 0 ? colorStyle : '#888'}`,
                borderRadius: '12px',
                cursor: amount && parseFloat(amount) > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
              onMouseEnter={e => {
                if (amount && parseFloat(amount) > 0) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 0 30px ${colorStyle}`;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = amount && parseFloat(amount) > 0 
                  ? `0 0 20px ${colorStyle}` 
                  : 'none';
              }}
            >
              🔄 {t('convert')}
            </button>

            {/* Ошибка */}
            {error && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: 'rgba(255, 68, 68, 0.2)',
                border: '1px solid #ff4444',
                borderRadius: '8px',
                color: '#ff4444'
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Информация о курсах */}
          <div style={{
            margin: '20px auto',
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${colorStyle}`,
            borderRadius: '15px',
            boxShadow: `0 0 20px ${colorStyle}30`,
            maxWidth: '400px'
          }}>
            <h3 style={{ color: colorStyle, marginBottom: '15px', fontSize: '1.3rem' }}>
              📈 Курсы валют
            </h3>
            <div style={{ textAlign: 'left', lineHeight: '1.6', color: '#ccc' }}>
              <p><strong style={{ color: colorStyle }}>CCC → CS:</strong> 1000:1 (0.1% комиссия)</p>
              <p><strong style={{ color: colorStyle }}>CS → CCC:</strong> 1:1000 (без комиссии)</p>
              <p><strong style={{ color: colorStyle }}>CS → TON:</strong> 10000:1 (0.1% комиссия)</p>
              <p style={{ fontSize: '0.9rem', marginTop: '10px', color: '#aaa' }}>
                💡 Совет: Накапливайте CCC для обмена на CS, а CS используйте для покупки систем и улучшений.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default ExchangePage;