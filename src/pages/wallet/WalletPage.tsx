// src/pages/wallet/WalletPage.tsx - ЧАСТЬ 1: ИМПОРТЫ И STATE
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

// 🔥 НОВЫЕ ИМПОРТЫ: Компоненты кошелька
import { StarsModal } from './components/StarsModal';
import { useStarsPayment } from './hooks/useStarsPayment';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const WalletPage: React.FC = () => {
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
  // 🔥 НОВЫЙ ХУК: Stars Payment
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
        setSuccess('Кошелек уже подключен');
        return;
      }

      const response = await axios.post(`${API_URL}/api/wallet/connect`, {
        telegram_id: player.telegram_id,
        wallet_address: userAddress,
        signature: 'ton-connect-verified'
      });

      if (response.data.success) {
        await refreshPlayer();
        setSuccess('Кошелек успешно подключен');
        setError(null);
      }
    } catch (err: any) {
      setError(`Ошибка подключения: ${err.response?.data?.error || err.message}`);
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
      setSuccess('Кошелек отключен');
      setError(null);
    } catch (err: any) {
      setError('Ошибка отключения кошелька');
    }
  };

  // 🔥 НОВОЕ: Обработчик Stars через хук
  const handleStarsDeposit = async () => {
    const amount = parseInt(starsAmount);
    await createStarsInvoice(amount);
  };
  // Пополнение TON
  const handleDeposit = async () => {
    if (!tonConnectUI || !userAddress) {
      setError('Сначала подключите кошелек');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 0.01) {
      setError('Минимальная сумма: 0.01 TON');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const gameWalletAddress = process.env.REACT_APP_GAME_WALLET_ADDRESS;
      if (!gameWalletAddress) throw new Error('Game wallet not configured');
      
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{
          address: gameWalletAddress,
          amount: Math.floor(amount * 1e9).toString(),
          payload: Buffer.from(`deposit:${player?.telegram_id}:${amount}`).toString('base64')
        }]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      setSuccess(`Транзакция отправлена! Hash: ${result.boc.slice(0, 10)}...`);
      setDepositAmount('');
      setShowDepositModal(false);
    } catch (err: any) {
      setError(err.message?.includes('declined') ? 'Транзакция отклонена' : 'Ошибка транзакции');
    } finally {
      setIsProcessing(false);
    }
  };

  // Вывод TON
  const handleWithdraw = async () => {
    if (!tonConnectUI || !userAddress) {
      setError('Сначала подключите кошелек');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const playerBalance = parseFloat(player?.ton || '0');

    if (isNaN(amount) || amount < 0.1 || amount > playerBalance) {
      setError('Неверная сумма или недостаточно средств');
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

      setSuccess('Вывод выполнен успешно!');
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      await refreshPlayer();
    } catch (err: any) {
      setError(err.message?.includes('declined') ? 'Транзакция отклонена' : 'Ошибка вывода');
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
          🔄 Загрузка TON Connect...
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
      <CurrencyPanel player={player} currentSystem={currentSystem} colorStyle={colorStyle} />

      <div style={{ marginTop: '80px', paddingBottom: '130px' }}>
        <div style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <h2 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2rem', 
            marginBottom: '30px' 
          }}>
            💳 TON Кошелек
          </h2>

          {/* Сообщения об ошибках и успехе */}
          {error && (
            <div style={{ 
              margin: '20px 0', 
              padding: '15px', 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid #ef4444', 
              borderRadius: '15px',
              color: '#ef4444',
              textAlign: 'center'
            }}>⚠️ {error}</div>
          )}
          
          {success && (
            <div style={{ 
              margin: '20px 0', 
              padding: '15px', 
              background: 'rgba(34, 197, 94, 0.15)', 
              border: '1px solid #22c55e', 
              borderRadius: '15px',
              color: '#22c55e',
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
            }}>💰 Ваш баланс</h3>
            
            {/* Баланс TON */}
            <div style={{ marginBottom: '25px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: colorStyle, marginBottom: '5px' }}>
                {parseFloat(player?.ton || '0').toFixed(8)} TON
              </div>
              <p style={{ color: '#666', fontSize: '0.8rem' }}>
                ≈ ${(parseFloat(player?.ton || '0') * 2.5).toFixed(2)} USD
              </p>
            </div>

            {/* Баланс Stars */}
            <div style={{ marginBottom: '25px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', color: '#FFD700', marginBottom: '5px' }}>
                ⭐ {parseInt(player?.telegram_stars || '0').toLocaleString()} Stars
              </div>
              <p style={{ color: '#666', fontSize: '0.8rem' }}>
                Telegram Stars для внутриигровых покупок
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
                <p style={{ color: '#888', marginBottom: '10px' }}>🔗 Подключенный кошелек:</p>
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
                    background: 'linear-gradient(135deg, #22c55e30, #22c55e60, #22c55e30)',
                    border: '2px solid #22c55e',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >💰 Пополнить TON</button>

                <button
                  onClick={() => {
                    setShowStarsModal(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #FFD70030, #FFD70060, #FFD70030)',
                    border: '2px solid #FFD700',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >⭐ Купить Stars</button>
                
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
                >💸 Вывести TON</button>
                
                <button
                  onClick={handleDisconnect}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '2px solid #ef4444',
                    borderRadius: '12px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >🔌 Отключить</button>
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
              💸 Вывод TON
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
                Доступно: {maxWithdrawAmount.toFixed(8)} TON
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
                {isProcessing ? '🔄 Обработка...' : '✅ Подтвердить'}
              </button>
              
              <button
                onClick={() => { setShowWithdrawModal(false); setWithdrawAmount(''); setError(null); }}
                style={{
                  flex: 1, padding: '15px', background: 'rgba(239, 68, 68, 0.2)',
                  border: '2px solid #ef4444', borderRadius: '10px', color: '#ef4444', cursor: 'pointer'
                }}
              >❌ Отмена</button>
            </div>
          </div>
        </div>
      )}
      {/* Модалка пополнения TON */}
      {showDepositModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)', padding: '30px', borderRadius: '20px',
            border: '2px solid #22c55e', maxWidth: '400px', width: '100%'
          }}>
            <h2 style={{ color: '#22c55e', marginBottom: '20px', textAlign: 'center' }}>
              💰 Пополнение TON
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.01"
                style={{
                  width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid #22c55e', borderRadius: '10px', color: '#fff'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleDeposit}
                disabled={isProcessing || !depositAmount || parseFloat(depositAmount) < 0.01}
                style={{
                  flex: 1, padding: '15px', background: 'linear-gradient(135deg, #22c55e30, #22c55e60, #22c55e30)',
                  border: '2px solid #22c55e', borderRadius: '10px', color: '#fff',
                  cursor: (isProcessing || !depositAmount || parseFloat(depositAmount) < 0.01) ? 'not-allowed' : 'pointer',
                  opacity: (isProcessing || !depositAmount || parseFloat(depositAmount) < 0.01) ? 0.5 : 1
                }}
              >
                {isProcessing ? '🔄 Отправка...' : '✅ Пополнить'}
              </button>
              
              <button
                onClick={() => { setShowDepositModal(false); setDepositAmount(''); setError(null); }}
                style={{
                  flex: 1, padding: '15px', background: 'rgba(239, 68, 68, 0.2)',
                  border: '2px solid #ef4444', borderRadius: '10px', color: '#ef4444', cursor: 'pointer'
                }}
              >❌ Отмена</button>
            </div>
          </div>
        </div>
      )}
      {/* 🔥 НОВОЕ: Используем компонент StarsModal */}
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
      />

      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default WalletPage;