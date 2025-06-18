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

const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { player, currentSystem } = usePlayer();
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

  const handleVerify = async () => {
    // Логика верификации
    alert('Функция верификации в разработке');
  };

  const handleWithdraw = async () => {
    // Логика вывода
    alert('Функция вывода в разработке');
  };

  const colorStyle = player?.color || '#00f0ff';

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
            💳 {t('wallet')}
          </h2>
          
          {/* Баланс TON */}
          <div style={{
            margin: '20px auto',
            padding: '25px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '20px',
            boxShadow: `0 0 30px ${colorStyle}30`,
            maxWidth: '400px'
          }}>
            <h3 style={{ color: colorStyle, marginBottom: '15px', fontSize: '1.5rem' }}>
              💎 TON Кошелек
            </h3>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: colorStyle,
              textShadow: `0 0 10px ${colorStyle}`,
              marginBottom: '20px'
            }}>
              {(typeof player?.ton === 'number' ? player.ton : parseFloat(player?.ton || '0')).toFixed(8)} TON
            </div>
            
            {/* Кнопка верификации */}
            <button
              onClick={handleVerify}
              disabled={player?.verified}
              style={{
                padding: '15px 25px',
                margin: '10px',
                background: player?.verified 
                  ? 'rgba(128, 128, 128, 0.3)' 
                  : `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                boxShadow: player?.verified 
                  ? 'none' 
                  : `0 0 20px ${colorStyle}`,
                color: '#fff',
                border: `2px solid ${player?.verified ? '#888' : colorStyle}`,
                borderRadius: '15px',
                cursor: player?.verified ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                width: '100%',
                maxWidth: '300px'
              }}
              onMouseEnter={e => {
                if (!player?.verified) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 0 30px ${colorStyle}`;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = player?.verified ? 'none' : `0 0 20px ${colorStyle}`;
              }}
            >
              {player?.verified ? '✅ Верифицирован' : '🔐 Верификация (+1 TON)'}
            </button>
            
            {/* Кнопка вывода */}
            <button
              onClick={handleWithdraw}
              disabled={!player || player.ton < (player.verified ? 5 : 15)}
              style={{
                padding: '15px 25px',
                margin: '10px',
                background: player && player.ton >= (player.verified ? 5 : 15)
                  ? `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`
                  : 'rgba(128, 128, 128, 0.3)',
                boxShadow: player && player.ton >= (player.verified ? 5 : 15)
                  ? `0 0 20px ${colorStyle}`
                  : 'none',
                color: '#fff',
                border: `2px solid ${player && player.ton >= (player.verified ? 5 : 15) ? colorStyle : '#888'}`,
                borderRadius: '15px',
                cursor: player && player.ton >= (player.verified ? 5 : 15) ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                width: '100%',
                maxWidth: '300px'
              }}
              onMouseEnter={e => {
                if (player && player.ton >= (player.verified ? 5 : 15)) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 0 30px ${colorStyle}`;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = player && player.ton >= (player.verified ? 5 : 15) 
                  ? `0 0 20px ${colorStyle}` 
                  : 'none';
              }}
            >
              💸 {t('withdraw_ton', { amount: player?.verified ? 5 : 15 })}
            </button>
          </div>

          {/* Информация о комиссиях */}
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
              📋 Условия вывода
            </h3>
            <div style={{ textAlign: 'left', lineHeight: '1.6', color: '#ccc' }}>
              <p><strong style={{ color: colorStyle }}>Без верификации:</strong> минимум 15 TON</p>
              <p><strong style={{ color: colorStyle }}>С верификацией:</strong> минимум 5 TON</p>
              <p><strong style={{ color: colorStyle }}>Комиссия сети:</strong> ~0.1 TON</p>
              <p style={{ fontSize: '0.9rem', marginTop: '10px', color: '#aaa' }}>
                💡 Верификация даёт +1 TON и снижает минимум вывода
              </p>
            </div>
          </div>

          {/* Скоро */}
          <div style={{
            margin: '20px auto',
            padding: '20px',
            background: 'rgba(255, 165, 0, 0.1)',
            border: '1px solid #ffa500',
            borderRadius: '15px',
            boxShadow: '0 0 15px #ffa50030',
            maxWidth: '400px'
          }}>
            <h3 style={{ color: '#ffa500', marginBottom: '10px' }}>🚧 В разработке</h3>
            <p style={{ color: '#ccc', fontSize: '0.9rem' }}>
              Интеграция с TON кошельком находится в активной разработке. 
              Скоро будет доступен полный функционал!
            </p>
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default WalletPage;