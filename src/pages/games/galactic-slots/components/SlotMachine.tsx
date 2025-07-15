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

  // ИСПРАВЛЕНО: Улучшенная анимация спина с правильной синхронизацией
  useEffect(() => {
    if (gameState === 'spinning') {
      setWinningPositions(new Set());
      setShowWinLines(false);
      
      const symbols: SlotSymbol[] = ['🌟', '🚀', '🌌', '⭐', '🌍', '☄️'];
      let animationInterval: NodeJS.Timeout;
      
      console.log('🎰 Starting spin animation...');
      
      // Быстрая анимация первые 1.5 секунды
      animationInterval = setInterval(() => {
        setDisplaySymbols(prev => 
          prev.map(() => symbols[Math.floor(Math.random() * symbols.length)])
        );
      }, 100);

      // Замедляем к концу
      setTimeout(() => {
        clearInterval(animationInterval);
        
        // Финальная медленная анимация
        animationInterval = setInterval(() => {
          setDisplaySymbols(prev => 
            prev.map(() => symbols[Math.floor(Math.random() * symbols.length)])
          );
        }, 200);
        
        // Полная остановка через 0.5 секунды
        setTimeout(() => {
          clearInterval(animationInterval);
          console.log('🎰 Spin animation completed');
        }, 500);
        
      }, 1500);

      return () => {
        if (animationInterval) {
          clearInterval(animationInterval);
        }
      };
    }
  }, [gameState]);

  // Показ результата
  useEffect(() => {
    if (gameState === 'revealing' && lastResult) {
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
      transform: isSpinning 
        ? 'scale(0.9)' 
        : isWinning 
        ? 'scale(1.1)' 
        : 'scale(1)',
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

  // ДОБАВЛЕНО: Функция получения статуса игры на текущем языке
  const getGameStatusMessage = () => {
    switch (gameState) {
      case 'waiting':
        return '🎲 Готов к игре';
      case 'spinning':
        return '🌀 Вращение...';
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
          @keyframes spin-blur {
            0% { filter: blur(0px); }
            50% { filter: blur(2px); }
            100% { filter: blur(0px); }
          }
          
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
        fontSize: '0.9rem',
        minHeight: '20px'
      }}>
        {getGameStatusMessage()}
      </div>

      {/* ДОБАВЛЕНО: Информация о последнем выигрыше */}
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

      {/* ДОБАВЛЕНО: Индикатор линий выплат */}
      <div style={{
        marginTop: '10px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#999'
      }}>
        20 активных линий выплат • RTP: 80%
      </div>
    </div>
  );
};

export default SlotMachine;