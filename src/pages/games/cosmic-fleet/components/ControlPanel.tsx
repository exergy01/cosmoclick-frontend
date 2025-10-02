import React from 'react';

interface ControlPanelProps {
  onTargetSelect: (shipId: number) => void;
  onEwarActivate: () => void;
  onAutoBattle: () => void;
  targetShips: Array<{ id: number; name: string }>;
  ewarActive: boolean;
  autoBattle: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onTargetSelect,
  onEwarActivate,
  onAutoBattle,
  targetShips,
  ewarActive,
  autoBattle
}) => {
  return (
    <div className="control-panel">
      <h4>УПРАВЛЕНИЕ</h4>

      <button
        className={`ewar-button ${ewarActive ? 'active' : ''}`}
        onClick={onEwarActivate}
        disabled={ewarActive}
      >
        РЭБ
      </button>

      <button
        className={`auto-battle-button ${autoBattle ? 'active' : ''}`}
        onClick={onAutoBattle}
      >
        АВТО БОЙ
      </button>

      <div className="target-buttons">
        {targetShips.map((ship) => (
          <button
            key={ship.id}
            className="target-button"
            onClick={() => onTargetSelect(ship.id)}
            data-target={ship.id}
          >
            Цель: {ship.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ControlPanel;
