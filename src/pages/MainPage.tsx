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

// Импортируем рекламный сервис
import { adService } from '../services/adsgramService';

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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MainPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { player, refreshPlayer } = useNewPlayer();
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
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // Проверяем нужна ли реклама для сбора
  const needsAdForCollection = useCallback(() => {
    // Системы 1-4 требуют рекламу, если игрок не верифицирован
    if (currentSystem >= 1 && currentSystem <= 4) {
      return !player?.verified; // Если не верифицирован - нужна реклама
    }
    return false; // Система 5 (TON) - реклама не нужна
  }, [currentSystem, player?.verified]);

  const handleCreateNewStake = () => {
    if (currentSystem === 5) {
      setTargetSystem(5);
      setShowUnlockModal(true);
    }
  };

  const handleSafeClick = async () => {
    if (!player?.telegram_id || isCollecting || isWatchingAd) {
      console.log('🚫 Сбор заблокирован:', { 
        hasPlayer: !!player?.telegram_id, 
        isCollecting, 
        isWatchingAd 
      });
      return;
    }

    const currentValue = getCurrentValue(currentSystem);
    
    if (currentValue <= 0) {
      alert(t('no_resources_to_collect'));
      return;
    }

    // Проверяем нужна ли реклама
    if (needsAdForCollection()) {
      console.log('🎯 Требуется просмотр рекламы для сбора в системе', currentSystem);
      await handleAdBeforeCollection();
    } else {
      console.log('🎯 Сбор без рекламы - игрок верифицирован или система TON');
      await performCollection();
    }
  };

  const handleAdBeforeCollection = async () => {
    setIsWatchingAd(true);
    
    try {
      console.log('⚡ Показываем рекламу перед сбором...');
      
      // Инициализируем рекламный сервис если нужно
      if (!adService.isAvailable()) {
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '10674';
        await adService.initialize(ADSGRAM_BLOCK_ID);
      }
      
      const adResult = await adService.showRewardedAd();
      console.log('⚡ Результат рекламы:', adResult);
      
      if (adResult.success) {
        console.log('✅ Реклама просмотрена успешно, выполняем сбор');
        await performCollection();
      } else {
        console.log('❌ Реклама не была просмотрена:', adResult.error);
        alert('Для сбора ресурсов необходимо просмотреть рекламу до конца');
      }
    } catch (err) {
      console.error('❌ Ошибка показа рекламы:', err);
      alert('Ошибка при показе рекламы. Попробуйте еще раз.');
    } finally {
      setIsWatchingAd(false);
    }
  };

  const performCollection = async () => {
    setIsCollecting(true);
    
    try {
      const currentValue = getCurrentValue(currentSystem);
      
      if (currentValue <= 0) {
        alert(t('no_resources_to_collect'));
        return;
      }
      
      const newCollectionTime = new Date().toISOString();
      const updatedLastCollectionTime = {
        ...player.last_collection_time,
        [currentSystem]: newCollectionTime
      };

      const collectParams: any = {
        telegramId: player.telegram_id,
        last_collection_time: updatedLastCollectionTime,
        system: currentSystem,
      };

      if (currentSystem === 4) {
        collectParams.collected_cs = currentValue;
      } else {
        collectParams.collected_ccc = currentValue;
      }

      const result = await safeCollect(collectParams);

      if (result) {
        resetCleanCounter(currentSystem);
        console.log(`✅ Сбор выполнен успешно: ${currentValue.toFixed(5)} ${currentSystem === 4 ? 'CS' : 'CCC'}`);
      }
    } catch (err) {
      console.error('❌ Ошибка при сборе:', err);
      alert(t('collection_error', { error: err }));
    } finally {
      setIsCollecting(false);
    }
  };

  const handlePurchase = (type: string) => () => {
    navigate('/shop', { state: { tab: type === 'resources' ? 'asteroid' : type } });
  };

  if (!player) return <div>{t('loading')}</div>;

  const systemNames = [
    t('system_1_name'),
    t('system_2_name'),
    t('system_3_name'),
    t('system_4_name'),
    t('system_5_name')
  ];

  // 🔥 ИЗМЕНЕНИЕ 1: Используем шаблон для перевода
  const systemName = t('system_display_format', {
    number: currentSystem,
    name: systemNames[currentSystem - 1]
  });
  
  const colorStyle = player.color || '#00f0ff';
  const isTonSystem = currentSystem === 5;
  const cargoLevelId = player.cargo_levels.find((c: CargoLevel) => c.system === currentSystem)?.id || 0;

  const getMaxItems = useCallback(async (system: number, type: string): Promise<number> => {
    try {
      const response = await axios.get(`${API_URL}/api/shop/${type}`);
      const data = response.data || [];
      return data.filter((item: Item) => item.system === system).length;
    } catch (err) {
      return 0;
    }
  }, []);

  const fetchMaxItems = useCallback(async () => {
    const [maxAsteroids, maxDrones, maxCargo] = await Promise.all([
      getMaxItems(currentSystem, 'asteroids'),
      getMaxItems(currentSystem, 'drones'),
      getMaxItems(currentSystem, 'cargo'),
    ]);
    return { maxAsteroids, maxDrones, maxCargo };
  }, [currentSystem, getMaxItems]);

  const [shopButtons, setShopButtons] = useState<ShopButton[]>([]);
  const [initialAsteroidTotals, setInitialAsteroidTotals] = useState<{ [key: number]: number }>({});
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [targetSystem, setTargetSystem] = useState<number | null>(null);

  useEffect(() => {
    if (player && !player.unlocked_systems?.includes(currentSystem)) {
      setTargetSystem(currentSystem);
      setShowUnlockModal(true);
    }
  }, [currentSystem, player]);

  const handleSystemChange = (systemId: number) => {
    if (!player) return;
    
    if (player.unlocked_systems?.includes(systemId)) {
      setCurrentSystem(systemId);
    } else {
      setTargetSystem(systemId);
      setShowUnlockModal(true);
    }
    setShowSystemDropdown(false);
  };

  const handleUnlockSuccess = async () => {
    setShowUnlockModal(false);
    if (targetSystem) {
      setTimeout(async () => {
        await refreshPlayer();
        setCurrentSystem(targetSystem);
        setTargetSystem(null);
      }, 100);
    }
  };

  const handleUnlockCancel = () => {
    setShowUnlockModal(false);
    setTargetSystem(null);
    if (player?.unlocked_systems?.length > 0) {
      setCurrentSystem(Math.max(...player.unlocked_systems));
    }
  };

  useEffect(() => {
    if (player && (!player.unlocked_systems || player.unlocked_systems.length === 0)) {
      setTargetSystem(1);
      setShowUnlockModal(true);
    }
  }, [player]);

  useEffect(() => {
    if (!player || isTonSystem) return;
    
    fetchMaxItems().then(({ maxAsteroids, maxDrones }) => {
      const asteroidCount = player.asteroids.filter((a: Asteroid) => a.system === currentSystem).length;
      const remainingResources = Math.floor((player.asteroid_total_data?.[currentSystem] || 0) * 100000) / 100000;
      const miningSpeed = player.mining_speed_data?.[currentSystem] || 0;
      const speedPerHour = (miningSpeed * 3600).toFixed(2);
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
          amount: `${speedPerHour} ${t('per_hour')}`
        },
        {
          type: 'cargo',
          count: t('level_prefix', { level: player.cargo_levels.filter((c: any) => c.system === currentSystem).length }),
          amount: realCargoCapacity === 999999 || realCargoCapacity === 99999 ? '∞' : realCargoCapacity.toString()
        },
      ]);
    });
  }, [player, currentSystem, cargoLevelId, fetchMaxItems, getRealCargoCapacity, isTonSystem, t]);

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
      
      <CurrencyPanel player={player} currentSystem={currentSystem} colorStyle={colorStyle} />

      <div style={{ marginTop: '100px', paddingBottom: '130px' }}>
        
        <div style={{ textAlign: 'center', margin: '10px 0', position: 'relative' }}>
          <span onClick={() => setShowSystemDropdown(!showSystemDropdown)} style={{ fontSize: '1.5rem', color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, cursor: 'pointer', transition: 'transform 0.3s ease', display: 'inline-block' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')} onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
            {systemName}
          </span>
          {showSystemDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0, 0, 0, 0.7)', border: `2px solid ${colorStyle}`, borderRadius: '10px', boxShadow: `0 0 10px ${colorStyle}`, zIndex: 10 }}>
              {[1, 2, 3, 4, 5].map(i => {
                const isUnlocked = player.unlocked_systems?.includes(i);
                const systemData = { 1: { price: 0, currency: 'cs' }, 2: { price: 150, currency: 'cs' }, 3: { price: 300, currency: 'cs' }, 4: { price: 500, currency: 'cs' }, 5: { price: 15, currency: 'ton' }};
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
                    {/* 🔥 ИЗМЕНЕНИЕ 2: Используем шаблон и здесь */}
                    {t('system_display_format', { number: i, name: systemNames[i-1] })}
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

        {isTonSystem ? (
          <StakingView
            player={player}
            systemId={currentSystem}
            colorStyle={colorStyle}
            onSystemChange={setCurrentSystem}
            onPlayerUpdate={refreshPlayer}
            onCreateNewStake={handleCreateNewStake}
          />
        ) : (
          <>
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

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', margin: '10px', paddingTop: '30px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '150px',
                  height: '150px',
                  cursor: (isCollecting || isWatchingAd) ? 'wait' : 'pointer',
                  opacity: (isCollecting || isWatchingAd) ? 0.7 : 1
                }}
                onClick={handleSafeClick}
              >
                <img
                  src="/assets/safe.png"
                  alt={t("safe_alt")}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: `drop-shadow(0 0 10px ${colorStyle}) drop-shadow(0 0 20px ${colorStyle})`,
                    transition: 'transform 0.3s ease',
                    transform: (isCollecting || isWatchingAd) ? 'scale(0.95)' : 'scale(1)'
                  }}
                  onMouseEnter={e => !(isCollecting || isWatchingAd) && (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={e => !(isCollecting || isWatchingAd) && (e.currentTarget.style.transform = 'scale(1)')}
                />
                {(isCollecting || isWatchingAd) && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: colorStyle,
                    fontSize: '2rem',
                    animation: 'spin 1s linear infinite'
                  }}>
                    {isWatchingAd ? '📺' : '⏳'}
                  </div>
                )}
              </div>
              
              <p style={{ fontSize: '1.5rem', color: colorStyle, textShadow: `0 0 5px ${colorStyle}`, marginTop: '10px' }}>
                {getCurrentValue(currentSystem).toFixed(5)} {currentSystem === 4 ? 'CS' : currentSystem === 5 ? 'TON' : 'CCC'}
              </p>
              
            </div>
          </>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}
      </style>

      <NavigationMenu colorStyle={colorStyle} />

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