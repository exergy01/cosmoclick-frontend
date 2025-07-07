import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlayer } from '../context/PlayerContext';
import axios from 'axios';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

interface NavigationMenuProps {
  colorStyle: string;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ colorStyle }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshPlayer, player } = usePlayer();

  const topMenuItems = [
    { path: '/attack', icon: '⚔️', label: t('attack') },
    { path: '/exchange', icon: '🔄', label: t('exchange') },
    { path: '/quests', icon: '🎯', label: t('quests') }
  ];

  const bottomMenuItems = [
    { path: '/games', icon: '🎮' },
    { path: '/wallet', icon: '💳' },
    { path: '/main', icon: '🚀' },
    { path: '/ref', icon: '👥' },
    { path: '/alphabet', icon: '📖' }
  ];



  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Обновление через refreshPlayer с задержкой
  const handleNavigation = async (path: string) => {
    try {
      // Если переходим на рефералы - двойное обновление
      if (path === '/ref' || path === '/referrals') {
        console.log('🔄 Двойное обновление для рефералов...');
        
        // Первое обновление
        await refreshPlayer();
        
        // Небольшая пауза
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Второе обновление для надежности
        await refreshPlayer();
        
        console.log('✅ Данные дважды обновлены');
      }
      navigate(path);
    } catch (err) {
      console.error('❌ Ошибка при переходе:', err);
      // Переходим в любом случае
      navigate(path);
    }
  };

  const buttonStyle = (path: string, hasLabel: boolean = false) => ({
    flex: 1,
    padding: '8px 5px',
    background: location.pathname === path 
      ? `rgba(0, 240, 255, 0.2)` 
      : 'rgba(0, 0, 0, 0.5)',
    border: location.pathname === path ? `4px solid ${colorStyle}` : `2px solid ${colorStyle}`,
    borderRadius: '15px',
    boxShadow: location.pathname === path 
      ? `0 0 20px ${colorStyle}, inset 0 0 15px ${colorStyle}, inset 0 0 25px rgba(0, 240, 255, 0.3)` 
      : `0 0 10px ${colorStyle}`,
    color: location.pathname === path ? colorStyle : '#fff',
    fontSize: hasLabel ? '1rem' : '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box' as const,
    height: 'auto',
    textShadow: location.pathname === path ? `0 0 10px ${colorStyle}` : 'none'
  });

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.05)';
  };

  const handleButtonLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  return (
    <div style={{ 
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
    }}>
      {/* Верхнее меню с текстом */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
        {topMenuItems.map(({ path, icon, label }) => (
          <button 
            key={path} 
            onClick={() => handleNavigation(path)} 
            style={buttonStyle(path, true)}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            {icon} {label}
          </button>
        ))}
      </div>
      
      {/* Нижнее меню только с иконками */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
        {bottomMenuItems.map(({ path, icon }) => (
          <button 
            key={path} 
            onClick={() => handleNavigation(path)} 
            style={buttonStyle(path, false)}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NavigationMenu;