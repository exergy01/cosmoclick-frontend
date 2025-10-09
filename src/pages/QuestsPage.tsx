// src/pages/QuestsPage.tsx - С РУЧНОЙ ПРОВЕРКОЙ
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useGame } from '../context/GameContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';
import { adService } from '../services/adsgramService';
import ToastNotification from '../components/ToastNotification'; 

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';
const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '13245';

interface QuestLinkState {
  clicked_at: string;
  timer_remaining: number;
  can_claim: boolean;
}

interface QuestDataV2 {
  quest_id: number;
  quest_key: string;
  quest_name: string;
  quest_type: string;
  description: string;
  reward_cs: number;
  quest_data?: any;
  completed: boolean;
  target_languages?: string[] | null;
  used_language: string;
  manual_check_user_instructions?: string;
  link_state?: QuestLinkState | null;
}

interface ToastNotificationData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number;
}

const QuestsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { player, refreshPlayer } = useNewPlayer();
  const { currentSystem } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [quests, setQuests] = useState<QuestDataV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkTimers, setLinkTimers] = useState<{[key: number]: number}>({});
  const [completingQuest, setCompletingQuest] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<ToastNotificationData[]>([]);
  const [questStats, setQuestStats] = useState<any>(null);
  const [userLanguage, setUserLanguage] = useState<string>('en');
  
  // Состояния для ручной проверки
  const [manualCheckState, setManualCheckState] = useState<{[key: number]: 'idle' | 'input' | 'submitting' | 'submitted'}>({});
  const [manualCheckInput, setManualCheckInput] = useState<{[key: number]: string}>({});

  const colorStyle = player?.color || '#00BFFF';

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'warning', duration = 3000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    const initializeAdService = async () => {
      try {
        await adService.initialize(ADSGRAM_BLOCK_ID);
      } catch (error) {
        console.error('Ошибка инициализации adService:', error);
      }
    };
    initializeAdService();
  }, []);

  const watchAd = useCallback(async () => {
    if (!player?.telegram_id) {
      addNotification(t('quest_errors.player_not_found'), 'error');
      return;
    }
    
    try {
      const result = await adService.showRewardedAd();
      if (result.success) {
        try {
          const response = await axios.post(`${API_URL}/api/quests/watch_ad`, {
            telegramId: player.telegram_id
          });
          if (response.data.success) {
            await refreshPlayer();
            addNotification(
              t('quest_ad_reward') || 'Получено 10 CCC за просмотр рекламы!', 
              'success'
            );
            loadQuests();
          } else {
            throw new Error(response.data.error || t('quest_errors.server_error'));
          }
        } catch (error: any) {
          addNotification(
            error.response?.data?.error || t('quest_errors.reward_error'), 
            'error'
          );
        }
      } else {
        addNotification(
          result.error || t('quest_errors.ad_skipped'), 
          'warning'
        );
      }
    } catch (error: any) {
      addNotification(t('quest_errors.ad_unavailable'), 'error');
    }
  }, [player?.telegram_id, refreshPlayer, addNotification, t]);

  const loadQuests = useCallback(async () => {
    if (!player?.telegram_id) return;
    
    try {
      setLoading(true);
      
      const currentLanguage = i18n.language || player.registration_language || 'en';
      setUserLanguage(currentLanguage);
      
      const response = await axios.get(`${API_URL}/api/quests/v2/${player.telegram_id}?force_language=${currentLanguage}`);
      
      if (response.data.success) {
        setQuests(response.data.quests);
        setQuestStats(response.data.stats);
        setUserLanguage(response.data.user_language);
        
        if (player.quest_link_states) {
          const newTimers: {[key: number]: number} = {};
          
          response.data.quests.forEach((quest: QuestDataV2) => {
            if (quest.completed) {
              newTimers[quest.quest_id] = -1;
            } else if (quest.quest_type === 'partner_link') {
              const linkState = player.quest_link_states?.[quest.quest_id.toString()];
              
              if (linkState?.completed) {
                newTimers[quest.quest_id] = -1;
              } else if (linkState?.clicked_at) {
                const clickedTime = new Date(linkState.clicked_at);
                const currentTime = new Date();
                const elapsedSeconds = Math.floor((currentTime.getTime() - clickedTime.getTime()) / 1000);
                
                if (elapsedSeconds >= 30) {
                  newTimers[quest.quest_id] = 0;
                } else {
                  newTimers[quest.quest_id] = 30 - elapsedSeconds;
                }
              }
            }
          });
          
          setLinkTimers(newTimers);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки заданий V2:', error);
      addNotification(t('quests_load_error') || 'Ошибка загрузки заданий.', 'error');
    } finally {
      setLoading(false);
    }
  }, [player?.telegram_id, player?.quest_link_states, i18n.language, player?.registration_language, addNotification, t]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLinkTimers(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.keys(updated).forEach(questIdStr => {
          const questId = parseInt(questIdStr);
          const currentTime = updated[questId];
          
          if (currentTime > 0) {
            updated[questId] = currentTime - 1;
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  const handleLinkClick = async (quest: QuestDataV2) => {
    if (!player?.telegram_id) return;
    
    try {
      const response = await axios.post(`${API_URL}/api/quests/click_link`, {
        telegramId: player.telegram_id,
        questId: quest.quest_id,
        quest_key: quest.quest_key
      });
      
      if (response.data.success) {
        window.open(quest.quest_data?.url, '_blank');
        setLinkTimers(prev => ({ ...prev, [quest.quest_id]: 30 }));
      } else {
        addNotification(t('quest_errors.link_click_error'), 'error');
      }
    } catch (error: any) {
      addNotification(t('quest_errors.click_processing_error'), 'error');
    }
  };

  const completeQuest = async (quest: QuestDataV2) => {
    if (!player?.telegram_id || completingQuest) return;
    try {
      setCompletingQuest(quest.quest_id);
      
      const response = await axios.post(`${API_URL}/api/quests/complete`, {
        telegramId: player.telegram_id,
        questId: quest.quest_id,
        quest_key: quest.quest_key
      });
      
      if (response.data.success) {
        await refreshPlayer();
        setQuests(prev => prev.map(q => 
          q.quest_id === quest.quest_id 
            ? { ...q, completed: true }
            : q
        ));
        setLinkTimers(prev => ({ ...prev, [quest.quest_id]: -1 }));
        addNotification(
          t('quest_reward_received', { reward: Number(response.data.reward_cs).toLocaleString() }) || 
          `Получено ${Number(response.data.reward_cs).toLocaleString()} CS!`, 
          'success'
        );
      } else {
        addNotification(response.data.error || t('quest_completion_error'), 'error');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || t('quest_completion_error');
      
      if (errorMessage.includes('timer not completed')) {
        addNotification(t('quest_errors.timer_wait_message'), 'warning');
        setLinkTimers(prev => ({ ...prev, [quest.quest_id]: 10 }));
      } else {
        addNotification(errorMessage, 'error');
      }
    } finally {
      setCompletingQuest(null);
    }
  };

  // Новая функция для ручной проверки
  const handleManualCheckRegister = (quest: QuestDataV2) => {
    if (quest.quest_data?.registration_url) {
      window.open(quest.quest_data.registration_url, '_blank');
    }
    setManualCheckState(prev => ({ ...prev, [quest.quest_id]: 'input' }));
  };

  const handleManualCheckSubmit = async (quest: QuestDataV2) => {
    if (!player?.telegram_id) return;

    const accountNumber = manualCheckInput[quest.quest_id]?.trim();

    if (!accountNumber) {
      addNotification('Введите номер счета', 'error');
      return;
    }

    try {
      setManualCheckState(prev => ({ ...prev, [quest.quest_id]: 'submitting' }));

      // ОБНОВЛЕНО: используем новый API endpoint
      const response = await axios.post(`${API_URL}/api/quests/submit-manual`, {
        telegram_id: player.telegram_id,
        quest_key: quest.quest_key,
        account_number: accountNumber,
        notes: '' // Дополнительные заметки (опционально)
      });

      if (response.data.success) {
        setManualCheckState(prev => ({ ...prev, [quest.quest_id]: 'submitted' }));
        addNotification(
          response.data.message || 'Заявка отправлена администратору на проверку!',
          'success',
          5000
        );
        setManualCheckInput(prev => ({ ...prev, [quest.quest_id]: '' }));
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      setManualCheckState(prev => ({ ...prev, [quest.quest_id]: 'input' }));
      addNotification(
        error.response?.data?.error || error.message || 'Ошибка отправки заявки',
        'error'
      );
      console.error('❌ Ошибка отправки заявки:', error);
    }
  };

  const basicQuests = quests.filter(q =>
    !q.completed && (q.quest_type === 'referral' || q.quest_type === 'partner_link' || q.quest_type === 'automatic')
  );

  const manualQuests = quests.filter(q => !q.completed && q.quest_type === 'manual_check');
  const hasCompletedAllQuests = basicQuests.length === 0 && manualQuests.length === 0;

  const renderQuestButton = (quest: QuestDataV2) => {
    if (quest.quest_type === 'partner_link') {
      const timerValue = linkTimers[quest.quest_id];
      const isTimerRunning = timerValue > 0;
      const canClaim = timerValue === 0;
      const isCompleted = timerValue === -1 || quest.completed;

      if (!isTimerRunning && !canClaim && !isCompleted) {
        return (
          <button
            onClick={() => handleLinkClick(quest)}
            style={{
              padding: '8px 20px',
              background: `linear-gradient(135deg, ${colorStyle}40, ${colorStyle}80)`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            Перейти
          </button>
        );
      }
      
      if (isTimerRunning) {
        return (
          <div style={{
            padding: '8px 20px',
            background: 'rgba(255, 165, 0, 0.2)',
            border: '1px solid #ffa500',
            borderRadius: '8px',
            color: '#ffa500',
            fontSize: '0.85rem',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}>
            {timerValue}s
          </div>
        );
      }
      
      if (canClaim && !isCompleted) {
        return (
          <button
            onClick={() => completeQuest(quest)}
            disabled={completingQuest === quest.quest_id}
            style={{
              padding: '8px 20px',
              background: completingQuest === quest.quest_id 
                ? 'rgba(128, 128, 128, 0.2)' 
                : 'linear-gradient(135deg, #00ff0040, #00ff0080)',
              border: `1px solid ${completingQuest === quest.quest_id ? '#888' : '#00ff00'}`,
              borderRadius: '8px',
              color: completingQuest === quest.quest_id ? '#888' : '#fff',
              cursor: completingQuest === quest.quest_id ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            {completingQuest === quest.quest_id ? 'Получение...' : 'Получить'}
          </button>
        );
      }
      
      if (isCompleted) {
        return (
          <div style={{
            padding: '8px 20px',
            background: 'rgba(0, 255, 0, 0.2)',
            border: '1px solid #00ff00',
            borderRadius: '8px',
            color: '#00ff00',
            fontSize: '0.85rem',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}>
            Выполнено
          </div>
        );
      }
    }
    
    return (
      <div style={{
        padding: '8px 20px',
        background: 'rgba(255, 165, 0, 0.2)',
        border: '1px solid #ffa500',
        borderRadius: '8px',
        color: '#ffa500',
        fontSize: '0.85rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
      }}>
        В процессе
      </div>
    );
  };

  const renderManualCheckButton = (quest: QuestDataV2) => {
    const state = manualCheckState[quest.quest_id] || 'idle';

    if (state === 'submitted') {
      return (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(0, 191, 255, 0.2)',
          border: '1px solid #00bfff',
          borderRadius: '8px',
          color: '#00bfff',
          fontSize: '0.85rem',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}>
          На проверке
        </div>
      );
    }

    if (state === 'idle') {
      return (
        <button
          onClick={() => handleManualCheckRegister(quest)}
          style={{
            padding: '8px 20px',
            background: `linear-gradient(135deg, ${colorStyle}40, ${colorStyle}80)`,
            border: `1px solid ${colorStyle}`,
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}
        >
          Зарегистрироваться
        </button>
      );
    }

    if (state === 'input' || state === 'submitting') {
      return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Номер счета"
            value={manualCheckInput[quest.quest_id] || ''}
            onChange={(e) => setManualCheckInput(prev => ({ ...prev, [quest.quest_id]: e.target.value }))}
            disabled={state === 'submitting'}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #555',
              background: 'rgba(0, 0, 0, 0.3)',
              color: '#fff',
              fontSize: '0.85rem'
            }}
          />
          <button
            onClick={() => handleManualCheckSubmit(quest)}
            disabled={state === 'submitting'}
            style={{
              padding: '6px 16px',
              background: state === 'submitting' 
                ? 'rgba(128, 128, 128, 0.2)' 
                : 'linear-gradient(135deg, #00ff0040, #00ff0080)',
              border: `1px solid ${state === 'submitting' ? '#888' : '#00ff00'}`,
              borderRadius: '6px',
              color: '#fff',
              cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            {state === 'submitting' ? '...' : 'Отправить'}
          </button>
        </div>
      );
    }
  };

  const renderAdButton = (index: number) => {
    const isCompleted = (player?.quest_ad_views || 0) > index;
    const isAvailable = (player?.quest_ad_views || 0) === index;

    if (isCompleted) {
      return (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(0, 255, 0, 0.2)',
          border: '1px solid #00ff00',
          borderRadius: '8px',
          color: '#00ff00',
          fontSize: '0.85rem',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}>
          Выполнено
        </div>
      );
    }

    if (isAvailable) {
      return (
        <button
          onClick={watchAd}
          style={{
            padding: '8px 20px',
            background: `linear-gradient(135deg, ${colorStyle}40, ${colorStyle}80)`,
            border: `1px solid ${colorStyle}`,
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}
        >
          Смотреть
        </button>
      );
    }

    return (
      <div style={{
        padding: '8px 20px',
        background: 'rgba(128, 128, 128, 0.2)',
        border: '1px solid #888',
        borderRadius: '8px',
        color: '#888',
        fontSize: '0.85rem',
        fontWeight: '600',
        whiteSpace: 'nowrap'
      }}>
        Заблокировано
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        position: 'relative'
      }}
    >
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />
      
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {notifications.map(n => (
          <ToastNotification 
            key={n.id} 
            message={n.message} 
            type={n.type} 
            colorStyle={colorStyle}
            duration={n.duration}
          />
        ))}
      </div>

      <div style={{ marginTop: '100px', paddingBottom: '130px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {loading ? (
            <div style={{ 
              color: colorStyle, 
              fontSize: '1.2rem',
              padding: '50px'
            }}>
              Загружаем задания...
            </div>
          ) : (
            <>
              {basicQuests.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    color: colorStyle, 
                    fontSize: '1.5rem', 
                    marginBottom: '20px',
                    textShadow: `0 0 10px ${colorStyle}`
                  }}>
                    Основные задания
                  </h3>
                  {basicQuests.map(quest => (
                    <div
                      key={quest.quest_key}
                      style={{
                        margin: '0 auto 12px',
                        padding: '16px',
                        maxWidth: '500px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${colorStyle}40`,
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{
                          color: colorStyle,
                          margin: '0 0 6px 0',
                          fontSize: '1rem',
                          fontWeight: '600',
                          textAlign: 'left'
                        }}>
                          {quest.quest_name}
                        </h4>
                        <p style={{
                          color: '#a0a0a0',
                          margin: 0,
                          fontSize: '0.85rem',
                          textAlign: 'left'
                        }}>
                          {quest.description}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: `1px solid ${colorStyle}20`
                      }}>
                        <div style={{
                          color: '#90EE90',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>
                          +{Number(quest.reward_cs).toLocaleString()} CS
                        </div>
                        {renderQuestButton(quest)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {manualQuests.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    color: colorStyle, 
                    fontSize: '1.5rem', 
                    marginBottom: '20px',
                    textShadow: `0 0 10px ${colorStyle}`
                  }}>
                    Задания с проверкой
                  </h3>
                  {manualQuests.map(quest => (
                    <div
                      key={quest.quest_key}
                      style={{
                        margin: '0 auto 12px',
                        padding: '16px',
                        maxWidth: '500px',
                        background: 'rgba(255, 165, 0, 0.05)',
                        border: '1px solid #ffa50040',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{
                          color: '#ffa500',
                          margin: '0 0 6px 0',
                          fontSize: '1rem',
                          fontWeight: '600',
                          textAlign: 'left'
                        }}>
                          {quest.quest_name}
                        </h4>
                        <p style={{
                          color: '#a0a0a0',
                          margin: '0 0 6px 0',
                          fontSize: '0.85rem',
                          textAlign: 'left'
                        }}>
                          {quest.description}
                        </p>
                        {quest.manual_check_user_instructions && (
                          <p style={{
                            color: '#ffaa00',
                            margin: 0,
                            fontSize: '0.75rem',
                            textAlign: 'left'
                          }}>
                            📋 {quest.manual_check_user_instructions}
                          </p>
                        )}
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid #ffa50020',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{
                          color: '#90EE90',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>
                          +{Number(quest.reward_cs).toLocaleString()} CS
                        </div>
                        {renderManualCheckButton(quest)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {hasCompletedAllQuests && (
                <div style={{
                  margin: '30px auto',
                  padding: '30px',
                  maxWidth: '500px',
                  background: 'rgba(0, 255, 0, 0.1)',
                  border: '2px solid #00ff00',
                  borderRadius: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎉</div>
                  <h3 style={{ color: '#00ff00', marginBottom: '15px', fontSize: '1.3rem' }}>
                    Все основные задания выполнены!
                  </h3>
                  <p style={{ color: '#ccc', fontSize: '0.9rem' }}>
                    Отличная работа! Возвращайтесь позже за новыми заданиями или просмотрите рекламу.
                  </p>
                </div>
              )}
              
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ 
                  color: colorStyle, 
                  fontSize: '1.5rem', 
                  marginBottom: '20px',
                  textShadow: `0 0 10px ${colorStyle}`
                }}>
                  Просмотр рекламы (Ежедневно)
                </h3>
                {Array(5).fill(null).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      margin: '0 auto 12px',
                      padding: '16px',
                      maxWidth: '500px',
                      background: (player?.quest_ad_views || 0) > index 
                        ? 'rgba(0, 255, 0, 0.05)' 
                        : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${(player?.quest_ad_views || 0) > index ? '#00ff0040' : colorStyle + '40'}`,
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <h4 style={{
                        color: (player?.quest_ad_views || 0) > index ? '#00ff00' : colorStyle,
                        margin: '0 0 6px 0',
                        fontSize: '1rem',
                        fontWeight: '600',
                        textAlign: 'left'
                      }}>
                        Реклама #{index + 1}
                      </h4>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: `1px solid ${(player?.quest_ad_views || 0) > index ? '#00ff0020' : colorStyle + '20'}`
                    }}>
                      <div style={{
                        color: '#90EE90',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}>
                        +10 CCC
                      </div>
                      {renderAdButton(index)}
                    </div>
                  </div>
                ))}
                
                {(player?.quest_ad_views || 0) >= 5 && (
                  <div style={{
                    margin: '20px auto',
                    padding: '20px',
                    maxWidth: '500px',
                    background: 'rgba(0, 255, 0, 0.1)',
                    border: '2px solid #00ff00',
                    borderRadius: '15px',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ color: '#00ff00', marginBottom: '10px', fontSize: '1.1rem' }}>
                      Реклама за сегодня просмотрена!
                    </h4>
                    <p style={{ color: '#ccc', fontSize: '0.9rem', margin: 0 }}>
                      Завтра будут новые рекламные ролики!
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          
          <div style={{
            margin: '40px auto 0',
            padding: '20px',
            maxWidth: '500px',
            background: 'rgba(255, 165, 0, 0.1)',
            border: '2px solid #ffa500',
            borderRadius: '15px'
          }}>
            <h4 style={{ 
              color: '#ffa500', 
              marginBottom: '15px', 
              fontSize: '1.1rem',
              textAlign: 'center' 
            }}>
              Информация
            </h4>
            <div style={{
              color: '#ccc',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '8px' }}>
                • После клика "Перейти" подождите пока появится кнопка "Получить"
              </div>
              <div style={{ marginBottom: '8px' }}>
                • Ежедневные рекламные задания: лимит 5 раз в день
              </div>
              <div style={{ marginBottom: '8px' }}>
                • Задания с ручной проверкой: нажмите "Зарегистрироваться", выполните задание, введите данные и отправьте на проверку
              </div>
            </div>
          </div>
        </div>
      </div>
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default QuestsPage;