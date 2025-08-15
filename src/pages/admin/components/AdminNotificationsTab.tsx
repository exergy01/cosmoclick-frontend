// pages/admin/components/AdminNotificationsTab.tsx
import React, { useState } from 'react';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

interface AdminNotificationsTabProps {
  colorStyle: string;
}

const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({ colorStyle }) => {
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [results, setResults] = useState<string[]>([]);

  const getAdminId = () => localStorage.getItem('telegramId') || '1222791281';

  const sendPersonalMessage = async () => {
    const playerId = prompt('🆔 ID игрока для отправки сообщения:');
    if (!playerId?.trim()) return;
    
    const message = prompt('📝 Текст сообщения игроку:');
    if (!message?.trim()) return;
    
    const actionKey = `message_${playerId}`;
    setLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.post(`${apiUrl}/api/admin/send-message/${getAdminId()}`, {
        playerId: playerId.trim(),
        message: message.trim()
      });
      
      if (response.data.success) {
        setResults(prev => [
          `✅ Сообщение отправлено игроку ${playerId}`,
          `📝 "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`,
          ...prev.slice(0, 8)
        ]);
      } else {
        setResults(prev => [
          `❌ Ошибка отправки: ${response.data.error}`,
          ...prev.slice(0, 9)
        ]);
      }
    } catch (error: any) {
      setResults(prev => [
        `❌ Сообщение: ${error.response?.data?.error || error.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const sendBroadcastMessage = async () => {
    const message = prompt('📢 Текст для рассылки всем игрокам:');
    if (!message?.trim()) return;
    
    const onlyVerified = confirm(
      'Отправить только верифицированным игрокам?\n\n' +
      'ОК = только верифицированным\n' +
      'Отмена = всем игрокам'
    );
    
    if (!confirm(
      `Вы уверены, что хотите отправить рассылку ${onlyVerified ? 'верифицированным' : 'всем'} игрокам?\n\n` +
      `Текст: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`
    )) {
      return;
    }
    
    const actionKey = 'broadcast_message';
    setLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const response = await axios.post(`${apiUrl}/api/admin/broadcast-message/${getAdminId()}`, {
        message: message.trim(),
        onlyVerified: onlyVerified
      });
      
      if (response.data.success) {
        const stats = response.data.statistics;
        setResults(prev => [
          `✅ Рассылка завершена: отправлено ${stats.sent_count}/${stats.total_players}`,
          `📊 Успешно: ${stats.sent_count}, ошибок: ${stats.total_players - stats.sent_count}`,
          `🎯 Аудитория: ${onlyVerified ? 'верифицированные' : 'все игроки'}`,
          ...prev.slice(0, 7)
        ]);
      }
    } catch (error: any) {
      setResults(prev => [
        `❌ Рассылка: ${error.response?.data?.error || error.message}`,
        ...prev.slice(0, 9)
      ]);
    } finally {
      setLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${colorStyle}40`,
      borderRadius: '12px',
      padding: '20px',
      minHeight: '300px'
    }}>
      <h3 style={{ 
        color: colorStyle, 
        marginTop: 0, 
        marginBottom: '20px',
        fontSize: '1.1rem'
      }}>
        📨 Управление уведомлениями
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        
        {/* Личное сообщение */}
        <button
          onClick={sendPersonalMessage}
          disabled={loading.message}
          style={{
            padding: '15px',
            background: loading.message 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, #9b59b6, #8e44ad)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            cursor: loading.message ? 'wait' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📱</div>
          {loading.message ? '⏳ Отправка...' : 'Сообщение игроку'}
          <div style={{ fontSize: '0.7rem', marginTop: '5px', opacity: 0.8 }}>
            Персональное уведомление
          </div>
        </button>
        
        {/* Массовая рассылка */}
        <button
          onClick={sendBroadcastMessage}
          disabled={loading.broadcast_message}
          style={{
            padding: '15px',
            background: loading.broadcast_message 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'linear-gradient(135deg, #e74c3c, #c0392b)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            cursor: loading.broadcast_message ? 'wait' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📢</div>
          {loading.broadcast_message ? '⏳ Рассылка...' : 'Рассылка всем'}
          <div style={{ fontSize: '0.7rem', marginTop: '5px', opacity: 0.8 }}>
            Массовое уведомление
          </div>
        </button>
      </div>

      {/* Информация о функциях */}
      <div style={{
        background: `${colorStyle}10`,
        border: `1px solid ${colorStyle}40`,
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: colorStyle, margin: '0 0 10px 0', fontSize: '0.9rem' }}>
          💡 Возможности системы уведомлений:
        </h4>
        <div style={{ fontSize: '0.8rem', color: '#aaa', lineHeight: '1.4' }}>
          • Персональные сообщения конкретным игрокам<br/>
          • Массовые рассылки всем игрокам или только верифицированным<br/>
          • Статистика доставки сообщений<br/>
          • Поддержка HTML-форматирования и эмодзи
        </div>
      </div>

      {/* Результаты */}
      {results.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '8px',
          padding: '15px'
        }}>
          <h4 style={{ 
            color: colorStyle, 
            margin: '0 0 10px 0', 
            fontSize: '0.9rem' 
          }}>
            📋 Результаты отправки:
          </h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {results.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  fontSize: '0.8rem', 
                  marginBottom: '4px', 
                  opacity: 1 - (index * 0.08),
                  padding: '2px 0',
                  borderLeft: index === 0 ? `3px solid ${colorStyle}` : 'none',
                  paddingLeft: index === 0 ? '8px' : '0'
                }}
              >
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Предупреждение */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: 'rgba(255, 87, 34, 0.1)',
        border: '1px solid #ff572240',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#ff8a65'
      }}>
        ⚠️ <strong>Внимание:</strong> Массовые рассылки влияют на всех игроков. 
        Используйте ответственно и проверяйте текст перед отправкой.
      </div>
    </div>
  );
};

export default AdminNotificationsTab;