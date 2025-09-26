// pages/admin/components/AdminFinanceTab_v2.tsx - Расширенное финансовое управление
import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface AdminFinanceTabProps {
  colorStyle: string;
}

interface PendingWithdrawal {
  id: number;
  telegram_id: string;
  amount: number;
  recipient_address: string;
  status: string;
  created_at: string;
  username: string;
  first_name: string;
  current_balance: number;
  withdrawals_24h: number;
  total_deposits: number;
}

interface OrphanedDeposit {
  id: number;
  amount: number;
  transaction_hash: string;
  created_at: string;
  from_address: string;
  potential_players: string[];
  similar_deposits: number;
}

interface CriticalAlert {
  type: string;
  priority: 'critical' | 'high' | 'medium';
  message: string;
  id?: number;
  amount?: number;
  created_at?: string;
}

const AdminFinanceTab: React.FC<AdminFinanceTabProps> = ({ colorStyle }) => {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'withdrawals' | 'deposits' | 'investigation' | 'analytics' | 'alerts'>('dashboard');

  // State для разных секций
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [orphanedDeposits, setOrphanedDeposits] = useState<OrphanedDeposit[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [tonStats, setTonStats] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [investigationResults, setInvestigationResults] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes, withdrawalsRes, depositsRes] = await Promise.all([
        adminApi.getCriticalAlerts(),
        adminApi.getTONStats(),
        adminApi.getPendingWithdrawals(),
        adminApi.getOrphanedDeposits(0, 24)
      ]);

      setCriticalAlerts(alertsRes.data.alerts || []);
      setTonStats(statsRes.data || null);
      setPendingWithdrawals(withdrawalsRes.data.withdrawals || []);
      setOrphanedDeposits(depositsRes.data.orphaned_deposits || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const dailyRes = await adminApi.getDailyFinanceStats(30);
      setDailyStats(dailyRes.data.daily_stats || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const approveWithdrawal = async (withdrawalId: number, action: 'approve' | 'reject', reason?: string) => {
    setProcessingId(withdrawalId);
    try {
      await adminApi.approveWithdrawal(withdrawalId, action, reason);
      await loadDashboardData(); // Перезагружаем данные
    } catch (error) {
      console.error('Error processing withdrawal:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const investigateDeposit = async (depositId: number) => {
    setProcessingId(depositId);
    try {
      const result = await adminApi.investigateDeposit(depositId);
      setInvestigationResults(result.data.investigation);
    } catch (error) {
      console.error('Error investigating deposit:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const processOrphanedDeposit = async (depositId: number, playerId: string) => {
    if (!playerId.trim()) return;

    setProcessingId(depositId);
    try {
      await adminApi.processTONDeposit(depositId, playerId);
      await loadDashboardData();
    } catch (error) {
      console.error('Error processing deposit:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: `1px solid ${colorStyle}40`,
      borderRadius: '12px',
      padding: '20px',
      minHeight: '400px'
    }}>
      <h3 style={{
        color: colorStyle,
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '1.2rem'
      }}>
        🏦 Финансовое управление Pro
      </h3>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'dashboard', label: '📊 Дашборд', icon: '📊' },
          { key: 'withdrawals', label: '💸 Выводы', icon: '💸', badge: pendingWithdrawals.length },
          { key: 'deposits', label: '🔍 Депозиты', icon: '🔍', badge: orphanedDeposits.length },
          { key: 'investigation', label: '🕵️ Расследования', icon: '🕵️' },
          { key: 'analytics', label: '📈 Аналитика', icon: '📈' },
          { key: 'alerts', label: '🚨 Алерты', icon: '🚨', badge: criticalAlerts.length }
        ].map(section => (
          <button
            key={section.key}
            onClick={() => {
              setActiveSection(section.key as any);
              if (section.key === 'analytics') loadAnalytics();
            }}
            style={{
              background: activeSection === section.key
                ? `${colorStyle}20`
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${activeSection === section.key ? colorStyle : '#444'}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: activeSection === section.key ? colorStyle : '#aaa',
              cursor: 'pointer',
              fontSize: '0.8rem',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            {section.icon} {section.label}
            {section.badge && section.badge > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#ff4444',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '0.7rem',
                minWidth: '18px',
                textAlign: 'center'
              }}>
                {section.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
          🔄 Загрузка данных...
        </div>
      )}

      {/* Dashboard */}
      {activeSection === 'dashboard' && !loading && (
        <DashboardSection
          colorStyle={colorStyle}
          tonStats={tonStats}
          criticalAlerts={criticalAlerts}
          pendingWithdrawals={pendingWithdrawals}
          orphanedDeposits={orphanedDeposits}
        />
      )}

      {/* Withdrawals */}
      {activeSection === 'withdrawals' && !loading && (
        <WithdrawalsSection
          colorStyle={colorStyle}
          withdrawals={pendingWithdrawals}
          onApprove={approveWithdrawal}
          processingId={processingId}
        />
      )}

      {/* Deposits */}
      {activeSection === 'deposits' && !loading && (
        <DepositsSection
          colorStyle={colorStyle}
          deposits={orphanedDeposits}
          onInvestigate={investigateDeposit}
          onProcess={processOrphanedDeposit}
          processingId={processingId}
          investigationResults={investigationResults}
        />
      )}

      {/* Investigation */}
      {activeSection === 'investigation' && !loading && (
        <InvestigationSection colorStyle={colorStyle} />
      )}

      {/* Analytics */}
      {activeSection === 'analytics' && !loading && (
        <AnalyticsSection
          colorStyle={colorStyle}
          dailyStats={dailyStats}
        />
      )}

      {/* Alerts */}
      {activeSection === 'alerts' && !loading && (
        <AlertsSection
          colorStyle={colorStyle}
          alerts={criticalAlerts}
          onRefresh={loadDashboardData}
        />
      )}
    </div>
  );
};

// Компонент дашборда
const DashboardSection: React.FC<{
  colorStyle: string;
  tonStats: any;
  criticalAlerts: CriticalAlert[];
  pendingWithdrawals: PendingWithdrawal[];
  orphanedDeposits: OrphanedDeposit[];
}> = ({ colorStyle, tonStats, criticalAlerts, pendingWithdrawals, orphanedDeposits }) => (
  <div>
    <h4 style={{ color: colorStyle, marginBottom: '15px' }}>📊 Общий обзор</h4>

    {/* Критические показатели */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    }}>
      <div style={{
        background: criticalAlerts.filter(a => a.priority === 'critical').length > 0 ? 'rgba(255, 0, 0, 0.15)' : 'rgba(0, 255, 0, 0.1)',
        border: `1px solid ${criticalAlerts.filter(a => a.priority === 'critical').length > 0 ? '#ff0000' : '#00ff00'}40`,
        borderRadius: '8px',
        padding: '15px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>
          {criticalAlerts.filter(a => a.priority === 'critical').length > 0 ? '🚨' : '✅'}
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>
          {criticalAlerts.filter(a => a.priority === 'critical').length}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
          Критические алерты
        </div>
      </div>

      <div style={{
        background: pendingWithdrawals.length > 0 ? 'rgba(255, 165, 0, 0.15)' : 'rgba(0, 255, 0, 0.1)',
        border: `1px solid ${pendingWithdrawals.length > 0 ? '#FFA500' : '#00ff00'}40`,
        borderRadius: '8px',
        padding: '15px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>💸</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>
          {pendingWithdrawals.length}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
          Ожидают подтверждения
        </div>
      </div>

      <div style={{
        background: orphanedDeposits.length > 0 ? 'rgba(255, 0, 0, 0.15)' : 'rgba(0, 255, 0, 0.1)',
        border: `1px solid ${orphanedDeposits.length > 0 ? '#ff0000' : '#00ff00'}40`,
        borderRadius: '8px',
        padding: '15px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>🔍</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>
          {orphanedDeposits.length}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
          Потерянные депозиты
        </div>
      </div>

      {tonStats && (
        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid #FFD70040',
          borderRadius: '8px',
          padding: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '5px' }}>💰</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>
            {tonStats.total_amount?.toFixed(2)} TON
          </div>
          <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
            Общий оборот
          </div>
        </div>
      )}
    </div>

    {/* Последние алерты */}
    {criticalAlerts.length > 0 && (
      <div style={{
        background: 'rgba(255, 0, 0, 0.1)',
        border: '1px solid #ff000040',
        borderRadius: '8px',
        padding: '15px',
        marginTop: '20px'
      }}>
        <h5 style={{ color: '#ff4444', margin: '0 0 10px 0' }}>🚨 Требуют внимания:</h5>
        {criticalAlerts.slice(0, 3).map((alert, index) => (
          <div key={index} style={{
            fontSize: '0.9rem',
            color: '#ddd',
            marginBottom: '5px',
            padding: '5px 0',
            borderBottom: index < 2 ? '1px solid #333' : 'none'
          }}>
            {alert.message}
          </div>
        ))}
      </div>
    )}
  </div>
);

// Компонент секции выводов
const WithdrawalsSection: React.FC<{
  colorStyle: string;
  withdrawals: PendingWithdrawal[];
  onApprove: (id: number, action: 'approve' | 'reject', reason?: string) => void;
  processingId: number | null;
}> = ({ colorStyle, withdrawals, onApprove, processingId }) => {
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<PendingWithdrawal | null>(null);
  const [reason, setReason] = useState('');

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h4 style={{ color: colorStyle, margin: 0 }}>💸 Подтверждение выводов ({withdrawals.length})</h4>
      </div>

      {withdrawals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#aaa',
          padding: '40px 20px',
          border: '1px dashed #444',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
          <div>Нет ожидающих подтверждения выводов</div>
        </div>
      ) : (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {withdrawals.map(withdrawal => (
            <WithdrawalItem
              key={withdrawal.id}
              withdrawal={withdrawal}
              colorStyle={colorStyle}
              onApprove={(action, reason) => onApprove(withdrawal.id, action, reason)}
              isProcessing={processingId === withdrawal.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент отдельного вывода
const WithdrawalItem: React.FC<{
  withdrawal: PendingWithdrawal;
  colorStyle: string;
  onApprove: (action: 'approve' | 'reject', reason?: string) => void;
  isProcessing: boolean;
}> = ({ withdrawal, colorStyle, onApprove, isProcessing }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  const riskLevel = withdrawal.amount > 100 ? 'high' : withdrawal.amount > 50 ? 'medium' : 'low';
  const riskColor = riskLevel === 'high' ? '#ff4444' : riskLevel === 'medium' ? '#ffaa00' : '#44ff44';

  return (
    <div style={{
      background: `rgba(${riskLevel === 'high' ? '255, 68, 68' : riskLevel === 'medium' ? '255, 170, 0' : '68, 255, 68'}, 0.1)`,
      border: `1px solid ${riskColor}40`,
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '15px',
        alignItems: 'start'
      }}>
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ color: riskColor, fontWeight: 'bold', fontSize: '1.1rem' }}>
              💸 {withdrawal.amount} TON
            </span>
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
              {new Date(withdrawal.created_at).toLocaleString('ru-RU')}
            </span>
          </div>

          <div style={{ fontSize: '0.9rem', color: '#ddd', marginBottom: '8px' }}>
            👤 {withdrawal.first_name} (@{withdrawal.username}) | ID: {withdrawal.telegram_id}
          </div>

          <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '8px' }}>
            📍 {withdrawal.recipient_address.substring(0, 30)}...
          </div>

          <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>
            💰 Баланс: {withdrawal.current_balance} TON |
            📊 Выводов за 24ч: {withdrawal.withdrawals_24h} |
            💎 Всего депозитов: {withdrawal.total_deposits}
          </div>

          {showReason && (
            <div style={{ marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Причина (опционально)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  padding: '6px 10px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  width: '100%',
                  marginBottom: '10px'
                }}
              />
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <button
              onClick={() => onApprove('approve', reason)}
              disabled={isProcessing}
              style={{
                background: '#44ff44',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                color: '#000',
                cursor: isProcessing ? 'wait' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}
            >
              {isProcessing ? '⏳' : '✅'} Подтвердить
            </button>

            <button
              onClick={() => {
                if (!showReason) {
                  setShowReason(true);
                } else {
                  onApprove('reject', reason);
                }
              }}
              disabled={isProcessing}
              style={{
                background: '#ff4444',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                color: '#fff',
                cursor: isProcessing ? 'wait' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}
            >
              {isProcessing ? '⏳' : '❌'} Отклонить
            </button>

            <span style={{
              fontSize: '0.8rem',
              color: riskColor,
              fontWeight: 'bold',
              padding: '4px 8px',
              background: `${riskColor}20`,
              borderRadius: '4px'
            }}>
              {riskLevel === 'high' ? '🔴 Высокий риск' : riskLevel === 'medium' ? '🟡 Средний риск' : '🟢 Низкий риск'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент секции депозитов
const DepositsSection: React.FC<{
  colorStyle: string;
  deposits: OrphanedDeposit[];
  onInvestigate: (id: number) => void;
  onProcess: (id: number, playerId: string) => void;
  processingId: number | null;
  investigationResults: any;
}> = ({ colorStyle, deposits, onInvestigate, onProcess, processingId, investigationResults }) => {
  return (
    <div>
      <h4 style={{ color: colorStyle, marginBottom: '15px' }}>🔍 Потерянные депозиты ({deposits.length})</h4>

      {deposits.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#aaa',
          padding: '40px 20px',
          border: '1px dashed #444',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
          <div>Нет потерянных депозитов</div>
        </div>
      ) : (
        <div>
          {deposits.map(deposit => (
            <OrphanedDepositItem
              key={deposit.id}
              deposit={deposit}
              colorStyle={colorStyle}
              onInvestigate={() => onInvestigate(deposit.id)}
              onProcess={onProcess}
              isProcessing={processingId === deposit.id}
            />
          ))}
        </div>
      )}

      {investigationResults && (
        <InvestigationResults
          results={investigationResults}
          colorStyle={colorStyle}
          onProcess={onProcess}
        />
      )}
    </div>
  );
};

// Компонент отдельного потерянного депозита
const OrphanedDepositItem: React.FC<{
  deposit: OrphanedDeposit;
  colorStyle: string;
  onInvestigate: () => void;
  onProcess: (id: number, playerId: string) => void;
  isProcessing: boolean;
}> = ({ deposit, colorStyle, onInvestigate, onProcess, isProcessing }) => {
  const [playerId, setPlayerId] = useState('');

  return (
    <div style={{
      background: 'rgba(255, 165, 0, 0.1)',
      border: '1px solid #FFA50040',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <span style={{ color: '#FFA500', fontWeight: 'bold', fontSize: '1.1rem' }}>
          💎 {deposit.amount} TON
        </span>
        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
          {new Date(deposit.created_at).toLocaleString('ru-RU')}
        </span>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>
        📍 От: {deposit.from_address.substring(0, 30)}...
      </div>

      <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>
        🔗 Hash: {deposit.transaction_hash.substring(0, 20)}...
      </div>

      {deposit.potential_players && deposit.potential_players.length > 0 && (
        <div style={{ fontSize: '0.8rem', color: '#44ff44', marginBottom: '10px' }}>
          💡 Возможные владельцы: {deposit.potential_players.join(', ')}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Telegram ID игрока"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '6px 10px',
            color: '#fff',
            fontSize: '0.8rem',
            width: '150px'
          }}
        />

        <button
          onClick={() => onProcess(deposit.id, playerId)}
          disabled={!playerId.trim() || isProcessing}
          style={{
            background: playerId.trim() ? colorStyle : '#666',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            color: '#fff',
            cursor: playerId.trim() && !isProcessing ? 'pointer' : 'not-allowed',
            fontSize: '0.8rem'
          }}
        >
          {isProcessing ? '⏳' : '✅'} Обработать
        </button>

        <button
          onClick={onInvestigate}
          disabled={isProcessing}
          style={{
            background: 'rgba(100, 149, 237, 0.8)',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            color: '#fff',
            cursor: isProcessing ? 'wait' : 'pointer',
            fontSize: '0.8rem'
          }}
        >
          🕵️ Расследовать
        </button>
      </div>
    </div>
  );
};

// Компонент результатов расследования
const InvestigationResults: React.FC<{
  results: any;
  colorStyle: string;
  onProcess: (id: number, playerId: string) => void;
}> = ({ results, colorStyle, onProcess }) => {
  return (
    <div style={{
      background: 'rgba(100, 149, 237, 0.1)',
      border: '1px solid #6495ED40',
      borderRadius: '8px',
      padding: '15px',
      marginTop: '20px'
    }}>
      <h5 style={{ color: '#6495ED', margin: '0 0 15px 0' }}>🕵️ Результаты расследования</h5>

      {results.suggestions && results.suggestions.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h6 style={{ color: '#44ff44', margin: '0 0 10px 0' }}>💡 Рекомендации:</h6>
          {results.suggestions.map((suggestion: any, index: number) => (
            <div key={index} style={{
              padding: '8px',
              background: 'rgba(68, 255, 68, 0.1)',
              borderRadius: '4px',
              marginBottom: '5px',
              fontSize: '0.9rem'
            }}>
              <strong>Игрок {suggestion.player_id}</strong>
              ({Math.round(suggestion.confidence * 100)}% уверенность)
              <br />
              <span style={{ color: '#aaa' }}>{suggestion.reason}</span>
              <button
                onClick={() => onProcess(results.deposit.id, suggestion.player_id)}
                style={{
                  background: '#44ff44',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: '#000',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  marginLeft: '10px'
                }}
              >
                ✅ Привязать
              </button>
            </div>
          ))}
        </div>
      )}

      {results.wallet_matches && results.wallet_matches.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <h6 style={{ color: '#FFD700', margin: '0 0 5px 0' }}>🎯 Совпадения кошельков:</h6>
          {results.wallet_matches.map((match: any, index: number) => (
            <div key={index} style={{ fontSize: '0.8rem', color: '#ddd' }}>
              {match.telegram_id} - {match.first_name} (@{match.username})
            </div>
          ))}
        </div>
      )}

      {results.time_correlations && results.time_correlations.length > 0 && (
        <div>
          <h6 style={{ color: '#FFA500', margin: '0 0 5px 0' }}>⏰ Временные корреляции:</h6>
          {results.time_correlations.slice(0, 3).map((correlation: any, index: number) => (
            <div key={index} style={{ fontSize: '0.8rem', color: '#ddd' }}>
              {correlation.telegram_id} - регистрация в {new Date(correlation.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Заглушки для остальных секций
const InvestigationSection: React.FC<{ colorStyle: string }> = ({ colorStyle }) => (
  <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
    <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🕵️</div>
    <div>Инструменты расследования</div>
    <div style={{ fontSize: '0.9rem', marginTop: '10px' }}>
      Универсальный поиск, анализ игроков, поиск связей между аккаунтами
    </div>
  </div>
);

const AnalyticsSection: React.FC<{ colorStyle: string; dailyStats: any[] }> = ({ colorStyle, dailyStats }) => {
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [suspiciousPatterns, setSuspiciousPatterns] = useState<any[]>([]);

  useEffect(() => {
    loadExtendedAnalytics();
  }, []);

  const loadExtendedAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [playersRes, patternsRes] = await Promise.all([
        adminApi.getTopPlayers(10),
        adminApi.getSuspiciousPatterns()
      ]);
      setTopPlayers(playersRes.data.top_players || []);
      setSuspiciousPatterns(patternsRes.data.patterns || []);
    } catch (error) {
      console.error('Extended analytics error:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const response = await adminApi.getDailyFinanceStats(30);
      // For now, convert to CSV manually since backend returns JSON
      const csvData = convertToCSV(response.data.daily_stats || []);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  const calculateTrends = () => {
    if (dailyStats.length < 2) return null;

    const recent = dailyStats.slice(0, 7);
    const previous = dailyStats.slice(7, 14);

    const recentAvg = recent.reduce((sum, day) => sum + day.net_flow, 0) / recent.length;
    const previousAvg = previous.reduce((sum, day) => sum + day.net_flow, 0) / previous.length;

    const trend = recentAvg - previousAvg;
    return { trend, recentAvg, previousAvg };
  };

  const trends = calculateTrends();

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h4 style={{ color: colorStyle, margin: 0 }}>📈 Расширенная аналитика</h4>
        <button
          onClick={exportAnalytics}
          style={{
            background: `${colorStyle}20`,
            border: `1px solid ${colorStyle}`,
            borderRadius: '6px',
            padding: '6px 12px',
            color: colorStyle,
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          📊 Экспорт CSV
        </button>
      </div>

      {/* Trends Summary */}
      {trends && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: trends.trend >= 0 ? 'rgba(68, 255, 68, 0.1)' : 'rgba(255, 68, 68, 0.1)',
            border: `1px solid ${trends.trend >= 0 ? '#44ff44' : '#ff4444'}40`,
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>
              {trends.trend >= 0 ? '📈' : '📉'}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '3px' }}>
              {trends.trend >= 0 ? '+' : ''}{trends.trend.toFixed(2)} TON
            </div>
            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
              Недельный тренд
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid #FFD70040',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>💰</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '3px' }}>
              {trends.recentAvg.toFixed(2)} TON
            </div>
            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
              Средний дневной поток
            </div>
          </div>

          <div style={{
            background: 'rgba(100, 149, 237, 0.1)',
            border: '1px solid #6495ED40',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>📊</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '3px' }}>
              {dailyStats.reduce((sum, day) => sum + day.transactions_count, 0)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
              Всего транзакций
            </div>
          </div>
        </div>
      )}

      {/* Daily Stats */}
      {dailyStats.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <h5 style={{ color: '#FFD700', margin: '0 0 10px 0' }}>📊 Динамика по дням:</h5>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {dailyStats.slice(0, 10).map((day, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 1fr 1fr 60px',
                  gap: '10px',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  fontSize: '0.8rem',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#aaa' }}>
                    {new Date(day.date).toLocaleDateString('ru-RU').slice(0, -5)}
                  </span>
                  <span style={{ color: '#44ff44', textAlign: 'center' }}>
                    +{day.deposits_ton}
                  </span>
                  <span style={{ color: '#ff4444', textAlign: 'center' }}>
                    -{day.withdrawals_ton}
                  </span>
                  <span style={{
                    color: day.net_flow >= 0 ? '#44ff44' : '#ff4444',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    {day.net_flow >= 0 ? '+' : ''}{day.net_flow}
                  </span>
                  <span style={{ color: '#aaa', textAlign: 'center' }}>
                    {day.transactions_count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Players */}
          <div>
            <h5 style={{ color: '#44ff44', margin: '0 0 10px 0' }}>🏆 Топ игроки:</h5>
            {analyticsLoading ? (
              <div style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>
                ⏳ Загрузка...
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {topPlayers.slice(0, 8).map((player, index) => (
                  <div key={index} style={{
                    padding: '8px',
                    background: 'rgba(68, 255, 68, 0.1)',
                    borderRadius: '4px',
                    marginBottom: '5px',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                      #{index + 1} {player.first_name}
                    </div>
                    <div style={{ color: '#aaa' }}>
                      💰 {player.total_balance} TON
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
          Загрузка аналитики...
        </div>
      )}

      {/* Suspicious Patterns */}
      {suspiciousPatterns.length > 0 && (
        <div style={{
          background: 'rgba(255, 165, 0, 0.1)',
          border: '1px solid #FFA50040',
          borderRadius: '8px',
          padding: '15px',
          marginTop: '20px'
        }}>
          <h5 style={{ color: '#FFA500', margin: '0 0 10px 0' }}>⚠️ Подозрительные паттерны:</h5>
          {suspiciousPatterns.slice(0, 5).map((pattern, index) => (
            <div key={index} style={{
              fontSize: '0.8rem',
              color: '#ddd',
              padding: '6px 8px',
              background: 'rgba(255, 165, 0, 0.1)',
              borderRadius: '4px',
              marginBottom: '5px'
            }}>
              🚨 {pattern.description} (Риск: {Math.round(pattern.risk_score * 100)}%)
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AlertsSection: React.FC<{
  colorStyle: string;
  alerts: CriticalAlert[];
  onRefresh: () => void;
}> = ({ colorStyle, alerts, onRefresh }) => (
  <div>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px'
    }}>
      <h4 style={{ color: colorStyle, margin: 0 }}>🚨 Критические уведомления ({alerts.length})</h4>
      <button
        onClick={onRefresh}
        style={{
          background: `${colorStyle}20`,
          border: `1px solid ${colorStyle}`,
          borderRadius: '6px',
          padding: '6px 12px',
          color: colorStyle,
          cursor: 'pointer',
          fontSize: '0.8rem'
        }}
      >
        🔄 Обновить
      </button>
    </div>

    {alerts.length === 0 ? (
      <div style={{
        textAlign: 'center',
        color: '#aaa',
        padding: '40px 20px',
        border: '1px dashed #444',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
        <div>Нет критических уведомлений</div>
      </div>
    ) : (
      <div>
        {alerts.map((alert, index) => (
          <div key={index} style={{
            background: alert.priority === 'critical' ? 'rgba(255, 0, 0, 0.15)' :
                       alert.priority === 'high' ? 'rgba(255, 165, 0, 0.15)' : 'rgba(255, 255, 0, 0.15)',
            border: `1px solid ${alert.priority === 'critical' ? '#ff0000' :
                                  alert.priority === 'high' ? '#FFA500' : '#FFFF00'}40`,
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '10px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  color: alert.priority === 'critical' ? '#ff4444' :
                         alert.priority === 'high' ? '#FFA500' : '#FFFF00',
                  fontWeight: 'bold',
                  marginBottom: '5px'
                }}>
                  {alert.priority === 'critical' ? '🚨 КРИТИЧНО' :
                   alert.priority === 'high' ? '⚠️ ВАЖНО' : '💡 ВНИМАНИЕ'}
                </div>
                <div style={{ color: '#ddd', fontSize: '0.9rem' }}>
                  {alert.message}
                </div>
              </div>
              {alert.created_at && (
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  {new Date(alert.created_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default AdminFinanceTab;