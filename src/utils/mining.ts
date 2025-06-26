import { Player, ShopItem } from '../types/global';
import { droneData, asteroidData, cargoData } from '../data/shopDataSystem1';

export const calculateMiningSpeed = (player: Player, system: number): number => {
  if (!player?.drones?.length) {
    return 0;
  }

  const speed = player.drones
    .filter(d => d.system === system)
    .reduce((speed, drone) => {
      const item = droneData.find(d => d.id === drone.id && d.system === drone.system);
      if (!item) {
        return speed;
      }
      return speed + (item.cccPerDay || 0) / 86400;
    }, 0);

  return Number(speed.toFixed(5));
};

export const calculateCccCounter = (player: Player, miningSpeed: number, totalCollected: number = 0, currentSystem: number): number => {
  if (!player || miningSpeed <= 0) {
    return 0;
  }

  const asteroidTotal = player.asteroids
    .filter(a => a.system === currentSystem)
    .reduce((sum, a) => {
      const asteroid = asteroidData.find(item => item.id === a.id && item.system === a.system);
      return sum + (asteroid?.totalCcc || 0);
    }, 0);
  const remainingAsteroidCcc = Math.max(0, asteroidTotal - totalCollected);

  const cargoCapacity = cargoData.find(c => c.id === player.cargo_level)?.capacity || 0;
  const numericCargoCapacity = typeof cargoCapacity === 'string' ? parseFloat(cargoCapacity) : cargoCapacity;
  const maxCapacity = Math.min(numericCargoCapacity, remainingAsteroidCcc);

  if (maxCapacity <= 0) {
    return 0;
  }

  if (!player.last_collection_time) {
    return 0;
  }

  const lastCollectionTime = new Date(player.last_collection_time).getTime();
  const currentTime = Date.now();
  const elapsed = Math.min((currentTime - lastCollectionTime) / 1000, 3600);

  if (elapsed < 0) {
    return 0;
  }

  const accumulatedCcc = elapsed * miningSpeed;
  const result = Math.min(accumulatedCcc, maxCapacity);

  return Number(result.toFixed(5));
};