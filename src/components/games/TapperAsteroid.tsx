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
      {/* Астероид с картинкой */}
      <div
        onClick={handleTap}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          transition: 'all 0.3s ease',
          transform: asteroidShake ? 'scale(0.95)' : 'scale(1)',
          opacity: canTap ? 1 : 0.5
        }}
        onMouseEnter={e => {
          if (canTap) {
            e.currentTarget.style.transform = 'scale(1.1)';
          }
        }}
        onMouseLeave={e => {
          if (canTap && !asteroidShake) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        {/* Изображение астероида */}
        <img 
          src="/assets/games/asteroid.png" 
          alt="Asteroid" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            pointerEvents: 'none'
          }}
        />

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
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            zIndex: 3
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

      {/* Глобальные стили для анимаций */}
      <style>{`
        .tap-hint {
          opacity: 0;
          transition: opacity 0.3s ease;
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