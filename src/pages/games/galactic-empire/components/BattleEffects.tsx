import React from 'react';

const BattleEffects: React.FC = () => {
  return (
    <>
      {/* Лазеры кораблей */}
      <div className="laser-beam ship-laser sl1"></div>
      <div className="laser-beam ship-laser sl2"></div>
      <div className="laser-beam ship-laser sl3"></div>
      <div className="laser-beam ship-laser sl4"></div>
      <div className="laser-beam ship-laser sl5"></div>
      <div className="laser-beam ship-laser sl6"></div>

      {/* Взрывы */}
      <div className="explosion explosion1"></div>
      <div className="explosion explosion2"></div>
      <div className="explosion explosion3"></div>
      <div className="explosion explosion4"></div>
      <div className="explosion explosion5"></div>
      <div className="explosion explosion6"></div>

      {/* Эффекты попаданий */}
      <div className="hit-effect hit1"></div>
      <div className="hit-effect hit2"></div>
      <div className="hit-effect hit3"></div>
      <div className="hit-effect hit4"></div>
      <div className="hit-effect hit5"></div>
      <div className="hit-effect hit6"></div>
    </>
  );
};

export default BattleEffects;
