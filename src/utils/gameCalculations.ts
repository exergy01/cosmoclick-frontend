// Утилиты для игровых вычислений

export interface Player {
  drones: Array<{ id: number; system: number; cccPerDay?: number }>;
  cargo_levels: Array<{ id: number; system: number; capacity?: number }>; // 🔥 ДОБАВИЛ
  last_collection_time: { [system: string]: string };
  mining_speed_data: { [system: number]: number };
  asteroid_total_data: { [system: number]: number };
  max_cargo_capacity_data: { [system: number]: number };
  collected_by_system: { [system: number]: number };
}

// 🔥 НОВАЯ ФУНКЦИЯ: получаем реальную вместимость карго
const getRealCargoCapacity = (player: Player, system: number): number => {
if (!player?.cargo_levels) return 0;

const systemCargo = player.cargo_levels.filter(c => c.system === system);
if (systemCargo.length === 0) return 0;

return Math.max(...systemCargo.map(c => c.capacity || 0));
};

// Расчет скорости майнинга для системы (используем данные из player)
export const calculateMiningSpeed = (player: Player, system: number): number => {
  if (!player?.drones) return 0;
  
  return player.drones
    .filter(d => d.system === system)
    .reduce((sum: number, d) => {
      // Используем cccPerDay из данных игрока, если нет - 0
      const cccPerDay = d.cccPerDay || 0;
      return sum + cccPerDay / 24 / 3600; // Переводим в CCC/секунду
    }, 0);
};

// Расчет накопленного CCC за время
export const calculateAccumulatedCcc = (player: Player, system: number): number => {
  if (!player) return 0;
  
  const miningSpeed = player.mining_speed_data[system] || 0;
  const lastCollectionTime = new Date(player.last_collection_time?.[system] || Date.now()).getTime();
  const elapsedTime = (Date.now() - lastCollectionTime) / 1000; // в секундах
  
  // 🔥 ИСПРАВЛЕНО: используем реальную вместимость карго
  const maxCapacity = getRealCargoCapacity(player, system);
  const totalAsteroidResources = player.asteroid_total_data?.[system] || 0;
  const alreadyCollected = player.collected_by_system?.[system] || 0;
  const remainingResources = Math.max(0, totalAsteroidResources - alreadyCollected);
  
  // Рассчитываем накопленное количество
  const accumulated = miningSpeed * elapsedTime;
  
  // Применяем все ограничения
  return Math.min(accumulated, maxCapacity, remainingResources);
};

// Расчет CCC счетчика с учетом времени
export const calculateCccCounter = (
  player: Player, 
  startTime: number, 
  currentSystem: number,
  totalCollected: number
): number => {
  if (!player) return 0;
  
  const miningSpeed = calculateMiningSpeed(player, currentSystem);
  const elapsed = (Date.now() - startTime) / 1000 / 3600; // в часах
  const newCcc = miningSpeed * elapsed * 3600; // переводим обратно в секунды
  
  // 🔥 ИСПРАВЛЕНО: используем реальную вместимость карго
  const cargoCapacity = getRealCargoCapacity(player, currentSystem);
  const asteroidTotal = player.asteroid_total_data?.[currentSystem] || 0;
  const collected = totalCollected || 0;
  
  return Math.min(newCcc, cargoCapacity, asteroidTotal - collected);
};

// Расчет общего дохода в час (используем данные из player)
export const calculateTotalPerHour = (player: Player): { ccc: number; cs: number; ton: number } => {
  if (!player?.drones) return { ccc: 0, cs: 0, ton: 0 };
  
  try {
    const totalCccPerHour = player.drones.reduce((sum, d) => {
      // Используем cccPerDay из данных игрока
      const cccPerDay = d.cccPerDay || 0;
      return sum + (cccPerDay / 24);
    }, 0);
    
    return { 
      ccc: Number(totalCccPerHour.toFixed(5)), 
      cs: 0, 
      ton: 0 
    };
  } catch (err) {
    console.error('Error calculating total per hour:', err);
    return { ccc: 0, cs: 0, ton: 0 };
  }
};

// 🔥 ИСПРАВЛЕНА: Проверка лимитов сбора с реальной вместимостью карго
export const checkCollectionLimits = (
  player: Player, 
  system: number, 
  amountToCollect: number
): { canCollect: boolean; maxAmount: number; reason?: string } => {
  const totalAsteroidResources = player.asteroid_total_data[system] || 0;
  const alreadyCollected = player.collected_by_system?.[system] || 0;
  const remainingResources = Math.max(0, totalAsteroidResources - alreadyCollected);
  
  // 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: используем реальную вместимость карго
  const maxCapacity = getRealCargoCapacity(player, system);
  
  console.log(`🔍 checkCollectionLimits система ${system}:`);
  console.log(`   amountToCollect: ${amountToCollect}`);
  console.log(`   remainingResources: ${remainingResources}`);
  console.log(`   maxCapacity (РЕАЛЬНАЯ): ${maxCapacity}`);
  console.log(`   старая max_cargo_capacity_data: ${player.max_cargo_capacity_data[system] || 0}`);
  
  if (remainingResources <= 0) {
    return { 
      canCollect: false, 
      maxAmount: 0, 
      reason: 'Астероид исчерпан' 
    };
  }
  
  if (amountToCollect <= 0) {
    return { 
      canCollect: false, 
      maxAmount: 0, 
      reason: 'Нечего собирать' 
    };
  }
  
  const maxAmount = Math.min(amountToCollect, remainingResources, maxCapacity);
  
  console.log(`   maxAmount (итог): ${maxAmount}`);
  
  return { 
    canCollect: true, 
    maxAmount 
  };
};

// Получение названий систем
export const getSystemNames = (): string[] => {
  return [
    'Андромеда', 
    'Орион', 
    'Млечный Путь', 
    'Туманность Ориона', 
    'Крабовидная Туманность', 
    'Сомбреро', 
    'Туманность Орла'
  ];
};

// Получение данных системы для разблокировки
export const getSystemUnlockData = (systemId: number) => {
  const systemData = {
    1: { price: 0, currency: 'cs' },
    2: { price: 150, currency: 'cs' },
    3: { price: 300, currency: 'cs' },
    4: { price: 500, currency: 'cs' },
    5: { price: 15, currency: 'ton' },
    6: { price: 50, currency: 'ton' },
    7: { price: 500, currency: 'ton' }
  };
  
  return systemData[systemId as keyof typeof systemData] || { price: 0, currency: 'cs' };
};