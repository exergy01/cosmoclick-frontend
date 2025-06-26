export interface ShopItem {
  id: number;
  system: number;
  price: number;
  totalCcc?: number;
  cccPerDay?: number;
  capacity?: number | string;
}

export const asteroidData: ShopItem[] = [
  { id: 1, system: 1, totalCcc: 1600, price: 4 },
  { id: 2, system: 1, totalCcc: 2300, price: 6 },
  { id: 3, system: 1, totalCcc: 3500, price: 9 },
  { id: 4, system: 1, totalCcc: 5200, price: 12 },
  { id: 5, system: 1, totalCcc: 7800, price: 18 },
  { id: 6, system: 1, totalCcc: 11600, price: 25 },
  { id: 7, system: 1, totalCcc: 17400, price: 37 },
  { id: 8, system: 1, totalCcc: 26100, price: 49 },
  { id: 9, system: 1, totalCcc: 39100, price: 77 },
  { id: 10, system: 1, totalCcc: 58600, price: 108 },
  { id: 11, system: 1, totalCcc: 87900, price: 143 },
  { id: 12, system: 1, totalCcc: 98900, price: 200 }
];

export const droneData: ShopItem[] = [
  { id: 1, system: 1, cccPerDay: 96, price: 1 },
  { id: 2, system: 1, cccPerDay: 129, price: 9 },
  { id: 3, system: 1, cccPerDay: 174, price: 17 },
  { id: 4, system: 1, cccPerDay: 236, price: 25 },
  { id: 5, system: 1, cccPerDay: 318, price: 34 },
  { id: 6, system: 1, cccPerDay: 430, price: 43 },
  { id: 7, system: 1, cccPerDay: 581, price: 52 },
  { id: 8, system: 1, cccPerDay: 784, price: 61 },
  { id: 9, system: 1, cccPerDay: 1059, price: 70 },
  { id: 10, system: 1, cccPerDay: 1430, price: 80 },
  { id: 11, system: 1, cccPerDay: 1930, price: 90 },
  { id: 12, system: 1, cccPerDay: 2606, price: 100 },
  { id: 13, system: 1, cccPerDay: 3518, price: 110 },
  { id: 14, system: 1, cccPerDay: 4750, price: 120 },
  { id: 15, system: 1, cccPerDay: 6595, price: 130 }
];

export const cargoData: ShopItem[] = [
  { id: 1, system: 1, capacity: 50, price: 1 },
  { id: 2, system: 1, capacity: 200, price: 5 },
  { id: 3, system: 1, capacity: 2000, price: 15 },
  { id: 4, system: 1, capacity: 20000, price: 45 },
  { id: 5, system: 1, capacity: 'auto', price: 100 }
];

export const getMaxItems = (system: number, type: 'asteroid' | 'drones' | 'cargo'): number => {
  switch (type) {
    case 'asteroid': return 12;
    case 'drones': return 15;
    case 'cargo': return 5;
    default: return 0;
  }
};