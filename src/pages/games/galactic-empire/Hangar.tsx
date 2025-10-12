/**
 * 🚢 АНГАР - ПРОСМОТР ВСЕХ КОРАБЛЕЙ
 * Galactic Empire v2.0
 */

import React, { useState } from 'react';
import { useShipRegeneration } from './hooks/useShipRegeneration';

interface Ship {
  id: number;
  ship_type: string;
  ship_class: string;
  tier: number;
  race: string;
  current_hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  speed: number;
  built_at: string;
  updated_at: string;
  upgrade_started_at?: string;
  upgrade_finish_at?: string;
  upgrade_target_tier?: number;
}

interface HangarProps {
  ships: Ship[];
  formationShipIds: number[];
  onSelectShip: (ship: Ship) => void;
  onAddToFormation: (shipId: number) => void;
  onRepairShip: (shipId: number) => void;
  onUpgradeShip: (shipId: number) => void;
  selectedShipId?: number;
  lang: string;
  raceColor: string;
}

const CLASS_COLORS: any = {
  frigate: '#4ECDC4',
  destroyer: '#FF6B6B',
  cruiser: '#95E1D3',
  battleship: '#F38181',
  premium: '#FFD700',
  drones: '#9B59B6',
  torpedoes: '#E74C3C',
  reb: '#3498DB',
  ai: '#2ECC71'
};

const CLASS_EMOJI: any = {
  frigate: '🚤',
  destroyer: '🛸',
  cruiser: '🚀',
  battleship: '🚢',
  premium: '👑',
  drones: '🤖',
  torpedoes: '🚀',
  reb: '📡',
  ai: '🧠'
};

const SHIP_NAMES: any = {
  frigate_t1: { ru: 'Лёгкий фрегат', en: 'Light Frigate' },
  frigate_t2: { ru: 'Штурмовой фрегат', en: 'Assault Frigate' },
  destroyer_t1: { ru: 'Лёгкий эсминец', en: 'Light Destroyer' },
  destroyer_t2: { ru: 'Тяжёлый эсминец', en: 'Heavy Destroyer' },
  cruiser_t1: { ru: 'Боевой крейсер', en: 'Combat Cruiser' },
  cruiser_t2: { ru: 'Тяжёлый штурмовой крейсер', en: 'Heavy Assault Cruiser' },
  battleship_t1: { ru: 'Линкор', en: 'Battleship' },
  battleship_t2: { ru: 'Дредноут', en: 'Dreadnought' }
};

