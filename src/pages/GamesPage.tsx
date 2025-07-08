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

interface GameStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  jackpotAmount: number;
}

const GamesPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    jackpotAmount: 0
  });
  const [loading, setLoading] = useState(true);

  const colorStyle = player?.color || '#00f0ff';

  // Загрузка статистики игр
  useEffect(() => {
    const fetchGameStats = async () => {
      if (!player?.telegram_id) return;
      
      try {
        const response = await axios.get(`${API_URL}/api/games/stats/${player.telegram_id}`);
        setGameStats(response.data);
      } catch (error) {
        console.error('Error fetching game stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameStats();
  }, [player?.telegram_id]);

  // Конфигурация игр
  const gameCards = [
    {
      id: 'tapper',
      title: 'Астероидный Разрушитель',
      description: 'Разрушайте астероиды и получайте CCC! Восстанавливайте энергию.',
      icon: '💥',
      status: 'available',
      color: '#ff6b6b',
      route: '/games/tapper',
      type: 'idle'
    },
    {
      id: 'cosmic_shells',
      title: 'Космические Напёрстки',
      description: 'Найдите галактику под летающими тарелками. Шанс 33%!',
      icon: '🛸',
      status: 'available',
      color: '#4ecdc4',
      route: '/games/cosmic-shells',
      type: 'gambling'
    },
    {
      id: 'orbital_roulette',
      title: 'Орбитальная Рулетка',
      description: 'Запустите планетарную систему и выиграйте до x10!',
      icon: '🌌',
      status: 'available',
      color: '#45b7d1',
      route: '/games/orbital-roulette',
      type: 'gambling'
    },
    {
      id: 'galactic_slots',
      title: 'Космические Слоты',
      description: 'Классические слоты 3x5 с каскадными выигрышами!',
      icon: '🎰',
      status: 'available',
      color: '#96ceb4',
      route: '/games/galactic-slots',
      type: 'gambling'
    },
    {
      id: 'asteroid_slalom',
      title: 'Астероидный Слалом',
      description: 'Пролетите через астероидное поле на максимальной скорости!',
      icon: '🚀',
      status: 'available',
      color: '#feca57',
      route: '/games/asteroid-slalom',
      type: 'skill'
    },
    {
      id: 'cosmic_sniper',
      title: 'Снайпер Астероидов',
      description: 'Защитите станцию от астероидной атаки! Точность решает всё.',
      icon: '🎯',
      status: 'available',
      color: '#ff9ff3',
      route: '/games/cosmic-sniper',
      type: 'skill'
    }
  ];

  const getGameTypeLabel = (type: string) => {
    switch (type) {
      case 'idle': return '⚡ Фарм';
      case 'gambling': return '🎲 Азарт';
      case 'skill': return '🎮 Скилл';
      default: return '🎯 Игра';
    }
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
      {/* Верхняя панель с валютами */}
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />

      {/* Основной контент */}
      <div style={{ marginTop: '100px', paddingBottom: '130px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2.5rem', 
            marginBottom: '20px'
          }}>
          </h2>

          {/* Статистика и джекпот */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '15px',
            maxWidth: '800px',
            margin: '0 auto 30px',
            fontSize: '0.9rem'
          }}>
            {/* Статистика игрока */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${colorStyle}`,
              borderRadius: '15px',
              padding: '15px',
              boxShadow: `0 0 15px ${colorStyle}30`
            }}>
              <h4 style={{ color: colorStyle, margin: '0 0 10px', textShadow: `0 0 10px ${colorStyle}` }}>
                📊 Ваша статистика
              </h4>
              <div style={{ textAlign: 'left', lineHeight: '1.4' }}>
                <p style={{ margin: '5px 0', color: '#ccc' }}>
                  🎯 Игр сыграно: <span style={{ color: '#fff', fontWeight: 'bold' }}>{gameStats.totalGames}</span>
                </p>
                <p style={{ margin: '5px 0', color: '#ccc' }}>
                  🏆 Побед: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{gameStats.totalWins}</span>
                </p>
                <p style={{ margin: '5px 0', color: '#ccc' }}>
                  💀 Поражений: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{gameStats.totalLosses}</span>
                </p>
                <p style={{ margin: '5px 0', color: '#ccc' }}>
                  📈 Винрейт: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                    {gameStats.totalGames > 0 ? Math.round((gameStats.totalWins / gameStats.totalGames) * 100) : 0}%
                  </span>
                </p>
              </div>
            </div>

            {/* Джекпот */}
            <div style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '2px solid #ffd700',
              borderRadius: '15px',
              padding: '15px',
              boxShadow: '0 0 15px #ffd70030',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <h4 style={{ color: '#ffd700', margin: '0 0 10px', textShadow: '0 0 10px #ffd700' }}>
                🎰 ДЖЕКПОТ
              </h4>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#ffd700',
                textShadow: '0 0 15px #ffd700',
                animation: 'pulse 2s infinite'
              }}>
                {gameStats.jackpotAmount.toLocaleString()} CCC
              </div>
              <p style={{ margin: '5px 0 0', color: '#ffed4a', fontSize: '0.8rem' }}>
                💫 Выигрывается в азартных играх!
              </p>
            </div>
          </div>

          {/* Сетка игр */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            maxWidth: '1200px',
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
                {/* Тип игры */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: `${game.color}20`,
                  color: game.color,
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  border: `1px solid ${game.color}`
                }}>
                  {getGameTypeLabel(game.type)}
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
                  marginBottom: '20px'
                }}>
                  {game.description}
                </p>

                {/* Кнопка играть */}
                <button
                  onClick={() => navigate(game.route)}
                  style={{
                    padding: '12px 25px',
                    background: `linear-gradient(45deg, ${game.color}20, ${game.color}40)`,
                    border: `2px solid ${game.color}`,
                    borderRadius: '15px',
                    color: game.color,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    textShadow: `0 0 10px ${game.color}`,
                    transition: 'all 0.3s ease',
                    width: '100%'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `linear-gradient(45deg, ${game.color}40, ${game.color}60)`;
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `linear-gradient(45deg, ${game.color}20, ${game.color}40)`;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  🎮 Играть
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
            maxWidth: '700px'
          }}>
            <h3 style={{ 
              color: colorStyle, 
              marginBottom: '15px', 
              fontSize: '1.5rem',
              textShadow: `0 0 10px ${colorStyle}`
            }}>
              🎯 Типы игр
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px',
              textAlign: 'left', 
              lineHeight: '1.6', 
              color: '#ccc' 
            }}>
              <div>
                <p><strong style={{ color: '#ff6b6b' }}>⚡ Фарм игры:</strong><br/>Стабильный доход CCC</p>
              </div>
              <div>
                <p><strong style={{ color: '#4ecdc4' }}>🎲 Азартные игры:</strong><br/>Высокие выигрыши + джекпот</p>
              </div>
              <div>
                <p><strong style={{ color: '#feca57' }}>🎮 Скилл игры:</strong><br/>Награда за мастерство</p>
              </div>
            </div>

            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(0, 240, 255, 0.1)',
              borderRadius: '10px',
              border: `1px solid ${colorStyle}`
            }}>
              <p style={{ color: colorStyle, fontSize: '0.9rem', margin: 0 }}>
                🎰 <strong>Джекпот разыгрывается автоматически</strong> при достижении 1M CCC!<br/>
                💫 Участвуйте в азартных играх для шанса на крупный выигрыш.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default GamesPage;