import React, { useState } from 'react';
import { useNewPlayer } from '../../../context/NewPlayerContext';
import AccessControl from './components/AccessControl';
import LuminiosWallet from './components/LuminiosWallet';
import FleetHangar from './components/FleetHangar';
import ShipShop from './components/ShipShop';
import BattleSystem from './components/BattleSystem';
import { useCosmicFleet } from './hooks/useCosmicFleet';
import { Ship } from './types/ships';

type ActiveTab = 'hangar' | 'shop' | 'wallet';

const CosmicFleetGame: React.FC = () => {
  const { player } = useNewPlayer();
  const [activeTab, setActiveTab] = useState<ActiveTab>('hangar');
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [showBattle, setShowBattle] = useState(false);

  const cosmicFleet = useCosmicFleet({
    telegramId: player?.telegram_id || 0,
    initialCsBalance: parseFloat(player?.cs || '0')
  });

  const {
    fleet,
    luminiosBalance,
    csBalance,
    loading,
    error,
    exchangeCSToLuminios,
    purchaseShip,
    repairShip,
    battlePvE
  } = cosmicFleet;

  const handleSelectShip = (ship: Ship) => {
    setSelectedShip(ship);
  };

  const handleStartBattle = () => {
    if (selectedShip && selectedShip.health > 0) {
      setShowBattle(true);
    }
  };

  const handleBattleComplete = async (result: any) => {
    setShowBattle(false);
    // Данные уже обновлены в хуке useCosmicFleet
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
              { id: 'shop' as ActiveTab, label: '🛒 Верфь', emoji: '🛒' }
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

          {/* Кнопки действий (если корабль выбран) */}
          {selectedShip && activeTab === 'hangar' && (
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
                  Выбран корабль
                </div>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>
                  {selectedShip.name}
                </div>
              </div>

              <button
                onClick={handleStartBattle}
                disabled={selectedShip.health <= 0}
                style={{
                  background: selectedShip.health > 0
                    ? 'linear-gradient(135deg, #ff4444, #cc0000)'
                    : 'rgba(255, 68, 68, 0.3)',
                  border: 'none',
                  borderRadius: '15px',
                  padding: '15px 25px',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: selectedShip.health > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: selectedShip.health > 0
                    ? '0 5px 15px rgba(255, 68, 68, 0.4)'
                    : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {selectedShip.health > 0 ? '⚔️ В бой!' : '🔧 Требует ремонта'}
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
              <FleetHangar
                ships={fleet}
                onSelectShip={handleSelectShip}
                selectedShipId={selectedShip?.id}
                onRepairShip={repairShip}
              />
            )}

            {activeTab === 'shop' && (
              <ShipShop
                luminiosBalance={luminiosBalance}
                onPurchaseShip={purchaseShip}
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
              onClick={() => window.location.href = '/'}
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

        {/* Модальное окно боя */}
        {showBattle && selectedShip && (
          <BattleSystem
            playerShip={selectedShip}
            onBattleComplete={handleBattleComplete}
            onClose={() => setShowBattle(false)}
          />
        )}
      </div>
    </AccessControl>
  );
};

export default CosmicFleetGame;