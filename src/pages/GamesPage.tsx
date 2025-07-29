import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

  // Конфигурация игр с переводами
  const gameCards = [
    {
      id: 'tapper',
      title: t('gamesPage.games.tapper.title'),
      description: t('gamesPage.games.tapper.description'),
      icon: '💥',
      status: 'available',
      color: colorStyle,
      route: '/games/tapper',
      type: 'clicker'
    },
    {
      id: 'cosmic_shells',
      title: t('gamesPage.games.cosmicShells.title'),
      description: t('gamesPage.games.cosmicShells.description'),
      icon: '🛸',
      status: 'available',
      color: colorStyle,
      route: '/games/cosmic-shells',
      type: 'gambling'
    },
    {
      id: 'galactic_slots',
      title: t('gamesPage.games.galacticSlots.title'),
      description: t('gamesPage.games.galacticSlots.description'),
      icon: '🎰',
      status: 'available',
      color: colorStyle,
      route: '/games/galactic-slots',
      type: 'gambling'
    }
    // Остальные игры пока закомментированы
    /*
    {
      id: 'orbital_roulette',
      title: 'Орбитальная Рулетка',
      description: 'Запустите планетарную систему и выиграйте до x10!',
      icon: '🌌',
      status: 'coming_soon',
      color: colorStyle,
      route: '/games/orbital-roulette',
      type: 'gambling'
    },
    {
      id: 'asteroid_slalom',
      title: 'Астероидный Слалом',
      description: 'Пролетите через астероидное поле на максимальной скорости!',
      icon: '🚀',
      status: 'coming_soon',
      color: colorStyle,
      route: '/games/asteroid-slalom',
      type: 'skill'
    },
    {
      id: 'cosmic_sniper',
      title: 'Снайпер Астероидов',
      description: 'Защитите станцию от астероидной атаки! Точность решает всё.',
      icon: '🎯',
      status: 'coming_soon',
      color: colorStyle,
      route: '/games/cosmic-sniper',
      type: 'skill'
    }
    */
  ];

  // Функция для получения локализованного типа игры
  const getGameTypeLabel = (type: string) => {
    switch (type) {
      case 'gambling':
        return `🎲 ${t('gamesPage.gameTypes.gambling')}`;
      case 'clicker':
        return `🔄 ${t('gamesPage.gameTypes.clicker')}`;
      case 'skill':
        return `🎯 ${t('gamesPage.gameTypes.skill')}`;
      default:
        return `🎮 ${type.toUpperCase()}`;
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
      <div style={{ marginTop: '80px', paddingBottom: '130px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h3 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2rem', 
            marginBottom: '20px'
          }}>
            🎮 {t('gamesPage.title')}
          </h3>

          {/* Джекпот */}
          <div style={{ 
            width: '93%', 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '3px', 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: `2px solid ${colorStyle}`, 
            borderRadius: '20px', 
            boxShadow: `0 0 20px ${colorStyle}30`, 
            position: 'relative', 
            left: '50%', 
            transform: 'translateX(-50%)',
            marginBottom: '30px'
          }}>
            <div style={{ textAlign: 'center', padding: '15px', width: '100%' }}>
              <h3 style={{ 
                color: colorStyle, 
                margin: '0 0 15px', 
                textShadow: `0 0 10px ${colorStyle}`,
                fontSize: '1.5rem'
              }}>
                🎰 {t('gamesPage.jackpot.title')}
              </h3>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: colorStyle,
                textShadow: `0 0 15px ${colorStyle}`,
                marginBottom: '10px'
              }}>
                {gameStats.jackpotAmount.toLocaleString()} CCC
              </div>
              <p style={{ margin: '0', color: '#ccc', fontSize: '0.9rem' }}>
                💫 {t('gamesPage.jackpot.description')}
              </p>
            </div>
          </div>

          {/* Сетка игр */}
          <div style={{ 
            width: '93%', 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            padding: '3px', 
            position: 'relative', 
            left: '50%', 
            transform: 'translateX(-50%)',
            marginBottom: '40px'
          }}>
            {gameCards.map((game) => (
              <div
                key={game.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '20px',
                  padding: '25px',
                  boxShadow: `0 0 20px ${colorStyle}30`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 10px 30px ${colorStyle}50`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 0 20px ${colorStyle}30`;
                }}
              >
                {/* Иконка игры */}
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '15px',
                  filter: `drop-shadow(0 0 10px ${colorStyle})`
                }}>
                  {game.icon}
                </div>

                {/* Название */}
                <h3 style={{
                  color: colorStyle,
                  textShadow: `0 0 10px ${colorStyle}`,
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

                {/* Тип игры */}
                <div style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  background: game.type === 'gambling' ? '#ff660040' : game.type === 'clicker' ? '#00ff0040' : '#0099ff40',
                  border: `1px solid ${game.type === 'gambling' ? '#ff6600' : game.type === 'clicker' ? '#00ff00' : '#0099ff'}`,
                  borderRadius: '8px',
                  fontSize: '0.7rem',
                  color: game.type === 'gambling' ? '#ff6600' : game.type === 'clicker' ? '#00ff00' : '#0099ff',
                  marginBottom: '15px',
                  fontWeight: 'bold'
                }}>
                  {getGameTypeLabel(game.type)}
                </div>

                {/* Кнопка играть */}
                <button
                  onClick={() => navigate(game.route)}
                  style={{
                    padding: '12px 25px',
                    background: `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`,
                    border: `2px solid ${colorStyle}`,
                    borderRadius: '15px',
                    color: colorStyle,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    textShadow: `0 0 10px ${colorStyle}`,
                    transition: 'all 0.3s ease',
                    width: '100%',
                    display: 'block'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `linear-gradient(45deg, ${colorStyle}40, ${colorStyle}60)`;
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = `linear-gradient(45deg, ${colorStyle}20, ${colorStyle}40)`;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  🎮 {t('gamesPage.playButton')}
                </button>
              </div>
            ))}
          </div>

          {/* Статистика игрока */}
          <div style={{ 
            width: '93%', 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '3px', 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: `2px solid ${colorStyle}`, 
            borderRadius: '20px', 
            boxShadow: `0 0 20px ${colorStyle}30`, 
            position: 'relative', 
            left: '50%', 
            transform: 'translateX(-50%)',
            marginBottom: '30px'
          }}>
            <div style={{ width: '100%', padding: '15px' }}>
              <h3 style={{ 
                color: colorStyle,
                margin: '0 0 15px', 
                textShadow: `0 0 10px ${colorStyle}`,
                fontSize: '1.5rem'
              }}>
                📊 {t('gamesPage.stats.title')}
              </h3>
              <div style={{ textAlign: 'left', lineHeight: '1.4' }}>
                <p style={{ margin: '5px 0', color: '#ccc' }}>
                  🎯 {t('gamesPage.stats.gamesPlayed')}: <span style={{ color: '#fff', fontWeight: 'bold' }}>{gameStats.totalGames}</span>
                </p>
                <p style={{ margin: '5px 0', color: '#ccc' }}>
                  🏆 {t('gamesPage.stats.wins')}: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{gameStats.totalWins}</span>
                </p>
                <p style={{ margin: '5px 0', color: '#ccc' }}>
                  💀 {t('gamesPage.stats.losses')}: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{gameStats.totalLosses}</span>
                </p>
                <p style={{ margin: '5px 0', color: '#ccc' }}>
                  📈 {t('gamesPage.stats.winRate')}: <span style={{ color: colorStyle, fontWeight: 'bold' }}>
                    {gameStats.totalGames > 0 ? Math.round((gameStats.totalWins / gameStats.totalGames) * 100) : 0}%
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Информация о джекпоте */}
          <div style={{ 
            width: '93%', 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '20px', 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: `2px solid ${colorStyle}`, 
            borderRadius: '20px', 
            boxShadow: `0 0 20px ${colorStyle}30`, 
            position: 'relative', 
            left: '50%', 
            transform: 'translateX(-50%)'
          }}>
            <p style={{ color: colorStyle, fontSize: '1rem', margin: 0, lineHeight: '1.5' }}>
              🎰 <strong>{t('gamesPage.jackpot.info')}</strong><br/>
              💫 {t('gamesPage.jackpot.participate')}
            </p>
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default GamesPage;