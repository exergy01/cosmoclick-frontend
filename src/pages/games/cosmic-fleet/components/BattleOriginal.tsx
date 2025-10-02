import React from 'react';
import { Ship } from '../types/ships';

interface BattleOriginalProps {
  playerShip: Ship;
  onBattleComplete: (result: any) => void;
  onClose: () => void;
}

const BattleOriginal: React.FC<BattleOriginalProps> = ({
  playerShip,
  onBattleComplete,
  onClose
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      zIndex: 9999
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 68, 68, 0.2)',
          border: '1px solid #ff4444',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          color: '#ff4444',
          fontSize: '1.2rem',
          cursor: 'pointer',
          zIndex: 10000
        }}
      >
        ✕
      </button>

      <iframe
        src="/battle-original.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title="Battle Original"
      />
    </div>
  );
};

export default BattleOriginal;
