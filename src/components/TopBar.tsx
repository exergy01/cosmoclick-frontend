import React from 'react';
import { usePlayer } from '../context/PlayerContext';

const TopBar: React.FC = () => {
  const { player } = usePlayer();

  const ccc = (player?.ccc ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const cs = (player?.cs ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const ton = Number(player?.ton || 0).toFixed(7);

  const cccPerHour = (0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      style={{
        width: '90%',
        backgroundColor: 'rgba(0, 0, 34, 0.8)',
        border: '2px solid #00f0ff',
        borderRadius: '12px',
        padding: '12px',
        marginTop: '10px',
        marginBottom: '10px',
        boxShadow: '0 0 12px #00f0ff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div><b>💠 CCC {ccc}</b></div>
        <div>📈 CCC {cccPerHour} в час</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <div><b>✨ CS {cs}</b></div>
        <div><b>💎 TON {ton}</b></div>
      </div>
    </div>
  );
};

export default TopBar;
