import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';
import axios from 'axios';

interface Quest {
  id: number;
  title: string;
  description: string;
  reward_cs: number;
  reward_ccc: number;
  reward_ton: number;
}

const QuestsPage: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const response = await axios.get('https://cosmoclick-backend.onrender.com/api/quests');
        setQuests(response.data);
      } catch (error) {
        console.error('Ошибка загрузки заданий:', error);
      }
    };

    fetchQuests();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000022',
      backgroundImage: 'url("/cosmo-bg-1.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <TopBar />
      
      <div style={{ marginTop: '20px', width: '90%' }}>
        {quests.map((quest) => (
          <div
            key={quest.id}
            style={{
              backgroundColor: 'rgba(0, 0, 34, 0.8)',
              border: '2px solid #00f0ff',
              borderRadius: '12px',
              color: '#00f0ff',
              padding: '14px',
              marginBottom: '20px',
              boxShadow: '0 0 12px #00f0ff'
            }}
          >
            <h3>{quest.title}</h3>
            <p>{quest.description}</p>
            <p>🏅 Награда: {quest.reward_cs} ✨ | {quest.reward_ccc} 💠 | {quest.reward_ton} 💎</p>
          </div>
        ))}
      </div>

      <MainMenu />
    </div>
  );
};

export default QuestsPage;
