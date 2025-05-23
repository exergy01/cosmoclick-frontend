import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import { droneData, asteroidData, cargoData, getMaxItems } from '../data/shopData';

interface Item {
  id: number;
  system: number;
}

const MainPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem, setCurrentSystem, safeCollect, cccCounter, setCccCounter, totalCollected, asteroidTotal, remaining } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSystemDropdown, setShowSystemDropdown] = useState(false);
  const counterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 50;
  const [drones, setDrones] = useState<Item[]>([]);
  const [asteroids, setAsteroids] = useState<Item[]>([]);

  const fetchPlayerItems = async () => {
    if (!player?.telegram_id) return { drones: [], asteroids: [] };
    try {
      const responseDrones = await fetch(`http://localhost:5000/api/shop/drones/${player.telegram_id}/${currentSystem}`);
      const responseAsteroids = await fetch(`http://localhost:5000/api/shop/asteroids/${player.telegram_id}/${currentSystem}`);
      if (!responseDrones.ok) throw new Error(`Drones API error: ${responseDrones.status}`);
      if (!responseAsteroids.ok) throw new Error(`Asteroids API error: ${responseAsteroids.status}`);
      const dronesData: Item[] = await responseDrones.json();
      const asteroidsData: Item[] = await responseAsteroids.json();
      return { drones: dronesData, asteroids: asteroidsData };
    } catch (err: unknown) {
      console.error('Failed to fetch player items:', err instanceof Error ? err.message : err);
      return { drones: [], asteroids: [] };
    }
  };

  useEffect(() => {
    const loadItems = async () => {
      if (!player) return;
      const { drones: fetchedDrones, asteroids: fetchedAsteroids } = await fetchPlayerItems();
      setDrones(fetchedDrones);
      setAsteroids(fetchedAsteroids);
    };
    loadItems();
  }, [player, currentSystem]);

  const calculateCapacity = useCallback(() => {
    if (!player) return { asteroidTotal: 0, remainingCapacity: 0, cargoLimit: 0, miningSpeed: 0 };
    const currentCargoLevel = player.cargo_levels.find(c => c.system === currentSystem)?.level || 0;
    const cargoLimit = Number(cargoData.find(c => c.id === currentCargoLevel && c.system === currentSystem)?.capacity || 0);
    const totalCccPerDay = drones.filter(d => d.system === currentSystem).reduce((sum, d) => sum + (droneData.find(item => item.id === d.id && item.system === d.system)?.cccPerDay || 0), 0);
    const miningSpeed = totalCccPerDay / (24 * 60 * 60);
    return { asteroidTotal: Number(asteroidTotal.toFixed(5)), remainingCapacity: Number(remaining.toFixed(5)), cargoLimit, miningSpeed };
  }, [player, currentSystem, asteroidTotal, remaining, drones]);

  useEffect(() => {
    if (!player) return;
    const { remainingCapacity, cargoLimit, miningSpeed } = calculateCapacity();
    const lastCollection = new Date(player.last_collection_time?.[currentSystem] || 0).getTime();
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
        return { ...prev, [currentSystem]: Number(Math.min(newValue, cargoLimit, remainingCapacity).toFixed(5)) };
      });
    }, updateInterval);

    return () => { if (counterTimerRef.current) clearInterval(counterTimerRef.current); };
  }, [player, currentSystem, calculateCapacity, setCccCounter]);

  const handleSafeClick = async () => {
    if (!player?.telegram_id) return;
    try {
      await safeCollect({
        telegramId: player.telegram_id,
        last_collection_time: { ...player.last_collection_time, [currentSystem]: new Date().toISOString() },
        system: currentSystem,
      });
      setCccCounter(prev => ({ ...prev, [currentSystem]: 0 }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Не удалось собрать: ${errorMessage}`);
    }
  };

  const handlePurchase = (type: string) => () => navigate('/shop', { state: { tab: type === 'resources' ? 'asteroid' : type } });

  const calculatePerHour = () => {
    if (!drones.length) return '0.00000';
    const totalCccPerDay = drones.filter(d => d.system === currentSystem).reduce((sum, d) => sum + (droneData.find(item => item.id === d.id && item.system === d.system)?.cccPerDay || 0), 0);
    return Number((totalCccPerDay / 24).toFixed(5)).toString();
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => setTouchStartX('touches' in e ? e.touches[0].clientX : e.clientX);
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => setTouchEndX('touches' in e ? e.touches[0].clientX : e.clientX);
  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0 && currentSystem < 7) setCurrentSystem(currentSystem + 1);
      else if (distance < 0 && currentSystem > 1) setCurrentSystem(currentSystem - 1);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (!player) return <div>Loading...</div>;

  const totalAsteroids = Array.from(new Set(asteroids.map(a => JSON.stringify({ id: a.id, system: a.system })))).length;
  const systemNames = ['Андромеда', 'Орион', 'Млечный Путь', 'Туманность Ориона', 'Крабовидная Туманность', 'Сомбреро', 'Туманность Орла'];
  const systemName = `Система ${currentSystem} - ${systemNames[currentSystem - 1]}`;
  const currentCargoLevel = player.cargo_levels.find(c => c.system === currentSystem)?.level || 0;
  const colorStyle = player.color || '#00f0ff';

  return (
    <div style={{ backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`, backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', padding: '10px', position: 'relative' }}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onMouseDown={handleTouchStart} onMouseMove={handleTouchMove} onMouseUp={handleTouchEnd}>
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
            { type: 'drones', count: `${drones.filter(d => d.system === currentSystem).length}/${getMaxItems(currentSystem, 'drones')}` },
            { type: 'cargo', count: `${currentCargoLevel}/${getMaxItems(currentSystem, 'cargo')}` },
          ].map(({ type, count, amount }) => (
            <button key={type} onClick={handlePurchase(type)} style={{ flex: 1, padding: '8px 5px', background: 'rgba(0, 0, 0, 0.5)', border: `2px solid ${colorStyle}`, borderRadius: '15px', boxShadow: `0 0 10px ${colorStyle}`, color: '#fff', fontSize: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <span>{t(type)}</span>
              <span>{count}</span>
              {amount && <span>{amount}</span>}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', margin: '10px 0', position: 'relative' }}>
          <span onClick={() => { setShowSystemDropdown(!showSystemDropdown); }} style={{ fontSize: '1.5rem', color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, cursor: 'pointer', transition: 'transform 0.3s ease', display: 'inline-block' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            {systemName}
          </span>
          {showSystemDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0, 0, 0, 0.7)', border: `2px solid ${colorStyle}`, borderRadius: '10px', boxShadow: `0 0 10px ${colorStyle}`, zIndex: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} onClick={() => { setCurrentSystem(i); setShowSystemDropdown(false); }} style={{ padding: '10px 20px', color: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'background 0.3s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {`Система ${i} - ${systemNames[i - 1]}`}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', margin: '10px', paddingTop: '80px' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', cursor: 'pointer' }} onClick={handleSafeClick}>
            <img src="/assets/safe.png" alt="Safe" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 10px ${colorStyle}) drop-shadow(0 0 20px ${colorStyle})`, transition: 'transform 0.3s ease' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
          </div>
          <p style={{ fontSize: '1.8rem', color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, marginTop: '10px' }}>
            {(cccCounter[currentSystem] || 0).toFixed(5)}
          </p>
        </div>
      </div>

      <div style={{ width: '93%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0, 0, 0, 0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          {[{ path: '/attack', icon: '⚔️', label: t('attack') }, { path: '/exchange', icon: '🔄', label: t('exchange') }, { path: '/quests', icon: '🎯', label: t('quests') }].map(({ path, icon, label }) => (
            <button key={path} onClick={() => navigate(path)} style={{ flex: 1, padding: '8px 5px', background: 'rgba(0, 0, 0, 0.5)', border: location.pathname === path ? `4px solid ${colorStyle}` : `2px solid ${colorStyle}`, borderRadius: '15px', boxShadow: location.pathname === path ? `0 0 10px ${colorStyle}, inset 0 0 10px ${colorStyle}` : `0 0 10px ${colorStyle}`, color: '#fff', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              {icon} {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          {[{ path: '/games', icon: '🎮' }, { path: '/wallet', icon: '💳' }, { path: '/main', icon: '🚀' }, { path: '/ref', icon: '👥' }, { path: '/alphabet', icon: '📖' }].map(({ path, icon }) => (
            <button key={path} onClick={() => navigate(path)} style={{ flex: 1, padding: '8px 5px', background: 'rgba(0, 0, 0, 0.5)', border: location.pathname === path ? `4px solid ${colorStyle}` : `2px solid ${colorStyle}`, borderRadius: '15px', boxShadow: location.pathname === path ? `0 0 10px ${colorStyle}, inset 0 0 10px ${colorStyle}` : `0 0 10px ${colorStyle}`, color: '#fff', fontSize: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainPage;