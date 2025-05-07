import React, { useState } from 'react';
import axios from 'axios';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';
import { usePlayer } from './context/PlayerContext';
import { TonConnectButton, useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';

const WalletPage: React.FC = () => {
  const { player, setPlayer, tonExchanges, setTonExchanges } = usePlayer();
  const [csToTonAmount, setCsToTonAmount] = useState('');
  const [tonToCsAmount, setTonToCsAmount] = useState('');
  const [tonConnectUI] = useTonConnectUI();
  const walletAddress = useTonAddress() || 'UQ1234567890abcdef1234567890abcdef1234567890abcdef1234'; // Фиктивный адрес для теста

  // Курсы обмена
  const csToTonRate = 0.1; // 1 CS = 0.1 TON
  const tonToCsRate = 8; // 1 TON = 8 CS

  // Вычисление результатов обмена
  const csToTonResult = (parseFloat(csToTonAmount) || 0) * csToTonRate;
  const tonToCsResult = (parseFloat(tonToCsAmount) || 0) * tonToCsRate;

  // Базовый URL для API
  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com'
    : 'http://localhost:5000';

  // Обработчик ввода для CS → TON
  const handleCsToTonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCsToTonAmount(value);
    }
  };

  // Обработчик ввода для TON → CS
  const handleTonToCsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setTonToCsAmount(value);
    }
  };

  // Выполнение обмена CS на TON
  const exchangeCsToTon = async () => {
    if (!player) {
      alert('Игрок не загружен!');
      return;
    }
    if (!walletAddress) {
      alert('Подключите кошелёк TON!');
      return;
    }
    const amountCS = parseFloat(csToTonAmount);
    if (!amountCS || amountCS <= 0 || amountCS > player.cs) {
      alert('Недостаточно CS или неверная сумма!');
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/exchange-cs-to-ton`, {
        telegramId: player.telegram_id,
        amount: amountCS,
        walletAddress,
      });

      const { updatedPlayer, exchange } = response.data;
      setPlayer({
        ...updatedPlayer,
        ccc: parseFloat(updatedPlayer.ccc),
        cs: parseFloat(updatedPlayer.cs),
        ton: parseFloat(updatedPlayer.ton),
      });
      setTonExchanges([exchange, ...tonExchanges]);
      setCsToTonAmount('');
      alert('🎯 Обмен успешен!');
    } catch (error) {
      console.error('Ошибка при обмене CS на TON:', error);
      alert('❌ Ошибка при обмене!');
    }
  };

  // Выполнение обмена TON на CS
  const exchangeTonToCs = async () => {
    if (!player) {
      alert('Игрок не загружен!');
      return;
    }
    if (!walletAddress) {
      alert('Подключите кошелёк TON!');
      return;
    }
    const amountTON = parseFloat(tonToCsAmount);
    if (!amountTON || amountTON <= 0) {
      alert('Неверная сумма TON!');
      return;
    }

    try {
      // Закомментировано для теста без реальной транзакции
      /*
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: 'YOUR_SERVER_WALLET_ADDRESS',
            amount: (amountTON * 1e9).toString(),
          },
        ],
      };
      await tonConnectUI.sendTransaction(transaction);
      */

      const response = await axios.post(`${apiUrl}/exchange-ton-to-cs`, {
        telegramId: player.telegram_id,
        amount: amountTON,
        walletAddress,
      });

      const { updatedPlayer, exchange } = response.data;
      setPlayer({
        ...updatedPlayer,
        ccc: parseFloat(updatedPlayer.ccc),
        cs: parseFloat(updatedPlayer.cs),
        ton: parseFloat(updatedPlayer.ton),
      });
      setTonExchanges([exchange, ...tonExchanges]);
      setTonToCsAmount('');
      alert('🎯 Обмен успешен (тестовый режим)!');
    } catch (error) {
      console.error('Ошибка при обмене TON на CS:', error);
      alert('❌ Ошибка при обмене!');
    }
  };

  return (
    <div style={{
      backgroundImage: 'url(/backgrounds/cosmo-bg-1.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      backgroundColor: '#000022',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      color: '#00f0ff'
    }}>
      <style>
        {`
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
        `}
      </style>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '90px 10px 130px 10px'
      }}>
        <TopBar />
        <div style={{ marginTop: '10px', width: '90%' }}>
          {/* Секция подключения кошелька */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 34, 0.8)',
            border: '2px solid #00f0ff',
            borderRadius: '12px',
            padding: '10px',
            marginBottom: '20px',
            boxShadow: '0 0 10px #00f0ff',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '18px' }}>Кошелёк TON</h3>
            {walletAddress ? (
              <p style={{ fontSize: '14px', wordBreak: 'break-all' }}>
                Подключён: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            ) : (
              <TonConnectButton />
            )}
          </div>

          {/* Секция обмена CS на TON */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 34, 0.8)',
            border: '2px solid #00f0ff',
            borderRadius: '12px',
            padding: '10px',
            marginBottom: '20px',
            boxShadow: '0 0 10px #00f0ff'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '18px' }}>Обмен CS на TON</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="number"
                value={csToTonAmount}
                onChange={handleCsToTonChange}
                placeholder="Введите сумму CS"
                min="0"
                step="0.01"
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '2px solid #00f0ff',
                  backgroundColor: 'rgba(0, 0, 34, 0.8)',
                  color: '#00f0ff',
                  width: '150px',
                  marginRight: '10px'
                }}
              />
              <button
                onClick={() => setCsToTonAmount(player?.cs.toFixed(2) || '')}
                style={{
                  backgroundColor: 'rgba(0, 240, 255, 0.2)',
                  border: '2px solid #00f0ff',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#00f0ff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: '0 0 6px #00f0ff',
                  cursor: 'pointer'
                }}
              >
                Максимум
              </button>
            </div>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              Вы получите: {csToTonResult.toFixed(2)} TON
            </p>
            <button
              onClick={exchangeCsToTon}
              disabled={!csToTonAmount || parseFloat(csToTonAmount) <= 0 || parseFloat(csToTonAmount) > (player?.cs || 0) || !walletAddress}
              style={{
                backgroundColor: 'rgba(0, 240, 255, 0.2)',
                border: '2px solid #00f0ff',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#00f0ff',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 0 6px #00f0ff',
                cursor: 'pointer',
                width: '100%',
                opacity: !csToTonAmount || parseFloat(csToTonAmount) <= 0 || parseFloat(csToTonAmount) > (player?.cs || 0) || !walletAddress ? 0.5 : 1
              }}
            >
              ✅ Обменять
            </button>
          </div>

          {/* Секция обмена TON на CS */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 34, 0.8)',
            border: '2px solid #00f0ff',
            borderRadius: '12px',
            padding: '10px',
            marginBottom: '20px',
            boxShadow: '0 0 10px #00f0ff'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '18px' }}>Обмен TON на CS</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="number"
                value={tonToCsAmount}
                onChange={handleTonToCsChange}
                placeholder="Введите сумму TON"
                min="0"
                step="0.01"
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '2px solid #00f0ff',
                  backgroundColor: 'rgba(0, 0, 34, 0.8)',
                  color: '#00f0ff',
                  width: '150px',
                  marginRight: '10px'
                }}
              />
              <button
                onClick={() => setTonToCsAmount('')}
                style={{
                  backgroundColor: 'rgba(0, 240, 255, 0.2)',
                  border: '2px solid #00f0ff',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#00f0ff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  boxShadow: '0 0 6px #00f0ff',
                  cursor: 'pointer'
                }}
              >
                Максимум
              </button>
            </div>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              Вы получите: {tonToCsResult.toFixed(2)} CS
            </p>
            <button
              onClick={exchangeTonToCs}
              disabled={!tonToCsAmount || parseFloat(tonToCsAmount) <= 0 || !walletAddress}
              style={{
                backgroundColor: 'rgba(0, 240, 255, 0.2)',
                border: '2px solid #00f0ff',
                borderRadius: '8px',
                padding: '8px 16px',
                color: '#00f0ff',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 0 6px #00f0ff',
                cursor: 'pointer',
                width: '100%',
                opacity: !tonToCsAmount || parseFloat(tonToCsAmount) <= 0 || !walletAddress ? 0.5 : 1
              }}
            >
              ✅ Обменять
            </button>
          </div>

          {/* История обменов */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 34, 0.8)',
            border: '2px solid #00f0ff',
            borderRadius: '12px',
            padding: '10px',
            marginBottom: '10px',
            boxShadow: '0 0 10px #00f0ff'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '18px' }}>История обменов</h3>
            {tonExchanges.length > 0 ? tonExchanges.map((exchange) => (
              <div key={exchange.id} style={{
                backgroundColor: 'rgba(0, 0, 34, 0.9)',
                border: '1px solid #00f0ff',
                borderRadius: '8px',
                padding: '8px',
                marginBottom: '8px',
                boxShadow: '0 0 5px #00f0ff'
              }}>
                <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                  {exchange.type === 'CS_TO_TON'
                    ? `Обмен ${exchange.amount_from} CS на ${exchange.amount_to} TON`
                    : `Обмен ${exchange.amount_from} TON на ${exchange.amount_to} CS`}
                </p>
                <p style={{ fontSize: '12px', color: '#99f0ff' }}>
                  {new Date(exchange.timestamp).toLocaleString()}
                </p>
              </div>
            )) : (
              <p style={{ fontSize: '14px' }}>История обменов пуста</p>
            )}
          </div>
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: 'transparent',
        boxShadow: 'none',
        borderTop: 'none'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '5px 0',
          backgroundColor: 'rgba(0, 0, 34, 0.9)'
        }}>
          <MainMenu />
        </div>
      </div>
    </div>
  );
};

export default WalletPage;