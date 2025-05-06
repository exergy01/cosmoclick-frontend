import React, { useState, useEffect, useRef } from 'react';
import { usePlayer, Player } from '../context/PlayerContext';
import axios from 'axios';

interface DroneData {
  id: number;
  cccPerDay: number;
  price: number;
  system: number;
}

interface AsteroidData {
  id: number;
  capacity: number;
  price: number;
  system: number;
}

interface CargoData {
  level: number;
  capacity: number;
  price: number;
  system: number;
}

interface SystemData {
  droneData: DroneData[];
  asteroidData: AsteroidData[];
  cargoData: CargoData[];
}

interface Drone {
  id: number;
  system: number;
}

const CenterPanel: React.FC = () => {
  const { player, setPlayer, safeCollect, debugData } = usePlayer();
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const lastPlayerData = useRef<Player | null>(null);
  const syncTriggered = useRef<boolean>(false);

  useEffect(() => {
    if (player && !syncTriggered.current) {
      lastPlayerData.current = player;
      syncTriggered.current = true;
      syncPlayerData();
    }
  }, [player]);

  const syncPlayerData = async () => {
    if (!player?.telegram_id || isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await axios.get(`https://cosmoclick-backend.onrender.com/api/player/${player.telegram_id}`);
      console.log('[Sync] Server response:', res.data);
      setPlayer({
        ...res.data,
        ccc: parseFloat(res.data.ccc),
        cargoCCC: player.cargoCCC, // Сохраняем текущее значение cargoCCC
        cs: parseFloat(res.data.cs),
        ton: parseFloat(res.data.ton),
        lastCollectionTime: new Date(res.data.last_collection_time).getTime() || Date.now(),
        lastUpdateTime: new Date(res.data.last_update_time).getTime() || Date.now(),
      });
    } catch (err) {
      console.error('[Sync] Error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const collectCCC = async () => {
    if (!lastPlayerData.current || (player?.cargoCCC || 0) <= 0) {
      console.log('[Collect] Nothing to collect:', player?.cargoCCC);
      return;
    }
    setIsSyncing(true);
    try {
      if (player) {
        console.log('[Collect] Attempting to collect:', player.cargoCCC);
        await safeCollect(player.cargoCCC);
        console.log('[Collect] Successfully collected:', player.cargoCCC);
      }
    } catch (err) {
      console.error('[Collect] Error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{
      marginTop: '20px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      justifyContent: 'center',
      width: '100%',
      paddingRight: '20px'
    }}>
      <div
        style={{
          width: '120px',
          height: '120px',
          backgroundImage: 'url(/images/safe.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'drop-shadow(0 0 25px #00f0ff)',
          cursor: 'pointer',
          marginBottom: '15px',
          transform: isPressed ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.2s ease'
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => {
          setIsPressed(false);
          collectCCC();
        }}
        onMouseLeave={() => setIsPressed(false)}
      />
      <div style={{
        fontSize: '36px',
        fontFamily: 'Cursive, Orbitron, sans-serif',
        color: '#00f0ff',
        textShadow: '0 0 8px #00f0ff'
      }}>
        {(player?.cargoCCC || 0).toFixed(4)}
      </div>
    </div>
  );
};

export default CenterPanel;