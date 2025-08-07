// src/pages/QuestsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useGame } from '../context/GameContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';
// Импортируем рекламный сервис
import { adService } from '../services/adsgramService';
// Импортируем компонент для всплывающих уведомлений
import ToastNotification from '../components/ToastNotification'; 
// Используем общий API_URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Используем общий ADSGRAM_BLOCK_ID
const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '13245';

interface QuestLinkState {
  clicked_at: string;
  timer_remaining: number;
  can_claim: boolean;
}

interface QuestData {
  quest_id: number;
  quest_name: string;
  quest_type: string;
  description: string;
  reward_cs: number;
  quest_data?: any;
  completed: boolean;
  link_state?: QuestLinkState | null;
}

// Интерфейс для всплывающих уведомлений
interface ToastNotificationData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number;
}

const QuestsPage: React.FC = () => {
  const { t } = useTranslation();
  // Используем новые контексты
  const { player, refreshPlayer } = useNewPlayer();
  const { currentSystem } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkTimers, setLinkTimers] = useState<{[key: number]: number}>({});
  const [completingQuest, setCompletingQuest] = useState<number | null>(null);
  // Состояние для уведомлений
  const [notifications, setNotifications] = useState<ToastNotificationData[]>([]);

  // ✅ ДОБАВЛЯЕМ: Определение colorStyle на основе текущей системы
  const getColorStyle = (system: number) => {
    const colors = {
      1: '#00BFFF',    // Cyber Blue
      2: '#9D4EDD',    // Neon Purple  
      3: '#FF1493',    // Plasma Pink
      4: '#00FF7F',    // Cosmo Green
      5: '#FFD700'     // Star Gold
    };
    return colors[system as keyof typeof colors] || '#00BFFF';
  };
  const colorStyle = getColorStyle(currentSystem);

  // Функция для добавления уведомлений
  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'warning', duration = 3000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  // ✅ ДОБАВЛЯЕМ: Инициализация adService при монтировании компонента
  useEffect(() => {
    const initializeAdService = async () => {
      try {
        console.log('🎯 Инициализируем adService с blockId:', ADSGRAM_BLOCK_ID);
        await adService.initialize(ADSGRAM_BLOCK_ID);
        console.log('✅ AdService инициализирован:', adService.getProvidersStatus());
      } catch (error) {
        console.error('❌ Ошибка инициализации adService:', error);
      }
    };
    initializeAdService();
  }, []);

  // ✅ ОБНОВЛЕНО: Функция просмотра рекламы для заданий
  const watchAd = useCallback(async () => {
    if (!player?.telegram_id) {
      addNotification('Ошибка: игрок не найден', 'error');
      return;
    }
    
    try {
      console.log('🎬 Запуск рекламы для заданий...');
      // Показываем рекламу через ваш adService (уже инициализирован в useEffect)
      const result = await adService.showRewardedAd();
      if (result.success) {
        console.log('🎉 Реклама успешно просмотрена:', result);
        try {
          // Отправляем запрос на сервер для обновления счетчика рекламы заданий
          const response = await axios.post(`${API_URL}/api/quests/watch_ad`, {
            telegramId: player.telegram_id
          });
          if (response.data.success) {
            // Обновляем данные игрока
            await refreshPlayer();
            addNotification(
              t('quest_ad_reward') || '🎉 Получено 10 CCC за просмотр рекламы!', 
              'success'
            );
          } else {
            throw new Error(response.data.error || 'Ошибка сервера');
          }
        } catch (error: any) {
          console.error('❌ Ошибка обработки награды:', error);
          addNotification(
            error.response?.data?.error || 'Ошибка получения награды', 
            'error'
          );
        }
      } else {
        // Реклама не была успешно просмотрена
        console.log('❌ Реклама не была успешно просмотрена:', result);
        addNotification(
          result.error || 'Реклама была пропущена или произошла ошибка', 
          'warning'
        );
      }
    } catch (error: any) {
      console.error('❌ Критическая ошибка рекламы:', error);
      addNotification('Реклама недоступна', 'error');
    }
  }, [player?.telegram_id, refreshPlayer, addNotification, t]);

  // ✅ ОБНОВЛЕНО: Загрузка заданий с состояниями ссылок
  const loadQuests = useCallback(async () => {
    if (!player?.telegram_id) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/quests/${player.telegram_id}`);
      if (response.data.success) {
        setQuests(response.data.quests);
        
        // Инициализируем локальные таймеры на основе серверных данных
        const serverLinkStates = response.data.quest_link_states || {};
        const newTimers: {[key: number]: number} = {};
        
        response.data.quests.forEach((quest: QuestData) => {
          const serverState = serverLinkStates[quest.quest_id.toString()];
          if (serverState) {
            if (quest.completed) {
              newTimers[quest.quest_id] = -1; // Задание выполнено
            } else if (serverState.can_claim) {
              newTimers[quest.quest_id] = 0; // Можно забрать награду
            } else {
              newTimers[quest.quest_id] = serverState.timer_remaining; // Активный таймер
            }
          }
        });
        
        setLinkTimers(newTimers);
        console.log(`✅ Загружено ${response.data.quests.length} заданий`);
      }
    } catch (error) {
      console.error('Ошибка загрузки заданий:', error);
      addNotification(t('quests_load_error') || 'Ошибка загрузки заданий.', 'error');
    } finally {
      setLoading(false);
    }
  }, [player?.telegram_id, addNotification, t]);

  // ✅ ОБНОВЛЕНО: Таймер обновления локальных состояний
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

  // ✅ ОБНОВЛЕНО: Обработка клика по ссылке с сохранением на сервере
  const handleLinkClick = async (questId: number, url: string) => {
    if (!player?.telegram_id) return;
    
    try {
      // Отправляем запрос на сервер для регистрации клика
      const response = await axios.post(`${API_URL}/api/quests/click_link`, {
        telegramId: player.telegram_id,
        questId: questId
      });
      
      if (response.data.success) {
        // Открываем ссылку
        window.open(url, '_blank');
        
        // Устанавливаем локальный таймер
        setLinkTimers(prev => ({ ...prev, [questId]: 30 }));
        
        console.log(`✅ Клик по ссылке задания ${questId} зарегистрирован на сервере`);
      } else {
        addNotification('Ошибка регистрации клика', 'error');
      }
    } catch (error: any) {
      console.error('Ошибка обработки клика по ссылке:', error);
      addNotification('Ошибка обработки клика', 'error');
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
        // Обновляем игрока через refreshPlayer
        await refreshPlayer();
        setQuests(prev => prev.map(quest => 
          quest.quest_id === questId 
            ? { ...quest, completed: true }
            : quest
        ));
        // Устанавливаем -1 чтобы скрыть все кнопки для этого задания
        setLinkTimers(prev => ({ ...prev, [questId]: -1 }));
        addNotification(
          t('quest_reward_received', { reward: Number(response.data.reward_cs).toLocaleString() }) || 
          `🎉 Получено ${Number(response.data.reward_cs).toLocaleString()} CS!`, 
          'success'
        );
      } else {
        addNotification(response.data.error || t('quest_completion_error') || 'Неизвестная ошибка при выполнении задания.', 'error');
      }
    } catch (error: any) {
      console.error('Ошибка выполнения задания:', error);
      addNotification(error.response?.data?.error || t('quest_completion_error') || 'Ошибка выполнения задания', 'error');
    } finally {
      setCompletingQuest(null);
    }
  };

  // Упрощенная логика фильтрации заданий
  const basicQuests = quests.filter(q => 
    !q.completed && (q.quest_type === 'referral' || q.quest_type === 'partner_link')
  ).sort((a, b) => {
    // Партнерские ссылки показываем первыми
    if (a.quest_type === 'partner_link' && b.quest_type !== 'partner_link') return -1;
    if (a.quest_type !== 'partner_link' && b.quest_type === 'partner_link') return 1;
    return 0;
  });

  const manualQuests = quests.filter(q => !q.completed && q.quest_type === 'manual_check');
  const hasCompletedAllQuests = basicQuests.length === 0 && manualQuests.length === 0;

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
              ⏳ {t('loading_quests') || 'Загружаем задания...'}
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
                    📋 {t('main_quests') || 'Основные задания'}
                  </h3>
                  {basicQuests.map(quest => (
                    <div
                      key={quest.quest_id}
                      style={{
                        margin: '15px auto',
                        padding: '20px',
                        maxWidth: '500px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: `2px solid ${colorStyle}`,
                        borderRadius: '15px',
                        boxShadow: `0 0 20px ${colorStyle}30`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <h4 style={{ color: colorStyle, marginBottom: '8px', fontSize: '1.1rem' }}>
                            {quest.quest_name}
                          </h4>
                          <p style={{ color: '#ccc', margin: '0 0 8px 0', fontSize: '0.9rem', lineHeight: '1.4' }}>
                            {quest.description}
                          </p>
                          <p style={{ color: '#90EE90', margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>
                            🎁 {t('reward')}: {Number(quest.reward_cs).toLocaleString()} CS
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
                          {quest.quest_type === 'partner_link' ? (
                            (() => {
                              const timerValue = linkTimers[quest.quest_id];
                              const isTimerRunning = timerValue > 0;
                              const canClaim = timerValue === 0;
                              const isCompleted = timerValue === -1 || quest.completed;

                              return (
                                <>
                                  {/* Показываем кнопку "Перейти" только если таймер не запущен и задание не завершено */}
                                  {!isTimerRunning && !canClaim && !isCompleted && (
                                    <button
                                      onClick={() => handleLinkClick(quest.quest_id, quest.quest_data?.url)}
                                      style={{
                                        padding: '10px 15px',
                                        background: `linear-gradient(135deg, ${colorStyle}40, ${colorStyle}80)`,
                                        border: `2px solid ${colorStyle}`,
                                        borderRadius: '12px',
                                        boxShadow: `0 0 15px ${colorStyle}50`,
                                        color: '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem'
                                      }}
                                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                      🔗 {t('go_to_link') || 'Перейти'}
                                    </button>
                                  )}
                                  
                                  {/* Показываем таймер, если он запущен */}
                                  {isTimerRunning && (
                                    <div style={{
                                      padding: '10px 15px',
                                      borderRadius: '12px',
                                      background: 'rgba(255, 165, 0, 0.3)',
                                      border: '2px solid #ffa500',
                                      fontSize: '0.9rem',
                                      color: '#ffa500',
                                      textAlign: 'center',
                                      fontWeight: 'bold'
                                    }}>
                                      ⏳ {timerValue}с
                                    </div>
                                  )}
                                  
                                  {/* Показываем кнопку "Получить" только когда таймер завершен и задание не завершено */}
                                  {canClaim && !isCompleted && (
                                    <button
                                      onClick={() => completeQuest(quest.quest_id)}
                                      disabled={completingQuest === quest.quest_id}
                                      style={{
                                        padding: '10px 15px',
                                        background: completingQuest === quest.quest_id 
                                          ? 'rgba(128, 128, 128, 0.5)' 
                                          : 'linear-gradient(135deg, #00ff0040, #00ff0080)',
                                        border: `2px solid ${completingQuest === quest.quest_id ? '#888' : '#00ff00'}`,
                                        borderRadius: '12px',
                                        boxShadow: completingQuest === quest.quest_id 
                                          ? 'none' 
                                          : '0 0 15px #00ff0050',
                                        color: '#fff',
                                        cursor: completingQuest === quest.quest_id ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        opacity: completingQuest === quest.quest_id ? 0.7 : 1
                                      }}
                                      onMouseEnter={e => !completingQuest && (e.currentTarget.style.transform = 'scale(1.05)')}
                                      onMouseLeave={e => !completingQuest && (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                      {completingQuest === quest.quest_id 
                                        ? `⏳ ${t('claiming') || 'Получение...'}` 
                                        : `🎁 ${t('claim_reward') || 'Получить'}`
                                      }
                                    </button>
                                  )}
                                  
                                  {/* Показываем статус выполнения, если задание завершено */}
                                  {isCompleted && (
                                    <div style={{
                                      padding: '10px 15px',
                                      borderRadius: '12px',
                                      background: 'rgba(0, 255, 0, 0.3)',
                                      border: '2px solid #00ff00',
                                      fontSize: '0.9rem',
                                      color: '#00ff00',
                                      textAlign: 'center',
                                      fontWeight: 'bold'
                                    }}>
                                      ✅ {t('completed') || 'Выполнено'}
                                    </div>
                                  )}
                                </>
                              );
                            })()
                          ) : (
                            <div style={{
                              padding: '10px 15px',
                              borderRadius: '12px',
                              background: 'rgba(255, 165, 0, 0.3)',
                              border: '2px solid #ffa500',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              color: '#ffa500',
                              textAlign: 'center'
                            }}>
                              ⏳ {t('in_progress') || 'В процессе'}
                            </div>
                          )}
                        </div>
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
                    🔍 {t('manual_check_quests') || 'Задания с проверкой'}
                  </h3>
                  {manualQuests.map(quest => (
                    <div
                      key={quest.quest_id}
                      style={{
                        margin: '15px auto',
                        padding: '20px',
                        maxWidth: '500px',
                        background: 'rgba(255, 165, 0, 0.1)',
                        border: '2px solid #ffa500',
                        borderRadius: '15px',
                        boxShadow: '0 0 20px #ffa50030',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <h4 style={{ color: '#ffa500', marginBottom: '8px', fontSize: '1.1rem' }}>
                            {quest.quest_name}
                          </h4>
                          <p style={{ color: '#ccc', margin: '0 0 8px 0', fontSize: '0.9rem', lineHeight: '1.4' }}>
                            {quest.description}
                          </p>
                          <p style={{ color: '#90EE90', margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>
                            🎁 {t('reward')}: {Number(quest.reward_cs).toLocaleString()} CS
                          </p>
                        </div>
                        <div style={{
                          padding: '10px 15px',
                          borderRadius: '12px',
                          background: 'rgba(255, 165, 0, 0.3)',
                          border: '2px solid #ffa500',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: '#ffa500',
                          textAlign: 'center',
                          minWidth: '140px'
                        }}>
                          ⏳ {t('manual_check') || 'Ручная проверка'}
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
                  📺 {t('daily_ads') || 'Просмотр рекламы (Ежедневно)'}
                </h3>
                {Array(5).fill(null).map((_, index) => {
                  // ✅ ИСПРАВЛЕНО: используем quest_ad_views для счетчика рекламы заданий
                  const isCompleted = (player?.quest_ad_views || 0) > index;
                  const isAvailable = (player?.quest_ad_views || 0) === index;
                  return (
                    <div
                      key={index}
                      style={{
                        margin: '15px auto',
                        padding: '20px',
                        maxWidth: '500px',
                        background: isCompleted 
                          ? 'rgba(0, 255, 0, 0.1)' 
                          : 'rgba(0, 0, 0, 0.3)',
                        border: `2px solid ${isCompleted ? '#00ff00' : colorStyle}`,
                        borderRadius: '15px',
                        boxShadow: `0 0 20px ${isCompleted ? '#00ff0030' : colorStyle + '30'}`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                          <h4 style={{ 
                            color: isCompleted ? '#00ff00' : colorStyle, 
                            marginBottom: '8px',
                            fontSize: '1.1rem'
                          }}>
                            📺 {t('ad_watch')} #{index + 1}
                          </h4>
                          <p style={{ color: '#90EE90', margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>
                            🎁 {t('reward')}: 10 CCC
                          </p>
                        </div>
                        <div style={{ minWidth: '140px' }}>
                          {isCompleted ? (
                            <div style={{
                              padding: '10px 15px',
                              borderRadius: '12px',
                              background: 'rgba(0, 255, 0, 0.3)',
                              border: '2px solid #00ff00',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              color: '#00ff00',
                              textAlign: 'center'
                            }}>
                              ✅ {t('completed') || 'Выполнено'}
                            </div>
                          ) : isAvailable ? (
                            <button
                              onClick={watchAd}
                              style={{
                                padding: '10px 15px',
                                background: `linear-gradient(135deg, ${colorStyle}40, ${colorStyle}80)`,
                                border: `2px solid ${colorStyle}`,
                                borderRadius: '12px',
                                boxShadow: `0 0 15px ${colorStyle}50`,
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                width: '100%'
                              }}
                              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                              📺 {t('watch') || 'Смотреть'}
                            </button>
                          ) : (
                            <div style={{
                              padding: '10px 15px',
                              borderRadius: '12px',
                              background: 'rgba(128, 128, 128, 0.3)',
                              border: '2px solid #888',
                              fontSize: '0.9rem',
                              color: '#888',
                              textAlign: 'center',
                              fontWeight: 'bold'
                            }}>
                              🔒 {t('locked') || 'Заблокировано'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                      🎉 {t('daily_ads_completed') || 'Реклама за сегодня просмотрена!'}
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
              ℹ️ {t('information') || 'Информация'}
            </h4>
            <div style={{ 
              color: '#ccc', 
              fontSize: '0.9rem', 
              lineHeight: '1.6',
              textAlign: 'left' 
            }}>
              <div style={{ marginBottom: '8px' }}>
                • {t('timer_info') || 'После клика "Перейти" подождите 30 сек и нажмите "Получить награду"'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                • {t('ads_limit_info') || 'Реклама заданий: лимит 5 раз в день (отдельно от игровой рекламы)'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                • {t('server_save_info') || 'Состояние заданий сохраняется на сервере - можно закрыть и вернуться'}
              </div>
              <div>
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