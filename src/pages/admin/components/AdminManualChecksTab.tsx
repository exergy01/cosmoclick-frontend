// pages/admin/components/AdminManualChecksTab.tsx - Модуль проверки ручных заданий
import React, { useState, useEffect } from 'react';
import { adminApiService } from '../services/adminApi';

interface AdminManualChecksTabProps {
  colorStyle: string;
}

interface ManualSubmission {
  id: number;
  telegram_id: string;
  quest_key: string;
  broker_name?: string;
  submission_data: {
    account_number: string;
    notes?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  quest_name?: string;
  reward_cs?: number;
}

interface GroupedSubmissions {
  quest_key: string;
  quest_name: string;
  broker_name?: string;
  quest_type?: string;
  reward_cs?: number;
  submissions: ManualSubmission[];
}

interface SubmissionsResponse {
  success: boolean;
  submissions: ManualSubmission[];
  grouped_by_quest: GroupedSubmissions[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

const AdminManualChecksTab: React.FC<AdminManualChecksTabProps> = ({ colorStyle }) => {
  const [submissions, setSubmissions] = useState<GroupedSubmissions[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<{[key: number]: boolean}>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Загрузка заявок
  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const response: SubmissionsResponse = await adminApiService.getManualChecks(filter);
      setSubmissions(response.grouped_by_quest || []);
      setStats(response.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      if (process.env.NODE_ENV === 'development') console.log('✅ Загружено заявок:', response.stats);
    } catch (error: any) {
      console.error('❌ Ошибка загрузки заявок:', error);
      showMessage('Не удалось загрузить заявки: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Показать сообщение
  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Загрузка при монтировании и смене фильтра
  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  // Одобрить/Отклонить заявку
  const handleReview = async (submissionId: number, action: 'approve' | 'reject', notes?: string) => {
    setActionLoading(prev => ({ ...prev, [submissionId]: true }));

    try {
      await adminApiService.reviewManualCheck(submissionId, action, notes);
      showMessage(
        `Заявка ${action === 'approve' ? 'одобрена' : 'отклонена'} успешно!`,
        'success'
      );
      await loadSubmissions(); // Перезагрузка списка
    } catch (error: any) {
      console.error('❌ Ошибка проверки заявки:', error);
      showMessage('Ошибка: ' + error.message, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Заголовок */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '15px',
        border: `1px solid ${colorStyle}40`
      }}>
        <h2 style={{
          fontSize: '2rem',
          color: colorStyle,
          margin: '0 0 10px 0',
          textShadow: `0 0 10px ${colorStyle}80`
        }}>
          📋 Ручная проверка заданий
        </h2>
        <p style={{ color: '#aaa', margin: 0, fontSize: '0.95rem' }}>
          Заявки игроков на проверку выполнения заданий
        </p>
      </div>

      {/* Сообщения */}
      {message && (
        <div style={{
          padding: '15px 20px',
          background: message.type === 'success' ? 'rgba(0, 255, 0, 0.1)'
                    : message.type === 'error' ? 'rgba(255, 0, 0, 0.1)'
                    : 'rgba(100, 200, 255, 0.1)',
          border: `2px solid ${
            message.type === 'success' ? '#0f0'
            : message.type === 'error' ? '#f00'
            : '#6cf'
          }`,
          borderRadius: '10px',
          marginBottom: '20px',
          color: '#fff',
          fontSize: '1rem'
        }}>
          {message.text}
        </div>
      )}

      {/* Статистика */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        {[
          { label: 'Всего заявок', value: stats.total, color: '#6cf' },
          { label: 'На проверке', value: stats.pending, color: '#fc0' },
          { label: 'Одобрено', value: stats.approved, color: '#0f0' },
          { label: 'Отклонено', value: stats.rejected, color: '#f66' }
        ].map((stat, idx) => (
          <div key={idx} style={{
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: `2px solid ${stat.color}40`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', color: stat.color, fontWeight: 'bold', marginBottom: '5px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Фильтры */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '25px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'all' as const, label: 'Все', icon: '📋' },
          { key: 'pending' as const, label: 'На проверке', icon: '⏳' },
          { key: 'approved' as const, label: 'Одобренные', icon: '✅' },
          { key: 'rejected' as const, label: 'Отклоненные', icon: '❌' }
        ].map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            style={{
              padding: '10px 20px',
              background: filter === btn.key
                ? `linear-gradient(135deg, ${colorStyle}, ${colorStyle}88)`
                : 'rgba(255, 255, 255, 0.1)',
              border: `2px solid ${filter === btn.key ? colorStyle : 'transparent'}`,
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease'
            }}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {/* Список заявок сгруппированных по брокерам */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '1.2rem' }}>
          <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
          <div style={{ marginTop: '10px' }}>Загрузка заявок...</div>
        </div>
      ) : submissions.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          color: '#aaa',
          fontSize: '1.1rem'
        }}>
          📭 Нет заявок для отображения
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {/* Группируем по broker_name */}
          {Object.entries(
            submissions.reduce((acc, group) => {
              const brokerKey = group.broker_name || 'Unknown';
              if (!acc[brokerKey]) {
                acc[brokerKey] = [];
              }
              acc[brokerKey].push(group);
              return acc;
            }, {} as Record<string, GroupedSubmissions[]>)
          ).map(([brokerName, brokerGroups]) => (
            <div key={brokerName} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '20px',
              border: `2px solid ${colorStyle}60`,
              overflow: 'hidden',
              padding: '20px'
            }}>
              {/* Заголовок брокера */}
              <h2 style={{
                margin: '0 0 20px 0',
                color: colorStyle,
                fontSize: '1.8rem',
                textShadow: `0 0 15px ${colorStyle}80`,
                textAlign: 'center',
                paddingBottom: '15px',
                borderBottom: `2px solid ${colorStyle}40`
              }}>
                🏦 {brokerName}
              </h2>

              {/* Квесты этого брокера */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {brokerGroups.map(group => (
            <div key={group.quest_key} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '15px',
              border: `1px solid ${colorStyle}40`,
              overflow: 'hidden'
            }}>
              {/* Заголовок задания */}
              <div style={{
                padding: '20px',
                background: `linear-gradient(135deg, ${colorStyle}20, transparent)`,
                borderBottom: `1px solid ${colorStyle}40`
              }}>
                <h3 style={{
                  margin: '0 0 5px 0',
                  color: colorStyle,
                  fontSize: '1.3rem',
                  textShadow: `0 0 10px ${colorStyle}60`
                }}>
                  🏦 {group.broker_name || group.quest_name || group.quest_key}
                </h3>
                <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
                  {group.reward_cs && `💰 Награда: ${group.reward_cs} CS • `}
                  Заявок: {group.submissions.length}
                </div>
              </div>

              {/* Список заявок */}
              <div style={{ padding: '15px' }}>
                {group.submissions.map(submission => (
                  <div key={submission.id} style={{
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    border: `1px solid ${
                      submission.status === 'pending' ? '#fc0'
                      : submission.status === 'approved' ? '#0f0'
                      : '#f66'
                    }40`,
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      {/* Инфо игрока */}
                      <div>
                        <div style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '5px' }}>
                          👤 {submission.first_name || 'Unknown'} {submission.last_name || ''}
                          {submission.username && (
                            <span style={{ color: '#6cf', marginLeft: '8px' }}>
                              @{submission.username}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                          ID: {submission.telegram_id} • {formatDate(submission.created_at)}
                        </div>
                      </div>

                      {/* Статус */}
                      <div style={{
                        padding: '6px 12px',
                        background: submission.status === 'pending' ? 'rgba(255, 200, 0, 0.2)'
                                  : submission.status === 'approved' ? 'rgba(0, 255, 0, 0.2)'
                                  : 'rgba(255, 100, 100, 0.2)',
                        border: `1px solid ${
                          submission.status === 'pending' ? '#fc0'
                          : submission.status === 'approved' ? '#0f0'
                          : '#f66'
                        }`,
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        color: submission.status === 'pending' ? '#fc0'
                              : submission.status === 'approved' ? '#0f0'
                              : '#f66'
                      }}>
                        {submission.status === 'pending' ? '⏳ На проверке'
                        : submission.status === 'approved' ? '✅ Одобрено'
                        : '❌ Отклонено'}
                      </div>
                    </div>

                    {/* Данные заявки */}
                    <div style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ color: '#fff', marginBottom: '6px' }}>
                        🔢 <strong>Номер счёта:</strong> {submission.submission_data.account_number}
                      </div>
                      {submission.submission_data.notes && (
                        <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
                          📝 <strong>Примечание:</strong> {submission.submission_data.notes}
                        </div>
                      )}
                    </div>

                    {/* Кнопки действий (только для pending) */}
                    {submission.status === 'pending' && (
                      <div style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => handleReview(submission.id, 'approve')}
                          disabled={actionLoading[submission.id]}
                          style={{
                            flex: 1,
                            minWidth: '150px',
                            padding: '12px 20px',
                            background: actionLoading[submission.id]
                              ? 'rgba(100, 100, 100, 0.3)'
                              : 'linear-gradient(135deg, #0f0, #0c0)',
                            border: '2px solid #0f0',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: actionLoading[submission.id] ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            opacity: actionLoading[submission.id] ? 0.6 : 1
                          }}
                        >
                          {actionLoading[submission.id] ? '⏳ Обработка...' : '✅ Одобрить'}
                        </button>

                        <button
                          onClick={() => {
                            const notes = prompt('Причина отклонения (необязательно):');
                            if (notes !== null) { // null если Cancel
                              handleReview(submission.id, 'reject', notes || undefined);
                            }
                          }}
                          disabled={actionLoading[submission.id]}
                          style={{
                            flex: 1,
                            minWidth: '150px',
                            padding: '12px 20px',
                            background: actionLoading[submission.id]
                              ? 'rgba(100, 100, 100, 0.3)'
                              : 'linear-gradient(135deg, #f66, #c33)',
                            border: '2px solid #f66',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: actionLoading[submission.id] ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            opacity: actionLoading[submission.id] ? 0.6 : 1
                          }}
                        >
                          {actionLoading[submission.id] ? '⏳ Обработка...' : '❌ Отклонить'}
                        </button>
                      </div>
                    )}

                    {/* Результат проверки */}
                    {submission.status !== 'pending' && (
                      <div style={{
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        color: '#aaa'
                      }}>
                        <div>
                          {submission.status === 'approved' ? '✅' : '❌'} Проверено{' '}
                          {submission.reviewed_at && formatDate(submission.reviewed_at)}
                        </div>
                        {submission.review_notes && (
                          <div style={{ marginTop: '5px', color: '#fff' }}>
                            💬 {submission.review_notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminManualChecksTab;
