// galactic-slots/components/SlotMachine.tsx

import React, { useEffect, useState, useRef } from 'react';
import { SlotGameState, SlotSymbol, SlotResult, WinningLine, PAYLINES } from '../types';

interface SlotMachineProps {
  gameState: SlotGameState;
  lastResult: SlotResult | null;
  colorStyle: string;
}

// ИСПРАВЛЕНО: Константы анимации прямо в компоненте
const ANIMATION_CONFIG = {
  SPIN_DURATION_BASE: 1500,
  SPIN_DURATION_INCREMENT: 300,
  SPIN_SPEED: 50,
  REVEAL_DELAY: 1000,
  WIN_ANIMATION_DURATION: 2000
};

const SlotMachine: React.FC<SlotMachineProps> = ({ gameState, lastResult, colorStyle }) => {
  const [displaySymbols, setDisplaySymbols] = useState<SlotSymbol[]>(
    Array(15).fill('☄️') as SlotSymbol[]
  );
  const [winningPositions, setWinningPositions] = useState<Set<number>>(new Set());
  const [showWinLines, setShowWinLines] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Refs для каждого барабана
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Все возможные символы для вращения
  const allSymbols: SlotSymbol[] = ['🌟', '🚀', '🌌', '⭐', '🌍', '☄️'];
  
  // Функция для установки ref
  const setReelRef = (index: number) => (el: HTMLDivElement | null) => {
    reelRefs.current[index] = el;
  };
  
  // Создаем длинную полосу символов для каждого барабана
  const createReelStrip = () => {
    const strip: SlotSymbol[] = [];
    for (let i = 0; i < 30; i++) { // 30 символов на барабан
      strip.push(allSymbols[Math.floor(Math.random() * allSymbols.length)]);
    }
    return strip;
  };

  // РЕАЛЬНАЯ АНИМАЦИЯ ВРАЩЕНИЯ БАРАБАНОВ
  useEffect(() => {
    if (gameState === 'spinning') {
      console.log('🎰 Starting REAL slot machine spin...');
      setIsSpinning(true);
      setWinningPositions(new Set());
      setShowWinLines(false);
      
      // Запускаем вращение каждого барабана с задержкой
      const spinReels = async () => {
        const promises = [];
        
        for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
          const promise = new Promise<void>((resolve) => {
            setTimeout(() => {
              spinSingleReel(reelIndex, resolve);
            }, reelIndex * 200); // Задержка между барабанами
          });
          promises.push(promise);
        }
        
        // Ждем завершения всех барабанов
        await Promise.all(promises);
        setIsSpinning(false);
        console.log('🎰 All reels stopped spinning');
      };
      
      spinReels();
    }
  }, [gameState]);

  // Вращение одного барабана
  const spinSingleReel = (reelIndex: number, onComplete: () => void) => {
    const reel = reelRefs.current[reelIndex];
    if (!reel) return;
    
    const spinDuration = ANIMATION_CONFIG.SPIN_DURATION_BASE + reelIndex * ANIMATION_CONFIG.SPIN_DURATION_INCREMENT;
    const spinSpeed = ANIMATION_CONFIG.SPIN_SPEED;
    
    console.log(`🎰 Spinning reel ${reelIndex} for ${spinDuration}ms`);
    
    let currentStrip = createReelStrip();
    let currentIndex = 0;
    
    const spinInterval = setInterval(() => {
      // Обновляем символы в этом барабане (3 символа подряд)
      for (let row = 0; row < 3; row++) {
        const symbolIndex = reelIndex + row * 5; // Позиция в массиве 15 символов
        const stripIndex = (currentIndex + row) % currentStrip.length;
        
        setDisplaySymbols(prev => {
          const newSymbols = [...prev];
          newSymbols[symbolIndex] = currentStrip[stripIndex];
          return newSymbols;
        });
      }
      
      currentIndex = (currentIndex + 1) % currentStrip.length;
      
      // Добавляем эффект размытия во время вращения
      if (reel) {
        reel.style.filter = 'blur(1px)';
        reel.style.transform = 'scale(0.98)';
      }
    }, spinSpeed);
    
    // Останавливаем барабан
    setTimeout(() => {
      clearInterval(spinInterval);
      
      // Убираем эффекты
      if (reel) {
        reel.style.filter = 'none';
        reel.style.transform = 'scale(1)';
      }
      
      console.log(`🎰 Reel ${reelIndex} stopped`);
      onComplete();
    }, spinDuration);
  };

  // Показ результата
  useEffect(() => {
    if (gameState === 'revealing' && lastResult && !isSpinning) {
      console.log('🎰 Revealing result:', lastResult);
      setDisplaySymbols(lastResult.symbols);
      
      // Показываем выигрышные позиции через секунду
      setTimeout(() => {
        if (lastResult.winningLines.length > 0) {
          const positions = new Set<number>();
          lastResult.winningLines.forEach((line: WinningLine) => {
            const payline = PAYLINES[line.line - 1];
            if (payline) {
              payline.slice(0, line.count).forEach(pos => positions.add(pos));
            }
          });
          setWinningPositions(positions);
          setShowWinLines(true);
          console.log('🎰 Showing winning positions:', Array.from(positions));
        }
      }, ANIMATION_CONFIG.REVEAL_DELAY);
    }
  }, [gameState, lastResult, isSpinning]);

  // Сброс при новой игре
  useEffect(() => {
    if (gameState === 'waiting') {
      setWinningPositions(new Set());
      setShowWinLines(false);
      setIsSpinning(false);
    }
  }, [gameState]);

  const getSymbolStyle = (index: number): React.CSSProperties => {
    const isWinning = winningPositions.has(index);
    const currentlySpinning = isSpinning;
    
    return {
      width: '60px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2.5rem',
      background: isWinning 
        ? `linear-gradient(45deg, ${colorStyle}40, ${colorStyle}60)`
        : 'rgba(255, 255, 255, 0.1)',
      border: isWinning 
        ? `2px solid ${colorStyle}` 
        : '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      transition: currentlySpinning ? 'none' : 'all 0.3s ease',
      transform: isWinning ? 'scale(1.1)' : 'scale(1)',
      boxShadow: isWinning 
        ? `0 0 20px ${colorStyle}80` 
        : 'none',
      animation: isWinning 
        ? 'win-pulse 1s infinite' 
        : 'none'
    };
  };

  const getReelStyle = (reelIndex: number): React.CSSProperties => {
    return {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'all 0.2s ease'
    };
  };

  const renderWinLines = () => {
    if (!showWinLines || !lastResult?.winningLines.length) return null;

    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none'
      }}>
        {lastResult.winningLines.map((line: WinningLine, index: number) => {
          const payline = PAYLINES[line.line - 1];
          if (!payline) return null;
          
          const positions = payline.slice(0, line.count);
          
          return (
            <svg key={index} style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              zIndex: 2
            }}>
              <path
                d={getLinePath(positions)}
                stroke={colorStyle}
                strokeWidth="3"
                fill="none"
                strokeDasharray="5,5"
                style={{
                  animation: 'line-draw 2s infinite'
                }}
              />
            </svg>
          );
        })}
      </div>
    );
  };

  const getLinePath = (positions: number[]): string => {
    const getPosition = (index: number) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      const x = col * 70 + 35;
      const y = row * 70 + 35;
      return { x, y };
    };

    if (positions.length < 2) return '';
    
    const firstPos = getPosition(positions[0]);
    let path = `M ${firstPos.x} ${firstPos.y}`;
    
    for (let i = 1; i < positions.length; i++) {
      const pos = getPosition(positions[i]);
      path += ` L ${pos.x} ${pos.y}`;
    }
    
    return path;
  };

  const getGameStatusMessage = () => {
    switch (gameState) {
      case 'waiting':
        return '🎲 Готов к игре';
      case 'spinning':
        return '🎰 Вращение барабанов...';
      case 'revealing':
        return '✨ Результат...';
      case 'finished':
        if (lastResult) {
          if (lastResult.isWin) {
            const multiplier = Math.round(lastResult.totalWin / lastResult.betAmount);
            if (multiplier >= 20) {
              return `💎 МЕГА ВЫИГРЫШ: ${lastResult.totalWin.toLocaleString()} CCC!`;
            } else if (multiplier >= 5) {
              return `⭐ БОЛЬШОЙ ВЫИГРЫШ: ${lastResult.totalWin.toLocaleString()} CCC!`;
            } else {
              return `🎉 Выигрыш: ${lastResult.totalWin.toLocaleString()} CCC!`;
            }
          } else {
            return '💸 Удачи в следующий раз!';
          }
        }
        return '✅ Игра завершена';
      default:
        return '';
    }
  };

  return (
    <div style={{
      position: 'relative',
      background: 'rgba(0, 0, 0, 0.3)',
      border: `2px solid ${colorStyle}`,
      borderRadius: '15px',
      padding: '20px',
      boxShadow: `0 0 30px ${colorStyle}40`
    }}>
      {/* CSS анимации */}
      <style>
        {`
          @keyframes win-pulse {
            0%, 100% { 
              transform: scale(1.1); 
              opacity: 1; 
              box-shadow: 0 0 20px ${colorStyle}80;
            }
            50% { 
              transform: scale(1.2); 
              opacity: 0.8; 
              box-shadow: 0 0 30px ${colorStyle};
            }
          }
          
          @keyframes line-draw {
            0%, 100% { opacity: 0.8; }
            50% { opacity: 1; }
          }
        `}
      </style>

      {/* Заголовок */}
      <div style={{
        textAlign: 'center',
        marginBottom: '15px',
        color: colorStyle,
        fontSize: '1.2rem',
        fontWeight: 'bold',
        textShadow: `0 0 10px ${colorStyle}`
      }}>
        🎰 GALACTIC FORTUNE
      </div>

      {/* Игровое поле 3x5 с настоящими барабанами */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px',
        justifyContent: 'center',
        position: 'relative',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {/* Рендерим по барабанам */}
        {[0, 1, 2, 3, 4].map(reelIndex => (
          <div
            key={reelIndex}
            ref={setReelRef(reelIndex)}
            style={getReelStyle(reelIndex)}
          >
            {/* 3 символа в каждом барабане */}
            {[0, 1, 2].map(row => {
              const symbolIndex = reelIndex + row * 5;
              return (
                <div
                  key={symbolIndex}
                  style={getSymbolStyle(symbolIndex)}
                >
                  {displaySymbols[symbolIndex]}
                </div>
              );
            })}
          </div>
        ))}
        
        {renderWinLines()}
      </div>

      {/* Статус игры */}
      <div style={{
        textAlign: 'center',
        marginTop: '15px',
        color: '#ccc',
        fontSize: '0.9rem',
        minHeight: '20px'
      }}>
        {getGameStatusMessage()}
      </div>

      {/* Информация о выигрыше */}
      {lastResult && lastResult.winningLines.length > 0 && gameState === 'finished' && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          background: `${colorStyle}20`,
          border: `1px solid ${colorStyle}`,
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#ccc'
        }}>
          <div style={{ 
            color: colorStyle, 
            fontWeight: 'bold', 
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            🏆 Выигрышные линии:
          </div>
          <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
            {lastResult.winningLines.map((line, index) => (
              <div key={index} style={{ 
                marginBottom: '4px',
                padding: '4px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '4px'
              }}>
                <strong>Линия {line.line}:</strong> {line.symbol} x{line.count} = {line.winAmount.toLocaleString()} CCC
                {line.hasWild && <span style={{ color: '#ffd700' }}> ⭐WILD x2</span>}
              </div>
            ))}
          </div>
          <div style={{ 
            marginTop: '8px', 
            textAlign: 'center',
            color: colorStyle,
            fontWeight: 'bold',
            borderTop: `1px solid ${colorStyle}40`,
            paddingTop: '8px'
          }}>
            Общий выигрыш: {lastResult.totalWin.toLocaleString()} CCC
          </div>
        </div>
      )}

      {/* Индикатор линий выплат */}
      <div style={{
        marginTop: '10px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#999'
      }}>
        20 активных линий выплат • RTP: 85%
      </div>
    </div>
  );
};

export default SlotMachine;