// src/pages/WalletPage.tsx - В СТИЛЕ ALPHABETPAGE
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
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const colorStyle = player?.color || '#00f0ff';

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
      console.log('🔄 Начинаем синхронизацию кошелька...');
      console.log('📱 Player ID:', player?.telegram_id);
      console.log('💳 Wallet Address:', userAddress);
      console.log('💳 Current Player Wallet:', player?.telegram_wallet);
      
      if (!userAddress || !player?.telegram_id) {
        console.log('❌ Отсутствуют данные для синхронизации');
        return;
      }

      // Проверяем, изменился ли адрес
      if (player.telegram_wallet === userAddress) {
        console.log('✅ Кошелек уже подключен, пропускаем синхронизацию');
        setSuccess('Кошелек уже подключен');
        return;
      }

      console.log('📡 Отправляем запрос на сервер:', `${API_URL}/api/wallet/connect`);
      
      const requestData = {
        telegram_id: player.telegram_id,
        wallet_address: userAddress,
        signature: 'ton-connect-verified'
      };
      
      console.log('📦 Данные запроса:', requestData);
      
      const response = await axios.post(`${API_URL}/api/wallet/connect`, requestData);
      
      console.log('📨 Ответ сервера:', response.data);

      if (response.data.success) {
        console.log('✅ Синхронизация успешна');
        await refreshPlayer();
        setSuccess('Кошелек успешно подключен');
        setError(null);
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
      
      setError(`Ошибка подключения: ${err.response?.data?.error || err.message}`);
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
      
      await refreshPlayer();
      setSuccess('Кошелек отключен');
      setError(null);
    } catch (err: any) {
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

  // Устанавливаем цвет по умолчанию
  useEffect(() => {
    if (player && !player.color) {
      setPlayer({ ...player, color: '#00f0ff' });
    }
  }, [player, setPlayer]);

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

          {/* Сообщения об ошибках и успехе */}
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
              textShadow: `0 0 10px ${colorStyle}`
            }}>
              💰 Ваш баланс TON
            </h3>
            
            {/* Баланс TON */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ 
                fontSize: '2.5rem', 
                color: colorStyle, 
                marginBottom: '10px',
                textShadow: `0 0 10px ${colorStyle}`
              }}>
                {parseFloat(player?.ton || '0').toFixed(8)} TON
              </div>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                ≈ ${(parseFloat(player?.ton || '0') * 2.5).toFixed(2)} USD
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
                    padding: '15px 25px',
                    background: parseFloat(player?.ton || '0') > 0.1 
                      ? `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`
                      : 'rgba(128, 128, 128, 0.3)',
                    border: `2px solid ${parseFloat(player?.ton || '0') > 0.1 ? colorStyle : '#666'}`,
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '1rem',
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
                    padding: '15px 25px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '2px solid #ef4444',
                    borderRadius: '12px',
                    color: '#ef4444',
                    fontSize: '1rem',
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

          {/* Информационный блок */}
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
              ℹ️ Информация о выводе
            </h3>
            <div style={{ textAlign: 'left', lineHeight: '1.6', color: '#ccc' }}>
              <p><strong style={{ color: colorStyle }}>Минимальная сумма:</strong> 0.1 TON</p>
              <p><strong style={{ color: colorStyle }}>Комиссия сети:</strong> ~0.01 TON</p>
              <p><strong style={{ color: colorStyle }}>Время обработки:</strong> 1-3 минуты</p>
              <p><strong style={{ color: colorStyle }}>Поддерживаемые кошельки:</strong> Tonkeeper, TON Wallet</p>
              <p><strong style={{ color: colorStyle }}>Безопасность:</strong> Все транзакции проходят через официальную сеть TON</p>
            </div>
          </div>
        </div>
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
      )}

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default WalletPage;