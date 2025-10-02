import React from 'react';

interface BattleResultProps {
  winner: 'player' | 'enemy';
  onRestart: () => void;
}

const BattleResult: React.FC<BattleResultProps> = ({ winner, onRestart }) => {
  const isVictory = winner === 'player';

  return (
    <div className="battle-result">
      <div className="result-content">
        <h2>{isVictory ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}</h2>
        <p>{isVictory ? 'Вы получили 1500 Luminios' : 'Попробуйте еще раз'}</p>
        <button className="restart-button" onClick={onRestart}>
          Следующий бой
        </button>
      </div>
    </div>
  );
};

export default BattleResult;
