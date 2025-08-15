// pages/admin/components/PlayerActionsPanel.tsx
import React from 'react';

interface PlayerActionsPanelProps {
  colorStyle: string;
  onBasicVerification: (playerId: string) => void;
  onPremium30Days: (playerId: string) => void;
  onPremiumForever: (playerId: string) => void;
  onRevokeAll: (playerId: string) => void;
  onUpdateBalance: (playerId: string, currency: string, operation: string, amount: number) => void;
}

const PlayerActionsPanel: React.FC<PlayerActionsPanelProps> = ({
  colorStyle,
  onBasicVerification,
  onPremium30Days,
  onPremiumForever,
  onRevokeAll,
  onUpdateBalance
}) => {
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
        ⚡ Быстрые действия
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px'
      }}>
        
        {/* Базовая верификация */}
        <button
          onClick={() => {
            const playerId = prompt('🆔 ID игрока для БАЗОВОЙ верификации:');
            if (playerId?.trim()) {
              onBasicVerification(playerId.trim());
            }
          }}
          style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ✅ Базовая верификация
        </button>
        
        {/* Премиум 30 дней */}
        <button
          onClick={() => {
            const playerId = prompt('🆔 ID игрока для ПРЕМИУМ 30 дней:');
            if (playerId?.trim()) {
              onPremium30Days(playerId.trim());
            }
          }}
          style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #FF6B35, #e55a2b)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          👑 Премиум 30 дней
        </button>
        
        {/* Премиум навсегда */}
        <button
          onClick={() => {
            const playerId = prompt('🆔 ID игрока для ПРЕМИУМ навсегда:');
            if (playerId?.trim()) {
              onPremiumForever(playerId.trim());
            }
          }}
          style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #FFD700, #ddb800)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🏆 Премиум навсегда
        </button>
        
        {/* Отмена статусов */}
        <button
          onClick={() => {
            const playerId = prompt('🆔 ID игрока для ОТМЕНЫ статусов:');
            if (playerId?.trim() && confirm(`⚠️ Отменить ВСЕ статусы у игрока ${playerId}?\n\n• Убрать verified\n• Убрать все премиум функции`)) {
              onRevokeAll(playerId.trim());
            }
          }}
          style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ❌ Отменить статусы
        </button>
        
        {/* Быстрые балансы */}
        <button
          onClick={() => {
            const playerId = prompt('🆔 ID игрока для +1000 CS:');
            if (playerId?.trim()) {
              onUpdateBalance(playerId.trim(), 'cs', 'add', 1000);
            }
          }}
          style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          💰 +1000 CS
        </button>
        
        <button
          onClick={() => {
            const playerId = prompt('🆔 ID игрока для +5 TON:');
            if (playerId?.trim()) {
              onUpdateBalance(playerId.trim(), 'ton', 'add', 5);
            }
          }}
          style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #0088cc, #004466)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          💎 +5 TON
        </button>
      </div>
      
      <div style={{
        marginTop: '15px',
        padding: '10px',
        background: `${colorStyle}10`,
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#aaa'
      }}>
        💡 <strong>Совет:</strong> Для точного управления балансом используйте детальный менеджер ниже
      </div>
    </div>
  );
};

export default PlayerActionsPanel;