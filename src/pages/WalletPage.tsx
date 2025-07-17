import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { player, currentSystem, updatePlayer } = usePlayer();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(player?.telegram_wallet || null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const colorStyle = player?.color || '#00f0ff';

  useEffect(() => {
    setConnectedWallet(player?.telegram_wallet || null);
  }, [player]);

  const connectTelegramWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (player?.telegram_id) {
        await axios.post(`${API_URL}/api/player/connect-telegram-wallet`, {
          telegram_id: player.telegram_id
        });
        await updatePlayer();
        setSuccess(t('wallet.wallet_connected'));
      } else {
        setError(t('wallet.telegram_not_linked'));
      }
    } catch (err: any) {
      setError(t('wallet.connection_failed'));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const minAmount = player?.verified ? 5 : 15;
    
    if (!amount || amount < minAmount || !withdrawAddress) {
      setError(t('wallet.invalid_withdraw_data'));
      return;
    }
    
    if (parseFloat(player?.ton || '0') < amount) {
      setError(t('wallet.insufficient_balance'));
      return;
    }
    
    setIsConnecting(true);
    try {
      await axios.post(`${API_URL}/api/player/withdraw`, {
        telegram_id: player?.telegram_id,
        amount,
        address: withdrawAddress
      });
      await updatePlayer();
      setSuccess(t('wallet.withdraw_success'));
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawAddress('');
    } catch (err: any) {
      setError(t('wallet.withdraw_failed'));
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (address: string) => address ? `${address.slice(0, 6)}...${address.slice(-6)}` : '';

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
              <p style={{ color: '#aaa' }}>{t('wallet.connected_wallet')}: {formatAddress(connectedWallet || '')}</p>
            </div>
            {!connectedWallet ? (
              <button onClick={connectTelegramWallet} disabled={isConnecting} style={{ padding: '18px', background: `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}40)`, border: `2px solid ${colorStyle}`, borderRadius: '15px', color: '#fff', fontSize: '1.1rem' }}>
                {isConnecting ? '🔄 ' + t('wallet.connecting') : '🔗 ' + t('wallet.connect_telegram_wallet')}
              </button>
            ) : (
              <button onClick={() => setShowWithdrawModal(true)} disabled={parseFloat(player?.ton || '0') < 5} style={{ padding: '18px', background: `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}40)`, border: `2px solid ${colorStyle}`, borderRadius: '15px', color: '#fff', fontSize: '1.1rem' }}>
                💸 {t('wallet.withdraw')}
              </button>
            )}
          </div>
        </div>
      </div>

      {showWithdrawModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.9)', padding: '40px', maxWidth: '450px', borderRadius: '25px' }}>
            <h3 style={{ color: colorStyle, marginBottom: '25px' }}>💸 {t('wallet.withdraw_modal_title')}</h3>
            <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Amount" style={{ padding: '15px', width: '100%', marginBottom: '20px' }} />
            <input type="text" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="Address" style={{ padding: '15px', width: '100%', marginBottom: '20px' }} />
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setShowWithdrawModal(false)} style={{ padding: '15px', flex: 1, background: '#666', color: '#fff', borderRadius: '12px' }}>{t('wallet.cancel')}</button>
              <button onClick={handleWithdraw} disabled={!withdrawAmount || !withdrawAddress || isConnecting} style={{ padding: '15px', flex: 1, background: `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}40)`, color: '#fff', borderRadius: '12px' }}>
                {isConnecting ? '🔄 ' + t('wallet.processing') : t('wallet.confirm_withdraw')}
              </button>
            </div>
          </div>
        </div>
      )}

      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default WalletPage;