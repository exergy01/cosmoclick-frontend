// pages/admin/types/index.ts

// Основные типы статистики
export interface AdminStats {
    players: {
      total_players: number;
      verified_players: number;
      active_24h: number;
      active_7d: number;
    };
    currencies: {
      total_ccc: number;
      total_cs: number;
      total_ton: number;
      total_stars: number;
      avg_ccc: number;
      avg_cs: number;
      avg_ton: number;
    };
    stars_exchange: {
      total_exchanges: number;
      total_stars_exchanged: number;
      total_cs_received: number;
      exchanges_24h: number;
    };
    top_players: TopPlayer[];
    current_rates: {
      [key: string]: ExchangeRate;
    };
  }
  
  // Игрок в топе
  export interface TopPlayer {
    telegram_id: string;
    username: string;
    first_name: string;
    cs: number;
    ccc: number;
    ton: number;
    telegram_stars: number;
    verified: boolean;
  }
  
  // Курс обмена
  export interface ExchangeRate {
    currency_pair: string;
    rate: number;
    last_updated: string;
    source: string;
  }
  
  // Подробные данные игрока для админки
  export interface PlayerData {
    player: {
      telegram_id: string;
      username: string;
      first_name: string;
      ccc: number;
      cs: number;
      ton: number;
      telegram_stars: number;
      verified: boolean;
      language_code: string;
      referrer_id?: string;
      created_at: string;
      last_activity: string;
    };
    recent_actions: PlayerAction[];
    stars_history: StarsTransaction[];
    referral_stats: {
      referrals_count: number;
    };
  }
  
  // Действие игрока
  export interface PlayerAction {
    action_type: string;
    amount: number;
    created_at: string;
    details: any;
  }
  
  // Транзакция Stars
  export interface StarsTransaction {
    amount: number;
    cs_amount: number;
    exchange_rate: number;
    created_at: string;
    status: string;
  }
  
  // Результат поиска игроков
  export interface SearchResult {
    telegram_id: string;
    username: string;
    first_name: string;
    cs: number;
    ccc: number;
    ton: number;
    telegram_stars: number;
    verified: boolean;
    last_activity: string;
  }
  
  // Формы управления
  export interface BalanceManageForm {
    playerId: string;
    currency: 'ccc' | 'cs' | 'ton' | 'stars';
    operation: 'add' | 'set';
    amount: string;
  }
  
  export interface TonRateForm {
    newRate: string;
  }
  
  // Результат операции изменения баланса
  export interface BalanceUpdateResult {
    success: boolean;
    player: any;
    operation: {
      currency: string;
      operation: string;
      amount: number;
      new_balance: number;
    };
  }
  
  // Результат обновления курса TON
  export interface TonRateUpdateResult {
    success: boolean;
    previous_rate: number;
    new_rate: number;
    source: string;
  }
  
  // Статус проверки админа
  export interface AdminAuthStatus {
    isAdmin: boolean;
    timestamp: string;
  }
  
  // Тип активной вкладки
  export type AdminTabType = 'stats' | 'players' | 'exchange' | 'management';
  
  // Данные для карточки статистики
  export interface StatsCardData {
    label: string;
    value: string | number;
    color?: string;
    suffix?: string;
  }
  
  // Пропсы для компонентов
  export interface AdminStatsCardProps {
    title: string;
    icon: string;
    data: StatsCardData[];
    colorStyle: string;
    onClick?: () => void;
    loading?: boolean;
  }
  
  export interface AdminLayoutProps {
    children: React.ReactNode;
    activeTab: AdminTabType;
    onTabChange: (tab: AdminTabType) => void;
    colorStyle: string;
    playerName?: string;
    playerId?: string;
    onBackClick: () => void;
  }
  
  export interface AdminSearchBoxProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearch: () => void;
    loading?: boolean;
    colorStyle: string;
  }
  
  export interface AdminPlayerCardProps {
    player: PlayerData;
    onClose: () => void;
    onVerifyChange: (playerId: string, verified: boolean) => void;
    colorStyle: string;
    loading?: boolean;
  }
  
  // API ошибки
  export interface AdminApiError {
    message: string;
    status?: number;
    code?: string;
  }
  
  // Состояние загрузки
  export interface LoadingState {
    [key: string]: boolean;
  }
  
  // Кастомные хуки возвращают
  export interface UseAdminAuthReturn {
    isAdmin: boolean;
    loading: boolean;
    error: string | null;
    checkAdminStatus: () => Promise<void>;
  }
  
  export interface UseAdminStatsReturn {
    stats: AdminStats | null;
    loading: boolean;
    error: string | null;
    loadStats: () => Promise<void>;
    refresh: () => Promise<void>;
  }
  
  export interface UsePlayerSearchReturn {
    results: SearchResult[];
    loading: boolean;
    error: string | null;
    search: (query: string) => Promise<void>;
    clear: () => void;
  }
  
  export interface UsePlayerManagementReturn {
    selectedPlayer: PlayerData | null;
    loading: boolean;
    error: string | null;
    loadPlayer: (playerId: string) => Promise<void>;
    updateBalance: (form: BalanceManageForm) => Promise<boolean>;
    verifyPlayer: (playerId: string, verified: boolean) => Promise<boolean>;
    clearPlayer: () => void;
  }
  
  export interface UseExchangeManagementReturn {
    loading: boolean;
    error: string | null;
    updateTonRate: (form: TonRateForm) => Promise<boolean>;
    unblockExchange: (exchangeType: string) => Promise<boolean>;
  }
  
  // Константы
  export const ADMIN_TABS = [
    { key: 'stats' as const, label: 'Статистика', icon: '📊' },
    { key: 'players' as const, label: 'Игроки', icon: '👥' },
    { key: 'exchange' as const, label: 'Обмены', icon: '💱' },
    { key: 'management' as const, label: 'Управление', icon: '⚙️' }
  ];
  
  export const CURRENCIES = [
    { value: 'ccc', label: 'CCC' },
    { value: 'cs', label: 'CS' },
    { value: 'ton', label: 'TON' },
    { value: 'stars', label: 'Stars' }
  ] as const;
  
  export const OPERATIONS = [
    { value: 'add', label: 'Добавить к текущему' },
    { value: 'set', label: 'Установить точное значение' }
  ] as const;