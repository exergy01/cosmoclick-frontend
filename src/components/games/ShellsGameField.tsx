import React, { useState, useEffect } from 'react';

interface ShellsGameFieldProps {
  gameState: 'waiting' | 'shuffling' | 'choosing' | 'revealing' | 'finished';
  onShellClick: (position: number) => void;
  revealedPositions?: string[]; // ['galaxy', 'blackhole', 'blackhole']
  winningPosition?: number;
  chosenPosition?: number;
  colorStyle: string;
}

const ShellsGameField: React.FC<ShellsGameFieldProps> = ({
  gameState,
  onShellClick,
  revealedPositions,
  winningPosition,
  chosenPosition,
  colorStyle
}) => {
  const [shuffleAnimation, setShuffleAnimation] = useState(false);
  const [shellPositions, setShellPositions] = useState([0, 1, 2]);
  const [hoveredShell, setHoveredShell] = useState<number | null>(null);

  // Анимация перемешивания
  useEffect(() => {
    if (gameState === 'shuffling') {
      setShuffleAnimation(true);
      
      // Симуляция перемешивания позиций
      const shuffleInterval = setInterval(() => {
        setShellPositions(prev => {
          const newPositions = [...prev];
          // Случайно меняем местами два элемента
          const i = Math.floor(Math.random() * 3);
          const j = Math.floor(Math.random() * 3);
          [newPositions[i], newPositions[j]] = [newPositions[j], newPositions[i]];
          return newPositions;
        });
      }, 150);

      // Останавливаем анимацию через 5 секунд
      const stopShuffle = setTimeout(() => {
        setShuffleAnimation(false);
        setShellPositions([0, 1, 2]); // Возвращаем в исходные позиции
        clearInterval(shuffleInterval);
      }, 5000);

      return () => {
        clearTimeout(stopShuffle);
        clearInterval(shuffleInterval);
      };
    }
  }, [gameState]);

  // Рендер содержимого под тарелкой
  const renderUnderShell = (position: number) => {
    if (gameState !== 'revealing' && gameState !== 'finished') {
      return null;
    }

    if (!revealedPositions) return null;

    const content = revealedPositions[position];
    const isWinning = position === winningPosition;
    const isChosen = position === chosenPosition;

    return (
      <div style={{
        position: 'absolute',
        top: '60%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80px',
        height: '80px',
        zIndex: 1
      }}>
        <img
          src={`/assets/games/${content}.png`}
          alt={content}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: isWinning && isChosen 
              ? `drop-shadow(0 0 20px #00ff00) drop-shadow(0 0 40px #00ff00)`
              : content === 'blackhole' && isChosen
              ? `drop-shadow(0 0 20px #ff0000) drop-shadow(0 0 40px #ff0000)`
              : 'none',
            animation: isWinning && isChosen ? 'winPulse 1s infinite' : 'none'
          }}
        />
      </div>
    );
  };

  // Рендер одной тарелки НЛО
  const renderShell = (position: number) => {
    const actualPosition = shellPositions[position];
    const isClickable = gameState === 'choosing';
    const isChosen = position === chosenPosition;
    const isRevealed = gameState === 'revealing' || gameState === 'finished';
    const isHovered = hoveredShell === position;

    return (
      <div
        key={position}
        style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          margin: '0 20px',
          cursor: isClickable ? 'pointer' : 'default',
          transform: shuffleAnimation 
            ? `translate(${(actualPosition - position) * 160}px, ${Math.sin(Date.now() * 0.01 + position) * 30}px) scale(${isHovered && isClickable ? 1.1 : 1})`
            : `scale(${isHovered && isClickable ? 1.1 : 1})`,
          transition: shuffleAnimation 
            ? 'transform 0.15s ease-in-out'
            : 'transform 0.3s ease',
          zIndex: isChosen ? 10 : 5
        }}
        onClick={() => isClickable && onShellClick(position)}
        onMouseEnter={() => isClickable && setHoveredShell(position)}
        onMouseLeave={() => setHoveredShell(null)}
      >
        {/* Содержимое под тарелкой */}
        {renderUnderShell(position)}

        {/* НЛО тарелка */}
        <div style={{
          position: 'absolute',
          top: isRevealed && isChosen ? '20px' : '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100px',
          height: '60px',
          transition: 'top 0.8s ease',
          zIndex: 6
        }}>
          <img
            src="/assets/games/ufo.png"
            alt="UFO"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: isClickable
                ? `drop-shadow(0 0 10px ${colorStyle}) drop-shadow(0 0 20px ${colorStyle})`
                : isChosen
                ? `drop-shadow(0 0 15px ${colorStyle}) drop-shadow(0 0 30px ${colorStyle})`
                : 'drop-shadow(0 0 5px rgba(255,255,255,0.5))',
              transition: 'filter 0.3s ease'
            }}
          />
        </div>

        {/* Индикация выбранной тарелки */}
        {isChosen && (
          <div style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            color: colorStyle,
            fontSize: '2rem',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${colorStyle}`,
            animation: 'bounce 1s infinite',
            zIndex: 7
          }}>
            ⬇️
          </div>
        )}

        {/* Подсказка при наведении */}
        {isClickable && isHovered && (
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: colorStyle,
            padding: '5px 10px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            textShadow: `0 0 5px ${colorStyle}`
          }}>
            Выбрать
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      margin: '40px 0',
      position: 'relative'
    }}>
      {/* Игровое поле */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '20px',
        position: 'relative'
      }}>
        {[0, 1, 2].map(renderShell)}
      </div>

      {/* Инструкция для игрока */}
      <div style={{
        position: 'absolute',
        bottom: '-60px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        color: '#ccc'
      }}>
        {gameState === 'waiting' && (
          <p style={{ color: colorStyle, fontWeight: 'bold' }}>
            🎯 Сделайте ставку чтобы начать игру
          </p>
        )}
        {gameState === 'shuffling' && (
          <p style={{ color: colorStyle, fontWeight: 'bold' }}>
            🌀 Тарелки перемешиваются...
          </p>
        )}
        {gameState === 'choosing' && (
          <p style={{ color: colorStyle, fontWeight: 'bold' }}>
            👆 Выберите тарелку с галактикой!
          </p>
        )}
        {gameState === 'revealing' && (
          <p style={{ color: colorStyle, fontWeight: 'bold' }}>
            ✨ Открываем результат...
          </p>
        )}
      </div>

      {/* CSS анимации */}
      <style>{`
        @keyframes winPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-10px); }
          60% { transform: translateX(-50%) translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default ShellsGameField;