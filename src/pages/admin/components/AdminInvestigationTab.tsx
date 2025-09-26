// pages/admin/components/AdminInvestigationTab.tsx - Комплексное расследование
import React, { useState } from 'react';
import { adminApiService as adminApi } from '../services/adminApi';

interface AdminInvestigationTabProps {
  colorStyle: string;
}

interface SearchResult {
  type: 'player' | 'transaction' | 'quest';
  id: string;
  details: any;
  relevance: number;
}

interface PlayerAnalysis {
  player: any;
  risk_score: number;
  risk_factors: string[];
  connections: any[];
  financial_summary: any;
  recent_activity: any[];
}

interface ConnectionAnalysis {
  direct_connections: any[];
  indirect_connections: any[];
  connection_types: string[];
  risk_assessment: any;
}

const AdminInvestigationTab: React.FC<AdminInvestigationTabProps> = ({ colorStyle }) => {
  const [activeSection, setActiveSection] = useState<'search' | 'player-analysis' | 'connections' | 'reports'>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'players' | 'transactions' | 'quests'>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Player analysis state
  const [analyzePlayerId, setAnalyzePlayerId] = useState('');
  const [playerAnalysis, setPlayerAnalysis] = useState<PlayerAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Connections state
  const [connectPlayerId1, setConnectPlayerId1] = useState('');
  const [connectPlayerId2, setConnectPlayerId2] = useState('');
  const [connectionAnalysis, setConnectionAnalysis] = useState<ConnectionAnalysis | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Reports state
  const [reportPlayerId, setReportPlayerId] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const response = await adminApi.universalSearch(searchQuery, searchType);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const analyzePlayer = async () => {
    if (!analyzePlayerId.trim()) return;

    setAnalysisLoading(true);
    try {
      const response = await adminApi.analyzePlayer(analyzePlayerId);
      setPlayerAnalysis(response.data.analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      setPlayerAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const analyzeConnections = async () => {
    if (!connectPlayerId1.trim() || !connectPlayerId2.trim()) return;

    setConnectionLoading(true);
    try {
      const response = await adminApi.analyzeConnections([connectPlayerId1, connectPlayerId2]);
      setConnectionAnalysis(response.data.analysis);
    } catch (error) {
      console.error('Connection analysis error:', error);
      setConnectionAnalysis(null);
    } finally {
      setConnectionLoading(false);
    }
  };

  const reportSuspiciousActivity = async () => {
    if (!reportPlayerId.trim() || !reportReason.trim()) return;

    setReportLoading(true);
    try {
      await adminApi.reportSuspiciousActivity(reportPlayerId, reportReason, reportDescription);
      // Clear form on success
      setReportPlayerId('');
      setReportReason('');
      setReportDescription('');
      alert('Отчет отправлен успешно');
    } catch (error) {
      console.error('Report error:', error);
      alert('Ошибка отправки отчета');
    } finally {
      setReportLoading(false);
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
        🕵️ Центр расследований
      </h3>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'search', label: '🔍 Поиск', icon: '🔍' },
          { key: 'player-analysis', label: '👤 Анализ игрока', icon: '👤' },
          { key: 'connections', label: '🔗 Связи', icon: '🔗' },
          { key: 'reports', label: '📋 Отчеты', icon: '📋' }
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
              fontSize: '0.8rem',
              transition: 'all 0.3s ease'
            }}
          >
            {section.icon} {section.label}
          </button>
        ))}
      </div>

      {/* Search Section */}
      {activeSection === 'search' && (
        <div>
          <h4 style={{ color: colorStyle, marginBottom: '15px' }}>🔍 Универсальный поиск</h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '10px',
            marginBottom: '20px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Введите поисковый запрос..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />

            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            >
              <option value="all">Все</option>
              <option value="players">Игроки</option>
              <option value="transactions">Транзакции</option>
              <option value="quests">Задания</option>
            </select>

            <button
              onClick={performSearch}
              disabled={searchLoading || !searchQuery.trim()}
              style={{
                background: searchQuery.trim() ? colorStyle : '#666',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                color: '#fff',
                cursor: searchQuery.trim() && !searchLoading ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem'
              }}
            >
              {searchLoading ? '⏳' : '🔍'} Найти
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '15px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <h5 style={{ color: '#44ff44', margin: '0 0 10px 0' }}>
                📊 Найдено результатов: {searchResults.length}
              </h5>
              {searchResults.map((result, index) => (
                <SearchResultItem
                  key={index}
                  result={result}
                  colorStyle={colorStyle}
                  onAnalyze={(id) => {
                    setAnalyzePlayerId(id);
                    setActiveSection('player-analysis');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Player Analysis Section */}
      {activeSection === 'player-analysis' && (
        <div>
          <h4 style={{ color: colorStyle, marginBottom: '15px' }}>👤 Анализ игрока</h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '10px',
            marginBottom: '20px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Telegram ID игрока"
              value={analyzePlayerId}
              onChange={(e) => setAnalyzePlayerId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzePlayer()}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />

            <button
              onClick={analyzePlayer}
              disabled={analysisLoading || !analyzePlayerId.trim()}
              style={{
                background: analyzePlayerId.trim() ? colorStyle : '#666',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                color: '#fff',
                cursor: analyzePlayerId.trim() && !analysisLoading ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem'
              }}
            >
              {analysisLoading ? '⏳' : '🔍'} Анализировать
            </button>
          </div>

          {playerAnalysis && (
            <PlayerAnalysisResults
              analysis={playerAnalysis}
              colorStyle={colorStyle}
            />
          )}
        </div>
      )}

      {/* Connections Section */}
      {activeSection === 'connections' && (
        <div>
          <h4 style={{ color: colorStyle, marginBottom: '15px' }}>🔗 Анализ связей</h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: '10px',
            marginBottom: '20px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Telegram ID игрока 1"
              value={connectPlayerId1}
              onChange={(e) => setConnectPlayerId1(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />

            <input
              type="text"
              placeholder="Telegram ID игрока 2"
              value={connectPlayerId2}
              onChange={(e) => setConnectPlayerId2(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />

            <button
              onClick={analyzeConnections}
              disabled={connectionLoading || !connectPlayerId1.trim() || !connectPlayerId2.trim()}
              style={{
                background: connectPlayerId1.trim() && connectPlayerId2.trim() ? colorStyle : '#666',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                color: '#fff',
                cursor: connectPlayerId1.trim() && connectPlayerId2.trim() && !connectionLoading ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem'
              }}
            >
              {connectionLoading ? '⏳' : '🔗'} Найти связи
            </button>
          </div>

          {connectionAnalysis && (
            <ConnectionAnalysisResults
              analysis={connectionAnalysis}
              colorStyle={colorStyle}
            />
          )}
        </div>
      )}

      {/* Reports Section */}
      {activeSection === 'reports' && (
        <div>
          <h4 style={{ color: colorStyle, marginBottom: '15px' }}>📋 Отчет о подозрительной активности</h4>

          <div style={{
            display: 'grid',
            gap: '15px',
            maxWidth: '600px'
          }}>
            <input
              type="text"
              placeholder="Telegram ID игрока"
              value={reportPlayerId}
              onChange={(e) => setReportPlayerId(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Выберите причину...</option>
              <option value="fraud">Мошенничество</option>
              <option value="multiple_accounts">Множественные аккаунты</option>
              <option value="suspicious_transactions">Подозрительные транзакции</option>
              <option value="quest_abuse">Злоупотребление заданиями</option>
              <option value="money_laundering">Отмывание денег</option>
              <option value="other">Другое</option>
            </select>

            <textarea
              placeholder="Дополнительное описание (опционально)"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #444',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '0.9rem',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />

            <button
              onClick={reportSuspiciousActivity}
              disabled={reportLoading || !reportPlayerId.trim() || !reportReason}
              style={{
                background: reportPlayerId.trim() && reportReason ? '#ff4444' : '#666',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                color: '#fff',
                cursor: reportPlayerId.trim() && reportReason && !reportLoading ? 'pointer' : 'not-allowed',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              {reportLoading ? '⏳' : '📋'} Отправить отчет
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент результата поиска
const SearchResultItem: React.FC<{
  result: SearchResult;
  colorStyle: string;
  onAnalyze: (id: string) => void;
}> = ({ result, colorStyle, onAnalyze }) => {
  const getIcon = () => {
    switch (result.type) {
      case 'player': return '👤';
      case 'transaction': return '💰';
      case 'quest': return '📋';
      default: return '📄';
    }
  };

  const getTypeColor = () => {
    switch (result.type) {
      case 'player': return '#44ff44';
      case 'transaction': return '#FFD700';
      case 'quest': return '#00BFFF';
      default: return '#aaa';
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid #444',
      borderRadius: '6px',
      padding: '10px',
      marginBottom: '8px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>{getIcon()}</span>
          <span style={{ color: getTypeColor(), fontWeight: 'bold' }}>
            {result.type.toUpperCase()}
          </span>
          <span style={{ color: '#ddd' }}>ID: {result.id}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{
            fontSize: '0.8rem',
            color: '#aaa',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {Math.round(result.relevance * 100)}% совпадение
          </span>
          {result.type === 'player' && (
            <button
              onClick={() => onAnalyze(result.id)}
              style={{
                background: colorStyle,
                border: 'none',
                borderRadius: '4px',
                padding: '4px 8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              🔍 Анализ
            </button>
          )}
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
        {JSON.stringify(result.details, null, 2).substring(0, 100)}...
      </div>
    </div>
  );
};

// Компонент результатов анализа игрока
const PlayerAnalysisResults: React.FC<{
  analysis: PlayerAnalysis;
  colorStyle: string;
}> = ({ analysis, colorStyle }) => {
  const getRiskColor = (score: number) => {
    if (score >= 0.7) return '#ff4444';
    if (score >= 0.4) return '#FFA500';
    return '#44ff44';
  };

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid #444',
      borderRadius: '8px',
      padding: '15px'
    }}>
      <h5 style={{ color: '#44ff44', margin: '0 0 15px 0' }}>
        📊 Анализ игрока {analysis.player?.telegram_id}
      </h5>

      {/* Risk Score */}
      <div style={{
        background: `rgba(${analysis.risk_score >= 0.7 ? '255, 68, 68' : analysis.risk_score >= 0.4 ? '255, 165, 0' : '68, 255, 68'}, 0.1)`,
        border: `1px solid ${getRiskColor(analysis.risk_score)}40`,
        borderRadius: '6px',
        padding: '10px',
        marginBottom: '15px'
      }}>
        <div style={{ color: getRiskColor(analysis.risk_score), fontWeight: 'bold' }}>
          🎯 Уровень риска: {Math.round(analysis.risk_score * 100)}%
        </div>
      </div>

      {/* Risk Factors */}
      {analysis.risk_factors && analysis.risk_factors.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h6 style={{ color: '#FFA500', margin: '0 0 8px 0' }}>⚠️ Факторы риска:</h6>
          {analysis.risk_factors.map((factor, index) => (
            <div key={index} style={{
              fontSize: '0.8rem',
              color: '#ddd',
              padding: '4px 8px',
              background: 'rgba(255, 165, 0, 0.1)',
              borderRadius: '4px',
              marginBottom: '4px'
            }}>
              • {factor}
            </div>
          ))}
        </div>
      )}

      {/* Financial Summary */}
      {analysis.financial_summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '4px' }}>
            <div style={{ color: '#44ff44', fontWeight: 'bold' }}>
              {analysis.financial_summary.total_deposits || 0} TON
            </div>
            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Депозиты</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '4px' }}>
            <div style={{ color: '#ff4444', fontWeight: 'bold' }}>
              {analysis.financial_summary.total_withdrawals || 0} TON
            </div>
            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Выводы</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '8px', borderRadius: '4px' }}>
            <div style={{ color: '#FFD700', fontWeight: 'bold' }}>
              {analysis.financial_summary.current_balance || 0} TON
            </div>
            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Баланс</div>
          </div>
        </div>
      )}

      {/* Connections */}
      {analysis.connections && analysis.connections.length > 0 && (
        <div>
          <h6 style={{ color: '#00BFFF', margin: '0 0 8px 0' }}>🔗 Связи ({analysis.connections.length}):</h6>
          {analysis.connections.slice(0, 5).map((connection, index) => (
            <div key={index} style={{
              fontSize: '0.8rem',
              color: '#ddd',
              padding: '4px 8px',
              background: 'rgba(0, 191, 255, 0.1)',
              borderRadius: '4px',
              marginBottom: '4px'
            }}>
              👤 {connection.telegram_id} - {connection.connection_type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент результатов анализа связей
const ConnectionAnalysisResults: React.FC<{
  analysis: ConnectionAnalysis;
  colorStyle: string;
}> = ({ analysis, colorStyle }) => (
  <div style={{
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '15px'
  }}>
    <h5 style={{ color: '#44ff44', margin: '0 0 15px 0' }}>
      🔗 Анализ связей
    </h5>

    {analysis.direct_connections && analysis.direct_connections.length > 0 && (
      <div style={{ marginBottom: '15px' }}>
        <h6 style={{ color: '#FFD700', margin: '0 0 8px 0' }}>
          🎯 Прямые связи ({analysis.direct_connections.length}):
        </h6>
        {analysis.direct_connections.map((connection, index) => (
          <div key={index} style={{
            fontSize: '0.8rem',
            color: '#ddd',
            padding: '6px 8px',
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '4px',
            marginBottom: '4px'
          }}>
            🔗 {connection.type}: {connection.description}
          </div>
        ))}
      </div>
    )}

    {analysis.indirect_connections && analysis.indirect_connections.length > 0 && (
      <div style={{ marginBottom: '15px' }}>
        <h6 style={{ color: '#FFA500', margin: '0 0 8px 0' }}>
          🔍 Косвенные связи ({analysis.indirect_connections.length}):
        </h6>
        {analysis.indirect_connections.slice(0, 3).map((connection, index) => (
          <div key={index} style={{
            fontSize: '0.8rem',
            color: '#ddd',
            padding: '6px 8px',
            background: 'rgba(255, 165, 0, 0.1)',
            borderRadius: '4px',
            marginBottom: '4px'
          }}>
            🔍 {connection.type}: {connection.description}
          </div>
        ))}
      </div>
    )}

    {analysis.risk_assessment && (
      <div style={{
        background: 'rgba(255, 68, 68, 0.1)',
        border: '1px solid #ff444440',
        borderRadius: '6px',
        padding: '10px'
      }}>
        <div style={{ color: '#ff4444', fontWeight: 'bold', marginBottom: '5px' }}>
          ⚠️ Оценка риска: {analysis.risk_assessment.level}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#ddd' }}>
          {analysis.risk_assessment.description}
        </div>
      </div>
    )}
  </div>
);

export default AdminInvestigationTab;