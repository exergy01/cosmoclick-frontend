// galactic-slots/components/SlotMachine.tsx

import React, { useEffect, useState } from 'react';
import { SlotGameState, SlotSymbol, SlotResult, WinningLine, PAYLINES } from '../types';

interface SlotMachineProps {
  gameState: SlotGameState;
  lastResult: SlotResult | null;
  colorStyle: string;
}

const SlotMachine: React.FC<SlotMachineProps> = ({ gameState, lastResult, colorStyle }) => {
  const [displaySymbols, setDisplaySymbols] = useState<SlotSymbol[]>(
    Array(15).fill('☄️') as SlotSymbol[]
  );
  const [winningPositions, setWinningPositions] = useState<Set<number>>(new Set());
  const [showWinLines, setShowWinLines] = useState(false);

  // Анимация спина
  useEffect(() => {
    if (gameState === 'spinning') {
      setWinningPositions(new Set());
      setShowWinLines(false);
      
      // Анимация вращения - быстрая смена символов
      const symbols: SlotSymbol[] = ['🌟', '🚀', '🌌', '⭐', '🌍', '☄️'];
      const spinInterval = setInterval(() => {
        setDisplaySymbols(prev => 
          prev.map(() => symbols[Math.floor(Math.random() * symbols.length)])
        );
      }, 100);

      // Остановка через 2 секунды
      setTimeout(() => {
        clearInterval(spinInterval);
      }, 2000);

      return () => clearInterval(spinInterval);
    }
  }, [gameState]);

  // Показ результата
  useEffect(() => {
    if (gameState === 'revealing' && lastResult) {
      setDisplaySymbols(lastResult.symbols);
      
      // Показываем выигрышные позиции через секунду
      setTimeout(() => {
        if (lastResult.winningLines.length > 0) {
          const positions = new Set<number>();
          lastResult.winningLines.forEach((line: WinningLine) => {
            const payline = PAYLINES[line.line - 1];
            payline.slice(0, line.count).forEach(pos => positions.add(pos));
          });
          setWinningPositions(positions);
          setShowWinLines(true);
        }
      }, 1000);
    }
  }, [gameState, lastResult]);

  // Сброс при новой игре
  useEffect(() => {
    if (gameState === 'waiting') {
      setWinningPositions(new Set());
      setShowWinLines(false);
    }
  }, [gameState]);

  const getSymbolStyle = (index: number): React.CSSProperties => {
    const isWinning = winningPositions.has(index);
    const isSpinning = gameState === 'spinning';
    
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
      transition: 'all 0.3s ease',
      transform: isSpinning ? 'scale(0.9)' : isWinning ? 'scale(1.1)' : 'scale(1)',
      boxShadow: isWinning 
        ? `0 0 20px ${colorStyle}80` 
        : isSpinning 
        ? '0 0 10px rgba(255,255,255,0.3)'
        : 'none',
      animation: isSpinning 
        ? 'spin-blur 0.1s infinite' 
        : isWinning 
        ? 'win-pulse 1s infinite' 
        : 'none'
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
      const x = col * 70 + 35; // 60px ширина + 10px отступ
      const y = row * 70 + 35; // 60px высота + 10px отступ
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
          @keyframes spin-blur {
            0% { filter: blur(0px); }
            50% { filter: blur(2px); }
            100% { filter: blur(0px); }
          }
          
          @keyframes win-pulse {
            0%, 100% { transform: scale(1.1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
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

      {/* Игровое поле 3x5 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 60px)',
        gridTemplateRows: 'repeat(3, 60px)',
        gap: '10px',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {displaySymbols.map((symbol, index) => (
          <div
            key={index}
            style={getSymbolStyle(index)}
          >
            {symbol}
          </div>
        ))}
        
        {renderWinLines()}
      </div>

      {/* Статус игры */}
      <div style={{
        textAlign: 'center',
        marginTop: '15px',
        color: '#ccc',
        fontSize: '0.9rem'
      }}>
        {gameState === 'waiting' && '🎲 Готов к игре'}
        {gameState === 'spinning' && '🌀 Вращение...'}
        {gameState === 'revealing' && '✨ Результат...'}
        {gameState === 'finished' && lastResult && (
          lastResult.isWin 
            ? `🎉 Выигрыш: ${lastResult.totalWin} CCC!`
            : '💸 Удачи в следующий раз!'
        )}
      </div>

      {/* Информация о последнем выигрыше */}
      {lastResult && lastResult.winningLines.length > 0 && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: `${colorStyle}20`,
          border: `1px solid ${colorStyle}`,
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#ccc'
        }}>
          <div style={{ color: colorStyle, fontWeight: 'bold', marginBottom: '5px' }}>
            🏆 Выигрышные линии:
          </div>
          {lastResult.winningLines.map((line, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              Линия {line.line}: {line.symbol} x{line.count} = {line.winAmount} CCC
              {line.hasWild && <span style={{ color: '#ffd700' }}> ⭐WILD</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SlotMachine;