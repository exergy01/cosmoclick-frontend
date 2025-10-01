import React, { useState } from 'react';
import { ShipTemplate, SHIP_TEMPLATES, SHIP_CLASS_INFO, ShipClass } from '../types/ships';
import { triggerSuccessFeedback } from '../../../../utils/feedbackUtils';

interface ShipShopProps {
  luminiosBalance: number;
  onPurchaseShip: (template: ShipTemplate) => Promise<boolean>;
}

const ShipShop: React.FC<ShipShopProps> = ({ luminiosBalance, onPurchaseShip }) => {
  const [selectedClass, setSelectedClass] = useState<ShipClass | 'all'>('all');
  const [purchasingShips, setPurchasingShips] = useState<Set<string>>(new Set());

  const handlePurchase = async (template: ShipTemplate) => {
    if (template.price > luminiosBalance) return;

    setPurchasingShips(prev => new Set(prev).add(template.id));
    await triggerSuccessFeedback();

    try {
      const success = await onPurchaseShip(template);
      if (success) {
        await triggerSuccessFeedback();
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setPurchasingShips(prev => {
        const newSet = new Set(prev);
        newSet.delete(template.id);
        return newSet;
      });
    }
  };

  const filteredShips = selectedClass === 'all'
    ? SHIP_TEMPLATES
    : SHIP_TEMPLATES.filter(ship => ship.class === selectedClass);

  const shipsByClass = SHIP_TEMPLATES.reduce((acc, ship) => {
    if (!acc[ship.class]) acc[ship.class] = [];
    acc[ship.class].push(ship);
    return acc;
  }, {} as Record<ShipClass, ShipTemplate[]>);

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '20px',
      padding: '25px',
      border: '2px solid #ff6600',
      boxShadow: '0 0 20px rgba(255, 102, 0, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: '2rem', marginRight: '15px' }}>🛒</div>
          <div>
            <h3 style={{
              color: '#ff6600',
              margin: 0,
              fontSize: '1.4rem',
              textShadow: '0 0 10px #ff6600'
            }}>
              Верфь кораблей
            </h3>
            <p style={{
              color: '#aaa',
              margin: '5px 0 0 0',
              fontSize: '0.9rem'
            }}>
              Постройте свой космический флот
            </p>
          </div>
        </div>
        <div style={{
          background: 'rgba(255, 102, 0, 0.1)',
          padding: '10px 15px',
          borderRadius: '10px',
          border: '1px solid #ff6600',
          textAlign: 'center'
        }}>
          <div style={{ color: '#ff6600', fontSize: '0.8rem' }}>💎 Баланс</div>
          <div style={{ color: '#fff', fontWeight: 'bold' }}>
            {luminiosBalance.toLocaleString()} LUM
          </div>
        </div>
      </div>

      {/* Фильтр по классам */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        overflowX: 'auto',
        padding: '5px'
      }}>
        <button
          onClick={() => setSelectedClass('all')}
          style={{
            background: selectedClass === 'all'
              ? 'linear-gradient(135deg, #ff6600, #ff8800)'
              : 'rgba(255, 102, 0, 0.2)',
            border: '1px solid #ff6600',
            borderRadius: '20px',
            padding: '8px 15px',
            color: '#fff',
            fontSize: '0.9rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s ease'
          }}
        >
          🌟 Все
        </button>
        {(Object.keys(SHIP_CLASS_INFO) as ShipClass[]).map(shipClass => {
          const classInfo = SHIP_CLASS_INFO[shipClass];
          const count = shipsByClass[shipClass]?.length || 0;

          return (
            <button
              key={shipClass}
              onClick={() => setSelectedClass(shipClass)}
              style={{
                background: selectedClass === shipClass
                  ? `linear-gradient(135deg, ${classInfo.color}, ${classInfo.color}dd)`
                  : `rgba(${parseInt(classInfo.color.slice(1, 3), 16)}, ${parseInt(classInfo.color.slice(3, 5), 16)}, ${parseInt(classInfo.color.slice(5, 7), 16)}, 0.2)`,
                border: `1px solid ${classInfo.color}`,
                borderRadius: '20px',
                padding: '8px 15px',
                color: '#fff',
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.3s ease'
              }}
            >
              {classInfo.emoji} {classInfo.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Корабли */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {filteredShips.map(template => {
          const classInfo = SHIP_CLASS_INFO[template.class];
          const isPurchasing = purchasingShips.has(template.id);
          const canAfford = template.price <= luminiosBalance;

          return (
            <div
              key={template.id}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${classInfo.color}`,
                borderRadius: '15px',
                padding: '20px',
                transition: 'all 0.3s ease',
                opacity: canAfford ? 1 : 0.6
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <span style={{ fontSize: '2rem', marginRight: '15px' }}>
                  {template.emoji}
                </span>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    color: '#fff',
                    margin: 0,
                    fontSize: '1.3rem'
                  }}>
                    {template.name}
                  </h4>
                  <div style={{
                    color: classInfo.color,
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {classInfo.name}
                  </div>
                  <div style={{
                    color: '#aaa',
                    fontSize: '0.8rem',
                    lineHeight: '1.4'
                  }}>
                    {template.description}
                  </div>
                </div>
              </div>

              {/* Характеристики */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px',
                marginBottom: '20px',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '15px',
                borderRadius: '10px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#4dff4d', fontSize: '0.8rem', marginBottom: '5px' }}>
                    ❤️ Прочность
                  </div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {template.baseHealth}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ff6666', fontSize: '0.8rem', marginBottom: '5px' }}>
                    ⚔️ Урон
                  </div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {template.baseDamage}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#66ff66', fontSize: '0.8rem', marginBottom: '5px' }}>
                    🏃 Скорость
                  </div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {template.baseSpeed}
                  </div>
                </div>
              </div>

              {/* Цена и кнопка */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  background: 'rgba(255, 102, 0, 0.1)',
                  padding: '10px 15px',
                  borderRadius: '10px',
                  border: '1px solid #ff6600'
                }}>
                  <div style={{ color: '#ff6600', fontSize: '0.8rem' }}>💎 Цена</div>
                  <div style={{
                    color: canAfford ? '#fff' : '#ff4444',
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}>
                    {template.price.toLocaleString()} LUM
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(template)}
                  disabled={isPurchasing || !canAfford}
                  style={{
                    background: isPurchasing || !canAfford
                      ? 'rgba(255, 102, 0, 0.3)'
                      : `linear-gradient(135deg, ${classInfo.color}, ${classInfo.color}dd)`,
                    border: 'none',
                    borderRadius: '15px',
                    padding: '12px 20px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: isPurchasing || !canAfford ? 'not-allowed' : 'pointer',
                    boxShadow: isPurchasing || !canAfford
                      ? 'none'
                      : `0 5px 15px ${classInfo.color}40`,
                    transition: 'all 0.3s ease',
                    transform: isPurchasing ? 'scale(0.95)' : 'scale(1)'
                  }}
                >
                  {isPurchasing
                    ? '🔨 Строим...'
                    : !canAfford
                    ? '💰 Не хватает LUM'
                    : '🚀 Построить'
                  }
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredShips.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#aaa'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
          <p>Корабли этого класса не найдены</p>
        </div>
      )}
    </div>
  );
};

export default ShipShop;