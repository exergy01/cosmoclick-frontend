// pages/admin/components/AdminFinanceTab.tsx
import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

interface AdminFinanceTabProps {
  colorStyle: string;
}

interface TONDeposit {
  id: number;
  player_id: string;
  amount: number;
  transaction_hash: string;
  status: string;
  created_at: string;
}

interface TONStats {
  total_deposits: number;
  unidentified_deposits: number;
  total_amount: number;
  pending_amount: number;
}

const AdminFinanceTab: React.FC<AdminFinanceTabProps> = ({ colorStyle }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'deposits' | 'rates'>('overview');
  const [tonDeposits, setTonDeposits] = useState<TONDeposit[]>([]);
  const [tonStats, setTonStats] = useState<TONStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadTONData();
  }, []);

  const loadTONData = async () => {
    setLoading(true);
    try {
      // Загружаем неопознанные депозиты и статистику
      const [depositsRes, statsRes] = await Promise.all([
        adminApi.getTONDeposits('unidentified'),
        adminApi.getTONStats()
      ]);

      setTonDeposits(depositsRes.data.deposits || []);
      setTonStats(statsRes.data || null);
    } catch (error) {
      console.error('Error loading TON data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDeposit = async (depositId: number, playerId: string) => {
    if (!playerId.trim()) return;

    setProcessingId(depositId);
    try {
      await adminApi.processTONDeposit(depositId, playerId);
      await loadTONData(); // Обновляем данные
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
      minHeight: '300px'
    }}>
      <h3 style={{
        color: colorStyle,
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '1.1rem'
      }}>
        💰 TON Финансовое управление
      </h3>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'overview', label: '📊 Обзор', icon: '📊' },
          { key: 'deposits', label: '💎 Депозиты', icon: '💎' },
          { key: 'rates', label: '💱 Курсы', icon: '💱' }
        ].map(section => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key as any)}
            style={{
              background: activeSection === section.key
                ? `${colorStyle}20`
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${activeSection === section.key ? colorStyle : '#444'}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: activeSection === section.key ? colorStyle : '#aaa',
              cursor: 'pointer',
              fontSize: '0.85rem',
              transition: 'all 0.3s ease'
            }}
          >
            {section.icon} {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === 'overview' && (
        <div>
          <h4 style={{ color: colorStyle, marginBottom: '15px' }}>📊 Статистика TON</h4>
          {tonStats ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <div style={{
                background: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid #00ff0040',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', color: '#00ff00', marginBottom: '5px' }}>
                  {tonStats.total_deposits}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  Всего депозитов
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid #FFD70040',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', color: '#FFD700', marginBottom: '5px' }}>
                  {tonStats.total_amount.toFixed(2)} TON
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  Общая сумма
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 165, 0, 0.1)',
                border: '1px solid #FFA50040',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', color: '#FFA500', marginBottom: '5px' }}>
                  {tonStats.unidentified_deposits}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  Неопознанных
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>
              Загрузка статистики...
            </div>
          )}
        </div>
      )}

      {activeSection === 'deposits' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h4 style={{ color: colorStyle, margin: 0 }}>💎 Неопознанные депозиты</h4>
            <button
              onClick={loadTONData}
              disabled={loading}
              style={{
                background: `${colorStyle}20`,
                border: `1px solid ${colorStyle}`,
                borderRadius: '6px',
                padding: '6px 12px',
                color: colorStyle,
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {loading ? '🔄' : '🔄'} Обновить
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {tonDeposits.length > 0 ? (
              tonDeposits.map(deposit => (
                <DepositItem
                  key={deposit.id}
                  deposit={deposit}
                  colorStyle={colorStyle}
                  onProcess={processDeposit}
                  isProcessing={processingId === deposit.id}
                />
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#aaa',
                padding: '40px 20px',
                border: '1px dashed #444',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
                <div>Нет неопознанных депозитов</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'rates' && (
        <div style={{
          textAlign: 'center',
          color: '#aaa',
          padding: '40px 20px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '15px' }}>💱</div>
          <div style={{ fontSize: '1rem', marginBottom: '10px' }}>
            Управление курсами валют
          </div>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
            Автоматическое обновление курсов TON работает.<br/>
            Ручное управление будет добавлено позже.
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент отдельного депозита
const DepositItem: React.FC<{
  deposit: TONDeposit;
  colorStyle: string;
  onProcess: (id: number, playerId: string) => void;
  isProcessing: boolean;
}> = ({ deposit, colorStyle, onProcess, isProcessing }) => {
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
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '15px',
        alignItems: 'center'
      }}>
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: '#FFA500', fontWeight: 'bold' }}>
              💎 {deposit.amount} TON
            </span>
            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
              {new Date(deposit.created_at).toLocaleString('ru-RU')}
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '8px' }}>
            Hash: {deposit.transaction_hash.substring(0, 20)}...
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
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
                background: playerId.trim() ? `${colorStyle}` : '#666',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                color: '#fff',
                cursor: playerId.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                fontSize: '0.8rem',
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              {isProcessing ? '⏳' : '✅'} Обработать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinanceTab;