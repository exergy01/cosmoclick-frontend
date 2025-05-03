import React, { useState } from 'react';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';

const AlphabetPage: React.FC = () => {
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');
  const [soundOn, setSoundOn] = useState(true);

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

        <div style={{ width: '96%' }}>
          {/* Информация */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 34, 0.85)',
            border: '2px solid #00f0ff',
            borderRadius: '14px',
            padding: '18px',
            marginBottom: '20px',
            boxShadow: '0 0 12px #00f0ff'
          }}>
            <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>ℹ️ О чём игра CosmoClick?</h3>
            <p style={{ fontSize: '14px', marginBottom: '12px' }}>
              CosmoClick — это космическая экономическая стратегия с элементами idle-геймплея. В роли командира космической станции ты добываешь ресурсы, прокачиваешь оборудование, исследуешь звёздные системы и зарабатываешь внутриигровую валюту. Всё это — прямо в Telegram!
            </p>
            <p style={{ fontWeight: 'bold', marginTop: '12px' }}>🚀 Основные механики:</p>
            <ul style={{ fontSize: '14px', paddingLeft: '22px' }}>
              <li><strong>Звёздные системы</strong>: 7 систем, в каждой — свои дроны, астероиды, экономика. Прогресс — отдельно.</li>
              <li><strong>Дроны</strong>: автоматически добывают CCC/CS/TON, можно покупать и улучшать.</li>
              <li><strong>Астероиды</strong>: источник ресурсов. Требуют покупки. Разрабатываются дронами.</li>
              <li><strong>Карго</strong>: ограничивает объём ресурсов. 5 уровень — автосбор.</li>
              <li><strong>CCC</strong>: основная валюта.</li>
              <li><strong>CS</strong>: валюта для прокачки и покупок, через обмен или задания.</li>
              <li><strong>TON</strong>: редкая награда в поздних системах.</li>
              <li><strong>Обмен</strong>: конвертация CCC ⇄ CS с курсом и комиссией.</li>
              <li><strong>Задания</strong>: ежедневные, дают ССС, ускорения, ресурсы.</li>
              <li><strong>Мини-игры</strong>: от таймеров до PvP.</li>
              <li><strong>WebApp Telegram</strong>: не требует установки.</li>
            </ul>
          </div>

          {/* Настройки */}
          <div style={{
            backgroundColor: 'rgba(0, 0, 34, 0.85)',
            border: '2px solid #00f0ff',
            borderRadius: '14px',
            padding: '18px',
            marginBottom: '32px',
            boxShadow: '0 0 12px #00f0ff'
          }}>
            <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>⚙️ Настройки</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ marginRight: '10px' }}>Язык интерфейса:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #00f0ff' }}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ marginRight: '10px' }}>Звук:</label>
              <button
                onClick={() => setSoundOn(!soundOn)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #00f0ff',
                  backgroundColor: soundOn ? '#004466' : '#220000',
                  color: '#00f0ff'
                }}
              >
                {soundOn ? 'Выключить' : 'Включить'}
              </button>
            </div>
            <div>
              <button
                onClick={() => alert('⚠️ Сброс прогресса пока не реализован')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ff0055',
                  backgroundColor: '#220000',
                  color: '#ff0055'
                }}
              >
                🧨 Сбросить прогресс
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: 'rgba(0, 0, 34, 0.9)' }}>
        <MainMenu />
      </div>
    </div>
  );
};

export default AlphabetPage;
