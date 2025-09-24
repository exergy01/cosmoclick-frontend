// src/pages/wallet/WalletPage.tsx - ИСПРАВЛЕННАЯ ПОЛНАЯ ВЕРСИЯ
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

  // NEW states for transaction history
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const colorStyle = player?.color || '#00f0ff';

  // Refactored hooks
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

  const maxWithdrawAmount = React.useMemo(() => {
    const balance = parseFloat(player?.ton || '0');
    return Math.max(0, balance - 0.01);
  }, [player?.ton]);

  // NEW FUNCTION - Load transaction history
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

  // DIAGNOSTICS
  const runDebugDeposits = async () => {
    if (!player?.telegram_id) {
      setError('Player not found');
      return;
    }

    setIsCheckingDeposits(true);
    setError(null);

    try {
      console.log('Running deposit diagnostics for player:', player.telegram_id);
      
      const response = await axios.post(`${API_URL}/api/wallet/ton-deposits/debug-deposits`, {
        player_id: player.telegram_id
      });
      
      if (response.data.success) {
        setDebugInfo(response.data);
        setShowDebugModal(true);
        console.log('Debug info received:', response.data);
      } else {
        setError(`Diagnostics error: ${response.data.error}`);
      }

    } catch (err: any) {
      console.error('Diagnostics error:', err);
      setError(`Diagnostics error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsCheckingDeposits(false);
    }
  };

  // IMPROVED DEPOSIT CHECK FUNCTION
  const checkPendingDeposits = async () => {
    if (!player?.telegram_id) {
      setError('Player not found');
      return;
    }

    setIsCheckingDeposits(true);
    setError(null);
    setSuccess('Checking deposits via TONAPI...');

    try {
      console.log('Starting universal deposit check for player:', player.telegram_id);
      
      // First try checking by address if wallet is connected
      if (userAddress) {
        console.log('Checking deposits by sender address:', userAddress);
        
        try {
          const addressResponse = await axios.post(`${API_URL}/api/wallet/ton-deposits/check-deposits`, {
            player_id: player.telegram_id,
            sender_address: userAddress
          });
          
          if (addressResponse.data.success && addressResponse.data.deposits_found > 0) {
            const { deposits_found, total_amount } = addressResponse.data;
            setSuccess(`Found and processed ${deposits_found} deposits totaling ${total_amount} TON!`);
            await refreshPlayer();
            return;
          }
        } catch (addressError) {
          console.log('Address check failed, trying universal check');
        }
      }
      
      // Universal check
      console.log('Running universal check for all deposits...');
      
      const universalResponse = await axios.post(`${API_URL}/api/wallet/ton-deposits/check-deposits`, {
        player_id: player.telegram_id,
        sender_address: userAddress // optional
      });
      
      if (universalResponse.data.success) {
        if (universalResponse.data.deposits_found > 0) {
          const { deposits_found, total_amount } = universalResponse.data;
          setSuccess(`SUCCESS! Found and processed ${deposits_found} deposits totaling ${total_amount} TON!`);
          await refreshPlayer();
        } else {
          setSuccess('Deposit check complete. No new deposits found.');
          
          // Show hint
          setTimeout(() => {
            setSuccess('If you recently sent TON, wait 1-2 minutes and try again. For diagnostics, click "Diagnostics".');
          }, 2000);
        }
      } else {
        setError(universalResponse.data.error || 'Deposit check failed');
      }

    } catch (err: any) {
      console.error('Deposit check error:', err);
      
      let errorMessage = 'Deposit check failed: ';
      
      if (err.response?.status === 500) {
        errorMessage += 'Server problem, try again later.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage += 'Network problem, check connection.';
      } else if (err.message?.includes('timeout')) {
        errorMessage += 'Request timeout, try again.';
      } else {
        errorMessage += err.response?.data?.error || err.message || 'Unknown error';
      }
      
      setError(errorMessage);
    } finally {
      setIsCheckingDeposits(false);
    }
  };

  // AUTO CHECK DEPOSITS ON LOAD
  const checkDepositsOnLoad = async () => {
    if (!player?.telegram_id) return;
    
    try {
      console.log('Auto deposit check on page load...');
      
      const response = await axios.post(`${API_URL}/api/wallet/ton-deposits/check-deposits`, {
        player_id: player.telegram_id,
        sender_address: userAddress
      });
      
      if (response.data.success && response.data.deposits_found > 0) {
        setSuccess(`Auto-found ${response.data.deposits_found} new deposits!`);
        await refreshPlayer();
      }
      
    } catch (err) {
      console.log('Auto deposit check failed (normal)');
    }
  };

  // Check premium status
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

  // useEffect hooks
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

  // Auto check on wallet connection
  useEffect(() => {
    if (player?.telegram_id && connectionRestored) {
      // Small delay to ensure page is fully loaded
      setTimeout(() => checkDepositsOnLoad(), 3000);
    }
  }, [player?.telegram_id, connectionRestored]);

  // Sync wallet with backend
  const syncWalletWithBackend = async () => {
    try {
      if (!userAddress || !player?.telegram_id) return;
      if (player.telegram_wallet === userAddress) {
        setSuccess('Wallet already connected');
        return;
      }

      const response = await axios.post(`${API_URL}/api/wallet/wallet-connection/connect`, {
        telegram_id: player.telegram_id,
        wallet_address: userAddress,
        signature: 'ton-connect-verified'
      });

      if (response.data.success) {
        await refreshPlayer();
        setSuccess('Wallet connected');
        setError(null);
      }
    } catch (err: any) {
      setError('Wallet connection error');
    }
  };

  // Disconnect wallet
  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      await axios.post(`${API_URL}/api/wallet/wallet-connection/disconnect`, {
        telegram_id: player?.telegram_id
      });
      await refreshPlayer();
      setSuccess('Wallet disconnected');
      setError(null);
    } catch (err: any) {
      setError('Wallet disconnection error');
    }
  };

  // Premium purchase functions
  const handlePremiumPurchaseStars = async (packageType: 'NO_ADS_30_DAYS' | 'NO_ADS_FOREVER') => {
    const amount = PREMIUM_PACKAGES[packageType].stars;
    const currentStars = parseInt(player?.telegram_stars || '0');

    if (currentStars < amount) {
      setError(`Insufficient Stars! You have: ${currentStars}, need: ${amount}`);
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
        setError(response.data.error || 'Purchase error');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Premium purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Premium purchase with TON
  const handlePremiumPurchaseTON = async (packageType: 'NO_ADS_30_DAYS' | 'NO_ADS_FOREVER') => {
    if (!tonConnectUI || !userAddress) {
      setError('Please connect TON wallet first');
      return;
    }

    const amount = PREMIUM_PACKAGES[packageType].ton;
    const currentTON = parseFloat(player?.ton || '0');

    if (currentTON < amount) {
      setError(`Insufficient TON! You have: ${currentTON.toFixed(4)}, need: ${amount}`);
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
        setError(response.data.error || 'Purchase error');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Premium purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Event handlers
  const handleStarsDeposit = async () => {
    const inputAmount = parseInt(starsAmount);

    if (!inputAmount || inputAmount < 100) {
      setError('Minimum amount: 100 Stars, maximum: 150000 Stars');
      return;
    }

    if (inputAmount > 150000) {
      setError('Minimum amount: 100 Stars, maximum: 150000 Stars');
      return;
    }

    const actualAmount = VALID_STARS_AMOUNTS.find(validAmount => validAmount >= inputAmount) || 150000;
    await createStarsInvoice(actualAmount);
  };

  const handleTONDeposit = async () => {
    const amount = parseFloat(depositAmount);

    if (!amount || amount < 0.01) {
      setError('Minimum amount: 0.01 TON');
      return;
    }

    try {
      await sendDepositTransaction(amount);
    } catch (err: any) {
      setError('Transaction error');
    }
  };

  // TON withdrawal
  const handleWithdraw = async () => {
    if (!tonConnectUI || !userAddress) {
      setError('Please connect wallet first');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const playerBalance = parseFloat(player?.ton || '0');

    if (isNaN(amount) || amount < 0.1 || amount > playerBalance) {
      setError('Invalid withdrawal amount');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const prepareResponse = await axios.post(`${API_URL}/api/wallet/ton-withdrawals/prepare`, {
        telegram_id: player?.telegram_id,
        amount: amount
      });

      if (!prepareResponse.data.success) {
        throw new Error(prepareResponse.data.error || 'Preparation error');
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
      
      await axios.post(`${API_URL}/api/wallet/ton-withdrawals/confirm`, {
        telegram_id: player?.telegram_id,
        amount: amount,
        transaction_hash: result.boc,
        wallet_address: userAddress,
        admin_key: 'cosmo_admin_2025'
      });

      setSuccess('Withdrawal successfully completed');
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      await refreshPlayer();
    } catch (err: any) {
      setError(err.message?.includes('declined') ? 'Transaction declined by user' : 'Withdrawal error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Premium status display function
  const getPremiumStatusText = () => {
    if (premiumStatus?.forever) {
      return 'No Ads FOREVER';
    } else if (premiumStatus?.until) {
      const endDate = new Date(premiumStatus.until);
      const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return `No Ads for ${daysLeft} more days`;
    }
    return null;
  };

  // TON Connect loading
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
          Loading TON Connect...
        </div>
      </div>
    );
  }

  // Main render
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
      {/* Remove number input arrows styles */}
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
            Wallet
          </h2>

          {/* DEBUGGING INFO FOR TEST PLAYER */}
          {player?.telegram_id === '850758749' && (
            <div style={{
              margin: '20px 0',
              padding: '15px',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '2px solid #ff4444',
              borderRadius: '15px',
              color: '#ff4444',
              fontSize: '0.9rem'
            }}>
              TEST MODE for player {player.telegram_id}
              <br />
              Current TON Balance: {parseFloat(player?.ton || '0').toFixed(8)}
              <br />
              Connected Wallet: {player?.telegram_wallet ? formatWalletAddress(player.telegram_wallet) : 'not connected'}
              <br />
              <span style={{ color: '#90EE90' }}>
                ✅ FIXED: Now using working TONAPI instead of broken TON Center
              </span>
            </div>
          )}

          {/* Premium status display */}
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

          {/* Error and success messages */}
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
              {/* Show wallet address if wallet connected */}
              {(success.includes('connected') || success.includes('подключен')) && player?.telegram_wallet && (
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
          
          {/* Main wallet block */}
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
            }}>Balance</h3>
            
            {/* COMPACT BALANCES IN ONE ROW */}
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
              {/* TON Balance */}
              <div style={{ textAlign: 'center', minWidth: '120px' }}>
                <div style={{ fontSize: '1.4rem', color: colorStyle, marginBottom: '3px' }}>
                  {parseFloat(player?.ton || '0').toFixed(4)} TON
                </div>
                <div style={{ color: '#888', fontSize: '0.7rem' }}>
                  ≈ ${(parseFloat(player?.ton || '0') * 2.5).toFixed(2)}
                </div>
              </div>
              
              {/* Separator */}
              <div style={{ 
                width: '1px', 
                height: '40px', 
                background: colorStyle, 
                opacity: 0.3 
              }} />
              
              {/* Stars Balance */}
              <div style={{ textAlign: 'center', minWidth: '120px' }}>
                <div style={{ fontSize: '1.4rem', color: colorStyle, marginBottom: '3px' }}>
                  ⭐ {parseInt(player?.telegram_stars || '0').toLocaleString()}
                </div>
                <div style={{ color: '#888', fontSize: '0.7rem' }}>
                  Telegram Stars
                </div>
              </div>
            </div>
            
            {/* TON Connect button - show only if NOT connected */}
            {!wallet && !userAddress && (
              <div style={{ marginBottom: '20px' }}>
                <TonConnectButton />
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setShowDepositModal(true);
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  padding: '10px 12px',
                  background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
              >Top up TON</button>

              <button
                onClick={() => {
                  setShowStarsModal(true);
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  padding: '10px 12px',
                  background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
              >Buy Stars</button>

              {/* BALANCE REFRESH BUTTON */}
              <button
                onClick={checkPendingDeposits}
                disabled={isCheckingDeposits}
                style={{
                  padding: '10px 12px',
                  background: isCheckingDeposits 
                    ? 'rgba(128, 128, 128, 0.5)' 
                    : `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: isCheckingDeposits ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  opacity: isCheckingDeposits ? 0.7 : 1
                }}
              >
                {isCheckingDeposits ? 'Checking...' : 'Refresh Balance'}
              </button>

              {/* TRANSACTION HISTORY BUTTON */}
              <button
                onClick={() => {
                  setShowHistoryModal(true);
                  loadTransactionHistory();
                }}
                style={{
                  padding: '10px 12px',
                  background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
              >
                History
              </button>

              {/* DIAGNOSTICS BUTTON (only for test player) */}
              {player?.telegram_id === '850758749' && (
                <button
                  onClick={runDebugDeposits}
                  disabled={isCheckingDeposits}
                  style={{
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, #ff4444, #cc0000)',
                    border: '2px solid #ff4444',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: isCheckingDeposits ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}
                >
                  Diagnostics
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
                  padding: '10px 12px',
                  background: parseFloat(player?.ton || '0') > 0.1 
                    ? `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`
                    : 'rgba(128, 128, 128, 0.3)',
                  border: `2px solid ${parseFloat(player?.ton || '0') > 0.1 ? colorStyle : '#666'}`,
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: parseFloat(player?.ton || '0') > 0.1 ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
              >Withdraw TON</button>
              
              {wallet && userAddress && (
                <button
                  onClick={handleDisconnect}
                  style={{
                    padding: '10px 12px',
                    background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.2)`,
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '12px',
                    color: colorStyle,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}
                >Disconnect</button>
              )}
            </div>

            {/* BALANCE REFRESH HINT */}
            <div style={{
              marginTop: '15px',
              padding: '10px',
              background: `rgba(${colorStyle.slice(1).match(/.{2}/g)?.map((hex: string) => parseInt(hex, 16)).join(', ')}, 0.1)`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#ccc'
            }}>
              After depositing TON, click "Refresh Balance" to credit funds. 
              System now uses reliable TONAPI instead of broken TON Center.
            </div>
          </div>
          
          {/* PREMIUM BLOCK */}
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
              }}>Disable Ads</h3>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px'
              }}>
                {/* 30 days offer */}
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
                          No Ads for 30 Days
                        </div>
                        <div style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '3px' }}>
                          Disable all ads for one month
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
                          {PREMIUM_PACKAGES.NO_ADS_30_DAYS.stars} Stars
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
                          {PREMIUM_PACKAGES.NO_ADS_30_DAYS.ton} TON
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Forever offer */}
                <div style={{
                  padding: '20px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
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
                    padding: '5px 15px',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 10px rgba(255, 215, 0, 0.3)'
                  }}>
                    BEST OFFER
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
                        No Ads FOREVER
                      </div>
                      <div style={{ color: '#ccc', fontSize: '0.8rem', marginTop: '3px' }}>
                        Disable all ads once and forever
                      </div>
                      <div style={{ color: '#90EE90', fontSize: '0.7rem', marginTop: '5px' }}>
                        Save up to 90% compared to monthly payments
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
                        {PREMIUM_PACKAGES.NO_ADS_FOREVER.stars} Stars
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
                        {PREMIUM_PACKAGES.NO_ADS_FOREVER.ton} TON
                      </button>
                    </div>
                  </div>
                </div>
                
                <p style={{ color: '#999', fontSize: '0.8rem', textAlign: 'center', margin: '10px 0 0 0' }}>
                  Enjoy the game without distracting ads
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TRANSACTION HISTORY MODAL */}
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
              Transaction History
            </h2>
            
            {isLoadingHistory ? (
              <div style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>
                Loading history...
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
                        {tx.type === 'deposit' ? '📥' : tx.type === 'withdrawal' ? '📤' : '⭐'} {tx.description}
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
                      Amount: {tx.amount.toFixed(tx.currency === 'ton' ? 4 : 0)} {tx.currency.toUpperCase()}
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
                Transaction history is empty
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
              >Close</button>
            </div>
          </div>
        </div>
      )}

      {/* DIAGNOSTICS MODAL */}
      {showDebugModal && debugInfo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'rgba(20, 20, 20, 0.98)', padding: '25px', borderRadius: '15px',
            border: '2px solid #ff4444', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto'
          }}>
            <h2 style={{ color: '#ff4444', marginBottom: '20px', textAlign: 'center' }}>
              DEPOSIT DIAGNOSTICS
            </h2>
            
            <div style={{ color: '#fff', fontSize: '0.9rem', lineHeight: '1.4' }}>
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#ff4444' }}>PLAYER:</strong><br />
                ID: {debugInfo.player.telegram_id}<br />
                Name: {debugInfo.player.name}<br />
                TON Balance: {debugInfo.player.current_ton_balance}
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#ff4444' }}>DATABASE DEPOSITS:</strong><br />
                Count: {debugInfo.database_deposits.count}<br />
                {debugInfo.database_deposits.deposits.length > 0 && (
                  <div>
                    {debugInfo.database_deposits.deposits.map((dep: any, i: number) => (
                      <div key={i} style={{ marginLeft: '10px', fontSize: '0.8rem' }}>
                        {i+1}. {dep.amount} TON ({dep.status}) - {dep.hash}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#ff4444' }}>BLOCKCHAIN TRANSACTIONS:</strong><br />
                Found: {debugInfo.blockchain_transactions.count}<br />
                {debugInfo.blockchain_transactions.recent_incoming.length > 0 && (
                  <div>
                    Recent incoming:<br />
                    {debugInfo.blockchain_transactions.recent_incoming.map((tx: any, i: number) => (
                      <div key={i} style={{ marginLeft: '10px', fontSize: '0.8rem' }}>
                        {i+1}. {tx.amount} TON from {tx.from} ({tx.minutes_ago} min ago)
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#ff4444' }}>RECOMMENDATIONS:</strong><br />
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
                  flex: 1, padding: '12px', background: 'rgba(255, 68, 68, 0.2)',
                  border: '2px solid #ff4444', borderRadius: '10px', color: '#ff4444', cursor: 'pointer'
                }}
              >Close</button>
            </div>
          </div>
        </div>
      )}

      {/* TON WITHDRAWAL MODAL */}
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
              TON Withdrawal
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
                Available for withdrawal: {maxWithdrawAmount.toFixed(8)} TON
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
                {isProcessing ? 'Processing...' : 'Confirm'}
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
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Refactored modals */}
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