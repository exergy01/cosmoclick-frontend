/**
 * 🔧 MODULE WORKSHOP - Мастерская модулей для Galactic Empire
 */

import React, { useState, useEffect } from 'react';

// ===================================
// INTERFACES
// ===================================

interface Module {
  id: number;
  player_id: string;
  module_type: string;
  module_tier: number;
  quantity: number;
}

interface Ship {
  id: number;
  ship_type: string;
  ship_class: string;
  tier: number;
  module_slot_1?: string | null;
  module_slot_2?: string | null;
  module_slot_3?: string | null;
  hp: number;
  max_hp: number;
  attack: number;
  defense: number;
  speed: number;
}

interface ModuleWorkshopProps {
  modules: Module[];
  ships: Ship[];
  selectedShip: Ship | null;
  onSelectShip: (ship: Ship) => void;
  onEquipModule: (shipId: number, slotNumber: number, moduleType: string, moduleTier: number) => Promise<void>;
  onUnequipModule: (shipId: number, slotNumber: number) => Promise<void>;
  lang: 'en' | 'ru';
  raceColor: string;
}

// ===================================
// TRANSLATIONS
// ===================================

const TEXTS = {
  en: {
    title: 'Module Workshop',
    inventory: 'Module Inventory',
    shipModules: 'Ship Modules',
    selectShip: 'Select a ship',
    emptySlot: 'Empty Slot',
    equip: 'Equip',
    unequip: 'Remove',
    slot: 'Slot',
    noModules: 'No modules available',
    stats: 'Module Bonuses',
    // Module types
    weapon: 'Weapon',
    armor: 'Armor',
    engine: 'Engine',
    shield: 'Shield',
    reactor: 'Reactor',
    // Stats
    attack: 'Attack',
    defense: 'Defense',
    speed: 'Speed',
    hp: 'HP'
  },
  ru: {
    title: 'Мастерская модулей',
    inventory: 'Инвентарь модулей',
    shipModules: 'Модули корабля',
    selectShip: 'Выберите корабль',
    emptySlot: 'Пустой слот',
    equip: 'Установить',
    unequip: 'Снять',
    slot: 'Слот',
    noModules: 'Нет модулей',
    stats: 'Бонусы модуля',
    // Module types
    weapon: 'Оружие',
    armor: 'Броня',
    engine: 'Двигатель',
    shield: 'Щит',
    reactor: 'Реактор',
    // Stats
    attack: 'Атака',
    defense: 'Защита',
    speed: 'Скорость',
    hp: 'HP'
  }
};

// ===================================
// MODULE CONFIG (CLIENT-SIDE COPY)
// ===================================

const MODULE_BONUSES: { [key: string]: { [key: number]: any } } = {
  weapon: {
    1: { attack: 10 },
    2: { attack: 25 },
    3: { attack: 50 }
  },
  armor: {
    1: { defense: 10 },
    2: { defense: 25 },
    3: { defense: 50 }
  },
  engine: {
    1: { speed: 5 },
    2: { speed: 12 },
    3: { speed: 25 }
  },
  shield: {
    1: { hp: 50 },
    2: { hp: 125 },
    3: { hp: 250 }
  },
  reactor: {
    1: { attack: 5, defense: 5, speed: 2, hp: 25 },
    2: { attack: 12, defense: 12, speed: 5, hp: 60 },
    3: { attack: 25, defense: 25, speed: 10, hp: 125 }
  }
};

const MODULE_ICONS: { [key: string]: string } = {
  weapon: '⚔️',
  armor: '🛡️',
  engine: '🚀',
  shield: '💠',
  reactor: '⚡'
};

// ===================================
// COMPONENT
// ===================================

