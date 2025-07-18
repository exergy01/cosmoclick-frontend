// cosmic-shells/locales/index.ts
// ✅ ИСПРАВЛЕНО: Полная правильная локализация без ошибок

import { CosmicShellsTranslations } from '../types';

export const translations: Record<string, CosmicShellsTranslations> = {
  ru: {
    title: 'Космические Напёрстки',
    subtitle: 'Найди галактику среди черных дыр',
    howToPlay: 'Как играть',
    rule1: 'Сделайте ставку и выберите тарелку',
    rule2: 'Найдите галактику среди черных дыр',
    rule3: 'Шанс выигрыша 33% (1 из 3)',
    rule4: 'Выигрыш x2 от ставки',
    rule5: 'Смотрите рекламу за дополнительные игры',
    placeBet: 'Сделайте ставку',
    betAmount: 'Сумма ставки (CCC):',
    possibleWin: 'Возможный выигрыш:',
    startGame: 'Начать игру',
    newGame: 'Новая игра',
    backToGames: 'К играм',
    lastGames: 'Последние игры',
    fullHistory: 'Вся история',
    time: 'Время',
    bet: 'Ставка',
    result: 'Результат',
    outcome: 'Итог',
    win: 'Выигрыш',
    loss: 'Проигрыш',
    profit: 'Прибыль',
    multiplier: 'Множитель',
    gamesLeft: 'Игр осталось',
    loading: 'Загрузка...',
    shuffling: 'Тарелки перемешиваются...',
    chooseShell: 'Выберите тарелку с галактикой!',
    revealing: 'Открываем результат...',
    extraGame: '+1 игра',
    watching: 'Просмотр...',
    min: 'Минимум',
    max: 'Максимум',
    lost: 'Потеряно',
    emptyHistory: 'История игр пуста',
    makeBetToStart: 'Сделайте ставку чтобы начать игру',
    choose: 'Выбрать',
    dailyStats: 'Статистика дня',
    gamesPlayed: 'Игр сегодня',
    adsWatched: 'Реклам просмотрено',
    balance: 'Баланс',
    totalGames: 'Всего игр', // ✅ ДОБАВЛЕНО
    close: 'Закрыть', // ✅ ДОБАВЛЕНО
    autoHiding: 'Автоматически скроется через 3 секунды...', // ✅ ДОБАВЛЕНО
    rtpInfo: 'Шанс выигрыша: 33%',
    limitInfo: 'Лимит: 250 игр/день (25 + 10 реклам × 20)',
    gameStates: {
      waiting: 'Сделайте ставку чтобы начать игру',
      shuffling: 'Тарелки перемешиваются...',
      choosing: 'Выберите тарелку с галактикой!',
      revealing: 'Открываем результат...'
    },
    errors: {
      betRange: 'Ставка должна быть от {min} до {max} CCC',
      insufficientFunds: 'Недостаточно средств',
      dailyLimit: 'Дневной лимит игр исчерпан',
      gameNotFound: 'Игра не найдена',
      gameCompleted: 'Игра уже завершена',
      adLimit: 'Дневной лимит рекламы исчерпан',
      createGame: 'Ошибка создания игры',
      makeChoice: 'Ошибка выбора',
      watchAd: 'Ошибка просмотра рекламы'
    },
    notifications: {
      winMessage: '🎉 Выигрыш {amount} CCC! (+{profit})',
      lossMessage: '💀 Проигрыш! Черная дыра поглотила {amount} CCC',
      extraGameReceived: 'Получена дополнительная игра!',
      confirmBigBet: 'Вы ставите более 10% от баланса! Уверены?'
    }
  },
  en: {
    title: 'Cosmic Shells',
    subtitle: 'Find the galaxy among black holes',
    howToPlay: 'How to Play',
    rule1: 'Place your bet and choose a shell',
    rule2: 'Find the galaxy among black holes',
    rule3: 'Win chance 33% (1 out of 3)',
    rule4: 'Win x2 of your bet',
    rule5: 'Watch ads for extra games',
    placeBet: 'Place Your Bet',
    betAmount: 'Bet Amount (CCC):',
    possibleWin: 'Possible Win:',
    startGame: 'Start Game',
    newGame: 'New Game',
    backToGames: 'Back to Games',
    lastGames: 'Recent Games',
    fullHistory: 'Full History',
    time: 'Time',
    bet: 'Bet',
    result: 'Result',
    outcome: 'Outcome',
    win: 'Win',
    loss: 'Loss',
    profit: 'Profit',
    multiplier: 'Multiplier',
    gamesLeft: 'Games Left',
    loading: 'Loading...',
    shuffling: 'Shells shuffling...',
    chooseShell: 'Choose the shell with galaxy!',
    revealing: 'Revealing result...',
    extraGame: '+1 game',
    watching: 'Watching...',
    min: 'Minimum',
    max: 'Maximum',
    lost: 'Lost',
    emptyHistory: 'Game history is empty',
    makeBetToStart: 'Place bet to start game',
    choose: 'Choose',
    dailyStats: 'Daily Statistics',
    gamesPlayed: 'Games Today',
    adsWatched: 'Ads Watched',
    balance: 'Balance',
    totalGames: 'Total Games', // ✅ ДОБАВЛЕНО
    close: 'Close', // ✅ ДОБАВЛЕНО
    autoHiding: 'Auto-hiding in 3 seconds...', // ✅ ДОБАВЛЕНО
    rtpInfo: 'Win chance: 33%',
    limitInfo: 'Limit: 250 games/day (25 + 10 ads × 20)',
    gameStates: {
      waiting: 'Place bet to start game',
      shuffling: 'Shells shuffling...',
      choosing: 'Choose the shell with galaxy!',
      revealing: 'Revealing result...'
    },
    errors: {
      betRange: 'Bet must be between {min} and {max} CCC',
      insufficientFunds: 'Insufficient funds',
      dailyLimit: 'Daily game limit exceeded',
      gameNotFound: 'Game not found',
      gameCompleted: 'Game already completed',
      adLimit: 'Daily ad limit exceeded',
      createGame: 'Game creation error',
      makeChoice: 'Choice error',
      watchAd: 'Ad watching error'
    },
    notifications: {
      winMessage: '🎉 Win {amount} CCC! (+{profit})',
      lossMessage: '💀 Loss! Black hole consumed {amount} CCC',
      extraGameReceived: 'Extra game received!',
      confirmBigBet: 'You are betting more than 10% of balance! Are you sure?'
    }
  }
};

// ✅ ИСПРАВЛЕНО: Правильный fallback на английский для неизвестных языков
export const getTranslation = (language: string): CosmicShellsTranslations => {
  // Сначала проверяем точное совпадение
  if (translations[language]) {
    return translations[language];
  }
  
  // Затем проверяем начало языка (например, "en-US" -> "en")
  const languageCode = language.split('-')[0];
  if (translations[languageCode]) {
    return translations[languageCode];
  }
  
  // Fallback на английский вместо русского
  return translations.en;
};