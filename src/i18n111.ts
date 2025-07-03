// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 🎯 Функция для генерации названий предметов
const generateItemNames = (lang: 'en' | 'ru') => {
  const asteroidNames = {
    en: {
      1: ['Iron Chunk', 'Nickel Ore', 'Copper Vein', 'Silver Rock', 'Gold Nugget', 'Platinum Core', 'Diamond Heart', 'Titanium Cluster', 'Rare Metal Core', 'Crystal Formation', 'Exotic Matter', 'Quantum Crystal'],
      2: ['Cosmic Dust', 'Stellar Fragment', 'Nebula Stone', 'Star Core', 'Plasma Crystal', 'Energy Matrix', 'Void Shard', 'Dark Matter', 'Antimatter Pod', 'Singularity Core', 'Reality Fragment', 'Universe Heart'],
    },
    ru: {
      1: ['Железная Глыба', 'Никелевая Руда', 'Медная Жила', 'Серебряный Камень', 'Золотой Самородок', 'Платиновое Ядро', 'Алмазное Сердце', 'Титановый Кластер', 'Ядро Редких Металлов', 'Кристальное Образование', 'Экзотическая Материя', 'Квантовый Кристалл'],
      2: ['Космическая Пыль', 'Звездный Фрагмент', 'Туманный Камень', 'Звездное Ядро', 'Плазменный Кристалл', 'Энергетическая Матрица', 'Осколок Пустоты', 'Темная Материя', 'Капсула Антиматерии', 'Ядро Сингулярности', 'Фрагмент Реальности', 'Сердце Вселенной'],
    }
  };

  const droneNames = {
    en: {
      1: ['Scout Drone', 'Worker Drone', 'Miner Drone', 'Advanced Miner', 'Heavy Miner', 'Elite Miner', 'Quantum Miner', 'Nano Swarm', 'AI Collector', 'Plasma Extractor', 'Reality Harvester', 'Void Reaper', 'Time Manipulator', 'Space Bender', 'Universe Devourer'],
      2: ['Stellar Scout', 'Cosmic Worker', 'Nebula Miner', 'Star Harvester', 'Plasma Collector', 'Energy Siphon', 'Void Walker', 'Dark Extractor', 'Antimatter Engine', 'Singularity Hunter', 'Reality Shaper', 'Cosmos Eater', 'Dimension Ripper', 'Multiverse Seeker', 'Infinity Engine'],
    },
    ru: {
      1: ['Дрон-Разведчик', 'Рабочий Дрон', 'Шахтерский Дрон', 'Продвинутый Шахтер', 'Тяжелый Шахтер', 'Элитный Шахтер', 'Квантовый Шахтер', 'Нано-Рой', 'ИИ-Сборщик', 'Плазменный Экстрактор', 'Жнец Реальности', 'Пожиратель Пустоты', 'Манипулятор Времени', 'Искриватель Пространства', 'Пожиратель Вселенных'],
      2: ['Звездный Разведчик', 'Космический Работник', 'Туманный Шахтер', 'Звездный Жнец', 'Плазменный Сборщик', 'Энергетический Сифон', 'Ходок Пустоты', 'Темный Экстрактор', 'Антиматерийный Двигатель', 'Охотник Сингулярностей', 'Формировщик Реальности', 'Пожиратель Космоса', 'Разрыватель Измерений', 'Искатель Мультивселенной', 'Двигатель Бесконечности'],
    }
  };

  const cargoNames = {
    en: {
      1: ['Small Container', 'Storage Bay', 'Cargo Hold', 'Mega Warehouse', 'Infinite Vault'],
      2: ['Stellar Pod', 'Cosmic Bay', 'Nebula Storage', 'Galactic Warehouse', 'Universal Vault'],
    },
    ru: {
      1: ['Малый Контейнер', 'Складской Отсек', 'Грузовой Трюм', 'Мега-Склад', 'Бесконечное Хранилище'],
      2: ['Звездная Капсула', 'Космический Отсек', 'Туманное Хранилище', 'Галактический Склад', 'Универсальное Хранилище'],
    }
  };

  const items: any = {};

  // Генерируем астероиды
  Object.entries(asteroidNames[lang]).forEach(([system, names]) => {
    names.forEach((name, index) => {
      items[`shop_asteroid_${system}_${index + 1}`] = name;
    });
  });

  // Генерируем дронов
  Object.entries(droneNames[lang]).forEach(([system, names]) => {
    names.forEach((name, index) => {
      items[`shop_drone_${system}_${index + 1}`] = name;
    });
  });

  // Генерируем карго
  Object.entries(cargoNames[lang]).forEach(([system, names]) => {
    names.forEach((name, index) => {
      items[`shop_cargo_${system}_${index + 1}`] = name;
    });
  });

  return items;
};

