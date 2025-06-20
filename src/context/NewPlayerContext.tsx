// Упрощенный PlayerContext - только базовая информация об игроке
import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayerData } from '../hooks';

// Используем any для player пока что, чтобы избежать конфликтов типов
interface PlayerContextType {
  player: any;
  setPlayer: (player: any) => void;
  loading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  updatePlayer: () => Promise<void>;
  refreshPlayer: () => Promise<void>;
  fetchInitialData: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const {
    player,
    setPlayer,
    loading,
    error,
    setError,
    updatePlayer: updatePlayerData,
    refreshPlayer: refreshPlayerData,
    fetchInitialData,
  } = usePlayerData();

  // 🔥 ИСПРАВЛЕНО: НЕ МЕНЯЕМ ЯЗЫК АВТОМАТИЧЕСКИ ДЛЯ НОВЫХ ИГРОКОВ!
  React.useEffect(() => {
    // ТОЛЬКО если язык установлен И игрок не новый
    if (player?.language && player.language !== null && i18n.language !== player.language) {
      console.log(`🌐 NewPlayerContext: Автоматическая смена языка на ${player.language}`);
      i18n.changeLanguage(player.language);
    } else if (!player?.language) {
      console.log('🌐 NewPlayerContext: Язык не установлен - НЕ меняем автоматически');
    }
  }, [player, i18n]);

  // Обертки для совместимости с существующим кодом
  const updatePlayer = async (): Promise<void> => {
    if (player?.telegram_id) {
      await updatePlayerData(player.telegram_id);
    }
  };

  const refreshPlayer = async (): Promise<void> => {
    await refreshPlayerData();
  };

  const value: PlayerContextType = {
    player,
    setPlayer,
    loading,
    error,
    setError,
    updatePlayer,
    refreshPlayer,
    fetchInitialData,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const useNewPlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('useNewPlayer must be used within a PlayerProvider');
  }
  return context;
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};