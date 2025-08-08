// MainPage.tsx - ЗАМЕНИТЬ ВЕСЬ ФАЙЛ - ЧАСТЬ 1 из 6

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNewPlayer } from '../context/NewPlayerContext';
import { useGame } from '../context/GameContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import SystemUnlockModal from '../components/SystemUnlockModal';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';
import StakingView from '../components/StakingView';

// 👑 ЗАМЕНЯЕМ ИМПОРТ НА ПРЕМИУМ СЕРВИС
import { premiumAdService, PremiumAdResult } from '../services/premiumAwareAdService';

// Импортируем новый чистый счетчик
import { useCleanCounter } from '../hooks/useCleanCounter';
import ToastNotification from '../components/ToastNotification';

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
// MainPage.tsx - ЧАСТЬ 2 из 6 - ДОБАВИТЬ ПОСЛЕ ЧАСТИ 1

// 👑 ВЫНЕСЕННЫЙ КОМПОНЕНТ ПРЕМИУМ ПРЕДЛОЖЕНИЯ
const PremiumOfferModal = React.memo(({ 
  isVisible, 
  onClose, 
  onBuyPremium 
}: { 
  isVisible: boolean; 
  onClose: () => void; 
  onBuyPremium: () => void; 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // 🔒 ЗАЩИЩЕННЫЕ ОБРАБОТЧИКИ С DEBOUNCE
  const handleBuy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) {
      console.log('👑 Кнопка уже обрабатывается, игнорируем');
      return;
    }
    
    setIsProcessing(true);
    console.log('👑 Кнопка "Купить" нажата');
    
    try {
      onClose(); // Сразу закрываем
      await new Promise(resolve => setTimeout(resolve, 100)); // Небольшая задержка для UI
      onBuyPremium();
    } finally {
      setTimeout(() => setIsProcessing(false), 1000); // Защита от спама
    }
  }, [isProcessing, onClose, onBuyPremium]);

  const handleLater = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;
    
    console.log('👑 Кнопка "Позже" нажата');
    onClose();
  }, [isProcessing, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: '5%'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        padding: '25px',
        borderRadius: '20px',
        border: '2px solid #FFD700',
        width: '90%',
        maxWidth: '500px',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '15px' }}>👑</div>
        
        <h3 style={{ color: '#FFD700', marginBottom: '15px', fontSize: '1.3rem' }}>
          Устали от рекламы?
        </h3>
        
        <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '0.9rem' }}>
          Отключите рекламу и получайте награды автоматически!
        </p>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            padding: '12px', 
            background: 'rgba(255, 215, 0, 0.1)', 
            borderRadius: '12px',
            border: '1px solid #FFD700'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>🚫 Без рекламы на 30 дней</div>
            <div style={{ fontSize: '0.9rem', color: '#FFD700', marginTop: '5px' }}>
              150 ⭐ Stars или 1 💎 TON
            </div>
          </div>
          
          <div style={{ 
            padding: '12px', 
            background: 'rgba(255, 215, 0, 0.2)', 
            borderRadius: '12px',
            border: '2px solid #FFD700',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-8px',
              right: '10px',
              background: '#FFD700',
              color: '#000',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}>
              🏆 ВЫГОДНО
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>👑 Без рекламы НАВСЕГДА</div>
            <div style={{ fontSize: '0.9rem', color: '#FFD700', marginTop: '5px' }}>
              1500 ⭐ Stars или 10 💎 TON
            </div>
            <div style={{ fontSize: '0.8rem', color: '#90EE90', marginTop: '3px' }}>
              💰 Экономия до 90%!
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBuy}
            disabled={isProcessing}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '14px 20px',
              background: isProcessing ? '#666' : 'linear-gradient(45deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '12px',
              color: isProcessing ? '#ccc' : '#000',
              fontWeight: 'bold',
              cursor: isProcessing ? 'wait' : 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            {isProcessing ? '⏳ Обработка...' : '💳 Купить премиум'}
          </button>
          
          <button
            onClick={handleLater}
            disabled={isProcessing}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid #666',
              borderRadius: '12px',
              color: isProcessing ? '#666' : '#ccc',
              cursor: isProcessing ? 'wait' : 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            ⏰ Позже
          </button>
        </div>
      </div>
    </div>
  );
});

