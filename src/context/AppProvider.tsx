// Композитный провайдер для всех контекстов
import React, { ReactNode } from 'react';
import { PlayerProvider } from './NewPlayerContext';
import { GameProvider } from './GameContext';
import { ShopProvider } from './ShopContext';
import { EconomyProvider } from './EconomyContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <PlayerProvider>
      <GameProvider>
        <ShopProvider>
          <EconomyProvider>
            {children}
          </EconomyProvider>
        </ShopProvider>
      </GameProvider>
    </PlayerProvider>
  );
};

// Экспорт всех хуков для удобства
export { useNewPlayer as usePlayer } from './NewPlayerContext';
export { useGame } from './GameContext';
export { useShop } from './ShopContext';
export { useEconomy } from './EconomyContext';