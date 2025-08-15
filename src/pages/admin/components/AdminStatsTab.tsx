// pages/admin/components/AdminStatsTab.tsx - ПРОСТАЯ РАБОЧАЯ ВЕРСИЯ
import React, { useEffect } from 'react';
import { useAdminStats } from '../hooks/useAdminStats';

interface AdminStatsTabProps {
  colorStyle: string;
  onPlayerClick?: (playerId: string) => void;
}

const AdminStatsTab: React.FC<AdminStatsTabProps> = ({
  colorStyle,
  onPlayerClick
}) => {
  const { stats, loading, error, refresh } = useAdminStats();

  // Автозагрузка статистики
  useEffect(() => {
    refresh();
  }, [refresh]);

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

  // Обработчик обновления
  const handleRefresh = () => {
    refresh();
  };

  return (
    <div>
      {/* Заголовок с кнопкой обновления */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px'
      }}>
        <h2 style={{ 
          color: colorStyle, 
          margin: 0,
          fontSize: '1.4rem'
        }}>
          📊 Статистика системы
        </h2>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: loading 
              ? 'rgba(255, 255, 255, 0.1)' 
              : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: loading ? 'wait' : 'pointer',
            fontSize: '0.8rem',
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? '⏳' : '🔄'} Обновить
        </button>
      </div>

      {/* Отображение ошибки */}
      {error && (
        <div style={{
          background: 'rgba(255, 87, 34, 0.1)',
          border: '1px solid #ff572240',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
          <div style={{ color: '#ff6666', fontWeight: 'bold', marginBottom: '10px' }}>
            Ошибка загрузки статистики
          </div>
          <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
            {error}
          </div>
        </div>
      )}

      {/* Состояние загрузки */}
      {loading && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px', animation: 'spin 1s linear infinite' }}>⏳</div>
          <div style={{ color: '#aaa' }}>Загружаем статистику...</div>
        </div>
      )}

      {/* Отображение статистики */}
      {!loading && !error && stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          
          {/* Игроки */}
          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid #4CAF5040',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
            <div style={{ color: '#4CAF50', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {safeNumber(stats.players?.total_players)}
            </div>
            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Всего игроков</div>
            <div style={{ color: '#4CAF50', fontSize: '0.8rem', marginTop: '5px' }}>
              Верифицированных: {safeNumber(stats.players?.verified_players)}
            </div>
          </div>

          {/* Активность */}
          <div style={{
            background: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid #FF980040',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔥</div>
            <div style={{ color: '#FF9800', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {safeNumber(stats.players?.active_24h)}
            </div>
            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Активны 24ч</div>
            <div style={{ color: '#FF9800', fontSize: '0.8rem', marginTop: '5px' }}>
              За 7 дней: {safeNumber(stats.players?.active_7d)}
            </div>
          </div>

          {/* CS */}
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid #FFD70040',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⭐</div>
            <div style={{ color: '#FFD700', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {safeNumber(stats.currencies?.total_cs).toLocaleString()}
            </div>
            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Всего CS</div>
          </div>

          {/* TON */}
          <div style={{
            background: 'rgba(0, 136, 204, 0.1)',
            border: '1px solid #0088cc40',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💎</div>
            <div style={{ color: '#0088cc', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {safeNumber(stats.currencies?.total_ton).toFixed(2)}
            </div>
            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Всего TON</div>
          </div>
        </div>
      )}

      {/* Заглушка если нет данных */}
      {!loading && !error && !stats && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${colorStyle}40`,
          borderRadius: '15px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
          <h3 style={{ color: colorStyle, marginBottom: '15px' }}>Статистика не загружена</h3>
          <p style={{ color: '#aaa' }}>Нажмите "Обновить" для загрузки данных</p>
        </div>
      )}

      {/* Информация о загрузке */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid #4CAF5040',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '0.9rem'
      }}>
        <div style={{ color: '#4CAF50', marginBottom: '5px' }}>
          ✅ AdminStatsTab загружен успешно
        </div>
        <div style={{ color: '#aaa' }}>
          Статистика: {stats ? 'Загружена' : 'Не загружена'} | 
          Ошибка: {error ? 'Есть' : 'Нет'} | 
          Загрузка: {loading ? 'Да' : 'Нет'}
        </div>
      </div>

      {/* CSS для анимации */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AdminStatsTab;