// pages/admin/components/PlayerBalanceManager.tsx
import React, { useState } from 'react';

interface PlayerBalanceManagerProps {
  colorStyle: string;
  onUpdateBalance: (playerId: string, currency: string, operation: string, amount: number) => void;
}

const PlayerBalanceManager: React.FC<PlayerBalanceManagerProps> = ({
  colorStyle,
  onUpdateBalance
}) => {
  const [formData, setFormData] = useState({
    playerId: '',
    currency: 'cs',
    operation: 'add',
    amount: ''
  });

  const currencies = [
    { value: 'cs', label: 'CS (Cosmo Stars)', color: '#FFD700' },
    { value: 'ccc', label: 'CCC (Cosmo Click Coin)', color: '#00f0ff' },
    { value: 'ton', label: 'TON', color: '#0088cc' },
    { value: 'stars', label: 'Telegram Stars', color: '#FFA500' }
  ];

  const operations = [
    { value: 'add', label: 'Добавить к текущему балансу' },
    { value: 'set', label: 'Установить точное значение' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.playerId.trim()) {
      alert('⚠️ Укажите ID игрока');
      return;
    }
    
    if (!formData.amount.trim()) {
      alert('⚠️ Укажите сумму');
      return;
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('⚠️ Сумма должна быть положительным числом');
      return;
    }

    const confirmText = `🔄 Подтвердите операцию:\n\n` +
      `👤 Игрок: ${formData.playerId}\n` +
      `💰 Валюта: ${currencies.find(c => c.value === formData.currency)?.label}\n` +
      `⚡ Операция: ${operations.find(o => o.value === formData.operation)?.label}\n` +
      `💵 Сумма: ${amount}\n\n` +
      `Продолжить?`;

    if (confirm(confirmText)) {
      onUpdateBalance(formData.playerId.trim(), formData.currency, formData.operation, amount);
      
      // Очищаем форму после отправки
      setFormData({
        playerId: '',
        currency: 'cs',
        operation: 'add',
        amount: ''
      });
    }
  };

  const selectedCurrency = currencies.find(c => c.value === formData.currency);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${colorStyle}40`,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '25px'
    }}>
      <h3 style={{ 
        color: colorStyle, 
        marginTop: 0, 
        marginBottom: '15px', 
        fontSize: '1.1rem' 
      }}>
        💳 Детальное управление балансом
      </h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px'
        }}>
          
          {/* ID игрока */}
          <div>
            <label style={{
              display: 'block',
              color: '#ccc',
              fontSize: '0.8rem',
              marginBottom: '5px'
            }}>
              🆔 ID игрока
            </label>
            <input
              type="text"
              value={formData.playerId}
              onChange={(e) => setFormData(prev => ({ ...prev, playerId: e.target.value }))}
              placeholder="1234567890"
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Валюта */}
          <div>
            <label style={{
              display: 'block',
              color: '#ccc',
              fontSize: '0.8rem',
              marginBottom: '5px'
            }}>
              💰 Валюта
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${selectedCurrency?.color || colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            >
              {currencies.map(currency => (
                <option 
                  key={currency.value} 
                  value={currency.value}
                  style={{ background: '#1a1a2e', color: '#fff' }}
                >
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Операция */}
          <div>
            <label style={{
              display: 'block',
              color: '#ccc',
              fontSize: '0.8rem',
              marginBottom: '5px'
            }}>
              ⚡ Операция
            </label>
            <select
              value={formData.operation}
              onChange={(e) => setFormData(prev => ({ ...prev, operation: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            >
              {operations.map(operation => (
                <option 
                  key={operation.value} 
                  value={operation.value}
                  style={{ background: '#1a1a2e', color: '#fff' }}
                >
                  {operation.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Сумма */}
          <div>
            <label style={{
              display: 'block',
              color: '#ccc',
              fontSize: '0.8rem',
              marginBottom: '5px'
            }}>
              💵 Сумма
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="100.00"
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${colorStyle}40`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
        
        {/* Предпросмотр операции */}
        {formData.playerId && formData.amount && (
          <div style={{
            background: `${selectedCurrency?.color || colorStyle}10`,
            border: `1px solid ${selectedCurrency?.color || colorStyle}40`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '15px',
            fontSize: '0.9rem'
          }}>
            <div style={{ color: selectedCurrency?.color || colorStyle, fontWeight: 'bold', marginBottom: '5px' }}>
              📋 Предпросмотр операции:
            </div>
            <div>
              👤 Игрок: <strong>{formData.playerId}</strong>
            </div>
            <div style={{ color: selectedCurrency?.color }}>
              💰 {selectedCurrency?.label}: <strong>{formData.operation === 'add' ? '+' : '='}{formData.amount}</strong>
            </div>
          </div>
        )}
        
        {/* Кнопка выполнения */}
        <button
          type="submit"
          disabled={!formData.playerId.trim() || !formData.amount.trim()}
          style={{
            width: '100%',
            padding: '12px',
            background: !formData.playerId.trim() || !formData.amount.trim()
              ? 'rgba(255, 255, 255, 0.1)'
              : `linear-gradient(135deg, ${selectedCurrency?.color || colorStyle}, ${selectedCurrency?.color || colorStyle}88)`,
            border: 'none',
            borderRadius: '8px',
            color: formData.currency === 'cs' || formData.currency === 'stars' ? '#000' : '#fff',
            cursor: !formData.playerId.trim() || !formData.amount.trim() ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          🚀 Выполнить операцию
        </button>
      </form>
      
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: 'rgba(255, 87, 34, 0.1)',
        border: '1px solid #ff572240',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#ff8a65'
      }}>
        ⚠️ <strong>Внимание:</strong> Изменения баланса необратимы. Убедитесь в правильности введенных данных.
      </div>
    </div>
  );
};

export default PlayerBalanceManager;