// pages/admin/components/AdminStatsTab.tsx
import React, { useEffect } from 'react';
import { useAdminStats } from '../hooks/useAdminStats';
import AdminStatsCard from './AdminStatsCard';
import AdminTopPlayersTable from './AdminTopPlayersTable';

interface AdminStatsTabProps {
  colorStyle: string;
  onPlayerClick?: (playerId: string) => void;
}

const AdminStatsTab: React.FC<AdminStatsTabProps> = ({
  colorStyle,
  onPlayerClick
}) => {
  const { stats, loading, error, loadStats, refresh } = useAdminStats();

  // Загружаем статистику при монтировании компонента
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = async () => {
    await refresh();
  };

  return (
    <div>
      {/* Заголовок с кнопкой обновления */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h2 style={{ 
          color: colorStyle, 
          margin: 0,
          fontSize: '1.8rem',
          textShadow: `0 0 10px ${colorStyle}40`
        }}>
          📊 Общая статистика системы
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: loading 
              ? 'rgba(255, 255, 255, 0.1)' 
              : `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`,
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            cursor: loading ? 'wait' : 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 0 15px ${colorStyle}40`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {loading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
              Загрузка...
            </>
          ) : (
            <>
              🔄 Обновить
            </>
          )}
        </button>
      </div>

      {/* Ошибка */}
      {error && !loading && (
        <div style={{
          background: 'rgba(255, 0, 0, 0.1)',
          border: '1px solid #ff4444',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>⚠️</div>
          <div style={{ color: '#ff6666', fontWeight: 'bold', marginBottom: '5px' }}>
            Ошибка загрузки статистики
          </div>
          <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
            {error}
          </div>
        </div>
      )}

      {/* Карточки статистики */}
      {(stats || loading) && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '25px',
          marginBottom: '30px'
        }}>
          
          {/* Статистика игроков */}
          <AdminStatsCard
            title="Игроки"
            icon="👥"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              { label: 'Всего игроков', value: stats.players.total_players },
              { label: 'Верифицированных', value: stats.players.verified_players, color: '#4CAF50' },
              { label: 'Активны за 24ч', value: stats.players.active_24h, color: '#FF9800' },
              { label: 'Активны за 7 дней', value: stats.players.active_7d, color: '#2196F3' }
            ] : []}
          />

          {/* Статистика валют */}
          <AdminStatsCard
            title="Валюты в системе"
            icon="💰"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              { label: 'Всего CCC', value: (stats.currencies.total_ccc || 0).toFixed(2) },
              { label: 'Всего CS', value: (stats.currencies.total_cs || 0).toFixed(2), color: '#FFD700' },
              { label: 'Всего TON', value: (stats.currencies.total_ton || 0).toFixed(4), color: '#0088cc' },
              { label: 'Всего Stars', value: stats.currencies.total_stars || 0, color: '#FFA500' }
            ] : []}
          />

          {/* Статистика обменов Stars */}
          <AdminStatsCard
            title="Обмены Stars"
            icon="🌟"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              { label: 'Всего обменов', value: stats.stars_exchange.total_exchanges || 0 },
              { label: 'Stars обменено', value: stats.stars_exchange.total_stars_exchanged || 0, color: '#FFA500' },
              { label: 'CS получено', value: (stats.stars_exchange.total_cs_received || 0).toFixed(2), color: '#FFD700' },
              { label: 'Обменов за 24ч', value: stats.stars_exchange.exchanges_24h || 0, color: '#FF9800' }
            ] : []}
          />

          {/* Текущие курсы */}
          <AdminStatsCard
            title="Текущие курсы"
            icon="📈"
            colorStyle={colorStyle}
            loading={loading}
            data={stats ? [
              ...(stats.current_rates?.TON_USD ? [{
                label: 'TON/USD',
                value: `$${stats.current_rates.TON_USD.rate}`,
                color: '#0088cc'
              }] : [{ label: 'TON/USD', value: 'Не загружен', color: '#666' }]),
              ...(stats.current_rates?.STARS_CS ? [{
                label: '1 Star',
                value: `${stats.current_rates.STARS_CS.rate} CS`,
                color: '#FFA500'
              }] : [{ label: 'Stars/CS', value: 'Не загружен', color: '#666' }])
            ] : []}
          />
        </div>
      )}

      {/* ТОП игроков */}
      {(stats?.top_players || loading) && (
        <AdminTopPlayersTable
          players={stats?.top_players || []}
          colorStyle={colorStyle}
          onPlayerClick={onPlayerClick}
          loading={loading}
        />
      )}

      {/* Пустое состояние */}
      {!stats && !loading && !error && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          border: `1px solid ${colorStyle}20`
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.7 }}>📊</div>
          <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Нажмите "Обновить" для загрузки статистики</div>
          <div style={{ fontSize: '0.9rem', color: '#aaa' }}>Получите полную информацию о состоянии системы</div>
        </div>
      )}
    </div>
  );
};

export default AdminStatsTab;