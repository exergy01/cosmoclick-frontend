// galactic-slots/components/BetPanel.tsx

import React from 'react';
import { GalacticSlotsStatus } from '../types';

interface BetPanelProps {
  gameStatus: GalacticSlotsStatus;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onSpin: () => void;
  onAutoSpin: (count: number) => void;
  onStopAutoSpin: () => void;
  onMaxBet: () => void;
  isSpinning: boolean;
  isAutoSpinning: boolean;
  autoSpinCount: number;
  colorStyle: string;
  t: any;
}

const BetPanel: React.FC<BetPanelProps> = ({
  gameStatus,
  betAmount,
  onBetAmountChange,
  onSpin,
  onAutoSpin,
  onStopAutoSpin,
  onMaxBet,
  isSpinning,
  isAutoSpinning,
  autoSpinCount,
  colorStyle,
  t
}) => {

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(gameStatus.minBet, Math.min(parseInt(e.target.value) || gameStatus.minBet, gameStatus.maxBet));
    onBetAmountChange(value);
  };

  const adjustBet = (delta: number) => {
    const newAmount = Math.max(gameStatus.minBet, Math.min(betAmount + delta, gameStatus.maxBet, gameStatus.balance));
    onBetAmountChange(newAmount);
  };

  const quickBets = [100, 500, 1000, 2500];

  const canSpin = !isSpinning && !isAutoSpinning && gameStatus.canPlayFree && betAmount <= gameStatus.balance;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      border: `1px solid ${colorStyle}`,
      borderRadius: '15px',
      padding: '20px',
      marginTop: '20px',
      maxWidth: '500px',
      width: '100%'
    }}>
      {/* Заголовок */}
      <h3 style={{
        color: colorStyle,
        textAlign: 'center',
        marginBottom: '20px',
        fontSize: '1.2rem',
        textShadow: `0 0 10px ${colorStyle}`
      }}>
        💰 {t.placeBet || 'Сделать ставку'}
      </h3>

      {/* Текущая ставка */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px'
      }}>
        <label style={{ color: '#ccc', fontSize: '1rem' }}>
          {t.betAmount || 'Ставка'}:
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <button
            onClick={() => adjustBet(-100)}
            disabled={betAmount <= gameStatus.minBet || isSpinning || isAutoSpinning}
            style={{
              padding: '8px 12px',
              background: betAmount <= gameStatus.minBet ? '#444' : `${colorStyle}40`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: betAmount <= gameStatus.minBet ? '#888' : colorStyle,
              cursor: betAmount <= gameStatus.minBet || isSpinning || isAutoSpinning ? 'not-allowed' : 'pointer',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            -
          </button>
          
          <input
            type="number"
            value={betAmount}
            onChange={handleBetChange}
            min={gameStatus.minBet}
            max={gameStatus.maxBet}
            disabled={isSpinning || isAutoSpinning}
            style={{
              width: '100px',
              padding: '8px',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.1)',
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          />
          
          <button
            onClick={() => adjustBet(100)}
            disabled={betAmount >= gameStatus.maxBet || betAmount >= gameStatus.balance || isSpinning || isAutoSpinning}
            style={{
              padding: '8px 12px',
              background: (betAmount >= gameStatus.maxBet || betAmount >= gameStatus.balance) ? '#444' : `${colorStyle}40`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: (betAmount >= gameStatus.maxBet || betAmount >= gameStatus.balance) ? '#888' : colorStyle,
              cursor: (betAmount >= gameStatus.maxBet || betAmount >= gameStatus.balance || isSpinning || isAutoSpinning) ? 'not-allowed' : 'pointer',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Быстрые ставки */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '15px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {quickBets.map(amount => (
          <button
            key={amount}
            onClick={() => onBetAmountChange(Math.min(amount, gameStatus.balance, gameStatus.maxBet))}
            disabled={amount > gameStatus.balance || isSpinning || isAutoSpinning}
            style={{
              padding: '6px 12px',
              background: amount > gameStatus.balance ? '#444' : `${colorStyle}20`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: amount > gameStatus.balance ? '#888' : colorStyle,
              cursor: amount > gameStatus.balance || isSpinning || isAutoSpinning ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          >
            {amount}
          </button>
        ))}
        
        <button
          onClick={onMaxBet}
          disabled={isSpinning || isAutoSpinning}
          style={{
            padding: '6px 12px',
            background: isSpinning || isAutoSpinning ? '#444' : `${colorStyle}40`,
            border: `1px solid ${colorStyle}`,
            borderRadius: '8px',
            color: isSpinning || isAutoSpinning ? '#888' : colorStyle,
            cursor: isSpinning || isAutoSpinning ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold'
          }}
        >
          MAX
        </button>
      </div>

      {/* Возможный выигрыш */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        padding: '10px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '5px' }}>
          Максимальный выигрыш:
        </div>
        <div style={{ 
          color: colorStyle, 
          fontSize: '1.2rem', 
          fontWeight: 'bold',
          textShadow: `0 0 10px ${colorStyle}`
        }}>
          {(betAmount * 5000).toLocaleString()} CCC
        </div>
      </div>

      {/* Кнопки */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Кнопка спина */}
        <button
          onClick={onSpin}
          disabled={!canSpin}
          style={{
            padding: '15px 30px',
            background: !canSpin 
              ? '#444' 
              : `linear-gradient(45deg, ${colorStyle}60, ${colorStyle}80)`,
            border: `2px solid ${!canSpin ? '#666' : colorStyle}`,
            borderRadius: '12px',
            color: !canSpin ? '#888' : 'white',
            cursor: !canSpin ? 'not-allowed' : 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: !canSpin ? 'none' : `0 0 10px ${colorStyle}`,
            minWidth: '120px',
            transition: 'all 0.3s ease',
            transform: isSpinning ? 'scale(0.95)' : 'scale(1)'
          }}
        >
          {isSpinning ? '🌀 СПИН...' : '🎰 СПИН'}
        </button>

        {/* Автоспин */}
        {!isAutoSpinning ? (
          <>
            <button
              onClick={() => onAutoSpin(10)}
              disabled={!canSpin}
              style={{
                padding: '12px 20px',
                background: !canSpin ? '#444' : `${colorStyle}40`,
                border: `1px solid ${!canSpin ? '#666' : colorStyle}`,
                borderRadius: '10px',
                color: !canSpin ? '#888' : colorStyle,
                cursor: !canSpin ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              AUTO x10
            </button>
            
            <button
              onClick={() => onAutoSpin(50)}
              disabled={!canSpin}
              style={{
                padding: '12px 20px',
                background: !canSpin ? '#444' : `${colorStyle}40`,
                border: `1px solid ${!canSpin ? '#666' : colorStyle}`,
                borderRadius: '10px',
                color: !canSpin ? '#888' : colorStyle,
                cursor: !canSpin ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              AUTO x50
            </button>
          </>
        ) : (
          <button
            onClick={onStopAutoSpin}
            style={{
              padding: '12px 20px',
              background: '#ff4444',
              border: '1px solid #ff6666',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            СТОП ({autoSpinCount})
          </button>
        )}
      </div>

      {/* Информация о лимитах */}
      <div style={{
        marginTop: '15px',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: '#999'
      }}>
        {t.gamesLeft || 'Игр осталось'}: {gameStatus.gamesLeft} / {5 + gameStatus.dailyAds}
      </div>
    </div>
  );
};

export default BetPanel;