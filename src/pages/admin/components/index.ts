// pages/admin/components/index.ts - Центральный экспорт всех компонентов админки

// Основные компоненты
export { default as AdminLayout } from './AdminLayout';
export { default as LoadingScreen } from './LoadingScreen';
export { default as ErrorScreen } from './ErrorScreen';

// Статистика
export { default as AdminStatsTab } from './AdminStatsTab';
export { default as AdminStatsCard } from './AdminStatsCard';
export { default as AdminTopPlayersTable } from './AdminTopPlayersTable';

// Управление игроками
export { default as AdminPlayersTab } from './AdminPlayersTab';
export { default as PlayerActionsPanel } from './PlayerActionsPanel';
export { default as PlayerBalanceManager } from './PlayerBalanceManager';

// Управление заданиями
export { default as AdminQuestsTab } from './AdminQuestsTab';
export { default as QuestActionButtons } from './QuestActionButtons';
export { default as QuestCreator } from './QuestCreator';
export { default as QuestStatistics } from './QuestStatistics';

// Остальные разделы
export { default as AdminMinigamesTab } from './AdminMinigamesTab';
export { default as AdminFinanceTab } from './AdminFinanceTab';
export { default as AdminSystemTab } from './AdminSystemTab';
export { default as AdminNotificationsTab } from './AdminNotificationsTab';