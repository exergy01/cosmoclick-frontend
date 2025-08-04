// src/pages/wallet/WalletPage.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
import React, { useState, useEffect, useMemo } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { 
  TonConnectButton, 
  useTonAddress, 
  useTonWallet,
  useTonConnectUI,
  useIsConnectionRestored 
} from '@tonconnect/ui-react';
import axios from 'axios';
import CurrencyPanel from '../../components/CurrencyPanel';
import NavigationMenu from '../../components/NavigationMenu';
import { useTranslation } from 'react-i18next';

// Рефакторенные компоненты
import { StarsModal } from './components/StarsModal';
import { TONDepositModal } from './components/TONDepositModal';
import { useStarsPayment } from './hooks/useStarsPayment';
import { useTONDeposit } from './hooks/useTONDeposit';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Официальные пакеты Stars от Telegram
const VALID_STARS_AMOUNTS = [100, 150, 250, 350, 500, 750, 1000, 1500, 2500, 5000, 10000, 25000, 50000, 100000, 150000];
const POPULAR_STARS_PACKAGES = [100, 250, 500, 1000, 2500];

const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem, setPlayer, refreshPlayer } = usePlayer();
  
  // TON Connect хуки
  const userAddress = useTonAddress();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const connectionRestored = useIsConnectionRestored();
  
  // State переменные
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [starsAmount, setStarsAmount] = useState('');
  const [showStarsModal, setShowStarsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const colorStyle = player?.color || '#00f0ff';

  // Рефакторенные хуки
  const { createStarsInvoice, isProcessing: isStarsProcessing } = useStarsPayment({
    playerId: player?.telegram_id,
    onSuccess: (message: string) => {
      setSuccess(message);
      setStarsAmount('');
      setShowStarsModal(false);
      setError(null);
      setTimeout(() => refreshPlayer(), 3000);
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
    }
  });

  const { sendDepositTransaction, isProcessing: isTONProcessing } = useTONDeposit({
    playerId: player?.telegram_id,
    onSuccess: (message: string) => {
      setSuccess(message);
      setDepositAmount('');
      setShowDepositModal(false);
      setError(null);
      setTimeout(() => refreshPlayer(), 3000);
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
    }
  });

  // Вспомогательные функции
  const getWalletName = () => {
    if (!wallet) return '';
    if ('name' in wallet && wallet.name) return wallet.name;
    if ('appName' in wallet && wallet.appName) return wallet.appName;
    if (wallet.device && 'appName' in wallet.device) return wallet.device.appName;
    return 'Unknown Wallet';
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const maxWithdrawAmount = useMemo(() => {
    const balance = parseFloat(player?.ton || '0');
    return Math.max(0, balance - 0.01);
  }, [player?.ton]);

  // useEffect хуки
  useEffect(() => {
    if (userAddress && player?.telegram_id) {
      syncWalletWithBackend();
    }
  }, [userAddress, player?.telegram_id]);

  useEffect(() => {
    if (player && !player.color) {
      setPlayer({ ...player, color: '#00f0ff' });
    }
  }, [player, setPlayer]);

  // Синхронизация кошелька с бэкендом
  const syncWalletWithBackend = async () => {
    try {
      if (!userAddress || !player?.telegram_id) return;
      if (player.telegram_wallet === userAddress) {
        setSuccess(t('wallet.wallet_already_connected'));
        return;
      }

      const response = await axios.post(`${API_URL}/api/wallet/connect`, {
        telegram_id: player.telegram_id,
        wallet_address: userAddress,
        signature: 'ton-connect-verified'
      });

      if (response.data.success) {
        await refreshPlayer();
        setSuccess(t('wallet.wallet_connected'));
        setError(null);
      }
    } catch (err: any) {
      const errorMsg = t('wallet.connection_error');
      setError(errorMsg);
    }
  };

  // Отключение кошелька
  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      await axios.post(`${API_URL}/api/wallet/disconnect`, {
        telegram_id: player?.telegram_id
      });
      await refreshPlayer();
      setSuccess(t('wallet.wallet_disconnected'));
      setError(null);
    } catch (err: any) {
      setError(t('wallet.disconnect_error'));
    }
  };

  // Обработчики
  const handleStarsDeposit = async () => {
    const amount = parseInt(starsAmount);
    
    // Валидация
    if (!amount || amount < 100) {
      setError(t('wallet.errors.invalid_stars_amount', { min: 100, max: 150000 }));
      return;
    }

    if (!VALID_STARS_AMOUNTS.includes(amount)) {
      setError(t('wallet.errors.invalid_stars_package', { 
        packages: POPULAR_STARS_PACKAGES.join(', ') 
      }));
      return;
    }

    await createStarsInvoice(amount);
  };

  const handleTONDeposit = async () => {
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount < 0.01) {
      setError(t('wallet.errors.invalid_ton_amount', { min: 0.01, max: 100 }));
      return;
    }
    
    try {
      await sendDepositTransaction(amount);
    } catch (err: any) {
      setError(t('wallet.errors.transaction_error'));
    }
  };

  // Вывод TON
  const handleWithdraw = async () => {
    if (!tonConnectUI || !userAddress) {
      setError(t('wallet.first_connect_wallet'));
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const playerBalance = parseFloat(player?.ton || '0');

    if (isNaN(amount) || amount < 0.1 || amount > playerBalance) {
      setError(t('wallet.invalid_amount'));
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const prepareResponse = await axios.post(`${API_URL}/api/wallet/prepare-withdrawal`, {
        telegram_id: player?.telegram_id,
        amount: amount
      });

      if (!prepareResponse.data.success) {
        throw new Error(prepareResponse.data.error || 'Ошибка подготовки');
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{
          address: userAddress,
          amount: Math.floor(amount * 1e9).toString(),
          payload: prepareResponse.data.payload || undefined
        }]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      
      await axios.post(`${API_URL}/api/wallet/confirm-withdrawal`, {
        telegram_id: player?.telegram_id,
        amount: amount,
        transaction_hash: result.boc,
        wallet_address: userAddress
      });

      setSuccess(t('wallet.success.withdrawal_completed'));
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      await refreshPlayer();
    } catch (err: any) {
      setError(err.message?.includes('declined') ? t('wallet.errors.transaction_declined') : t('wallet.errors.withdrawal_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Загрузка TON Connect
  if (!connectionRestored) {
    return (
      <div style={{
        backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
        backgroundSize: 'cover',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: colorStyle, fontSize: '1.2rem' }}>
          {t('wallet.loading_ton_connect')}
        </div>
      </div>
    );
  }

  // Основной рендер
  return (
    <div style={{
      backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
      backgroundSize: 'cover',
      minHeight: '100vh',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '10px'
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

      <CurrencyPanel player={player} currentSystem={currentSystem} colorStyle={colorStyle} />

      <div style={{ marginTop: '80px', paddingBottom: '130px' }}>
        <div style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <h2 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2rem', 
            marginBottom: '30px' 
          }}>
            💳 {t('wallet.title')}
          </h2>

          {/* Сообщения об ошибках и успехе */}
          {error && (
            <div style={{ 
              margin: '20px 0', 
              padding: '15px', 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: `1px solid ${colorStyle}`, 
              borderRadius: '15px',
              color: colorStyle,
              textAlign: 'center'
            }}>⚠️ {error}</div>
          )}
          
          {success && (
            <div style={{ 
              margin: '20px 0', 
              padding: '15px', 
              background: 'rgba(34, 197, 94, 0.15)', 
              border: `1px solid ${colorStyle}`, 
              borderRadius: '15px',
              color: colorStyle,
              textAlign: 'center'
            }}>✅ {success}</div>
          )}

          {/* Основной блок кошелька */}
          <div style={{ 
            margin: '20px 0', 
            padding: '30px', 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: `1px solid ${colorStyle}`, 
            borderRadius: '15px'
          }}>
            <h3 style={{ 
              color: colorStyle, 
              marginBottom: '20px', 
              fontSize: '1.5rem',
              textAlign: 'center'
            }}>💰 {t('wallet.balance_title')}</h3>
            
            {/* Баланс TON */}
            <div style={{ marginBottom: '25px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: colorStyle, marginBottom: '5px' }}>
                {parseFloat(player?.ton || '0').toFixed(8)} {t('wallet.ton_balance')}
              </div>
              <p style={{ color: '#666', fontSize: '0.8rem' }}>
                ≈ ${(parseFloat(player?.ton || '0') * 2.5).toFixed(2)} USD
              </p>
            </div>

            {/* Баланс Stars */}
            <div style={{ marginBottom: '25px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', color: colorStyle, marginBottom: '5px' }}>
                ⭐ {parseInt(player?.telegram_stars || '0').toLocaleString()} {t('wallet.stars_balance')}
              </div>
              <p style={{ color: '#666', fontSize: '0.8rem' }}>
                {t('wallet.stars_description')}
              </p>
            </div>
            
            {/* Информация о подключенном кошельке */}
            {wallet && userAddress && (
              <div style={{ 
                marginBottom: '25px', 
                padding: '20px', 
                background: 'rgba(0, 0, 0, 0.4)', 
                borderRadius: '12px'
              }}>
                <p style={{ color: '#888', marginBottom: '10px' }}>🔗 {t('wallet.connected_wallet')}</p>
                <p style={{ color: colorStyle, fontSize: '1.1rem', marginBottom: '5px' }}>
                  {formatAddress(userAddress)}
                </p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  {getWalletName()} • {wallet.device?.platform || 'Unknown'}
                </p>
              </div>
            )}
            
            {/* Кнопка подключения TON Connect */}
            <div style={{ marginBottom: '20px' }}>
              <TonConnectButton />
            </div>

            {/* Кнопки действий */}
            {wallet && userAddress && (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setShowDepositModal(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  style={{
                    padding: '12px 20px',
                    background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >💰 {t('wallet.deposit_ton')}</button>

                <button
                  onClick={() => {
                    setShowStarsModal(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  style={{
                    padding: '12px 20px',
                    background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >⭐ {t('wallet.buy_stars')}</button>
                
                <button
                  onClick={() => {
                    setShowWithdrawModal(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={parseFloat(player?.ton || '0') <= 0.1}
                  style={{
                    padding: '12px 20px',
                    background: parseFloat(player?.ton || '0') > 0.1 
                      ? `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`
                      : 'rgba(128, 128, 128, 0.3)',
                    border: `2px solid ${parseFloat(player?.ton || '0') > 0.1 ? colorStyle : '#666'}`,
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: parseFloat(player?.ton || '0') > 0.1 ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold'
                  }}
                >💸 {t('wallet.withdraw_ton')}</button>
                
                <button
                  onClick={handleDisconnect}
                  style={{
                    padding: '12px 20px',
                    background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.2)`,
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '12px',
                    color: colorStyle,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >🔌 {t('wallet.disconnect_wallet')}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модалка вывода TON */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)', padding: '30px', borderRadius: '20px',
            border: `2px solid ${colorStyle}`, maxWidth: '400px', width: '100%'
          }}>
            <h2 style={{ color: colorStyle, marginBottom: '20px', textAlign: 'center' }}>
              💸 {t('wallet.withdraw_modal.title')}
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.1"
                style={{
                  width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${colorStyle}`, borderRadius: '10px', color: '#fff'
                }}
              />
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>
                {t('wallet.withdraw_modal.available_amount', { amount: maxWithdrawAmount.toFixed(8) })}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleWithdraw}
                disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) < 0.1}
                style={{
                  flex: 1, padding: '15px', background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${colorStyle}`, borderRadius: '10px', color: '#fff',
                  cursor: (isProcessing || !withdrawAmount || parseFloat(withdrawAmount) < 0.1) ? 'not-allowed' : 'pointer',
                  opacity: (isProcessing || !withdrawAmount || parseFloat(withdrawAmount) < 0.1) ? 0.5 : 1
                }}
              >
                {isProcessing ? `🔄 ${t('wallet.processing')}` : `✅ ${t('wallet.confirm')}`}
              </button>
              
              <button
                onClick={() => { setShowWithdrawModal(false); setWithdrawAmount(''); setError(null); }}
                style={{
                  flex: 1, padding: '15px', background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.2)`,
                  border: `2px solid ${colorStyle}`, borderRadius: '10px', color: colorStyle, cursor: 'pointer'
                }}
              >❌ {t('wallet.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Рефакторенные модалки */}
      <StarsModal
        isOpen={showStarsModal}
        onClose={() => {
          setShowStarsModal(false);
          setStarsAmount('');
          setError(null);
        }}
        starsAmount={starsAmount}
        setStarsAmount={setStarsAmount}
        onSubmit={handleStarsDeposit}
        isProcessing={isStarsProcessing}
        colorStyle={colorStyle}
        validAmounts={VALID_STARS_AMOUNTS}
        popularPackages={POPULAR_STARS_PACKAGES}
      />

      <TONDepositModal
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false);
          setDepositAmount('');
          setError(null);
        }}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        onSubmit={handleTONDeposit}
        isProcessing={isTONProcessing}
        colorStyle={colorStyle}
      />

      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default WalletPage;