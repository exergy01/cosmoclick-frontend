// src/pages/wallet/WalletPage.tsx - С ДИАГНОСТИКОЙ
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

// Рефакторенные компоненты
import { StarsModal } from './components/StarsModal';
import { TONDepositModal } from './components/TONDepositModal';
import { useStarsPayment } from './hooks/useStarsPayment';
import { useTONDeposit } from './hooks/useTONDeposit';

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

  // 🔍 ДИАГНОСТИЧЕСКИЙ STATE
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const colorStyle = player?.color || '#00f0ff';

  // 🔍 Функция для добавления диагностической информации
  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev.slice(-4), `[${timestamp}] ${message}`]);
  };

  // Рефакторенные хуки
  const { createStarsInvoice, isProcessing: isStarsProcessing } = useStarsPayment({
    playerId: player?.telegram_id,
    onSuccess: (message: string) => {
      setSuccess(message);
      setStarsAmount('');
      setShowStarsModal(false);
      setError(null);
      addDebugInfo('✅ Stars payment успешен');
      setTimeout(() => refreshPlayer(), 3000);
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
      addDebugInfo(`❌ Stars error: ${errorMessage}`);
    }
  });

  const { sendDepositTransaction, isProcessing: isTONProcessing } = useTONDeposit({
    playerId: player?.telegram_id,
    onSuccess: (message: string) => {
      setSuccess(message);
      setDepositAmount('');
      setShowDepositModal(false);
      setError(null);
      addDebugInfo('✅ TON deposit успешен');
      setTimeout(() => refreshPlayer(), 3000);
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
      addDebugInfo(`❌ TON error: ${errorMessage}`);
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
      addDebugInfo(`🔗 Синхронизация кошелька: ${formatAddress(userAddress)}`);
      syncWalletWithBackend();
    }
  }, [userAddress, player?.telegram_id]);

  useEffect(() => {
    if (player && !player.color) {
      setPlayer({ ...player, color: '#00f0ff' });
    }
  }, [player, setPlayer]);

  // 🔍 Диагностика TON Connect при загрузке
  useEffect(() => {
    addDebugInfo(`🔄 TON Connect статус: ${connectionRestored ? 'готов' : 'загружается'}`);
    addDebugInfo(`📱 Wallet: ${wallet ? getWalletName() : 'не подключен'}`);
    addDebugInfo(`📍 Address: ${userAddress ? formatAddress(userAddress) : 'нет'}`);
    addDebugInfo(`🎮 Player ID: ${player?.telegram_id || 'нет'}`);
    addDebugInfo(`💎 Game wallet: ${process.env.REACT_APP_GAME_WALLET_ADDRESS || 'НЕ НАСТРОЕН'}`);
    addDebugInfo(`🔧 Fallback wallet: UQCOZZx-3RSxIVS2QFcuMBwDUZPWgh8FhRT7I6Qo_pqT-h60`);
  }, [connectionRestored, wallet, userAddress, player?.telegram_id]);

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
        addDebugInfo('✅ Кошелек подключен к бэкенду');
      }
    } catch (err: any) {
      const errorMsg = `Ошибка подключения: ${err.response?.data?.error || err.message}`;
      setError(errorMsg);
      addDebugInfo(`❌ Sync error: ${errorMsg}`);
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
      addDebugInfo('🔌 Кошелек отключен');
    } catch (err: any) {
      setError('Ошибка отключения кошелька');
      addDebugInfo('❌ Ошибка отключения');
    }
  };

  // Обработчики
  const handleStarsDeposit = async () => {
    const amount = parseInt(starsAmount);
    addDebugInfo(`⭐ Начинаем Stars покупку: ${amount}`);
    await createStarsInvoice(amount);
  };

  const handleTONDeposit = async () => {
    const amount = parseFloat(depositAmount);
    addDebugInfo(`💰 Начинаем TON пополнение: ${amount}`);
    addDebugInfo(`🔗 TON Connect UI: ${tonConnectUI ? 'есть' : 'НЕТ'}`);
    addDebugInfo(`📍 User address: ${userAddress ? 'есть' : 'НЕТ'}`);
    addDebugInfo(`🎮 Player ID: ${player?.telegram_id ? 'есть' : 'НЕТ'}`);
    
    try {
      await sendDepositTransaction(amount);
    } catch (err: any) {
      addDebugInfo(`❌ Критическая ошибка TON: ${err.message}`);
    }
  };

  // Простая проверка TON Connect
  const testTONConnect = async () => {
    addDebugInfo('🧪 Тестируем TON Connect...');
    
    if (!tonConnectUI) {
      addDebugInfo('❌ tonConnectUI отсутствует');
      return;
    }
    
    if (!userAddress) {
      addDebugInfo('❌ userAddress отсутствует');
      return;
    }
    
    addDebugInfo('✅ TON Connect готов к работе');
    
    // Пробуем простую транзакцию
    try {
      const testTransaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{
          address: process.env.REACT_APP_GAME_WALLET_ADDRESS || '',
          amount: '10000000', // 0.01 TON
          payload: Buffer.from('test').toString('base64')
        }]
      };
      
      addDebugInfo('🚀 Отправляем тестовую транзакцию...');
      const result = await tonConnectUI.sendTransaction(testTransaction);
      addDebugInfo(`✅ Тест успешен! BOC: ${result.boc.slice(0, 10)}...`);
      
    } catch (err: any) {
      addDebugInfo(`❌ Тест неудачен: ${err.message}`);
    }
  };

  // Вывод TON (пока оставляем старую логику)
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

          {/* 🔍 ДИАГНОСТИЧЕСКАЯ ПАНЕЛЬ */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowDebug(!showDebug)}
              style={{
                padding: '8px 15px',
                background: 'rgba(255, 165, 0, 0.2)',
                border: '1px solid #ffa500',
                borderRadius: '8px',
                color: '#ffa500',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              🔍 {showDebug ? 'Скрыть' : 'Показать'} диагностику
            </button>
            
            {showDebug && (
              <div style={{
                marginTop: '10px',
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid #ffa500',
                borderRadius: '10px',
                textAlign: 'left',
                fontSize: '0.8rem',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={testTONConnect}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid #22c55e',
                      borderRadius: '5px',
                      color: '#22c55e',
                      cursor: 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    🧪 Тест TON Connect
                  </button>
                  
                  <button
                    onClick={() => setDebugInfo([])}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #ef4444',
                      borderRadius: '5px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '0.7rem'
                    }}
                  >
                    🗑️ Очистить
                  </button>
                </div>
                
                {debugInfo.length === 0 ? (
                  <p style={{ color: '#888' }}>Диагностическая информация появится здесь...</p>
                ) : (
                  debugInfo.map((info, index) => (
                    <div key={index} style={{ 
                      color: info.includes('❌') ? '#ef4444' : 
                             info.includes('✅') ? '#22c55e' : 
                             info.includes('🔄') ? '#ffa500' : '#ccc',
                      marginBottom: '3px'
                    }}>
                      {info}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

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
                    addDebugInfo('🎯 Нажата кнопка "Пополнить TON"');
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
                    addDebugInfo('⭐ Нажата кнопка "Купить Stars"');
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

      {/* Рефакторенные модалки */}
      <StarsModal
        isOpen={showStarsModal}
        onClose={() => {
          addDebugInfo('❌ Stars модалка закрыта');
          setShowStarsModal(false);
          setStarsAmount('');
          setError(null);
        }}
        starsAmount={starsAmount}
        setStarsAmount={setStarsAmount}
        onSubmit={handleStarsDeposit}
        isProcessing={isStarsProcessing}
      />

      <TONDepositModal
        isOpen={showDepositModal}
        onClose={() => {
          addDebugInfo('❌ TON модалка закрыта');
          setShowDepositModal(false);
          setDepositAmount('');
          setError(null);
        }}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        onSubmit={handleTONDeposit}
        isProcessing={isTONProcessing}
      />

      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default WalletPage;