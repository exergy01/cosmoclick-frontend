// galactic-slots/components/SlotMachine.tsx

import React, { useEffect, useState, useRef } from 'react';
import { SlotGameState, SlotSymbol, SlotResult, WinningLine, PAYLINES, SlotTranslations } from '../types';
import { formatTranslation } from '../utils/formatters';

interface SlotMachineProps {
  gameState: SlotGameState;
  lastResult: SlotResult | null;
  colorStyle: string;
  t: any; // <-- вот так
}

const SlotMachine: React.FC<SlotMachineProps> = ({ gameState, lastResult, colorStyle, t }) => {
  const [displaySymbols, setDisplaySymbols] = useState<SlotSymbol[]>(
    Array(15).fill('☄️') as SlotSymbol[]
  );
  const [winningPositions, setWinningPositions] = useState<Set<number>>(new Set());
  const [showWinLines, setShowWinLines] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Refs для каждого барабана
  const reelRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Все возможные символы для вращения
  const allSymbols: SlotSymbol[] = ['🌟', '🚀', '🌌', '⭐', '🌍', '☄️', '🛸'];
  
  // Функция для установки ref
  const setReelRef = (index: number) => (el: HTMLDivElement | null) => {
    reelRefs.current[index] = el;
  };
  
  // Создаем длинную полосу символов для каждого барабана
  const createReelStrip = () => {
    const strip: SlotSymbol[] = [];
    for (let i = 0; i < 30; i++) {
      strip.push(allSymbols[Math.floor(Math.random() * allSymbols.length)]);
    }
    return strip;
  };

  // Анимация вращения барабанов
  useEffect(() => {
    if (gameState === 'spinning') {
      console.log('🎰 Starting slot machine spin...');
      setIsSpinning(true);
      setWinningPositions(new Set());
      setShowWinLines(false);
      
      // Сбрасываем поле на случайные символы
      const randomField = Array(15).fill(null).map(() => 
        allSymbols[Math.floor(Math.random() * allSymbols.length)]
      );
      setDisplaySymbols(randomField);
      
      // Запускаем вращение каждого барабана с задержкой
      const spinReels = async () => {
        const promises = [];
        
        for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
          const promise = new Promise<void>((resolve) => {
            setTimeout(() => {
              spinSingleReel(reelIndex, resolve);
            }, reelIndex * 100);
          });
          promises.push(promise);
        }
        
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
    
    const spinDuration = 2500 + reelIndex * 200;
    const spinSpeed = 80;
    
    console.log(`🎰 Spinning reel ${reelIndex} for ${spinDuration}ms`);
    
    let currentStrip = createReelStrip();
    let currentIndex = 0;
    
    // Добавляем визуальное размытие
    if (reel) {
      reel.style.filter = 'blur(3px)';
      reel.style.transform = 'scale(0.95)';
      reel.style.transition = 'all 0.2s ease';
    }
    
    const spinInterval = setInterval(() => {
      const newSymbols = [...displaySymbols];
      for (let row = 0; row < 3; row++) {
        const symbolIndex = reelIndex + row * 5;
        const stripIndex = (currentIndex + row) % currentStrip.length;
        newSymbols[symbolIndex] = currentStrip[stripIndex];
      }
      setDisplaySymbols(newSymbols);
      
      currentIndex = (currentIndex + 1) % currentStrip.length;
    }, spinSpeed);
    
    setTimeout(() => {
      clearInterval(spinInterval);
      
      if (reel) {
        reel.style.filter = 'none';
        reel.style.transform = 'scale(1)';
        reel.style.transition = 'all 0.3s ease';
      }
      
      console.log(`🎰 Reel ${reelIndex} stopped`);
      onComplete();
    }, spinDuration);
  };

  // Показ результата
  useEffect(() => {
    if (gameState === 'revealing' && lastResult && !isSpinning) {
      console.log('🎰 Revealing final result:', lastResult);
      setDisplaySymbols(lastResult.symbols);
      setWinningPositions(new Set());
      setShowWinLines(false);
    }
  }, [gameState, lastResult, isSpinning]);

  // Показ выигрышных линий
  useEffect(() => {
    if (gameState === 'finished' && lastResult && !isSpinning) {
      console.log('🎰 Showing winning lines:', lastResult.winningLines);
      
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
      background: isWinning && gameState === 'finished'
        ? `linear-gradient(45deg, ${colorStyle}40, ${colorStyle}60)`
        : 'rgba(255, 255, 255, 0.1)',
      border: isWinning && gameState === 'finished'
        ? `2px solid ${colorStyle}` 
        : '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      transition: currentlySpinning ? 'none' : 'all 0.3s ease',
      transform: isWinning && gameState === 'finished' ? 'scale(1.1)' : 'scale(1)',
      boxShadow: isWinning && gameState === 'finished'
        ? `0 0 20px ${colorStyle}80` 
        : 'none',
      animation: isWinning && gameState === 'finished'
        ? 'win-pulse 1s infinite' 
        : 'none',
      filter: currentlySpinning ? 'blur(1px)' : 'none'
    };
  };

  const getReelStyle = (reelIndex: number): React.CSSProperties => {
    return {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: isSpinning ? 'none' : 'all 0.2s ease'
    };
  };

  // Показ линий выплат
  const renderWinLines = () => {
    if (!showWinLines || !lastResult?.winningLines.length || gameState !== 'finished') return null;

    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 2
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

  // Сообщения статуса игры
  const getGameStatusMessage = () => {
    switch (gameState) {
      case 'waiting':
        return `🎲 ${t.gameStates.waiting}`;
      case 'spinning':
        return `🎰 ${t.gameStates.spinning}`;
      case 'revealing':
        return `✨ ${t.gameStates.revealing}`;
      case 'finished':
        if (lastResult) {
          if (lastResult.isWin) {
            const multiplier = Math.round(lastResult.totalWin / lastResult.betAmount);
            if (multiplier >= 5) {
              return formatTranslation(t.winMessages.excellentWin, { amount: lastResult.totalWin.toLocaleString() });
            } else if (multiplier >= 2) {
              return formatTranslation(t.winMessages.goodWin, { amount: lastResult.totalWin.toLocaleString() });
            } else {
              return formatTranslation(t.winMessages.regularWin, { amount: lastResult.totalWin.toLocaleString() });
            }
          } else {
            return t.winMessages.loss;
          }
        }
        return t.gameStates.finished;
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
        🎰 {t.title}
      </div>

      {/* Игровое поле 3x5 */}
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
          color: '#ccc',
          maxHeight: '150px',
          overflowY: 'auto'
        }}>
          <div style={{ 
            color: colorStyle, 
            fontWeight: 'bold', 
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            🏆 {t.winningLines.title}
          </div>
          {lastResult.winningLines.map((line, index) => (
            <div key={index} style={{ 
              marginBottom: '4px',
              padding: '4px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>
              <strong>{t.winningLines.line} {line.line}:</strong> {line.symbol} x{line.count} = {line.winAmount.toLocaleString()} CCC
              {line.hasWild && <span style={{ color: '#ffd700' }}> ⭐{t.winningLines.wild}</span>}
            </div>
          ))}
          <div style={{ 
            marginTop: '8px', 
            textAlign: 'center',
            color: colorStyle,
            fontWeight: 'bold',
            borderTop: `1px solid ${colorStyle}40`,
            paddingTop: '8px'
          }}>
            {t.winningLines.totalWin}: {lastResult.totalWin.toLocaleString()} CCC
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
        20 {t.symbols.activePaylines} • {t.rtpInfo}
      </div>
    </div>
  );
};

export default SlotMachine;