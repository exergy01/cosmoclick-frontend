import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';

const ExchangePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { player, convertCurrency } = usePlayer();
  const currentSystem = player?.systems[0] || 1;
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState<'ccc' | 'cs'>('ccc');
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div
      style={{
        backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
        backgroundSize: 'cover',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '10px',
        position: 'relative'
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.5)',
          boxShadow: '0 0 10px #00f0ff'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <p>💠 {t('ccc')}: {(typeof player?.ccc === 'number' ? player.ccc : parseFloat(player?.ccc || '0')).toFixed(2)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p>✨ {t('cs')}: {(typeof player?.cs === 'number' ? player.cs : parseFloat(player?.cs || '0')).toFixed(2)}</p>
          <p>💎 {t('ton')}: {(typeof player?.ton === 'number' ? player.ton : parseFloat(player?.ton || '0')).toFixed(8)}</p>
        </div>
      </div>

      <div style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
        <h2>{t('exchange')}</h2>
        <div style={{ margin: '20px 0' }}>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value as 'ccc' | 'cs')}
            style={{ padding: '10px', marginRight: '10px' }}
          >
            <option value="ccc">CCC</option>
            <option value="cs">CS</option>
          </select>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('enter_amount')}
            style={{ padding: '10px', width: '200px' }}
          />
        </div>
        <button
          onClick={handleConvert}
          style={{
            padding: '10px 20px',
            background: '#00f0ff',
            boxShadow: '0 0 10px #00f0ff',
            color: '#000',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {t('convert')}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '10px',
          position: 'fixed',
          bottom: 0,
          left: 0,
          background: 'rgba(0, 0, 0, 0.7)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {[
            { path: '/attack', icon: '⚔️', label: t('attack') },
            { path: '/exchange', icon: '🔄', label: t('exchange') },
            { path: '/quests', icon: '🎯', label: t('quests') }
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                padding: '10px',
                background: 'rgba(0, 0, 0, 0.5)',
                boxShadow: location.pathname === path ? '0 0 15px #00f0ff' : '0 0 10px #00f0ff',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {[
            { path: '/games', icon: '🎮', label: t('games') },
            { path: '/wallet', icon: '💳', label: t('wallet') },
            { path: '/main', icon: '🚀', label: t('main') },
            { path: '/ref', icon: '👥', label: t('referrals') },
            { path: '/alphabet', icon: '📖', label: t('alphabet') }
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                padding: '10px',
                background: 'rgba(0, 0, 0, 0.5)',
                boxShadow: location.pathname === path ? '0 0 15px #00f0ff' : '0 0 10px #00f0ff',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExchangePage;