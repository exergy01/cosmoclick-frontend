/**
 * 🚢 АНГАР - ПРОСМОТР ВСЕХ КОРАБЛЕЙ
 * Galactic Empire v2.0
 */

import React, { useState } from 'react';

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
}

interface HangarProps {
  ships: Ship[];
  formationShipIds: number[];
  onSelectShip: (ship: Ship) => void;
  onAddToFormation: (shipId: number) => void;
  onRepairShip: (shipId: number) => void;
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
  selectedShipId,
  lang,
  raceColor
}) => {
  const [repairingShips, setRepairingShips] = useState<Set<number>>(new Set());

  const t = {
    ru: {
      title: 'Ангар флота',
      empty: 'Ангар пуст',
      emptyDesc: 'Отправляйтесь в Верфь и приобретите свой первый корабль!',
      ships: 'кораблей в вашем флоте',
      hp: 'Прочность',
      repair: 'Ремонт',
      repairing: 'Ремонтируем...',
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
      addToFormation: '+ Add to formation',
      inFormation: '✓ In formation',
      maxFormation: 'Formation is full'
    }
  };

  const text = t[lang as 'ru' | 'en'] || t.en;

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
                      <h4 style={{
                        color: '#fff',
                        margin: 0,
                        fontSize: '1.1rem'
                      }}>
                        {shipName}
                      </h4>
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
                    color: getHealthColor(ship.current_hp, ship.max_hp),
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {ship.current_hp} / {ship.max_hp}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: getHealthColor(ship.current_hp, ship.max_hp),
                    height: '100%',
                    width: `${(ship.current_hp / ship.max_hp) * 100}%`,
                    borderRadius: '10px',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
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
                    {isRepairing ? `🔧 ${text.repairing}` : `🔧 ${text.repair}`}
                  </button>
                )}

                {isInFormation ? (
                  <div style={{
                    flex: needsRepair ? 1 : 'auto',
                    width: needsRepair ? 'auto' : '100%',
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
                      flex: needsRepair ? 1 : 'auto',
                      width: needsRepair ? 'auto' : '100%',
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
          );
        })}
      </div>
    </div>
  );
};

export default Hangar;
