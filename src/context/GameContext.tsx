// GameContext - игровые механики и ресурсы (ИСПРАВЛЕНО для CS)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNewPlayer } from './NewPlayerContext';
import { useResourceCollection } from '../hooks';
import { calculateTotalPerHour } from '../utils/gameCalculations';

// 🔥 ИСПРАВЛЕНО: добавлена поддержка CS валюты
interface GameContextType {
  currentSystem: number;
  setCurrentSystem: (system: number) => void;
  totalCollected: number;
  setTotalCollected: React.Dispatch<React.SetStateAction<number>>;
  asteroidTotal: number;
  remaining: number;
  safeCollect: (data: { 
    telegramId: string; 
    last_collection_time: { [system: string]: string }; 
    system: number; 
    collected_ccc?: number;
    collected_cs?: number; // 🔥 ДОБАВЛЕНО: поддержка CS
  }) => Promise<any>;
  totalPerHour: { ccc: number; cs: number; ton: number };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { player, setPlayer, refreshPlayer } = useNewPlayer();
  const [currentSystem, setCurrentSystem] = useState<number>(1);
  const [totalCollected, setTotalCollected] = useState<number>(0);
  const [asteroidTotal, setAsteroidTotal] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [totalPerHour, setTotalPerHour] = useState({ ccc: 0, cs: 0, ton: 0 });

  // Используем хук для сбора ресурсов
  const {
    safeCollect: collectResources,
    getRemainingResources,
  } = useResourceCollection();

  // Обновление данных при смене системы или игрока
  useEffect(() => {
    if (player) {
      const collected = player.collected_by_system?.[currentSystem.toString()] || 0;
      const asteroidsTotal = player.asteroid_total_data?.[currentSystem] || 0;
      
      setTotalCollected(Number(collected));
      setAsteroidTotal(Number(asteroidsTotal));
      setRemaining(Number(asteroidsTotal) - Number(collected));
    }
  }, [currentSystem, player]);

  // Расчет общего дохода в час
  useEffect(() => {
    if (player) {
      const perHour = calculateTotalPerHour(player);
      setTotalPerHour(perHour);
    }
  }, [player]);

  // 🔥 ИСПРАВЛЕННАЯ ОБЕРТКА для safeCollect с поддержкой CS
  const safeCollect = async (data: {
    telegramId: string;
    last_collection_time: { [system: string]: string };
    system: number;
    collected_ccc?: number;
    collected_cs?: number; // 🔥 ДОБАВЛЕНО: поддержка CS
  }) => {
    if (!player) return null;

    try {
      // 🔥 ИСПРАВЛЕНО: определяем количество ресурсов для сбора
      const resourceAmount = data.system === 4 
        ? (data.collected_cs || 0) 
        : (data.collected_ccc || 0);
      
      if (process.env.NODE_ENV === 'development') console.log(`🎮 GameContext: система ${data.system}, собираем ${resourceAmount} ${data.system === 4 ? 'CS' : 'CCC'}`);
      
      const result = await collectResources(player, data.system, resourceAmount);
      
      if (result) {
        // Обновляем игрока с новыми данными
        setPlayer(result);
        
        // Обновляем локальные данные
        const collected = result.collected_by_system?.[data.system.toString()] || 0;
        const asteroidsTotal = result.asteroid_total_data?.[data.system] || 0;
        setTotalCollected(Number(collected));
        setAsteroidTotal(Number(asteroidsTotal));
        setRemaining(Number(asteroidsTotal) - Number(collected));
        
        if (process.env.NODE_ENV === 'development') console.log(`✅ GameContext: данные обновлены для системы ${data.system}`);
      }
      
      return result;
    } catch (err) {
      console.error('Error in safeCollect:', err);
      return null;
    }
  };

  const value = {
    currentSystem,
    setCurrentSystem,
    totalCollected,
    setTotalCollected,
    asteroidTotal,
    remaining,
    safeCollect,
    totalPerHour,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};