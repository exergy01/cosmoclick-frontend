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
  id: number;
  name: string;
  reward_cs: number;
  completed: boolean;
}

interface AdQuestData {
  id: number;
  name: string;
  reward_ccc: number;
  completed: boolean;
}

const initialQuests: QuestData[] = [
  { id: 1, name: 'quest_1', reward_cs: 5, completed: false },
  { id: 2, name: 'quest_2', reward_cs: 5, completed: false },
  { id: 3, name: 'quest_3', reward_cs: 5, completed: false }
];

const adQuests: AdQuestData[] = Array(5)
  .fill(null)
  .map((_, i) => ({
    id: i + 4,
    name: 'watch_ad',
    reward_ccc: 10,
    completed: false
  }));

const QuestsPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, setPlayer, currentSystem } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [quests, setQuests] = useState<any[]>([]);
  const [totalPerHour, setTotalPerHour] = useState({ totalCccPerHour: 0, totalCsPerHour: 0 });

  const calculateTotalPerHour = useCallback(async () => {
    if (!player || !player.drones || !player.telegram_id) return { ccc: 0, cs: 0, ton: 0 };
    try {
      const dronesData = await axios.get(`${apiUrl}/api/shop/drones/${player.telegram_id}`).then(res => res.data);
      const totalCccPerHour = player.drones.reduce((sum: number, d: any) => {
        const drone = dronesData.find((item: any) => item.id === d.id && item.system === d.system);
        return sum + (drone?.cccPerDay ? drone.cccPerDay / 24 : 0);
      }, 0);
      return { ccc: Number(totalCccPerHour.toFixed(5)), cs: 0, ton: 0 };
    } catch (err) {
      console.error('Error fetching drones for total per hour:', err);
      return { ccc: 0, cs: 0, ton: 0 };
    }
  }, [player?.drones, player?.telegram_id]);

  useEffect(() => {
    const fetchTotalPerHour = async () => {
      const { ccc: totalCccPerHour } = await calculateTotalPerHour();
      setTotalPerHour({ totalCccPerHour, totalCsPerHour: 0 });
    };
    fetchTotalPerHour();
  }, [calculateTotalPerHour]);

  const watchAd = async (questId: number) => {
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
      setQuests([
        ...quests,
        {
          quest_id: questId,
          telegram_id: player?.telegram_id,
          completed: true,
          reward_cs: 0,
          timestamp: new Date().toISOString()
        }
      ]);
      alert(t('ad_watched'));
    } catch (err: any) {
      alert(t('ad_error', { error: err.response?.data?.error || err.message }));
    }
  };

  const colorStyle = player?.color || '#00f0ff';

  if (!player) {
    return <div>Loading...</div>;
  }

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

      <div style={{ marginTop: '150px', paddingBottom: '130px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2.5rem', 
            marginBottom: '30px'
          }}>
            🎯 {t('quests')}
          </h2>

          {/* Основные квесты */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
              color: colorStyle, 
              fontSize: '1.5rem', 
              marginBottom: '20px',
              textShadow: `0 0 10px ${colorStyle}`
            }}>
              📋 Основные задания
            </h3>
            {initialQuests.map(quest => (
              <div
                key={quest.id}
                style={{
                  margin: '15px auto',
                  padding: '20px',
                  maxWidth: '500px',
                  background: quests.find((q: any) => q.quest_id === quest.id)?.completed 
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
                    <h4 style={{ color: colorStyle, marginBottom: '5px' }}>{t(quest.name)}</h4>
                    <p style={{ color: '#ccc', margin: 0 }}>
                      🎁 Награда: {quest.reward_cs} CS
                    </p>
                  </div>
                  <div style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: quests.find((q: any) => q.quest_id === quest.id)?.completed 
                      ? 'rgba(0, 255, 0, 0.3)' 
                      : 'rgba(255, 165, 0, 0.3)',
                    border: quests.find((q: any) => q.quest_id === quest.id)?.completed 
                      ? '1px solid #00ff00' 
                      : '1px solid #ffa500',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}>
                    {quests.find((q: any) => q.quest_id === quest.id)?.completed 
                      ? '✅ Выполнено' 
                      : '⏳ В процессе'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Рекламные квесты */}
          <div>
            <h3 style={{ 
              color: colorStyle, 
              fontSize: '1.5rem', 
              marginBottom: '20px',
              textShadow: `0 0 10px ${colorStyle}`
            }}>
              📺 Просмотр рекламы ({(player?.ad_views || 0)}/5)
            </h3>
            {adQuests.map(quest => {
              const isCompleted = (player?.ad_views || 0) >= 5 || quests.find((q: any) => q.quest_id === quest.id)?.completed;
              const isAvailable = (player?.ad_views || 0) < 5 && !quests.find((q: any) => q.quest_id === quest.id)?.completed;
              
              return (
                <div
                  key={quest.id}
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
                      <h4 style={{ color: colorStyle, marginBottom: '5px' }}>{t(quest.name)}</h4>
                      <p style={{ color: '#ccc', margin: 0 }}>
                        🎁 Награда: {quest.reward_ccc} CCC
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
                          onClick={() => watchAd(quest.id)}
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
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = `0 0 25px ${colorStyle}`;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = `0 0 15px ${colorStyle}`;
                          }}
                        >
                          📺 {t('watch')}
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
                          Лимит исчерпан
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Информация о сбросе */}
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
              • Лимит просмотра рекламы: 5 раз в день<br/>
              • Сброс лимита происходит каждые 24 часа<br/>
              • Основные задания выполняются автоматически по мере игры
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