// src/pages/wallet/WalletPage.tsx - ЧАСТЬ 1: ИМПОРТЫ И КОНСТАНТЫ
import React, { useState, useEffect } from 'react';
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

// Existing modals and hooks
import { StarsModal } from './components/StarsModal';
import { TONDepositModal } from './components/TONDepositModal';
import { useStarsPayment } from './hooks/useStarsPayment';
import { useTONDeposit } from './hooks/useTONDeposit';
import { useTONWithdrawal } from './hooks/useTONWithdrawal'; // НОВОЕ

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

// Official Stars packages from Telegram
const VALID_STARS_AMOUNTS = [100, 150, 250, 350, 500, 750, 1000, 1500, 2500, 5000, 10000, 25000, 50000, 100000, 150000];
const POPULAR_STARS_PACKAGES = [100, 250, 500, 1000, 2500, 5000];

// Premium packages
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
// ЧАСТЬ 2: ИНТЕРФЕЙСЫ И ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ

// Interfaces for transaction history
interface Transaction {
  type: 'deposit' | 'withdrawal' | 'premium';
  currency: string;
  amount: number;
  hash: string;
  full_hash: string;
  status: string;
  date: string;
  description: string;
  formatted_date: string;
}

interface TransactionHistory {
  success: boolean;
  transactions: Transaction[];
  total_count: number;
  limit: number;
  offset: number;
}

// Wallet address formatting function
const formatWalletAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};
// ЧАСТЬ 3: НАЧАЛО КОМПОНЕНТА И HOOKS

