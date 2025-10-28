/**
 * 🌌 GALACTIC EMPIRE v2.0
 *
 * Новая версия игры с нуля:
 * - Система рас (Amarr, Caldari, Gallente, Minmatar, Human, Zerg)
 * - Auto и Manual режимы боя
 * - PvE и PvP
 * - Система ремонта
 * - Добыча оружия
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../../../context/PlayerContext';
import axios from 'axios';
import RaceSelection from './RaceSelection';
import Hangar from './Hangar';
import Formation from './Formation';
import BattleHistory from './BattleHistory';
import BattleReplay from './BattleReplay';
import BattleScreen from './components/BattleScreen';
import LuminiosExchange from './LuminiosExchange';
import ModuleWorkshop from './ModuleWorkshop';
import { premiumAdService } from '../../../services/premiumAwareAdService';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

// Компонент для отображения строящегося корабля с таймером
const BuildingShipItem: React.FC<{ ship: any; lang: string; onShipReady?: () => void }> = ({ ship, lang, onShipReady }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [shipReady, setShipReady] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const buildTime = new Date(ship.built_at).getTime();
      const remaining = Math.max(0, Math.floor((buildTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && !shipReady) {
        // ✅ Корабль построен - вызываем callback вместо reload
        setShipReady(true);
        if (onShipReady) {
          onShipReady();
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [ship.built_at, shipReady, onShipReady]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}${lang === 'ru' ? 'с' : 's'}`;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}${lang === 'ru' ? 'м' : 'm'} ${secs}${lang === 'ru' ? 'с' : 's'}`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}${lang === 'ru' ? 'ч' : 'h'} ${mins}${lang === 'ru' ? 'м' : 'm'}`;
  };

  const shipNames: any = {
    frigate_t1: { ru: 'Лёгкий фрегат', en: 'Light Frigate' },
    frigate_t2: { ru: 'Штурмовой фрегат', en: 'Assault Frigate' },
    destroyer_t1: { ru: 'Лёгкий эсминец', en: 'Light Destroyer' },
    destroyer_t2: { ru: 'Тяжёлый эсминец', en: 'Heavy Destroyer' },
    cruiser_t1: { ru: 'Боевой крейсер', en: 'Combat Cruiser' },
    cruiser_t2: { ru: 'Тяжёлый штурмовой крейсер', en: 'Heavy Assault Cruiser' },
    battleship_t1: { ru: 'Линкор', en: 'Battleship' },
    battleship_t2: { ru: 'Дредноут', en: 'Dreadnought' }
  };

  const shipName = shipNames[ship.ship_type]?.[lang] || ship.ship_type;

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '10px',
      padding: '12px',
      marginBottom: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
          {shipName}
        </div>
        <div style={{
          fontSize: '0.85rem',
          color: timeLeft === 0 ? '#4CAF50' : '#FFA500'
        }}>
          {timeLeft === 0
            ? (lang === 'ru' ? '✅ Готов!' : '✅ Ready!')
            : `⏱️ ${formatTime(timeLeft)}`
          }
        </div>
      </div>
      <div style={{
        width: '80px',
        height: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${timeLeft === 0 ? 100 : ((5 - timeLeft) / 5) * 100}%`,
          height: '100%',
          background: timeLeft === 0 ? '#4CAF50' : '#FFA500',
          transition: 'width 1s linear'
        }} />
      </div>
    </div>
  );
};

const GalacticEmpire: React.FC = () => {
  const { player, updatePlayer } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [empireData, setEmpireData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRaceSelection, setShowRaceSelection] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    // Проверяем localStorage - видел ли игрок приветствие
    return localStorage.getItem(`galactic_empire_welcome_${player?.telegram_id}`) === 'true';
  });
  const [buildingShips, setBuildingShips] = useState<any[]>([]);

  // NEW: State for screens
  const [currentScreen, setCurrentScreen] = useState<'main' | 'hangar' | 'formation' | 'battles' | 'exchange' | 'modules'>('main');
  const [ships, setShips] = useState<any[]>([]);
  const [formationShipIds, setFormationShipIds] = useState<number[]>([]);
  const [formationShips, setFormationShips] = useState<any[]>([]);
  const [battles, setBattles] = useState<any[]>([]);
  const [showBattleReplay, setShowBattleReplay] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedShipForModules, setSelectedShipForModules] = useState<any>(null);

  // Вынесли loadEmpireData из useEffect
  const loadEmpireData = async () => {
    if (!player?.telegram_id) return;

    try {
      const [playerResponse, shipsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/galactic-empire/player/${player.telegram_id}`),
        axios.get(`${API_URL}/api/galactic-empire/ships/${player.telegram_id}`)
      ]);

      setEmpireData(playerResponse.data);

      // Фильтруем строящиеся корабли (built_at > NOW)
      const allShips = shipsResponse.data;
      if (process.env.NODE_ENV === 'development') console.log('📦 All ships from API:', allShips);

      const building = allShips.filter((ship: any) => new Date(ship.built_at) > new Date());
      const ready = allShips.filter((ship: any) => new Date(ship.built_at) <= new Date());

      if (process.env.NODE_ENV === 'development') console.log('⏱️ Building ships:', building);
      if (process.env.NODE_ENV === 'development') console.log('✅ Ready ships:', ready);

      setBuildingShips(building);
      setShips(ready);

      // Загружаем формацию
      try {
        if (process.env.NODE_ENV === 'development') console.log('🔄 Loading formation for player:', player.telegram_id);
        const formationRes = await axios.get(`${API_URL}/api/galactic-empire/formation/${player.telegram_id}`);
        if (process.env.NODE_ENV === 'development') console.log('⚔️ Formation data:', formationRes.data);

        if (formationRes.data.shipIds) {
          setFormationShipIds(formationRes.data.shipIds);
          setFormationShips(formationRes.data.ships || []);
          if (process.env.NODE_ENV === 'development') console.log('✅ Formation loaded:', formationRes.data.shipIds);
        } else {
          if (process.env.NODE_ENV === 'development') console.log('ℹ️ No formation found, starting empty');
        }
      } catch (error) {
        console.error('❌ Failed to load formation:', error);
      }

      // Проверяем - новый ли игрок (создан менее 5 минут назад) И не видел ли он уже приветствие
      const playerData = playerResponse.data.player;
      if (playerData?.created_at && !hasSeenWelcome) {
        const createdAt = new Date(playerData.created_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

        // Если игрок создан менее 5 минут назад - показываем приветственный экран
        if (diffMinutes < 5) {
          setShowWelcome(true);
        }
      }
    } catch (error: any) {
      // Если игрока нет - значит нужен выбор расы
      if (error.response?.status === 404) {
        setShowRaceSelection(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Проверяем query параметр для показа выбора расы
    const params = new URLSearchParams(location.search);
    if (params.get('showRaceSelection') === 'true') {
      setShowRaceSelection(true);
      setLoading(false);
      return;
    }

    if (!player?.telegram_id) return;

    const init = async () => {
      await loadEmpireData();
      await loadModules();
    };

    init();
  }, [player?.telegram_id, location.search]);

  // NEW: Load ships and formation
  const loadShipsAndFormation = async () => {
    if (!player?.telegram_id) return;

    try {
      const [shipsRes, formationRes] = await Promise.all([
        axios.get(`${API_URL}/api/galactic-empire/ships/${player.telegram_id}`),
        axios.get(`${API_URL}/api/galactic-empire/formation/${player.telegram_id}`)
      ]);

      const allShips = shipsRes.data;
      const buildingShips = allShips.filter((ship: any) => new Date(ship.built_at) > new Date());
      const readyShips = allShips.filter((ship: any) => new Date(ship.built_at) <= new Date());

      setBuildingShips(buildingShips); // ✅ Обновляем список строящихся
      setShips(readyShips);

      if (formationRes.data.shipIds) {
        setFormationShipIds(formationRes.data.shipIds);
        setFormationShips(formationRes.data.ships || []);
      }
    } catch (error) {
      console.error('Failed to load ships:', error);
    }
  };

  // NEW: Load battles
  const loadBattles = async () => {
    if (!player?.telegram_id) return;

    try {
      const res = await axios.get(`${API_URL}/api/galactic-empire/battles/history/${player.telegram_id}?limit=10`);
      setBattles(res.data);
    } catch (error) {
      console.error('Failed to load battles:', error);
    }
  };

  // NEW: Handlers
  const handleAddToFormation = async (shipId: number) => {
    if (process.env.NODE_ENV === 'development') console.log('🔧 handleAddToFormation called with shipId:', shipId);
    if (process.env.NODE_ENV === 'development') console.log('Current formationShipIds:', formationShipIds);

    if (formationShipIds.length >= 5) {
      alert(lang === 'ru' ? 'Формация заполнена (макс. 5 кораблей)' : 'Formation is full (max 5 ships)');
      return;
    }

    try {
      const newShipIds = [...formationShipIds, shipId];
      if (process.env.NODE_ENV === 'development') console.log('Sending to API:', { telegramId: player.telegram_id, shipIds: newShipIds });

      const response = await axios.post(`${API_URL}/api/galactic-empire/formation/update`, {
        telegramId: player.telegram_id,
        shipIds: newShipIds
      });

      if (process.env.NODE_ENV === 'development') console.log('API Response:', response.data);

      setFormationShipIds(newShipIds);
      const ship = ships.find(s => s.id === shipId);
      if (ship) {
        setFormationShips([...formationShips, ship]);
        if (process.env.NODE_ENV === 'development') console.log('✅ Ship added to formation:', ship);
      }
    } catch (error: any) {
      console.error('❌ Failed to add to formation:', error);
      console.error('Error details:', error.response?.data);
      alert(`Ошибка: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleRemoveFromFormation = async (shipId: number) => {
    try {
      const newShipIds = formationShipIds.filter(id => id !== shipId);
      await axios.post(`${API_URL}/api/galactic-empire/formation/update`, {
        telegramId: player.telegram_id,
        shipIds: newShipIds
      });

      setFormationShipIds(newShipIds);
      setFormationShips(formationShips.filter(s => s.id !== shipId));
    } catch (error) {
      console.error('Failed to remove from formation:', error);
    }
  };

  const handleRepairShip = async (shipId: number) => {
    try {
      const res = await axios.post(`${API_URL}/api/galactic-empire/ships/repair`, {
        telegramId: player.telegram_id,
        shipId
      });

      // Reload ships and update balance
      await loadShipsAndFormation();
      if (empireData?.player) {
        setEmpireData({
          ...empireData,
          player: {
            ...empireData.player,
            luminios_balance: res.data.newBalance
          }
        });
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Repair failed');
    }
  };

  const handleUpgradeShip = async (shipId: number) => {
    try {
      const res = await axios.post(`${API_URL}/api/galactic-empire/ships/upgrade`, {
        telegramId: player.telegram_id,
        shipId
      });

      // Reload ships and update balance
      await loadShipsAndFormation();
      if (empireData?.player) {
        setEmpireData({
          ...empireData,
          player: {
            ...empireData.player,
            luminios_balance: res.data.newBalance
          }
        });
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Upgrade failed');
    }
  };

  // Load modules
  const loadModules = async () => {
    if (!player?.telegram_id) return;
    try {
      const res = await axios.get(`${API_URL}/api/galactic-empire/modules/${player.telegram_id}`);
      setModules(res.data);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  // Equip module
  const handleEquipModule = async (shipId: number, slotNumber: number, moduleType: string, moduleTier: number) => {
    try {
      await axios.post(`${API_URL}/api/galactic-empire/ships/module/equip`, {
        telegramId: player.telegram_id,
        shipId,
        slotNumber,
        moduleType,
        moduleTier
      });
      await loadShipsAndFormation();
      await loadModules();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to equip module');
      throw error;
    }
  };

  // Unequip module
  const handleUnequipModule = async (shipId: number, slotNumber: number) => {
    try {
      await axios.post(`${API_URL}/api/galactic-empire/ships/module/unequip`, {
        telegramId: player.telegram_id,
        shipId,
        slotNumber
      });
      await loadShipsAndFormation();
      await loadModules();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to unequip module');
      throw error;
    }
  };

  const handleStartBattle = async () => {
    if (process.env.NODE_ENV === 'development') console.log('⚔️ handleStartBattle called');
    if (process.env.NODE_ENV === 'development') console.log('Formation ships:', formationShips);

    if (formationShips.length === 0) {
      alert(lang === 'ru' ? 'Добавьте корабли в формацию!' : 'Add ships to formation!');
      return;
    }

    const allAlive = formationShips.every(ship => ship.current_hp > 0);
    if (process.env.NODE_ENV === 'development') console.log('All ships alive?', allAlive);

    if (!allAlive) {
      alert(lang === 'ru' ? 'Отремонтируйте повреждённые корабли!' : 'Repair damaged ships!');
      return;
    }

    try {
      setLoading(true);

      // 📺 Показываем рекламу перед боем (с учетом премиума)
      if (process.env.NODE_ENV === 'development') console.log('📺 Показываю рекламу перед боем...');
      premiumAdService.setTelegramId(player.telegram_id);
      const adResult = await premiumAdService.showAd();

      if (!adResult.success && !adResult.skipped) {
        if (process.env.NODE_ENV === 'development') console.log('❌ Реклама не была просмотрена');
        setLoading(false);
        return;
      }

      if (process.env.NODE_ENV === 'development') console.log('🚀 Starting PvE battle for player:', player.telegram_id);

      const res = await axios.post(`${API_URL}/api/galactic-empire/battles/start-pve`, {
        telegramId: player.telegram_id
      });

      if (process.env.NODE_ENV === 'development') console.log('✅ Battle completed:', res.data);
      if (process.env.NODE_ENV === 'development') console.log('🏆 Winner from server:', res.data.winner);

      // Show battle replay
      setShowBattleReplay({
        battleLog: res.data.battleLog,
        playerFleet: res.data.playerFleet,
        enemyFleet: res.data.botFleet,
        winner: res.data.winner,
        reward: res.data.reward
      });

      // Update balance
      if (res.data.reward > 0 && empireData?.player) {
        setEmpireData({
          ...empireData,
          player: {
            ...empireData.player,
            luminios_balance: empireData.player.luminios_balance + res.data.reward
          }
        });
      }
    } catch (error: any) {
      console.error('❌ Battle failed:', error);
      console.error('Error details:', error.response?.data);
      alert(error.response?.data?.error || 'Battle failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReplayBattle = async (battleId: number) => {
    try {
      const res = await axios.get(`${API_URL}/api/galactic-empire/battles/${battleId}`);
      const battle = res.data;
      const battleLog = JSON.parse(battle.battle_log);

      // Reconstruct fleets from battle log
      const reconstructFleet = (fleetNum: number) => {
        const shipsMap = new Map();

        battleLog.forEach((action: any) => {
          if (action.attacker.fleet === fleetNum) {
            if (!shipsMap.has(action.attacker.shipId)) {
              shipsMap.set(action.attacker.shipId, {
                id: action.attacker.shipId,
                ship_type: action.attacker.shipType,
                ship_class: action.attacker.shipType.split('_')[0],
                tier: 1,
                current_hp: 100,
                max_hp: 100,
                attack: 50,
                defense: 30,
                speed: 50
              });
            }
          }
          if (action.target.fleet === fleetNum) {
            if (!shipsMap.has(action.target.shipId)) {
              shipsMap.set(action.target.shipId, {
                id: action.target.shipId,
                ship_type: action.target.shipType,
                ship_class: action.target.shipType.split('_')[0],
                tier: 1,
                current_hp: 100,
                max_hp: 100,
                attack: 50,
                defense: 30,
                speed: 50
              });
            }
          }
        });

        return Array.from(shipsMap.values());
      };

      const playerFleet = reconstructFleet(1);
      const enemyFleet = reconstructFleet(2);

      setShowBattleReplay({
        battleLog,
        playerFleet,
        enemyFleet,
        winner: battle.winner === player.telegram_id ? 1 : 2,
        reward: battle.reward_luminios
      });
    } catch (error) {
      console.error('Failed to load battle:', error);
      alert('Failed to load battle');
    }
  };

  // Callback для успешного выбора расы
  const handleRaceSelected = async () => {
    setShowRaceSelection(false);
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/galactic-empire/player/${player.telegram_id}`);
      setEmpireData(response.data);
      setShowWelcome(true); // Показываем приветственный экран
    } catch (error) {
      console.error('Failed to load empire data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Показываем выбор расы если параметр установлен
  if (showRaceSelection) {
    return <RaceSelection onRaceSelected={handleRaceSelected} />;
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🌌</div>
          <div>Загрузка Galactic Empire...</div>
        </div>
      </div>
    );
  }

  // Если нет данных - показываем приветственный экран
  if (!empireData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        padding: '20px'
      }}>
        <button
          onClick={() => navigate('/attack')}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid #fff',
            borderRadius: '10px',
            padding: '10px 20px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          ← Назад
        </button>

        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #9d4edd, #c77dff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🌌 GALACTIC EMPIRE v2.0
        </h1>

        <div style={{
          background: 'rgba(255, 0, 110, 0.2)',
          border: '2px solid #ff006e',
          borderRadius: '15px',
          padding: '15px 30px',
          marginBottom: '40px'
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>BETA ВЕРСИЯ</span>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '500px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#c77dff', marginBottom: '20px' }}>
            Добро пожаловать в Galactic Empire!
          </h2>
          <p style={{ color: '#ccc', lineHeight: '1.6', marginBottom: '30px' }}>
            Это новая версия игры, переписанная с нуля.<br/>
            Выберите расу для начала игры.
          </p>
          <button
            onClick={() => setShowRaceSelection(true)}
            style={{
              background: 'linear-gradient(135deg, #9d4edd, #7b2cbf)',
              border: '2px solid #c77dff',
              borderRadius: '15px',
              padding: '15px 40px',
              color: '#fff',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 5px 20px rgba(157, 78, 221, 0.6)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(157, 78, 221, 0.8)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 5px 20px rgba(157, 78, 221, 0.6)';
            }}
          >
            🚀 Выбрать расу
          </button>
        </div>
      </div>
    );
  }

  const lang = (player?.language || 'en') as 'en' | 'ru';
  const raceData = empireData?.player;

  // Получаем цвет расы из конфига
  const RACE_COLORS: Record<string, string> = {
    amarr: '#FFD700',
    caldari: '#4169E1',
    gallente: '#32CD32',
    minmatar: '#DC143C',
    human: '#00f0ff',
    zerg: '#9D4EDD'
  };

  const raceColor = RACE_COLORS[raceData?.race] || '#9d4edd';

  // Данные рас для приветственного экрана
  const RACES_INFO: Record<string, any> = {
    amarr: {
      name: { en: 'Amarr Empire', ru: 'Империя Амарр' },
      description: {
        en: 'Golden ships with powerful armor. Religious empire with laser weapons and monumental cathedral-like designs.',
        ru: 'Золотые корабли с мощной бронёй. Религиозная империя с лазерным оружием и монументальным дизайном.'
      },
      weaponName: { en: 'Lasers', ru: 'Лазеры' },
      specialAbility: {
        name: { en: 'Divine Light', ru: 'Божественный свет' },
        description: { en: '10% chance to completely ignore damage', ru: '10% шанс полностью игнорировать урон' }
      }
    },
    caldari: {
      name: { en: 'Caldari State', ru: 'Государство Калдари' },
      description: {
        en: 'Militaristic ships with powerful shields and missiles. Dark grey and blue angular corporate-military design.',
        ru: 'Милитаристские корабли с мощными щитами и ракетами. Тёмно-серый и синий угловатый военно-корпоративный дизайн.'
      },
      weaponName: { en: 'Missiles', ru: 'Ракеты' },
      specialAbility: {
        name: { en: 'Missile Volley', ru: 'Залп ракет' },
        description: { en: '15% chance to shoot twice', ru: '15% шанс выстрелить дважды' }
      }
    },
    gallente: {
      name: { en: 'Gallente Federation', ru: 'Федерация Галленте' },
      description: {
        en: 'Versatile ships with drones and hybrid weapons. Metallic with green and blue tones, rounded forms.',
        ru: 'Универсальные корабли с дронами и гибридным оружием. Металлик с зелёными и синими тонами, округлые формы.'
      },
      weaponName: { en: 'Drones', ru: 'Дроны' },
      specialAbility: {
        name: { en: 'Drone Swarm', ru: 'Рой дронов' },
        description: { en: 'Drones attack all enemies simultaneously', ru: 'Дроны атакуют всех врагов одновременно' }
      }
    },
    minmatar: {
      name: { en: 'Minmatar Republic', ru: 'Республика Минматар' },
      description: {
        en: 'Fast ships with powerful artillery. Industrial brown-red designs welded from metal scraps.',
        ru: 'Быстрые корабли с мощной артиллерией. Индустриальный коричнево-красный дизайн, сваренный из обрезков металла.'
      },
      weaponName: { en: 'Artillery', ru: 'Артиллерия' },
      specialAbility: {
        name: { en: 'Critical Shot', ru: 'Критический выстрел' },
        description: { en: '20% chance to deal x3 damage', ru: '20% шанс нанести урон x3' }
      }
    },
    human: {
      name: { en: 'Human Alliance', ru: 'Альянс Людей' },
      description: {
        en: 'Earth ships with universal design and armament. Balanced characteristics and adaptive combat style.',
        ru: 'Земные корабли с универсальным дизайном и вооружением. Сбалансированные характеристики и адаптивный стиль боя.'
      },
      weaponName: { en: 'Ballistics', ru: 'Баллистика' },
      specialAbility: {
        name: { en: 'Adaptation', ru: 'Адаптация' },
        description: { en: 'Bonus against enemy weapon type', ru: 'Бонус против типа оружия противника' }
      }
    },
    zerg: {
      name: { en: 'Zerg Swarm', ru: 'Рой Зергов' },
      description: {
        en: 'Organic bio-ships. Fast regeneration but requires daily login. Without daily login ALL ships lose 1% HP permanently from their original value each day (up to 10% total)!',
        ru: 'Органические био-корабли. Быстрая регенерация, но требуется ежедневный вход. Без ежедневного входа ВСЕ корабли теряют 1% HP навсегда от первоначального значения каждый день (до 10% максимум)!'
      },
      weaponName: { en: 'Bio-weapons', ru: 'Био-оружие' },
      specialAbility: {
        name: { en: 'Infestation', ru: 'Заражение' },
        description: { en: 'Enemy takes damage for 3 rounds', ru: 'Враг получает урон в течение 3 раундов' }
      }
    }
  };

  const selectedRaceInfo = RACES_INFO[raceData?.race];

  // Показываем приветственный экран после выбора расы
  if (showWelcome && selectedRaceInfo) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0f0a1a 100%)',
        color: '#fff',
        padding: '20px',
        overflowY: 'auto'
      }}>
        {/* Поздравление */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          marginTop: '20px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            background: `linear-gradient(135deg, ${raceColor}, #c77dff)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            {lang === 'ru' ? '🎉 Поздравляем!' : '🎉 Congratulations!'}
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#ccc', lineHeight: '1.6' }}>
            {lang === 'ru'
              ? 'Добро пожаловать в захватывающий мир космических боёв!'
              : 'Welcome to the exciting world of space battles!'}
          </p>
          <p style={{ fontSize: '1rem', color: raceColor, marginTop: '10px' }}>
            {lang === 'ru'
              ? `Вы присоединились к ${selectedRaceInfo.name.ru}`
              : `You have joined ${selectedRaceInfo.name.en}`}
          </p>
        </div>

        {/* Карточка расы */}
        <div style={{
          maxWidth: '700px',
          margin: '0 auto 30px',
          background: `linear-gradient(135deg, ${raceColor}20, rgba(0, 0, 0, 0.3))`,
          border: `2px solid ${raceColor}`,
          borderRadius: '20px',
          padding: '25px',
          boxShadow: `0 0 30px ${raceColor}60`
        }}>
          {/* Изображение квадратное */}
          <div style={{
            width: '100%',
            aspectRatio: '1',
            maxWidth: '400px',
            margin: '0 auto 20px',
            background: `linear-gradient(135deg, ${raceColor}10, rgba(0, 0, 0, 0.3))`,
            borderRadius: '15px',
            overflow: 'hidden'
          }}>
            <img
              src={`/assets/galactic-empire/races/${raceData.race}.png`}
              alt={selectedRaceInfo.name[lang]}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 5rem;">🚀</div>';
              }}
            />
          </div>

          {/* Расширенное описание расы */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '15px' }}>
              {lang === 'ru' ? (
                raceData.race === 'amarr' ? 'Империя Амарр - древнейшая из космических цивилизаций, основанная на строгих религиозных принципах и имперских традициях. Их корабли олицетворяют величие и мощь, украшенные золотом и выполненные в стиле величественных соборов. Амаррские пилоты известны своей непоколебимой верой и дисциплиной, что делает их грозными противниками в бою.' :
                raceData.race === 'caldari' ? 'Государство Калдари - милитаристская корпоративная держава, где эффективность и дисциплина ценятся превыше всего. Их флот состоит из высокотехнологичных боевых машин с превосходными щитами и ракетным вооружением. Калдарийцы придерживаются принципов коллективизма и практичности, создавая корабли функциональные и смертоносные.' :
                raceData.race === 'gallente' ? 'Федерация Галленте - демократическое общество, ценящее свободу и индивидуальность. Их корабли отличаются элегантным дизайном и универсальностью боевых систем. Использование дронов и гибридного оружия позволяет галлентийским пилотам адаптироваться к любой боевой ситуации, делая их непредсказуемыми и опасными противниками.' :
                raceData.race === 'minmatar' ? 'Республика Минматар - народ, переживший рабство и завоевавший свободу собственными руками. Их корабли создаются из того, что есть под рукой - обрезков металла, трофейных деталей и переработанного оборудования. Но не стоит обманываться их внешним видом - минматарские корабли невероятно быстры и обладают разрушительной огневой мощью.' :
                raceData.race === 'human' ? 'Альянс Людей представляет объединённые силы Земли и её колоний. Человеческие корабли воплощают баланс и адаптивность, сочетая лучшие технологии всех рас. Земные инженеры создали универсальные боевые платформы, способные эффективно противостоять любому типу вооружения, что делает человеческий флот грозной силой в галактике.' :
                'Рой Зергов - органическая цивилизация, чьи корабли выращиваются, а не строятся. Био-технологии позволяют создавать живые корабли, способные к быстрой регенерации и адаптации. Однако эти существа требуют постоянной связи с Роем - без ежедневного контакта ВСЕ корабли начинают необратимо деградировать, теряя по 1% от своего первоначального HP каждый пропущенный день (до 10% максимум)!'
              ) : (
                raceData.race === 'amarr' ? 'The Amarr Empire is the oldest of space civilizations, founded on strict religious principles and imperial traditions. Their ships embody greatness and power, decorated with gold and designed in the style of majestic cathedrals. Amarr pilots are known for their unwavering faith and discipline, making them formidable opponents in battle.' :
                raceData.race === 'caldari' ? 'The Caldari State is a militaristic corporate power where efficiency and discipline are valued above all else. Their fleet consists of high-tech war machines with superior shields and missile weaponry. Caldari adhere to principles of collectivism and practicality, creating ships that are functional and deadly.' :
                raceData.race === 'gallente' ? 'The Gallente Federation is a democratic society that values freedom and individuality. Their ships feature elegant design and versatile combat systems. The use of drones and hybrid weapons allows Gallente pilots to adapt to any combat situation, making them unpredictable and dangerous opponents.' :
                raceData.race === 'minmatar' ? 'The Minmatar Republic is a people who survived slavery and won their freedom with their own hands. Their ships are built from whatever is at hand - metal scraps, trophy parts, and recycled equipment. But don\'t be fooled by their appearance - Minmatar ships are incredibly fast and possess devastating firepower.' :
                raceData.race === 'human' ? 'The Human Alliance represents the united forces of Earth and its colonies. Human ships embody balance and adaptability, combining the best technologies of all races. Earth engineers have created universal combat platforms capable of effectively countering any type of weaponry, making the human fleet a formidable force in the galaxy.' :
                'The Zerg Swarm is an organic civilization whose ships are grown, not built. Bio-technologies allow the creation of living ships capable of rapid regeneration and adaptation. However, these creatures require constant connection with the Swarm - without daily contact, ALL ships begin to irreversibly degrade, losing 1% of their original HP each missed day (up to 10% total)!'
              )}
            </p>
            <p style={{ color: '#ccc', fontSize: '1rem', lineHeight: '1.7' }}>
              {selectedRaceInfo.description[lang]}
            </p>
          </div>

          {/* Характеристики */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '15px'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: raceColor, fontWeight: 'bold' }}>
                {lang === 'ru' ? 'Оружие: ' : 'Weapon: '}
              </span>
              <span style={{ color: '#fff' }}>{selectedRaceInfo.weaponName[lang]}</span>
            </div>
            <div>
              <div style={{ color: raceColor, fontWeight: 'bold', marginBottom: '5px' }}>
                {lang === 'ru' ? 'Специальная способность:' : 'Special Ability:'}
              </div>
              <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '3px' }}>
                {selectedRaceInfo.specialAbility.name[lang]}
              </div>
              <div style={{ color: '#999', fontSize: '0.9rem' }}>
                {selectedRaceInfo.specialAbility.description[lang]}
              </div>
            </div>
          </div>

        </div>

        {/* Пожелания */}
        <div style={{
          maxWidth: '700px',
          margin: '0 auto 30px',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '15px',
          padding: '20px',
          border: `1px solid ${raceColor}40`
        }}>
          <p style={{ fontSize: '1.1rem', color: '#ccc', lineHeight: '1.6', marginBottom: '15px' }}>
            {lang === 'ru'
              ? 'Желаем вам успехов в покорении галактики! Пусть ваши корабли всегда возвращаются с победой, а враги трепещут при виде вашего флота!'
              : 'We wish you success in conquering the galaxy! May your ships always return victorious, and your enemies tremble at the sight of your fleet!'}
          </p>
          <p style={{ fontSize: '0.95rem', color: raceColor }}>
            {lang === 'ru' ? '🌟 Да пребудет с вами сила космоса!' : '🌟 May the cosmic force be with you!'}
          </p>
        </div>

        {/* Кнопка подтверждения */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <button
            onClick={() => {
              setShowWelcome(false);
              localStorage.setItem(`galactic_empire_welcome_${player?.telegram_id}`, 'true');
              setHasSeenWelcome(true);
            }}
            style={{
              background: `linear-gradient(135deg, ${raceColor}, ${RACE_COLORS[raceData?.race]}99)`,
              border: 'none',
              borderRadius: '15px',
              padding: '18px 60px',
              color: '#fff',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: `0 5px 25px ${raceColor}80`,
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 8px 35px ${raceColor}`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 5px 25px ${raceColor}80`;
            }}
          >
            {lang === 'ru' ? '🚀 Начать игру!' : '🚀 Start Game!'}
          </button>
        </div>

        {/* Кнопка назад внизу */}
        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
          <button
            onClick={() => navigate('/attack')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: '12px 30px',
              color: '#999',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              fontSize: '0.9rem'
            }}
          >
            {lang === 'ru' ? '← В CosmoClick' : '← Back to CosmoClick'}
          </button>
        </div>
      </div>
    );
  }

  // Основной экран игры
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
      color: '#fff',
      padding: '20px',
      paddingTop: '20px'
    }}>
      {/* Инфопанель */}
      <div style={{
        width: '93%',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.5)',
        border: `2px solid ${raceColor}`,
        borderRadius: '10px',
        boxShadow: `0 0 20px ${raceColor}`,
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        marginTop: '5px'
      }}>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: '1.4' }}>
            💰 Luminios: {(raceData?.luminios_balance || 0).toLocaleString()}<br/>
            ✨ CS: {(typeof player.cs === 'number' ? player.cs : parseFloat(player.cs || '0')).toFixed(2)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: '1.4' }}>
            💎 TON: {(typeof player.ton === 'number' ? player.ton : parseFloat(player.ton || '0')).toFixed(5)}<br/>
            ⭐ Stars: {(player.telegram_stars || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Контент */}
      <div style={{ padding: '0', marginBottom: '100px', marginTop: '80px' }}>

        {/* Строящиеся корабли */}
        {buildingShips.length > 0 && (
          <div style={{
            background: 'rgba(255, 165, 0, 0.1)',
            border: '2px solid rgba(255, 165, 0, 0.5)',
            borderRadius: '15px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#FFA500', fontSize: '1.1rem' }}>
              ⏱️ {lang === 'ru' ? 'В постройке' : 'Building'}
            </h3>
            {buildingShips.map((ship: any) => (
              <BuildingShipItem key={ship.id} ship={ship} lang={lang} onShipReady={loadShipsAndFormation} />
            ))}
          </div>
        )}

        {/* Быстрая инструкция для новичков */}
        {ships.length === 0 && buildingShips.length === 0 && (
          <div style={{
            background: 'rgba(157, 78, 221, 0.1)',
            border: '2px solid rgba(157, 78, 221, 0.3)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#9d4edd', marginBottom: '15px', textAlign: 'center' }}>
              🎮 {lang === 'ru' ? 'Как начать?' : 'How to start?'}
            </h3>
            <div style={{ color: '#ccc', lineHeight: '1.8' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: raceColor }}>1.</strong> {lang === 'ru' ? 'Купите корабли на Верфи' : 'Buy ships at Shipyard'} 🚀
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: raceColor }}>2.</strong> {lang === 'ru' ? 'Дождитесь постройки (или вернитесь позже)' : 'Wait for construction (or come back later)'} ⏱️
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: raceColor }}>3.</strong> {lang === 'ru' ? 'Добавьте корабли кнопкой "+ В бой"' : 'Add ships with "+ Add" button'} ⚔️
              </div>
              <div>
                <strong style={{ color: raceColor }}>4.</strong> {lang === 'ru' ? 'Нажмите "НАЧАТЬ БОЙ!" и сражайтесь!' : 'Press "START BATTLE!" and fight!'} 🏆
              </div>
            </div>
          </div>
        )}

        {/* Подсказка если нет кораблей */}
        {ships.length === 0 && buildingShips.length === 0 && (
          <div style={{
            background: 'rgba(100, 200, 255, 0.1)',
            border: '2px solid rgba(100, 200, 255, 0.3)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🚀</div>
            <h3 style={{ color: '#64c8ff', marginBottom: '10px' }}>
              {lang === 'ru' ? 'Ваш флот пуст' : 'Your fleet is empty'}
            </h3>
            <p style={{ color: '#aaa', marginBottom: '15px' }}>
              {lang === 'ru'
                ? 'Отправляйтесь на Верфь и приобретите свои первые корабли!'
                : 'Go to the Shipyard and purchase your first ships!'}
            </p>
            <button
              onClick={() => navigate('/games/galactic-empire/shop')}
              style={{
                background: `linear-gradient(135deg, ${raceColor}, ${raceColor}CC)`,
                border: 'none',
                borderRadius: '10px',
                padding: '12px 25px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🚀 {lang === 'ru' ? 'Перейти на Верфь' : 'Go to Shipyard'}
            </button>
          </div>
        )}

        {/* Готовые корабли - краткий список */}
        {ships.length > 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${raceColor}15, rgba(0, 0, 0, 0.3))`,
            border: `2px solid ${raceColor}50`,
            borderRadius: '15px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{ margin: 0, color: raceColor, fontSize: '1.1rem' }}>
                🚢 {lang === 'ru' ? 'Готовые корабли' : 'Ready Ships'} ({ships.length})
              </h3>
              <button
                onClick={async () => {
                  await loadShipsAndFormation();
                  setCurrentScreen('hangar');
                }}
                style={{
                  background: `linear-gradient(135deg, ${raceColor}, ${raceColor}CC)`,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 15px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {lang === 'ru' ? 'Открыть ангар' : 'Open Hangar'}
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '10px'
            }}>
              {ships.slice(0, 6).map((ship: any) => {
                const shipNames: any = {
                  frigate_t1: { ru: 'Лёгкий фрегат', en: 'Light Frigate' },
                  frigate_t2: { ru: 'Штурмовой фрегат', en: 'Assault Frigate' },
                  destroyer_t1: { ru: 'Лёгкий эсминец', en: 'Light Destroyer' },
                  destroyer_t2: { ru: 'Тяжёлый эсминец', en: 'Heavy Destroyer' },
                  cruiser_t1: { ru: 'Боевой крейсер', en: 'Combat Cruiser' },
                  cruiser_t2: { ru: 'Тяжёлый штурмовой крейсер', en: 'Heavy Assault Cruiser' },
                  battleship_t1: { ru: 'Линкор', en: 'Battleship' },
                  battleship_t2: { ru: 'Дредноут', en: 'Dreadnought' }
                };

                const classEmoji: any = {
                  frigate: '🚤',
                  destroyer: '🛸',
                  cruiser: '🚀',
                  battleship: '🚢',
                  premium: '👑'
                };

                const shipName = shipNames[ship.ship_type]?.[lang] || ship.ship_type;
                const emoji = classEmoji[ship.ship_class] || '🚀';
                const hpPercent = (ship.current_hp / ship.max_hp) * 100;
                const hpColor = hpPercent > 70 ? '#44ff44' : hpPercent > 30 ? '#ffaa00' : '#ff4444';

                return (
                  <div
                    key={ship.id}
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: `1px solid ${raceColor}40`,
                      borderRadius: '10px',
                      padding: '10px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{emoji}</div>
                    <div style={{
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {shipName}
                    </div>

                    {/* HP Bar */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '5px',
                      height: '4px',
                      overflow: 'hidden',
                      marginBottom: '3px'
                    }}>
                      <div style={{
                        background: hpColor,
                        height: '100%',
                        width: `${hpPercent}%`,
                        borderRadius: '5px'
                      }} />
                    </div>

                    <div style={{
                      color: '#aaa',
                      fontSize: '0.65rem'
                    }}>
                      {ship.current_hp}/{ship.max_hp} HP
                    </div>

                    {/* Кнопка добавить в формацию */}
                    {!formationShipIds.includes(ship.id) && formationShipIds.length < 5 && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleAddToFormation(ship.id);
                        }}
                        style={{
                          marginTop: '8px',
                          background: `linear-gradient(135deg, ${raceColor}, ${raceColor}CC)`,
                          border: 'none',
                          borderRadius: '5px',
                          padding: '5px 8px',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        + {lang === 'ru' ? 'В бой' : 'Add'}
                      </button>
                    )}

                    {formationShipIds.includes(ship.id) && (
                      <div style={{
                        marginTop: '8px',
                        background: `rgba(${parseInt(raceColor.slice(1, 3), 16)}, ${parseInt(raceColor.slice(3, 5), 16)}, ${parseInt(raceColor.slice(5, 7), 16)}, 0.2)`,
                        border: `1px solid ${raceColor}`,
                        borderRadius: '5px',
                        padding: '5px 8px',
                        color: raceColor,
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}>
                        ✓ {lang === 'ru' ? 'В формации' : 'Ready'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {ships.length > 6 && (
              <div style={{
                textAlign: 'center',
                marginTop: '10px',
                color: '#aaa',
                fontSize: '0.8rem'
              }}>
                {lang === 'ru' ? `+ ещё ${ships.length - 6} кораблей` : `+ ${ships.length - 6} more ships`}
              </div>
            )}
          </div>
        )}

        {/* Подсказка собрать формацию */}
        {ships.length > 0 && formationShipIds.length === 0 && (
          <div style={{
            background: 'rgba(255, 170, 0, 0.1)',
            border: '2px solid rgba(255, 170, 0, 0.3)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⚔️</div>
            <h3 style={{ color: '#ffaa00', marginBottom: '10px' }}>
              {lang === 'ru' ? 'Соберите боевую формацию!' : 'Build your battle formation!'}
            </h3>
            <p style={{ color: '#aaa', marginBottom: '15px' }}>
              {lang === 'ru'
                ? 'Добавьте корабли в формацию ниже кнопкой "+ В бой" и начните сражаться!'
                : 'Add ships to formation with "+ Add" button below and start battling!'}
            </p>
          </div>
        )}

        {/* Формация - краткий статус */}
        {formationShipIds.length > 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${raceColor}20, rgba(0, 0, 0, 0.4))`,
            border: `2px solid ${raceColor}`,
            borderRadius: '15px',
            padding: '15px',
            marginBottom: '20px',
            boxShadow: `0 0 20px ${raceColor}40`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <h3 style={{ margin: 0, color: raceColor, fontSize: '1.1rem' }}>
                ⚔️ {lang === 'ru' ? 'Боевая формация' : 'Battle Formation'} ({formationShipIds.length}/5)
              </h3>
              <button
                onClick={() => {
                  const allAlive = formationShips.every(ship => ship.current_hp > 0);
                  if (!allAlive) {
                    alert(lang === 'ru' ? 'Отремонтируйте повреждённые корабли!' : 'Repair damaged ships!');
                    return;
                  }
                  handleStartBattle();
                }}
                style={{
                  background: `linear-gradient(135deg, #ff4444, #cc0000)`,
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 20px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 5px 15px rgba(255, 68, 68, 0.5)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 68, 68, 0.7)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(255, 68, 68, 0.5)';
                }}
              >
                🚀 {lang === 'ru' ? 'НАЧАТЬ БОЙ!' : 'START BATTLE!'}
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center'
            }}>
              {Array.from({ length: 5 }).map((_, index) => {
                const ship = formationShips[index];
                const isEmpty = !ship;

                if (isEmpty) {
                  return (
                    <div
                      key={`slot-${index}`}
                      style={{
                        width: '50px',
                        height: '50px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '2px dashed #444',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        opacity: 0.3
                      }}
                    >
                      +
                    </div>
                  );
                }

                const classEmoji: any = {
                  frigate: '🚤',
                  destroyer: '🛸',
                  cruiser: '🚀',
                  battleship: '🚢',
                  premium: '👑'
                };

                const emoji = classEmoji[ship.ship_class] || '🚀';
                const hpPercent = (ship.current_hp / ship.max_hp) * 100;
                const hpColor = hpPercent > 70 ? '#44ff44' : hpPercent > 30 ? '#ffaa00' : '#ff4444';

                return (
                  <div
                    key={ship.id}
                    style={{
                      width: '50px',
                      height: '50px',
                      background: `linear-gradient(135deg, ${raceColor}30, ${raceColor}15)`,
                      border: `2px solid ${raceColor}`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      position: 'relative',
                      boxShadow: `0 0 10px ${raceColor}40`,
                      cursor: 'pointer'
                    }}
                    onClick={async () => {
                      const confirmed = window.confirm(
                        lang === 'ru'
                          ? 'Убрать корабль из формации?'
                          : 'Remove ship from formation?'
                      );
                      if (confirmed) {
                        await handleRemoveFromFormation(ship.id);
                      }
                    }}
                    title={lang === 'ru' ? 'Нажмите чтобы убрать' : 'Click to remove'}
                  >
                    {emoji}
                    {/* HP indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '3px',
                      left: '3px',
                      right: '3px',
                      height: '3px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: hpColor,
                        height: '100%',
                        width: `${hpPercent}%`,
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              textAlign: 'center',
              marginTop: '10px',
              color: '#aaa',
              fontSize: '0.7rem'
            }}>
              {lang === 'ru' ? '💡 Кликните на корабль чтобы убрать из формации' : '💡 Click on ship to remove from formation'}
            </div>
          </div>
        )}

        {/* Статистика */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '25px'
        }}>
          {/* Мои корабли */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: `2px solid ${raceColor}40`,
            borderRadius: '12px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '5px' }}>
              {lang === 'ru' ? 'Мои корабли' : 'My Ships'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: raceColor }}>
              {ships.length}
            </div>
          </div>

          {/* Побед / Поражений */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: `2px solid ${raceColor}40`,
            borderRadius: '12px',
            padding: '15px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '5px' }}>
              {lang === 'ru' ? 'Побед / Поражений' : 'Wins / Losses'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#4ECDC4' }}>
              0 / 0
            </div>
          </div>
        </div>

        {/* Первая строка: Верфь / Ангар */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <button
            onClick={() => navigate('/games/galactic-empire/shop')}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${raceColor}40`,
              borderRadius: '12px',
              padding: '20px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}`;
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}40`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>🚀</span>
            <span>{lang === 'ru' ? 'Верфь' : 'Shipyard'}</span>
          </button>

          <button
            onClick={async () => {
              await loadShipsAndFormation();
              setCurrentScreen('hangar');
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${raceColor}40`,
              borderRadius: '12px',
              padding: '20px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}`;
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}40`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>🏭</span>
            <span>{lang === 'ru' ? 'Ангар' : 'Hangar'}</span>
          </button>
        </div>

        {/* Вторая строка: Формация / Инвентарь / История / Обмен */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <button
            onClick={async () => {
              await loadShipsAndFormation();
              setCurrentScreen('formation');
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${raceColor}40`,
              borderRadius: '12px',
              padding: '20px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}`;
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}40`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>⚔️</span>
            <span>{lang === 'ru' ? 'Формация / Бои' : 'Formation / Battles'}</span>
          </button>

          <button
            onClick={async () => {
              await loadBattles();
              setCurrentScreen('battles');
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${raceColor}40`,
              borderRadius: '12px',
              padding: '20px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}`;
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}40`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>📜</span>
            <span>{lang === 'ru' ? 'История боёв' : 'Battle History'}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('exchange')}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${raceColor}40`,
              borderRadius: '12px',
              padding: '20px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}`;
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}40`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>💱</span>
            <span>{lang === 'ru' ? 'Обмен' : 'Exchange'}</span>
          </button>

          <button
            onClick={() => setCurrentScreen('modules')}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${raceColor}40`,
              borderRadius: '12px',
              padding: '20px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}`;
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}40`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>🔧</span>
            <span>{lang === 'ru' ? 'Мастерская' : 'Modules'}</span>
          </button>
        </div>

        {/* Третья строка: Статистика / Смена расы */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => alert('Statistics coming soon!')}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${raceColor}40`,
              borderRadius: '12px',
              padding: '20px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}`;
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}40`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>📊</span>
            <span>{lang === 'ru' ? 'Статистика' : 'Statistics'}</span>
          </button>

          <button
            onClick={async () => {
              const confirmed = window.confirm(
                lang === 'ru'
                  ? 'Вы уверены? Весь прогресс в Galactic Empire будет потерян!'
                  : 'Are you sure? All progress in Galactic Empire will be lost!'
              );
              if (confirmed) {
                try {
                  await axios.delete(`${API_URL}/api/galactic-empire/player/${player.telegram_id}`);
                  setShowRaceSelection(true);
                  setEmpireData(null);
                } catch (error) {
                  console.error('Failed to reset race:', error);
                  alert(lang === 'ru' ? 'Ошибка сброса расы' : 'Failed to reset race');
                }
              }
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${raceColor}40`,
              borderRadius: '12px',
              padding: '20px',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}`;
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.border = `2px solid ${raceColor}40`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>🔄</span>
            <span>{lang === 'ru' ? 'Сменить расу' : 'Change Race'}</span>
          </button>
        </div>
      </div>

      {/* Кнопки внизу */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => navigate('/attack')}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            padding: '12px 30px',
            color: '#999',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            fontSize: '0.9rem'
          }}
        >
          {lang === 'ru' ? '← В CosmoClick' : '← Back to CosmoClick'}
        </button>
      </div>

      {/* Overlay screens */}
      {currentScreen === 'hangar' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <button
            onClick={() => setCurrentScreen('main')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #fff',
              borderRadius: '10px',
              padding: '10px 20px',
              color: '#fff',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← {lang === 'ru' ? 'Назад' : 'Back'}
          </button>

          <Hangar
            ships={ships}
            formationShipIds={formationShipIds}
            if (process.env.NODE_ENV === 'development') onSelectShip={(ship) => console.log('Selected', ship)}
            onAddToFormation={handleAddToFormation}
            onRepairShip={handleRepairShip}
            onUpgradeShip={handleUpgradeShip}
            lang={lang}
            raceColor={raceColor}
          />
        </div>
      )}

      {currentScreen === 'formation' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <button
            onClick={() => setCurrentScreen('main')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #fff',
              borderRadius: '10px',
              padding: '10px 20px',
              color: '#fff',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← {lang === 'ru' ? 'Назад' : 'Back'}
          </button>

          <Formation
            formationShips={formationShips}
            onRemoveFromFormation={handleRemoveFromFormation}
            onStartBattle={handleStartBattle}
            lang={lang}
            raceColor={raceColor}
          />
        </div>
      )}

      {currentScreen === 'battles' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <button
            onClick={() => setCurrentScreen('main')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #fff',
              borderRadius: '10px',
              padding: '10px 20px',
              color: '#fff',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← {lang === 'ru' ? 'Назад' : 'Back'}
          </button>

          <BattleHistory
            battles={battles}
            telegramId={player.telegram_id}
            onReplayBattle={handleReplayBattle}
            lang={lang}
            raceColor={raceColor}
          />
        </div>
      )}

      {currentScreen === 'exchange' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <button
            onClick={() => setCurrentScreen('main')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #fff',
              borderRadius: '10px',
              padding: '10px 20px',
              color: '#fff',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← {lang === 'ru' ? 'Назад' : 'Back'}
          </button>

          <LuminiosExchange
            telegramId={player.telegram_id}
            luminiosBalance={empireData?.player?.luminios_balance || 0}
            csBalance={parseFloat(player?.cs || 0)}
            onExchangeComplete={async () => {
              await loadEmpireData();
              // Update player CS balance without reload
              await updatePlayer();
            }}
            lang={lang}
            raceColor={raceColor}
          />
        </div>
      )}

      {/* Module Workshop Screen */}
      {currentScreen === 'modules' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 1000,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <button
            onClick={() => setCurrentScreen('main')}
            style={{
              background: raceColor,
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '1.1rem',
              color: '#fff',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← {lang === 'ru' ? 'Назад' : 'Back'}
          </button>

          <ModuleWorkshop
            modules={modules}
            ships={ships}
            selectedShip={selectedShipForModules}
            onSelectShip={setSelectedShipForModules}
            onEquipModule={handleEquipModule}
            onUnequipModule={handleUnequipModule}
            lang={lang}
            raceColor={raceColor}
          />
        </div>
      )}

      {showBattleReplay && (
        <BattleScreen
          battleLog={showBattleReplay.battleLog}
          playerFleet={showBattleReplay.playerFleet}
          enemyFleet={showBattleReplay.enemyFleet}
          winner={showBattleReplay.winner}
          reward={showBattleReplay.reward}
          onBattleEnd={async () => {
            setShowBattleReplay(null);
            await loadShipsAndFormation();
            await loadBattles();
          }}
        />
      )}
    </div>
  );
};

export default GalacticEmpire;
