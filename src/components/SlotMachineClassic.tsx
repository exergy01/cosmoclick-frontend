// SlotMachineClassic.tsx
// Чистый CSS/JS демо-компонент для тестовой анимации барабанов

import React, { useEffect, useState } from 'react';
import './SlotMachineClassic.css';

const SYMBOLS = ['🌟', '🚀', '🌌', '⭐', '🌍', '☄️', '💀'];
const REEL_COUNT = 5;
const SYMBOLS_PER_REEL = 3;
const STRIP_LENGTH = 20;

const generateRandomStrip = (): string[] =>
  Array.from({ length: STRIP_LENGTH }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

const generateFinalSymbols = (): string[] =>
  Array.from({ length: REEL_COUNT * SYMBOLS_PER_REEL }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

const SlotMachineClassic: React.FC = () => {
  const [spinning, setSpinning] = useState(false);
  const [stripData, setStripData] = useState<string[][]>(
    Array.from({ length: REEL_COUNT }, () => generateRandomStrip())
  );
  const [finalSymbols, setFinalSymbols] = useState<string[]>(generateFinalSymbols());

  const startSpin = () => {
    if (spinning) return;
    setSpinning(true);

    // Обновляем полосы символов
    setStripData(Array.from({ length: REEL_COUNT }, () => generateRandomStrip()));

    // Через 3 секунды устанавливаем финальные символы и останавливаем
    setTimeout(() => {
      setFinalSymbols(generateFinalSymbols());
      setSpinning(false);
    }, 3000);
  };

  return (
    <div className="slot-machine">
      <div className="reels">
        {stripData.map((strip, i) => (
          <div
            key={i}
            className={`reel ${spinning ? 'spinning' : ''}`}
            style={{
              animationDuration: spinning ? '3s' : '0s',
              animationDelay: `${i * 0.2}s`,
            }}
          >
            {/* Показываем либо анимированную ленту, либо финал */}
            {spinning
              ? strip.map((sym, idx) => (
                  <div className="symbol" key={idx}>{sym}</div>
                ))
              : Array.from({ length: SYMBOLS_PER_REEL }).map((_, row) => {
                  const index = i + row * REEL_COUNT;
                  return (
                    <div className="symbol" key={index}>
                      {finalSymbols[index]}
                    </div>
                  );
                })}
          </div>
        ))}
      </div>
      <button onClick={startSpin} disabled={spinning} className="spin-button">
        {spinning ? 'Крутится...' : 'СПИН'}
      </button>
    </div>
  );
};

export default SlotMachineClassic;

