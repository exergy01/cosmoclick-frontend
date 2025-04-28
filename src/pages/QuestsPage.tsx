import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';
import BottomMenu from '../components/BottomMenu';

interface Quest {
  id: number;
  title: string;
  description: string;
  reward_ccc: number;
  reward_cs: number;
  reward_ton: number;
}

const QuestsPage: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com/api/quests'
    : 'http://localhost:5000/api/quests';

  const fetchQuests = async () => {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (Array.isArray(data)) {
        setQuests(data);
      } else {
        console.error('Неверный формат данных:', data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке заданий:', error);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

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
  padding: '90px 10px 130px 10px' // 👉 добавили отступ сверху (70px)
}}>
        <TopBar />
        <div style={{ marginTop: '10px', width: '90%' }}>
          {quests.length > 0 ? quests.map((quest) => (
            <div key={quest.id} style={{
              backgroundColor: 'rgba(0, 0, 34, 0.8)',
              border: '2px solid #00f0ff',
              borderRadius: '12px',
              padding: '10px',
              marginBottom: '10px',
              boxShadow: '0 0 10px #00f0ff'
            }}>
              <h3 style={{ marginBottom: '5px', fontSize: '18px' }}>{quest.title}</h3>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>{quest.description}</p>
              <p style={{ fontWeight: 'bold', fontSize: '16px' }}>
                🎁 Награды:
                {quest.reward_ccc > 0 && ` ${quest.reward_ccc} CCC`}
                {quest.reward_cs > 0 && ` | ${quest.reward_cs} CS`}
                {quest.reward_ton > 0 && ` | ${quest.reward_ton} TON`}
              </p>
            </div>
          )) : (
            <p>Загрузка заданий...</p>
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
          padding: '5px 0',
          backgroundColor: 'rgba(0, 0, 34, 0.9)'
        }}>
        </div>
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
