import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePlayer } from '../context/PlayerContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { asteroidData, droneData, cargoData } from '../data/shopDataSystem1';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';
import ResourceButtons from '../components/ResourceButtons';

interface Player {
  telegram_id: string;
  cs: number;
  ccc: number;
  ton: number;
  current_system: number;
  drones: { id: number; system: number }[];
  cargo: { level: number; capacity: number; autoCollect: boolean };
  asteroids: number[];
}

const ShopPage = () => {
  const { player, setPlayer } = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(query.get('tab') || 'asteroids');

  useEffect(() => {
    setActiveTab(query.get('tab') || 'asteroids');
  }, [location.search]);

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com'
    : 'http://localhost:5000';

  const { data: fetchedPlayer, error, refetch, isLoading } = useQuery<Player, Error>({
    queryKey: ['player', player?.telegram_id],
    queryFn: () => fetch(`${apiUrl}/api/player/${player?.telegram_id}`).then(res => {
      if (!res.ok) throw new Error(`Failed to fetch player data: ${res.status} ${res.statusText}`);
      return res.json();
    }).then(data => {
      console.log('Fetched player data:', data);
      return {
        ...data,
        asteroids: Array.isArray(data.asteroids) ? data.asteroids : JSON.parse(data.asteroids || '[]'),
        drones: Array.isArray(data.drones) ? data.drones : JSON.parse(data.drones || '[]'),
        cargo: typeof data.cargo === 'string' ? JSON.parse(data.cargo) : data.cargo || { level: 0, capacity: 0, autoCollect: false },
      };
    }),
    enabled: !!player?.telegram_id,
  });

  const handlePurchase = async (itemType: string, itemId: number, price: number) => {
    try {
      const requestBody = { telegramId: player?.telegram_id, itemType, itemId, price };
      console.log('Sending purchase request:', requestBody);
      const response = await fetch(`${apiUrl}/api/shop/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Purchase response:', data);
      if (!response.ok) throw new Error(data.error || `Server error: ${response.status}`);

      if (data.success) {
        alert('Покупка успешна!');
        let updatedPlayer = { ...player! };

        if (itemType === 'asteroid') {
          updatedPlayer = {
            ...updatedPlayer,
            cs: (updatedPlayer.cs || 0) - price,
            asteroids: [...(updatedPlayer.asteroids || []), itemId],
          };
        } else if (itemType === 'drone') {
          updatedPlayer = {
            ...updatedPlayer,
            cs: (updatedPlayer.cs || 0) - price,
            drones: [...(updatedPlayer.drones || []), { id: itemId, system: updatedPlayer.current_system || 1 }],
          };
        } else if (itemType === 'cargo') {
          const currentCargo = updatedPlayer.cargo || { level: 0, capacity: 0, autoCollect: false };
          const cargoItem = cargoData.find(c => c.level === itemId);
          updatedPlayer = {
            ...updatedPlayer,
            cs: (updatedPlayer.cs || 0) - price,
            cargo: {
              ...currentCargo,
              level: itemId,
              capacity: cargoItem?.capacity || currentCargo.capacity,
              autoCollect: currentCargo.autoCollect,
            },
          };
        }

        setPlayer(updatedPlayer);
        refetch();
      } else {
        alert(`Ошибка: ${data.error}`);
      }
    } catch (error: unknown) {
      console.error('Purchase error:', error);
      alert(`Ошибка: ${(error as Error).message}`);
    }
  };

  const calculateTotalAsteroidCapacity = () => {
    if (!fetchedPlayer?.asteroids) return 0;
    return fetchedPlayer.asteroids.reduce((total, asteroidId) => {
      const asteroid = asteroidData.find(a => a.id === asteroidId);
      return total + (asteroid ? asteroid.capacity : 0);
    }, 0);
  };

  const renderItems = (items: any[], type: string, playerItems: any) => {
    if (!playerItems) {
      return <p style={{ textAlign: 'center', fontSize: '16px' }}>Данные не загружены</p>;
    }

    return items.map((item: any, index: number) => {
      const isPurchased = type === 'cargo'
        ? playerItems.level >= item.level
        : type === 'drone'
        ? playerItems.some((i: { id: number }) => i.id === item.id)
        : playerItems.includes(item.id);

      const isPreviousPurchased = index === 0 || (type === 'cargo'
        ? playerItems.level >= items[index - 1].level
        : type === 'drone'
        ? playerItems.some((i: { id: number }) => i.id === items[index - 1].id)
        : playerItems.includes(items[index - 1].id));

      const canPurchase = !isPurchased && isPreviousPurchased && (fetchedPlayer?.cs || 0) >= item.price;

      const itemLabel = type === 'cargo'
        ? `УРОВЕНЬ ${item.level}\n${item.capacity === Infinity ? 'АВТО' : `${item.capacity} CCC`}\n${item.price} CS`
        : type === 'drone'
        ? `БОТ №${item.id}\n${item.cccPerDay} CCC/СУТКИ\n${item.price} CS`
        : `АСТЕРОИДЫ\n№${item.id}\n${item.capacity} CCC\n${item.price} CS`;

      return (
        <button
          key={item.id || item.level}
          onClick={() => handlePurchase(type, type === 'cargo' ? item.level : item.id, item.price)}
          disabled={!canPurchase}
          style={{
            width: '30%',
            height: '90px',
            padding: '10px',
            margin: '5px',
            borderRadius: '12px',
            backgroundColor: isPurchased ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 34, 0.7)',
            color: '#00f0ff',
            border: '2px solid #00f0ff',
            fontSize: '14px',
            fontWeight: 'normal',
            boxShadow: '0 0 8px #00f0ff',
            textAlign: 'center',
            cursor: canPurchase ? 'pointer' : 'not-allowed',
            transition: '0.3s',
            opacity: canPurchase ? 1 : 0.5,
            whiteSpace: 'pre-line'
          }}
          onMouseDown={(e) => {
            if (canPurchase) {
              e.currentTarget.style.backgroundColor = '#00f0ff';
              e.currentTarget.style.color = '#001133';
            }
          }}
          onMouseUp={(e) => {
            if (canPurchase) {
              e.currentTarget.style.backgroundColor = isPurchased ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 34, 0.7)';
              e.currentTarget.style.color = '#00f0ff';
            }
          }}
        >
          {itemLabel}
        </button>
      );
    });
  };

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
        <ResourceButtons />
        <div style={{ marginTop: '10px', width: '90%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
          {isLoading ? (
            <p style={{ textAlign: 'center', fontSize: '16px' }}>Загрузка...</p>
          ) : error ? (
            <p style={{ textAlign: 'center', fontSize: '16px', color: '#ff5555' }}>
              Ошибка: {error.message}
            </p>
          ) : fetchedPlayer ? (
            <>
              {activeTab === 'asteroids' && renderItems(asteroidData, 'asteroid', fetchedPlayer.asteroids || [])}
              {activeTab === 'drones' && renderItems(droneData, 'drone', fetchedPlayer.drones || [])}
              {activeTab === 'cargo' && renderItems(cargoData, 'cargo', fetchedPlayer.cargo || { level: 0 })}
              {activeTab === 'resources' && (
                <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
                  {renderItems(asteroidData, 'asteroid', fetchedPlayer.asteroids || [])}
                </div>
              )}
            </>
          ) : (
            <p style={{ textAlign: 'center', fontSize: '16px' }}>Нет данных игрока</p>
          )}
        </div>
      </div>
      <MainMenu />
    </div>
  );
};

export default ShopPage;