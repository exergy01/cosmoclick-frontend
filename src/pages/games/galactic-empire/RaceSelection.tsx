/**
 * 🌌 ВЫБОР РАСЫ - GALACTIC EMPIRE
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../context/PlayerContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

interface Race {
  id: string;
  name: { en: string; ru: string };
  description: { en: string; ru: string };
  color: string;
  secondaryColor: string;
  weaponName: { en: string; ru: string };
  specialAbility: {
    name: { en: string; ru: string };
    description: { en: string; ru: string };
  };
}

const RACES: Race[] = [
  {
    id: 'amarr',
    name: { en: 'Amarr Empire', ru: 'Империя Амарр' },
    description: {
      en: 'Golden ships with powerful armor. Religious empire with laser weapons and monumental cathedral-like designs.',
      ru: 'Золотые корабли с мощной бронёй. Религиозная империя с лазерным оружием и монументальным дизайном.'
    },
    color: '#FFD700',
    secondaryColor: '#FFA500',
    weaponName: { en: 'Lasers', ru: 'Лазеры' },
    specialAbility: {
      name: { en: 'Divine Light', ru: 'Божественный свет' },
      description: { en: '10% chance to completely ignore damage', ru: '10% шанс полностью игнорировать урон' }
    }
  },
  {
    id: 'caldari',
    name: { en: 'Caldari State', ru: 'Государство Калдари' },
    description: {
      en: 'Militaristic ships with powerful shields and missiles. Dark grey and blue angular corporate-military design.',
      ru: 'Милитаристские корабли с мощными щитами и ракетами. Тёмно-серый и синий угловатый военно-корпоративный дизайн.'
    },
    color: '#4169E1',
    secondaryColor: '#1E90FF',
    weaponName: { en: 'Missiles', ru: 'Ракеты' },
    specialAbility: {
      name: { en: 'Missile Volley', ru: 'Залп ракет' },
      description: { en: '15% chance to shoot twice', ru: '15% шанс выстрелить дважды' }
    }
  },
  {
    id: 'gallente',
    name: { en: 'Gallente Federation', ru: 'Федерация Галленте' },
    description: {
      en: 'Versatile ships with drones and hybrid weapons. Metallic with green and blue tones, rounded forms.',
      ru: 'Универсальные корабли с дронами и гибридным оружием. Металлик с зелёными и синими тонами, округлые формы.'
    },
    color: '#32CD32',
    secondaryColor: '#00CED1',
    weaponName: { en: 'Drones', ru: 'Дроны' },
    specialAbility: {
      name: { en: 'Drone Swarm', ru: 'Рой дронов' },
      description: { en: 'Drones attack all enemies simultaneously', ru: 'Дроны атакуют всех врагов одновременно' }
    }
  },
  {
    id: 'minmatar',
    name: { en: 'Minmatar Republic', ru: 'Республика Минматар' },
    description: {
      en: 'Fast ships with powerful artillery. Industrial brown-red designs welded from metal scraps.',
      ru: 'Быстрые корабли с мощной артиллерией. Индустриальный коричнево-красный дизайн, сваренный из обрезков металла.'
    },
    color: '#DC143C',
    secondaryColor: '#8B4513',
    weaponName: { en: 'Artillery', ru: 'Артиллерия' },
    specialAbility: {
      name: { en: 'Critical Shot', ru: 'Критический выстрел' },
      description: { en: '20% chance to deal x3 damage', ru: '20% шанс нанести урон x3' }
    }
  },
  {
    id: 'human',
    name: { en: 'Human Alliance', ru: 'Альянс Людей' },
    description: {
      en: 'Earth ships with universal design and armament. Balanced characteristics and adaptive combat style.',
      ru: 'Земные корабли с универсальным дизайном и вооружением. Сбалансированные характеристики и адаптивный стиль боя.'
    },
    color: '#00f0ff',
    secondaryColor: '#0080ff',
    weaponName: { en: 'Ballistics', ru: 'Баллистика' },
    specialAbility: {
      name: { en: 'Adaptation', ru: 'Адаптация' },
      description: { en: 'Bonus against enemy weapon type', ru: 'Бонус против типа оружия противника' }
    }
  },
  {
    id: 'zerg',
    name: { en: 'Zerg Swarm', ru: 'Рой Зергов' },
    description: {
      en: 'Organic bio-ships. Fast regeneration but requires daily login. Without daily login ALL ships lose 1% HP permanently from their original value each day (up to 10% total)!',
      ru: 'Органические био-корабли. Быстрая регенерация, но требуется ежедневный вход. Без ежедневного входа ВСЕ корабли теряют 1% HP навсегда от первоначального значения каждый день (до 10% максимум)!'
    },
    color: '#9D4EDD',
    secondaryColor: '#7B2CBF',
    weaponName: { en: 'Bio-weapons', ru: 'Био-оружие' },
    specialAbility: {
      name: { en: 'Infestation', ru: 'Заражение' },
      description: { en: 'Enemy takes damage for 3 rounds', ru: 'Враг получает урон в течение 3 раундов' }
    }
  }
];

interface RaceSelectionProps {
  onRaceSelected?: () => void;
}

const RaceSelection: React.FC<RaceSelectionProps> = ({ onRaceSelected }) => {
  const { player } = usePlayer();
  const navigate = useNavigate();
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lang = (player?.language || 'en') as 'en' | 'ru';

  const handleSelectRace = async () => {
    if (!selectedRace || !player?.telegram_id) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/galactic-empire/select-race`, {
        telegramId: player.telegram_id,
        race: selectedRace
      });

      if (process.env.NODE_ENV === 'development') console.log('Race selected successfully:', response.data);

      // Вызываем callback для обновления данных без перезагрузки страницы
      if (onRaceSelected) {
        onRaceSelected();
      }
    } catch (error: any) {
      console.error('Race selection error:', error);
      const errorMessage = error.response?.data?.error || (lang === 'ru' ? 'Ошибка выбора расы' : 'Race selection error');
      alert(errorMessage);
      setLoading(false);
    }
  };

  const selectedRaceData = RACES.find(r => r.id === selectedRace);

  const t = {
    back: lang === 'ru' ? '← Назад' : '← Back',
    title: lang === 'ru' ? 'Выберите свою расу' : 'Choose Your Race',
    subtitle: lang === 'ru' ? 'Этот выбор повлияет на весь ваш игровой опыт' : 'This choice will affect your entire gameplay experience',
    weapon: lang === 'ru' ? 'Оружие: ' : 'Weapon: ',
    selected: lang === 'ru' ? 'Выбрано: ' : 'Selected: ',
    confirm: lang === 'ru' ? '✓ Подтвердить выбор' : '✓ Confirm Selection',
    loading: lang === 'ru' ? 'Загрузка...' : 'Loading...'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0f0a1a 100%)',
      color: '#fff',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <button
        onClick={() => navigate('/attack')}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '10px',
          padding: '10px 20px',
          color: '#fff',
          cursor: 'pointer',
          marginBottom: '20px',
          backdropFilter: 'blur(10px)'
        }}
      >
        {t.back}
      </button>

      <h1 style={{
        textAlign: 'center',
        fontSize: '2rem',
        marginBottom: '10px',
        background: 'linear-gradient(135deg, #9d4edd, #c77dff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {t.title}
      </h1>

      <p style={{
        textAlign: 'center',
        color: '#999',
        marginBottom: '40px',
        fontSize: '0.9rem'
      }}>
        {t.subtitle}
      </p>

      {/* Сетка рас */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: selectedRaceData ? '120px' : '30px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {RACES.map(race => (
          <div
            key={race.id}
            onClick={() => setSelectedRace(selectedRace === race.id ? null : race.id)}
            style={{
              background: selectedRace === race.id
                ? `linear-gradient(135deg, ${race.color}20, ${race.secondaryColor}20)`
                : 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${selectedRace === race.id ? race.color : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '15px',
              padding: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: selectedRace === race.id
                ? `0 0 30px ${race.color}60`
                : 'none',
              display: 'flex',
              gap: '15px'
            }}
          >
            {/* Картинка расы - левая половина */}
            <div style={{
              width: '50%',
              aspectRatio: '1',
              background: `linear-gradient(135deg, ${race.color}10, ${race.secondaryColor}10)`,
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'relative',
              flexShrink: 0
            }}>
              <img
                src={`/assets/galactic-empire/races/${race.id}.png`}
                alt={race.name[lang]}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🚀</div>';
                }}
              />
            </div>

            {/* Информация о расе - правая половина */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{
                color: race.color,
                fontSize: '1.3rem',
                fontWeight: 'bold',
                margin: 0
              }}>
                {race.name[lang]}
              </h3>

              <p style={{
                color: '#ccc',
                fontSize: '0.85rem',
                lineHeight: '1.4',
                margin: 0,
                flex: 1
              }}>
                {race.description[lang]}
              </p>

              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.85rem'
              }}>
                <span style={{ color: race.color, fontWeight: 'bold' }}>{t.weapon}</span>
                <span>{race.weaponName[lang]}</span>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.85rem'
              }}>
                <div style={{ color: race.color, fontWeight: 'bold', marginBottom: '3px' }}>
                  {race.specialAbility.name[lang]}
                </div>
                <div style={{ color: '#999', fontSize: '0.8rem' }}>
                  {race.specialAbility.description[lang]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Информация о смене расы - в самом низу */}
      <div style={{
        maxWidth: '800px',
        margin: '30px auto',
        background: 'rgba(255, 165, 0, 0.1)',
        border: '1px solid rgba(255, 165, 0, 0.3)',
        borderRadius: '10px',
        padding: '15px',
        fontSize: '0.85rem',
        color: '#ffcc00',
        marginBottom: selectedRaceData ? '140px' : '30px'
      }}>
        <strong>{lang === 'ru' ? '⚠️ Важно:' : '⚠️ Important:'}</strong><br/>
        {lang === 'ru'
          ? 'Вы всегда можете сменить расу за 150 Stars или 1 TON, но с потерей всего прогресса и Luminios. Основные средства (CS, TON, Stars) не затрагиваются.'
          : 'You can always change your race for 150 Stars or 1 TON, but with loss of all progress and Luminios. Main funds (CS, TON, Stars) remain untouched.'}
      </div>

      {/* Кнопка подтверждения */}
      {selectedRaceData && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.95), transparent)',
          backdropFilter: 'blur(10px)',
          padding: '20px',
          borderTop: `2px solid ${selectedRaceData.color}`
        }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <h2 style={{ color: selectedRaceData.color, marginBottom: '15px', fontSize: '1.2rem' }}>
              {t.selected}{selectedRaceData.name[lang]}
            </h2>
            <button
              onClick={handleSelectRace}
              disabled={loading}
              style={{
                background: `linear-gradient(135deg, ${selectedRaceData.color}, ${selectedRaceData.secondaryColor})`,
                border: 'none',
                borderRadius: '15px',
                padding: '15px 50px',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: `0 5px 20px ${selectedRaceData.color}60`,
                transition: 'all 0.3s ease',
                opacity: loading ? 0.5 : 1
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {loading ? t.loading : t.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RaceSelection;
