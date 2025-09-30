export interface Player {
  telegram_id: string;
  username: string;
  language: string;
  ccc: string | number;
  cs: string | number;
  ton: string | number;
  cargo_capacity: number;
  cargo_level: number;
  auto_collect: boolean;
  last_collection_time: string | null;
  asteroids: { id: number; system: number }[];
  drones: { id: number; system: number }[];
  systems: number[];
  referral_link: string | null;
  referrals_count: number;
  verified: boolean;
  ad_views: number;
  last_ad_reset: string | null;
  premium_no_ads_until?: string | null;
  premium_no_ads_forever?: boolean;
}

export interface Exchange {
  id: number;
  telegram_id: string;
  type: 'CCC_TO_CS' | 'CS_TO_CCC';
  amount_from: number;
  amount_to: number;
  timestamp: string;
}

export interface Quest {
  id: number;
  telegram_id: string;
  quest_id: number;
  completed: boolean;
  reward_cs: number;
  timestamp: string;
}

export interface ShopItem {
  id: number;
  price: number;
  system: number;
  capacity?: number;
  cccPerDay?: number;
  image?: string;
  description?: string;
}

interface TelegramWebApp {
  initDataUnsafe: {
    user?: {
      id?: number;
      language_code?: string;
    };
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}