PremiumOfferModal.displayName = 'PremiumOfferModal';
// MainPage.tsx - ЧАСТЬ 3 из 6 - ДОБАВИТЬ ПОСЛЕ ЧАСТИ 2

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

  // 👑 ОПТИМИЗИРОВАННОЕ ПРЕМИУМ СОСТОЯНИЕ
  const [premiumStatus, setPremiumStatus] = useState<any>(null);
  const [showPremiumOffer, setShowPremiumOffer] = useState(false);
  const premiumInitialized = useRef(false);
  const lastTelegramId = useRef<string | null>(null);

  // 🔐 БЕЗОПАСНАЯ ПРОВЕРКА АДМИНА ЧЕРЕЗ API
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  
  // Добавляем состояние для тостов
  const [toasts, setToasts] = useState<any[]>([]);
  const nextToastId = React.useRef(0);

  // Дополнительные состояния
  const [shopButtons, setShopButtons] = useState<ShopButton[]>([]);
  const [initialAsteroidTotals, setInitialAsteroidTotals] = useState<{ [key: number]: number }>({});
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [targetSystem, setTargetSystem] = useState<number | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning', duration = 3000) => {
    const id = nextToastId.current++;
    const newToast = { id, message, type, duration };
    setToasts(prevToasts => [...prevToasts, newToast]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);
