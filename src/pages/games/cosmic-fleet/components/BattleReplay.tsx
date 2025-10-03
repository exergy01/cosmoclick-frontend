import React, { useState, useEffect } from 'react';

interface BattleEvent {
  attacker: { id: string; name: string; side: 'player' | 'enemy' };
  target: { id: string; name: string; side: 'player' | 'enemy' };
  damage: number;
  isCrit: boolean;
  targetHp: number;
  killed: boolean;
  isCounter?: boolean;
}

interface BattleRound {
  round: number;
  events: BattleEvent[];
}

interface BattleReplayProps {
  battleLog: BattleRound[];
  playerFleet: any[];
  enemyFleet: any[];
  onComplete?: () => void;
}

const BattleReplay: React.FC<BattleReplayProps> = ({
  battleLog,
  playerFleet,
  enemyFleet,
  onComplete
}) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [currentEvent, setCurrentEvent] = useState(0);
  const [log, setLog] = useState<string[]>(['--- Раунд 1 ---']);
  const [fleetState, setFleetState] = useState({
    player: playerFleet.map(s => ({ ...s, hp: s.maxHp })),
    enemy: enemyFleet.map(s => ({ ...s, hp: s.maxHp }))
  });

  useEffect(() => {
    if (!battleLog || battleLog.length === 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      const round = battleLog[currentRound];
      if (!round || currentEvent >= round.events.length) {
        // Переход к следующему раунду
        if (currentRound < battleLog.length - 1) {
          setCurrentRound(prev => prev + 1);
          setCurrentEvent(0);
          setLog(prev => [...prev, `\n--- Раунд ${currentRound + 2} ---`]);
        } else {
          // Бой закончен
          clearInterval(timer);
          setTimeout(() => onComplete?.(), 1000);
        }
        return;
      }

      // Воспроизводим событие
      const event = round.events[currentEvent];

      // Обновляем HP
      setFleetState(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        const targetFleet = event.target.side === 'player' ? newState.player : newState.enemy;
        const target = targetFleet.find((s: any) => s.id === event.target.id);
        if (target) {
          target.hp = event.targetHp;
        }
        return newState;
      });

      // Добавляем в лог
      const attackerName = event.attacker.side === 'player' ? '🟢' : '🔴';
      const critText = event.isCrit ? ' КРИТ!' : '';
      const counterText = event.isCounter ? ' (контратака)' : '';
      const killedText = event.killed ? ' 💀' : '';

      setLog(prev => [
        ...prev,
        `${attackerName} ${event.attacker.name}${counterText} → ${event.target.name}: ${event.damage} урона${critText}${killedText}`
      ]);

      setCurrentEvent(prev => prev + 1);
    }, 800); // 800ms между событиями

    return () => clearInterval(timer);
  }, [currentRound, currentEvent, battleLog, onComplete]);

  // Подсчёт живых кораблей
  const playerAlive = fleetState.player.filter(s => s.hp > 0).length;
  const enemyAlive = fleetState.enemy.filter(s => s.hp > 0).length;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      {/* Кнопка закрыть */}
      <button
        onClick={() => onComplete?.()}
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'rgba(255, 68, 68, 0.8)',
          border: '2px solid #ff4444',
          borderRadius: '10px',
          padding: '10px 20px',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 68, 68, 1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 68, 68, 0.8)';
        }}
      >
        ✕ Закрыть
      </button>

      {/* Заголовок */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: '#00f0ff', margin: 0 }}>
          ⚔️ Раунд {currentRound + 1} / {battleLog.length}
        </h2>
        <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>
          🟢 Ваш флот: {playerAlive} | 🔴 Противник: {enemyAlive}
        </div>
      </div>

      {/* Флоты */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Ваш флот */}
        <div>
          <h3 style={{ color: '#44ff44', marginBottom: '10px' }}>🟢 Ваш флот</h3>
          {fleetState.player.map(ship => (
            <div key={ship.id} style={{
              background: ship.hp > 0 ? 'rgba(68, 255, 68, 0.1)' : 'rgba(255, 68, 68, 0.1)',
              border: `1px solid ${ship.hp > 0 ? '#44ff44' : '#ff4444'}`,
              borderRadius: '8px',
              padding: '8px',
              marginBottom: '5px'
            }}>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>{ship.ship_name}</div>
              <div style={{
                color: ship.hp > 0 ? '#44ff44' : '#ff4444',
                fontSize: '0.8rem'
              }}>
                ❤️ {ship.hp} / {ship.maxHp}
              </div>
            </div>
          ))}
        </div>

        {/* Противник */}
        <div>
          <h3 style={{ color: '#ff4444', marginBottom: '10px' }}>🔴 Противник</h3>
          {fleetState.enemy.map(ship => (
            <div key={ship.id} style={{
              background: ship.hp > 0 ? 'rgba(255, 68, 68, 0.1)' : 'rgba(100, 100, 100, 0.1)',
              border: `1px solid ${ship.hp > 0 ? '#ff4444' : '#666'}`,
              borderRadius: '8px',
              padding: '8px',
              marginBottom: '5px'
            }}>
              <div style={{ color: '#fff', fontWeight: 'bold' }}>{ship.ship_name}</div>
              <div style={{
                color: ship.hp > 0 ? '#ff4444' : '#666',
                fontSize: '0.8rem'
              }}>
                ❤️ {ship.hp} / {ship.maxHp}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Лог боя */}
      <div style={{
        flex: 1,
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid #444',
        borderRadius: '10px',
        padding: '15px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '0.85rem'
      }}>
        {log.map((line, i) => (
          <div key={i} style={{
            color: line.includes('💀') ? '#ff4444' :
                   line.includes('КРИТ') ? '#ffaa00' :
                   line.includes('---') ? '#00f0ff' : '#fff',
            marginBottom: '4px',
            whiteSpace: 'pre-wrap'
          }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattleReplay;
