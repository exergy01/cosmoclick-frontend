export type ShipClass = 'frigate' | 'cruiser' | 'battleship' | 'dreadnought';

export interface Ship {
  id: string;
  name: string;
  class: ShipClass;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  level: number;
  experience: number;
  price: number;
  isOwned?: boolean;
}

export interface ShipTemplate {
  id: string;
  name: string;
  class: ShipClass;
  baseHealth: number;
  baseDamage: number;
  baseSpeed: number;
  price: number;
  description: string;
  emoji: string;
}

export const SHIP_TEMPLATES: ShipTemplate[] = [
  {
    id: 'frigate_1',
    name: 'Interceptor',
    class: 'frigate',
    baseHealth: 150,
    baseDamage: 35,
    baseSpeed: 90,
    price: 200,
    description: 'Быстрый разведывательный корабль',
    emoji: '🚀'
  },
  {
    id: 'frigate_2',
    name: 'Scout',
    class: 'frigate',
    baseHealth: 200,
    baseDamage: 40,
    baseSpeed: 85,
    price: 350,
    description: 'Улучшенный фрегат для разведки',
    emoji: '🛸'
  },
  {
    id: 'cruiser_1',
    name: 'Destroyer',
    class: 'cruiser',
    baseHealth: 450,
    baseDamage: 85,
    baseSpeed: 65,
    price: 800,
    description: 'Универсальный боевой корабль',
    emoji: '🚁'
  },
  {
    id: 'cruiser_2',
    name: 'Heavy Cruiser',
    class: 'cruiser',
    baseHealth: 600,
    baseDamage: 110,
    baseSpeed: 55,
    price: 1500,
    description: 'Тяжелый крейсер с мощным вооружением',
    emoji: '✈️'
  },
  {
    id: 'battleship_1',
    name: 'Battlecruiser',
    class: 'battleship',
    baseHealth: 1200,
    baseDamage: 220,
    baseSpeed: 40,
    price: 3500,
    description: 'Мощный линейный корабль',
    emoji: '🛩️'
  },
  {
    id: 'dreadnought_1',
    name: 'Titan',
    class: 'dreadnought',
    baseHealth: 2500,
    baseDamage: 450,
    baseSpeed: 25,
    price: 8500,
    description: 'Легендарный дредноут-флагман',
    emoji: '🛸'
  }
];

export const SHIP_CLASS_INFO = {
  frigate: {
    name: 'Фрегат',
    description: 'Быстрые и маневренные корабли',
    emoji: '🚀',
    color: '#00ff88'
  },
  cruiser: {
    name: 'Крейсер',
    description: 'Универсальные боевые корабли',
    emoji: '🚁',
    color: '#00aaff'
  },
  battleship: {
    name: 'Линкор',
    description: 'Тяжелые боевые корабли',
    emoji: '🛩️',
    color: '#ff6600'
  },
  dreadnought: {
    name: 'Дредноут',
    description: 'Самые мощные корабли',
    emoji: '🛸',
    color: '#ff0066'
  }
};