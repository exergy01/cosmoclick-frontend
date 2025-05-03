import React from 'react';
import axios from 'axios';
import { usePlayer } from '../context/PlayerContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { asteroidData } from '../data/shopDataSystem1';

interface Drone {
  id: number;
  system: number;
}

const ResourceButtons: React.FC = () => {
  const { player, setPlayer } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const activeTab = query.get('tab') || 'resources';

  const buttonStyle: React.CSSProperties = {
    width: '30%',
    padding: '10px 0',
    margin: '5px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: '#00f0ff',
    border: '2px solid #00f0ff',
    fontSize: '16px',
    fontWeight: 'normal',
    boxShadow: '0 0 8px #00f0ff',
    textAlign: 'center',
    cursor: 'pointer',
    transition: '0.3s',
  };

  const getButtonStyle = (tab: string): React.CSSProperties => ({
    ...buttonStyle,
    boxShadow: activeTab === tab ? 'inset 0 0 10px #00f0ff, 0 0 8px #00f0ff' : '0 0 8px #00f0ff',
  });

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = '#00f0ff';
      e.currentTarget.style.color = '#001133';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean) => {
    if (!isActive) {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = '#00f0ff';
    }
  };

  const calculateTotalAsteroidCapacity = () => {
    if (!player?.asteroids) return 0;
    return player.asteroids.reduce((total: number, asteroidId: number) => {
      const asteroid = asteroidData.find(a => a.id === asteroidId);
      return total + (asteroid ? asteroid.capacity : 0);
    }, 0);
  };

  const calculateRemainingResources = () => {
    const totalCapacity = calculateTotalAsteroidCapacity();
    const currentCCC = player?.ccc ?? 0;
    return Math.max(0, totalCapacity - currentCCC);
  };

  const buyDrone = async () => {
    if (!player) return;
    const cost = 500;
    if (player.ccc < cost) {
      alert('Недостаточно CCC для покупки дрона!');
      return;
    }

    try {
      const updatedDrones = [...player.drones, { id: player.drones.length + 1, system: player.current_system || 1 }];
      const updatedPlayer = {
        ...player,
        ccc: player.ccc - cost,
        drones: updatedDrones,
      };

      const res = await axios.put(
        `https://cosmoclick-backend.onrender.com/api/player/${player.telegram_id}`,
        updatedPlayer
      );
      setPlayer(res.data);
      alert('Дрон успешно куплен!');
    } catch (err: any) {
      console.error('❌ Ошибка покупки дрона:', err);
      alert('Ошибка при покупке дрона');
    }
  };

  const upgradeCargo = async () => {
    if (!player) return;
    const cost = 1000;
    if (player.ccc < cost) {
      alert('Недостаточно CCC для улучшения карго!');
      return;
    }

    try {
      const updatedCargo = {
        ...player.cargo,
        level: player.cargo.level + 1,
        capacity: player.cargo.capacity + 500,
      };
      const updatedPlayer = {
        ...player,
        ccc: player.ccc - cost,
        cargo: updatedCargo,
      };

      const res = await axios.put(
        `https://cosmoclick-backend.onrender.com/api/player/${player.telegram_id}`,
        updatedPlayer
      );
      setPlayer(res.data);
      alert('Карго успешно улучшено!');
    } catch (err: any) {
      console.error('❌ Ошибка улучшения карго:', err);
      alert('Ошибка при улучшении карго');
    }
  };

  const toggleAutoCollect = async () => {
    if (!player) return;
    const cost = 2000;
    if (player.ccc < cost) {
      alert('Недостаточно CCC для включения автосбора!');
      return;
    }

    try {
      const updatedCargo = {
        ...player.cargo,
        autoCollect: !player.cargo.autoCollect,
      };
      const updatedPlayer = {
        ...player,
        ccc: player.cargo.autoCollect ? player.ccc : player.ccc - cost,
        cargo: updatedCargo,
      };

      const res = await axios.put(
        `https://cosmoclick-backend.onrender.com/api/player/${player.telegram_id}`,
        updatedPlayer
      );
      setPlayer(res.data);
      alert(`Автосбор ${player.cargo.autoCollect ? 'выключен' : 'включен'}!`);
    } catch (err: any) {
      console.error('❌ Ошибка переключения автосбора:', err);
      alert('Ошибка при переключении автосбора');
    }
  };

  if (!player) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: '16px',
      }}
    >
      <button
        style={getButtonStyle('resources')}
        onMouseDown={(e) => handleMouseDown(e, activeTab === 'resources')}
        onMouseUp={(e) => handleMouseUp(e, activeTab === 'resources')}
        onClick={() => navigate('/shop?tab=resources')}
      >
        РЕСУРСЫ<br /><br />
        {player.asteroids.length ?? '0'} / 12<br /><br />
        {calculateRemainingResources()} CCC
      </button>
      <button
        style={getButtonStyle('drones')}
        onMouseDown={(e) => handleMouseDown(e, activeTab === 'drones')}
        onMouseUp={(e) => handleMouseUp(e, activeTab === 'drones')}
        onClick={() => navigate('/shop?tab=drones')}
      >
        ДРОНЫ<br /><br />
        {player.drones.length ?? '0'} / 15
      </button>
      <button
        style={getButtonStyle('cargo')}
        onMouseDown={(e) => handleMouseDown(e, activeTab === 'cargo')}
        onMouseUp={(e) => handleMouseUp(e, activeTab === 'cargo')}
        onClick={() => navigate('/shop?tab=cargo')}
      >
        КАРГО<br /><br />
        {player.cargo.level ?? '0'} / 5
      </button>
    </div>
  );
};

export default ResourceButtons;