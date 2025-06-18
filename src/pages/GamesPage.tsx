import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const GamesPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [totalPerHour, setTotalPerHour] = useState({ totalCccPerHour: 0, totalCsPerHour: 0 });

  const calculateTotalPerHour = useCallback(async () => {
    if (!player || !player.drones || !player.telegram_id) return { ccc: 0, cs: 0, ton: 0 };
    try {
      const dronesData = await axios.get(`${API_URL}/api/shop/drones/${player.telegram_id}`).then(res => res.data);
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

  const colorStyle = player?.color || '#00f0ff';

  const gameCards = [
    {
      id: 1,
      title: 'Космический Кликер',
      description: 'Улучшенная версия основной игры с бонусами',
      icon: '🚀',
      status: 'coming_soon',
      color: '#ff6b6b'
    },
    {
      id: 2,
      title: 'Битва Дронов',
      description: 'PvP сражения между игроками',
      icon: '⚔️',
      status: 'coming_soon',
      color: '#4ecdc4'
    },
    {
      id: 3,
      title: 'Астероидный Майнер',
      description: 'Мини-игра для добычи дополнительных ресурсов',
      icon: '⛏️',
      status: 'coming_soon',
      color: '#45b7d1'
    },
    {
      id: 4,
      title: 'Космическая Рулетка',
      description: 'Попытайте удачу и выиграйте призы',
      icon: '🎰',
      status: 'coming_soon',
      color: '#96ceb4'
    },
    {
      id: 5,
      title: 'Турниры',
      description: 'Еженедельные соревнования с крупными призами',
      icon: '🏆',
      status: 'coming_soon',
      color: '#feca57'
    },
    {
      id: 6,
      title: 'Квесты',
      description: 'Ежедневные задания и достижения',
      icon: '🎯',
      status: 'coming_soon',
      color: '#ff9ff3'
    }
  ];

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

      {/* Основной контент */}
      <div style={{ marginTop: '150px', paddingBottom: '130px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2.5rem', 
            marginBottom: '30px'
          }}>
            🎮 {t('games')}
          </h2>

          {/* Сетка игр */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {gameCards.map((game) => (
              <div
                key={game.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: `2px solid ${game.color}`,
                  borderRadius: '20px',
                  padding: '25px',
                  boxShadow: `0 0 20px ${game.color}30`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 10px 30px ${game.color}50`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 0 20px ${game.color}30`;
                }}
              >
                {/* Статус "Скоро" */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'rgba(255, 165, 0, 0.8)',
                  color: '#000',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  🚧 Скоро
                </div>

                {/* Иконка игры */}
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '15px',
                  filter: `drop-shadow(0 0 10px ${game.color})`
                }}>
                  {game.icon}
                </div>

                {/* Название */}
                <h3 style={{
                  color: game.color,
                  textShadow: `0 0 10px ${game.color}`,
                  fontSize: '1.3rem',
                  marginBottom: '10px',
                  fontWeight: 'bold'
                }}>
                  {game.title}
                </h3>

                {/* Описание */}
                <p style={{
                  color: '#ccc',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  marginBottom: '15px'
                }}>
                  {game.description}
                </p>

                {/* Кнопка */}
                <button
                  disabled
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(128, 128, 128, 0.3)',
                    border: '1px solid #888',
                    borderRadius: '10px',
                    color: '#888',
                    cursor: 'not-allowed',
                    fontSize: '0.9rem'
                  }}
                >
                  В разработке
                </button>
              </div>
            ))}
          </div>

          {/* Информационный блок */}
          <div style={{
            margin: '40px auto 0',
            padding: '25px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '20px',
            boxShadow: `0 0 30px ${colorStyle}30`,
            maxWidth: '600px'
          }}>
            <h3 style={{ 
              color: colorStyle, 
              marginBottom: '15px', 
              fontSize: '1.5rem',
              textShadow: `0 0 10px ${colorStyle}`
            }}>
              🌟 Что вас ждет?
            </h3>
            <div style={{ textAlign: 'left', lineHeight: '1.6', color: '#ccc' }}>
              <p><strong style={{ color: colorStyle }}>🎲 Разнообразие:</strong> 6+ уникальных мини-игр</p>
              <p><strong style={{ color: colorStyle }}>🏆 Турниры:</strong> Еженедельные соревнования</p>
              <p><strong style={{ color: colorStyle }}>💎 Награды:</strong> Эксклюзивные призы и бонусы</p>
              <p><strong style={{ color: colorStyle }}>👥 Мультиплеер:</strong> PvP сражения с друзьями</p>
              <p><strong style={{ color: colorStyle }}>📈 Прогресс:</strong> Рейтинги и достижения</p>
            </div>
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(255, 165, 0, 0.1)',
              borderRadius: '10px',
              border: '1px solid #ffa500'
            }}>
              <p style={{ color: '#ffa500', fontSize: '0.9rem', margin: 0 }}>
                🚀 <strong>Релиз ожидается в ближайшие недели!</strong><br/>
                Следите за обновлениями в игре.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default GamesPage;