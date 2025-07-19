// src/pages/games/tapper/locales/index.ts

const translations = {
    ru: {
      games: {
        tapper: {
          title: "Астероидный Разрушитель",
          description: "Разрушайте астероиды и получайте CCC!",
          energy: "Энергия",
          perTap: "За тап",
          tapAsteroid: "Тапайте по астероиду для получения CCC",
          energyEmpty: "Энергия закончилась!",
          energyRestore: "Энергия восстанавливается автоматически (1 в 43 сек)",
          restoreTime: "Восстановление через",
          adsToday: "Реклам сегодня",
          watchAd: "Смотреть рекламу",
          adLimitReached: "Лимит рекламы достигнут",
          collectEarnings: "Собрать заработок",
          collectAccumulated: "Собирайте накопленные CCC кнопкой 'Собрать'",
          nothingToCollect: "Нечего собирать",
          collected: "Собрано",
          howToPlay: "Как играть",
          energyRestores: "Энергия восстанавливается со временем (1 за 43 сек)",
          watchAdForEnergy: "Смотрите рекламу для получения +100 энергии",
          limits: "Лимит: 20 реклам в день",
          maxEnergy: "Максимум энергии",
          tapToDestroy: "Тапайте по астероиду!"
        },
        backToGames: "Назад к играм"
      },
      loading: "Загрузка...",
      error: "Ошибка",
      errors: {
        connectionError: "Ошибка подключения к серверу",
        adError: "Ошибка показа рекламы",
        adServiceUnavailable: "Рекламный сервис недоступен"
      },
      notifications: {
        energyReceived: "Получено энергии",
        testMode: "[Тест]",
        partnerMode: "[Партнер]",
        adMode: "[Реклама]"
      }
    },
    en: {
      games: {
        tapper: {
          title: "Asteroid Destroyer",
          description: "Destroy asteroids and earn CCC!",
          energy: "Energy",
          perTap: "Per tap",
          tapAsteroid: "Tap the asteroid to earn CCC",
          energyEmpty: "Energy depleted!",
          energyRestore: "Energy restores automatically (1 per 43 sec)",
          restoreTime: "Restore in",
          adsToday: "Ads today",
          watchAd: "Watch Ad",
          adLimitReached: "Ad limit reached",
          collectEarnings: "Collect Earnings",
          collectAccumulated: "Collect accumulated CCC with 'Collect' button",
          nothingToCollect: "Nothing to collect",
          collected: "Collected",
          howToPlay: "How to Play",
          energyRestores: "Energy restores over time (1 per 43 sec)",
          watchAdForEnergy: "Watch ads to get +100 energy",
          limits: "Limit: 20 ads per day",
          maxEnergy: "Maximum energy",
          tapToDestroy: "Tap the asteroid!"
        },
        backToGames: "Back to Games"
      },
      loading: "Loading...",
      error: "Error",
      errors: {
        connectionError: "Server connection error",
        adError: "Ad display error",
        adServiceUnavailable: "Ad service unavailable"
      },
      notifications: {
        energyReceived: "Energy received",
        testMode: "[Test]",
        partnerMode: "[Partner]",
        adMode: "[Ad]"
      }
    }
  };
  
  export const getTranslation = (language: string) => {
    if (translations[language as keyof typeof translations]) {
      return translations[language as keyof typeof translations];
    }
    
    const languageCode = language.split('-')[0];
    if (translations[languageCode as keyof typeof translations]) {
      return translations[languageCode as keyof typeof translations];
    }
    
    return translations.en;
  };
  
  // Экспорт типов для TypeScript
  export type TapperTranslations = typeof translations.en;