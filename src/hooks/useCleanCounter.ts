import { useState, useEffect, useCallback, useRef } from 'react';

interface Player {
  telegram_id: string;
  asteroids: Array<{ id: number; system: number; totalCcc?: number; totalCs?: number }>;
  drones: Array<{ id: number; system: number; cccPerDay?: number; csPerDay?: number }>;
  cargo_levels: Array<{ id: number; system: number; capacity: number }>;
  asteroid_total_data: { [key: number]: number };
  collected_by_system: { [key: string]: number };
  last_collection_time: { [key: string]: string };
  max_cargo_capacity_data?: { [key: number]: number };
  mining_speed_data?: { [key: number]: number };
}

interface UseCleanCounterProps {
  player: Player | null;
  currentSystem: number;
}

export const useCleanCounter = ({ player, currentSystem }: UseCleanCounterProps) => {
  const [counters, setCounters] = useState<{ [key: number]: number }>({});
  const intervalRef = useRef<{ [key: number]: NodeJS.Timeout | null }>({});

  // 🔧 Получение реального лимита карго с приоритетом max_cargo_capacity_data
  const getRealCargoCapacity = useCallback((system: number): number => {
    if (!player) return 0;
    
    // 🎯 ПРИОРИТЕТ 1: Используем данные из max_cargo_capacity_data (пересчитанные сервером)
    if (player.max_cargo_capacity_data && player.max_cargo_capacity_data[system] !== undefined) {
      return player.max_cargo_capacity_data[system];
    }
    
    // 🎯 ПРИОРИТЕТ 2: Считаем из cargo_levels (фоллбэк)
    const systemCargo = player.cargo_levels
      .filter(c => c.system === system)
      .reduce((max, c) => Math.max(max, c.capacity || 0), 0);
    
    return systemCargo;
  }, [player]);

  // 🔧 Получение скорости добычи с приоритетом mining_speed_data
  const getMiningSpeedPerSecond = useCallback((system: number): number => {
    if (!player) return 0;
    
    // 🎯 ПРИОРИТЕТ 1: Используем данные из mining_speed_data (пересчитанные сервером)
    if (player.mining_speed_data && player.mining_speed_data[system] !== undefined) {
      return player.mining_speed_data[system];
    }
    
    // 🎯 ПРИОРИТЕТ 2: Считаем из drones (фоллбэк)
    const systemDrones = player.drones.filter(d => d.system === system);
    
    const totalDroneSpeed = systemDrones.reduce((total, d) => {
      if (system === 4) {
        return total + (d.csPerDay || 0);
      } else {
        return total + (d.cccPerDay || 0);
      }
    }, 0);

    // Бонус +1% для систем 1-4 при покупке всех 15 дронов
    const droneCount = systemDrones.length;
    const bonusMultiplier = (system >= 1 && system <= 4 && droneCount === 15) ? 1.01 : 1;
    
    const speedPerSecond = (totalDroneSpeed * bonusMultiplier) / (24 * 3600);
    
    return speedPerSecond;
  }, [player]);

  // 🔧 Получение оставшихся ресурсов с приоритетом asteroid_total_data
  const getRemainingResources = useCallback((system: number): number => {
    if (!player) return 0;
    
    // 🎯 ПРИОРИТЕТ 1: Используем данные из asteroid_total_data (актуальные остатки)
    if (player.asteroid_total_data && player.asteroid_total_data[system] !== undefined) {
      return player.asteroid_total_data[system];
    }
    
    // 🎯 ПРИОРИТЕТ 2: Считаем из asteroids (фоллбэк для новых игроков)
    const asteroidResources = player.asteroids
      .filter(a => a.system === system)
      .reduce((sum, a) => {
        if (system === 4) {
          return sum + (a.totalCs || 0);
        } else {
          return sum + (a.totalCcc || 0);
        }
      }, 0);
    
    return asteroidResources;
  }, [player]);

  // Проверка полного комплекта
  const hasFullSetup = useCallback((system: number): boolean => {
    if (!player) return false;
    
    const hasAsteroids = player.asteroids.some(a => a.system === system);
    const hasDrones = player.drones.some(d => d.system === system);
    const hasCargo = player.cargo_levels.some(c => c.system === system);
    
    return hasAsteroids && hasDrones && hasCargo;
  }, [player]);

  // 🔧 Расчет текущего значения счетчика
  const calculateCurrentValue = useCallback((system: number): number => {
    if (!player || !hasFullSetup(system)) {
      return 0;
    }

    const systemStr = String(system);
    const lastCollectionTime = player.last_collection_time[systemStr] 
      ? new Date(player.last_collection_time[systemStr]).getTime()
      : Date.now();
    
    const collectedAmount = player.collected_by_system[systemStr] || 0;
    const miningSpeed = getMiningSpeedPerSecond(system);
    const maxCargoCapacity = getRealCargoCapacity(system);
    const remainingResources = getRemainingResources(system);

    const currentTime = Date.now();
    const timeElapsed = (currentTime - lastCollectionTime) / 1000;

    let newValue = collectedAmount + (miningSpeed * timeElapsed);
    
    // Применяем лимиты
    if (maxCargoCapacity > 0 && maxCargoCapacity < 99999) {
      newValue = Math.min(newValue, maxCargoCapacity);
    }
    
    newValue = Math.min(newValue, remainingResources);
    
    if (remainingResources <= 0) {
      newValue = 0;
    }
    
    if (newValue < 0) {
      newValue = 0;
    }

    return newValue;
  }, [player, hasFullSetup, getMiningSpeedPerSecond, getRealCargoCapacity, getRemainingResources]);

  // Обновление счетчика
  const updateCounter = useCallback((system: number) => {
    const newValue = calculateCurrentValue(system);
    setCounters(prev => ({ ...prev, [system]: newValue }));
  }, [calculateCurrentValue]);

  // Запуск счетчика для системы
  const startCounter = useCallback((system: number) => {
    if (intervalRef.current[system]) return;
    
    updateCounter(system);
    intervalRef.current[system] = setInterval(() => {
      updateCounter(system);
    }, 100);
  }, [updateCounter]);

  // Остановка счетчика для системы
  const stopCounter = useCallback((system: number) => {
    if (intervalRef.current[system]) {
      clearInterval(intervalRef.current[system] as NodeJS.Timeout);
      intervalRef.current[system] = null;
    }
  }, []);

  // Сброс счетчика
  const resetCleanCounter = useCallback((system: number) => {
    setCounters(prev => ({ ...prev, [system]: 0 }));
  }, []);

  // Получение текущего значения
  const getCurrentValue = useCallback((system: number): number => {
    return counters[system] || 0;
  }, [counters]);

      // Автозапуск/остановка при смене системы
  useEffect(() => {
    if (!player || !currentSystem) return;

    // Останавливаем все счетчики
    Object.keys(intervalRef.current).forEach(system => {
      stopCounter(Number(system));
    });

    // Запускаем счетчик для текущей системы
    startCounter(currentSystem);

    return () => {
      stopCounter(currentSystem);
    };
  }, [player, currentSystem, startCounter, stopCounter]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      Object.keys(intervalRef.current).forEach(system => {
        stopCounter(Number(system));
      });
    };
  }, [stopCounter]);

  // Сброс счетчика для новых астероидов
  const resetForNewAsteroid = useCallback((system: number) => {
    resetCleanCounter(system);
  }, [resetCleanCounter]);

  return {
    getCurrentValue,
    resetCleanCounter,
    resetForNewAsteroid,
    hasFullSetup,
    getRealCargoCapacity,
    getMiningSpeedPerSecond,
    getRemainingResources,
  };
};