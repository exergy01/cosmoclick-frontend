import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';
import { usePlayer } from '../context/PlayerContext';

interface Quest {
  id: number;
  title: string;
  description: string;
  reward_type: string;
  reward_amount: number;
  required_amount: number;
  type: string;
  is_daily: boolean;
  metadata: {
    channel?: string;
    message_id?: number;
    reaction?: string;
    bot?: string;
    link?: string;
    ref?: string;
    ad_slot?: number;
  };
}

const QuestsPage: React.FC = () => {
  const { player, setPlayer, quests: userQuests, setQuests } = usePlayer();
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com'
    : 'http://localhost:5000';

  // Загрузка всех квестов и квестов пользователя
  useEffect(() => {
    const fetchQuests = async () => {
      if (!player) {
        setErrorMessage('Игрок не загружен');
        setLoading(false);
        return;
      }

      try {
        const questsPromise = axios.get(`${apiUrl}/api/quests`);
        const userQuestsPromise = axios.get(`${apiUrl}/api/user-quests/${player.telegram_id}`);

        const [questsRes, userQuestsRes] = await Promise.all([questsPromise, userQuestsPromise]);

        if (!Array.isArray(questsRes.data)) {
          throw new Error('Неверный формат данных всех квестов');
        }
        if (!Array.isArray(userQuestsRes.data)) {
          throw new Error('Неверный формат данных квестов пользователя');
        }

        const quests = questsRes.data;
        setAllQuests(quests);
        // Объединяем userQuests с metadata из allQuests
        const enrichedUserQuests = userQuestsRes.data.map((uq: any) => {
          const quest = quests.find((q: Quest) => q.id === uq.quest_id);
          return {
            ...uq,
            metadata: quest?.metadata || {},
          };
        });
        setQuests(enrichedUserQuests);
      } catch (error: any) {
        const message = error.response
          ? `Ошибка ${error.response.status} при запросе ${error.config.url}: ${error.response.data.error || error.message}${error.response.data.details ? ` (${error.response.data.details})` : ''}`
          : `Ошибка сети: ${error.message}`;
        console.error('Ошибка загрузки квестов:', message);
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, [player, setQuests, apiUrl]);

  // Взять или завершить квест
  const handleQuestAction = async (questId: number) => {
    if (!player) {
      alert('Игрок не загружен!');
      return;
    }

    try {
      const existingUserQuest = userQuests.find(uq => uq.quest_id === questId);
      if (existingUserQuest) {
        // Если квест уже взят, попытка завершить
        const response = await axios.post(`${apiUrl}/api/user-quests/complete`, {
          telegramId: player.telegram_id,
          questId,
        });

        const { updatedPlayer, updatedUserQuest } = response.data;
        setPlayer({
          ...player,
          ccc: parseFloat(updatedPlayer.ccc),
          cs: parseFloat(updatedPlayer.cs),
          ton: parseFloat(updatedPlayer.ton),
        });
        setQuests(userQuests.map(uq =>
          uq.quest_id === questId ? {
            ...uq,
            status: updatedUserQuest.status,
            progress: updatedUserQuest.progress,
            metadata: uq.metadata || {},
          } : uq
        ));
        alert(`🎉 ${response.data.message}`);
      } else {
        // Взять новый квест
        const response = await axios.post(`${apiUrl}/api/user-quests`, {
          telegramId: player.telegram_id,
          questId,
        });

        const newUserQuest = response.data;
        const quest = allQuests.find(q => q.id === questId);
        setQuests([...userQuests, {
          ...newUserQuest,
          metadata: quest?.metadata || {},
        }]);
        alert('🎯 Квест взят!');
      }
    } catch (error: any) {
      console.error('Ошибка обработки квеста:', error);
      alert(`❌ Ошибка: ${error.response?.data?.error || error.message}`);
    }
  };

  // Просмотр всех реклам сразу
  const handleViewAllAds = async () => {
    if (!player) {
      alert('Игрок не загружен!');
      return;
    }

    try {
      const adQuests = userQuests.filter(uq => uq.type === 'view_ad' && uq.status === 'active');
      if (adQuests.length === 0) {
        alert('Нет доступных рекламных квестов!');
        return;
      }

      // Имитация просмотра всех реклам
      for (const quest of adQuests) {
        const adSlot = quest.metadata?.ad_slot;
        if (adSlot !== undefined) {
          await axios.post(`${apiUrl}/ad_viewed`, {
            userId: player.telegram_id,
            adSlot,
          });
          await handleQuestAction(quest.quest_id);
        }
      }
      alert('🎉 Все доступные рекламы просмотрены!');
    } catch (error: any) {
      console.error('Ошибка просмотра всех реклам:', error);
      alert(`❌ Ошибка: ${error.message}`);
    }
  };

  // Определить доступные квесты
  const availableQuests = allQuests.filter(
    (q: Quest) => !userQuests.some(uq => uq.quest_id === q.id)
  );

  return (
    <div style={{
      backgroundImage: 'url(/backgrounds/cosmo-bg-1.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      backgroundColor: '#000022',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      color: '#00f0ff'
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '90px 10px 130px 10px'
      }}>
        <TopBar />
        <div style={{ marginTop: '10px', width: '90%' }}>
          {loading ? (
            <p style={{ textAlign: 'center', fontSize: '16px' }}>Загрузка...</p>
          ) : errorMessage ? (
            <p style={{ textAlign: 'center', fontSize: '16px', color: '#ff5555' }}>{errorMessage}</p>
          ) : (
            <>
              {/* Доступные квесты */}
              {availableQuests.length > 0 && (
                <div style={{
                  padding: '10px',
                  marginBottom: '20px',
                  backgroundColor: 'rgba(0, 0, 34, 0.8)'
                }}>
                  <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>Доступные квесты</h3>
                  {availableQuests.map((quest: Quest) => (
                    <div key={quest.id} style={{
                      backgroundColor: 'rgba(0, 0, 34, 0.9)',
                      border: '1px solid #00f0ff',
                      borderRadius: '8px',
                      padding: '8px',
                      marginBottom: '8px',
                      boxShadow: '0 0 5px #00f0ff'
                    }}>
                      <h4 style={{ fontSize: '16px', marginBottom: '5px', fontWeight: 'bold' }}>{quest.title}</h4>
                      <p style={{ fontSize: '14px', marginBottom: '5px' }}>{quest.description}</p>
                      {quest.type === 'subscribe_channel' && player && (
                        <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                          <a href={`https://t.me${quest.metadata.channel}?start=${quest.metadata.ref}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
                            Перейти в канал
                          </a>
                        </p>
                      )}
                      {quest.type === 'react_message' && player && (
                        <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                          <a href={`https://t.me${quest.metadata.channel}/${quest.metadata.message_id}?ref=${quest.metadata.ref}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
                            Поставить реакцию
                          </a>
                        </p>
                      )}
                      {quest.type === 'subscribe_app' && player && (
                        <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                          <a href={`https://t.me${quest.metadata.bot}?start=${quest.metadata.ref}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
                            Запустить бот
                          </a>
                        </p>
                      )}
                      {quest.type === 'visit_link' && player && (
                        <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                          <a href={`${quest.metadata.link}?ref=${quest.metadata.ref}&userId=${player.telegram_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
                            Перейти на сайт
                          </a>
                        </p>
                      )}
                      <button
                        onClick={() => handleQuestAction(quest.id)}
                        style={{
                          backgroundColor: 'rgba(0, 240, 255, 0.2)',
                          border: '2px solid #00f0ff',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          color: '#00f0ff',
                          fontWeight: 'bold',
                          fontSize: '14px',
                          boxShadow: '0 0 6px #00f0ff',
                          cursor: 'pointer',
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>✅ Взять</span>
                        <span>🎁 {quest.reward_amount} {quest.reward_type.toUpperCase()}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Активные и завершённые квесты */}
              {userQuests.length > 0 && (
                <div style={{
                  padding: '10px',
                  marginBottom: '20px',
                  backgroundColor: 'rgba(0, 0, 34, 0.8)'
                }}>
                  <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>Ваши квесты</h3>
                  {userQuests.map(quest => (
                    <div key={quest.id} style={{
                      backgroundColor: 'rgba(0, 0, 34, 0.9)',
                      border: '1px solid #00f0ff',
                      borderRadius: '8px',
                      padding: '8px',
                      marginBottom: '8px',
                      boxShadow: '0 0 5px #00f0ff'
                    }}>
                      <h4 style={{ fontSize: '16px', marginBottom: '5px' }}>{quest.title}</h4>
                      <p style={{ fontSize: '14px', marginBottom: '5px' }}>{quest.description}</p>
                      <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                        Награда: {quest.reward_amount} {quest.reward_type.toUpperCase()}
                      </p>
                      {quest.type === 'view_ad' && (
                        <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                          Прогресс: {quest.progress}/{quest.required_amount} (ежедневно)
                        </p>
                      )}
                      <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                        Статус: {quest.status === 'active' ? 'Активен' : 'Завершён'}
                      </p>
                      {quest.status === 'active' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {quest.type === 'subscribe_channel' && player && quest.metadata?.channel && quest.metadata?.ref && (
                            <>
                              <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                                <a href={`https://t.me${quest.metadata.channel}?start=${quest.metadata.ref}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
                                  Перейти в канал
                                </a>
                              </p>
                              <button
                                onClick={() => handleQuestAction(quest.quest_id)}
                                style={{
                                  backgroundColor: 'rgba(0, 240, 255, 0.2)',
                                  border: '2px solid #00f0ff',
                                  borderRadius: '8px',
                                  padding: '8px 16px',
                                  color: '#00f0ff',
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  boxShadow: '0 0 6px #00f0ff',
                                  cursor: 'pointer',
                                  flex: 1
                                }}
                              >
                                Завершить
                              </button>
                            </>
                          )}
                          {quest.type === 'react_message' && player && quest.metadata?.channel && quest.metadata?.message_id && quest.metadata?.ref && (
                            <>
                              <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                                <a href={`https://t.me${quest.metadata.channel}/${quest.metadata.message_id}?ref=${quest.metadata.ref}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
                                  Поставить реакцию
                                </a>
                              </p>
                              <button
                                onClick={() => handleQuestAction(quest.quest_id)}
                                style={{
                                  backgroundColor: 'rgba(0, 240, 255, 0.2)',
                                  border: '2px solid #00f0ff',
                                  borderRadius: '8px',
                                  padding: '8px 16px',
                                  color: '#00f0ff',
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  boxShadow: '0 0 6px #00f0ff',
                                  cursor: 'pointer',
                                  flex: 1
                                }}
                              >
                                Завершить
                              </button>
                            </>
                          )}
                          {quest.type === 'subscribe_app' && player && quest.metadata?.bot && quest.metadata?.ref && (
                            <>
                              <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                                <a href={`https://t.me${quest.metadata.bot}?start=${quest.metadata.ref}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
                                  Запустить бот
                                </a>
                              </p>
                              <button
                                onClick={() => handleQuestAction(quest.quest_id)}
                                style={{
                                  backgroundColor: 'rgba(0, 240, 255, 0.2)',
                                  border: '2px solid #00f0ff',
                                  borderRadius: '8px',
                                  padding: '8px 16px',
                                  color: '#00f0ff',
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  boxShadow: '0 0 6px #00f0ff',
                                  cursor: 'pointer',
                                  flex: 1
                                }}
                              >
                                Завершить
                              </button>
                            </>
                          )}
                          {quest.type === 'visit_link' && player && quest.metadata?.link && quest.metadata?.ref && (
                            <>
                              <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                                <a href={`${quest.metadata.link}?ref=${quest.metadata.ref}&userId=${player.telegram_id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
                                  Перейти на сайт
                                </a>
                              </p>
                              <button
                                onClick={() => handleQuestAction(quest.quest_id)}
                                style={{
                                  backgroundColor: 'rgba(0, 240, 255, 0.2)',
                                  border: '2px solid #00f0ff',
                                  borderRadius: '8px',
                                  padding: '8px 16px',
                                  color: '#00f0ff',
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  boxShadow: '0 0 6px #00f0ff',
                                  cursor: 'pointer',
                                  flex: 1
                                }}
                              >
                                Завершить
                              </button>
                            </>
                          )}
                          {quest.type === 'view_ad' && (
                            <button
                              onClick={() => handleQuestAction(quest.quest_id)}
                              style={{
                                backgroundColor: 'rgba(0, 240, 255, 0.2)',
                                border: '2px solid #00f0ff',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                color: '#00f0ff',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                boxShadow: '0 0 6px #00f0ff',
                                cursor: 'pointer',
                                flex: 1
                              }}
                            >
                              Просмотреть
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Кнопка для просмотра всех реклам */}
                  {userQuests.some(uq => uq.type === 'view_ad' && uq.status === 'active') && (
                    <button
                      onClick={handleViewAllAds}
                      style={{
                        backgroundColor: 'rgba(0, 240, 255, 0.2)',
                        border: '2px solid #00f0ff',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: '#00f0ff',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        boxShadow: '0 0 6px #00f0ff',
                        cursor: 'pointer',
                        width: '100%',
                        marginTop: '10px'
                      }}
                    >
                      Просмотреть все рекламы
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: 'transparent',
        boxShadow: 'none',
        borderTop: 'none'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '5px 0',
          backgroundColor: 'rgba(0, 0, 34, 0.9)'
        }}>
          <MainMenu />
        </div>
      </div>
    </div>
  );
};

export default QuestsPage;