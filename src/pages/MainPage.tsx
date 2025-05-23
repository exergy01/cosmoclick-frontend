import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import { getTelegramId } from '../utils/telegram';
import { droneData, asteroidData, cargoData, getMaxItems } from '../data/shopData';

const MainPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem, setCurrentSystem, safeCollect, cccCounter, setCccCounter, totalCollected, asteroidTotal, remaining } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSystemDropdown, setShowSystemDropdown] = React.useState(false);
  const counterTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const calculateCapacity = useCallback(() => {
    if (!player) return { asteroidTotal: 0, remainingCapacity: 0, cargoLimit: 0, miningSpeed: 0 };
    const currentCargoLevel = player.cargo_levels.find(c => c.system === currentSystem)?.level || 0;
    const cargoLimit = Number(cargoData.find(c => c.id === currentCargoLevel && c.system === currentSystem)?.capacity || 0);

    const totalCccPerDay = player.drones
      .filter(d => d.system === currentSystem)
      .reduce((sum, d) => {
        const drone = droneData.find(item => item.id === d.id && item.system === d.system);
        return sum + (drone?.cccPerDay || 0);
      }, 0);
    const miningSpeed = totalCccPerDay / (24 * 60 * 60);

    return { asteroidTotal: Number(asteroidTotal.toFixed(5)), remainingCapacity: Number(remaining.toFixed(5)), cargoLimit, miningSpeed };
  }, [player, currentSystem, asteroidTotal, remaining]);

  useEffect(() => {
    if (!player) return;
    const { remainingCapacity, cargoLimit, miningSpeed } = calculateCapacity();

    const lastCollection = player.last_collection_time && typeof player.last_collection_time === 'object' 
      ? new Date(player.last_collection_time[currentSystem] || 0).getTime() 
      : player.last_collection_time 
        ? new Date(player.last_collection_time).getTime() 
        : 0;
    const startTime = Date.now();
    const initialElapsed = (startTime - lastCollection) / 1000;
    let initialValue = miningSpeed * initialElapsed;
    if (initialValue > cargoLimit) initialValue = cargoLimit;
    if (initialValue > remainingCapacity) initialValue = remainingCapacity;
    setCccCounter(prev => ({ ...prev, [currentSystem]: Number(initialValue.toFixed(5)) }));

    const updateInterval = 100;
    const incrementPerTick = miningSpeed * (updateInterval / 1000);

    counterTimerRef.current = setInterval(() => {
      setCccCounter(prev => {
        const currentCounter = prev[currentSystem] || 0;
        if (currentCounter >= cargoLimit || currentCounter >= remainingCapacity) return prev;
        const newValue = currentCounter + incrementPerTick;
        if (newValue > cargoLimit) return { ...prev, [currentSystem]: cargoLimit };
        if (newValue > remainingCapacity) return { ...prev, [currentSystem]: remainingCapacity };
        return { ...prev, [currentSystem]: Number(newValue.toFixed(5)) };
      });
    }, updateInterval);

    return () => {
      if (counterTimerRef.current) clearInterval(counterTimerRef.current);
    };
  }, [player, currentSystem, calculateCapacity, setCccCounter]);

  const sendLog = async (action: string, details: any) => {
    const telegramId = getTelegramId() || 'default_user';
    try {
      await fetch('http://localhost:5000/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${player?.token || ''}` },
        body: JSON.stringify({ userId: telegramId, action, timestamp: new Date().toISOString(), details }),
      });
    } catch (err) {
      console.error('Failed to send log:', err);
    }
  };

  const handleSafeClick = async () => {
    if (!player) return;
    const telegramId = getTelegramId();
    if (!telegramId) {
      alert('Telegram ID not found');
      return;
    }
    try {
      if (player.verified === false) {
        alert('Просмотр рекламы обязателен для сбора (10 CCC). Интеграция позже.');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      await safeCollect({
        telegramId,
        last_collection_time: { ...player.last_collection_time, [currentSystem]: new Date().toISOString() },
        system: currentSystem,
      });
      setCccCounter(prev => ({ ...prev, [currentSystem]: 0 }));
      await sendLog('safeCollect', { collected: cccCounter[currentSystem] || 0, newCcc: String(Number((parseFloat(String(player.ccc)) + (cccCounter[currentSystem] || 0)).toFixed(5))), newTotalCollected: String(totalCollected) });
    } catch (err: any) {
      alert(`Не удалось собрать: ${err.message}`);
    }
  };

  const handlePurchase = (type: string) => {
    return async () => {
      navigate('/shop', { state: { tab: type === 'resources' ? 'asteroid' : type } });
      if (type === 'resources') {
        await sendLog('purchaseAsteroid', { system: currentSystem });
      }
    };
  };

  const calculatePerHour = () => {
    if (!player?.drones || player.drones.length === 0) return '0.00000';
    const totalCccPerDay = player.drones.reduce((sum, d) => {
      const drone = droneData.find(item => item.id === d.id && item.system === d.system);
      return sum + (drone?.cccPerDay || 0);
    }, 0);
    return Number((totalCccPerDay / 24).toFixed(5)).toString();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchStartX(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setTouchEndX(clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isSwipe = Math.abs(distance) > minSwipeDistance;
    if (isSwipe) {
      if (distance > 0 && currentSystem < 7) {
        setCurrentSystem(currentSystem + 1);
        sendLog('swipe', { direction: 'left', newSystem: currentSystem + 1 });
      } else if (distance < 0 && currentSystem > 1) {
        setCurrentSystem(currentSystem - 1);
        sendLog('swipe', { direction: 'right', newSystem: currentSystem - 1 });
      }
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (!player) return <div>Loading...</div>;

  const totalAsteroids = Array.from(new Set(player.asteroids.filter(a => a.system === currentSystem).map(a => JSON.stringify({ id: a.id, system: a.system })))).length;
  const systemNames = ['Андромеда', 'Орион', 'Млечный Путь', 'Туманность Ориона', 'Крабовидная Туманность', 'Сомбреро', 'Туманность Орла'];
  const systemName = `Система ${currentSystem} - ${systemNames[currentSystem - 1]}`;
  const currentCargoLevel = player.cargo_levels.find(c => c.system === currentSystem)?.level || 0;
  const colorStyle = player?.color ? player.color : '#00f0ff';

  return (
    <div
      style={{ backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`, backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', padding: '10px', position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
    >
      <div style={{ width: '93%', display: 'flex', justifyContent: 'space-between', padding: '3px', background: 'rgba(0, 0, 0, 0.5)', border: `2px solid ${colorStyle}`, borderRadius: '10px', boxShadow: `0 0 20px ${colorStyle}`, position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '1.1rem' }}>💠 CCC: {(typeof player.ccc === 'number' ? player.ccc : parseFloat(player.ccc || '0')).toFixed(5)}</p>
          <p style={{ fontSize: '1.1rem' }}>📈 В час: {calculatePerHour()}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '1.1rem' }}>✨ {t('cs')}: {(typeof player.cs === 'number' ? player.cs : parseFloat(player.cs || '0')).toFixed(2)}</p>
          <p style={{ fontSize: '1.1rem' }}>💎 {t('ton')}: {(typeof player.ton === 'number' ? player.ton : parseFloat(player.ton || '0')).toFixed(9)}</p>
        </div>
      </div>

      <div style={{ marginTop: '110px', paddingBottom: '130px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '10px' }}>
          {[
            { type: 'resources', count: `${totalAsteroids}/${getMaxItems(currentSystem, 'asteroid')}`, amount: `${remaining.toFixed(5)} / ${asteroidTotal.toFixed(5)} CCC` },
            { type: 'drones', count: `${player.drones.filter(d => d.system === currentSystem).length}/${getMaxItems(currentSystem, 'drones')}` },
            { type: 'cargo', count: `${currentCargoLevel}/${getMaxItems(currentSystem, 'cargo')}` }
          ].map(({ type, count, amount }) => (
            <button
              key={type}
              onClick={handlePurchase(type)}
              style={{ flex: 1, padding: '8px 5px', background: 'rgba(0, 0, 0, 0.5)', border: `2px solid ${colorStyle}`, borderRadius: '15px', boxShadow: `0 0 10px ${colorStyle}`, color: '#fff', fontSize: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span>{t(type)}</span>
              <span>{count}</span>
              {amount && <span>{amount}</span>}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', margin: '10px 0', position: 'relative' }}>
          <span
            onClick={() => { setShowSystemDropdown(!showSystemDropdown); sendLog('dropdownToggle', { state: !showSystemDropdown }); }}
            style={{ fontSize: '1.5rem', color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, cursor: 'pointer', transition: 'transform 0.3s ease', display: 'inline-block' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {systemName}
          </span>
          {showSystemDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0, 0, 0, 0.7)', border: `2px solid ${colorStyle}`, borderRadius: '10px', boxShadow: `0 0 10px ${colorStyle}`, zIndex: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div
                  key={i}
                  onClick={() => { setCurrentSystem(i); setShowSystemDropdown(false); sendLog('systemSelect', { system: i }); }}
                  style={{ padding: '10px 20px', color: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'background 0.3s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {`Система ${i} - ${systemNames[i - 1]}`}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', margin: '10px', paddingTop: '80px' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', cursor: 'pointer' }} onClick={handleSafeClick}>
            <img
              src="/assets/safe.png"
              alt="Safe"
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 10px ${colorStyle}) drop-shadow(0 0 20px ${colorStyle})`, transition: 'transform 0.3s ease' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>
          <p style={{ fontSize: '1.8rem', color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, marginTop: '10px' }}>
            {(cccCounter[currentSystem] || 0).toFixed(5)}
          </p>
        </div>
      </div>

      <div style={{ width: '93%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0, 0, 0, 0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          {[
            { path: '/attack', icon: '⚔️', label: t('attack') },
            { path: '/exchange', icon: '🔄', label: t('exchange') },
            { path: '/quests', icon: '🎯', label: t('quests') }
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              onClick={() => { navigate(path); sendLog('navigate', { path }); }}
              style={{ flex: 1, padding: '8px 5px', background: 'rgba(0, 0, 0, 0.5)', border: location.pathname === path ? `4px solid ${colorStyle}` : `2px solid ${colorStyle}`, borderRadius: '15px', boxShadow: location.pathname === path ? `0 0 10px ${colorStyle}, inset 0 0 10px ${colorStyle}` : `0 0 10px ${colorStyle}`, color: '#fff', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto' }}
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
              onClick={() => { navigate(path); sendLog('navigate', { path }); }}
              style={{ flex: 1, padding: '8px 5px', background: 'rgba(0, 0, 0, 0.5)', border: location.pathname === path ? `4px solid ${colorStyle}` : `2px solid ${colorStyle}`, borderRadius: '15px', boxShadow: location.pathname === path ? `0 0 10px ${colorStyle}, inset 0 0 10px ${colorStyle}` : `0 0 10px ${colorStyle}`, color: '#fff', fontSize: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto' }}
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

export default MainPage;