const Hangar: React.FC<HangarProps> = ({
  ships,
  formationShipIds,
  onSelectShip,
  onAddToFormation,
  onRepairShip,
  onUpgradeShip,
  selectedShipId,
  lang,
  raceColor
}) => {
  const [repairingShips, setRepairingShips] = useState<Set<number>>(new Set());
  const [upgradingShips, setUpgradingShips] = useState<Set<number>>(new Set());

  // ✅ Хук для регенерации HP кораблей
  const { getShipHP, getShipRegenInfo, formatTimeToFullHP } = useShipRegeneration({ ships });

  const t = {
    ru: {
      title: 'Ангар флота',
      empty: 'Ангар пуст',
      emptyDesc: 'Отправляйтесь в Верфь и приобретите свой первый корабль!',
      ships: 'кораблей в вашем флоте',
      hp: 'Прочность',
      repair: 'Ремонт',
      repairing: 'Ремонтируем...',
      upgrade: 'Улучшить',
      upgrading: 'Улучшение...',
      maxTier: 'Макс. уровень',
      addToFormation: '+ В формацию',
      inFormation: '✓ В формации',
      maxFormation: 'Формация заполнена'
    },
    en: {
      title: 'Fleet Hangar',
      empty: 'Hangar is empty',
      emptyDesc: 'Go to the Shipyard and purchase your first ship!',
      ships: 'ships in your fleet',
      hp: 'Hull',
      repair: 'Repair',
      repairing: 'Repairing...',
      upgrade: 'Upgrade',
      upgrading: 'Upgrading...',
      maxTier: 'Max tier',
      addToFormation: '+ Add to formation',
      inFormation: '✓ In formation',
      maxFormation: 'Formation is full'
    }
  };

  const text = t[lang as 'ru' | 'en'] || t.en;

  // Tier upgrade costs (from backend config)
  const TIER_UPGRADE_COSTS: { [key: string]: number } = {
    '1_2': 500,  // T1→T2: 500 Luminios
    '2_3': 1500  // T2→T3: 1500 Luminios
  };

  // Расчет стоимости ремонта
  const calculateRepairCost = (ship: Ship): number => {
    const missingHP = ship.max_hp - getShipHP(ship.id);
    return Math.ceil(missingHP * 0.25); // 0.25 Luminios за каждый HP (25%)
  };

  // Расчет стоимости апгрейда
  const calculateUpgradeCost = (ship: Ship): number | null => {
    if (ship.tier >= 3) return null; // Уже максимальный tier
    const key = `${ship.tier}_${ship.tier + 1}`;
    return TIER_UPGRADE_COSTS[key] || null;
  };

  // Вычисление времени до завершения апгрейда
  const getUpgradeTimeRemaining = (ship: Ship): number => {
    if (!ship.upgrade_finish_at) return 0;
    const finishTime = new Date(ship.upgrade_finish_at).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((finishTime - now) / 1000));
  };

  // Форматирование времени апгрейда
  const formatUpgradeTime = (seconds: number): string => {
    if (seconds <= 0) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}ч ${minutes}м`;
    if (minutes > 0) return `${minutes}м`;
    return `${seconds}с`;
  };

  const handleRepair = async (ship: Ship, e: React.MouseEvent) => {
    e.stopPropagation();

    if (ship.current_hp === ship.max_hp) return;

    setRepairingShips(prev => new Set(prev).add(ship.id));

    try {
      await onRepairShip(ship.id);
    } finally {
      setRepairingShips(prev => {
        const newSet = new Set(prev);
        newSet.delete(ship.id);
        return newSet;
      });
    }
  };

  const handleUpgrade = async (ship: Ship, e: React.MouseEvent) => {
    e.stopPropagation();

    if (ship.tier >= 3) return; // Уже максимальный tier
    if (ship.upgrade_finish_at) return; // Уже в процессе апгрейда

    setUpgradingShips(prev => new Set(prev).add(ship.id));

    try {
      await onUpgradeShip(ship.id);
    } finally {
      setUpgradingShips(prev => {
        const newSet = new Set(prev);
        newSet.delete(ship.id);
        return newSet;
      });
    }
  };

  const getHealthColor = (current: number, max: number): string => {
    const ratio = current / max;
    if (ratio > 0.7) return '#44ff44';
    if (ratio > 0.3) return '#ffaa00';
    return '#ff4444';
  };

  // Фильтруем готовые корабли
  const readyShips = ships.filter(ship => new Date(ship.built_at) <= new Date());

  if (readyShips.length === 0) {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '20px',
        padding: '40px',
        border: '2px solid #444',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚀</div>
        <h3 style={{ color: '#fff', marginBottom: '15px' }}>
          {text.empty}
        </h3>
        <p style={{ color: '#aaa', lineHeight: '1.6' }}>
          {text.emptyDesc}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '20px',
      padding: '25px',
      border: `2px solid ${raceColor}`,
      boxShadow: `0 0 20px ${raceColor}40`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '2rem', marginRight: '15px' }}>🚢</div>
        <div>
          <h3 style={{
            color: raceColor,
            margin: 0,
            fontSize: '1.4rem',
            textShadow: `0 0 10px ${raceColor}`
          }}>
            {text.title}
          </h3>
          <p style={{
            color: '#aaa',
            margin: '5px 0 0 0',
            fontSize: '0.9rem'
          }}>
            {readyShips.length} {text.ships}
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '15px'
      }}>
        {readyShips.map(ship => {
          const classColor = CLASS_COLORS[ship.ship_class] || '#fff';
          const classEmoji = CLASS_EMOJI[ship.ship_class] || '🚀';
          const shipName = SHIP_NAMES[ship.ship_type]?.[lang] || ship.ship_type;
          const isSelected = ship.id === selectedShipId;
          const isRepairing = repairingShips.has(ship.id);
          const needsRepair = ship.current_hp < ship.max_hp;
          const isInFormation = formationShipIds.includes(ship.id);
          const isUpgrading = upgradingShips.has(ship.id);
          const upgradeCost = calculateUpgradeCost(ship);
          const isUpgradingNow = ship.upgrade_finish_at && new Date(ship.upgrade_finish_at) > new Date();
          const upgradeTimeRemaining = isUpgradingNow ? getUpgradeTimeRemaining(ship) : 0;

          return (
            <div
              key={ship.id}
              onClick={() => onSelectShip(ship)}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${classColor}22, ${classColor}11)`
                  : isInFormation
                    ? `linear-gradient(135deg, ${raceColor}22, ${raceColor}11)`
                    : 'rgba(255, 255, 255, 0.05)',
                border: isSelected
                  ? `2px solid ${classColor}`
                  : isInFormation
                    ? `2px solid ${raceColor}`
                    : '2px solid #444',
                borderRadius: '15px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isSelected
                  ? `0 0 20px ${classColor}40`
                  : isInFormation
                    ? `0 0 15px ${raceColor}40`
                    : 'none'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>
                      {classEmoji}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{
                          color: '#fff',
                          margin: 0,
                          fontSize: '1.1rem'
                        }}>
                          {shipName}
                        </h4>
                        {/* Tier badge */}
                        <span style={{
                          background: ship.tier === 3 ? '#FF6B6B' : ship.tier === 2 ? '#FFD700' : '#4ECDC4',
                          color: '#000',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          T{ship.tier}
                        </span>
                      </div>
                      <div style={{
                        color: classColor,
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        Tier {ship.tier} • {ship.race}
                      </div>
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{
                    background: classColor,
                    borderRadius: '50%',
                    width: '12px',
                    height: '12px',
                    boxShadow: `0 0 10px ${classColor}`
                  }} />
                )}
              </div>

              {/* HP Bar */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                    {text.hp}
                  </span>
                  <span style={{
                    color: getHealthColor(getShipHP(ship.id), ship.max_hp),
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {Math.floor(getShipHP(ship.id))} / {ship.max_hp}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: getHealthColor(getShipHP(ship.id), ship.max_hp),
                    height: '100%',
                    width: `${(getShipHP(ship.id) / ship.max_hp) * 100}%`,
                    borderRadius: '10px',
                    transition: 'all 0.1s linear'
                  }} />
                </div>
                {/* ✅ Таймер восстановления */}
                {(() => {
                  const regenInfo = getShipRegenInfo(ship.id);
                  if (regenInfo && !regenInfo.isFullyRepaired) {
                    return (
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#4ECDC4',
                        marginTop: '3px',
                        textAlign: 'right'
                      }}>
                        {formatTimeToFullHP(regenInfo.timeToFullHP)}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px',
                marginBottom: '15px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff6666', fontSize: '0.75rem' }}>⚔️</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{ship.attack}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#66ff66', fontSize: '0.75rem' }}>🛡️</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{ship.defense}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ffaa66', fontSize: '0.75rem' }}>⚡</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{ship.speed}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Repair and Upgrade row */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {needsRepair && (
                    <button
                      onClick={(e) => handleRepair(ship, e)}
                      disabled={isRepairing}
                      style={{
                        flex: 1,
                        background: isRepairing
                          ? 'rgba(255, 170, 0, 0.3)'
                          : 'linear-gradient(135deg, #ffaa00, #ff8800)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: isRepairing ? 'wait' : 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isRepairing ? `🔧 ${text.repairing}` : `🔧 ${text.repair} (${calculateRepairCost(ship)} 💎)`}
                    </button>
                  )}

                  {/* Upgrade button */}
                  {isUpgradingNow ? (
                    <div style={{
                      flex: needsRepair ? 1 : 'auto',
                      width: needsRepair ? 'auto' : '100%',
                      background: 'rgba(76, 175, 80, 0.2)',
                      border: '1px solid #4CAF50',
                      borderRadius: '10px',
                      padding: '10px',
                      color: '#4CAF50',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      ⏳ {text.upgrading} {formatUpgradeTime(upgradeTimeRemaining)}
                    </div>
                  ) : upgradeCost !== null ? (
                    <button
                      onClick={(e) => handleUpgrade(ship, e)}
                      disabled={isUpgrading}
                      style={{
                        flex: needsRepair ? 1 : 'auto',
                        width: needsRepair ? 'auto' : '100%',
                        background: isUpgrading
                          ? 'rgba(76, 175, 80, 0.3)'
                          : 'linear-gradient(135deg, #4CAF50, #45a049)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: isUpgrading ? 'wait' : 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isUpgrading ? `⬆️ ${text.upgrading}` : `⬆️ ${text.upgrade} T${ship.tier + 1} (${upgradeCost} 💎)`}
                    </button>
                  ) : ship.tier >= 3 ? (
                    <div style={{
                      flex: needsRepair ? 1 : 'auto',
                      width: needsRepair ? 'auto' : '100%',
                      background: 'rgba(255, 107, 107, 0.2)',
                      border: '1px solid #FF6B6B',
                      borderRadius: '10px',
                      padding: '10px',
                      color: '#FF6B6B',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      ⭐ {text.maxTier}
                    </div>
                  ) : null}
                </div>

                {/* Formation buttons row */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {isInFormation ? (
                    <div style={{
                      width: '100%',
                      background: `rgba(${parseInt(raceColor.slice(1, 3), 16)}, ${parseInt(raceColor.slice(3, 5), 16)}, ${parseInt(raceColor.slice(5, 7), 16)}, 0.2)`,
                      border: `1px solid ${raceColor}`,
                      borderRadius: '10px',
                      padding: '10px',
                      color: raceColor,
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {text.inFormation}
                    </div>
                  ) : formationShipIds.length < 5 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToFormation(ship.id);
                      }}
                      style={{
                        width: '100%',
                        background: `linear-gradient(135deg, ${raceColor}, ${raceColor}CC)`,
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {text.addToFormation}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Hangar;
