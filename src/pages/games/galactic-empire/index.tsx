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

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

const GalacticEmpire: React.FC = () => {
  const { player } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [empireData, setEmpireData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRaceSelection, setShowRaceSelection] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Проверяем query параметр для показа выбора расы
    const params = new URLSearchParams(location.search);
    if (params.get('showRaceSelection') === 'true') {
      setShowRaceSelection(true);
      setLoading(false);
      return;
    }

    if (!player?.telegram_id) return;

    const loadEmpireData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/galactic-empire/player/${player.telegram_id}`);
        setEmpireData(response.data);

        // Проверяем - новый ли игрок (создан менее 5 минут назад)
        const playerData = response.data.player;
        if (playerData?.created_at) {
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

    loadEmpireData();
  }, [player?.telegram_id, location.search]);

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
            onClick={() => setShowWelcome(false)}
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

      {/* Заголовок */}
      <h1 style={{
        textAlign: 'center',
        marginBottom: '20px',
        marginTop: '60px',
        background: `linear-gradient(135deg, ${raceColor}, #c77dff)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '2rem',
        fontWeight: 'bold'
      }}>
        🌌 Galactic Empire v2.0
      </h1>

      {/* Контент */}
      <div style={{ padding: '0', marginBottom: '100px' }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `2px solid ${raceColor}`,
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: raceColor, marginBottom: '15px' }}>
            {lang === 'ru' ? 'Информация о расе' : 'Race Information'}
          </h2>
          <p style={{ color: '#ccc', fontSize: '1rem' }}>
            {lang === 'ru' ? 'Раса' : 'Race'}: <span style={{ color: raceColor, fontWeight: 'bold' }}>{raceData?.race}</span>
          </p>
          <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '10px' }}>
            {lang === 'ru' ? 'В разработке...' : 'Under development...'}
          </p>
        </div>

        {/* Кнопка смены расы */}
        <div style={{
          background: 'rgba(255, 165, 0, 0.1)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#ffcc00', marginBottom: '10px', fontSize: '1.1rem' }}>
            {lang === 'ru' ? '⚙️ Смена расы' : '⚙️ Change Race'}
          </h3>
          <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: '15px', lineHeight: '1.5' }}>
            {lang === 'ru'
              ? 'Вы можете сменить расу, но потеряете весь прогресс и Luminios. Основные средства (CS, TON, Stars) останутся.'
              : 'You can change your race, but you will lose all progress and Luminios. Main funds (CS, TON, Stars) will remain.'}
          </p>
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
              background: 'linear-gradient(135deg, #ff6b00, #ff9500)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 25px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 3px 15px rgba(255, 107, 0, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 5px 20px rgba(255, 107, 0, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 3px 15px rgba(255, 107, 0, 0.4)';
            }}
          >
            {lang === 'ru' ? '🔄 Сменить расу' : '🔄 Change Race'}
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
    </div>
  );
};

export default GalacticEmpire;
