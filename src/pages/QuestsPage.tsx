// src/pages/QuestsPage.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ с новым дизайном (Вариант №1)
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
      console.log('Запуск рекламы для заданий...');
      const result = await adService.showRewardedAd();
      if (result.success) {
        console.log('Реклама успешно просмотрена:', result);
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
          console.error('Ошибка обработки награды:', error);
          addNotification(
            error.response?.data?.error || t('quest_errors.reward_error'), 
            'error'
          );
        }
      } else {
        console.log('Реклама не была успешно просмотрена:', result);
        addNotification(
          result.error || t('quest_errors.ad_skipped'), 
          'warning'
        );
      }
    } catch (error: any) {
      console.error('Критическая ошибка рекламы:', error);
      addNotification(t('quest_errors.ad_unavailable'), 'error');
    }
  }, [player?.telegram_id, refreshPlayer, addNotification, t]);

  const loadQuests = useCallback(async () => {
    if (!player?.telegram_id) return;
    
    try {
      setLoading(true);
      
      const currentLanguage = i18n.language || player.registration_language || 'en';
      setUserLanguage(currentLanguage);
      
      console.log(`Загружаем задания V2 для игрока ${player.telegram_id}, язык: ${currentLanguage}`);
      
      const response = await axios.get(`${API_URL}/api/quests/v2/${player.telegram_id}?force_language=${currentLanguage}`);
      
      if (response.data.success) {
        setQuests(response.data.quests);
        setQuestStats(response.data.stats);
        setUserLanguage(response.data.user_language);
        
        console.log(`V2: Загружено ${response.data.quests.length} заданий`);
        console.log(`Статистика:`, response.data.stats);
        
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

  const handleLinkClick = async (questId: number, url: string) => {
    if (!player?.telegram_id) return;
    
    try {
      const response = await axios.post(`${API_URL}/api/quests/click_link`, {
        telegramId: player.telegram_id,
        questId: questId
      });
      
      if (response.data.success) {
        window.open(url, '_blank');
        setLinkTimers(prev => ({ ...prev, [questId]: 30 }));
        console.log(`Клик по ссылке задания ${questId} зарегистрирован`);
      } else {
        addNotification(t('quest_errors.link_click_error'), 'error');
      }
    } catch (error: any) {
      console.error('Ошибка обработки клика по ссылке:', error);
      addNotification(t('quest_errors.click_processing_error'), 'error');
    }
  };

  const completeQuest = async (questId: number) => {
    if (!player?.telegram_id || completingQuest) return;
    try {
      setCompletingQuest(questId);
      const response = await axios.post(`${API_URL}/api/quests/complete`, {
        telegramId: player.telegram_id,
        questId: questId
      });
      if (response.data.success) {
        await refreshPlayer();
        setQuests(prev => prev.map(quest => 
          quest.quest_id === questId 
            ? { ...quest, completed: true }
            : quest
        ));
        setLinkTimers(prev => ({ ...prev, [questId]: -1 }));
        addNotification(
          t('quest_reward_received', { reward: Number(response.data.reward_cs).toLocaleString() }) || 
          `Получено ${Number(response.data.reward_cs).toLocaleString()} CS!`, 
          'success'
        );
      } else {
        addNotification(response.data.error || t('quest_completion_error') || t('quest_errors.completion_unknown_error'), 'error');
      }
    } catch (error: any) {
      console.error('Ошибка выполнения задания:', error);
      const errorMessage = error.response?.data?.error || t('quest_completion_error') || t('quest_errors.completion_error');
      
      if (errorMessage.includes('timer not completed')) {
        addNotification(t('quest_errors.timer_wait_message'), 'warning');
        setLinkTimers(prev => ({ ...prev, [questId]: 10 }));
      } else {
        addNotification(errorMessage, 'error');
      }
    } finally {
      setCompletingQuest(null);
    }
  };

  const basicQuests = quests.filter(q => 
    !q.completed && (q.quest_type === 'referral' || q.quest_type === 'partner_link')
  ).sort((a, b) => {
    if (a.quest_type === 'partner_link' && b.quest_type !== 'partner_link') return -1;
    if (a.quest_type !== 'partner_link' && b.quest_type === 'partner_link') return 1;
    return 0;
  });

  const manualQuests = quests.filter(q => !q.completed && q.quest_type === 'manual_check');
  const hasCompletedAllQuests = basicQuests.length === 0 && manualQuests.length === 0;

  // Функция рендера кнопки в новом стиле
  const renderQuestButton = (quest: QuestDataV2) => {
    if (quest.quest_type === 'partner_link') {
      const timerValue = linkTimers[quest.quest_id];
      const isTimerRunning = timerValue > 0;
      const canClaim = timerValue === 0;
      const isCompleted = timerValue === -1 || quest.completed;

      if (!isTimerRunning && !canClaim && !isCompleted) {
        return (
          <button
            onClick={() => handleLinkClick(quest.quest_id, quest.quest_data?.url)}
            style={{
              padding: '8px 20px',
              background: `linear-gradient(135deg, ${colorStyle}40, ${colorStyle}80)`,
              border: `1px solid ${colorStyle}`,
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {t('go_to_link') || 'Перейти'}
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
            {t('checking_progress') || 'Проверяем...'}
          </div>
        );
      }
      
      if (canClaim && !isCompleted) {
        return (
          <button
            onClick={() => completeQuest(quest.quest_id)}
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
            {completingQuest === quest.quest_id 
              ? (t('claiming') || 'Получение...') 
              : (t('claim_reward') || 'Получить')
            }
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
            {t('completed') || 'Выполнено'}
          </div>
        );
      }
    } else {
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
          {t('in_progress') || 'В процессе'}
        </div>
      );
    }
  };

  // Функция рендера кнопки рекламы
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
          {t('completed') || 'Выполнено'}
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
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
        >
          {t('watch') || 'Смотреть'}
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
        {t('locked') || 'Заблокировано'}
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
      
      {/* TOAST КОНТЕЙНЕР */}
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
              textAlign: 'center',
              padding: '50px'
            }}>
              {t('loading_quests') || 'Загружаем задания...'}
            </div>
          ) : (
            <>
              {/* ОСНОВНЫЕ ЗАДАНИЯ */}
              {basicQuests.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    color: colorStyle, 
                    fontSize: '1.5rem', 
                    marginBottom: '20px',
                    textShadow: `0 0 10px ${colorStyle}`
                  }}>
                    {t('main_quests') || 'Основные задания'}
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
                        borderRadius: '12px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Верхняя часть - название и описание */}
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{
                          color: colorStyle,
                          margin: '0 0 6px 0',
                          fontSize: '1rem',
                          fontWeight: '600',
                          lineHeight: '1.3',
                          textAlign: 'left'
                        }}>
                          {quest.quest_name}
                        </h4>
                        <p style={{
                          color: '#a0a0a0',
                          margin: 0,
                          fontSize: '0.85rem',
                          lineHeight: '1.4',
                          textAlign: 'left'
                        }}>
                          {quest.description}
                        </p>
                      </div>

                      {/* Нижняя часть - награда слева, кнопка справа */}
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
              
              {/* ЗАДАНИЯ С РУЧНОЙ ПРОВЕРКОЙ */}
              {manualQuests.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    color: colorStyle, 
                    fontSize: '1.5rem', 
                    marginBottom: '20px',
                    textShadow: `0 0 10px ${colorStyle}`
                  }}>
                    {t('manual_check_quests') || 'Задания с проверкой'}
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
                        borderRadius: '12px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <h4 style={{
                          color: '#ffa500',
                          margin: '0 0 6px 0',
                          fontSize: '1rem',
                          fontWeight: '600',
                          lineHeight: '1.3',
                          textAlign: 'left'
                        }}>
                          {quest.quest_name}
                        </h4>
                        <p style={{
                          color: '#a0a0a0',
                          margin: '0 0 6px 0',
                          fontSize: '0.85rem',
                          lineHeight: '1.4',
                          textAlign: 'left'
                        }}>
                          {quest.description}
                        </p>
                        {quest.manual_check_user_instructions && (
                          <p style={{
                            color: '#ffaa00',
                            margin: 0,
                            fontSize: '0.75rem',
                            lineHeight: '1.3',
                            textAlign: 'left'
                          }}>
                            {quest.manual_check_user_instructions}
                          </p>
                        )}
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid #ffa50020'
                      }}>
                        <div style={{
                          color: '#90EE90',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>
                          +{Number(quest.reward_cs).toLocaleString()} CS
                        </div>
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
                          {t('manual_check') || 'Ручная проверка'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* СООБЩЕНИЕ О ЗАВЕРШЕНИИ ВСЕХ ЗАДАНИЙ */}
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
                    {t('all_quests_completed') || 'Все основные задания выполнены!'}
                  </h3>
                  <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {t('all_quests_completed_desc') || 'Отличная работа! Возвращайтесь позже за новыми заданиями или просмотрите рекламу.'}
                  </p>
                </div>
              )}
              
              {/* ПРОСМОТР РЕКЛАМЫ ДЛЯ ЗАДАНИЙ */}
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ 
                  color: colorStyle, 
                  fontSize: '1.5rem', 
                  marginBottom: '20px',
                  textShadow: `0 0 10px ${colorStyle}`
                }}>
                  {t('daily_ads') || 'Просмотр рекламы (Ежедневно)'}
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
                      borderRadius: '12px',
                      transition: 'all 0.3s ease'
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
                        {t('ad_watch')} #{index + 1}
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
                
                {/* СООБЩЕНИЕ О ЗАВЕРШЕНИИ РЕКЛАМЫ */}
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
                      {t('daily_ads_completed') || 'Реклама за сегодня просмотрена!'}
                    </h4>
                    <p style={{ color: '#ccc', fontSize: '0.9rem', margin: 0 }}>
                      {t('daily_ads_reset') || 'Завтра будут новые рекламные ролики!'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* ИНФОРМАЦИОННЫЙ БЛОК */}
          <div style={{
            margin: '40px auto 0',
            padding: '20px',
            maxWidth: '500px',
            background: 'rgba(255, 165, 0, 0.1)',
            border: '2px solid #ffa500',
            borderRadius: '15px',
            boxShadow: '0 0 15px #ffa50030'
          }}>
            <h4 style={{ 
              color: '#ffa500', 
              marginBottom: '15px', 
              fontSize: '1.1rem',
              textAlign: 'center' 
            }}>
              {t('information') || 'Информация'}
            </h4>
            <div style={{
              color: '#ccc',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '8px' }}>
                • {t('timer_info') || 'После клика "Перейти" подождите пока появится кнопка "Получить"'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                • {t('ads_limit_info') || 'Ежедневные рекламные задания: лимит 5 раз в день (отдельно от игровой рекламы)'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                • {t('manual_check_info') || 'Задания с ручной проверкой требуют подтверждения администратора'}
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