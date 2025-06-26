import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useGame } from '../context/GameContext';
import { useShop } from '../context/ShopContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

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

  // Установка активной вкладки из location state
  useEffect(() => {
    const stateTab = (location.state as { tab?: string })?.tab;
    if (stateTab) setActiveTab(stateTab);
  }, [location.state]);

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

  // Функция покупки с новой логикой
  const buyItem = async (type: string, id: number, price: number) => {
    if (!player?.telegram_id) {
      console.error('No telegram_id found for player');
      return;
    }
    
    if (isLoading) return;
    
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
            alert(`🎉 СКРЫТОЕ ЗАДАНИЕ ВЫПОЛНЕНО! 🎉\n\nВы собрали полную коллекцию дронов в системе ${currentSystem}!\n\n🚀 Бонус: +1% к скорости добычи!\n\nТеперь ваши дроны работают еще эффективнее!`);
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
      
      // Обновляем товары магазина
      await fetchShopItems();
      
    } catch (err: any) {
      console.error(`Failed to buy ${type}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Не удалось купить';
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
  }, [player, currentSystem, shopItems.asteroids]); // Добавляем shopItems.asteroids в зависимости

  const systemNames = [t('system_1'), t('system_2'), t('system_3'), t('system_4'), t('system_5'), t('system_6'), t('system_7')];
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
        {/* Кнопки категорий - СТАРЫЙ СТИЛЬ */}
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

        {/* Название системы */}
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <span style={{ fontSize: '1.5rem', color: colorStyle, textShadow: `0 0 10px ${colorStyle}` }}>
            🛒 {systemName}
          </span>
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

        {/* Товары - ИСПРАВЛЕНЫ ЗНАЧЕНИЯ ДЛЯ СИСТЕМЫ 4 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', zIndex: 10 }}>
          {activeTab === 'asteroid' && shopItems.asteroids.map((item: Item) => (
            <button
              key={`asteroid-${item.id}`}
              onClick={() => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && buyItem('asteroid', item.id, item.price || 0)}
              disabled={item.isPurchased || !item.isPreviousPurchased || isLoading || loading}
              style={{
                width: '48%',
                padding: '15px',
                background: item.isPurchased 
                  ? 'rgba(0, 255, 0, 0.2)' 
                  : !item.isPreviousPurchased 
                    ? 'rgba(255, 0, 0, 0.2)' 
                    : 'rgba(0, 0, 0, 0.5)',
                border: `2px solid ${colorStyle}`,
                borderRadius: '15px',
                boxShadow: `0 0 10px ${colorStyle}`,
                color: '#fff',
                fontSize: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: item.isPurchased || !item.isPreviousPurchased || isLoading || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                opacity: isLoading || loading ? 0.7 : 1,
              }}
              onMouseEnter={e => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>🌍 {getItemName('asteroid', item.id, currentSystem)}</span>
              <span>💎 {getResourceName()}: {getResourceValue(item)}</span>
              <span>💰 {t('price')}: {item.price || 0} {currentSystem >= 1 && currentSystem <= 4 ? 'CS' : currentSystem >= 5 && currentSystem <= 7 ? 'TON' : 'CCC'}</span>
              {item.isPurchased && <span style={{ color: '#00ff00', fontWeight: 'bold' }}>✅ {t('purchased')}</span>}
              {!item.isPreviousPurchased && <span style={{ color: '#ff4444' }}>🔒 {t('buy_previous')}</span>}
            </button>
          ))}
          {activeTab === 'drones' && shopItems.drones.map((item: Item) => (
            <button
              key={`drone-${item.id}`}
              onClick={() => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && buyItem('drones', item.id, item.price || 0)}
              disabled={item.isPurchased || !item.isPreviousPurchased || isLoading || loading}
              style={{
                width: '48%',
                padding: '15px',
                background: item.isPurchased 
                  ? 'rgba(0, 255, 0, 0.2)' 
                  : !item.isPreviousPurchased 
                    ? 'rgba(255, 0, 0, 0.2)' 
                    : 'rgba(0, 0, 0, 0.5)',
                border: `2px solid ${colorStyle}`,
                borderRadius: '15px',
                boxShadow: `0 0 10px ${colorStyle}`,
                color: '#fff',
                fontSize: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: item.isPurchased || !item.isPreviousPurchased || isLoading || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                opacity: isLoading || loading ? 0.7 : 1,
              }}
              onMouseEnter={e => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>🤖 {getItemName('drone', item.id, currentSystem)}</span>
              <span>⚡ {getResourceName()}/день: {getDroneProductivity(item)}</span>
              <span>💰 {t('price')}: {item.price || 0} {currentSystem >= 1 && currentSystem <= 4 ? 'CS' : currentSystem >= 5 && currentSystem <= 7 ? 'TON' : 'CCC'}</span>
              {item.isPurchased && <span style={{ color: '#00ff00', fontWeight: 'bold' }}>✅ {t('purchased')}</span>}
              {!item.isPreviousPurchased && <span style={{ color: '#ff4444' }}>🔒 {t('buy_previous')}</span>}
            </button>
          ))}
          {activeTab === 'cargo' && shopItems.cargo.map((item: Item) => (
            <button
              key={`cargo-${item.id}`}
              onClick={() => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && buyItem('cargo', item.id, item.price || 0)}
              disabled={item.isPurchased || !item.isPreviousPurchased || isLoading || loading}
              style={{
                width: '48%',
                padding: '15px',
                background: item.isPurchased 
                  ? 'rgba(0, 255, 0, 0.2)' 
                  : !item.isPreviousPurchased 
                    ? 'rgba(255, 0, 0, 0.2)' 
                    : 'rgba(0, 0, 0, 0.5)',
                border: `2px solid ${colorStyle}`,
                borderRadius: '15px',
                boxShadow: `0 0 10px ${colorStyle}`,
                color: '#fff',
                fontSize: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: item.isPurchased || !item.isPreviousPurchased || isLoading || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                opacity: isLoading || loading ? 0.7 : 1,
              }}
              onMouseEnter={e => !item.isPurchased && item.isPreviousPurchased && !isLoading && !loading && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>📦 {getItemName('cargo', item.id, currentSystem)}</span>
              <span>📊 {t('capacity')}: {item.capacity === 999999 || item.capacity === 99999 ? '∞' : item.capacity || 0}</span>
              <span>💰 {t('price')}: {item.price || 0} {currentSystem >= 1 && currentSystem <= 4 ? 'CS' : currentSystem >= 5 && currentSystem <= 7 ? 'TON' : 'CCC'}</span>
              {item.isPurchased && <span style={{ color: '#00ff00', fontWeight: 'bold' }}>✅ {t('purchased')}</span>}
              {!item.isPreviousPurchased && <span style={{ color: '#ff4444' }}>🔒 {t('buy_previous')}</span>}
              {item.id === 5 && !item.isPurchased && <span style={{ color: '#ffa500' }}>⭐ {t('infinite_capacity')}</span>}
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
    </div>
  );
};

export default ShopPage;