import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';
import BottomMenu from '../components/BottomMenu';
import axios from 'axios';

interface Quest {
  id: number;
  title: string;
  description: string;
  reward: number;
}

const QuestsPage: React.FC = () => {
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const response = await axios.get('/api/quests');
        setQuests(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке заданий:', error);
      }
    };

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
      {/* Верхняя прокручиваемая часть */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        paddingTop: '100px', // 👉 добавили отступ под TopBar
        paddingBottom: '120px'
      }}>
        <TopBar />

        <h2 style={{ marginTop: '20px', marginBottom: '20px' }}>🎯 Задания</h2>

        {quests.map((quest) => (
          <div key={quest.id} style={{
            border: '2px solid #00f0ff',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px',
            width: '90%',
            backgroundColor: 'rgba(0, 0, 34, 0.8)',
            boxShadow: '0 0 12px #00f0ff'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{quest.title}</h3>
            <p style={{ margin: '0 0 8px 0' }}>{quest.description}</p>
            <strong>Награда: ✨ {quest.reward} CS</strong>
          </div>
        ))}
      </div>

      {/* Нижние зафиксированные меню */}
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