const ModuleWorkshop: React.FC<ModuleWorkshopProps> = ({
  modules,
  ships,
  selectedShip,
  onSelectShip,
  onEquipModule,
  onUnequipModule,
  lang,
  raceColor
}) => {
  const text = TEXTS[lang];
  const [equipMode, setEquipMode] = useState<{ slotNumber: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Получить бонусы модуля
  const getModuleBonuses = (moduleType: string, moduleTier: number) => {
    return MODULE_BONUSES[moduleType]?.[moduleTier] || {};
  };

  // Получить иконку модуля
  const getModuleIcon = (moduleType: string) => {
    return MODULE_ICONS[moduleType] || '📦';
  };

  // Получить цвет по tier
  const getTierColor = (tier: number) => {
    if (tier === 1) return '#4ECDC4';
    if (tier === 2) return '#FFD700';
    if (tier === 3) return '#FF6B6B';
    return '#999';
  };

  // Парсить модуль из слота
  const parseModuleSlot = (slotValue: string | null | undefined): { type: string; tier: number } | null => {
    if (!slotValue) return null;
    const parts = slotValue.split('_');
    if (parts.length !== 2) return null;
    return { type: parts[0], tier: parseInt(parts[1]) };
  };

  // Обработчик установки модуля
  const handleEquip = async (moduleType: string, moduleTier: number) => {
    if (!selectedShip || !equipMode) return;

    setLoading(true);
    try {
      await onEquipModule(selectedShip.id, equipMode.slotNumber, moduleType, moduleTier);
      setEquipMode(null);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик снятия модуля
  const handleUnequip = async (slotNumber: number) => {
    if (!selectedShip) return;

    setLoading(true);
    try {
      await onUnequipModule(selectedShip.id, slotNumber);
    } finally {
      setLoading(false);
    }
  };

  // Рендер слота корабля
  const renderShipSlot = (slotNumber: number) => {
    if (!selectedShip) return null;

    const slotKey = `module_slot_${slotNumber}` as keyof Ship;
    const slotValue = selectedShip[slotKey] as string | null | undefined;
    const module = parseModuleSlot(slotValue);

    const isEquipMode = equipMode?.slotNumber === slotNumber;

    return (
      <div
        key={slotNumber}
        style={{
          background: isEquipMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          border: `2px solid ${isEquipMode ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)'}`,
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '5px' }}>
              {text.slot} {slotNumber}
            </div>
            {module ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>{getModuleIcon(module.type)}</span>
                <div>
                  <div style={{ fontWeight: 'bold', color: getTierColor(module.tier) }}>
                    {text[module.type as keyof typeof text]} T{module.tier}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                    {formatBonuses(getModuleBonuses(module.type, module.tier))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#666' }}>{text.emptySlot}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {module && (
              <button
                onClick={() => handleUnequip(slotNumber)}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: '#FF6B6B',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1
                }}
              >
                {text.unequip}
              </button>
            )}
            <button
              onClick={() => setEquipMode(isEquipMode ? null : { slotNumber })}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: isEquipMode ? '#888' : raceColor,
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {isEquipMode ? '✖' : text.equip}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Форматировать бонусы
  const formatBonuses = (bonuses: any) => {
    const parts = [];
    if (bonuses.attack) parts.push(`⚔️ +${bonuses.attack}`);
    if (bonuses.defense) parts.push(`🛡️ +${bonuses.defense}`);
    if (bonuses.speed) parts.push(`🚀 +${bonuses.speed}`);
    if (bonuses.hp) parts.push(`❤️ +${bonuses.hp}`);
    return parts.join('  ');
  };

  return (
    <div style={{
      padding: '20px',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* HEADER */}
      <h2 style={{
        fontSize: '2rem',
        marginBottom: '30px',
        color: raceColor,
        textShadow: `0 0 10px ${raceColor}`
      }}>
        🔧 {text.title}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* LEFT: SHIP SELECTION & MODULES */}
        <div>
          <h3 style={{ marginBottom: '15px', color: '#ddd' }}>{text.shipModules}</h3>

          {/* Ship selection dropdown */}
          <select
            value={selectedShip?.id || ''}
            onChange={(e) => {
              const ship = ships.find(s => s.id === parseInt(e.target.value));
              if (ship) onSelectShip(ship);
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '1rem',
              marginBottom: '20px'
            }}
          >
            <option value="">{text.selectShip}</option>
            {ships.map(ship => (
              <option key={ship.id} value={ship.id}>
                {ship.ship_type} - T{ship.tier}
              </option>
            ))}
          </select>

          {/* Module slots */}
          {selectedShip ? (
            <div>
              {renderShipSlot(1)}
              {renderShipSlot(2)}
              {renderShipSlot(3)}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px'
            }}>
              {text.selectShip}
            </div>
          )}
        </div>

        {/* RIGHT: MODULE INVENTORY */}
        <div>
          <h3 style={{ marginBottom: '15px', color: '#ddd' }}>{text.inventory}</h3>

          {modules.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {modules.map(module => {
                const bonuses = getModuleBonuses(module.module_type, module.module_tier);
                const canEquip = equipMode !== null;

                return (
                  <div
                    key={module.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: canEquip ? 1 : 0.6,
                      cursor: canEquip ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => canEquip && handleEquip(module.module_type, module.module_tier)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '2rem' }}>{getModuleIcon(module.module_type)}</span>
                      <div>
                        <div style={{
                          fontWeight: 'bold',
                          color: getTierColor(module.module_tier),
                          marginBottom: '4px'
                        }}>
                          {text[module.module_type as keyof typeof text]} T{module.module_tier}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                          {formatBonuses(bonuses)}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontWeight: 'bold'
                    }}>
                      x{module.quantity}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px'
            }}>
              {text.noModules}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleWorkshop;
