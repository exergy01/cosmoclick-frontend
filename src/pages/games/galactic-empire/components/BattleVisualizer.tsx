import React, { useState } from 'react';
import BattleScreen from './BattleScreen'; // Оригинальная визуализация
import BattleScreenTactical from './BattleScreenTactical'; // Тактическая
import BattleScreenCinematic from './BattleScreenCinematic'; // Кинематографичная
import BattleScreenMinimal from './BattleScreenMinimal'; // Минималистичная
import BattleScreenElite from './BattleScreenElite'; // Elite wireframe стиль

interface BattleVisualizerProps {
  battleLog: any[];
  playerFleet: any[];
  enemyFleet: any[];
  winner: number;
  reward: number;
  onBattleEnd: () => void;
}

const BattleVisualizer: React.FC<BattleVisualizerProps> = (props) => {
  const [visualMode, setVisualMode] = useState<number>(5); // 1=Original, 2=Tactical, 3=Cinematic, 4=Minimal, 5=Elite

  // Выбор компонента по режиму
  const renderBattle = () => {
    switch (visualMode) {
      case 1:
        return <BattleScreen {...props} />;
      case 2:
        return <BattleScreenTactical {...props} />;
      case 3:
        return <BattleScreenCinematic {...props} />;
      case 4:
        return <BattleScreenMinimal {...props} />;
      case 5:
        return <BattleScreenElite {...props} />;
      default:
        return <BattleScreenElite {...props} />;
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Кнопки переключения режимов */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10000,
        display: 'flex',
        gap: '10px',
        flexDirection: 'column'
      }}>
        <button
          onClick={() => setVisualMode(1)}
          style={{
            padding: '10px 20px',
            background: visualMode === 1 ? '#ff6600' : 'rgba(0,0,0,0.7)',
            color: '#fff',
            border: '2px solid #ff6600',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          🚀 БОЙ 1 (Оригинал)
        </button>

        <button
          onClick={() => setVisualMode(2)}
          style={{
            padding: '10px 20px',
            background: visualMode === 2 ? '#00ff88' : 'rgba(0,0,0,0.7)',
            color: '#fff',
            border: '2px solid #00ff88',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          📊 БОЙ 2 (Тактика)
        </button>

        <button
          onClick={() => setVisualMode(3)}
          style={{
            padding: '10px 20px',
            background: visualMode === 3 ? '#ff00ff' : 'rgba(0,0,0,0.7)',
            color: '#fff',
            border: '2px solid #ff00ff',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          🎬 БОЙ 3 (Кино)
        </button>

        <button
          onClick={() => setVisualMode(4)}
          style={{
            padding: '10px 20px',
            background: visualMode === 4 ? '#00d4ff' : 'rgba(0,0,0,0.7)',
            color: '#fff',
            border: '2px solid #00d4ff',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          ⚡ БОЙ 4 (Минимал)
        </button>

        <button
          onClick={() => setVisualMode(5)}
          style={{
            padding: '10px 20px',
            background: visualMode === 5 ? '#00ff00' : 'rgba(0,0,0,0.7)',
            color: '#fff',
            border: '2px solid #00ff00',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: visualMode === 5 ? '0 0 20px rgba(0,255,0,0.6)' : 'none'
          }}
        >
          🎮 БОЙ 5 (ELITE)
        </button>
      </div>

      {/* Отрисовка выбранной визуализации */}
      {renderBattle()}
    </div>
  );
};

export default BattleVisualizer;
