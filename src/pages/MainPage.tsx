import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useGame } from '../context/GameContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import SystemUnlockModal from '../components/SystemUnlockModal';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';
import StakingView from '../components/StakingView';

// Импортируем новый чистый счетчик
import { useCleanCounter } from '../hooks/useCleanCounter';

interface Item {
  id: number;
  system: number;
}

interface Drone {
  id: number;
  system: number;
}

interface Asteroid {
  id: number;
  system: number;
  totalCcc?: number;
}

interface CargoLevel {
  id: number;
  system: number;
}

interface ShopButton {
  type: string;
  count: string;
  amount?: string;
}

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const MainPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, refreshPlayer } = useNewPlayer(); // 🔥 ДОБАВЛЕНО refreshPlayer
  const { 
    currentSystem, 
    setCurrentSystem, 
    safeCollect
  } = useGame();

  // Новый чистый счетчик
  const {
    getCurrentValue,
    resetCleanCounter,
    hasFullSetup,
    getRealCargoCapacity,
    getMiningSpeedPerSecond,
    getRemainingResources,
  } = useCleanCounter({ player, currentSystem });

  const navigate = useNavigate();
  const location = useLocation();
  const [showSystemDropdown, setShowSystemDropdown] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);

  // 🔥 ОБРАБОТЧИК СОЗДАНИЯ НОВОГО СТЕЙКА ДЛЯ СИСТЕМЫ 5
  const handleCreateNewStake = () => {
    if (currentSystem === 5) {
      // Показываем модальное окно выбора суммы для системы 5
      setTargetSystem(5);
      setShowUnlockModal(true);
    }
  };

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ СБОРА с отладкой и защитой от повторных нажатий
  const handleSafeClick = async () => {
    if (!player?.telegram_id || isCollecting) {
      console.log('🚫 Сбор заблокирован:', { hasPlayer: !!player?.telegram_id, isCollecting });
      return;
    }
    
    setIsCollecting(true); // 🔧 БЛОКИРУЕМ повторные клики
    
    try {
      // Получаем значение с нового счетчика
      const currentValue = getCurrentValue(currentSystem);
      
      console.log('🔍 НАЧИНАЕМ СБОР:', {
        system: currentSystem,
        currentValue: currentValue.toFixed(5),
        player: player.telegram_id
      });
      
      if (currentValue <= 0) {
        console.log('❌ Нечего собирать:', currentValue);
        
        // 🔥 ПРОСТОЕ УВЕДОМЛЕНИЕ
        alert('⚠️ Нечего собирать!\n\nПодождите, пока накопятся ресурсы.');
        return;
      }
      
      const newCollectionTime = new Date().toISOString();
      const updatedLastCollectionTime = { 
        ...player.last_collection_time, 
        [currentSystem]: newCollectionTime 
      };

      // 🔥 ИСПРАВЛЕНО: правильные параметры для системы 4 (CS) и других систем (CCC)
      const collectParams: any = {
        telegramId: player.telegram_id,
        last_collection_time: updatedLastCollectionTime,
        system: currentSystem,
      };

      if (currentSystem === 4) {
        collectParams.collected_cs = currentValue;
        console.log(`💰 ПАРАМЕТРЫ СБОРА CS:`, collectParams);
      } else {
        collectParams.collected_ccc = currentValue;
        console.log(`💰 ПАРАМЕТРЫ СБОРА CCC:`, collectParams);
      }

      console.log('📡 ОТПРАВЛЯЕМ ЗАПРОС...');
      const result = await safeCollect(collectParams);

      if (result) {
        console.log('✅ СБОР УСПЕШЕН');
        // Сбрасываем счетчик
        resetCleanCounter(currentSystem);
      } else {
        console.log('❌ СБОР НЕ УДАЛСЯ');
      }
    } catch (err) {
      console.error('💥 ОШИБКА СБОРА:', err);
      
      // 🔥 ПРОСТОЕ УВЕДОМЛЕНИЕ ОБ ОШИБКЕ
      alert(`❌ Не удалось собрать ресурсы:\n\n${err}`);
    } finally {
      setIsCollecting(false); // 🔧 РАЗБЛОКИРУЕМ клики
    }
  };

  const handlePurchase = (type: string) => () => {
    navigate('/shop', { state: { tab: type === 'resources' ? 'asteroid' : type } });
  };

  if (!player) return <div>Загрузка...</div>;

  // 🔥 ТОЛЬКО 5 СИСТЕМ (убираем 6 и 7)
  const systemNames = ['Андромеда', 'Орион', 'Млечный Путь', 'Туманность Ориона', 'Крабовидная Туманность'];
  const systemName = `Система ${currentSystem} - ${systemNames[currentSystem - 1]}`;
  const colorStyle = player.color || '#00f0ff';

  // 🔥 ДОБАВЛЕНО: проверка TON системы
  const isTonSystem = currentSystem === 5;

  const cargoLevel = player.cargo_levels.find((c: CargoLevel) => c.system === currentSystem);
  const cargoLevelId = cargoLevel ? cargoLevel.id : 0;

  const getMaxItems = async (system: number, type: string): Promise<number> => {
    try {
      let response;
      if (type === 'cargo') {
        response = await axios.get(`${API_URL}/api/shop/cargo`).then(res => res.data);
      } else if (type === 'asteroid') {
        response = await axios.get(`${API_URL}/api/shop/asteroids`).then(res => res.data);
      } else if (type === 'drones') {
        response = await axios.get(`${API_URL}/api/shop/drones`).then(res => res.data);
      }
      const data = response || [];
      return data.filter((item: Item) => item.system === system).length;
    } catch (err) {
      return 0;
    }
  };

  const fetchMaxItems = useCallback(async () => {
    const [maxAsteroids, maxDrones, maxCargo] = await Promise.all([
      getMaxItems(currentSystem, 'asteroid'),
      getMaxItems(currentSystem, 'drones'),
      getMaxItems(currentSystem, 'cargo'),
    ]);
    return { maxAsteroids, maxDrones, maxCargo };
  }, [currentSystem]);

  const [shopButtons, setShopButtons] = useState<ShopButton[]>([]);
  const [initialAsteroidTotals, setInitialAsteroidTotals] = useState<{ [key: number]: number }>({});
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [targetSystem, setTargetSystem] = useState<number | null>(null);

  // Проверяем разблокированные системы при смене системы
  useEffect(() => {
    if (!player) return;
    
    if (!player.unlocked_systems?.includes(currentSystem)) {
      setTargetSystem(currentSystem);
      setShowUnlockModal(true);
    }
  }, [currentSystem, player?.unlocked_systems]);

  // Обработчик смены системы с проверкой разблокировки
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

  // 🔥 ИСПРАВЛЕННЫЙ обработчик успешной разблокировки системы
  const handleUnlockSuccess = async () => {
    setShowUnlockModal(false);
    
    if (targetSystem) {
      // 🔥 КРИТИЧЕСКИ ВАЖНО: Даем время на обновление состояния после setPlayer в модальном окне
      setTimeout(async () => {
        try {
          // Дополнительно обновляем данные игрока для надежности
          await refreshPlayer();
          console.log('✅ Данные игрока обновлены после разблокировки системы');
        } catch (err) {
          console.error('❌ Ошибка обновления игрока:', err);
        }
        
        setCurrentSystem(targetSystem);
        setTargetSystem(null);
      }, 100); // Небольшая задержка для обновления состояния
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

  // Показываем модальное окно разблокировки системы 1 если игрок новый
  useEffect(() => {
    if (player && (!player.unlocked_systems || player.unlocked_systems.length === 0)) {
      setTargetSystem(1);
      setShowUnlockModal(true);
    }
  }, [player]);

  useEffect(() => {
    if (!player?.asteroids || !player?.asteroid_total_data) return;

    if (initialAsteroidTotals[currentSystem] === undefined) {
      const totalCcc = player.asteroids
        .filter((a: Asteroid) => a.system === currentSystem)
        .reduce((sum: number, a: Asteroid) => sum + (a.totalCcc || 0), 0);
      setInitialAsteroidTotals((prev) => ({
        ...prev,
        [currentSystem]: totalCcc > 0 ? totalCcc : (player.asteroid_total_data[currentSystem] || 0),
      }));
    }
  }, [currentSystem, player?.asteroids, player?.asteroid_total_data, initialAsteroidTotals]);

  useEffect(() => {
    if (!player || isTonSystem) return; // 🔥 Не создаем кнопки для TON систем
    
    fetchMaxItems().then(({ maxAsteroids, maxDrones, maxCargo }) => {
      const asteroidCount = player.asteroids.filter((a: Asteroid) => a.system === currentSystem).length;
      
      // 🔧 ИСПРАВЛЕНО: ОСТАТКИ РЕСУРСОВ - берем из asteroid_total_data с округлением в меньшую сторону
      const remainingResources = Math.floor((player.asteroid_total_data?.[currentSystem] || 0) * 100000) / 100000;
      
      // 🔧 СКОРОСТЬ ДОБЫЧИ В ТЕКУЩЕЙ СИСТЕМЕ
      const miningSpeed = player.mining_speed_data?.[currentSystem] || 0;
      const speedPerHour = (miningSpeed * 3600).toFixed(2);
      
      // 🔧 РЕАЛЬНАЯ ВМЕСТИМОСТЬ КАРГО из useCleanCounter
      const realCargoCapacity = getRealCargoCapacity(currentSystem);
      
      setShopButtons([
        { 
          type: 'resources', 
          count: `${asteroidCount}/${maxAsteroids}`, 
          amount: `${remainingResources.toFixed(5)} ${currentSystem === 4 ? 'CS' : 'CCC'}` 
        },
        { 
          type: 'drones', 
          count: `${player.drones.filter((d: Drone) => d.system === currentSystem).length}/${maxDrones}`,
          amount: `${speedPerHour}/час`
        },
        { 
          type: 'cargo', 
          count: `Уровень ${player.cargo_levels.filter((c: any) => c.system === currentSystem).length}`,
          amount: realCargoCapacity === 999999 || realCargoCapacity === 99999 ? '∞' : realCargoCapacity.toString()
        },
      ]);
    });
  }, [player, currentSystem, cargoLevelId, initialAsteroidTotals, fetchMaxItems, getRealCargoCapacity, isTonSystem]);

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

      {/* Основной контент */}
      <div style={{ marginTop: '150px', paddingBottom: '130px' }}>
        
        {/* Выбор системы */}
        <div style={{ textAlign: 'center', margin: '10px 0', position: 'relative' }}>
          <span onClick={() => { setShowSystemDropdown(!showSystemDropdown); }} style={{ fontSize: '1.5rem', color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, cursor: 'pointer', transition: 'transform 0.3s ease', display: 'inline-block' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            {systemName}
          </span>
          {showSystemDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0, 0, 0, 0.7)', border: `2px solid ${colorStyle}`, borderRadius: '10px', boxShadow: `0 0 10px ${colorStyle}`, zIndex: 10 }}>
              {/* 🔥 ОГРАНИЧИВАЕМ до 5 систем */}
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

        {/* 🔥 УСЛОВНЫЙ РЕНДЕРИНГ: TON стейкинг или обычная игра */}
        {isTonSystem ? (
          // TON система (5) - показываем интерфейс стейкинга
          <StakingView 
            player={player}
            systemId={currentSystem}
            colorStyle={colorStyle}
            onSystemChange={setCurrentSystem}
            onPlayerUpdate={refreshPlayer}
            onCreateNewStake={handleCreateNewStake}
          />
        ) : (
          // Обычные системы (1-4) - показываем стандартный интерфейс
          <>
            {/* Кнопки магазина */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '10px' }}>
              {shopButtons.map(({ type, count, amount }) => (
                <button key={type} onClick={handlePurchase(type)} style={{ flex: 1, padding: '8px 5px', background: 'rgba(0, 0, 0, 0.5)', border: `2px solid ${colorStyle}`, borderRadius: '15px', boxShadow: `0 0 10px ${colorStyle}`, color: '#fff', fontSize: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '5px', cursor: 'pointer', transition: 'transform 0.3s ease', boxSizing: 'border-box', height: 'auto' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                  <span>{t(type)}</span>
                  <span>{count}</span>
                  {amount && <span>{amount}</span>}
                </button>
              ))}
            </div>

            {/* Сейф с новым счетчиком и индикатором загрузки */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', margin: '10px', paddingTop: '80px' }}>
              <div 
                style={{ 
                  position: 'relative', 
                  width: '150px', 
                  height: '150px', 
                  cursor: isCollecting ? 'wait' : 'pointer',
                  opacity: isCollecting ? 0.7 : 1
                }} 
                onClick={handleSafeClick}
              >
                <img 
                  src="/assets/safe.png" 
                  alt="Safe" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain', 
                    filter: `drop-shadow(0 0 10px ${colorStyle}) drop-shadow(0 0 20px ${colorStyle})`, 
                    transition: 'transform 0.3s ease',
                    transform: isCollecting ? 'scale(0.95)' : 'scale(1)'
                  }}
                  onMouseEnter={e => !isCollecting && (e.currentTarget.style.transform = 'scale(1.1)')} 
                  onMouseLeave={e => !isCollecting && (e.currentTarget.style.transform = 'scale(1)')}
                />
                {/* Индикатор загрузки */}
                {isCollecting && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: colorStyle,
                    fontSize: '2rem',
                    animation: 'spin 1s linear infinite'
                  }}>
                    ⏳
                  </div>
                )}
              </div>
              
              {/* Счетчик с новой логикой */}
              <p style={{ fontSize: '1.5rem', color: colorStyle, textShadow: `0 0 5px ${colorStyle}`, marginTop: '10px' }}>
                {getCurrentValue(currentSystem).toFixed(5)} {currentSystem === 4 ? 'CS' : currentSystem === 5 ? 'TON' : 'CCC'}
              </p>
              
              {/* Статус сбора */}
              {isCollecting && (
                <p style={{ fontSize: '1rem', color: '#ffa500', textAlign: 'center', marginTop: '5px' }}>
                  Сбор...
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* CSS для анимации загрузки */}
      <style>
        {`
          @keyframes spin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}
      </style>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />

      {/* Модальное окно разблокировки системы */}
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

export default MainPage;