// MainPage.tsx - ЧАСТЬ 4 из 6 - ЗАМЕНИТЬ ПРЕДЫДУЩУЮ ЧАСТЬ 4 (ЧИСТАЯ ВЕРСИЯ)

  // 👑 ОПТИМИЗИРОВАННАЯ ИНИЦИАЛИЗАЦИЯ ПРЕМИУМ СЕРВИСА (ТОЛЬКО ОДИН РАЗ)
  useEffect(() => {
    const initializePremiumService = async () => {
      if (!player?.telegram_id || premiumInitialized.current || lastTelegramId.current === player.telegram_id) {
        return;
      }

      try {
        premiumInitialized.current = true;
        lastTelegramId.current = player.telegram_id;
        
        // Устанавливаем ID игрока
        premiumAdService.setTelegramId(player.telegram_id);
        
        // Инициализируем сервис с Adsgram блоком
        const ADSGRAM_BLOCK_ID = process.env.REACT_APP_ADSGRAM_BLOCK_ID || '13245';
        
        await premiumAdService.initialize(ADSGRAM_BLOCK_ID);
        
        // Получаем премиум статус
        const status = await premiumAdService.refreshPremiumStatus();
        setPremiumStatus(status);
        
      } catch (err) {
        console.error('Premium service initialization failed:', err);
        premiumInitialized.current = false; // Сбрасываем при ошибке
      }
    };

    initializePremiumService();
  }, [player?.telegram_id]); // Только telegram_id в зависимостях

  // Проверяем админский статус через API (ТОЛЬКО ОДИН РАЗ)
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!player?.telegram_id) {
        setIsAdmin(false);
        setAdminCheckLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`${API_URL}/api/admin/check/${player.telegram_id}`);
        const adminStatus = response.data.isAdmin;
        
        setIsAdmin(adminStatus);
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [player?.telegram_id]);

  useEffect(() => {
    if (player && !player.unlocked_systems?.includes(currentSystem)) {
      setTargetSystem(currentSystem);
      setShowUnlockModal(true);
    }
  }, [currentSystem, player]);

  useEffect(() => {
    if (player && (!player.unlocked_systems || player.unlocked_systems.length === 0)) {
      setTargetSystem(1);
      setShowUnlockModal(true);
    }
  }, [player]);

  useEffect(() => {
    if (!player || isTonSystem) return;
    
    fetchMaxItems().then(({ maxAsteroids, maxDrones }) => {
      const asteroidCount = player.asteroids.filter((a: Asteroid) => a.system === currentSystem && a.id <= 12).length;
      const remainingResources = Math.floor((player.asteroid_total_data?.[currentSystem] || 0) * 100000) / 100000;
      const miningSpeed = player.mining_speed_data?.[currentSystem] || 0;
      const speedPerHour = (miningSpeed * 3600).toFixed(2);
      const realCargoCapacity = getRealCargoCapacity(currentSystem);
      
      const maxMainAsteroids = 12;
      
      setShopButtons([
        {
          type: 'resources',
          count: `${asteroidCount}/${maxMainAsteroids}`,
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
  }, [player, currentSystem, getRealCargoCapacity, t]);
// MainPage.tsx - ЧАСТЬ 5 из 6 - ЗАМЕНИТЬ ПРЕДЫДУЩУЮ ЧАСТЬ 5 (ЧИСТАЯ ВЕРСИЯ)

  // 🎯 ОПТИМИЗИРОВАННАЯ ПРОВЕРКА НУЖДЫ В РЕКЛАМЕ
  const needsAdForCollection = useMemo(() => {
    // Системы 1-4 требуют рекламу, если игрок не верифицирован И НЕ ПРЕМИУМ
    if (currentSystem >= 1 && currentSystem <= 4) {
      // Если есть премиум - реклама не нужна
      if (premiumStatus?.hasPremium) {
        return false;
      }
      return !player?.verified; // Если не верифицирован - нужна реклама
    }
    return false; // Система 5 (TON) - реклама не нужна
  }, [currentSystem, player?.verified, premiumStatus?.hasPremium]);

  const performCollection = useCallback(async () => {
    setIsCollecting(true);
    
    try {
      const currentValue = getCurrentValue(currentSystem);
      
      if (currentValue <= 0) {
        addToast(t('no_resources_to_collect'), 'warning');
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
        addToast(`${t('collected')} ${currentValue.toFixed(5)} ${currentSystem === 4 ? 'CS' : 'CCC'}`, 'success');
      }
    } catch (err) {
      console.error('Collection error:', err);
      addToast(t('collection_error', { error: err }), 'error');
    } finally {
      setIsCollecting(false);
    }
  }, [getCurrentValue, currentSystem, addToast, t, player, safeCollect, resetCleanCounter]);

  const handleCreateNewStake = useCallback(() => {
    if (currentSystem === 5) {
      setTargetSystem(5);
      setShowUnlockModal(true);
    }
  }, [currentSystem]);

  const handleSafeClick = useCallback(async () => {
    if (!player?.telegram_id || isCollecting || isWatchingAd) {
      return;
    }

    const currentValue = getCurrentValue(currentSystem);
    
    if (currentValue <= 0) {
      addToast(t('no_resources_to_collect'), 'warning');
      return;
    }

    // Проверяем нужна ли реклама
    if (needsAdForCollection) {
      await handleAdBeforeCollection();
    } else {
      await performCollection();
    }
  }, [player?.telegram_id, isCollecting, isWatchingAd, getCurrentValue, currentSystem, needsAdForCollection, addToast, t, performCollection]);

  // 👑 ОБНОВЛЕННАЯ ФУНКЦИЯ РЕКЛАМЫ С ПРЕМИУМОМ
  const handleAdBeforeCollection = useCallback(async () => {
    setIsWatchingAd(true);
    
    try {
      const adResult: PremiumAdResult = await premiumAdService.showRewardedAd();
      
      if (adResult.success) {
        if (adResult.skipped) {
          // Премиум пользователь
          addToast('👑 Премиум награда! Сбор выполняется автоматически.', 'success');
        } else {
          // Обычная реклама просмотрена
          addToast('🎯 Реклама просмотрена! Награда получена.', 'success');
          
          // Проверяем, нужно ли показать предложение премиума
          if (!adResult.premium?.hasPremium) {
            // Показываем предложение премиума сразу после успешной рекламы
            setTimeout(() => setShowPremiumOffer(true), 500);
          }
        }
        
        // 🎯 ВАЖНО: ВСЕГДА ВЫПОЛНЯЕМ СБОР ПОСЛЕ УСПЕШНОЙ РЕКЛАМЫ
        await performCollection();
      } else {
        addToast('Для сбора ресурсов необходимо просмотреть рекламу до конца', 'warning');
      }
    } catch (err) {
      console.error('Ad display error:', err);
      addToast('Ошибка при показе рекламы. Попробуйте еще раз.', 'error');
    } finally {
      setIsWatchingAd(false);
    }
  }, [addToast, performCollection]);

  const handlePurchase = useCallback((type: string) => () => {
    navigate('/shop', { state: { tab: type === 'resources' ? 'asteroid' : type } });
  }, [navigate]);

  // 🎯 ИСПРАВЛЕННЫЕ ОБРАБОТЧИКИ ПРЕМИУМ МОДАЛКИ - ВСЕГДА ВЫПОЛНЯЕМ СБОР
  const handleClosePremiumOffer = useCallback(async () => {
    setShowPremiumOffer(false);
    
    // 🎯 ВЫПОЛНЯЕМ СБОР ДАЖЕ ЕСЛИ НАЖАЛИ "ПОЗЖЕ"
    setTimeout(async () => {
      await performCollection();
    }, 100);
  }, [performCollection]);

  const handleBuyPremium = useCallback(async () => {
    // 🎯 СНАЧАЛА ВЫПОЛНЯЕМ СБОР, ПОТОМ ПЕРЕХОДИМ
    await performCollection();
    
    // Небольшая задержка для завершения сбора
    setTimeout(() => {
      navigate('/wallet');
    }, 500);
  }, [navigate, performCollection]);

  const handleSystemChange = useCallback((systemId: number) => {
    if (!player) return;
    
    if (player.unlocked_systems?.includes(systemId)) {
      setCurrentSystem(systemId);
    } else {
      setTargetSystem(systemId);
      setShowUnlockModal(true);
    }
    setShowSystemDropdown(false);
  }, [player, setCurrentSystem]);

  const handleUnlockSuccess = useCallback(async () => {
    setShowUnlockModal(false);
    if (targetSystem) {
      setTimeout(async () => {
        await refreshPlayer();
        setCurrentSystem(targetSystem);
        setTargetSystem(null);
      }, 100);
    }
  }, [targetSystem, refreshPlayer, setCurrentSystem]);

  const handleUnlockCancel = useCallback(() => {
    setShowUnlockModal(false);
    setTargetSystem(null);
    if (player?.unlocked_systems?.length > 0) {
      setCurrentSystem(Math.max(...player.unlocked_systems));
    }
  }, [player, setCurrentSystem]);

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

  if (!player) return <div>{t('loading')}</div>;

  const systemNames = [
    t('system_1_name'),
    t('system_2_name'),
    t('system_3_name'),
    t('system_4_name'),
    t('system_5_name')
  ];

  const systemName = t('system_display_format', {
    number: currentSystem,
    name: systemNames[currentSystem - 1]
  });
  
  const colorStyle = player.color || '#00f0ff';
  const isTonSystem = currentSystem === 5;
  const cargoLevelId = player.cargo_levels.find((c: CargoLevel) => c.system === currentSystem)?.id || 0;

// MainPage.tsx - ЧАСТЬ 6 из 6 - ДОБАВИТЬ ПОСЛЕ ЧАСТИ 5

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

    {/* 👑 НЕБОЛЬШОЙ ПРЕМИУМ ИНДИКАТОР */}
    {premiumStatus?.hasPremium && (
      <div style={{
        position: 'fixed',
        top: '75px',
        right: '15px',
        background: 'rgba(255, 215, 0, 0.8)',
        color: '#000',
        padding: '4px 8px',
        borderRadius: '8px',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '3px'
      }}>
        👑
        {premiumStatus.type === 'temporary' && premiumStatus.daysLeft && (
          <span style={{ fontSize: '0.6rem' }}>
            {premiumStatus.daysLeft}д
          </span>
        )}
      </div>
    )}

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
                  {isWatchingAd ? (premiumStatus?.hasPremium ? '👑' : '📺') : '⏳'}
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '1.5rem', color: colorStyle, textShadow: `0 0 5px ${colorStyle}`, marginTop: '10px' }}>
              {getCurrentValue(currentSystem).toFixed(5)} {currentSystem === 4 ? 'CS' : currentSystem === 5 ? 'TON' : 'CCC'}
            </p>
            
          </div>
        </>
      )}

      {/* 🔧 БЕЗОПАСНАЯ АДМИНСКАЯ КНОПКА */}
      {!adminCheckLoading && isAdmin && (
        <div style={{
          margin: '30px auto 20px',
          textAlign: 'center'
        }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              color: '#fff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
            }}
          >
            🔧 Админ панель
          </button>
        </div>
      )}
    </div>
    
    {/* Контейнер для тостов */}
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          colorStyle={colorStyle}
        />
      ))}
    </div>

    {/* 👑 ОПТИМИЗИРОВАННОЕ ПРЕМИУМ ПРЕДЛОЖЕНИЕ */}
    <PremiumOfferModal 
      isVisible={showPremiumOffer}
      onClose={handleClosePremiumOffer}
      onBuyPremium={handleBuyPremium}
    />

    <style>
      {`
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
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