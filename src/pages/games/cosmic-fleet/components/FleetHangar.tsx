import React, { useState } from 'react';
import { Ship, SHIP_CLASS_INFO } from '../types/ships';

interface FleetHangarProps {
  ships: Ship[];
  onSelectShip: (ship: Ship) => void;
  selectedShipId?: string;
  onRepairShip?: (shipId: string) => Promise<boolean>;
  onAddToFormation?: (shipId: string) => void;
  formationShipIds?: string[];
}

const FleetHangar: React.FC<FleetHangarProps> = ({
  ships,
  onSelectShip,
  selectedShipId,
  onRepairShip,
  onAddToFormation,
  formationShipIds = []
}) => {
  const [repairingShips, setRepairingShips] = useState<Set<string>>(new Set());

  const handleRepair = async (ship: Ship) => {
    if (!onRepairShip || ship.health === ship.maxHealth) return;

    setRepairingShips(prev => new Set(prev).add(ship.id));

    try {
      await onRepairShip(ship.id);
    } catch (error) {
      console.error('Repair failed:', error);
    } finally {
      setRepairingShips(prev => {
        const newSet = new Set(prev);
        newSet.delete(ship.id);
        return newSet;
      });
    }
  };

  const getHealthColor = (health: number, maxHealth: number): string => {
    const ratio = health / maxHealth;
    if (ratio > 0.7) return '#44ff44';
    if (ratio > 0.3) return '#ffaa00';
    return '#ff4444';
  };

  const getHealthBarWidth = (health: number, maxHealth: number): string => {
    return `${(health / maxHealth) * 100}%`;
  };

  if (ships.length === 0) {
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
          Ангар пуст
        </h3>
        <p style={{ color: '#aaa', lineHeight: '1.6' }}>
          Отправляйтесь в магазин и приобретите свой первый корабль!
          <br />
          Начните с фрегата и постройте мощный флот.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '20px',
      padding: '25px',
      border: '2px solid #00f0ff',
      boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '2rem', marginRight: '15px' }}>🚢</div>
        <div>
          <h3 style={{
            color: '#00f0ff',
            margin: 0,
            fontSize: '1.4rem',
            textShadow: '0 0 10px #00f0ff'
          }}>
            Ангар флота
          </h3>
          <p style={{
            color: '#aaa',
            margin: '5px 0 0 0',
            fontSize: '0.9rem'
          }}>
            {ships.length} кораблей в вашем флоте
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '15px'
      }}>
        {ships.map(ship => {
          const classInfo = SHIP_CLASS_INFO[ship.class];
          const isSelected = ship.id === selectedShipId;
          const isRepairing = repairingShips.has(ship.id);
          const needsRepair = ship.health < ship.maxHealth;
          const isInFormation = formationShipIds.includes(ship.id);

          return (
            <div
              key={ship.id}
              onClick={() => onSelectShip(ship)}
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${classInfo.color}22, ${classInfo.color}11)`
                  : isInFormation
                    ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(0, 240, 255, 0.05))'
                    : 'rgba(255, 255, 255, 0.05)',
                border: isSelected
                  ? `2px solid ${classInfo.color}`
                  : isInFormation
                    ? '2px solid #00f0ff'
                    : '2px solid #444',
                borderRadius: '15px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isSelected
                  ? `0 0 20px ${classInfo.color}40`
                  : isInFormation
                    ? '0 0 15px rgba(0, 240, 255, 0.3)'
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
                      {classInfo.emoji}
                    </span>
                    <div>
                      <h4 style={{
                        color: '#fff',
                        margin: 0,
                        fontSize: '1.2rem'
                      }}>
                        {ship.name}
                      </h4>
                      <div style={{
                        color: classInfo.color,
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {classInfo.name} • Ур. {ship.level}
                      </div>
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{
                    background: classInfo.color,
                    borderRadius: '50%',
                    width: '12px',
                    height: '12px',
                    boxShadow: `0 0 10px ${classInfo.color}`
                  }} />
                )}
              </div>

              {/* Полоса здоровья */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '5px'
                }}>
                  <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                    Прочность
                  </span>
                  <span style={{
                    color: getHealthColor(ship.health, ship.maxHealth),
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {ship.health} / {ship.maxHealth}
                  </span>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: getHealthColor(ship.health, ship.maxHealth),
                    height: '100%',
                    width: getHealthBarWidth(ship.health, ship.maxHealth),
                    borderRadius: '10px',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Характеристики */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px',
                marginBottom: '15px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff6666', fontSize: '0.8rem' }}>⚔️ Урон</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{ship.damage}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#66ff66', fontSize: '0.8rem' }}>🏃 Скорость</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{ship.speed}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ffaa66', fontSize: '0.8rem' }}>⭐ Опыт</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{ship.experience}</div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Кнопка ремонта */}
                {needsRepair && onRepairShip && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRepair(ship);
                    }}
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
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      cursor: isRepairing ? 'wait' : 'pointer',
                      transition: 'all 0.3s ease',
                      transform: isRepairing ? 'scale(0.95)' : 'scale(1)'
                    }}
                  >
                    {isRepairing ? '🔧 Ремонтируем...' : '🔧 Ремонт'}
                  </button>
                )}

                {/* Кнопка добавить в формацию */}
                {onAddToFormation && (
                  isInFormation ? (
                    <div style={{
                      flex: needsRepair ? 1 : 'auto',
                      width: needsRepair ? 'auto' : '100%',
                      background: 'rgba(0, 240, 255, 0.2)',
                      border: '1px solid #00f0ff',
                      borderRadius: '10px',
                      padding: '10px',
                      color: '#00f0ff',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      ✓ В формации
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
                        background: 'linear-gradient(135deg, #00f0ff, #0088ff)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      + В формацию
                    </button>
                  ) : null
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FleetHangar;