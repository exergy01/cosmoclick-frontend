// Временный файл совместимости для старых страниц
// Перенаправляет на новые контексты

import { useNewPlayer } from './NewPlayerContext';
import { useGame } from './GameContext';
import { useShop } from './ShopContext';
import { useEconomy } from './EconomyContext';

// Хук совместимости который объединяет все новые хуки
export const usePlayer = () => {
  const playerContext = useNewPlayer();
  const gameContext = useGame();
  const shopContext = useShop();
  const economyContext = useEconomy();

  // Возвращаем объект который выглядит как старый PlayerContext
  return {
    // Из PlayerContext
    ...playerContext,
    
    // Из GameContext
    ...gameContext,
    
    // Из ShopContext
    buyAsteroid: shopContext.buyAsteroid,
    buyDrone: shopContext.buyDrone,
    buyCargo: shopContext.buyCargo,
    buySystem: shopContext.buySystem,
    
    // Из EconomyContext
    convertCurrency: economyContext.convertCurrency,
    
    // Добавляем функции которые могут отсутствовать (заглушки)
    generateReferralLink: async () => {
      console.log('generateReferralLink called - implement if needed');
    },
    getReferralStats: async () => {
      console.log('getReferralStats called - implement if needed');
    },
  };
};

// Пустой провайдер - все провайдеры уже в AppProvider
export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};