import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 🔄 ХУК ДЛЯ РЕГЕНЕРАЦИИ HP КОРАБЛЕЙ
 * Аналог useCleanCounter из основной игры
 */

interface Ship {
  id: number;
  current_hp: number;
  max_hp: number;
  updated_at: string;
  race: string;
}

interface UseShipRegenerationProps {
  ships: Ship[];
}

interface RegenerationInfo {
  currentHP: number;
  timeToFullHP: number; // секунды до полного восстановления
  isFullyRepaired: boolean;
}

export const useShipRegeneration = ({ ships }: UseShipRegenerationProps) => {
  const [shipsHP, setShipsHP] = useState<{ [key: number]: RegenerationInfo }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Вычисляет текущий HP с учетом регенерации
   * Аналог calculateCurrentValue из useCleanCounter
   */
  const calculateCurrentHP = useCallback((ship: Ship): RegenerationInfo => {
    // Время полного восстановления (от 0 до max_hp)
    const PREMIUM_REGEN_TIME_HOURS = 12; // 12 часов для ПРЕМИУМ кораблей
    const REGULAR_REGEN_TIME_HOURS = 6; // 6 часов для обычных кораблей

    const isPremiumShip = ship.ship_class === 'premium';
    let fullRegenSeconds = isPremiumShip
      ? PREMIUM_REGEN_TIME_HOURS * 60 * 60
      : REGULAR_REGEN_TIME_HOURS * 60 * 60;

    // Если корабль уже полностью восстановлен
    if (ship.current_hp >= ship.max_hp) {
      return {
        currentHP: ship.max_hp,
        timeToFullHP: 0,
        isFullyRepaired: true
      };
    }

    const lastUpdateTime = new Date(ship.updated_at).getTime();
    const currentTime = Date.now();
    const timeElapsed = (currentTime - lastUpdateTime) / 1000; // секунды

    // Вычисляем процент восстановления
    const regenPercent = timeElapsed / fullRegenSeconds;

    // Вычисляем сколько HP восстановилось
    const hpToRegenerate = Math.floor((ship.max_hp - ship.current_hp) * regenPercent);

    // Новый HP не может превышать max_hp
    let newHP = Math.min(ship.max_hp, ship.current_hp + hpToRegenerate);

    // Не может быть меньше текущего
    if (newHP < ship.current_hp) {
      newHP = ship.current_hp;
    }

    // Вычисляем сколько секунд осталось до полного восстановления
    const hpRemaining = ship.max_hp - newHP;
    const regenSpeed = ship.max_hp / fullRegenSeconds; // HP в секунду
    const timeToFullHP = hpRemaining > 0 ? Math.ceil(hpRemaining / regenSpeed) : 0;

    return {
      currentHP: newHP,
      timeToFullHP,
      isFullyRepaired: newHP >= ship.max_hp
    };
  }, []);

  /**
   * Форматирует время до полного восстановления
   * "Восстановится через 2 ч 15 мин"
   */
  const formatTimeToFullHP = useCallback((seconds: number): string => {
    if (seconds <= 0) {
      return 'Полностью восстановлен';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
      return `Восстановится через ${hours} ч ${minutes} мин`;
    } else if (hours > 0) {
      return `Восстановится через ${hours} ч`;
    } else if (minutes > 0) {
      return `Восстановится через ${minutes} мин`;
    } else {
      return `Восстановится через ${seconds} сек`;
    }
  }, []);

  /**
   * Обновляет HP всех кораблей
   */
  const updateAllShips = useCallback(() => {
    const newShipsHP: { [key: number]: RegenerationInfo } = {};

    ships.forEach(ship => {
      newShipsHP[ship.id] = calculateCurrentHP(ship);
    });

    setShipsHP(newShipsHP);
  }, [ships, calculateCurrentHP]);

  /**
   * Получить актуальный HP корабля
   */
  const getShipHP = useCallback((shipId: number): number => {
    return shipsHP[shipId]?.currentHP || 0;
  }, [shipsHP]);

  /**
   * Получить информацию о регенерации корабля
   */
  const getShipRegenInfo = useCallback((shipId: number): RegenerationInfo | null => {
    return shipsHP[shipId] || null;
  }, [shipsHP]);

  /**
   * Проверить готовность корабля к бою (минимум 10% HP)
   */
  const isShipReadyForBattle = useCallback((shipId: number, minPercent: number = 0.1): boolean => {
    const ship = ships.find(s => s.id === shipId);
    if (!ship) return false;

    const currentHP = shipsHP[shipId]?.currentHP || ship.current_hp;
    const hpPercent = currentHP / ship.max_hp;

    return hpPercent >= minPercent;
  }, [ships, shipsHP]);

  // Запускаем обновление каждые 100ms (как в useCleanCounter)
  useEffect(() => {
    if (ships.length === 0) return;

    // Первое обновление сразу
    updateAllShips();

    // Затем каждые 100ms
    intervalRef.current = setInterval(() => {
      updateAllShips();
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [ships, updateAllShips]);

  return {
    shipsHP,
    getShipHP,
    getShipRegenInfo,
    formatTimeToFullHP,
    isShipReadyForBattle
  };
};