const resources = {
  en: {
    translation: {
      // Основные валюты
      ccc: 'CCC',
      cs: 'CS',
      ton: 'TON',
      per_hour: 'Per hour: {{amount}}',
      
      // Ошибки
      no_telegram_id: 'No Telegram ID found',
      failed_to_fetch_player: 'Failed to fetch player data',
      failed_to_fetch_data: 'Failed to fetch initial data',
      failed_to_complete_quest: 'Failed to complete quest',
      failed_to_buy_exchange: 'Failed to buy exchange',
      failed_to_collect: 'Failed to collect: {{error}}',
      failed_to_generate_referral_link: 'Failed to generate referral link',
      failed_to_fetch_referral_stats: 'Failed to fetch referral stats',
      failed_to_convert_currency: 'Failed to convert currency',
      failed_to_buy_asteroid: 'Failed to buy asteroid',
      failed_to_buy_drone: 'Failed to buy drone',
      failed_to_buy_cargo: 'Failed to buy cargo',
      failed_to_buy_system: 'Failed to buy system',
      
      // Навигация
      resources: 'Resources',
      drones: 'Drones',
      cargo: 'Cargo',
      attack: 'Attack',
      exchange: 'Exchange',
      quests: 'Quests',
      games: 'Games',
      wallet: 'Wallet',
      main: 'Main',
      referrals: 'Referrals',
      alphabet: 'Alphabet',
      
      // Квесты
      quest_1: 'Complete first task',
      quest_2: 'Invite a friend',
      quest_3: 'Reach 100 CCC',
      watch_ad: 'Watch advertisement',
      reward: 'Reward',
      completed: 'Completed',
      in_progress: 'In Progress',
      watch: 'Watch',
      ad_watched: 'Ad watched successfully',
      ad_error: 'Error watching ad: {{error}}',
      
      // Магазин
      capacity: 'Capacity',
      ccc_per_day: 'CCC per day',
      total_ccc: 'Total CCC',
      price: 'Price',
      purchased: 'Purchased',
      buy: 'Buy',
      purchase_success: 'Purchase successful',
      purchase_error: 'Purchase error: {{error}}',
      processing_purchase: 'Processing purchase...',
      buy_previous: 'Buy previous first',
      maximum: 'Maximum',
      infinite_capacity: 'Infinite Capacity',
      
      // Общие
      no_description: 'No description',
      withdraw_ton: 'Withdraw TON',
      welcome_player: 'Greetings\n{{username}}\nin CosmoClick!',
      loading: 'Loading',
      select_language: 'Select Language',
      language: 'Language',
      
      // Информация
      rules: 'Rules',
      rules_text: 'Game rules will be provided soon.',
      guide: 'Guide',
      guide_text: 'Game guide will be provided soon.',
      lore: 'Lore',
      lore_text: 'Game lore will be provided soon.',
      roadmap: 'Roadmap',
      roadmap_text: 'Game roadmap will be provided soon.',
      about: 'About CosmoClick',
      about_text: 'CosmoClick is a space economic strategy with idle gameplay elements. As a commander of a space station, you mine resources, upgrade equipment, explore star systems, and earn in-game currency that can be exchanged for real money. All this — right in Telegram!',
      mechanics: 'Main Mechanics',
      mechanics_text: 'Star Systems: Several systems, each with its own drones, asteroids, and economy. Progress is separate.\nDrones automatically mine CCC, CS, and even TON, which can be purchased and upgraded.\nAsteroids are a resource source. They require purchase and are mined by drones.\nCargo limits resource volume. Level 5 enables auto-collection.\nCCC is the main currency. CS is used for upgrades and purchases, via exchange or quests. TON is a rare reward in later systems.\nExchange converts CCC ⇄ CS with a rate and fee.\nDaily quests provide CCC, boosts, and resources. One-time quests reward CS.\nMini-games range from timers to PvP.\nTelegram WebApp requires no installation.',
      
      // Системы
      system: 'System',
      system_1: 'Andromeda',
      system_2: 'Orion',
      system_3: 'Milky Way',
      system_4: 'Orion Nebula',
      system_5: 'Crab Nebula',
      system_6: 'Sombrero',
      system_7: 'Eagle Nebula',
      
      // Термины
      asteroid: 'Asteroid',
      color: 'Color',
      buy_system: 'Buy system {{name}} for {{price}} {{currency}}',
      yes: 'Yes',
      no: 'No',
      not_enough_currency: 'You don\'t have enough {{currency}}. You need {{amount}} more.',
      invalid_price: 'Please enter a valid positive TON amount.',
      enter_ton_amount: 'Enter TON amount',
      
      // 🎯 Автогенерируемые названия предметов
      ...generateItemNames('en'),
    },
  },
  ru: {
    translation: {
      // Основные валюты
      ccc: 'CCC',
      cs: 'CS',
      ton: 'TON',
      per_hour: 'В час: {{amount}}',
      
      // Ошибки
      no_telegram_id: 'ID Telegram не найден',
      failed_to_fetch_player: 'Не удалось загрузить данные игрока',
      failed_to_fetch_data: 'Не удалось загрузить данные',
      failed_to_complete_quest: 'Не удалось выполнить задание',
      failed_to_buy_exchange: 'Не удалось купить обмен',
      failed_to_collect: 'Не удалось собрать: {{error}}',
      failed_to_generate_referral_link: 'Не удалось создать реферальную ссылку',
      failed_to_fetch_referral_stats: 'Не удалось загрузить статистику рефералов',
      failed_to_convert_currency: 'Не удалось конвертировать валюту',
      failed_to_buy_asteroid: 'Не удалось купить астероид',
      failed_to_buy_drone: 'Не удалось купить дрон',
      failed_to_buy_cargo: 'Не удалось купить карго',
      failed_to_buy_system: 'Не удалось купить систему',
      
      // Навигация
      resources: 'Ресурсы',
      drones: 'Дроны',
      cargo: 'Карго',
      attack: 'Атака',
      exchange: 'Обмен',
      quests: 'Задания',
      games: 'Игры',
      wallet: 'Кошелёк',
      main: 'Главная',
      referrals: 'Рефералы',
      alphabet: 'Алфавит',
      
      // Квесты
      quest_1: 'Выполнить первое задание',
      quest_2: 'Пригласить друга',
      quest_3: 'Накопить 100 CCC',
      watch_ad: 'Посмотреть рекламу',
      reward: 'Награда',
      completed: 'Выполнено',
      in_progress: 'В процессе',
      watch: 'Смотреть',
      ad_watched: 'Реклама просмотрена',
      ad_error: 'Ошибка просмотра рекламы: {{error}}',
      
      // Магазин
      capacity: 'Объем',
      ccc_per_day: 'CCC в день',
      total_ccc: 'Общий CCC',
      price: 'Цена',
      purchased: 'Куплено',
      buy: 'Купить',
      purchase_success: 'Покупка успешна',
      purchase_error: 'Ошибка покупки: {{error}}',
      processing_purchase: 'Обработка покупки...',
      buy_previous: 'Купите предыдущий',
      maximum: 'Максимум',
      infinite_capacity: 'Бесконечная Вместимость',
      
      // Общие
      no_description: 'Нет описания',
      withdraw_ton: 'Вывести TON',
      welcome_player: 'Приветствую тебя\n{{username}}\nв игре КосмоКлик!',
      loading: 'Загрузка',
      select_language: 'Выберите язык',
      language: 'Язык',
      
      // Информация
      rules: 'Правила',
      rules_text: 'Правила игры будут предоставлены позже.',
      guide: 'Руководство',
      guide_text: 'Руководство по игре будет предоставлено позже.',
      lore: 'История',
      lore_text: 'История игры будет предоставлена позже.',
      roadmap: 'Дорожная карта',
      roadmap_text: 'Дорожная карта игры будет предоставлена позже.',
      about: 'О чём игра CosmoClick',
      about_text: 'CosmoClick — это космическая экономическая стратегия с элементами idle-геймплея. В роли командира космической станции ты добываешь ресурсы, прокачиваешь оборудование, исследуешь звёздные системы и зарабатываешь внутриигровую валюту, которую можешь обменять на реальные деньги. Всё это — прямо в Telegram!',
      mechanics: 'Основные механики',
      mechanics_text: 'Звёздные системы: Несколько систем, в каждой — свои дроны, астероиды, экономика. Прогресс — отдельно.\nДроны автоматически добывают CCC, CS и даже TON, можно покупать и улучшать.\nАстероиды источник ресурсов. Требуют покупки. Разрабатываются дронами.\nКарго ограничивает объём ресурсов. 5 уровень — автосбор.\nCCC основная валюта. CS валюта для прокачки и покупок, через обмен или задания. TON редкая награда в поздних системах.\nОбмен конвертация CCC ⇄ CS с курсом и комиссией.\nЗадания ежедневные, которые дают ССС, ускорения, ресурсы. Разовые - приносят игроку CS.\nМини-игры от таймеров до PvP.\nWebApp Telegram не требует установки.',
      
      // Системы
      system: 'Система',
      system_1: 'Андромеда',
      system_2: 'Орион',
      system_3: 'Млечный Путь',
      system_4: 'Туманность Ориона',
      system_5: 'Крабовидная Туманность',
      system_6: 'Сомбреро',
      system_7: 'Туманность Орла',
      
      // Термины
      asteroid: 'Астероид',
      color: 'Цвет',
      buy_system: 'Купить систему {{name}} за {{price}} {{currency}}',
      yes: 'Да',
      no: 'Нет',
      not_enough_currency: 'У вас недостаточно {{currency}}. Нужно еще {{amount}}.',
      invalid_price: 'Пожалуйста, введите корректное положительное число TON.',
      enter_ton_amount: 'Введите количество TON',
      
      // 🎯 Автогенерируемые названия предметов
      ...generateItemNames('ru'),
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'ru', // Русский по умолчанию
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;