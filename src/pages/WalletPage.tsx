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

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

interface WithdrawRequest {
  amount: number;
  address: string;
  fee: number;
  finalAmount: number;
}

const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { player, currentSystem, updatePlayer } = usePlayer();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const colorStyle = player?.color || '#00f0ff';

  // Инициализация шагов верификации
  useEffect(() => {
    const steps: VerificationStep[] = [
      {
        id: 'telegram',
        title: t('wallet.verification.telegram_title'),
        description: t('wallet.verification.telegram_desc'),
        completed: !!player?.telegram_id,
        required: true
      },
      {
        id: 'wallet',
        title: t('wallet.verification.wallet_title'), 
        description: t('wallet.verification.wallet_desc'),
        completed: !!connectedWallet,
        required: true
      },
      {
        id: 'activity',
        title: t('wallet.verification.activity_title'),
        description: t('wallet.verification.activity_desc'),
        completed: (player?.ccc || 0) >= 1000,
        required: true
      },
      {
        id: 'social',
        title: t('wallet.verification.social_title'),
        description: t('wallet.verification.social_desc'),
        completed: false,
        required: false
      }
    ];
    setVerificationSteps(steps);
  }, [player, connectedWallet, t]);

  // Проверка возможности верификации
  const canVerify = () => {
    return verificationSteps
      .filter(step => step.required)
      .every(step => step.completed) && !player?.verified;
  };

  // Получение минимальной суммы для вывода
  const getMinWithdrawAmount = () => {
    return player?.verified ? 5 : 15;
  };

  // Подключение TON кошелька
  const connectTonWallet = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Проверяем наличие TON кошелька
      if (typeof window !== 'undefined' && (window as any).tonkeeper) {
        const tonkeeper = (window as any).tonkeeper;
        const accounts = await tonkeeper.send('ton_requestAccounts');
        
        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          setConnectedWallet(address);
          setSuccess(t('wallet.wallet_connected'));
          
          // Сохраняем адрес на сервере
          await axios.post(`${API_URL}/api/player/connect-wallet`, {
            telegram_id: player?.telegram_id,
            wallet_address: address
          });
        }
      } else {
        // Если кошелек не установлен, открываем ссылку на установку
        window.open('https://tonkeeper.com/', '_blank');
        setError(t('wallet.install_wallet'));
      }
    } catch (err: any) {
      setError(t('wallet.connection_failed'));
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Процесс верификации
  const handleVerification = async () => {
    if (!canVerify()) return;
    
    setIsVerifying(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/player/verify`, {
        telegram_id: player?.telegram_id,
        wallet_address: connectedWallet,
        verification_data: {
          steps: verificationSteps.filter(s => s.completed),
          timestamp: Date.now()
        }
      });
      
      if (response.data.success) {
        // Обновляем данные игрока
        await updatePlayer();
        setSuccess(t('wallet.verification_success'));
      }
    } catch (err: any) {
      setError(t('wallet.verification_failed'));
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Расчет комиссии и финальной суммы
  const calculateWithdrawDetails = (amount: number): WithdrawRequest => {
    const fee = 0.1; // Комиссия сети TON
    const finalAmount = Math.max(0, amount - fee);
    
    return {
      amount,
      address: withdrawAddress,
      fee,
      finalAmount
    };
  };

  // Вывод средств
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const minAmount = getMinWithdrawAmount();
    
    if (!amount || amount < minAmount || !withdrawAddress) {
      setError(t('wallet.invalid_withdraw_data'));
      return;
    }
    
    if ((player?.ton || 0) < amount) {
      setError(t('wallet.insufficient_balance'));
      return;
    }
    
    setIsWithdrawing(true);
    setError(null);
    
    try {
      const withdrawDetails = calculateWithdrawDetails(amount);
      
      const response = await axios.post(`${API_URL}/api/player/withdraw`, {
        telegram_id: player?.telegram_id,
        ...withdrawDetails
      });
      
      if (response.data.success) {
        await updatePlayer();
        setSuccess(t('wallet.withdraw_success'));
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setWithdrawAddress('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('wallet.withdraw_failed'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Форматирование адреса кошелька
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

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

      {/* Основной контент */}
      <div style={{ marginTop: '150px', paddingBottom: '130px' }}>
        <div style={{ flex: 1, padding: '10px', textAlign: 'center' }}>
          <h1 style={{ 
            color: colorStyle, 
            textShadow: `0 0 20px ${colorStyle}`, 
            fontSize: '2.5rem', 
            marginBottom: '30px',
            fontWeight: 'bold'
          }}>
            💳 {t('wallet.title')}
          </h1>

          {/* Уведомления */}
          {error && (
            <div style={{
              margin: '20px auto',
              padding: '15px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #ef4444',
              borderRadius: '15px',
              color: '#ef4444',
              maxWidth: '500px',
              fontWeight: '500'
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={{
              margin: '20px auto',
              padding: '15px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              borderRadius: '15px',
              color: '#22c55e',
              maxWidth: '500px',
              fontWeight: '500'
            }}>
              ✅ {success}
            </div>
          )}
          
          {/* TON Баланс */}
          <div style={{
            margin: '20px auto',
            padding: '40px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            border: `2px solid ${colorStyle}40`,
            borderRadius: '25px',
            boxShadow: `0 0 40px ${colorStyle}20`,
            maxWidth: '500px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              background: `linear-gradient(45deg, ${colorStyle}30, transparent, ${colorStyle}30)`,
              borderRadius: '25px',
              zIndex: -1
            }} />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '15px',
              marginBottom: '30px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colorStyle}60, ${colorStyle}40)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                boxShadow: `0 0 20px ${colorStyle}40`
              }}>
                💎
              </div>
              <div>
                <h3 style={{ color: colorStyle, margin: 0, fontSize: '1.5rem' }}>
                  {t('wallet.ton_wallet')}
                </h3>
                <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>
                  {connectedWallet ? formatAddress(connectedWallet) : t('wallet.not_connected')}
                </p>
              </div>
            </div>

            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: colorStyle,
              textShadow: `0 0 15px ${colorStyle}`,
              marginBottom: '30px',
              fontFamily: 'monospace'
            }}>
              {(player?.ton || 0).toFixed(8)} TON
            </div>

            {/* Кнопки действий */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: connectedWallet ? '1fr 1fr' : '1fr',
              gap: '15px',
              marginBottom: '20px'
            }}>
              {!connectedWallet ? (
                <button
                  onClick={connectTonWallet}
                  disabled={isConnecting}
                  style={{
                    padding: '18px 30px',
                    background: `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}40)`,
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '15px',
                    color: '#fff',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 0 25px ${colorStyle}60`
                  }}
                >
                  {isConnecting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: `3px solid ${colorStyle}30`,
                        borderTop: `3px solid ${colorStyle}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      {t('wallet.connecting')}
                    </span>
                  ) : (
                    <>🔗 {t('wallet.connect_wallet')}</>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={(player?.ton || 0) < getMinWithdrawAmount()}
                    style={{
                      padding: '18px 20px',
                      background: (player?.ton || 0) >= getMinWithdrawAmount()
                        ? `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}40)`
                        : 'rgba(128, 128, 128, 0.3)',
                      border: `2px solid ${(player?.ton || 0) >= getMinWithdrawAmount() ? colorStyle : '#555'}`,
                      borderRadius: '15px',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: (player?.ton || 0) >= getMinWithdrawAmount() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      boxShadow: (player?.ton || 0) >= getMinWithdrawAmount() ? `0 0 25px ${colorStyle}60` : 'none'
                    }}
                  >
                    💸 {t('wallet.withdraw')}
                  </button>
                  
                  <button
                    onClick={() => navigate('/exchange')}
                    style={{
                      padding: '18px 20px',
                      background: `linear-gradient(135deg, #6366f160, #6366f140)`,
                      border: '2px solid #6366f1',
                      borderRadius: '15px',
                      color: '#fff',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 25px #6366f160'
                    }}
                  >
                    🔄 {t('wallet.exchange')}
                  </button>
                </>
              )}
            </div>

            {/* Лимиты вывода */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '15px',
              padding: '15px',
              border: `1px solid ${colorStyle}20`,
              fontSize: '0.9rem',
              color: '#ccc'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>{t('wallet.min_withdraw')}:</span>
                <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                  {getMinWithdrawAmount()} TON
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('wallet.network_fee')}:</span>
                <span style={{ color: colorStyle, fontWeight: 'bold' }}>~0.1 TON</span>
              </div>
            </div>
          </div>

          {/* Верификация */}
          <div style={{
            margin: '30px auto',
            padding: '30px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '25px',
            border: `1px solid ${player?.verified ? '#22c55e' : colorStyle}30`,
            boxShadow: `0 0 25px ${player?.verified ? '#22c55e' : colorStyle}15`,
            maxWidth: '600px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '15px',
              marginBottom: '25px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: player?.verified 
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                  : `linear-gradient(135deg, ${colorStyle}60, ${colorStyle}40)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                {player?.verified ? '✅' : '🔐'}
              </div>
              <h3 style={{ 
                color: player?.verified ? '#22c55e' : colorStyle, 
                margin: 0, 
                fontSize: '1.4rem' 
              }}>
                {player?.verified ? t('wallet.verified') : t('wallet.verification')}
              </h3>
            </div>

            {player?.verified ? (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '15px',
                border: '1px solid #22c55e30'
              }}>
                <p style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: '500' }}>
                  🎉 {t('wallet.verification_complete')}
                </p>
                <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '10px 0 0 0' }}>
                  {t('wallet.verification_benefits')}
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '25px' }}>
                  {verificationSteps.map((step, index) => (
                    <div key={step.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '15px',
                      marginBottom: '10px',
                      background: step.completed 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      border: `1px solid ${step.completed ? '#22c55e30' : '#ffffff20'}`
                    }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: step.completed ? '#22c55e' : '#555',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '15px',
                        fontSize: '0.9rem'
                      }}>
                        {step.completed ? '✓' : index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '5px'
                        }}>
                          <span style={{
                            color: step.completed ? '#22c55e' : '#fff',
                            fontWeight: '500'
                          }}>
                            {step.title}
                          </span>
                          {step.required && (
                            <span style={{
                              background: '#ef4444',
                              color: '#fff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 'bold'
                            }}>
                              {t('wallet.required')}
                            </span>
                          )}
                        </div>
                        <p style={{
                          color: '#aaa',
                          fontSize: '0.8rem',
                          margin: 0
                        }}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleVerification}
                  disabled={!canVerify() || isVerifying}
                  style={{
                    padding: '18px 40px',
                    width: '100%',
                    background: canVerify() && !isVerifying
                      ? `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}40)`
                      : 'rgba(128, 128, 128, 0.3)',
                    border: `2px solid ${canVerify() && !isVerifying ? colorStyle : '#555'}`,
                    borderRadius: '15px',
                    color: '#fff',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: canVerify() && !isVerifying ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    boxShadow: canVerify() && !isVerifying ? `0 0 25px ${colorStyle}60` : 'none'
                  }}
                >
                  {isVerifying ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: `3px solid ${colorStyle}30`,
                        borderTop: `3px solid ${colorStyle}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      {t('wallet.verifying')}
                    </span>
                  ) : (
                    <>🔐 {t('wallet.start_verification')} (+1 TON)</>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Информационные карточки */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            margin: '30px auto',
            maxWidth: '800px'
          }}>
            {/* Как получить TON */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: `1px solid ${colorStyle}30`,
              boxShadow: `0 0 25px ${colorStyle}15`
            }}>
              <h3 style={{ color: colorStyle, marginBottom: '20px', fontSize: '1.3rem', textAlign: 'center' }}>
                💰 {t('wallet.how_to_earn')}
              </h3>
              <div style={{ lineHeight: '1.6', color: '#ccc', fontSize: '0.9rem' }}>
                <p>• {t('wallet.earn_exchange')}</p>
                <p>• {t('wallet.earn_verification')}</p>
                <p>• {t('wallet.earn_activities')}</p>
                <p>• {t('wallet.earn_referrals')}</p>
              </div>
            </div>

            {/* Безопасность */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              border: `1px solid ${colorStyle}30`,
              boxShadow: `0 0 25px ${colorStyle}15`
            }}>
              <h3 style={{ color: colorStyle, marginBottom: '20px', fontSize: '1.3rem', textAlign: 'center' }}>
                🛡️ {t('wallet.security')}
              </h3>
              <div style={{ lineHeight: '1.6', color: '#ccc', fontSize: '0.9rem' }}>
                <p>• {t('wallet.security_decentralized')}</p>
                <p>• {t('wallet.security_verification')}</p>
                <p>• {t('wallet.security_limits')}</p>
                <p>• {t('wallet.security_support')}</p>
              </div>
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
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            borderRadius: '25px',
            padding: '40px',
            maxWidth: '450px',
            width: '100%',
            border: `2px solid ${colorStyle}40`,
            boxShadow: `0 0 50px ${colorStyle}30`
          }}>
            <h3 style={{ 
              color: colorStyle, 
              marginBottom: '25px', 
              fontSize: '1.5rem',
              textAlign: 'center'
            }}>
              💸 {t('wallet.withdraw_modal_title')}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#ccc', marginBottom: '10px', display: 'block' }}>
                {t('wallet.withdraw_amount')}:
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`${t('wallet.min')} ${getMinWithdrawAmount()} TON`}
                style={{
                  padding: '15px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${colorStyle}60`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ color: '#ccc', marginBottom: '10px', display: 'block' }}>
                {t('wallet.withdraw_address')}:
              </label>
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder="UQ..."
                style={{
                  padding: '15px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${colorStyle}60`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '25px',
                border: `1px solid ${colorStyle}30`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#ccc' }}>{t('wallet.amount')}:</span>
                  <span style={{ color: '#fff' }}>{parseFloat(withdrawAmount)} TON</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#ccc' }}>{t('wallet.fee')}:</span>
                  <span style={{ color: '#f59e0b' }}>0.1 TON</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span style={{ color: colorStyle }}>{t('wallet.you_receive')}:</span>
                  <span style={{ color: colorStyle }}>
                    {Math.max(0, parseFloat(withdrawAmount) - 0.1).toFixed(4)} TON
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setShowWithdrawModal(false)}
                style={{
                  padding: '15px 25px',
                  flex: 1,
                  background: 'rgba(128, 128, 128, 0.3)',
                  border: '2px solid #666',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {t('wallet.cancel')}
              </button>
              
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || !withdrawAddress || isWithdrawing}
                style={{
                  padding: '15px 25px',
                  flex: 1,
                  background: withdrawAmount && withdrawAddress && !isWithdrawing
                    ? `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}40)`
                    : 'rgba(128, 128, 128, 0.3)',
                  border: `2px solid ${withdrawAmount && withdrawAddress && !isWithdrawing ? colorStyle : '#666'}`,
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: withdrawAmount && withdrawAddress && !isWithdrawing ? 'pointer' : 'not-allowed'
                }}
              >
                {isWithdrawing ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: `2px solid ${colorStyle}30`,
                      borderTop: `2px solid ${colorStyle}`,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    {t('wallet.processing')}
                  </span>
                ) : (
                  t('wallet.confirm_withdraw')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
      
      {/* CSS анимации */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default WalletPage;