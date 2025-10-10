import React from 'react';

interface BattleResultProps {
  winner: number;
  reward: number;
  onRestart: () => void;
}

const BattleResult: React.FC<BattleResultProps> = ({ winner, reward, onRestart }) => {
  const isVictory = winner === 1;

  return (
    <div className="battle-result">
      <div className="result-content">
        <h2>{isVictory ? '🎉 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ'}</h2>
        <p>{isVictory ? `Награда: ${reward} Luminios` : 'Попробуйте еще раз'}</p>
        <button className="restart-button" onClick={onRestart}>
          Завершить бой
        </button>
      </div>
    </div>
  );
};

export default BattleResult;
