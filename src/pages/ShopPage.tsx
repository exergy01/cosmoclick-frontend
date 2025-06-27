import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useGame } from '../context/GameContext';
import { useShop } from '../context/ShopContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';
import SystemUnlockModal from '../components/SystemUnlockModal';

// Импортируем новый счетчик
import { useCleanCounter } from '../hooks/useCleanCounter';

interface Item {
  id: number;
  system: number;
  price?: number;
  cccPerDay?: number;
  csPerDay?: number;
  totalCcc?: number;
  totalCs?: number;
  capacity?: number;
  name?: string;
  isPurchased?: boolean;
  isPreviousPurchased?: boolean;
}

interface ShopButton {
  type: string;
  count: string;
  amount?: string;
}

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const ShopPage: React.FC = () => {
  const { t } = useTranslation();
  const { player } = useNewPlayer();
  const { 
    currentSystem, 
    setCurrentSystem,
    totalPerHour,
    asteroidTotal,
    remaining
  } = useGame();
  
  const {
    buyAsteroid,
    buyDrone,
    buyCargo,
    loading,
    error,
  } = useShop();

  // Новый чистый счетчик
  const {
    resetCleanCounter,
    resetForNewAsteroid,
    hasFullSetup,
  } = useCleanCounter({ player, currentSystem });

  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>('asteroid');
  const [shopItems, setShopItems] = useState<{ asteroids: Item[]; drones: Item[]; cargo: Item[] }>({
    asteroids: [],
    drones: [],
    cargo: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔥 НОВЫЕ СОСТОЯНИЯ для выбора системы
  const [showSystemDropdown, setShowSystemDropdown] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [targetSystem, setTargetSystem] = useState<number | null>(null);

  // Установка активной вкладки из location state
  useEffect(() => {
    const stateTab = (location.state as { tab?: string })?.tab;
    if (stateTab) setActiveTab(stateTab);
  }, [location.state]);

  // 🔥 ОБРАБОТЧИКИ для смены системы
  const handleSystemChange = (systemId: number) => {
    if (!player) return;
    
    if (player.unlocked_systems?.includes(systemId)) {
      setCurrentSystem(systemId);
      setShowSystemDropdown(false);
    } else {
      setTargetSystem(systemId);
      setShowUnlockModal(true);
      setShowSystemDropdown(false);
    }
  };

  const handleUnlockSuccess = () => {
    setShowUnlockModal(false);
    if (targetSystem) {
      setCurrentSystem(targetSystem);
      setTargetSystem(null);
    }
  };

  const handleUnlockCancel = () => {
    setShowUnlockModal(false);
    setTargetSystem(null);
    if (player?.unlocked_systems && player.unlocked_systems.length > 0) {
      const lastUnlocked = Math.max(...player.unlocked_systems);
      setCurrentSystem(lastUnlocked);
    }
  };

  // Загрузка товаров магазина
  const fetchShopItems = useCallback(async () => {
    if (!player) return;
    
    try {
      const [asteroids, drones, cargo] = await Promise.all([
        axios.get(`${API_URL}/api/shop/asteroids`).then(res => res.data),
        axios.get(`${API_URL}/api/shop/drones`).then(res => res.data),
        axios.get(`${API_URL}/api/shop/cargo`).then(res => res.data)
      ]);
      
      setShopItems({
        asteroids: asteroids
          .filter((item: Item) => item.system === currentSystem)
          .map((item: Item) => {
            const isPurchased = player?.asteroids.some((a: any) => a.id === item.id && a.system === item.system) || false;
            const isPreviousPurchased = item.id === 1 || player?.asteroids.some((a: any) => a.id === item.id - 1 && a.system === item.system) || false;
            return { ...item, isPurchased, isPreviousPurchased };
          }),
        drones: drones
          .filter((item: Item) => item.system === currentSystem)
          .map((item: Item) => {
            const isPurchased = player?.drones.some((d: any) => d.id === item.id && d.system === item.system) || false;
            const isPreviousPurchased = item.id === 1 || player?.drones.some((d: any) => d.id === item.id - 1 && d.system === item.system) || false;
            return { ...item, isPurchased, isPreviousPurchased };
          }),
        cargo: cargo
          .filter((item: Item) => item.system === currentSystem)
          .map((item: Item) => ({
            ...item,
            isPurchased: player?.cargo_levels.some((c: any) => c.id === item.id && c.system === item.system) || false,
            isPreviousPurchased: item.id === 1 || player?.cargo_levels.some((c: any) => c.id === item.id - 1 && c.system === item.system) || false,
          })),
      });
    } catch (err) {
      console.error('Error fetching shop items:', err);
    }
  }, [player, currentSystem]);

  useEffect(() => {
    if (player) {
      fetchShopItems();
    }
  }, [fetchShopItems]);

// Функция покупки с улучшенной обработкой ошибок
const buyItem = async (type: string, id: number, price: number) => {
  if (!player?.telegram_id) {
    console.error('No telegram_id found for player');
    return;
  }
  
  if (isLoading) return;
  
  // 🔥 ПРОВЕРКА БАЛАНСА ПЕРЕД ПОКУПКОЙ
  const currencyToCheck = currentSystem >= 1 && currentSystem <= 4 ? 'cs' : 
                         currentSystem >= 5 && currentSystem <= 5 ? 'ton' : 'ccc';
  
  let currentBalance = 0;
  let currencyName = '';
  
  if (currencyToCheck === 'cs') {
    currentBalance = parseFloat(player.cs?.toString() || '0');
    currencyName = 'CS';
  } else if (currencyToCheck === 'ton') {
    currentBalance = parseFloat(player.ton?.toString() || '0');
    currencyName = 'TON';
  } else {
    currentBalance = parseFloat(player.ccc?.toString() || '0');
    currencyName = 'CCC';
  }
  
  if (currentBalance < price) {
    const itemName = getItemName(type === 'drones' ? 'drone' : type, id, currentSystem);
    const message = `💰 Недостаточно средств!\n\n` +
          `🛒 Товар: ${itemName}\n` +
          `🌌 Система: ${currentSystem}\n` +
          `💎 Цена: ${price} ${currencyName}\n` +
          `💰 У вас: ${currentBalance.toFixed(2)} ${currencyName}\n` +
          `❌ Не хватает: ${(price - currentBalance).toFixed(2)} ${currencyName}\n\n` +
          `💡 Соберите больше ресурсов или обменяйте валюту!`;
    
    // 🔥 ПРОСТОЕ УВЕДОМЛЕНИЕ
    alert(message);
    return;
  }
  
  setIsLoading(true);
  
  try {
    // Покупка товара через новые контексты
    if (type === 'asteroid') {
      await buyAsteroid(id, price, currentSystem);
      // 🔥 СПЕЦИАЛЬНЫЙ СБРОС для астероидов
      resetForNewAsteroid(currentSystem);
    } else if (type === 'drones') {
      await buyDrone(id, price, currentSystem);
      
      // 🎉 ПРОВЕРЯЕМ ДОСТИЖЕНИЕ 15 ДРОНОВ (ДЛЯ СИСТЕМ 1-4)
      if (player.drones && currentSystem >= 1 && currentSystem <= 4) {
        const systemDrones = player.drones.filter((d: any) => d.system === currentSystem);
        const newDroneCount = systemDrones.length + 1; // +1 за только что купленный
        
        if (newDroneCount === 15) {
          const achievementMessage = `🎉 СКРЫТОЕ ЗАДАНИЕ ВЫПОЛНЕНО! 🎉\n\nВы собрали полную коллекцию дронов в системе ${currentSystem}!\n\n🚀 Бонус: +1% к скорости добычи!\n\nТеперь ваши дроны работают еще эффективнее!`;
          
          // 🔥 ПРОСТОЕ УВЕДОМЛЕНИЕ
          alert(achievementMessage);
        }
      }
      
      // Обычный сброс для дронов
      resetCleanCounter(currentSystem);
    } else if (type === 'cargo') {
      const cargoItem = shopItems.cargo.find((item: Item) => item.id === id && item.system === currentSystem);
      if (!cargoItem?.capacity) throw new Error('Invalid cargo capacity');
      const capacityValue = typeof cargoItem.capacity === 'string' ? parseFloat(cargoItem.capacity) : cargoItem.capacity;
      await buyCargo(id, price, capacityValue, currentSystem);
      // Обычный сброс для дронов и карго
      resetCleanCounter(currentSystem);
    }
    
    // 🎉 УСПЕШНАЯ ПОКУПКА
    const itemName = getItemName(type === 'drones' ? 'drone' : type, id, currentSystem);
    const successMessage = `✅ Покупка успешна!\n\n🛒 Куплено: ${itemName}\n🌌 Система: ${currentSystem}\n💰 Потрачено: ${price} ${currencyName}`;
    
    // 🔥 ПРОСТОЕ УВЕДОМЛЕНИЕ
    alert(successMessage);
    
    // Обновляем товары магазина
    await fetchShopItems();
    
  } catch (err: any) {
    console.error(`Failed to buy ${type}:`, err);
    
    // 🔥 УЛУЧШЕННАЯ ОБРАБОТКА ОШИБОК
    let errorMessage = '';
    const itemName = getItemName(type === 'drones' ? 'drone' : type, id, currentSystem);
    
    if (err.response?.data?.error) {
      const serverError = err.response.data.error;
      
      if (serverError.includes('Insufficient funds') || serverError.includes('Not enough')) {
        errorMessage = `💰 Недостаточно средств для покупки!\n\n🛒 Товар: ${itemName}\n🌌 Система: ${currentSystem}\n💎 Цена: ${price} ${currencyName}`;
      } else if (serverError.includes('already purchased')) {
        errorMessage = `⚠️ Товар уже куплен!\n\n🛒 ${itemName} уже есть в системе ${currentSystem}.`;
      } else if (serverError.includes('Player not found')) {
        errorMessage = `❌ Ошибка игрока!\n\nПопробуйте перезагрузить страницу.`;
      } else {
        errorMessage = `❌ Ошибка сервера!\n\n${serverError}`;
      }
    } else if (err.message) {
      errorMessage = `❌ Ошибка покупки!\n\n${err.message}`;
    } else {
      errorMessage = `❌ Неизвестная ошибка!\n\nПопробуйте еще раз или перезагрузите страницу.`;
    }
    
    // 🔥 ПРОСТОЕ УВЕДОМЛЕНИЕ ОБ ОШИБКЕ
    alert(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  // Функция для получения локализованного названия товара
  const getItemName = (type: string, id: number, system: number): string => {
    const key = `shop_${type}_${system}_${id}`;
    const translated = t(key);
    
    // Если перевод не найден, используем базовое название
    if (translated === key) {
      switch(type) {
        case 'asteroid':
          return `${t('asteroid')} #${id}`;
        case 'drone':
          return `${t('drones')} #${id}`;
        case 'cargo':
          return `${t('cargo')} #${id}`;
        default:
          return `${type} #${id}`;
      }
    }
    
    return translated;
  };

  // НОВАЯ ФУНКЦИЯ: получение значения ресурса в зависимости от системы
  const getResourceValue = (item: Item): number => {
    if (currentSystem === 4) {
      return item.totalCs || 0;
    } else {
      return item.totalCcc || 0;
    }
  };

  // НОВАЯ ФУНКЦИЯ: получение общего количества ресурсов в системе
  const getSystemAsteroidTotal = (): number => {
    if (!player) return 0;
    
    // Сначала проверяем asteroid_total_data
    if (player.asteroid_total_data && player.asteroid_total_data[currentSystem] !== undefined) {
      return player.asteroid_total_data[currentSystem];
    }
    
    // Если нет данных, считаем из астероидов
    return player.asteroids
      .filter((a: any) => a.system === currentSystem)
      .reduce((sum: number, a: any) => {
        if (currentSystem === 4) {
          return sum + (a.totalCs || 0);
        } else {
          return sum + (a.totalCcc || 0);
        }
      }, 0);
  };

  // НОВАЯ ФУНКЦИЯ: получение изначального количества ресурсов
  const getInitialAsteroidTotal = (): number => {
    if (!player) return 0;
    
    // Для системы 4 считаем из shopData
    const systemAsteroids = shopItems.asteroids.filter(item => 
      player.asteroids.some((a: any) => a.id === item.id && a.system === currentSystem)
    );
    
    return systemAsteroids.reduce((sum, item) => {
      return sum + getResourceValue(item);
    }, 0);
  };

  // НОВАЯ ФУНКЦИЯ: получение значения производительности дрона
  const getDroneProductivity = (item: Item): number => {
    if (currentSystem === 4) {
      return item.csPerDay || 0;
    } else {
      return item.cccPerDay || 0;
    }
  };

  // НОВАЯ ФУНКЦИЯ: получение названия ресурса
  const getResourceName = (): string => {
    return currentSystem === 4 ? 'CS' : 'CCC';
  };

  const getMaxItems = async (system: number, type: string): Promise<number> => {
    try {
      if (type === 'cargo') {
        const cargoData = await axios.get(`${API_URL}/api/shop/cargo`).then(res => res.data);
        return cargoData.filter((c: Item) => c.system === system).length;
      }
      if (type === 'asteroid') {
        const asteroidData = await axios.get(`${API_URL}/api/shop/asteroids`).then(res => res.data);
        return asteroidData.filter((a: Item) => a.system === system).length;
      }
      if (type === 'drones') {
        const droneData = await axios.get(`${API_URL}/api/shop/drones`).then(res => res.data);
        return droneData.filter((d: Item) => d.system === system).length;
      }
      return 0;
    } catch (err) {
      console.error(`Error fetching ${type} data:`, err);
      return 0;
    }
  };

  const fetchMaxItems = async () => {
    const maxAsteroids = await getMaxItems(currentSystem, 'asteroid');
    const maxDrones = await getMaxItems(currentSystem, 'drones');
    const maxCargo = await getMaxItems(currentSystem, 'cargo');
    return { maxAsteroids, maxDrones, maxCargo };
  };

  const [shopButtons, setShopButtons] = useState<ShopButton[]>([]);

  useEffect(() => {
    fetchMaxItems().then(({ maxAsteroids, maxDrones, maxCargo }) => {
      // Правильное отображение карго
      const cargoInCurrentSystem = player.cargo_levels.filter((c: any) => c.system === currentSystem);
      let currentCargoLevel = 0;
      
      if (cargoInCurrentSystem.length > 0) {
        currentCargoLevel = Math.max(...cargoInCurrentSystem.map((c: any) => c.id));
      }
      
      // ИСПРАВЛЕНО: используем локальные функции для правильного расчета ресурсов
      const currentRemaining = getSystemAsteroidTotal();
      const initialTotal = getInitialAsteroidTotal();
      
      setShopButtons([
        { type: 'resources', count: `${player.asteroids.filter((a: any) => a.system === currentSystem).length}/${maxAsteroids}`, amount: `${currentRemaining.toFixed(1)} / ${initialTotal.toFixed(1)} ${getResourceName()}` },
        { type: 'drones', count: `${player.drones.filter((d: any) => d.system === currentSystem).length}/${maxDrones}` },
        { type: 'cargo', count: `${currentCargoLevel}/${maxCargo}` },
      ]);
    });
  }, [player, currentSystem, shopItems.asteroids]);

  // 🔥 ТОЛЬКО 5 СИСТЕМ (убираем 6 и 7)
  const systemNames = [t('system_1'), t('system_2'), t('system_3'), t('system_4'), t('system_5')];
  const systemName = `${t('system')} ${currentSystem} - ${systemNames[currentSystem - 1]}`;
  const colorStyle = player?.color || '#00f0ff';

  if (!player) return <div>{t('loading')}</div>;

  return (
    <div style={{ 
      backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`, 
      backgroundSize: 'cover', 
      backgroundAttachment: 'fixed', 
      minHeight: '100vh', 
      color: '#fff', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '10px', 
      position: 'relative' 
    }}>
      {/* Верхняя панель с валютами */}
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />

      <div style={{ marginTop: '150px', paddingBottom: '130px' }}>
        {/* Кнопки категорий */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '10px' }}>
          {shopButtons.map(({ type, count, amount }) => (
            <button
              key={type}
              onClick={() => setActiveTab(type === 'resources' ? 'asteroid' : type)}
              style={{
                flex: 1,
                padding: '8px 5px',
                background: activeTab === (type === 'resources' ? 'asteroid' : type) 
                  ? `rgba(0, 240, 255, 0.2)` 
                  : 'rgba(0, 0, 0, 0.5)',
                border: activeTab === (type === 'resources' ? 'asteroid' : type) 
                  ? `4px solid ${colorStyle}` 
                  : `2px solid ${colorStyle}`,
                borderRadius: '15px',
                boxShadow: activeTab === (type === 'resources' ? 'asteroid' : type) 
                  ? `0 0 20px ${colorStyle}, inset 0 0 15px ${colorStyle}, inset 0 0 25px rgba(0, 240, 255, 0.3)` 
                  : `0 0 10px ${colorStyle}`,
                color: activeTab === (type === 'resources' ? 'asteroid' : type) ? colorStyle : '#fff',
                fontSize: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                height: 'auto',
                textShadow: activeTab === (type === 'resources' ? 'asteroid' : type) ? `0 0 10px ${colorStyle}` : 'none'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span>{t(type)}</span>
              <span>{count}</span>
              {amount && <span>{amount}</span>}
            </button>
          ))}
        </div>

        {/* 🔥 НОВЫЙ БЛОК: Выбор системы (как на MainPage) */}
        <div style={{ textAlign: 'center', margin: '10px 0', position: 'relative' }}>
          <span 
            onClick={() => { setShowSystemDropdown(!showSystemDropdown); }} 
            style={{ 
              fontSize: '1.5rem', 
              color: colorStyle, 
              textShadow: `0 0 10px ${colorStyle}`, 
              cursor: 'pointer', 
              transition: 'transform 0.3s ease', 
              display: 'inline-block' 
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')} 
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🛒 {systemName}
          </span>
          {showSystemDropdown && (
            <div style={{ 
              position: 'absolute', 
              top: '100%', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              background: 'rgba(0, 0, 0, 0.7)', 
              border: `2px solid ${colorStyle}`, 
              borderRadius: '10px', 
              boxShadow: `0 0 10px ${colorStyle}`, 
              zIndex: 10 
            }}>
              {[1, 2, 3, 4, 5].map(i => {
                const isUnlocked = player.unlocked_systems?.includes(i);
                const systemData = {
                  1: { price: 0, currency: 'cs' },
                  2: { price: 150, currency: 'cs' },
                  3: { price: 300, currency: 'cs' },
                  4: { price: 500, currency: 'cs' },
                  5: { price: 15, currency: 'ton' }
                };
                const system = systemData[i as keyof typeof systemData];
                
                return (
                  <div 
                    key={i} 
                    onClick={() => handleSystemChange(i)}
                    style={{ 
                      padding: '10px 20px', 
                      color: isUnlocked ? '#fff' : '#888', 
                      cursor: 'pointer', 
                      textAlign: 'center', 
                      transition: 'background 0.3s ease',
                      borderLeft: isUnlocked ? `4px solid ${colorStyle}` : '4px solid transparent'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0, 240, 255, 0.2)')} 
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {`Система ${i} - ${systemNames[i - 1]}`}
                    {!isUnlocked && (
                      <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                        🔒 {system.price} {system.currency.toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Индикатор загрузки */}
        {(isLoading || loading) && (
          <div style={{ 
            textAlign: 'center', 
            margin: '20px 0', 
            color: colorStyle, 
            fontSize: '1.2rem',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '15px',
            borderRadius: '10px',
            border: `1px solid ${colorStyle}`
          }}>
            ⏳ {t('processing_purchase')}
          </div>
        )}

        {/* 🔥 ТОВАРЫ - УМЕНЬШЕННЫЕ КНОПКИ для мобильных экранов */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px', 
          justifyContent: 'space-between'
        }}>
          {/* АСТЕРОИДЫ */}
          {activeTab === 'asteroid' && shopItems.asteroids.map((item: Item) => (
            <button
              key={`asteroid-${item.id}`}
              onClick={() => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && buyItem('asteroid', item.id, item.price || 0)}
              disabled={item.isPurchased || !item.isPreviousPurchased || isLoading || loading}
              style={{
                width: 'calc(50% - 5px)', // 🔥 2 кнопки в ряд с учетом gap
                minWidth: '140px', // минимальная ширина
                padding: '12px 8px',
                background: item.isPurchased 
                  ? 'rgba(0, 255, 0, 0.2)' 
                  : !item.isPreviousPurchased 
                    ? 'rgba(255, 0, 0, 0.2)' 
                    : 'rgba(0, 0, 0, 0.5)',
                border: `2px solid ${colorStyle}`,
                borderRadius: '12px',
                boxShadow: `0 0 8px ${colorStyle}`,
                color: '#fff',
                fontSize: '0.9rem', // 🔥 меньший шрифт
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: item.isPurchased || !item.isPreviousPurchased || isLoading || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                opacity: isLoading || loading ? 0.7 : 1,
              }}
              onMouseEnter={e => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>🌍 {getItemName('asteroid', item.id, currentSystem)}</span>
              <span style={{ fontSize: '0.8rem' }}>💎 {getResourceName()}: {getResourceValue(item)}</span>
              <span style={{ fontSize: '0.8rem' }}>💰 {item.price || 0} {currentSystem >= 1 && currentSystem <= 4 ? 'CS' : currentSystem >= 5 ? 'TON' : 'CCC'}</span>
              {item.isPurchased && <span style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.8rem' }}>✅ {t('purchased')}</span>}
              {!item.isPreviousPurchased && <span style={{ color: '#ff4444', fontSize: '0.8rem' }}>🔒 {t('buy_previous')}</span>}
            </button>
          ))}

          {/* ДРОНЫ */}
          {activeTab === 'drones' && shopItems.drones.map((item: Item) => (
            <button
              key={`drone-${item.id}`}
              onClick={() => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && buyItem('drones', item.id, item.price || 0)}
              disabled={item.isPurchased || !item.isPreviousPurchased || isLoading || loading}
              style={{
                width: 'calc(50% - 5px)', // 🔥 2 кнопки в ряд
                minWidth: '140px',
                padding: '12px 8px',
                background: item.isPurchased 
                  ? 'rgba(0, 255, 0, 0.2)' 
                  : !item.isPreviousPurchased 
                    ? 'rgba(255, 0, 0, 0.2)' 
                    : 'rgba(0, 0, 0, 0.5)',
                border: `2px solid ${colorStyle}`,
                borderRadius: '12px',
                boxShadow: `0 0 8px ${colorStyle}`,
                color: '#fff',
                fontSize: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: item.isPurchased || !item.isPreviousPurchased || isLoading || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                opacity: isLoading || loading ? 0.7 : 1,
              }}
              onMouseEnter={e => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>🤖 {getItemName('drone', item.id, currentSystem)}</span>
              <span style={{ fontSize: '0.8rem' }}>⚡ {getResourceName()}/день: {getDroneProductivity(item)}</span>
              <span style={{ fontSize: '0.8rem' }}>💰 {item.price || 0} {currentSystem >= 1 && currentSystem <= 4 ? 'CS' : currentSystem >= 5 ? 'TON' : 'CCC'}</span>
              {item.isPurchased && <span style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.8rem' }}>✅ {t('purchased')}</span>}
              {!item.isPreviousPurchased && <span style={{ color: '#ff4444', fontSize: '0.8rem' }}>🔒 {t('buy_previous')}</span>}
            </button>
          ))}

          {/* КАРГО */}
          {activeTab === 'cargo' && shopItems.cargo.map((item: Item) => (
            <button
              key={`cargo-${item.id}`}
              onClick={() => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && buyItem('cargo', item.id, item.price || 0)}
              disabled={item.isPurchased || !item.isPreviousPurchased || isLoading || loading}
              style={{
                width: 'calc(50% - 5px)', // 🔥 2 кнопки в ряд
                minWidth: '140px',
                padding: '12px 8px',
                background: item.isPurchased 
                  ? 'rgba(0, 255, 0, 0.2)' 
                  : !item.isPreviousPurchased 
                    ? 'rgba(255, 0, 0, 0.2)' 
                    : 'rgba(0, 0, 0, 0.5)',
                border: `2px solid ${colorStyle}`,
                borderRadius: '12px',
                boxShadow: `0 0 8px ${colorStyle}`,
                color: '#fff',
                fontSize: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: item.isPurchased || !item.isPreviousPurchased || isLoading || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                opacity: isLoading || loading ? 0.7 : 1,
              }}
              onMouseEnter={e => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>📦 {getItemName('cargo', item.id, currentSystem)}</span>
              <span style={{ fontSize: '0.8rem' }}>📊 {t('capacity')}: {item.capacity === 999999 || item.capacity === 99999 ? '∞' : item.capacity || 0}</span>
              <span style={{ fontSize: '0.8rem' }}>💰 {item.price || 0} {currentSystem >= 1 && currentSystem <= 4 ? 'CS' : currentSystem >= 5 ? 'TON' : 'CCC'}</span>
              {item.isPurchased && <span style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.8rem' }}>✅ {t('purchased')}</span>}
              {!item.isPreviousPurchased && <span style={{ color: '#ff4444', fontSize: '0.8rem' }}>🔒 {t('buy_previous')}</span>}
              {item.id === 5 && !item.isPurchased && <span style={{ color: '#ffa500', fontSize: '0.8rem' }}>⭐ {t('infinite_capacity')}</span>}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ color: '#ff0000', textAlign: 'center', margin: '20px 0' }}>
            {error}
          </div>
        )}
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />

      {/* 🔥 НОВОЕ: Модальное окно разблокировки системы */}
      {showUnlockModal && targetSystem && (
        <SystemUnlockModal 
          systemId={targetSystem}
          onUnlock={handleUnlockSuccess}
          onCancel={handleUnlockCancel}
        />
      )}
    </div>
  );
};

export default ShopPage;