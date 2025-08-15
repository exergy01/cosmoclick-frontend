// pages/admin/components/AdminPlayersTab.tsx
import React, { useState, useEffect } from 'react';
import { useAdminStats } from '../hooks/useAdminStats';
import AdminTopPlayersTable from './AdminTopPlayersTable';
import PlayerActionsPanel from './PlayerActionsPanel';
import PlayerBalanceManager from './PlayerBalanceManager';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

interface AdminPlayersTabProps {
  colorStyle: string;
}

const AdminPlayersTab: React.FC<AdminPlayersTabProps> = ({ colorStyle }) => {
  const { stats, loading: statsLoading, refresh } = useAdminStats();
  const [actionResults, setActionResults] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});

  // Безопасное форматирование чисел
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    try {
      if (value === null || value === undefined) return defaultValue;
      if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Определение типа верификации игрока
  const getPlayerVerificationType = (player: any) => {
    if (player.premium_no_ads_forever) {
      return { type: 'premium_forever', label: '🏆 Премиум навсегда', color: '#FFD700' };
    } else if (player.premium_no_ads_until && new Date(player.premium_no_ads_until) > new Date()) {
      return { type: 'premium_30days', label: '👑 Премиум 30д', color: '#FF6B35' };
    } else if (player.verified) {
      return { type: 'basic_verified', label: '✅ Базовая', color: '#4CAF50' };
    } else {
      return { type: 'not_verified', label: '❌ Нет', color: '#FF5722' };
    }
  };

  // Функции управления верификацией
  const grantBasicVerification = async (playerId: string) => {
    const actionKey = `basic_verify_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      // Получаем telegram_id из localStorage или других источников
      const adminId = localStorage.getItem('telegramId') || '1222791281';
      
      const response = await axios.post(`${apiUrl}/api/admin/grant-basic-verification/${adminId}`, {
        playerId
      });
      
      if (response.data.success) {
        setActionResults(prev => [
          `✅ Базовая верификация выдана: ${playerId}`,
          ...prev.slice(0, 9)
        ]);
        refresh(); // Обновляем статистику
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка базовой верификации:', err);
      setActionResults(prev => [
        `❌ Базовая верификация: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const grantPremium30Days = async (playerId: string) => {
    const actionKey = `premium30_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const adminId = localStorage.getItem('telegramId') || '1222791281';
      
      const response = await axios.post(`${apiUrl}/api/admin/grant-premium-30days/${adminId}`, {
        playerId
      });
      
      if (response.data.success) {
        setActionResults(prev => [
          `✅ Премиум 30 дней выдан: ${playerId} (+ verified)`,
          ...prev.slice(0, 9)
        ]);
        refresh();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка премиум 30 дней:', err);
      setActionResults(prev => [
        `❌ Премиум 30 дней: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const grantPremiumForever = async (playerId: string) => {
    const actionKey = `premium_forever_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const adminId = localStorage.getItem('telegramId') || '1222791281';
      
      const response = await axios.post(`${apiUrl}/api/admin/grant-premium-forever/${adminId}`, {
        playerId
      });
      
      if (response.data.success) {
        setActionResults(prev => [
          `✅ Премиум навсегда выдан: ${playerId} (+ verified)`,
          ...prev.slice(0, 9)
        ]);
        refresh();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка премиум навсегда:', err);
      setActionResults(prev => [
        `❌ Премиум навсегда: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const revokeAllPremium = async (playerId: string) => {
    const actionKey = `revoke_all_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const adminId = localStorage.getItem('telegramId') || '1222791281';
      
      const response = await axios.post(`${apiUrl}/api/admin/revoke-premium/${adminId}`, {
        playerId
      });
      
      if (response.data.success) {
        setActionResults(prev => [
          `✅ Все статусы отменены: ${playerId} (verified + премиум)`,
          ...prev.slice(0, 9)
        ]);
        refresh();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка отмены статусов:', err);
      setActionResults(prev => [
        `❌ Отмена статусов: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const updatePlayerBalance = async (playerId: string, currency: string, operation: string, amount: number) => {
    const actionKey = `balance_${playerId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const adminId = localStorage.getItem('telegramId') || '1222791281';
      
      const response = await axios.post(`${apiUrl}/api/admin/update-balance/${adminId}`, {
        playerId,
        currency,
        operation,
        amount
      });
      
      if (response.data.success) {
        setActionResults(prev => [
          `✅ Баланс обновлен: ${playerId} ${currency} ${operation} ${amount}`,
          ...prev.slice(0, 9)
        ]);
        refresh();
      }
      
    } catch (err: any) {
      console.error('❌ Ошибка обновления баланса:', err);
      setActionResults(prev => [
        `❌ Баланс: ${err.response?.data?.error || err.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  return (
    <div>
      <h2 style={{ 
        color: colorStyle, 
        marginTop: 0, 
        marginBottom: '25px',
        fontSize: '1.4rem'
      }}>
        🎯 Управление игроками
      </h2>

      {/* Панель быстрых действий */}
      <PlayerActionsPanel
        colorStyle={colorStyle}
        onBasicVerification={grantBasicVerification}
        onPremium30Days={grantPremium30Days}
        onPremiumForever={grantPremiumForever}
        onRevokeAll={revokeAllPremium}
        onUpdateBalance={updatePlayerBalance}
      />

      {/* Менеджер баланса */}
      <PlayerBalanceManager
        colorStyle={colorStyle}
        onUpdateBalance={updatePlayerBalance}
      />

      {/* ТОП игроков с управлением */}
      {stats?.top_players && stats.top_players.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ 
            color: colorStyle, 
            marginBottom: '20px', 
            fontSize: '1.2rem' 
          }}>
            🏆 ТОП-10 игроков (управление):
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '15px'
          }}>
            {stats.top_players.slice(0, 10).map((player, index) => {
              const verificationType = getPlayerVerificationType(player);
              
              return (
                <div 
                  key={player.telegram_id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : colorStyle}40`,
                    borderRadius: '12px',
                    padding: '15px',
                    position: 'relative'
                  }}
                >
                  {/* Номер места */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: index < 3 
                      ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] 
                      : `${colorStyle}88`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: index < 3 ? '#000' : '#fff'
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* Информация об игроке */}
                  <div style={{ paddingRight: '40px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>
                      {player.first_name || player.username || 'Аноним'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                      ID: {player.telegram_id}
                    </div>
                  </div>
                  
                  {/* Балансы */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    marginBottom: '12px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#FFD700', fontWeight: 'bold' }}>
                        {safeNumber(player.cs).toFixed(0)}
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.7rem' }}>CS</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {safeNumber(player.ccc).toFixed(0)}
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.7rem' }}>CCC</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#0088cc', fontWeight: 'bold' }}>
                        {safeNumber(player.ton).toFixed(3)}
                      </div>
                      <div style={{ color: '#aaa', fontSize: '0.7rem' }}>TON</div>
                    </div>
                  </div>
                  
                  {/* Статус */}
                  <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.7rem',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      background: verificationType.color + '20',
                      border: `1px solid ${verificationType.color}60`,
                      color: verificationType.color,
                      fontWeight: 'bold',
                      display: 'inline-block'
                    }}>
                      {verificationType.label}
                    </div>
                  </div>
                  
                  {/* Кнопки управления */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr 1fr', 
                    gap: '4px'
                  }}>
                    <button
                      onClick={() => grantBasicVerification(player.telegram_id)}
                      disabled={actionLoading[`basic_verify_${player.telegram_id}`]}
                      style={{
                        padding: '6px 4px',
                        background: actionLoading[`basic_verify_${player.telegram_id}`] ? '#666' : '#4CAF50',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: actionLoading[`basic_verify_${player.telegram_id}`] ? 'wait' : 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                      title="Базовая верификация"
                    >
                      {actionLoading[`basic_verify_${player.telegram_id}`] ? '⏳' : '✅'}
                    </button>
                    
                    <button
                      onClick={() => grantPremium30Days(player.telegram_id)}
                      disabled={actionLoading[`premium30_${player.telegram_id}`]}
                      style={{
                        padding: '6px 4px',
                        background: actionLoading[`premium30_${player.telegram_id}`] ? '#666' : '#FF6B35',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: actionLoading[`premium30_${player.telegram_id}`] ? 'wait' : 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                      title="Премиум 30 дней"
                    >
                      {actionLoading[`premium30_${player.telegram_id}`] ? '⏳' : '👑'}
                    </button>
                    
                    <button
                      onClick={() => grantPremiumForever(player.telegram_id)}
                      disabled={actionLoading[`premium_forever_${player.telegram_id}`]}
                      style={{
                        padding: '6px 4px',
                        background: actionLoading[`premium_forever_${player.telegram_id}`] ? '#666' : '#FFD700',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#000',
                        cursor: actionLoading[`premium_forever_${player.telegram_id}`] ? 'wait' : 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                      title="Премиум навсегда"
                    >
                      {actionLoading[`premium_forever_${player.telegram_id}`] ? '⏳' : '🏆'}
                    </button>
                    
                    <button
                      onClick={() => revokeAllPremium(player.telegram_id)}
                      disabled={actionLoading[`revoke_all_${player.telegram_id}`]}
                      style={{
                        padding: '6px 4px',
                        background: actionLoading[`revoke_all_${player.telegram_id}`] ? '#666' : '#e74c3c',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: actionLoading[`revoke_all_${player.telegram_id}`] ? 'wait' : 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                      title="Отменить всё"
                    >
                      {actionLoading[`revoke_all_${player.telegram_id}`] ? '⏳' : '❌'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Результаты действий */}
      {actionResults.length > 0 && (
        <div style={{
          marginTop: '25px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '12px',
          padding: '15px'
        }}>
          <h4 style={{ 
            color: colorStyle, 
            margin: '0 0 10px 0', 
            fontSize: '1rem' 
          }}>
            📋 Результаты действий:
          </h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {actionResults.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  fontSize: '0.8rem', 
                  marginBottom: '4px', 
                  opacity: 1 - (index * 0.08),
                  padding: '2px 0'
                }}
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlayersTab;