import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

interface QuestData {
  quest_id: number;
  quest_name: string;
  quest_type: string;
  description: string;
  reward_cs: number;
  quest_data?: any;
  completed: boolean;
}

const QuestsPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, setPlayer, currentSystem } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [quests, setQuests] = useState<QuestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkTimers, setLinkTimers] = useState<{[key: number]: number}>({});
  const [completingQuest, setCompletingQuest] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false); // Переключатель отображения выполненных

  // Загрузка заданий из базы
  const loadQuests = useCallback(async () => {
    if (!player?.telegram_id) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/quests/${player.telegram_id}`);
      if (response.data.success) {
        setQuests(response.data.quests);
        console.log(`✅ Загружено ${response.data.quests.length} заданий`);
      }
    } catch (error) {
      console.error('Ошибка загрузки заданий:', error);
    } finally {
      setLoading(false);
    }
  }, [player?.telegram_id]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  // Обработка клика по ссылке
  const handleLinkClick = (questId: number, url: string) => {
    // Открываем ссылку в новой вкладке
    window.open(url, '_blank');
    
    // Запускаем таймер на 30 секунд
    setLinkTimers(prev => ({ ...prev, [questId]: 30 }));
    
    const timer = setInterval(() => {
      setLinkTimers(prev => {
        const newTime = (prev[questId] || 0) - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          return { ...prev, [questId]: 0 };
        }
        return { ...prev, [questId]: newTime };
      });
    }, 1000);
  };

  // Выполнение задания
  const completeQuest = async (questId: number) => {
    if (!player?.telegram_id || completingQuest) return;
    
    try {
      setCompletingQuest(questId);
      
      const response = await axios.post(`${apiUrl}/api/quests/complete`, {
        telegramId: player.telegram_id,
        questId: questId
      });
      
      if (response.data.success) {
        // Обновляем локальные данные игрока
        setPlayer({
          ...player,
          cs: Number(player.cs) + Number(response.data.reward_cs)
        });
        
        // Обновляем список заданий
        setQuests(prev => prev.map(quest => 
          quest.quest_id === questId 
            ? { ...quest, completed: true }
            : quest
        ));
        
        // Убираем таймер
        setLinkTimers(prev => ({ ...prev, [questId]: -1 }));
        
        alert(`🎉 Получено ${response.data.reward_cs} CS!`);
      }
    } catch (error: any) {
      console.error('Ошибка выполнения задания:', error);
      alert(error.response?.data?.error || 'Ошибка выполнения задания');
    } finally {
      setCompletingQuest(null);
    }
  };

  // Просмотр рекламы (старая логика)
  const watchAd = async () => {
    if ((player?.ad_views || 0) >= 5) return;
    try {
      const updatedPlayer = {
        ...player,
        ccc: Number(player?.ccc || 0) + 10,
        ad_views: (player?.ad_views || 0) + 1,
        last_ad_reset: player?.last_ad_reset || new Date().toISOString(),
        drones: player?.drones || [],
      };
      const res = await axios.put(`${apiUrl}/api/player/${player?.telegram_id}`, updatedPlayer);
      setPlayer(res.data);
      alert(t('ad_watched') || 'Реклама просмотрена!');
    } catch (err: any) {
      alert(t('ad_error', { error: err.response?.data?.error || err.message }) || 'Ошибка рекламы');
    }
  };

  const colorStyle = player?.color || '#00f0ff';

  if (!player) {
    return <div>Loading...</div>;
  }

  // Фильтруем задания
  const filterQuests = (questList: QuestData[]) => {
    return showCompleted ? questList : questList.filter(q => !q.completed);
  };

  // Группируем задания по типам
  const basicQuests = filterQuests(quests.filter(q => q.quest_type === 'referral'));
  const partnerQuests = filterQuests(quests.filter(q => q.quest_type === 'partner_link'));
  const manualQuests = filterQuests(quests.filter(q => q.quest_type === 'manual_check'));

  // Подсчет выполненных заданий
  const completedCount = quests.filter(q => q.completed).length;
  const totalCount = quests.length;

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
      {/* Верхняя панель с валютами */}
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />

      <div style={{ marginTop: '80px', paddingBottom: '130px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          
          {/* Заголовок и прогресс */}
          <h2 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2rem', 
            marginBottom: '20px'
          }}>
            📋 {t('quests') || 'Задания'}
          </h2>
          
          {/* Прогресс выполнения */}
          <div style={{
            margin: '0 auto 20px',
            padding: '15px',
            maxWidth: '400px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${colorStyle}`,
            borderRadius: '15px'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                Выполнено: {completedCount} / {totalCount}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(completedCount / totalCount) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${colorStyle}, ${colorStyle}80)`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Переключатель отображения выполненных */}
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            style={{
              margin: '0 auto 20px',
              padding: '10px 20px',
              background: showCompleted ? 'rgba(0, 255, 0, 0.2)' : 'rgba(128, 128, 128, 0.2)',
              border: `1px solid ${showCompleted ? '#00ff00' : '#888'}`,
              borderRadius: '10px',
              color: showCompleted ? '#00ff00' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease'
            }}
          >
            {showCompleted ? '👁️ Скрыть выполненные' : '👁️ Показать выполненные'}
          </button>

          {loading ? (
            <div style={{ color: colorStyle, fontSize: '1.2rem' }}>Wait...</div>
          ) : (
            <>
              {/* Основные задания */}
              {basicQuests.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    color: colorStyle, 
                    fontSize: '1.5rem', 
                    marginBottom: '20px',
                    textShadow: `0 0 10px ${colorStyle}`
                  }}>
                    📋 Основные задания
                  </h3>
                  {basicQuests.map(quest => (
                    <div
                      key={quest.quest_id}
                      style={{
                        margin: '15px auto',
                        padding: '20px',
                        maxWidth: '500px',
                        background: quest.completed 
                          ? 'rgba(0, 255, 0, 0.2)' 
                          : 'rgba(0, 0, 0, 0.3)',
                        border: `2px solid ${colorStyle}`,
                        borderRadius: '15px',
                        boxShadow: `0 0 20px ${colorStyle}30`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'left' }}>
                          <h4 style={{ color: colorStyle, marginBottom: '5px' }}>{quest.quest_name}</h4>
                          <p style={{ color: '#ccc', margin: 0, fontSize: '0.9rem' }}>
                            {quest.description}
                          </p>
                          <p style={{ color: '#ccc', margin: '5px 0 0 0' }}>
                            🎁 Награда: {quest.reward_cs} CS
                          </p>
                        </div>
                        <div style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          background: quest.completed 
                            ? 'rgba(0, 255, 0, 0.3)' 
                            : 'rgba(255, 165, 0, 0.3)',
                          border: quest.completed 
                            ? '1px solid #00ff00' 
                            : '1px solid #ffa500',
                          fontSize: '0.9rem',
                          fontWeight: 'bold'
                        }}>
                          {quest.completed 
                            ? '✅ Выполнено' 
                            : '⏳ В процессе'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Партнерские задания */}
              {partnerQuests.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    color: colorStyle, 
                    fontSize: '1.5rem', 
                    marginBottom: '20px',
                    textShadow: `0 0 10px ${colorStyle}`
                  }}>
                    🤝 Партнерские задания
                  </h3>
                  {partnerQuests.map(quest => {
                    const timerValue = linkTimers[quest.quest_id];
                    const isTimerRunning = timerValue > 0;
                    const canClaim = timerValue === 0;
                    
                    return (
                      <div
                        key={quest.quest_id}
                        style={{
                          margin: '15px auto',
                          padding: '20px',
                          maxWidth: '500px',
                          background: quest.completed 
                            ? 'rgba(0, 255, 0, 0.2)' 
                            : 'rgba(0, 0, 0, 0.3)',
                          border: `2px solid ${colorStyle}`,
                          borderRadius: '15px',
                          boxShadow: `0 0 20px ${colorStyle}30`,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ textAlign: 'left' }}>
                            <h4 style={{ color: colorStyle, marginBottom: '5px' }}>{quest.quest_name}</h4>
                            <p style={{ color: '#ccc', margin: 0, fontSize: '0.9rem' }}>
                              {quest.description}
                            </p>
                            <p style={{ color: '#ccc', margin: '5px 0 0 0' }}>
                              🎁 Награда: {quest.reward_cs} CS
                            </p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {quest.completed ? (
                              <div style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                background: 'rgba(0, 255, 0, 0.3)',
                                border: '1px solid #00ff00',
                                fontSize: '0.9rem',
                                fontWeight: 'bold'
                              }}>
                                ✅ Выполнено
                              </div>
                            ) : (
                              <>
                                {!isTimerRunning && !canClaim && (
                                  <button
                                    onClick={() => handleLinkClick(quest.quest_id, quest.quest_data?.url)}
                                    style={{
                                      padding: '10px 20px',
                                      background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                                      border: `2px solid ${colorStyle}`,
                                      borderRadius: '12px',
                                      boxShadow: `0 0 15px ${colorStyle}`,
                                      color: '#fff',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    🔗 Перейти
                                  </button>
                                )}
                                
                                {isTimerRunning && (
                                  <div style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    background: 'rgba(255, 165, 0, 0.3)',
                                    border: '1px solid #ffa500',
                                    fontSize: '0.9rem',
                                    color: '#ffa500'
                                  }}>
                                    ⏱️ {timerValue}с
                                  </div>
                                )}
                                
                                {canClaim && (
                                  <button
                                    onClick={() => completeQuest(quest.quest_id)}
                                    disabled={completingQuest === quest.quest_id}
                                    style={{
                                      padding: '10px 20px',
                                      background: `linear-gradient(135deg, #00ff0030, #00ff0060, #00ff0030)`,
                                      border: '2px solid #00ff00',
                                      borderRadius: '12px',
                                      boxShadow: '0 0 15px #00ff00',
                                      color: '#fff',
                                      cursor: completingQuest === quest.quest_id ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.3s ease',
                                      fontWeight: 'bold',
                                      opacity: completingQuest === quest.quest_id ? 0.7 : 1
                                    }}
                                  >
                                    {completingQuest === quest.quest_id ? '⏳ Получение...' : '🎁 Получить награду'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Задания с ручной проверкой */}
              {manualQuests.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ 
                    color: colorStyle, 
                    fontSize: '1.5rem', 
                    marginBottom: '20px',
                    textShadow: `0 0 10px ${colorStyle}`
                  }}>
                    🔍 Задания с проверкой
                  </h3>
                  {manualQuests.map(quest => (
                    <div
                      key={quest.quest_id}
                      style={{
                        margin: '15px auto',
                        padding: '20px',
                        maxWidth: '500px',
                        background: quest.completed 
                          ? 'rgba(0, 255, 0, 0.2)' 
                          : 'rgba(255, 165, 0, 0.1)',
                        border: `2px solid ${quest.completed ? '#00ff00' : '#ffa500'}`,
                        borderRadius: '15px',
                        boxShadow: `0 0 20px ${quest.completed ? '#00ff0030' : '#ffa50030'}`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'left' }}>
                          <h4 style={{ color: quest.completed ? '#00ff00' : '#ffa500', marginBottom: '5px' }}>
                            {quest.quest_name}
                          </h4>
                          <p style={{ color: '#ccc', margin: 0, fontSize: '0.9rem' }}>
                            {quest.description}
                          </p>
                          <p style={{ color: '#ccc', margin: '5px 0 0 0' }}>
                            🎁 Награда: {quest.reward_cs} CS
                          </p>
                        </div>
                        <div style={{
                          padding: '8px 16px',
                          borderRadius: '20px',
                          background: quest.completed 
                            ? 'rgba(0, 255, 0, 0.3)' 
                            : 'rgba(255, 165, 0, 0.3)',
                          border: quest.completed 
                            ? '1px solid #00ff00' 
                            : '1px solid #ffa500',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: quest.completed ? '#00ff00' : '#ffa500'
                        }}>
                          {quest.completed 
                            ? '✅ Выполнено' 
                            : '⏳ Ручная проверка'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Если все задания выполнены */}
              {!showCompleted && basicQuests.length === 0 && partnerQuests.length === 0 && manualQuests.length === 0 && (
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
                  <h3 style={{ color: '#00ff00', marginBottom: '10px' }}>
                    Все задания выполнены!
                  </h3>
                  <p style={{ color: '#ccc' }}>
                    Отличная работа! Возвращайтесь позже за новыми заданиями.
                  </p>
                </div>
              )}

              {/* Рекламные квесты (старая система) */}
              <div>
                <h3 style={{ 
                  color: colorStyle, 
                  fontSize: '1.5rem', 
                  marginBottom: '20px',
                  textShadow: `0 0 10px ${colorStyle}`
                }}>
                  📺 Просмотр рекламы ({(player?.ad_views || 0)}/5)
                </h3>
                {Array(5).fill(null).map((_, index) => {
                  const isCompleted = (player?.ad_views || 0) > index;
                  const isAvailable = (player?.ad_views || 0) === index;
                  
                  // Скрываем выполненные рекламные задания если showCompleted = false
                  if (!showCompleted && isCompleted) return null;
                  
                  return (
                    <div
                      key={index}
                      style={{
                        margin: '15px auto',
                        padding: '20px',
                        maxWidth: '500px',
                        background: isCompleted 
                          ? 'rgba(0, 255, 0, 0.2)' 
                          : 'rgba(0, 0, 0, 0.3)',
                        border: `2px solid ${colorStyle}`,
                        borderRadius: '15px',
                        boxShadow: `0 0 20px ${colorStyle}30`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'left' }}>
                          <h4 style={{ color: colorStyle, marginBottom: '5px' }}>Просмотр рекламы #{index + 1}</h4>
                          <p style={{ color: '#ccc', margin: 0 }}>
                            🎁 Награда: 10 CCC
                          </p>
                        </div>
                        <div>
                          {isCompleted ? (
                            <div style={{
                              padding: '8px 16px',
                              borderRadius: '20px',
                              background: 'rgba(0, 255, 0, 0.3)',
                              border: '1px solid #00ff00',
                              fontSize: '0.9rem',
                              fontWeight: 'bold'
                            }}>
                              ✅ Выполнено
                            </div>
                          ) : isAvailable ? (
                            <button
                              onClick={watchAd}
                              style={{
                                padding: '10px 20px',
                                background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                                border: `2px solid ${colorStyle}`,
                                borderRadius: '12px',
                                boxShadow: `0 0 15px ${colorStyle}`,
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontWeight: 'bold'
                              }}
                            >
                              📺 {t('watch') || 'Смотреть'}
                            </button>
                          ) : (
                            <div style={{
                              padding: '8px 16px',
                              borderRadius: '20px',
                              background: 'rgba(128, 128, 128, 0.3)',
                              border: '1px solid #888',
                              fontSize: '0.9rem',
                              color: '#888'
                            }}>
                              Заблокировано
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Информация */}
          <div style={{
            margin: '30px auto 0',
            padding: '20px',
            maxWidth: '500px',
            background: 'rgba(255, 165, 0, 0.1)',
            border: '1px solid #ffa500',
            borderRadius: '15px',
            boxShadow: '0 0 15px #ffa50030'
          }}>
            <h4 style={{ color: '#ffa500', marginBottom: '10px' }}>ℹ️ Информация</h4>
            <p style={{ color: '#ccc', fontSize: '0.9rem', margin: 0, lineHeight: '1.4' }}>
              • Партнерские задания выполняются один раз<br/>
              • После клика "Перейти" подождите 30 сек и нажмите "Получить награду"<br/>
              • Реклама: лимит 5 раз в день, сброс каждые 24 часа<br/>
              • Задания с ручной проверкой требуют подтверждения администратора
            </p>
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default QuestsPage;