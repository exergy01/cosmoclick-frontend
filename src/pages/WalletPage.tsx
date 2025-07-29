// src/pages/WalletPage.tsx - ЧАСТЬ 1
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import { 
  TonConnectButton, 
  useTonAddress, 
  useTonWallet,
  useTonConnectUI,
  useIsConnectionRestored 
} from '@tonconnect/ui-react';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem, setPlayer, refreshPlayer } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  
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
  // ЧАСТЬ 2: Вспомогательные функции
  
  // Безопасное получение имени кошелька
  const getWalletName = () => {
    if (!wallet) return '';
    
    // Проверяем разные возможные свойства
    if ('name' in wallet && wallet.name) {
      return wallet.name;
    }
    
    if ('appName' in wallet && wallet.appName) {
      return wallet.appName;
    }
    
    // Пытаемся извлечь из device
    if (wallet.device && 'appName' in wallet.device) {
      return wallet.device.appName;
    }
    
    return 'Unknown Wallet';
  };

  // Форматирование адреса
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Максимальная сумма для вывода
  const maxWithdrawAmount = useMemo(() => {
    const balance = parseFloat(player?.ton || '0');
    return Math.max(0, balance - 0.01); // Оставляем запас на комиссию
  }, [player?.ton]);
  // ЧАСТЬ 3: useEffect хуки и синхронизация

  // Синхронизация адреса кошелька с бэкендом
  useEffect(() => {
    if (userAddress && player?.telegram_id) {
      alert(`🔄 Кошелек подключен! Адрес: ${userAddress.slice(0, 10)}... Начинаем синхронизацию`);
      syncWalletWithBackend();
    }
  }, [userAddress, player?.telegram_id]);

  // Устанавливаем цвет по умолчанию
  useEffect(() => {
    if (player && !player.color) {
      setPlayer({ ...player, color: '#00f0ff' });
    }
  }, [player, setPlayer]);

  // Синхронизация кошелька с бэкендом
  const syncWalletWithBackend = async () => {
    try {
      console.log('🔄 Начинаем синхронизацию кошелька...');
      console.log('📱 Player ID:', player?.telegram_id);
      console.log('💳 Wallet Address:', userAddress);
      console.log('💳 Current Player Wallet:', player?.telegram_wallet);
      
      if (!userAddress || !player?.telegram_id) {
        console.log('❌ Отсутствуют данные для синхронизации');
        alert('❌ Отсутствуют данные для синхронизации');
        return;
      }

      // Проверяем, изменился ли адрес
      if (player.telegram_wallet === userAddress) {
        console.log('✅ Кошелек уже подключен, пропускаем синхронизацию');
        setSuccess('Кошелек уже подключен');
        alert('✅ Кошелек уже подключен');
        return;
      }

      alert(`📡 Отправляем запрос на сервер: ${API_URL}/api/wallet/connect`);
      console.log('📡 Отправляем запрос на сервер:', `${API_URL}/api/wallet/connect`);
      
      const requestData = {
        telegram_id: player.telegram_id,
        wallet_address: userAddress,
        signature: 'ton-connect-verified'
      };
      
      console.log('📦 Данные запроса:', requestData);
      
      const response = await axios.post(`${API_URL}/api/wallet/connect`, requestData);
      
      console.log('📨 Ответ сервера:', response.data);
      alert(`📨 Ответ сервера: ${JSON.stringify(response.data)}`);

      if (response.data.success) {
        console.log('✅ Синхронизация успешна');
        await refreshPlayer();
        setSuccess('Кошелек успешно подключен');
        setError(null);
        alert('✅ Синхронизация успешна!');
      } else {
        console.log('❌ Сервер вернул ошибку:', response.data.error);
        throw new Error(response.data.error || 'Unknown error');
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка синхронизации кошелька:', err);
      console.error('📊 Детали ошибки:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      
      const errorMsg = `Ошибка подключения: ${err.response?.data?.error || err.message}`;
      setError(errorMsg);
      alert(`❌ ${errorMsg}`);
    }
  };
  // ЧАСТЬ 4: Обработчики действий

  // Отключение кошелька
  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      
      // Обновляем на бэкенде
      await axios.post(`${API_URL}/api/wallet/disconnect`, {
        telegram_id: player?.telegram_id
      });
      
      await refreshPlayer();
      setSuccess('Кошелек отключен');
      setError(null);
    } catch (err: any) {
      console.error('Ошибка отключения кошелька:', err);
      setError('Ошибка отключения кошелька');
    }
  };

  // Пополнение TON баланса
  const handleDeposit = async () => {
    if (!tonConnectUI || !userAddress) {
      setError('Сначала подключите кошелек');
      return;
    }

    const amount = parseFloat(depositAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Неверная сумма');
      return;
    }

    if (amount < 0.01) {
      setError('Минимальная сумма пополнения: 0.01 TON');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Получаем адрес игрового кошелька из .env
      const gameWalletAddress = process.env.REACT_APP_GAME_WALLET_ADDRESS || "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      
      // Отправляем транзакцию пополнения
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: gameWalletAddress,
            amount: Math.floor(amount * 1e9).toString(), // nanoton
            payload: Buffer.from(`deposit:${player?.telegram_id}:${amount}`).toString('base64')
          }
        ]
      };

      console.log('Отправка транзакции пополнения:', transaction);
      const result = await tonConnectUI.sendTransaction(transaction);
      
      setSuccess(`Транзакция отправлена! Hash: ${result.boc.slice(0, 10)}...`);
      setDepositAmount('');
      setShowDepositModal(false);

    } catch (err: any) {
      console.error('Ошибка пополнения:', err);
      
      if (err.message?.includes('Wallet declined')) {
        setError('Транзакция отклонена кошельком');
      } else {
        setError('Ошибка отправки транзакции');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Пополнение Stars баланса
  const handleStarsDeposit = async () => {
    const amount = parseInt(starsAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Неверная сумма');
      return;
    }

    if (amount < 1) {
      setError('Минимальная сумма: 1 Star');
      return;
    }

    if (amount > 2500) {
      setError('Максимальная сумма: 2500 Stars');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Создаем счет на оплату Stars:', amount);
      
      const response = await axios.post(`${API_URL}/api/wallet/create-stars-invoice`, {
        telegram_id: player?.telegram_id,
        amount: amount,
        description: `Пополнение CosmoClick на ${amount} Stars`
      });

      if (response.data.success) {
        // Открываем ссылку на оплату в Telegram
        window.open(response.data.invoice_url, '_blank');
        setSuccess('Счет создан! Откройте ссылку для оплаты');
        setStarsAmount('');
        setShowStarsModal(false);
      } else {
        throw new Error(response.data.error || 'Ошибка создания счета');
      }

    } catch (err: any) {
      console.error('Ошибка создания счета Stars:', err);
      setError(`Ошибка: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  // ЧАСТЬ 5: Вывод средств

  // Вывод средств
  const handleWithdraw = async () => {
    if (!tonConnectUI || !userAddress) {
      setError('Сначала подключите кошелек');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    const playerBalance = parseFloat(player?.ton || '0');

    if (isNaN(amount) || amount <= 0) {
      setError('Неверная сумма');
      return;
    }

    if (amount > playerBalance) {
      setError('Недостаточно средств');
      return;
    }

    if (amount < 0.1) {
      setError('Минимальная сумма вывода: 0.1 TON');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Подготавливаем вывод на бэкенде
      const prepareResponse = await axios.post(`${API_URL}/api/wallet/prepare-withdrawal`, {
        telegram_id: player?.telegram_id,
        amount: amount
      });

      if (!prepareResponse.data.success) {
        throw new Error(prepareResponse.data.error || 'Ошибка подготовки вывода');
      }

      // 2. Отправляем транзакцию через TON Connect
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // 60 секунд
        messages: [
          {
            address: userAddress, // Адрес получателя (кошелек игрока)
            amount: Math.floor(amount * 1e9).toString(), // Конвертация в nanoton
            payload: prepareResponse.data.payload || undefined
          }
        ]
      };

      console.log('Отправка транзакции:', transaction);
      const result = await tonConnectUI.sendTransaction(transaction);
      
      // 3. Подтверждаем вывод на бэкенде
      await axios.post(`${API_URL}/api/wallet/confirm-withdrawal`, {
        telegram_id: player?.telegram_id,
        amount: amount,
        transaction_hash: result.boc,
        wallet_address: userAddress
      });

      setSuccess('Вывод средств выполнен успешно!');
      setWithdrawAmount('');
      setShowWithdrawModal(false);
      await refreshPlayer();

    } catch (err: any) {
      console.error('Ошибка вывода:', err);
      
      if (err.message?.includes('Wallet declined')) {
        setError('Транзакция отклонена кошельком');
      } else if (err.message?.includes('Insufficient')) {
        setError('Недостаточно средств в игре');
      } else {
        setError('Ошибка вывода средств');
      }
    } finally {
      setIsProcessing(false);
    }
  };
  // ЧАСТЬ 6: JSX рендер (начало)

  if (!connectionRestored) {
    return (
      <div style={{
        backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          textAlign: 'center',
          color: colorStyle,
          fontSize: '1.2rem'
        }}>
          🔄 Загрузка TON Connect...
        </div>
      </div>
    );
  }

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
          {/* ЧАСТЬ 7: Сообщения об ошибках и успехе */}
          {error && (
            <div style={{ 
              margin: '20px 0', 
              padding: '15px', 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid #ef4444', 
              borderRadius: '15px',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}
          
          {success && (
            <div style={{ 
              margin: '20px 0', 
              padding: '15px', 
              background: 'rgba(34, 197, 94, 0.15)', 
              border: '1px solid #22c55e', 
              borderRadius: '15px',
              boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
              color: '#22c55e',
              textAlign: 'center'
            }}>
              ✅ {success}
            </div>
          )}
          
          {/* Основной блок кошелька */}
          <div style={{ 
            margin: '20px 0', 
            padding: '30px', 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: `1px solid ${colorStyle}`, 
            borderRadius: '15px',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <h3 style={{ 
              color: colorStyle, 
              marginBottom: '20px', 
              fontSize: '1.5rem',
              textShadow: `0 0 10px ${colorStyle}`,
              textAlign: 'center'
            }}>
              💰 Ваш баланс
            </h3>
            
            {/* Баланс TON */}
            <div style={{ marginBottom: '25px', textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2rem', 
                color: colorStyle, 
                marginBottom: '5px',
                textShadow: `0 0 10px ${colorStyle}`
              }}>
                {parseFloat(player?.ton || '0').toFixed(8)} TON
              </div>
              <p style={{ color: '#666', fontSize: '0.8rem' }}>
                ≈ ${(parseFloat(player?.ton || '0') * 2.5).toFixed(2)} USD
              </p>
            </div>

            {/* Баланс Stars */}
            <div style={{ marginBottom: '25px', textAlign: 'center' }}>
              <div style={{ 
                fontSize: '1.8rem', 
                color: '#FFD700', 
                marginBottom: '5px',
                textShadow: '0 0 10px #FFD700'
              }}>
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
                background: `rgba(0, 0, 0, 0.4)`, 
                borderRadius: '12px',
                border: `1px solid ${colorStyle}40`
              }}>
                <p style={{ color: '#888', marginBottom: '10px' }}>
                  🔗 Подключенный кошелек:
                </p>
                <p style={{ 
                  color: colorStyle, 
                  fontSize: '1.1rem', 
                  marginBottom: '5px',
                  textShadow: `0 0 5px ${colorStyle}`
                }}>
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
            {/* ЧАСТЬ 8: Кнопки действий */}
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
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 0 15px rgba(34, 197, 94, 0.3)',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 25px #22c55e';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.3)';
                  }}
                >
                  💰 Пополнить TON
                </button>

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
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 25px #FFD700';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.3)';
                  }}
                >
                  ⭐ Купить Stars
                </button>
                
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
                    fontSize: '0.9rem',
                    cursor: parseFloat(player?.ton || '0') > 0.1 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    boxShadow: parseFloat(player?.ton || '0') > 0.1 
                      ? `0 0 15px ${colorStyle}30` 
                      : 'none',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={e => {
                    if (parseFloat(player?.ton || '0') > 0.1) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = `0 0 25px ${colorStyle}`;
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = parseFloat(player?.ton || '0') > 0.1 
                      ? `0 0 15px ${colorStyle}30` 
                      : 'none';
                  }}
                >
                  💸 Вывести TON
                </button>
                
                <button
                  onClick={handleDisconnect}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '2px solid #ef4444',
                    borderRadius: '12px',
                    color: '#ef4444',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 0 25px #ef4444';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.3)';
                  }}
                >
                  🔌 Отключить
                </button>
              </div>
            )}
          </div>
          {/* ЧАСТЬ 9: Информационный блок */}
          <div style={{ 
            margin: '20px 0', 
            padding: '20px', 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: `1px solid ${colorStyle}`, 
            borderRadius: '15px',
            boxShadow: `0 0 20px ${colorStyle}30`
          }}>
            <h3 style={{ 
              color: colorStyle, 
              marginBottom: '15px', 
              fontSize: '1.5rem',
              textShadow: `0 0 10px ${colorStyle}`
            }}>
              ℹ️ Информация о платежах
            </h3>
            <div style={{ textAlign: 'left', lineHeight: '1.6', color: '#ccc' }}>
              <p><strong style={{ color: colorStyle }}>TON пополнение:</strong> Минимум 0.01 TON</p>
              <p><strong style={{ color: colorStyle }}>TON вывод:</strong> Минимум 0.1 TON</p>
              <p><strong style={{ color: colorStyle }}>Stars покупка:</strong> От 1 до 2500 Stars</p>
              <p><strong style={{ color: colorStyle }}>Комиссия сети:</strong> ~0.01 TON</p>
              <p><strong style={{ color: colorStyle }}>Время обработки:</strong> 1-3 минуты</p>
              <p><strong style={{ color: colorStyle }}>Безопасность:</strong> Все транзакции через официальные сети</p>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно вывода TON */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            padding: '30px',
            borderRadius: '20px',
            border: `2px solid ${colorStyle}`,
            maxWidth: '400px',
            width: '100%',
            boxShadow: `0 0 30px ${colorStyle}30`
          }}>
            <h2 style={{ 
              color: colorStyle, 
              marginBottom: '20px', 
              textAlign: 'center',
              textShadow: `0 0 10px ${colorStyle}`,
              fontSize: '1.5rem'
            }}>
              💸 Вывод TON
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>
                Сумма для вывода:
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.1"
                step="0.01"
                min="0.1"
                max={maxWithdrawAmount}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: `1px solid ${colorStyle}`,
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1.1rem'
                }}
              />
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>
                Доступно: {maxWithdrawAmount.toFixed(8)} TON
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>
                Адрес получателя:
              </label>
              <p style={{ 
                color: colorStyle, 
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '12px',
                borderRadius: '10px',
                wordBreak: 'break-all',
                fontSize: '0.9rem'
              }}>
                {userAddress}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleWithdraw}
                disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) < 0.1}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  cursor: (isProcessing || !withdrawAmount || parseFloat(withdrawAmount) < 0.1) ? 'not-allowed' : 'pointer',
                  opacity: (isProcessing || !withdrawAmount || parseFloat(withdrawAmount) < 0.1) ? 0.5 : 1
                }}
              >
                {isProcessing ? '🔄 Обработка...' : '✅ Подтвердить'}
              </button>
              
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                  setError(null);
                }}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '2px solid #ef4444',
                  borderRadius: '10px',
                  color: '#ef4444',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }}
              >
                ❌ Отмена
              </button>
            </div>
          </div>
        </div>
      )}{/* ЧАСТЬ 10: Модальное окно пополнения TON */}
      {showDepositModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            padding: '30px',
            borderRadius: '20px',
            border: '2px solid #22c55e',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)'
          }}>
            <h2 style={{ 
              color: '#22c55e', 
              marginBottom: '20px', 
              textAlign: 'center',
              textShadow: '0 0 10px #22c55e',
              fontSize: '1.5rem'
            }}>
              💰 Пополнение TON
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>
                Сумма для пополнения:
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.01"
                step="0.01"
                min="0.01"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid #22c55e',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1.1rem'
                }}
              />
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>
                Минимум: 0.01 TON
              </p>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleDeposit}
                disabled={isProcessing || !depositAmount || parseFloat(depositAmount) < 0.01}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'linear-gradient(135deg, #22c55e30, #22c55e60, #22c55e30)',
                  border: '2px solid #22c55e',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  cursor: (isProcessing || !depositAmount || parseFloat(depositAmount) < 0.01) ? 'not-allowed' : 'pointer',
                  opacity: (isProcessing || !depositAmount || parseFloat(depositAmount) < 0.01) ? 0.5 : 1
                }}
              >
                {isProcessing ? '🔄 Отправка...' : '✅ Пополнить'}
              </button>
              
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  setDepositAmount('');
                  setError(null);
                }}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '2px solid #ef4444',
                  borderRadius: '10px',
                  color: '#ef4444',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }}
              >
                ❌ Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно пополнения Stars */}
      {showStarsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            padding: '30px',
            borderRadius: '20px',
            border: '2px solid #FFD700',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
          }}>
            <h2 style={{ 
              color: '#FFD700', 
              marginBottom: '20px', 
              textAlign: 'center',
              textShadow: '0 0 10px #FFD700',
              fontSize: '1.5rem'
            }}>
              ⭐ Купить Telegram Stars
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>
                Количество Stars:
              </label>
              <input
                type="number"
                value={starsAmount}
                onChange={(e) => setStarsAmount(e.target.value)}
                placeholder="1"
                step="1"
                min="1"
                max="2500"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid #FFD700',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1.1rem'
                }}
              />
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '5px' }}>
                От 1 до 2500 Stars
              </p>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ color: '#FFD700', fontSize: '1rem' }}>
                💰 Стоимость: {parseInt(starsAmount || '0')} Stars
              </p>
              <p style={{ color: '#888', fontSize: '0.8rem' }}>
                Оплата через Telegram
              </p>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleStarsDeposit}
                disabled={isProcessing || !starsAmount || parseInt(starsAmount) < 1}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'linear-gradient(135deg, #FFD70030, #FFD70060, #FFD70030)',
                  border: '2px solid #FFD700',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  cursor: (isProcessing || !starsAmount || parseInt(starsAmount) < 1) ? 'not-allowed' : 'pointer',
                  opacity: (isProcessing || !starsAmount || parseInt(starsAmount) < 1) ? 0.5 : 1
                }}
              >
                {isProcessing ? '🔄 Создание...' : '⭐ Купить Stars'}
              </button>
              
              <button
                onClick={() => {
                  setShowStarsModal(false);
                  setStarsAmount('');
                  setError(null);
                }}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '2px solid #ef4444',
                  borderRadius: '10px',
                  color: '#ef4444',
                  fontSize: '1.1rem',
                  cursor: 'pointer'
                }}
              >
                ❌ Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default WalletPage;