const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem, setPlayer, refreshPlayer } = usePlayer();
  
  // TON Connect hooks
  const userAddress = useTonAddress();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const connectionRestored = useIsConnectionRestored();
  
  // State variables
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
  const [isCheckingDeposits, setIsCheckingDeposits] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const colorStyle = player?.color || '#00f0ff';

  // HOOKS для работы с кошельком
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
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
    },
    onBalanceUpdate: () => {
      refreshPlayer();
    }
  });

  // НОВЫЙ ХУК ДЛЯ ВЫВОДА
  const { createWithdrawalRequest, isProcessing: isWithdrawProcessing } = useTONWithdrawal({
    playerId: player?.telegram_id,
    onSuccess: (message: string) => {
      setSuccess(message);
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      setError(null);
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
    },
    onBalanceUpdate: () => {
      refreshPlayer();
    }
  });

  const maxWithdrawAmount = React.useMemo(() => {
    const balance = parseFloat(player?.ton || '0');
    return Math.max(0, balance - 0.01);
  }, [player?.ton]);
  // ЧАСТЬ 4: ФУНКЦИИ ДЛЯ ИСТОРИИ ТРАНЗАКЦИЙ И ДИАГНОСТИКИ

  const loadTransactionHistory = async () => {
    if (!player?.telegram_id) {
      setError('Player not found');
      return;
    }

    setIsLoadingHistory(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/api/wallet/transaction-history/${player.telegram_id}`, {
        params: {
          limit: 50,
          offset: 0
        }
      });

      if (response.data.success) {
        setTransactionHistory(response.data);
      } else {
        setError('Failed to load transaction history');
      }
    } catch (err: any) {
      console.error('Transaction history loading error:', err);
      setError('Could not load transaction history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const runSecureDebug = async () => {
    if (!player?.telegram_id) {
      setError('Player not found');
      return;
    }

    setIsCheckingDeposits(true);
    setError(null);

    try {
      console.log('Запуск безопасной диагностики для игрока:', player.telegram_id);
      
      const response = await axios.post(`${API_URL}/api/wallet/ton-deposits/debug-deposits`, {
        player_id: player.telegram_id
      });
      
      if (response.data.success) {
        setDebugInfo(response.data);
        setShowDebugModal(true);
      } else {
        setError(`Ошибка диагностики: ${response.data.error}`);
      }
    } catch (err: any) {
      console.error('Ошибка диагностики:', err);
      setError(`Ошибка диагностики: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsCheckingDeposits(false);
    }
  };
  // ЧАСТЬ 5: ФУНКЦИИ ПРОВЕРКИ ДЕПОЗИТОВ

  const checkSecureDeposits = async () => {
    if (!player?.telegram_id) {
      setError('Player not found');
      return;
    }

    setIsCheckingDeposits(true);
    setError(null);
    setSuccess('Проверяем ЗАЩИЩЕННЫЕ депозиты через TONAPI...');

    try {
      const response = await axios.post(`${API_URL}/api/wallet/ton-deposits/check-deposits`, {
        player_id: player.telegram_id,
        sender_address: userAddress
      });
      
      if (response.data.success) {
        if (response.data.deposits_found > 0) {
          const { deposits_found, total_amount, rejected_for_security } = response.data;
          let message = `УСПЕХ! Найдено и БЕЗОПАСНО обработано ${deposits_found} депозитов на сумму ${total_amount} TON!`;
          
          if (rejected_for_security > 0) {
            message += ` (${rejected_for_security} транзакций отклонено по безопасности - это нормально)`;
          }
          
          setSuccess(message);
          await refreshPlayer();
        } else {
          const { rejected_for_security } = response.data;
          let message = 'Проверка завершена. Новых депозитов не найдено.';
          
          if (rejected_for_security > 0) {
            message += ` Система защиты отклонила ${rejected_for_security} чужих транзакций.`;
          }
          
          setSuccess(message);
        }
      } else {
        setError(response.data.error || 'Ошибка проверки депозитов');
      }
    } catch (err: any) {
      console.error('Ошибка проверки депозитов:', err);
      setError('Ошибка проверки депозитов: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsCheckingDeposits(false);
    }
  };

  const autoCheckDeposits = async () => {
    if (!player?.telegram_id) return;
    
    try {
      const response = await axios.post(`${API_URL}/api/wallet/ton-deposits/check-deposits`, {
        player_id: player.telegram_id,
        sender_address: userAddress
      });
      
      if (response.data.success && response.data.deposits_found > 0) {
        setSuccess(`Автоматически найдено ${response.data.deposits_found} новых безопасных депозитов!`);
        await refreshPlayer();
      }
    } catch (err) {
      console.log('Автопроверка депозитов не удалась');
    }
  };
  // ЧАСТЬ 6: ФУНКЦИИ ПОДКЛЮЧЕНИЯ КОШЕЛЬКА И ПРЕМИУМ

  const checkPremiumStatus = async () => {
    try {
      if (!player?.telegram_id) return;
      
      const response = await axios.get(`${API_URL}/api/wallet/premium-system/status/${player.telegram_id}`);
      if (response.data.success) {
        setPremiumStatus(response.data.premium);
      }
    } catch (err) {
      console.error('Premium status check error:', err);
    }
  };

  const syncWalletWithBackend = async () => {
    try {
      if (!userAddress || !player?.telegram_id) return;
      if (player.telegram_wallet === userAddress) {
        setSuccess('Кошелек уже подключен');
        return;
      }

      const response = await axios.post(`${API_URL}/api/wallet/wallet-connection/connect`, {
        telegram_id: player.telegram_id,
        wallet_address: userAddress,
        signature: 'ton-connect-verified'
      });

      if (response.data.success) {
        await refreshPlayer();
        setSuccess('Кошелек подключен');
        setError(null);
      }
    } catch (err: any) {
      setError('Ошибка подключения кошелька');
    }
  };

  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      await axios.post(`${API_URL}/api/wallet/wallet-connection/disconnect`, {
        telegram_id: player?.telegram_id
      });
      await refreshPlayer();
      setSuccess('Кошелек отключен');
      setError(null);
    } catch (err: any) {
      setError('Ошибка отключения кошелька');
    }
  };

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
      const response = await axios.post(`${API_URL}/api/wallet/premium-system/purchase`, {
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

  const handlePremiumPurchaseTON = async (packageType: 'NO_ADS_30_DAYS' | 'NO_ADS_FOREVER') => {
    if (!tonConnectUI || !userAddress) {
      setError('Сначала подключите TON кошелек');
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
      const response = await axios.post(`${API_URL}/api/wallet/premium-system/purchase`, {
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
  // ЧАСТЬ 7: ОБРАБОТЧИКИ ДЕПОЗИТОВ И ВЫВОДА

  const handleStarsDeposit = async () => {
    const inputAmount = parseInt(starsAmount);

    if (!inputAmount || inputAmount < 100) {
      setError('Минимальная сумма: 100 Stars, максимальная: 150000 Stars');
      return;
    }

    if (inputAmount > 150000) {
      setError('Минимальная сумма: 100 Stars, максимальная: 150000 Stars');
      return;
    }

    const actualAmount = VALID_STARS_AMOUNTS.find(validAmount => validAmount >= inputAmount) || 150000;
    await createStarsInvoice(actualAmount);
  };

  const handleTONDeposit = async () => {
    const amount = parseFloat(depositAmount);

    if (!amount || amount < 0.01) {
      setError('Минимальная сумма: 0.01 TON');
      return;
    }

    try {
      await sendDepositTransaction(amount);
    } catch (err: any) {
      setError('Ошибка транзакции');
    }
  };

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ ВЫВОДА - создает заявку вместо отправки
  const handleWithdraw = async () => {
    if (!userAddress) {
      setError('Сначала подключите кошелек для указания адреса вывода');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const playerBalance = parseFloat(player?.ton || '0');

    if (isNaN(amount) || amount < 0.1 || amount > playerBalance) {
      setError('Неверная сумма для вывода (минимум 0.1 TON)');
      return;
    }

    try {
      await createWithdrawalRequest(amount, userAddress);
    } catch (err: any) {
      setError('Ошибка создания заявки на вывод');
    }
  };

  const getPremiumStatusText = () => {
    if (premiumStatus?.forever) {
      return 'Реклама отключена НАВСЕГДА';
    } else if (premiumStatus?.until) {
      const endDate = new Date(premiumStatus.until);
      const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return `Реклама отключена еще на ${daysLeft} дней`;
    }
    return null;
  };
  // ЧАСТЬ 8: useEffect HOOKS

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

  useEffect(() => {
    if (player?.telegram_id && connectionRestored) {
      setTimeout(() => autoCheckDeposits(), 2000);
    }
  }, [player?.telegram_id, connectionRestored]);

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
          Загрузка TON Connect...
        </div>
      </div>
    );
  }
  // ЧАСТЬ 9: RENDER - НАЧАЛО

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
            Кошелек
          </h2>

          {player?.telegram_id === '850758749' && (
            <div style={{
              margin: '20px 0',
              padding: '15px',
              background: 'rgba(0, 255, 0, 0.1)',
              border: '2px solid #00ff00',
              borderRadius: '15px',
              color: '#00ff00',
              fontSize: '0.9rem'
            }}>
              БЕЗОПАСНЫЙ РЕЖИМ для игрока {player.telegram_id}
              <br />
              Текущий TON баланс: {parseFloat(player?.ton || '0').toFixed(8)}
              <br />
              Подключенный кошелек: {player?.telegram_wallet ? formatWalletAddress(player.telegram_wallet) : 'не подключен'}
              <br />
              <span style={{ color: '#90EE90' }}>
                ✅ ИСПРАВЛЕНО: Теперь система использует PAYLOAD защиту!
                <br />
                🔒 Депозиты зачисляются только с правильным COSMO payload
                <br />
                🚫 Чужие депозиты автоматически отклоняются
              </span>
            </div>
          )}

          <div style={{
            margin: '20px 0',
            padding: '15px',
            background: 'rgba(0, 255, 0, 0.1)',
            border: '2px solid #00ff00',
            borderRadius: '15px',
            color: '#90EE90',
            fontSize: '0.9rem',
            textAlign: 'left'
          }}>
            🛡️ <strong>СИСТЕМА ЗАЩИТЫ АКТИВНА</strong>
            <br />
            • Депозиты защищены специальным кодом
            <br />
            • Отправляйте TON только через кнопку "Пополнить TON" в приложении
            <br />
            • Чужие депозиты автоматически отклоняются системой безопасности
            <br />
            • Ваши средства в безопасности!
          </div>

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

          {error && (
            <div style={{ 
              margin: '20px 0', 
              padding: '15px', 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: `1px solid ${colorStyle}`, 
              borderRadius: '15px',
              color: colorStyle,
              textAlign: 'center'
            }}>⚠ {error}</div>
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
              {(success.includes('подключен') || success.includes('connected')) && player?.telegram_wallet && (
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '0.8rem',
                  color: '#aaa',
                  fontFamily: 'monospace'
                }}>
                  {formatWalletAddress(player.telegram_wallet)}
                </div>
              )}
            </div>
          )}

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
  }}>Баланс</h3>
  
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
    <div style={{ textAlign: 'center', minWidth: '120px' }}>
      <div style={{ fontSize: '1.4rem', color: colorStyle, marginBottom: '3px' }}>
        {parseFloat(player?.ton || '0').toFixed(4)} TON
      </div>
      <div style={{ color: '#888', fontSize: '0.7rem' }}>
        ≈ ${(parseFloat(player?.ton || '0') * 2.5).toFixed(2)}
      </div>
    </div>
    
    <div style={{ 
      width: '1px', 
      height: '40px', 
      background: colorStyle, 
      opacity: 0.3 
    }} />
    
    <div style={{ textAlign: 'center', minWidth: '120px' }}>
      <div style={{ fontSize: '1.4rem', color: colorStyle, marginBottom: '3px' }}>
        ⭐ {parseInt(player?.telegram_stars || '0').toLocaleString()}
      </div>
      <div style={{ color: '#888', fontSize: '0.7rem' }}>
        Telegram Stars
      </div>
    </div>
  </div>
  
  {!wallet && !userAddress && (
    <div style={{ marginBottom: '20px' }}>
      <TonConnectButton />
    </div>
  )}

  <div style={{ 
    display: 'flex', 
    gap: '12px', 
    justifyContent: 'center', 
    flexWrap: 'wrap',
    marginBottom: '15px'
  }}>
    <button
      onClick={() => {
        setShowDepositModal(true);
        setError(null);
        setSuccess(null);
      }}
      style={{
        padding: '15px 18px',
        background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
        border: `2px solid ${colorStyle}`,
        borderRadius: '15px',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem',
        minWidth: '140px',
        minHeight: '50px'
      }}
    >🛡️ Пополнить TON</button>

    <button
      onClick={() => {
        setShowStarsModal(true);
        setError(null);
        setSuccess(null);
      }}
      style={{
        padding: '15px 18px',
        background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
        border: `2px solid ${colorStyle}`,
        borderRadius: '15px',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem',
        minWidth: '140px',
        minHeight: '50px'
      }}
    >Купить Stars</button>

    <button
      onClick={checkSecureDeposits}
      disabled={isCheckingDeposits}
      style={{
        padding: '15px 18px',
        background: isCheckingDeposits 
          ? 'rgba(128, 128, 128, 0.5)' 
          : `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
        border: `2px solid ${colorStyle}`,
        borderRadius: '15px',
        color: '#fff',
        cursor: isCheckingDeposits ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem',
        opacity: isCheckingDeposits ? 0.7 : 1,
        minWidth: '160px',
        minHeight: '50px'
      }}
    >
      {isCheckingDeposits ? 'Проверяем...' : '🛡️ Обновить баланс'}
    </button>

    <button
      onClick={() => {
        setShowHistoryModal(true);
        loadTransactionHistory();
      }}
      style={{
        padding: '15px 18px',
        background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
        border: `2px solid ${colorStyle}`,
        borderRadius: '15px',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem',
        minWidth: '120px',
        minHeight: '50px'
      }}
    >
      История
    </button>

    {player?.telegram_id === '850758749' && (
      <button
        onClick={runSecureDebug}
        disabled={isCheckingDeposits}
        style={{
          padding: '15px 18px',
          background: 'linear-gradient(135deg, #00ff00, #00cc00)',
          border: '2px solid #00ff00',
          borderRadius: '15px',
          color: '#fff',
          cursor: isCheckingDeposits ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem',
          minWidth: '140px',
          minHeight: '50px'
        }}
      >
        🛡️ Диагностика
      </button>
    )}
    
    <button
      onClick={() => {
        setShowWithdrawModal(true);
        setError(null);
        setSuccess(null);
      }}
      disabled={parseFloat(player?.ton || '0') <= 0.1}
      style={{
        padding: '15px 18px',
        background: parseFloat(player?.ton || '0') > 0.1 
          ? `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`
          : 'rgba(128, 128, 128, 0.3)',
        border: `2px solid ${parseFloat(player?.ton || '0') > 0.1 ? colorStyle : '#666'}`,
        borderRadius: '15px',
        color: '#fff',
        cursor: parseFloat(player?.ton || '0') > 0.1 ? 'pointer' : 'not-allowed',
        fontWeight: 'bold',
        fontSize: '1rem',
        minWidth: '140px',
        minHeight: '50px'
      }}
    >Вывести TON</button>
    
    {wallet && userAddress && (
      <button
        onClick={handleDisconnect}
        style={{
          padding: '15px 18px',
          background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.2)`,
          border: `2px solid ${colorStyle}`,
          borderRadius: '15px',
          color: colorStyle,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem',
          minWidth: '120px',
          minHeight: '50px'
        }}
      >Отключить</button>
    )}
  </div>

  <div style={{
    marginTop: '15px',
    padding: '10px',
    background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.1)`,
    border: `1px solid ${colorStyle}`,
    borderRadius: '8px',
    fontSize: '0.8rem',
    color: '#ccc'
  }}>
    🛡️ После отправки TON через приложение система автоматически пытается зачислить средства с проверкой безопасности. 
    Если не сработало сразу - нажмите "Обновить баланс". Депозиты без правильного кода безопасности отклоняются.
  </div>
</div>
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
              }}>Отключить рекламу</h3>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px'
              }}>
                {!premiumStatus?.active && (
                  <div style={{
                    padding: '25px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '15px',
                    border: '1px solid #FFD700'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '20px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#FFD700', fontSize: '1.2rem', fontWeight: 'bold' }}>
                          Реклама отключена на 30 дней
                        </div>
                        <div style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '5px' }}>
                          Отключить всю рекламу на месяц
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handlePremiumPurchaseStars('NO_ADS_30_DAYS')}
                          disabled={isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars}
                          style={{
                            padding: '12px 18px',
                            background: parseInt(player?.telegram_stars || '0') >= PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars
                              ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                              : 'rgba(128, 128, 128, 0.3)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            cursor: (isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars) ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            opacity: (isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars) ? 0.5 : 1,
                            minWidth: '140px',
                            minHeight: '48px'
                          }}
                        >
                          {PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars} Stars
                        </button>
                        <button
                          onClick={() => handlePremiumPurchaseTON('NO_ADS_30_DAYS')}
                          disabled={isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton}
                          style={{
                            padding: '12px 18px',
                            background: (wallet && userAddress && parseFloat(player?.ton || '0') >= PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton)
                              ? 'linear-gradient(135deg, #0088CC, #0066AA)'
                              : 'rgba(128, 128, 128, 0.3)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            cursor: (isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton) ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            opacity: (isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton) ? 0.5 : 1,
                            minWidth: '120px',
                            minHeight: '48px'
                          }}
                        >
                          {PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton} TON
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                // ЧАСТЬ 12: ПРЕМИУМ СЕКЦИЯ (ВТОРАЯ ПОЛОВИНА)

<div style={{
  padding: '25px',
  background: 'rgba(0, 0, 0, 0.3)',
  borderRadius: '15px',
  border: '2px solid #FFD700',
  position: 'relative'
}}>
  <div style={{
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#000',
    padding: '6px 18px',
    borderRadius: '18px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    boxShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
  }}>
    ЛУЧШЕЕ ПРЕДЛОЖЕНИЕ
  </div>

  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    marginTop: '15px'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#FFD700', fontSize: '1.3rem', fontWeight: 'bold' }}>
        Реклама отключена НАВСЕГДА
      </div>
      <div style={{ color: '#ccc', fontSize: '0.9rem', marginTop: '5px' }}>
        Отключить всю рекламу раз и навсегда
      </div>
      <div style={{ color: '#90EE90', fontSize: '0.8rem', marginTop: '8px' }}>
        Экономия до 90% по сравнению с ежемесячными платежами
      </div>
    </div>
    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button
        onClick={() => handlePremiumPurchaseStars('NO_ADS_FOREVER')}
        disabled={isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.stars}
        style={{
          padding: '15px 20px',
          background: parseInt(player?.telegram_stars || '0') >= PREMIUM_PACKAGES.NO_ADS_FOREVER.stars
            ? 'linear-gradient(135deg, #FFD700, #FFA500)'
            : 'rgba(128, 128, 128, 0.3)',
          border: 'none',
          borderRadius: '15px',
          color: '#fff',
          cursor: (isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.stars) ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          opacity: (isProcessing || parseInt(player?.telegram_stars || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.stars) ? 0.5 : 1,
          boxShadow: parseInt(player?.telegram_stars || '0') >= PREMIUM_PACKAGES.NO_ADS_FOREVER.stars 
            ? '0 0 15px rgba(255, 215, 0, 0.4)' 
            : 'none',
          minWidth: '160px',
          minHeight: '55px'
        }}
      >
        {PREMIUM_PACKAGES.NO_ADS_FOREVER.stars} Stars
      </button>
      <button
        onClick={() => handlePremiumPurchaseTON('NO_ADS_FOREVER')}
        disabled={isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.ton}
        style={{
          padding: '15px 20px',
          background: (wallet && userAddress && parseFloat(player?.ton || '0') >= PREMIUM_PACKAGES.NO_ADS_FOREVER.ton)
            ? 'linear-gradient(135deg, #0088CC, #0066AA)'
            : 'rgba(128, 128, 128, 0.3)',
          border: 'none',
          borderRadius: '15px',
          color: '#fff',
          cursor: (isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.ton) ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          opacity: (isProcessing || !wallet || !userAddress || parseFloat(player?.ton || '0') < PREMIUM_PACKAGES.NO_ADS_FOREVER.ton) ? 0.5 : 1,
          boxShadow: (wallet && userAddress && parseFloat(player?.ton || '0') >= PREMIUM_PACKAGES.NO_ADS_FOREVER.ton)
            ? '0 0 15px rgba(0, 136, 204, 0.4)'
            : 'none',
          minWidth: '140px',
          minHeight: '55px'
        }}
      >
        {PREMIUM_PACKAGES.NO_ADS_FOREVER.ton} TON
      </button>
    </div>
  </div>
</div>

<p style={{ color: '#999', fontSize: '0.8rem', textAlign: 'center', margin: '10px 0 0 0' }}>
  Наслаждайтесь игрой без отвлекающей рекламы
</p>
</div>
</div>
)}
</div>
</div>
      {/* MODALS */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'rgba(20, 20, 20, 0.98)', padding: '25px', borderRadius: '15px',
            border: `2px solid ${colorStyle}`, maxWidth: '500px', width: '100%', maxHeight: '80vh', overflow: 'auto'
          }}>
            <h2 style={{ color: colorStyle, marginBottom: '20px', textAlign: 'center' }}>
              История транзакций
            </h2>
            
            {isLoadingHistory ? (
              <div style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>
                Загрузка истории...
              </div>
            ) : transactionHistory && transactionHistory.transactions && transactionHistory.transactions.length > 0 ? (
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {transactionHistory.transactions.map((tx, index) => (
                  <div key={index} style={{
                    padding: '15px',
                    margin: '10px 0',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    border: `1px solid ${colorStyle}40`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                        {tx.type === 'deposit' ? '💥' : tx.type === 'withdrawal' ? '💤' : '⭐'} {tx.description}
                      </span>
                      <span style={{ 
                        color: tx.status === 'completed' ? '#90EE90' : '#FFA500',
                        fontSize: '0.8rem',
                        padding: '2px 6px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px'
                      }}>
                        {tx.status}
                      </span>
                    </div>
                    <div style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '5px' }}>
                      Сумма: {tx.amount.toFixed(tx.currency === 'ton' ? 4 : 0)} {tx.currency.toUpperCase()}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.7rem' }}>
                      {tx.formatted_date}
                    </div>
                    {tx.hash && tx.hash !== 'N/A' && (
                      <div style={{ color: '#666', fontSize: '0.6rem', fontFamily: 'monospace', marginTop: '5px' }}>
                        {tx.hash}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>
                История транзакций пуста
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setTransactionHistory(null);
                }}
                style={{
                  flex: 1, 
                  padding: '12px', 
                  background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.2)`,
                  border: `2px solid ${colorStyle}`, 
                  borderRadius: '10px', 
                  color: colorStyle, 
                  cursor: 'pointer'
                }}
              >Закрыть</button>
            </div>
          </div>
        </div>
      )}
{showDebugModal && debugInfo && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
  }}>
    <div style={{
      background: 'rgba(20, 20, 20, 0.98)', padding: '25px', borderRadius: '15px',
      border: '2px solid #00ff00', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto'
    }}>
      <h2 style={{ color: '#00ff00', marginBottom: '20px', textAlign: 'center' }}>
        🛡️ ДИАГНОСТИКА БЕЗОПАСНОСТИ
      </h2>
      
      <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.4' }}>
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#00ff00' }}>ИГРОК:</strong><br />
          ID: {debugInfo.player.telegram_id}<br />
          Имя: {debugInfo.player.name}<br />
          TON Баланс: {debugInfo.player.current_ton_balance}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#00ff00' }}>СИСТЕМА БЕЗОПАСНОСТИ:</strong><br />
          Всего входящих: {debugInfo.security_info?.total_incoming_transactions || 0}<br />
          Валидных для игрока: {debugInfo.security_info?.valid_for_player || 0}<br />
          Отклонено системой: {debugInfo.security_info?.rejected_for_security || 0}
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#00ff00' }}>РЕКОМЕНДАЦИИ:</strong><br />
          {debugInfo.recommendations.map((rec: string, i: number) => (
            <div key={i} style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#ffaa44' }}>
              • {rec}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
        <button
          onClick={() => setShowDebugModal(false)}
          style={{
            flex: 1, padding: '12px', background: 'rgba(0, 255, 0, 0.2)',
            border: '2px solid #00ff00', borderRadius: '10px', color: '#00ff00', cursor: 'pointer'
          }}
        >Закрыть</button>
      </div>
    </div>
  </div>
)}
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
        Вывод TON
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
          Доступно для вывода: {maxWithdrawAmount.toFixed(8)} TON
        </p>
        <p style={{ color: colorStyle, fontSize: '0.9rem', marginTop: '10px', textAlign: 'center' }}>
          📝 Будет создана заявка администратору
        </p>
      </div>

      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={handleWithdraw}
          disabled={isWithdrawProcessing || !withdrawAmount || parseFloat(withdrawAmount) < 0.1}
          style={{
            flex: 1, padding: '15px', background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
            border: `2px solid ${colorStyle}`, borderRadius: '10px', color: '#fff',
            cursor: (isWithdrawProcessing || !withdrawAmount || parseFloat(withdrawAmount) < 0.1) ? 'not-allowed' : 'pointer',
            opacity: (isWithdrawProcessing || !withdrawAmount || parseFloat(withdrawAmount) < 0.1) ? 0.5 : 1
          }}
        >
          {isWithdrawProcessing ? 'Создание заявки...' : 'Создать заявку'}
        </button>
        
        <button
          onClick={() => { setShowWithdrawModal(false); setWithdrawAmount(''); setError(null); }}
          style={{
            flex: 1, 
            padding: '15px', 
            background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.2)`,
            border: `2px solid ${colorStyle}`, 
            borderRadius: '10px', 
            color: colorStyle, 
            cursor: 'pointer'
          }}
        >Отмена</button>
      </div>
    </div>
  </div>
)}

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