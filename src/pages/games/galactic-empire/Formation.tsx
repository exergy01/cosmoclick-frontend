/**
 * ⚔️ ФОРМАЦИЯ - ПОДГОТОВКА К БОЮ
 * Galactic Empire v2.0
 */

import React from 'react';

interface Ship {
  id: number;
  ship_type: string;
  ship_class: string;
  tier: number;
  current_hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  speed: number;
}

interface FormationProps {
  formationShips: Ship[];
  onRemoveFromFormation: (shipId: number) => void;
  onStartBattle: () => void;
  lang: string;
  raceColor: string;
  maxSlots?: number;
}

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

const Formation: React.FC<FormationProps> = ({
  formationShips,
  onRemoveFromFormation,
  onStartBattle,
  lang,
  raceColor,
  maxSlots = 5
}) => {
  const t = {
    ru: {
      title: 'Боевая формация',
      empty: 'Слот пуст',
      emptyDesc: 'Добавьте корабли из ангара',
      startBattle: 'Начать бой',
      totalPower: 'Общая мощь',
      slots: 'слотов',
      remove: 'Убрать'
    },
    en: {
      title: 'Battle Formation',
      empty: 'Empty slot',
      emptyDesc: 'Add ships from hangar',
      startBattle: 'Start Battle',
      totalPower: 'Total Power',
      slots: 'slots',
      remove: 'Remove'
    }
  };

  const text = t[lang as 'ru' | 'en'] || t.en;

  // Вычисляем общую мощь
  const totalAttack = formationShips.reduce((sum, ship) => sum + ship.attack, 0);
  const totalDefense = formationShips.reduce((sum, ship) => sum + ship.defense, 0);
  const totalHP = formationShips.reduce((sum, ship) => sum + ship.current_hp, 0);
  const maxTotalHP = formationShips.reduce((sum, ship) => sum + ship.max_hp, 0);

  // Проверка готовности к бою - можно хоть с 1 кораблём
  const canBattle = formationShips.length > 0 && formationShips.every(ship => ship.current_hp > 0);

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '20px',
      padding: '25px',
      border: `2px solid ${raceColor}`,
      boxShadow: `0 0 20px ${raceColor}40`
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: '2rem', marginRight: '15px' }}>⚔️</div>
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
              {formationShips.length} / {maxSlots} {text.slots}
            </p>
          </div>
        </div>

        {/* Start Battle Button */}
        <button
          onClick={onStartBattle}
          disabled={!canBattle}
          style={{
            background: canBattle
              ? `linear-gradient(135deg, ${raceColor}, ${raceColor}CC)`
              : 'rgba(100, 100, 100, 0.3)',
            border: `2px solid ${canBattle ? raceColor : '#555'}`,
            borderRadius: '15px',
            padding: '15px 30px',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: canBattle ? 'pointer' : 'not-allowed',
            opacity: canBattle ? 1 : 0.5,
            transition: 'all 0.3s ease',
            boxShadow: canBattle ? `0 5px 20px ${raceColor}60` : 'none'
          }}
        >
          🚀 {text.startBattle}
        </button>
      </div>

      {/* Formation Slots */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '15px',
        marginBottom: '20px'
      }}>
        {Array.from({ length: maxSlots }).map((_, index) => {
          const ship = formationShips[index];

          if (!ship) {
            return (
              <div
                key={`empty-${index}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '2px dashed #444',
                  borderRadius: '15px',
                  padding: '20px',
                  textAlign: 'center',
                  minHeight: '150px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.3 }}>+</div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>
                  {text.empty}
                </div>
              </div>
            );
          }

          const shipName = SHIP_NAMES[ship.ship_type]?.[lang] || ship.ship_type;
          const emoji = CLASS_EMOJI[ship.ship_class] || '🚀';
          const hpPercent = (ship.current_hp / ship.max_hp) * 100;
          const hpColor = hpPercent > 70 ? '#44ff44' : hpPercent > 30 ? '#ffaa00' : '#ff4444';

          return (
            <div
              key={ship.id}
              style={{
                background: `linear-gradient(135deg, ${raceColor}22, ${raceColor}11)`,
                border: `2px solid ${raceColor}`,
                borderRadius: '15px',
                padding: '15px',
                position: 'relative',
                boxShadow: `0 0 15px ${raceColor}40`
              }}
            >
              {/* Remove Button */}
              <button
                onClick={() => onRemoveFromFormation(ship.id)}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  background: 'rgba(255, 68, 68, 0.8)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                title={text.remove}
              >
                ✕
              </button>

              {/* Ship Info */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '5px' }}>{emoji}</div>
                <div style={{
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  marginBottom: '3px'
                }}>
                  {shipName}
                </div>
                <div style={{ color: '#aaa', fontSize: '0.7rem' }}>
                  Tier {ship.tier}
                </div>
              </div>

              {/* HP Bar */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  marginBottom: '3px'
                }}>
                  <span style={{ color: '#aaa' }}>HP</span>
                  <span style={{ color: hpColor, fontWeight: 'bold' }}>
                    {ship.current_hp}/{ship.max_hp}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '5px',
                  height: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: hpColor,
                    height: '100%',
                    width: `${hpPercent}%`,
                    borderRadius: '5px',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '0.7rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff6666' }}>⚔️</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{ship.attack}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#66ff66' }}>🛡️</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{ship.defense}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ffaa66' }}>⚡</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{ship.speed}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Stats */}
      {formationShips.length > 0 && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '15px',
          padding: '15px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            color: raceColor,
            fontSize: '1rem',
            fontWeight: 'bold',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            {text.totalPower}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            fontSize: '0.9rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '3px' }}>HP</div>
              <div style={{ color: '#44ff44', fontWeight: 'bold' }}>
                {totalHP}/{maxTotalHP}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '3px' }}>⚔️ Attack</div>
              <div style={{ color: '#ff6666', fontWeight: 'bold' }}>{totalAttack}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '3px' }}>🛡️ Defense</div>
              <div style={{ color: '#66ff66', fontWeight: 'bold' }}>{totalDefense}</div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {formationShips.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#666'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚔️</div>
          <p>{text.emptyDesc}</p>
        </div>
      )}
    </div>
  );
};

export default Formation;
