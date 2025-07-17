// src/pages/WalletPage.tsx

import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem, updatePlayer } = usePlayer();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(player?.telegram_wallet || null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const colorStyle = player?.color || '#00f0ff';

  useEffect(() => {
    setConnectedWallet(player?.telegram_wallet || null);
  }, [player]);

  const connectTelegramWallet = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccess(null);
    
    // 🔥 РАСШИРЕННАЯ ОТЛАДКА
    const requestUrl = `${API_URL}/api/player/connect-wallet`;
    const requestBody = { telegram_id: player?.telegram_id };

    setDebugInfo(
      `--- НОВАЯ ПОПЫТКА ---
      Время: ${new Date().toLocaleTimeString()}
      Player ID: ${player?.telegram_id}
      
      --- ДАННЫЕ ЗАПРОСА ---
      Method: POST
      URL: ${requestUrl}
      Body: ${JSON.stringify(requestBody)}
      --------------------`
    );
    
    try {
      if (!player?.telegram_id) {
        setError(t('wallet.telegram_not_linked'));
        setDebugInfo(prev => `${prev}\n\n--- ОШИБКА --- \nПричина: Telegram ID не найден на фронтенде.`);
        setIsConnecting(false);
        return;
      }
      
      const response = await axios.post(requestUrl, requestBody);

      setDebugInfo(prev => `${prev}\n\n--- УСПЕХ --- \nСтатус ответа: ${response.status}\nДанные: ${JSON.stringify(response.data)}`);
      await updatePlayer(); 
      setSuccess(t('wallet.wallet_connected'));

    } catch (err: any) {
      setError(t('wallet.connection_failed'));
      // 🔥 ЛОГИРУЕМ ВСЮ ОШИБКУ
      let errorDetails = `Сообщение: ${err.message}`;
      if (err.response) {
        errorDetails += `\nСтатус: ${err.response.status}\nОтвет сервера: ${JSON.stringify(err.response.data)}`;
      }
      setDebugInfo(prev => `${prev}\n\n--- ОШИБКА --- \n${errorDetails}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (address: string | null) => address ? `${address.slice(0, 6)}...${address.slice(-6)}` : '';

  // ... (остальной код компонента без изменений)

  return (
    <div style={{ backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`, backgroundSize: 'cover', minHeight: '100vh', color: '#fff', padding: '10px' }}>
      <CurrencyPanel player={player} currentSystem={currentSystem} colorStyle={colorStyle} />
      <div style={{ marginTop: '150px', paddingBottom: '130px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: colorStyle, fontSize: '2.5rem', marginBottom: '30px' }}>💳 {t('wallet.title')}</h1>
          {error && <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '15px', margin: '20px auto', maxWidth: '500px' }}>⚠️ {error}</div>}
          {success && <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '15px', margin: '20px auto', maxWidth: '500px' }}>✅ {success}</div>}
          
          <div style={{ background: 'rgba(0, 0, 0, 0.7)', padding: '40px', margin: '20px auto', maxWidth: '500px', borderRadius: '25px' }}>
            <div style={{ fontSize: '3rem', color: colorStyle, marginBottom: '30px' }}>{parseFloat(player?.ton || '0').toFixed(8)} TON</div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#aaa' }}>{t('wallet.connected_wallet')}: {connectedWallet ? formatAddress(connectedWallet) : t('wallet.not_connected')}</p>
            </div>
            {!connectedWallet ? (
              <button onClick={connectTelegramWallet} disabled={isConnecting} style={{ padding: '18px', background: `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}40)`, border: `2px solid ${colorStyle}`, borderRadius: '15px', color: '#fff', fontSize: '1.1rem' }}>
                {isConnecting ? '🔄 ' + t('wallet.connecting') : '🔗 ' + t('wallet.connect_telegram_wallet')}
              </button>
            ) : (
              // ... кнопка вывода
              <></>
            )}
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.8)', padding: '15px', margin: '20px auto', maxWidth: '500px', borderRadius: '15px', color: '#ccc', fontSize: '0.8rem', whiteSpace: 'pre-wrap', textAlign: 'left', maxHeight: '300px', overflowY: 'auto' }}>
            Debug Info:<br />{debugInfo}
          </div>
        </div>
      </div>
      {/* ... модальное окно и навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default WalletPage;