import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';
import { usePlayer } from '../context/PlayerContext';

const ExchangePage: React.FC = () => {
  const { player, setPlayer, exchanges, setExchanges } = usePlayer();
  const [cccToCsAmount, setCccToCsAmount] = useState('');
  const [csToCccAmount, setCsToCccAmount] = useState('');

  // Курсы обмена
  const cccToCsRate = 100; // 100 CCC = 1 CS
  const csToCccRate = 50; // 1 CS = 50 CCC

  // Вычисление результатов обмена
  const cccToCsResult = (parseFloat(cccToCsAmount) || 0) / cccToCsRate;
  const csToCccResult = (parseFloat(csToCccAmount) || 0) * csToCccRate;

  // Базовый URL для API
  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com'
    : 'http://localhost:5000';

  // Обработчик ввода для CCC → CS
  const handleCccToCsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Разрешаем пустое поле или число с максимум 2 знаками после запятой
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCccToCsAmount(value);
    }
  };

  // Обработчик ввода для CS → CCC
  const handleCsToCccChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Разрешаем пустое поле или число с максимум 2 знаками после запятой
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCsToCccAmount(value);
    }
  };

  // Выполнение обмена CCC на CS
  const exchangeCccToCs = async () => {
    if (!player) {
      alert('Игрок не загружен!');
      return;
    }
    const amountCCC = parseFloat(cccToCsAmount);
    if (!amountCCC || amountCCC <= 0 || amountCCC > player.ccc) {
      alert('Недостаточно CCC или неверная сумма!');
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/exchange-ccc-to-cs`, {
        telegramId: player.telegram_id,
        amount: amountCCC,
      });

      const { updatedPlayer, exchange } = response.data;
      setPlayer({
        ...updatedPlayer,
        ccc: parseFloat(updatedPlayer.ccc),
        cs: parseFloat(updatedPlayer.cs),
        ton: parseFloat(updatedPlayer.ton),
      });
      setExchanges([exchange, ...exchanges]);
      setCccToCsAmount('');
      alert('🎯 Обмен успешен!');
    } catch (error) {
      console.error('Ошибка при обмене CCC на CS:', error);
      alert('❌ Ошибка при обмене!');
    }
  };

  // Выполнение обмена CS на CCC
  const exchangeCsToCcc = async () => {
    if (!player) {
      alert('Игрок не загружен!');
      return;
    }
    const amountCS = parseFloat(csToCccAmount);
    if (!amountCS || amountCS <= 0 || amountCS > player.cs) {
      alert('Недостаточно CS или неверная сумма!');
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/exchange-cs-to-ccc`, {
        telegramId: player.telegram_id,
        amount: amountCS,
      });

      const { updatedPlayer, exchange } = response.data;
      setPlayer({
        ...updatedPlayer,
        ccc: parseFloat(updatedPlayer.ccc),
        cs: parseFloat(updatedPlayer.cs),
        ton: parseFloat(updatedPlayer.ton),
      });
      setExchanges([exchange, ...exchanges]);
      setCsToCccAmount('');
      alert('🎯 Обмен успешен!');
    } catch (error) {
      console.error('Ошибка при обмене CS на CCC:', error);
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
      {/* Стили для удаления стрелок в input */}
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
          {/* Секция обмена CCC на CS */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 34, 0.8)',
            border: '2px solid #00f0ff',
            borderRadius: '12px',
            padding: '10px',
            marginBottom: '20px', // Увеличен разрыв
            boxShadow: '0 0 10px #00f0ff'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '18px' }}>Обмен CCC на CS</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="number"
                value={cccToCsAmount}
                onChange={handleCccToCsChange}
                placeholder="Введите сумму CCC"
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
                onClick={() => setCccToCsAmount(player?.ccc.toFixed(2) || '')}
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
              Вы получите: {cccToCsResult.toFixed(2)} CS
            </p>
            <button
              onClick={exchangeCccToCs}
              disabled={!cccToCsAmount || parseFloat(cccToCsAmount) <= 0 || parseFloat(cccToCsAmount) > (player?.ccc || 0)}
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
                opacity: !cccToCsAmount || parseFloat(cccToCsAmount) <= 0 || parseFloat(cccToCsAmount) > (player?.ccc || 0) ? 0.5 : 1
              }}
            >
              ✅ Обменять
            </button>
          </div>

          {/* Секция обмена CS на CCC */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 34, 0.8)',
            border: '2px solid #00f0ff',
            borderRadius: '12px',
            padding: '10px',
            marginBottom: '20px', // Увеличен разрыв
            boxShadow: '0 0 10px #00f0ff'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '18px' }}>Обмен CS на CCC</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="number"
                value={csToCccAmount}
                onChange={handleCsToCccChange}
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
                onClick={() => setCsToCccAmount(player?.cs.toFixed(2) || '')}
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
              Вы получите: {csToCccResult.toFixed(2)} CCC
            </p>
            <button
              onClick={exchangeCsToCcc}
              disabled={!csToCccAmount || parseFloat(csToCccAmount) <= 0 || parseFloat(csToCccAmount) > (player?.cs || 0)}
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
                opacity: !csToCccAmount || parseFloat(csToCccAmount) <= 0 || parseFloat(csToCccAmount) > (player?.cs || 0) ? 0.5 : 1
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
            {exchanges.length > 0 ? exchanges.map((exchange) => (
              <div key={exchange.id} style={{
                backgroundColor: 'rgba(0, 0, 34, 0.9)',
                border: '1px solid #00f0ff',
                borderRadius: '8px',
                padding: '8px',
                marginBottom: '8px',
                boxShadow: '0 0 5px #00f0ff'
              }}>
                <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                  {exchange.type === 'CCC_TO_CS'
                    ? `Обмен ${exchange.amount_from} CCC на ${exchange.amount_to} CS`
                    : `Обмен ${exchange.amount_from} CS на ${exchange.amount_to} CCC`}
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

export default ExchangePage;