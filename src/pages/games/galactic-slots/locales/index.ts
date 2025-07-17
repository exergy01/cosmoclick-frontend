// galactic-slots/locales/index.ts

export const getTranslation = (language: string) => {
    const translations: any = {
      ru: {
        title: 'GALACTIC FORTUNE',
        subtitle: 'Космические слоты',
        placeBet: 'Сделать ставку',
        betAmount: 'Ставка',
        spin: 'СПИН',
        autoSpin: 'АВТОСПИН',
        stopAutoSpin: 'СТОП',
        gamesLeft: 'Игр осталось',
        extraGame: 'Дополнительная игра',
        watching: 'Смотрим рекламу',
        backToGames: 'К играм',
        loading: 'Загрузка...',
        lastGames: 'Последние игры',
        fullHistory: 'Вся история',
        time: 'Время',
        bet: 'Ставка',
        result: 'Результат',
        outcome: 'Итог',
        win: 'Выигрыш',
        loss: 'Проигрыш',
        profit: 'Прибыль',
        min: 'Минимум',
        max: 'Максимум',
        possibleWin: 'Максимальный выигрыш',
        dailyStats: 'Статистика игры',
        gamesPlayed: 'Игр сегодня',
        gamesRemaining: 'Игр осталось',
        adsWatched: 'Реклам',
        balance: 'Баланс',
        rtpInfo: 'RTP: ~75%',
        autoSpinInfo: 'Автоспин: до 100 спинов',
        limitInfo: 'Лимит: 250 игр/день',
        payoutTable: 'Таблица выплат',
        spinningReels: 'Барабаны вращаются...',
        nextSpin: 'Следующий спин',
        ready: 'готов',
        waiting: 'ожидание...',
        autoSpinActive: 'Автоспин активен',
        spinsCount: 'спинов',
        gameStates: {
          waiting: 'Готов к игре',
          spinning: 'Вращение барабанов...',
          revealing: 'Показ результата...',
          finished: 'Игра завершена'
        },
        errors: {
          betTooLow: 'Минимальная ставка 100 CCC',
          betTooHigh: 'Максимальная ставка 5,000 CCC',
          insufficientFunds: 'Недостаточно средств',
          dailyLimit: 'Лимит игр исчерпан',
          spinError: 'Ошибка спина',
          connectionError: 'Ошибка подключения к серверу',
          adError: 'Ошибка показа рекламы',
          adServiceUnavailable: 'Рекламный сервис недоступен'
        },
        notifications: {
          winMessage: 'Выигрыш!',
          bigWinMessage: 'Большой выигрыш!',
          excellentWinMessage: 'ОТЛИЧНЫЙ ВЫИГРЫШ',
          goodWinMessage: 'ХОРОШИЙ ВЫИГРЫШ',
          lossMessage: 'Проигрыш',
          extraGameReceived: 'Дополнительная игра получена!',
          autoSpinCompleted: 'Автоспин завершен! Выполнено 100 спинов',
          autoSpinStopped: 'Автоспин остановлен! Выполнено {count} спинов',
          gamesEnded: 'Игры закончились, автоспин остановлен',
          insufficientBalance: 'Недостаточно средств ({balance} < {bet})',
          testMode: '[Тест]',
          partnerMode: '[Партнер]',
          adMode: '[Реклама]'
        },
        symbols: {
          wild: 'Квазар (WILD)',
          ship: 'Корабль',
          galaxy: 'Галактика',
          star: 'Звезда',
          planet: 'Планета',
          asteroid: 'Астероид',
          blackhole: 'Черная дыра',
          wildDescription: 'удваивает выигрыш',
          blocksPaylines: 'БЛОКИРУЕТ линии выплат',
          multipliers: 'Коэффициенты для 3/4/5 символов в ряд',
          activePaylines: 'активных линий выплат',
          fixedRtp: 'ИСПРАВЛЕНО: 25% шанс выигрыша, RTP ~75%',
          dailyLimit: 'Лимит: 50 игр + 200 за рекламу = 250 игр/день'
        },
        winMessages: {
          excellentWin: 'ОТЛИЧНЫЙ ВЫИГРЫШ: {amount} CCC!',
          goodWin: 'ХОРОШИЙ ВЫИГРЫШ: {amount} CCC!',
          regularWin: 'Выигрыш: {amount} CCC!',
          loss: 'Удачи в следующий раз!'
        },
        winningLines: {
          title: 'Выигрышные линии:',
          line: 'Линия',
          totalWin: 'Общий выигрыш',
          wild: 'WILD x2'
        }
      },
      en: {
        title: 'GALACTIC FORTUNE',
        subtitle: 'Cosmic Slots',
        placeBet: 'Place Bet',
        betAmount: 'Bet Amount',
        spin: 'SPIN',
        autoSpin: 'AUTO SPIN',
        stopAutoSpin: 'STOP',
        gamesLeft: 'Games Left',
        extraGame: 'Extra Game',
        watching: 'Watching Ad',
        backToGames: 'Back to Games',
        loading: 'Loading...',
        lastGames: 'Recent Games',
        fullHistory: 'Full History',
        time: 'Time',
        bet: 'Bet',
        result: 'Result',
        outcome: 'Outcome',
        win: 'Win',
        loss: 'Loss',
        profit: 'Profit',
        min: 'Minimum',
        max: 'Maximum',
        possibleWin: 'Maximum Win',
        dailyStats: 'Game Statistics',
        gamesPlayed: 'Games Today',
        gamesRemaining: 'Games Left',
        adsWatched: 'Ads Watched',
        balance: 'Balance',
        rtpInfo: 'RTP: ~75%',
        autoSpinInfo: 'Auto Spin: up to 100 spins',
        limitInfo: 'Limit: 250 games/day',
        payoutTable: 'Payout Table',
        spinningReels: 'Spinning Reels...',
        nextSpin: 'Next Spin',
        ready: 'ready',
        waiting: 'waiting...',
        autoSpinActive: 'Auto Spin Active',
        spinsCount: 'spins',
        gameStates: {
          waiting: 'Ready to Play',
          spinning: 'Spinning Reels...',
          revealing: 'Showing Result...',
          finished: 'Game Completed'
        },
        errors: {
          betTooLow: 'Minimum bet 100 CCC',
          betTooHigh: 'Maximum bet 5,000 CCC',
          insufficientFunds: 'Insufficient funds',
          dailyLimit: 'Daily limit exceeded',
          spinError: 'Spin error',
          connectionError: 'Server connection error',
          adError: 'Ad display error',
          adServiceUnavailable: 'Ad service unavailable'
        },
        notifications: {
          winMessage: 'Win!',
          bigWinMessage: 'Big Win!',
          excellentWinMessage: 'EXCELLENT WIN',
          goodWinMessage: 'GOOD WIN',
          lossMessage: 'Loss',
          extraGameReceived: 'Extra game received!',
          autoSpinCompleted: 'Auto spin completed! 100 spins done',
          autoSpinStopped: 'Auto spin stopped! {count} spins completed',
          gamesEnded: 'Games ended, auto spin stopped',
          insufficientBalance: 'Insufficient funds ({balance} < {bet})',
          testMode: '[Test]',
          partnerMode: '[Partner]',
          adMode: '[Ad]'
        },
        symbols: {
          wild: 'Quasar (WILD)',
          ship: 'Spaceship',
          galaxy: 'Galaxy',
          star: 'Star',
          planet: 'Planet',
          asteroid: 'Asteroid',
          blackhole: 'Black Hole',
          wildDescription: 'doubles win',
          blocksPaylines: 'BLOCKS paylines',
          multipliers: 'Multipliers for 3/4/5 symbols in a row',
          activePaylines: 'active paylines',
          fixedRtp: 'FIXED: 25% win chance, RTP ~75%',
          dailyLimit: 'Limit: 50 games + 200 for ads = 250 games/day'
        },
        winMessages: {
          excellentWin: 'EXCELLENT WIN: {amount} CCC!',
          goodWin: 'GOOD WIN: {amount} CCC!',
          regularWin: 'Win: {amount} CCC!',
          loss: 'Good luck next time!'
        },
        winningLines: {
          title: 'Winning Lines:',
          line: 'Line',
          totalWin: 'Total Win',
          wild: 'WILD x2'
        }
      }
    };
  
    if (translations[language]) {
      return translations[language];
    }
    
    const languageCode = language.split('-')[0];
    if (translations[languageCode]) {
      return translations[languageCode];
    }
    
    return translations.en;
  };