export interface ShopItem {
    id: number;
    system: number;
    price: number;
    totalCcc?: number;
    cccPerDay?: number;
    capacity?: number | string;
  }
  
  export const asteroidData: ShopItem[] = [
    { id: 1, system: 2, totalCcc: 2080, price: 6 }, 
    { id: 2, system: 2, totalCcc: 2990, price: 8 }, 
    { id: 3, system: 2, totalCcc: 4550, price: 12 }, 
    { id: 4, system: 2, totalCcc: 6760, price: 16 }, 
    { id: 5, system: 2, totalCcc: 10140, price: 24 },
    { id: 6, system: 2, totalCcc: 15080, price: 33 }, 
    { id: 7, system: 2, totalCcc: 22620, price: 49 }, 
    { id: 8, system: 2, totalCcc: 33930, price: 64 }, 
    { id: 9, system: 2, totalCcc: 50830, price: 101 }, 
    { id: 10, system: 2, totalCcc: 76180, price: 141 }, 
    { id: 11, system: 2, totalCcc: 114270, price: 186 },
    { id: 12, system: 2, totalCcc: 128570, price: 261 } 
  ];
  
  export const droneData: ShopItem[] = [
    { id: 1, system: 2, cccPerDay: 125, price: 1.5 }, 
    { id: 2, system: 2, cccPerDay: 168, price: 12 }, 
    { id: 3, system: 2, cccPerDay: 227, price: 23 }, 
    { id: 4, system: 2, cccPerDay: 307, price: 33 }, 
    { id: 5, system: 2, cccPerDay: 414, price: 45 }, 
    { id: 6, system: 2, cccPerDay: 559, price: 56.5 }, 
    { id: 7, system: 2, cccPerDay: 756, price: 68 }, 
    { id: 8, system: 2, cccPerDay: 1020, price: 80 }, 
    { id: 9, system: 2, cccPerDay: 1377, price: 91.5 },
    { id: 10, system: 2, cccPerDay: 1859, price: 104.5 }, 
    { id: 11, system: 2, cccPerDay: 2509, price: 117.5 }, 
    { id: 12, system: 2, cccPerDay: 3388, price: 130.5 },
    { id: 13, system: 2, cccPerDay: 4574, price: 143.5 }, 
    { id: 14, system: 2, cccPerDay: 6175, price: 156.5 }, 
    { id: 15, system: 2, cccPerDay: 8574, price: 169.5 } 
  ];
  
  export const cargoData: ShopItem[] = [
    { id: 1, system: 2, capacity: 65, price: 1.5 }, 
    { id: 2, system: 2, capacity: 260, price: 7 }, 
    { id: 3, system: 2, capacity: 2600, price: 20 }, 
    { id: 4, system: 2, capacity: 26000, price: 60 }, 
    { id: 5, system: 2, capacity: 'auto', price: 140 }
  ];
  
  export const getMaxItems = (system: number, type: 'asteroid' | 'drones' | 'cargo'): number => {
    switch (type) {
      case 'asteroid': return 12;
      case 'drones': return 15;
      case 'cargo': return 5;
      default: return 0;
    }
  };