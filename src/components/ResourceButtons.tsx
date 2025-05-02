import React from 'react';
import axios from 'axios';
import { usePlayer } from '../context/PlayerContext'; // Исправлен путь

const ResourceButtons: React.FC = () => {
  const { player, setPlayer } = usePlayer();

  const buttonStyle: React.CSSProperties = {
    width: '30%',
    padding: '10px 0',
    margin: '5px',
    borderRadius: '12px',
    backgroundColor: 'transparent',
    color: '#00f0ff',
    border: '2px solid #00f0ff',
    fontSize: '16px',
    fontWeight: 'bold',
    boxShadow: '0 0 8px #00f0ff',
    textAlign: 'center',
    cursor: 'pointer',
    transition: '0.3s',
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#00f0ff';
    e.currentTarget.style.color = '#001133';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = '#00f0ff';
  };

  const buyDrone = async () => {
    if (!player) return;
    const cost = 500; // Стоимость дрона в ccc
    if (player.ccc < cost) {
      alert('Недостаточно CCC для покупки дрона!');
      return;
    }

    try {
      const updatedDrones = [...player.drones, { id: player.drones.length + 1, system: player.current_system }];
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
    const cost = 1000; // Стоимость улучшения карго в ccc
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
    const cost = 2000; // Стоимость включения autoCollect в ccc
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
        style={buttonStyle}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        РЕСУРСЫ<br />
        CCC: {player?.ccc ?? '0'}<br />
        CS: {player?.cs ?? '0'}<br />
        TON: {player?.ton ?? '0'}
      </button>
      <button
        style={buttonStyle}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={buyDrone}
      >
        ДРОНЫ<br />
        Кол-во: {player?.drones.length ?? '0'}
      </button>
      <button
        style={buttonStyle}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={player?.cargo.autoCollect ? toggleAutoCollect : upgradeCargo}
      >
        КАРГО<br />
        Уровень: {player?.cargo.level ?? '1'}<br />
        Вместимость: {player?.cargo.capacity ?? '0'}<br />
        Автосбор: {player?.cargo.autoCollect ? 'Вкл' : 'Выкл'}
      </button>
    </div>
  );
};

export default ResourceButtons;