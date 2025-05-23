import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import { asteroidData, droneData, cargoData, getMaxItems } from '../data/shopData';

interface Item {
  id: number;
  system: number;
}

const ShopPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, cccCounter, currentSystem, buyAsteroid, buyDrone, buyCargo, totalCollected, setCccCounter, refreshPlayer, safeCollect, asteroidTotal, remaining, setPlayer } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = (location.state as { tab?: string })?.tab || 'asteroid';
  const [activeTab, setActiveTab] = useState<'asteroid' | 'drones' | 'cargo'>(initialTab as 'asteroid' | 'drones' | 'cargo');
  const [drones, setDrones] = useState<Item[]>([]);
  const [asteroids, setAsteroids] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayerItems = async () => {
    if (!player?.telegram_id) return { drones: [], asteroids: [] };
    try {
      const responseDrones = await fetch(`http://localhost:5000/api/shop/drones/${player.telegram_id}/${currentSystem}`);
      const responseAsteroids = await fetch(`http://localhost:5000/api/shop/asteroids/${player.telegram_id}/${currentSystem}`);
      if (!responseDrones.ok && responseDrones.status === 404) {
        await registerNewPlayer();
        return { drones: [], asteroids: [] };
      }
      if (!responseAsteroids.ok && responseAsteroids.status === 404) {
        await registerNewPlayer();
        return { drones: [], asteroids: [] };
      }
      if (!responseDrones.ok || !responseAsteroids.ok) throw new Error(`API error: ${responseDrones.status || responseAsteroids.status}`);
      const dronesData: Item[] = await responseDrones.json();
      const asteroidsData: Item[] = await responseAsteroids.json();
      return { drones: dronesData, asteroids: asteroidsData };
    } catch (err: unknown) {
      console.error('Failed to fetch player items:', err instanceof Error ? err.message : err);
      return { drones: [], asteroids: [] };
    }
  };

  const registerNewPlayer = async () => {
    if (!player?.telegram_id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/register/${player.telegram_id}`, { method: 'POST' });
      if (!response.ok) throw new Error(`Registration failed: ${response.status}`);
      const newPlayerData = await response.json();
      setPlayer(newPlayerData);
    } catch (err: unknown) {
      console.error('Registration error:', err instanceof Error ? err.message : err);
    }
  };

  useEffect(() => {
    const loadItems = async () => {
      if (!player) return;
      setLoading(true);
      const { drones: fetchedDrones, asteroids: fetchedAsteroids } = await fetchPlayerItems();
      setDrones(fetchedDrones);
      setAsteroids(fetchedAsteroids);
      setLoading(false);
    };
    loadItems();
  }, [player, currentSystem]);

  if (!player || loading) {
    return <div>Loading...</div>;
  }

  const totalAsteroids = Array.from(new Set(asteroids.map(a => JSON.stringify({ id: a.id, system: a.system })))).length;
  const currentCargoLevel = player.cargo_levels?.find(c => c.system === currentSystem)?.level || 0;

  const shopItems = {
    asteroids: asteroidData.filter(item => item.system === currentSystem).map(item => {
      const isPurchased = asteroids.some(a => a.id === item.id && a.system === item.system);
      const isPreviousPurchased = item.id === 1 || asteroids.some(a => a.id === item.id - 1 && a.system === item.system);
      return { ...item, isPurchased, isPreviousPurchased };
    }),
    drones: droneData.filter(item => item.system === currentSystem).map(item => {
      const isPurchased = drones.some(d => d.id === item.id && d.system === item.system);
      const isPreviousPurchased = item.id === 1 || drones.some(d => d.id === item.id - 1 && d.system === item.system);
      return { ...item, isPurchased, isPreviousPurchased };
    }),
    cargo: cargoData.filter(item => item.system === currentSystem).map(item => ({
      ...item,
      isPurchased: currentCargoLevel >= item.id,
      isPreviousPurchased: item.id === 1 || currentCargoLevel >= item.id - 1,
    })),
  };

  const buyItem = async (type: 'asteroid' | 'drones' | 'cargo', id: number, price: number) => {
    if (!player?.telegram_id) return;
    try {
      const lastCollectionTime = player.last_collection_time?.[currentSystem] || new Date().toISOString();
      await safeCollect({
        telegramId: player.telegram_id,
        last_collection_time: { ...player.last_collection_time, [currentSystem]: lastCollectionTime },
        system: currentSystem,
      });
      setCccCounter(prev => ({ ...prev, [currentSystem]: 0 }));
      if (type === 'asteroid') await buyAsteroid(id, price);
      if (type === 'drones') await buyDrone(id, price);
      if (type === 'cargo') {
        const cargo = cargoData.find(item => item.id === id && item.system === currentSystem);
        if (!cargo?.capacity) throw new Error('Invalid cargo capacity');
        const capacityValue = typeof cargo.capacity === 'string' ? parseFloat(cargo.capacity) : cargo.capacity;
        await buyCargo(id, price, capacityValue);
      }
      await refreshPlayer();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to buy ${type} item #${id}:`, errorMessage);
      alert(t('failed_to_buy', { type }));
    }
  };

  const calculatePerHour = () => {
    if (!drones.length) return '0.00000';
    const totalCccPerDay = drones.reduce((sum, d) => sum + (droneData.find(item => item.id === d.id && item.system === d.system)?.cccPerDay || 0), 0);
    return Number((totalCccPerDay / 24).toFixed(5)).toString();
  };

  const systemNames = ['Андромеда', 'Орион', 'Млечный Путь', 'Туманность Ориона', 'Крабовидная Туманность', 'Сомбреро', 'Туманность Орла'];
  const systemName = `Система ${currentSystem} - ${systemNames[currentSystem - 1]}`;
  const colorStyle = player.color || '#00f0ff';

  return (
    <div style={{ backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`, backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', padding: '10px', position: 'relative' }}>
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
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <span style={{ fontSize: '1.5rem', color: colorStyle, textShadow: `0 0 10px ${colorStyle}` }}>{systemName}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '10px' }}>
          {[
            { type: 'resources', count: `${totalAsteroids}/${getMaxItems(currentSystem, 'asteroid')}`, amount: `${remaining.toFixed(5)} / ${asteroidTotal.toFixed(5)} CCC` },
            { type: 'drones', count: `${drones.filter(d => d.system === currentSystem).length}/${getMaxItems(currentSystem, 'drones')}` },
            { type: 'cargo', count: `${currentCargoLevel}/${getMaxItems(currentSystem, 'cargo')}` },
          ].map(({ type, count, amount }) => (
            <button key={type} onClick={() => setActiveTab(type === 'resources' ? 'asteroid' : type as 'asteroid' | 'drones' | 'cargo')} style={{
              flex: 1, padding: '8px 5px', background: 'rgba(0, 0, 0, 0.5)', border: activeTab === (type === 'resources' ? 'asteroid' : type) ? `4px solid ${colorStyle}` : `2px solid ${colorStyle}`, borderRadius: '15px', boxShadow: activeTab === (type === 'resources' ? 'asteroid' : type) ? `0 0 10px ${colorStyle}, inset 0 0 10px ${colorStyle}` : `0 0 10px ${colorStyle}`, color: '#fff', fontSize: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto',
            }} onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <span>{t(type)}</span>
              <span>{count}</span>
              {amount && <span>{amount}</span>}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', zIndex: 10 }}>
          {activeTab === 'asteroid' && shopItems.asteroids.map(item => (
            <button key={`asteroid-${item.id}`} onClick={() => !item.isPurchased && item.isPreviousPurchased && buyItem('asteroid', item.id, item.price)} disabled={item.isPurchased || !item.isPreviousPurchased} style={{
              flex: '1 1 calc(33.33% - 10px)', padding: '10px', background: item.isPurchased ? 'rgba(0, 255, 0, 0.5)' : item.isPreviousPurchased ? 'rgba(0, 240, 255, 0.3)' : 'rgba(119, 119, 119, 0.5)', border: `2px solid ${colorStyle}`, borderRadius: '10px', boxShadow: `0 0 20px ${colorStyle}`, color: item.isPurchased || !item.isPreviousPurchased ? '#fff' : '#000', fontSize: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', aspectRatio: '1 / 1', cursor: item.isPurchased || !item.isPreviousPurchased ? 'not-allowed' : 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto', visibility: 'visible', zIndex: 10,
            }} onMouseEnter={e => !item.isPurchased && item.isPreviousPurchased && (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              {t('asteroid')} #{item.id}<br />{t('total_ccc')}: {item.totalCcc}<br />{t('price')}: {item.price} CS
            </button>
          ))}
          {activeTab === 'drones' && shopItems.drones.map(item => (
            <button key={`drone-${item.id}`} onClick={() => !item.isPurchased && item.isPreviousPurchased && buyItem('drones', item.id, item.price)} disabled={item.isPurchased || !item.isPreviousPurchased} style={{
              flex: '1 1 calc(33.33% - 10px)', padding: '10px', background: item.isPurchased ? 'rgba(0, 255, 0, 0.5)' : item.isPreviousPurchased ? 'rgba(0, 240, 255, 0.3)' : 'rgba(119, 119, 119, 0.5)', border: `2px solid ${colorStyle}`, borderRadius: '10px', boxShadow: `0 0 20px ${colorStyle}`, color: item.isPurchased || !item.isPreviousPurchased ? '#fff' : '#000', fontSize: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', aspectRatio: '1 / 1', cursor: item.isPurchased || !item.isPreviousPurchased ? 'not-allowed' : 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto', visibility: 'visible', zIndex: 10,
            }} onMouseEnter={e => !item.isPurchased && item.isPreviousPurchased && (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              {t('drone')} #{item.id}<br />{t('ccc_per_day')}: {item.cccPerDay}<br />{t('price')}: {item.price} CS
            </button>
          ))}
          {activeTab === 'cargo' && shopItems.cargo.map(item => (
            <button key={`cargo-${item.id}`} onClick={() => !item.isPurchased && item.isPreviousPurchased && item.id !== 5 && buyItem('cargo', item.id, item.price)} disabled={item.isPurchased || !item.isPreviousPurchased || item.id === 5} style={{
              flex: '1 1 calc(33.33% - 10px)', padding: '10px', background: item.isPurchased ? 'rgba(0, 255, 0, 0.5)' : item.isPreviousPurchased ? 'rgba(0, 240, 255, 0.3)' : 'rgba(119, 119, 119, 0.5)', border: `2px solid ${colorStyle}`, borderRadius: '10px', boxShadow: `0 0 20px ${colorStyle}`, color: item.isPurchased || !item.isPreviousPurchased ? '#fff' : '#000', fontSize: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', aspectRatio: '1 / 1', cursor: item.isPurchased || !item.isPreviousPurchased || item.id === 5 ? 'not-allowed' : 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto', visibility: 'visible', zIndex: 10,
            }} onMouseEnter={e => !item.isPurchased && item.isPreviousPurchased && item.id !== 5 && (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              {t('cargo')} #{item.id}<br />{t('capacity')}: {item.capacity}<br />{t('price')}: {item.price} CS
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '93%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0, 0, 0, 0.5)', zIndex: 100 }}>
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

export default ShopPage;