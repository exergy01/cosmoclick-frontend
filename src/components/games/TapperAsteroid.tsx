import React, { useState, useEffect } from 'react';

interface TapperAsteroidProps {
  onTap: () => void;
  energy: number;
  cccPerTap: number;
  colorStyle: string;
}

interface TapEffect {
  id: number;
  x: number;
  y: number;
  damage: number;
}

const TapperAsteroid: React.FC<TapperAsteroidProps> = ({ 
  onTap, 
  energy, 
  cccPerTap, 
  colorStyle 
}) => {
  const [tapEffects, setTapEffects] = useState<TapEffect[]>([]);
  const [asteroidShake, setAsteroidShake] = useState(false);
  const [asteroidRotation, setAsteroidRotation] = useState(0);

  // Постоянное вращение астероида
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setAsteroidRotation(prev => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(rotationInterval);
  }, []);

  // Очистка эффектов тапа
  useEffect(() => {
    const cleanup = setInterval(() => {
      setTapEffects(prev => prev.filter(effect => 
        Date.now() - effect.id < 1000
      ));
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  const handleTap = (event: React.MouseEvent) => {
    if (energy <= 0) return;

    // Координаты тапа
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Добавляем эффект урона
    const newEffect: TapEffect = {
      id: Date.now(),
      x,
      y,
      damage: cccPerTap
    };
    setTapEffects(prev => [...prev, newEffect]);

    // Эффект тряски астероида
    setAsteroidShake(true);
    setTimeout(() => setAsteroidShake(false), 200);

    // Вызываем колбэк
    onTap();
  };

  const asteroidSize = 200;
  const canTap = energy > 0;

  return (
    <div style={{
      position: 'relative',
      width: asteroidSize,
      height: asteroidSize,
      margin: '20px auto',
      cursor: canTap ? 'pointer' : 'not-allowed'
    }}>
      {/* Астероид */}
      <div
        onClick={handleTap}
        style={{
          width: '100%',
          height: '100%',
          background: canTap 
            ? `radial-gradient(circle at 30% 30%, #8B4513, #654321, #2F1B14)`
            : `radial-gradient(circle at 30% 30%, #555, #333, #111)`,
          borderRadius: '50%',
          border: canTap 
            ? `3px solid ${colorStyle}` 
            : '3px solid #666',
          boxShadow: canTap 
            ? `0 0 30px ${colorStyle}50, inset -20px -20px 40px rgba(0,0,0,0.5), inset 20px 20px 40px rgba(255,255,255,0.1)`
            : '0 0 10px #66650, inset -20px -20px 40px rgba(0,0,0,0.5)',
          transform: `rotate(${asteroidRotation}deg) ${asteroidShake ? 'scale(0.95)' : 'scale(1)'}`,
          transition: asteroidShake ? 'transform 0.1s ease' : 'transform 0.05s ease',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none'
        }}
      >
        {/* Кратеры на астероиде */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '25%',
          width: '15px',
          height: '15px',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '50%',
          boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.8)'
        }} />
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '30%',
          width: '20px',
          height: '20px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '50%',
          boxShadow: 'inset 3px 3px 8px rgba(0,0,0,0.8)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '25%',
          left: '40%',
          width: '12px',
          height: '12px',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '50%',
          boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8)'
        }} />

        {/* Центральная иконка */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '3rem',
          filter: canTap 
            ? `drop-shadow(0 0 10px ${colorStyle})`
            : 'drop-shadow(0 0 5px #666)',
          opacity: canTap ? 1 : 0.5
        }}>
          💥
        </div>

        {/* Подсказка при наведении */}
        {canTap && (
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: colorStyle,
            padding: '5px 10px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            opacity: 0,
            transition: 'opacity 0.3s ease'
          }}
          className="tap-hint"
          >
            +{cccPerTap} CCC
          </div>
        )}
      </div>

      {/* Эффекты урона */}
      {tapEffects.map(effect => (
        <div
          key={effect.id}
          style={{
            position: 'absolute',
            left: effect.x,
            top: effect.y,
            color: '#00ff00',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            pointerEvents: 'none',
            animation: 'damageFloat 1s ease-out forwards',
            textShadow: '0 0 10px #00ff00',
            zIndex: 10
          }}
        >
          +{effect.damage}
        </div>
      ))}

      {/* Частицы при тапе */}
      {asteroidShake && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '4px',
                height: '4px',
                background: colorStyle,
                borderRadius: '50%',
                animation: `particle${i} 0.5s ease-out forwards`,
                pointerEvents: 'none'
              }}
            />
          ))}
        </>
      )}

      <style>{`
        .tap-hint {
          opacity: 0;
        }
        
        div:hover .tap-hint {
          opacity: 1;
        }

        @keyframes damageFloat {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -150%) scale(1.5);
            opacity: 0;
          }
        }

        @keyframes particle0 {
          to { transform: translate(-30px, -30px); opacity: 0; }
        }
        @keyframes particle1 {
          to { transform: translate(30px, -30px); opacity: 0; }
        }
        @keyframes particle2 {
          to { transform: translate(-30px, 30px); opacity: 0; }
        }
        @keyframes particle3 {
          to { transform: translate(30px, 30px); opacity: 0; }
        }
        @keyframes particle4 {
          to { transform: translate(0, -40px); opacity: 0; }
        }
        @keyframes particle5 {
          to { transform: translate(0, 40px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TapperAsteroid; 
