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
  const [isHovered, setIsHovered] = useState(false);

  // Очистка эффектов тапа
  useEffect(() => {
    const cleanup = setInterval(() => {
      setTapEffects(prev => prev.filter(effect => 
        Date.now() - effect.id < 1500
      ));
    }, 100);

    return () => clearInterval(cleanup);
  }, []);

  const handleTap = (event: React.MouseEvent | React.TouchEvent) => {
    if (energy <= 0) return;

    event.preventDefault();
    event.stopPropagation();

    // Координаты тапа (поддержка touch и mouse)
    const rect = event.currentTarget.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event && event.type.includes('touch')) {
      // Touch event
      const touch = event.touches[0] || event.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Mouse event
      const mouseEvent = event as React.MouseEvent;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Добавляем эффект урона
    const newEffect: TapEffect = {
      id: Date.now() + Math.random(),
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

  // Адаптивный размер астероида
  const getAsteroidSize = () => {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    if (vw < 480) return 180; // Мобильные
    if (vw < 768) return 200; // Планшеты
    return 220; // Десктоп
  };

  const asteroidSize = getAsteroidSize();
  const canTap = energy > 0;

  return (
    <div style={{
      position: 'relative',
      width: asteroidSize,
      height: asteroidSize,
      margin: '20px auto',
      cursor: canTap ? 'pointer' : 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Подсветка при наведении */}
      {canTap && isHovered && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colorStyle}20, transparent 70%)`,
          animation: 'pulse 1.5s infinite',
          pointerEvents: 'none',
          zIndex: 1
        }} />
      )}

      {/* Астероид с улучшенным дизайном */}
      <div
        onClick={handleTap}
        onTouchStart={handleTap}
        onTouchEnd={(e) => e.preventDefault()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: asteroidShake 
            ? 'scale(0.92)' 
            : isHovered && canTap 
              ? 'scale(1.08)' 
              : 'scale(1)',
          opacity: canTap ? 1 : 0.4,
          filter: canTap 
            ? `drop-shadow(0 0 20px ${colorStyle}30) brightness(1.1)` 
            : 'brightness(0.6)',
          zIndex: 2
        }}
      >
        {/* Градиентная подложка */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)`,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Изображение астероида */}
        <img 
          src="/assets/games/asteroid.png" 
          alt="Asteroid" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            pointerEvents: 'none',
            borderRadius: '50%'
          }}
        />

        {/* Эффект блеска при наведении */}
        {canTap && isHovered && (
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '30%',
            height: '30%',
            background: `radial-gradient(circle, rgba(255,255,255,0.6), transparent 70%)`,
            borderRadius: '50%',
            animation: 'sparkle 2s infinite',
            pointerEvents: 'none',
            zIndex: 2
          }} />
        )}

        {/* Индикатор энергии */}
        {energy <= 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.8)',
            color: '#ff6b6b',
            padding: '8px 15px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            border: '2px solid #ff6b6b',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 3,
            backdropFilter: 'blur(5px)'
          }}>
            ⚡ 0
          </div>
        )}
      </div>

      {/* Подсказка при наведении (улучшенная) */}
      {canTap && isHovered && (
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(145deg, rgba(0,0,0,0.9), rgba(20,20,20,0.9))',
          color: colorStyle,
          padding: '8px 15px',
          borderRadius: '15px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
          border: `2px solid ${colorStyle}`,
          boxShadow: `0 5px 20px ${colorStyle}30`,
          animation: 'fadeInUp 0.3s ease-out',
          backdropFilter: 'blur(10px)',
          textShadow: `0 0 10px ${colorStyle}`
        }}>
          +{cccPerTap} CCC
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: `8px solid ${colorStyle}`
          }} />
        </div>
      )}

      {/* Эффекты урона (улучшенные) */}
      {tapEffects.map(effect => (
        <div
          key={effect.id}
          style={{
            position: 'absolute',
            left: effect.x,
            top: effect.y,
            color: colorStyle,
            fontWeight: 'bold',
            fontSize: 'clamp(1rem, 4vw, 1.4rem)',
            pointerEvents: 'none',
            animation: 'damageFloat 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            textShadow: `0 0 15px ${colorStyle}, 0 0 30px ${colorStyle}50`,
            zIndex: 15,
            filter: `drop-shadow(0 0 5px ${colorStyle})`
          }}
        >
          +{effect.damage}
        </div>
      ))}

      {/* Частицы при тапе (улучшенные) */}
      {asteroidShake && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '6px',
                height: '6px',
                background: `linear-gradient(45deg, ${colorStyle}, #fff)`,
                borderRadius: '50%',
                animation: `particle${i} 0.8s ease-out forwards`,
                pointerEvents: 'none',
                boxShadow: `0 0 10px ${colorStyle}`,
                zIndex: 5
              }}
            />
          ))}
          
          {/* Центральная вспышка */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            background: `radial-gradient(circle, ${colorStyle}30, transparent 60%)`,
            borderRadius: '50%',
            animation: 'flash 0.3s ease-out',
            pointerEvents: 'none',
            zIndex: 4
          }} />
        </>
      )}

      {/* Глобальные стили для анимаций */}
      <style>{`
        @keyframes damageFloat {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -80%) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -120%) scale(1);
            opacity: 0;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes flash {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes particle0 {
          to { 
            transform: translate(-40px, -40px) scale(0); 
            opacity: 0; 
          }
        }
        @keyframes particle1 {
          to { 
            transform: translate(40px, -40px) scale(0); 
            opacity: 0; 
          }
        }
        @keyframes particle2 {
          to { 
            transform: translate(-40px, 40px) scale(0); 
            opacity: 0; 
          }
        }
        @keyframes particle3 {
          to { 
            transform: translate(40px, 40px) scale(0); 
            opacity: 0; 
          }
        }
        @keyframes particle4 {
          to { 
            transform: translate(0, -50px) scale(0); 
            opacity: 0; 
          }
        }
        @keyframes particle5 {
          to { 
            transform: translate(0, 50px) scale(0); 
            opacity: 0; 
          }
        }
        @keyframes particle6 {
          to { 
            transform: translate(-50px, 0) scale(0); 
            opacity: 0; 
          }
        }
        @keyframes particle7 {
          to { 
            transform: translate(50px, 0) scale(0); 
            opacity: 0; 
          }
        }
      `}</style>
    </div>
  );
};

export default TapperAsteroid;