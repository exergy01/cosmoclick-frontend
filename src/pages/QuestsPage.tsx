import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { droneData } from '../data/shopDataSystem1';

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

const QuestsPage = () => {
  const { t } = useTranslation();
  const { player, setPlayer, quests, setQuests, currentSystem } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  if (!player) {
    return <div>Loading...</div>;
  }

  const watchAd = async (questId: number) => {
    if ((player.ad_views || 0) >= 5) return;
    try {
      const updatedPlayer = {
        ...player,
        ccc: Number(player.ccc) + 10,
        ad_views: (player.ad_views || 0) + 1,
        last_ad_reset: player.last_ad_reset || new Date().toISOString()
      };
      const res = await axios.put(`${apiUrl}/api/player/${player.telegram_id}`, updatedPlayer);
      setPlayer(res.data);
      setQuests([
        ...quests,
        {
          quest_id: questId,
          telegram_id: player.telegram_id,
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

  const calculatePerHour = () => {
    if (!player?.drones || player.drones.length === 0) {
      return '0.00';
    }
    const totalCccPerDay = player.drones.reduce(
      (sum: number, d: { id: number; system: number }) => {
        const drone = droneData.find(item => item.id === d.id && item.system === d.system);
        return sum + (drone?.cccPerDay || 0);
      },
      0
    );
    return (totalCccPerDay / 24).toFixed(2);
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
      <div
        style={{
          width: '93%',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '3px',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '2px solid #00f0ff',
          borderRadius: '10px',
          boxShadow: '0 0 20px #00f0ff',
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '1.1rem' }}>💠 {t('ccc')}: {(typeof player.ccc === 'number' ? player.ccc : parseFloat(player.ccc || '0')).toFixed(2)}</p>
          <p style={{ fontSize: '1.1rem' }}>📈 {t('per_hour', { amount: calculatePerHour() })}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '1.1rem' }}>✨ {t('cs')}: {(typeof player.cs === 'number' ? player.cs : parseFloat(player.cs || '0')).toFixed(2)}</p>
          <p style={{ fontSize: '1.1rem' }}>💎 {t('ton')}: {(typeof player.ton === 'number' ? player.ton : parseFloat(player.ton || '0')).toFixed(8)}</p>
        </div>
      </div>

      <div style={{ marginTop: '110px', paddingBottom: '130px', flex: 1 }}>
        {initialQuests.map(quest => (
          <div
            key={quest.id}
            style={{
              padding: '10px',
              background: quests.find(q => q.quest_id === quest.id)?.completed ? '#333' : 'rgba(0, 0, 0, 0.5)',
              border: '2px solid #00f0ff',
              borderRadius: '10px',
              boxShadow: '0 0 10px #00f0ff',
              margin: '5px 0'
            }}
          >
            <p>{t(quest.name)}</p>
            <p>
              {t('reward')}: {quest.reward_cs} CS
            </p>
            <p>{quests.find(q => q.quest_id === quest.id)?.completed ? t('completed') : t('in_progress')}</p>
          </div>
        ))}
        {adQuests.map(quest => (
          <div
            key={quest.id}
            style={{
              padding: '10px',
              background:
                (player?.ad_views || 0) >= 5 || quests.find(q => q.quest_id === quest.id)?.completed
                  ? '#333'
                  : 'rgba(0, 0, 0, 0.5)',
              border: '2px solid #00f0ff',
              borderRadius: '10px',
              boxShadow: '0 0 10px #00f0ff',
              margin: '5px 0'
            }}
          >
            <p>{t(quest.name)}</p>
            <p>
              {t('reward')}: {quest.reward_ccc} CCC
            </p>
            {(player?.ad_views || 0) >= 5 || quests.find(q => q.quest_id === quest.id)?.completed ? (
              <p>{t('completed')}</p>
            ) : (
              <button
                onClick={() => watchAd(quest.id)}
                style={{
                  padding: '5px 10px',
                  background: 'rgba(0, 240, 255, 0.3)',
                  border: '2px solid #00f0ff',
                  borderRadius: '5px',
                  color: '#000',
                  cursor: 'pointer'
                }}
              >
                {t('watch')}
              </button>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          width: '93%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '10px',
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          {[
            { path: '/attack', icon: '⚔️', label: t('attack') },
            { path: '/exchange', icon: '🔄', label: t('exchange') },
            { path: '/quests', icon: '🎯', label: t('quests') }
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                padding: '8px 5px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: location.pathname === path ? '4px solid #00f0ff' : '2px solid #00f0ff',
                borderRadius: '15px',
                boxShadow: location.pathname === path ? '0 0 10px #00f0ff, inset 0 0 10px #00f0ff' : '0 0 10px #00f0ff',
                color: '#fff',
                fontSize: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxSizing: 'border-box',
                height: 'auto'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          {[
            { path: '/games', icon: '🎮' },
            { path: '/wallet', icon: '💳' },
            { path: '/main', icon: '🚀' },
            { path: '/ref', icon: '👥' },
            { path: '/alphabet', icon: '📖' }
          ].map(({ path, icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                padding: '8px 5px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: location.pathname === path ? '4px solid #00f0ff' : '2px solid #00f0ff',
                borderRadius: '15px',
                boxShadow: location.pathname === path ? '0 0 10px #00f0ff, inset 0 0 10px #00f0ff' : '0 0 10px #00f0ff',
                color: '#fff',
                fontSize: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxSizing: 'border-box',
                height: 'auto'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestsPage;