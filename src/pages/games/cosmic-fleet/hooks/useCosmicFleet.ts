import { useState, useEffect, useCallback } from 'react';
import { Ship, ShipTemplate } from '../types/ships';
import { CosmicFleetPlayer } from '../types/luminios';
import { cosmicFleetApi, BattleResult } from '../services/cosmicFleetApi';

interface UseCosmicFleetProps {
  telegramId: number;
  initialCsBalance: number;
}

interface UseCosmicFleetReturn {
  player: CosmicFleetPlayer | null;
  fleet: Ship[];
  formation: Ship[];  // 🔥 НОВОЕ: корабли в formation
  maxFormationSlots: number;  // 🔥 НОВОЕ: макс слотов в формации
  luminiosBalance: number;
  csBalance: number;
  loading: boolean;
  error: string | null;

  // Actions
  exchangeCSToLuminios: (csAmount: number) => Promise<boolean>;
  purchaseShip: (template: ShipTemplate) => Promise<boolean>;
  repairShip: (shipId: string) => Promise<boolean>;
  battlePvE: (shipId: string) => Promise<BattleResult | null>;
  battleBot: (difficulty?: string, adaptive?: boolean) => Promise<any>;  // 🔥 НОВОЕ: адаптивный бой с ботом
  refreshData: () => Promise<void>;
  setFormation: (shipIds: (string | null)[]) => Promise<boolean>;  // 🔥 НОВОЕ
}

