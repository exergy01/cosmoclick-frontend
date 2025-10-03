/**
 * 🚀 МАГАЗИН КОРАБЛЕЙ - GALACTIC EMPIRE
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../../context/PlayerContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

interface Ship {
  id: string;
  class: string;
  tier: number;
  name: string;
  nameRu: string;
  description: string;
  descriptionRu: string;
  cost: {
    luminios: number;
  };
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  requirements: {
    level: number;
  };
  limitPerFormation?: number;
  buildTime?: number;
}

const ShipShop: React.FC = () => {
  const { player } = usePlayer();
  const navigate = useNavigate();
  const [ships, setShips] = useState<Ship[]>([]);
  const [luminiosBalance, setLuminiosBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);

  const lang = (player?.language || 'en') as 'en' | 'ru';

  // Загрузка кораблей и баланса
  useEffect(() => {
    const loadData = async () => {
      try {
        const [shipsRes, playerRes] = await Promise.all([
          axios.get(`${API_URL}/api/galactic-empire/ships/available`),
          axios.get(`${API_URL}/api/galactic-empire/player/${player?.telegram_id}`)
        ]);

        setShips(shipsRes.data);
        setLuminiosBalance(playerRes.data.player.luminios_balance);
      } catch (error) {
        console.error('Failed to load shop data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (player?.telegram_id) {
      loadData();
    }
  }, [player?.telegram_id]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}${lang === 'ru' ? ' сек' : ' sec'}`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${lang === 'ru' ? ' мин' : ' min'}`;
    return `${Math.floor(seconds / 3600)}${lang === 'ru' ? ' ч' : ' h'}`;
  };

  const handleBuyShip = async (shipId: string, cost: number, buildTime?: number) => {
    if (!player?.telegram_id) return;

    if (luminiosBalance < cost) {
      alert(lang === 'ru' ? 'Недостаточно Luminios!' : 'Insufficient Luminios!');
      return;
    }

    const buildTimeText = buildTime ? ` (${lang === 'ru' ? 'Время постройки' : 'Build time'}: ${formatTime(buildTime)})` : '';
    const confirmed = window.confirm(
      lang === 'ru'
        ? `Купить корабль за ${cost.toLocaleString()} Luminios?${buildTimeText}`
        : `Buy ship for ${cost.toLocaleString()} Luminios?${buildTimeText}`
    );

    if (!confirmed) return;

    setPurchasing(shipId);

    try {
      const response = await axios.post(`${API_URL}/api/galactic-empire/ships/buy`, {
        telegramId: player.telegram_id,
        shipId
      });

      setLuminiosBalance(response.data.newBalance);

      const successMsg = lang === 'ru'
        ? `✅ Корабль добавлен в очередь постройки! Время: ${formatTime(response.data.buildTime)}`
        : `✅ Ship added to build queue! Time: ${formatTime(response.data.buildTime)}`;

      alert(successMsg);

    } catch (error: any) {
      console.error('Purchase error:', error);
      const errorMsg = error.response?.data?.error || 'Purchase failed';
      alert(lang === 'ru' ? `Ошибка: ${errorMsg}` : `Error: ${errorMsg}`);
    } finally {
      setPurchasing(null);
    }
  };

  const t = {
    back: lang === 'ru' ? '← Назад' : '← Back',
    title: lang === 'ru' ? 'Магазин кораблей' : 'Ship Shop',
    balance: lang === 'ru' ? 'Баланс' : 'Balance',
    loading: lang === 'ru' ? 'Загрузка...' : 'Loading...',
    buy: lang === 'ru' ? 'Купить' : 'Buy',
    buying: lang === 'ru' ? 'Покупка...' : 'Buying...',
    level: lang === 'ru' ? 'Уровень' : 'Level',
    frigate: lang === 'ru' ? 'Фрегаты' : 'Frigates',
    destroyer: lang === 'ru' ? 'Эсминцы' : 'Destroyers',
    cruiser: lang === 'ru' ? 'Крейсеры' : 'Cruisers',
    battleship: lang === 'ru' ? 'Линкоры' : 'Battleships',
    premium: lang === 'ru' ? 'Премиум' : 'Premium',
    drones: lang === 'ru' ? 'Дроны' : 'Drones',
    reb: lang === 'ru' ? 'РЭБ' : 'ECM',
    ai: lang === 'ru' ? 'ИИ' : 'AI',
    torpedoes: lang === 'ru' ? 'Торпеды' : 'Torpedoes',
    stats: lang === 'ru' ? 'Характеристики' : 'Stats'
  };

  const classColors: Record<string, string> = {
    frigate: '#4ECDC4',
    destroyer: '#FFE66D',
    cruiser: '#FF6B6B',
    battleship: '#C77DFF',
    premium: '#FFD700',
    drones: '#9D4EDD',
    reb: '#44A08D',
    ai: '#FF9500',
    torpedoes: '#FF1744'
  };

  const filteredShips = ships.filter(s => s.class === selectedClass);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0f0a1a 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem'
      }}>
        {t.loading}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 50%, #0f0a1a 100%)',
      color: '#fff',
      padding: '20px',
      paddingBottom: '100px'
    }}>
      {/* Шапка */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <button
          onClick={() => navigate('/games/galactic-empire')}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '10px',
            padding: '10px 20px',
            color: '#fff',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          {t.back}
        </button>

        <div style={{
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '10px',
          padding: '10px 20px',
          backdropFilter: 'blur(10px)'
        }}>
          💰 {t.balance}: <strong>{luminiosBalance.toLocaleString()}</strong> Luminios
        </div>
      </div>

      {/* Двухпанельный интерфейс */}
      <div style={{
        display: 'flex',
        gap: '20px',
        height: 'calc(100vh - 150px)'
      }}>
        {/* Левая панель - список кораблей */}
        <div style={{
          width: '35%',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '15px',
          padding: '15px',
          overflowY: 'auto'
        }}>
          {/* Фильтры */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '15px'
          }}>
            {['frigate', 'destroyer', 'cruiser', 'battleship', 'premium', 'drones', 'torpedoes', 'reb', 'ai'].map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                style={{
                  background: selectedClass === cls
                    ? `linear-gradient(135deg, ${classColors[cls]}, rgba(0, 0, 0, 0.5))`
                    : 'rgba(255, 255, 255, 0.1)',
                  border: `2px solid ${selectedClass === cls ? classColors[cls] : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: '8px',
                  padding: '10px 15px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: selectedClass === cls ? 'bold' : 'normal',
                  textAlign: 'left'
                }}
              >
                {t[cls as keyof typeof t] || cls}
              </button>
            ))}
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.2)', margin: '15px 0' }} />

          {/* Список названий кораблей */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {filteredShips.map(ship => {
              const shipColor = classColors[ship.class] || '#fff';
              const isSelected = selectedShip?.id === ship.id;

              return (
                <div
                  key={ship.id}
                  onClick={() => setSelectedShip(ship)}
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${shipColor}30, rgba(0, 0, 0, 0.5))`
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${isSelected ? shipColor : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '10px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    color: shipColor,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    marginBottom: '3px'
                  }}>
                    {lang === 'ru' ? ship.nameRu : ship.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {t[ship.class as keyof typeof t]} • Tier {ship.tier}
                  </div>
                </div>
              );
            })}

            {filteredShips.length === 0 && (
              <div style={{
                textAlign: 'center',
                fontSize: '0.9rem',
                color: '#999',
                marginTop: '20px'
              }}>
                {lang === 'ru' ? 'Нет кораблей' : 'No ships'}
              </div>
            )}
          </div>
        </div>

        {/* Правая панель - детали корабля */}
        <div style={{
          flex: 1,
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '15px',
          padding: '30px',
          overflowY: 'auto'
        }}>
          {selectedShip ? (
            <>
              {(() => {
                const canAfford = luminiosBalance >= selectedShip.cost.luminios;
                const shipColor = classColors[selectedShip.class] || '#fff';

                return (
                  <>
                    <h2 style={{
                      color: shipColor,
                      fontSize: '2rem',
                      marginBottom: '10px',
                      fontWeight: 'bold'
                    }}>
                      {lang === 'ru' ? selectedShip.nameRu : selectedShip.name}
                    </h2>

                    <div style={{
                      fontSize: '0.9rem',
                      color: '#999',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '30px'
                    }}>
                      {t[selectedShip.class as keyof typeof t] || selectedShip.class} • Tier {selectedShip.tier}
                    </div>

                    <p style={{
                      fontSize: '1.1rem',
                      color: '#ccc',
                      lineHeight: '1.6',
                      marginBottom: '30px'
                    }}>
                      {lang === 'ru' ? selectedShip.descriptionRu : selectedShip.description}
                    </p>

                    {/* Характеристики */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '15px',
                      padding: '20px',
                      marginBottom: '30px'
                    }}>
                      <h3 style={{ color: shipColor, marginBottom: '15px', fontSize: '1.3rem' }}>
                        {t.stats}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '1rem' }}>
                        <div>❤️ HP: <strong>{selectedShip.baseStats.hp.toLocaleString()}</strong></div>
                        <div>⚔️ Attack: <strong>{selectedShip.baseStats.attack.toLocaleString()}</strong></div>
                        <div>🛡️ Defense: <strong>{selectedShip.baseStats.defense.toLocaleString()}</strong></div>
                        <div>⚡ Speed: <strong>{selectedShip.baseStats.speed}</strong></div>
                      </div>
                    </div>

                    {/* Требования и лимиты */}
                    {(selectedShip.requirements.level > 1 || selectedShip.limitPerFormation === 1 || selectedShip.buildTime) && (
                      <div style={{
                        background: 'rgba(255, 165, 0, 0.1)',
                        border: '1px solid rgba(255, 165, 0, 0.3)',
                        borderRadius: '10px',
                        padding: '15px',
                        marginBottom: '30px',
                        fontSize: '0.9rem'
                      }}>
                        {selectedShip.requirements.level > 1 && (
                          <div style={{ marginBottom: '5px' }}>
                            {t.level}: {selectedShip.requirements.level}+
                          </div>
                        )}
                        {selectedShip.limitPerFormation === 1 && (
                          <div style={{ color: '#FFA500', fontWeight: 'bold', marginBottom: '5px' }}>
                            ⚠️ {lang === 'ru' ? 'Максимум один на флот' : 'Maximum one per fleet'}
                          </div>
                        )}
                        {selectedShip.buildTime && (
                          <div style={{ color: '#4ECDC4' }}>
                            ⏱️ {lang === 'ru' ? 'Время постройки' : 'Build time'}: {formatTime(selectedShip.buildTime)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Стоимость и кнопка покупки */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: '20px',
                      borderTop: '2px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#FFD700'
                      }}>
                        💰 {selectedShip.cost.luminios.toLocaleString()} Luminios
                      </div>

                      <button
                        onClick={() => handleBuyShip(selectedShip.id, selectedShip.cost.luminios, selectedShip.buildTime)}
                        disabled={!canAfford || purchasing === selectedShip.id}
                        style={{
                          background: canAfford
                            ? `linear-gradient(135deg, ${shipColor}, rgba(0, 0, 0, 0.5))`
                            : 'rgba(100, 100, 100, 0.3)',
                          border: `2px solid ${canAfford ? shipColor : '#555'}`,
                          borderRadius: '12px',
                          padding: '15px 40px',
                          color: '#fff',
                          fontSize: '1.1rem',
                          cursor: canAfford && purchasing !== selectedShip.id ? 'pointer' : 'not-allowed',
                          fontWeight: 'bold',
                          opacity: canAfford && purchasing !== selectedShip.id ? 1 : 0.5,
                          transition: 'all 0.3s ease',
                          boxShadow: canAfford ? `0 5px 20px ${shipColor}60` : 'none'
                        }}
                      >
                        {purchasing === selectedShip.id ? t.buying : t.buy}
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '1.2rem',
              color: '#999',
              textAlign: 'center'
            }}>
              {lang === 'ru' ? 'Выберите корабль из списка слева' : 'Select a ship from the list on the left'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipShop;
