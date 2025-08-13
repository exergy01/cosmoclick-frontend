// src/pages/wallet/WalletPage.tsx - С ПРЕМИУМ ФУНКЦИЯМИ
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
const POPULAR_STARS_PACKAGES = [100, 250, 500, 1000, 2500, 5000];

// Премиум пакеты
const PREMIUM_PACKAGES = {
  NO_ADS_30_DAYS: {
    stars: 150,
    ton: 1,
    duration: 30
  },
  NO_ADS_FOREVER: {
    stars: 1500,
    ton: 10,
    duration: null
  }
};

// Функция для сокращения адреса кошелька
const formatWalletAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};
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
  const [premiumStatus, setPremiumStatus] = useState<any>(null);

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

  const maxWithdrawAmount = useMemo(() => {
    const balance = parseFloat(player?.ton || '0');
    return Math.max(0, balance - 0.01);
  }, [player?.ton]);
  // Проверка премиум статуса
  const checkPremiumStatus = async () => {
    try {
      if (!player?.telegram_id) return;
      
      const response = await axios.get(`${API_URL}/api/wallet/premium-status/${player.telegram_id}`);
      if (response.data.success) {
        setPremiumStatus(response.data.premium);
      }
    } catch (err) {
      console.error('Ошибка проверки премиум статуса:', err);
    }
  };

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

  useEffect(() => {
    if (player?.telegram_id) {
      checkPremiumStatus();
    }
  }, [player?.telegram_id]);

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
  // Покупка премиума за Stars
  const handlePremiumPurchaseStars = async (packageType: 'NO_ADS_30_DAYS' | 'NO_ADS_FOREVER') => {
    const amount = PREMIUM_PACKAGES[packageType].stars;
    const currentStars = parseInt(player?.telegram_stars || '0');
    
    if (currentStars < amount) {
      setError(`Недостаточно Stars! У вас: ${currentStars}, нужно: ${amount}`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/wallet/purchase-premium`, {
        telegram_id: player?.telegram_id,
        package_type: packageType.toLowerCase(),
        payment_method: 'stars',
        payment_amount: amount
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        await refreshPlayer();
        await checkPremiumStatus();
      } else {
        setError(response.data.error || 'Ошибка покупки');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка покупки премиума');
    } finally {
      setIsProcessing(false);
    }
  };

  // Покупка премиума за TON
  const handlePremiumPurchaseTON = async (packageType: 'NO_ADS_30_DAYS' | 'NO_ADS_FOREVER') => {
    if (!tonConnectUI || !userAddress) {
      setError('Сначала подключите кошелек TON');
      return;
    }

    const amount = PREMIUM_PACKAGES[packageType].ton;
    const currentTON = parseFloat(player?.ton || '0');
    
    if (currentTON < amount) {
      setError(`Недостаточно TON! У вас: ${currentTON.toFixed(4)}, нужно: ${amount}`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/api/wallet/purchase-premium`, {
        telegram_id: player?.telegram_id,
        package_type: packageType.toLowerCase(),
        payment_method: 'ton',
        payment_amount: amount
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        await refreshPlayer();
        await checkPremiumStatus();
      } else {
        setError(response.data.error || 'Ошибка покупки');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка покупки премиума');
    } finally {
      setIsProcessing(false);
    }
  };
  // Обработчики
  const handleStarsDeposit = async () => {
    const inputAmount = parseInt(starsAmount);
    
    if (!inputAmount || inputAmount < 100) {
      setError(t('wallet.errors.invalid_stars_amount', { min: 100, max: 150000 }));
      return;
    }

    if (inputAmount > 150000) {
      setError(t('wallet.errors.invalid_stars_amount', { min: 100, max: 150000 }));
      return;
    }

    const actualAmount = VALID_STARS_AMOUNTS.find(validAmount => validAmount >= inputAmount) || 150000;
    await createStarsInvoice(actualAmount);
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

  // Функция для отображения премиум статуса
  const getPremiumStatusText = () => {
    if (premiumStatus?.forever) {
      return '👑 Без рекламы НАВСЕГДА';
    } else if (premiumStatus?.until) {
      const endDate = new Date(premiumStatus.until);
      const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return `👑 Без рекламы еще ${daysLeft} дней`;
    }
    return null;
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

        {/* Премиум статус (если есть) */}
        {getPremiumStatusText() && (
          <div style={{
            margin: '20px 0',
            padding: '15px',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.1))',
            border: '2px solid #FFD700',
            borderRadius: '15px',
            color: '#FFD700',
            textAlign: 'center',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}>
            {getPremiumStatusText()}
          </div>
        )}

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
          }}>
            ✅ {success}
            {/* Показываем адрес кошелька если кошелек подключен (любое сообщение о подключении) */}
            {(success.includes('подключен') || success.includes('connected')) && player?.telegram_wallet && (
              <div style={{ 
                marginTop: '8px',
                fontSize: '0.8rem',
                color: '#aaa',
                fontFamily: 'monospace'
              }}>
                📱 {formatWalletAddress(player.telegram_wallet)}
              </div>
            )}
          </div>
        )}
                
                  {/* Основной блок кошелька */}
{/* Основной блок кошелька */}
<div style={{ 
            margin: '20px 0', 
            padding: '25px', 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: `1px solid ${colorStyle}`, 
            borderRadius: '15px'
          }}>
            <h3 style={{ 
              color: colorStyle, 
              marginBottom: '20px', 
              fontSize: '1.3rem',
              textAlign: 'center'
            }}>💰 {t('wallet.balance_title')}</h3>
            
            {/* КОМПАКТНЫЕ БАЛАНСЫ В ОДНОМ РЯДУ */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              alignItems: 'center',
              marginBottom: '25px',
              padding: '15px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '10px',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              {/* TON Баланс */}
              <div style={{ textAlign: 'center', minWidth: '120px' }}>
                <div style={{ fontSize: '1.4rem', color: colorStyle, marginBottom: '3px' }}>
                  {parseFloat(player?.ton || '0').toFixed(4)} TON
                </div>
                <div style={{ color: '#888', fontSize: '0.7rem' }}>
                  ≈ ${(parseFloat(player?.ton || '0') * 2.5).toFixed(2)}
                </div>
              </div>
              
              {/* Разделитель */}
              <div style={{ 
                width: '1px', 
                height: '40px', 
                background: colorStyle, 
                opacity: 0.3 
              }} />
              
              {/* Stars Баланс */}
              <div style={{ textAlign: 'center', minWidth: '120px' }}>
                <div style={{ fontSize: '1.4rem', color: colorStyle, marginBottom: '3px' }}>
                  ⭐ {parseInt(player?.telegram_stars || '0').toLocaleString()}
                </div>
                <div style={{ color: '#888', fontSize: '0.7rem' }}>
                  Telegram Stars
                </div>
              </div>
            </div>
            
            {/* Кнопка подключения TON Connect - показываем только если кошелек НЕ подключен */}
            {!wallet && !userAddress && (
              <div style={{ marginBottom: '20px' }}>
                <TonConnectButton />
              </div>
            )}

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
                    padding: '12px 16px',
                    background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >💰 {t('wallet.deposit_ton')}</button>

                <button
                  onClick={() => {
                    setShowStarsModal(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  style={{
                    padding: '12px 16px',
                    background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
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
                    padding: '12px 16px',
                    background: parseFloat(player?.ton || '0') > 0.1 
                      ? `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`
                      : 'rgba(128, 128, 128, 0.3)',
                    border: `2px solid ${parseFloat(player?.ton || '0') > 0.1 ? colorStyle : '#666'}`,
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: parseFloat(player?.ton || '0') > 0.1 ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >💸 {t('wallet.withdraw_ton')}</button>
                
                <button
                  onClick={handleDisconnect}
                  style={{
                    padding: '12px 16px',
                    background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.2)`,
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '12px',
                    color: colorStyle,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}
                >🔌 {t('wallet.disconnect_wallet')}</button>
              </div>
            )}
          </div>
          
          {/* ПРЕМИУМ БЛОК С ДВУМЯ ПРЕДЛОЖЕНИЯМИ */}
{!premiumStatus?.forever && (
            <div style={{ 
              margin: '20px 0', 
              padding: '25px', 
              background: 'rgba(255, 215, 0, 0.1)', 
              border: `2px solid #FFD700`, 
              borderRadius: '15px'
            }}>
              <h3 style={{ 
                color: '#FFD700', 
                marginBottom: '20px', 
                fontSize: '1.3rem',
                textAlign: 'center'
              }}>👑 Отключить рекламу</h3>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px'
              }}>
                {/* Предложение на 30 дней */}
                {!premiumStatus?.active && (
                  <div style={{
                    padding: '20px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    border: '1px solid #FFD700'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#FFD700', fontSize: '1.1rem', fontWeight: 'bold' }}>
                          🚫 Без рекламы на 30 дней
                        </div>
                        <div style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '3px' }}>
                          Отключить всю рекламу на месяц
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handlePremiumPurchaseStars('NO_ADS_30_DAYS')}
                          disabled={isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars}
                          style={{
                            padding: '8px 14px',
                            background: parseInt(player?.telegram_stars || '0') >= PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars
                              ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                              : 'rgba(128, 128, 128, 0.3)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: (isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars) ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            opacity: (isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars) ? 0.5 : 1
                          }}
                        >
                          ⭐ {PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars}
                        </button>
                        <button
                          onClick={() => handlePremiumPurchaseTON('NO_ADS_30_DAYS')}
                          disabled={isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton}
                          style={{
                            padding: '8px 14px',
                            background: (wallet && userAddress && parseFloat(player?.ton || '0') >= PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton)
                              ? 'linear-gradient(135deg, #0088CC, #0066AA)'
                              : 'rgba(128, 128, 128, 0.3)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            cursor: (isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton) ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            opacity: (isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton) ? 0.5 : 1
                          }}
                        >
                          💎 {PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton} TON
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Предложение навсегда */}
                <div style={{
                  padding: '20px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  border: '2px solid #FFD700',
                  position: 'relative'
                }}>
                  {/* Бейдж "ЛУЧШЕЕ ПРЕДЛОЖЕНИЕ" */}
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#000',
                    padding: '5px 15px',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
                  }}>
                    🏆 ЛУЧШЕЕ ПРЕДЛОЖЕНИЕ
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '15px',
                    marginTop: '10px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#FFD700', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        👑 Без рекламы НАВСЕГДА
                      </div>
                      <div style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '3px' }}>
                        Отключить всю рекламу раз и навсегда
                      </div>
                      <div style={{ color: '#90EE90', fontSize: '0.7rem', marginTop: '5px' }}>
                        💰 Экономия до 90% по сравнению с месячными платежами!
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handlePremiumPurchaseStars('NO_ADS_FOREVER')}
                        disabled={isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.stars}
                        style={{
                          padding: '10px 16px',
                          background: parseInt(player?.telegram_stars || '0') >= PREMIUM_PACKAGES.NO_ADS_FOREVER.stars
                            ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                            : 'rgba(128, 128, 128, 0.3)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          cursor: (isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.stars) ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          opacity: (isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.stars) ? 0.5 : 1,
                          boxShadow: parseInt(player?.telegram_stars || '0') >= PREMIUM_PACKAGES.NO_ADS_FOREVER.stars 
                            ? '0 0 15px rgba(255, 215, 0, 0.4)' 
                            : 'none'
                        }}
                      >
                        ⭐ {PREMIUM_PACKAGES.NO_ADS_FOREVER.stars}
                      </button>
                      <button
                        onClick={() => handlePremiumPurchaseTON('NO_ADS_FOREVER')}
                        disabled={isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.ton}
                        style={{
                          padding: '10px 16px',
                          background: (wallet && userAddress && parseFloat(player?.ton || '0') >= PREMIUM_PACKAGES.NO_ADS_FOREVER.ton)
                            ? 'linear-gradient(135deg, #0088CC, #0066AA)'
                            : 'rgba(128, 128, 128, 0.3)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          cursor: (isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.ton) ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          opacity: (isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.ton) ? 0.5 : 1,
                          boxShadow: (wallet && userAddress && parseFloat(player?.ton || '0') >= PREMIUM_PACKAGES.NO_ADS_FOREVER.ton)
                            ? '0 0 15px rgba(0, 136, 204, 0.4)'
                            : 'none'
                        }}
                      >
                        💎 {PREMIUM_PACKAGES.NO_ADS_FOREVER.ton} TON
                      </button>
                    </div>
                  </div>
                </div>
                
                <p style={{ color: '#999', fontSize: '0.8rem', textAlign: 'center', margin: '10px 0 0 0' }}>
                  💡 Наслаждайтесь игрой без отвлекающей рекламы!
                </p>
              </div>
            </div>
          )}
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