export const useCosmicFleet = ({
  telegramId,
  initialCsBalance
}: UseCosmicFleetProps): UseCosmicFleetReturn => {
  const [player, setPlayer] = useState<CosmicFleetPlayer | null>(null);
  const [fleet, setFleet] = useState<Ship[]>([]);
  const [formation, setFormationState] = useState<Ship[]>([]);  // 🔥 НОВОЕ
  const [maxFormationSlots, setMaxFormationSlots] = useState<number>(3);  // 🔥 НОВОЕ
  const [luminiosBalance, setLuminiosBalance] = useState(0);
  const [csBalance, setCsBalance] = useState(initialCsBalance);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlayerData = useCallback(async () => {
    try {
      setError(null);
      const [playerData, fleetData, luminiosData, formationData] = await Promise.all([
        cosmicFleetApi.getPlayer(telegramId),
        cosmicFleetApi.getFleet(telegramId),
        cosmicFleetApi.getLuminiosBalance(telegramId),
        cosmicFleetApi.getFormation(telegramId)  // 🔥 НОВОЕ: загрузка formation
      ]);

      setPlayer(playerData);
      setFleet(fleetData);
      setLuminiosBalance(luminiosData);
      setFormationState(formationData.ships);  // 🔥 НОВОЕ
      setMaxFormationSlots(formationData.maxSlots || 3);  // 🔥 НОВОЕ
    } catch (err: any) {
      console.error('Failed to load cosmic fleet data:', err);
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  const refreshData = useCallback(async () => {
    await loadPlayerData();
  }, [loadPlayerData]);

  const exchangeCSToLuminios = useCallback(async (csAmount: number): Promise<boolean> => {
    try {
      const response = await cosmicFleetApi.exchangeCSToLuminios(telegramId, csAmount);
      if (response.success) {
        setLuminiosBalance(response.newLuminiosBalance);
        setCsBalance(response.newCsBalance);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Exchange failed:', err);
      setError(err.message || 'Ошибка обмена валют');
      return false;
    }
  }, [telegramId]);

  const purchaseShip = useCallback(async (template: ShipTemplate): Promise<boolean> => {
    try {
      const response = await cosmicFleetApi.purchaseShip(telegramId, template);
      if (response.success) {
        setFleet(prev => [...prev, response.ship]);
        setLuminiosBalance(response.newLuminiosBalance);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Ship purchase failed:', err);
      setError(err.message || 'Ошибка покупки корабля');
      return false;
    }
  }, [telegramId]);

  const repairShip = useCallback(async (shipId: string): Promise<boolean> => {
    try {
      const response = await cosmicFleetApi.repairShip(telegramId, shipId);
      if (response.success) {
        setFleet(prev => prev.map(ship =>
          ship.id === shipId ? response.ship : ship
        ));
        setLuminiosBalance(prev => prev - response.cost);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Ship repair failed:', err);
      setError(err.message || 'Ошибка ремонта корабля');
      return false;
    }
  }, [telegramId]);

  const battlePvE = useCallback(async (shipId: string): Promise<BattleResult | null> => {
    try {
      const response = await cosmicFleetApi.battlePvE(telegramId, shipId);
      if (response.success) {
        // Обновляем корабль после боя
        setFleet(prev => prev.map(ship =>
          ship.id === shipId ? response.updatedShip : ship
        ));

        // Обновляем баланс если была награда
        if (response.result.luminiosReward > 0) {
          setLuminiosBalance(response.newLuminiosBalance);
        }

        // Обновляем статистику игрока
        if (player) {
          setPlayer(prev => prev ? {
            ...prev,
            totalBattles: prev.totalBattles + 1,
            wins: prev.wins + (response.result.victory ? 1 : 0),
            losses: prev.losses + (response.result.victory ? 0 : 1)
          } : prev);
        }

        return response.result;
      }
      return null;
    } catch (err: any) {
      console.error('Battle failed:', err);
      setError(err.message || 'Ошибка боя');
      return null;
    }
  }, [telegramId, player]);

  const updateFormation = useCallback(async (shipIds: (string | null)[]): Promise<boolean> => {
    try {
      const success = await cosmicFleetApi.setFormation(telegramId, shipIds);
      if (success) {
        // Перезагружаем formation
        const formationData = await cosmicFleetApi.getFormation(telegramId);
        setFormationState(formationData.ships);
        setMaxFormationSlots(formationData.maxSlots || 3);
      }
      return success;
    } catch (err: any) {
      console.error('Set formation failed:', err);
      setError(err.message || 'Ошибка обновления formation');
      return false;
    }
  }, [telegramId]);

  const battleBotAdaptive = useCallback(async (difficulty: string = 'medium', adaptive: boolean = true): Promise<any> => {
    try {
      const response = await cosmicFleetApi.battleBot(telegramId, difficulty, adaptive);

      if (response.success) {
        // Обновляем HP кораблей после боя
        const updatedFleet = fleet.map(ship => {
          const battleShip = response.playerFleet.find((s: any) => s.id.toString() === ship.id.toString());
          return battleShip ? { ...ship, health: battleShip.hp } : ship;
        });
        setFleet(updatedFleet);

        // Также обновляем формацию с новыми HP
        const updatedFormation = formation.map(ship => {
          const updated = updatedFleet.find(s => s.id === ship.id);
          return updated || ship;
        });
        setFormationState(updatedFormation);

        // Обновляем баланс Luminios
        if (response.reward_luminios > 0) {
          setLuminiosBalance(prev => prev + response.reward_luminios);
        }

        // Обновляем статистику
        if (player) {
          setPlayer(prev => prev ? {
            ...prev,
            wins: prev.wins + (response.result === 'win' ? 1 : 0),
            losses: prev.losses + (response.result === 'loss' ? 1 : 0)
          } : prev);
        }

        return response;
      }
      return null;
    } catch (err: any) {
      console.error('Battle with bot failed:', err);
      setError(err.message || 'Ошибка боя с ботом');
      return null;
    }
  }, [telegramId, fleet, player, formation]);

  useEffect(() => {
    if (telegramId) {
      loadPlayerData();
    }
  }, [telegramId, loadPlayerData]);

  // Синхронизируем CS баланс с родительским компонентом
  useEffect(() => {
    setCsBalance(initialCsBalance);
  }, [initialCsBalance]);

  return {
    player,
    fleet,
    formation,  // 🔥 НОВОЕ: корабли в formation
    maxFormationSlots,  // 🔥 НОВОЕ: макс слотов
    luminiosBalance,
    csBalance,
    loading,
    error,
    exchangeCSToLuminios,
    purchaseShip,
    repairShip,
    battlePvE,
    battleBot: battleBotAdaptive,  // 🔥 НОВОЕ: адаптивный бой с ботом
    refreshData,
    setFormation: updateFormation  // 🔥 НОВОЕ: установка formation
  };
};