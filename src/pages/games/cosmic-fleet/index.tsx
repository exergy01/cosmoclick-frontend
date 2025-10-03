import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPlayer } from '../../../context/NewPlayerContext';
import AccessControl from './components/AccessControl';
import LuminiosWallet from './components/LuminiosWallet';
import FleetHangar from './components/FleetHangar';
import ShipShop from './components/ShipShop';
import BattleReplay from './components/BattleReplay';
import BattleRewards from './components/BattleRewards';
import BattleHistory from './components/BattleHistory';
import { useCosmicFleet } from './hooks/useCosmicFleet';
import { Ship } from './types/ships';

type ActiveTab = 'hangar' | 'shop' | 'wallet' | 'history';

const CosmicFleetGame: React.FC = () => {
  const navigate = useNavigate();
  const { player } = useNewPlayer();
  const [activeTab, setActiveTab] = useState<ActiveTab>('hangar');
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [showBattle, setShowBattle] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [replayBattleId, setReplayBattleId] = useState<number | null>(null);

  const cosmicFleet = useCosmicFleet({
    telegramId: player?.telegram_id || 0,
    initialCsBalance: parseFloat(player?.cs || '0')
  });

  const {
    fleet,
    formation,  // 🔥 НОВОЕ: корабли в formation
    luminiosBalance,
    csBalance,
    loading,
    error,
    exchangeCSToLuminios,
    purchaseShip,
    repairShip,
    battlePvE,
    battleBot,  // 🔥 НОВОЕ: адаптивный бой с ботом
    setFormation  // 🔥 НОВОЕ: управление формацией
  } = cosmicFleet;

  const handleSelectShip = (ship: Ship) => {
    setSelectedShip(ship);
  };

  const handleStartBattle = async () => {
    if (formation.length === 0) {
      alert('⚠️ Нужно сформировать флот перед боем!');
      return;
    }

    // Проверка что хотя бы один корабль жив
    const aliveShips = formation.filter(ship => ship.health > 0);
    if (aliveShips.length === 0) {
      alert('⚠️ Все корабли повреждены! Требуется ремонт.');
      return;
    }

    // Запускаем адаптивный бой
    const result = await battleBot('medium', true);

    if (result) {
      console.log('🎯 Результат боя:', result);
      setBattleResult(result);
      setShowBattle(true);  // Показываем replay
    }
  };

  const handleBattleComplete = async () => {
    setShowBattle(false);
    setShowRewards(true);
  };

  const handleCloseRewards = async () => {
    setShowRewards(false);
    setBattleResult(null);
    // Перезагружаем данные с сервера чтобы синхронизировать HP
    await cosmicFleet.refreshData();
  };

  const handleRetryBattle = () => {
    setShowRewards(false);
    setBattleResult(null);
    handleStartBattle();
  };

  const handleAddToFormation = async (shipId: string) => {
    try {
      // Получаем текущие ID кораблей в formation
      const currentFormationIds = formation.map(s => s.id);

      // Если корабль уже в formation, удаляем
      if (currentFormationIds.includes(shipId)) {
        const newFormationIds = currentFormationIds.filter(id => id !== shipId);
        await setFormation(newFormationIds);
        return;
      }

      // Получаем max_slots с сервера (по умолчанию 3)
      const maxSlots = cosmicFleet.maxFormationSlots || 3;

      // Проверяем лимит
      if (currentFormationIds.length >= maxSlots) {
        alert(`Максимум ${maxSlots} кораблей в формации! Разблокируйте дополнительные слоты.`);
        return;
      }

      // Добавляем корабль
      await setFormation([...currentFormationIds, shipId]);
    } catch (error) {
      console.error('Ошибка при изменении формации:', error);
    }
  };

  const handleReplayFromHistory = async (battleId: number) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/cosmic-fleet/battle/replay/${battleId}`
      );

      if (!response.ok) {
        throw new Error('Failed to load battle replay');
      }

      const battleData = await response.json();

      // Конвертируем данные из БД в формат для BattleReplay
      const replayData = {
        battleLog: battleData.battle_log,
        playerFleet: battleData.player_fleet,
        enemyFleet: battleData.opponent_fleet,
        result: battleData.result,
        stats: {
          playerDamageDealt: battleData.damage_dealt,
          playerDamageReceived: battleData.damage_received,
          playerShipsLost: battleData.ships_lost,
          isPerfectWin: battleData.is_perfect_win
        },
        reward_luminios: battleData.reward_luminios
      };

      setBattleResult(replayData);
      setShowBattle(true);
    } catch (error) {
      console.error('Error loading replay:', error);
      alert('Ошибка загрузки повтора боя');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px', animation: 'pulse 2s infinite' }}>🚀</div>
          <div style={{ fontSize: '1.2rem' }}>
            Загружаем космический флот...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#ff4444', marginBottom: '15px' }}>Ошибка загрузки</h2>
          <p style={{ color: '#aaa', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #ff6600, #ff8800)',
              border: 'none',
              borderRadius: '15px',
              padding: '15px 30px',
              color: '#fff',
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}
          >
            🔄 Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <AccessControl telegramId={player?.telegram_id}>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        padding: '20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Заголовок */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <h1 style={{
              color: '#ff6600',
              fontSize: '2.5rem',
              margin: '0 0 10px 0',
              textShadow: '0 0 20px #ff6600'
            }}>
              🚀 Cosmic Fleet Commander
            </h1>
            <p style={{
              color: '#aaa',
              fontSize: '1.1rem',
              margin: 0
            }}>
              Командуйте своим космическим флотом
            </p>
          </div>

          {/* Навигация */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            marginBottom: '30px'
          }}>
            {[
              { id: 'wallet' as ActiveTab, label: '💎 Кошелек', emoji: '💎' },
              { id: 'hangar' as ActiveTab, label: '🚢 Ангар', emoji: '🚢' },
              { id: 'shop' as ActiveTab, label: '🛒 Верфь', emoji: '🛒' },
              { id: 'history' as ActiveTab, label: '📜 История', emoji: '📜' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, #ff6600, #ff8800)'
                    : 'rgba(255, 102, 0, 0.2)',
                  border: '2px solid #ff6600',
                  borderRadius: '15px',
                  padding: '12px 25px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: activeTab === tab.id
                    ? '0 5px 15px rgba(255, 102, 0, 0.4)'
                    : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Кнопка боя (всегда видна в ангаре) */}
          {activeTab === 'hangar' && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'rgba(0, 240, 255, 0.1)',
                padding: '15px 20px',
                borderRadius: '15px',
                border: '2px solid #00f0ff',
                textAlign: 'center'
              }}>
                <div style={{ color: '#00f0ff', fontSize: '0.9rem', marginBottom: '5px' }}>
                  Флот готов к бою
                </div>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>
                  {formation.length} {formation.length === 1 ? 'корабль' : 'кораблей'}
                </div>
              </div>

              <button
                onClick={handleStartBattle}
                disabled={formation.length === 0 || formation.filter(s => s.health > 0).length === 0}
                style={{
                  background: (formation.length > 0 && formation.filter(s => s.health > 0).length > 0)
                    ? 'linear-gradient(135deg, #ff4444, #cc0000)'
                    : 'rgba(255, 68, 68, 0.3)',
                  border: 'none',
                  borderRadius: '15px',
                  padding: '15px 25px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: (formation.length > 0 && formation.filter(s => s.health > 0).length > 0) ? 'pointer' : 'not-allowed',
                  boxShadow: (formation.length > 0 && formation.filter(s => s.health > 0).length > 0)
                    ? '0 5px 15px rgba(255, 68, 68, 0.4)'
                    : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {formation.length === 0 ? '⚠️ Нет флота' : (formation.filter(s => s.health > 0).length === 0 ? '🔧 Ремонт' : '⚔️ В бой!')}
              </button>
            </div>
          )}

          {/* Контент */}
          <div style={{ marginBottom: '30px' }}>
            {activeTab === 'wallet' && (
              <LuminiosWallet
                luminiosBalance={luminiosBalance}
                csBalance={csBalance}
                onExchange={exchangeCSToLuminios}
              />
            )}

            {activeTab === 'hangar' && (
              <>
                {/* Текущая формация */}
                {formation.length > 0 && (
                  <div style={{
                    background: 'rgba(0, 240, 255, 0.1)',
                    borderRadius: '20px',
                    padding: '20px',
                    border: '2px solid #00f0ff',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ color: '#00f0ff', marginBottom: '15px' }}>⚔️ Боевая формация ({formation.length}/{cosmicFleet.maxFormationSlots || 3})</h3>
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}>
                      {formation.map(ship => {
                        const needsRepair = ship.health < ship.maxHealth;
                        const healthPercent = (ship.health / ship.maxHealth) * 100;
                        const healthColor = healthPercent > 70 ? '#44ff44' : healthPercent > 30 ? '#ffaa00' : '#ff4444';

                        return (
                          <div key={ship.id} style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            padding: '10px 15px',
                            border: '1px solid #00f0ff',
                            position: 'relative',
                            minWidth: '150px'
                          }}>
                            <button
                              onClick={() => handleAddToFormation(ship.id)}
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: '#ff4444',
                                border: 'none',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              ×
                            </button>
                            <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>{ship.name}</div>
                            <div style={{ color: healthColor, fontSize: '0.8rem', marginBottom: '8px' }}>
                              ❤️ {ship.health}/{ship.maxHealth}
                            </div>
                            {needsRepair && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await repairShip(ship.id);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #ffaa00, #ff8800)',
                                  border: 'none',
                                  borderRadius: '5px',
                                  padding: '4px 8px',
                                  color: '#fff',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  width: '100%'
                                }}
                              >
                                🔧 Ремонт
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <FleetHangar
                  ships={fleet.filter(ship => !formation.map(s => s.id).includes(ship.id))}
                  onSelectShip={handleSelectShip}
                  selectedShipId={selectedShip?.id}
                  onRepairShip={repairShip}
                  onAddToFormation={handleAddToFormation}
                  formationShipIds={formation.map(s => s.id)}
                />
              </>
            )}

            {activeTab === 'shop' && (
              <ShipShop
                luminiosBalance={luminiosBalance}
                onPurchaseShip={purchaseShip}
              />
            )}

            {activeTab === 'history' && (
              <BattleHistory
                telegramId={player?.telegram_id || 0}
                onReplay={handleReplayFromHistory}
              />
            )}
          </div>

          {/* Статистика внизу */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginTop: '30px'
          }}>
            <div style={{
              background: 'rgba(255, 102, 0, 0.1)',
              padding: '15px',
              borderRadius: '15px',
              border: '1px solid #ff6600',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ff6600', fontSize: '0.9rem' }}>💎 Luminios</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {luminiosBalance.toLocaleString()}
              </div>
            </div>

            <div style={{
              background: 'rgba(0, 240, 255, 0.1)',
              padding: '15px',
              borderRadius: '15px',
              border: '1px solid #00f0ff',
              textAlign: 'center'
            }}>
              <div style={{ color: '#00f0ff', fontSize: '0.9rem' }}>🚢 Кораблей</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {fleet.length}
              </div>
            </div>

            <div style={{
              background: 'rgba(68, 255, 68, 0.1)',
              padding: '15px',
              borderRadius: '15px',
              border: '1px solid #44ff44',
              textAlign: 'center'
            }}>
              <div style={{ color: '#44ff44', fontSize: '0.9rem' }}>⚔️ Побед</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {cosmicFleet.player?.wins || 0}
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 68, 68, 0.1)',
              padding: '15px',
              borderRadius: '15px',
              border: '1px solid #ff4444',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ff4444', fontSize: '0.9rem' }}>💀 Поражений</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {cosmicFleet.player?.losses || 0}
              </div>
            </div>
          </div>

          {/* Кнопка возврата на главную */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '30px',
            paddingBottom: '20px'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'linear-gradient(135deg, #8a2be2, #6a0dad)',
                border: '2px solid #8a2be2',
                borderRadius: '15px',
                padding: '15px 40px',
                color: '#fff',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 5px 15px rgba(138, 43, 226, 0.4)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(138, 43, 226, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(138, 43, 226, 0.4)';
              }}
            >
              <span>🏠</span>
              <span>На главную</span>
            </button>
          </div>
        </div>

        {/* Модальное окно боя - replay */}
        {showBattle && battleResult && (
          <BattleReplay
            battleLog={battleResult.battleLog}
            playerFleet={battleResult.playerFleet}
            enemyFleet={battleResult.enemyFleet}
            onComplete={handleBattleComplete}
          />
        )}

        {/* Модальное окно наград */}
        {showRewards && battleResult && (
          <BattleRewards
            result={battleResult.result}
            luminiosReward={battleResult.reward_luminios || 0}
            stats={battleResult.stats}
            rounds={battleResult.rounds}
            onClose={handleCloseRewards}
            onRetry={handleRetryBattle}
          />
        )}
      </div>
    </AccessControl>
  );
};

export default CosmicFleetGame;