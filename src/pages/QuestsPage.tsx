import React, { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';

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

  const completeQuest = async (questId: number) => {
    const completeUrl = process.env.NODE_ENV === 'production'
      ? 'https://cosmoclick-backend.onrender.com/api/user-quests/complete'
      : 'http://localhost:5000/api/user-quests/complete';

    try {
      const response = await fetch(completeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1, // 👉 пока тестово userId = 1
          questId
        })
      });

      if (response.ok) {
        alert('🎯 Задание успешно выполнено!');
      } else {
        alert('❌ Ошибка при выполнении задания!');
      }
    } catch (error) {
      console.error('Ошибка при завершении задания:', error);
      alert('❌ Ошибка при завершении задания!');
    }
  };

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
        padding: '90px 10px 130px 10px'
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
              </p>
              <button
  onClick={() => completeQuest(quest.id)}
  style={{
    marginTop: '8px',
    backgroundColor: 'rgba(0, 240, 255, 0.2)', // 🔵 Спокойный полупрозрачный фон
    border: '2px solid #00f0ff',
    borderRadius: '8px',
    padding: '8px 16px',
    color: '#00f0ff',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 0 6px #00f0ff',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: '10px'
  }}
>
  ✅ Выполнить 
  <span style={{ fontSize: '13px', color: '#00f0ff' }}>
    🎁 Награда:
    {quest.reward_ccc > 0 && ` ${quest.reward_ccc} CCC`}
    {quest.reward_cs > 0 && ` | ${quest.reward_cs} CS`}
    {quest.reward_ton > 0 && ` | ${quest.reward_ton} TON`}
  </span>
</button>
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
