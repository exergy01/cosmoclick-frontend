// src/pages/WalletPage.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
import React, { useState, useEffect, useMemo } from 'react';
import { useNewPlayer } from '../context/NewPlayerContext';
import { 
  TonConnectButton, 
  useTonAddress, 
  useTonWallet,
  useTonConnectUI,
  useIsConnectionRestored 
} from '@tonconnect/ui-react';
import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const WalletPage: React.FC = () => {
  const { player, updatePlayerData } = useNewPlayer();
  
  // TON Connect хуки
  const userAddress = useTonAddress();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const connectionRestored = useIsConnectionRestored();
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Синхронизация адреса кошелька с бэкендом
  useEffect(() => {
    if (userAddress && player?.telegram_id) {
      syncWalletWithBackend();
    }
  }, [userAddress, player?.telegram_id]);

  // Синхронизация кошелька с бэкендом
  const syncWalletWithBackend = async () => {
    try {
      if (!userAddress || !player?.telegram_id) return;

      // Проверяем, изменился ли адрес
      if (player.telegram_wallet === userAddress) return;

      console.log('Синхронизация кошелька с бэкендом:', userAddress);
      
      await axios.post(`${API_URL}/api/wallet/connect`, {
        telegram_id: player.telegram_id,
        wallet_address: userAddress,
        signature: 'ton-connect-verified' // TON Connect уже верифицирует подключение
      });

      // Обновляем данные игрока
      if (updatePlayerData) {
        await updatePlayerData();
      }
      setSuccess('Кошелек успешно подключен');
      
    } catch (err) {
      console.error('Ошибка синхронизации кошелька:', err);
      setError('Ошибка подключения кошелька');
    }
  };

  // Отключение кошелька
  const handleDisconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      
      // Обновляем на бэкенде
      await axios.post(`${API_URL}/api/wallet/disconnect`, {
        telegram_id: player?.telegram_id
      });
      
      if (updatePlayerData) {
        await updatePlayerData();
      }
      setSuccess('Кошелек отключен');
    } catch (err) {
      console.error('Ошибка отключения кошелька:', err);
      setError('Ошибка отключения кошелька');
    }
  };

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
      
      if (updatePlayerData) {
        await updatePlayerData();
      }

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

  if (!connectionRestored) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        color: '#fff', 
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)'
      }}>
        <div style={{ textAlign: 'center' }}>
          🔄 Загрузка кошелька...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      color: '#fff', 
      padding: '20px',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)'
    }}>
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
          💳 TON Кошелек
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>
          Управление криптовалютой TON
        </p>
      </div>

      {/* Сообщения */}
      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.15)', 
          color: '#ef4444', 
          padding: '15px', 
          margin: '20px auto', 
          maxWidth: '500px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.15)', 
          color: '#22c55e', 
          padding: '15px', 
          margin: '20px auto', 
          maxWidth: '500px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          ✅ {success}
        </div>
      )}
      
      {/* Основной блок кошелька */}
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.7)', 
        padding: '40px', 
        margin: '20px auto', 
        maxWidth: '500px', 
        borderRadius: '25px',
        border: '1px solid #00f0ff40',
        textAlign: 'center'
      }}>
        {/* Баланс TON */}
        <div style={{ marginBottom: '30px' }}>
          <p style={{ color: '#888', marginBottom: '10px' }}>Ваш баланс:</p>
          <div style={{ fontSize: '3rem', color: '#00f0ff', marginBottom: '10px' }}>
            {parseFloat(player?.ton || '0').toFixed(8)} TON
          </div>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            ≈ ${(parseFloat(player?.ton || '0') * 2.5).toFixed(2)} USD
          </p>
        </div>
        
        {/* Информация о подключенном кошельке */}
        {wallet && userAddress && (
          <div style={{ marginBottom: '30px', padding: '20px', background: 'rgba(0, 240, 255, 0.1)', borderRadius: '15px' }}>
            <p style={{ color: '#888', marginBottom: '10px' }}>
              🔗 Подключенный кошелек:
            </p>
            <p style={{ color: '#00f0ff', fontSize: '1.1rem', marginBottom: '5px' }}>
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
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setShowWithdrawModal(true);
                setError(null);
                setSuccess(null);
              }}
              disabled={parseFloat(player?.ton || '0') <= 0.1}
              style={{
                padding: '15px 30px',
                background: parseFloat(player?.ton || '0') > 0.1 
                  ? 'linear-gradient(135deg, #00f0ff80, #00f0ff40)'
                  : 'rgba(128, 128, 128, 0.3)',
                border: `2px solid ${parseFloat(player?.ton || '0') > 0.1 ? '#00f0ff' : '#666'}`,
                borderRadius: '15px',
                color: '#fff',
                fontSize: '1.1rem',
                cursor: parseFloat(player?.ton || '0') > 0.1 ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s'
              }}
            >
              💸 Вывести TON
            </button>
            
            <button
              onClick={handleDisconnect}
              style={{
                padding: '15px 30px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '2px solid #ef4444',
                borderRadius: '15px',
                color: '#ef4444',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              🔌 Отключить
            </button>
          </div>
        )}
      </div>

      {/* Информационный блок */}
      <div style={{ 
        background: 'rgba(0, 0, 0, 0.5)', 
        padding: '20px', 
        margin: '20px auto', 
        maxWidth: '500px', 
        borderRadius: '15px'
      }}>
        <h3 style={{ color: '#00f0ff', marginBottom: '15px', textAlign: 'center' }}>
          ℹ️ Информация о выводе
        </h3>
        <ul style={{ color: '#ccc', fontSize: '0.9rem', paddingLeft: '20px' }}>
          <li>Минимальная сумма вывода: 0.1 TON</li>
          <li>Комиссия сети: ~0.01 TON</li>
          <li>Время обработки: 1-3 минуты</li>
          <li>Поддерживаемые кошельки: TON Wallet, Tonkeeper, MyTonWallet</li>
        </ul>
      </div>

      {/* Модальное окно вывода */}
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
            border: '2px solid #00f0ff',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h2 style={{ color: '#00f0ff', marginBottom: '20px', textAlign: 'center' }}>
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
                  border: '1px solid #00f0ff',
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
                color: '#00f0ff', 
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
                  background: 'linear-gradient(135deg, #00f0ff80, #00f0ff40)',
                  border: '2px solid #00f0ff',
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
      )}
    </div>
  );
};

export default WalletPage;