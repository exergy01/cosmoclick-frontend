/**
 * 📜 ИСТОРИЯ БОЁВ
 * Galactic Empire v2.0
 */

import React from 'react';

interface Battle {
  id: number;
  battle_type: 'pve' | 'pvp';
  winner: string | null;
  rounds: number;
  reward_luminios: number;
  created_at: string;
  player1_id: string;
  player2_id: string | null;
  player1_race: string;
  player2_race: string | null;
}

interface BattleHistoryProps {
  battles: Battle[];
  telegramId: string;
  onReplayBattle: (battleId: number) => void;
  lang: string;
  raceColor: string;
}

const RACE_NAMES: any = {
  amarr: { ru: 'Амарр', en: 'Amarr' },
  caldari: { ru: 'Калдари', en: 'Caldari' },
  gallente: { ru: 'Галленте', en: 'Gallente' },
  minmatar: { ru: 'Минматар', en: 'Minmatar' },
  human: { ru: 'Люди', en: 'Human' },
  zerg: { ru: 'Зерги', en: 'Zerg' },
  bot: { ru: 'Бот', en: 'Bot' }
};

const BattleHistory: React.FC<BattleHistoryProps> = ({
  battles,
  telegramId,
  onReplayBattle,
  lang,
  raceColor
}) => {
  const t = {
    ru: {
      title: 'История боёв',
      empty: 'Нет боёв',
      emptyDesc: 'Начните свой первый бой!',
      victory: 'Победа',
      defeat: 'Поражение',
      draw: 'Ничья',
      rounds: 'раундов',
      reward: 'Награда',
      vs: 'против',
      bot: 'Бот',
      replay: 'Повтор',
      pve: 'PvE',
      pvp: 'PvP'
    },
    en: {
      title: 'Battle History',
      empty: 'No battles',
      emptyDesc: 'Start your first battle!',
      victory: 'Victory',
      defeat: 'Defeat',
      draw: 'Draw',
      rounds: 'rounds',
      reward: 'Reward',
      vs: 'vs',
      bot: 'Bot',
      replay: 'Replay',
      pve: 'PvE',
      pvp: 'PvP'
    }
  };

  const text = t[lang as 'ru' | 'en'] || t.en;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return lang === 'ru' ? 'Только что' : 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}${lang === 'ru' ? ' мин. назад' : ' min ago'}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}${lang === 'ru' ? ' ч. назад' : ' hr ago'}`;
    return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US');
  };

  if (battles.length === 0) {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '20px',
        padding: '40px',
        border: '2px solid #444',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚔️</div>
        <h3 style={{ color: '#fff', marginBottom: '15px' }}>
          {text.empty}
        </h3>
        <p style={{ color: '#aaa', lineHeight: '1.6' }}>
          {text.emptyDesc}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '20px',
      padding: '25px',
      border: `2px solid ${raceColor}`,
      boxShadow: `0 0 20px ${raceColor}40`
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '2rem', marginRight: '15px' }}>📜</div>
        <h3 style={{
          color: raceColor,
          margin: 0,
          fontSize: '1.4rem',
          textShadow: `0 0 10px ${raceColor}`
        }}>
          {text.title}
        </h3>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {battles.map(battle => {
          const isVictory = battle.winner === telegramId;
          const isDraw = battle.winner === null;
          const isDefeat = !isVictory && !isDraw;

          const enemyRace = battle.battle_type === 'pve'
            ? 'bot'
            : (battle.player1_id === telegramId ? battle.player2_race : battle.player1_race) || 'bot';

          return (
            <div
              key={battle.id}
              style={{
                background: isVictory
                  ? `linear-gradient(135deg, ${raceColor}22, ${raceColor}11)`
                  : isDefeat
                    ? 'linear-gradient(135deg, rgba(255, 68, 68, 0.2), rgba(255, 68, 68, 0.1))'
                    : 'linear-gradient(135deg, rgba(255, 170, 0, 0.2), rgba(255, 170, 0, 0.1))',
                border: isVictory
                  ? `2px solid ${raceColor}`
                  : isDefeat
                    ? '2px solid #ff4444'
                    : '2px solid #ffaa00',
                borderRadius: '15px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: isVictory ? `0 0 15px ${raceColor}40` : 'none'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    fontSize: '1.5rem',
                    marginRight: '10px'
                  }}>
                    {isVictory ? '🏆' : isDefeat ? '💀' : '🤝'}
                  </div>
                  <div>
                    <div style={{
                      color: isVictory ? raceColor : isDefeat ? '#ff4444' : '#ffaa00',
                      fontWeight: 'bold',
                      fontSize: '1.1rem'
                    }}>
                      {isVictory ? text.victory : isDefeat ? text.defeat : text.draw}
                    </div>
                    <div style={{
                      color: '#aaa',
                      fontSize: '0.8rem',
                      marginTop: '3px'
                    }}>
                      {formatDate(battle.created_at)}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '20px',
                  color: '#ccc',
                  fontSize: '0.85rem'
                }}>
                  <div>
                    <span style={{ color: '#aaa' }}>{text.vs}:</span>{' '}
                    {enemyRace === 'bot'
                      ? text.bot
                      : RACE_NAMES[enemyRace]?.[lang] || enemyRace}
                  </div>
                  <div>
                    <span style={{ color: '#aaa' }}>⚔️</span> {battle.rounds} {text.rounds}
                  </div>
                  <div>
                    <span style={{
                      background: battle.battle_type === 'pve' ? 'rgba(100, 200, 255, 0.2)' : 'rgba(255, 100, 100, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '5px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: battle.battle_type === 'pve' ? '#64c8ff' : '#ff6464'
                    }}>
                      {text[battle.battle_type]}
                    </span>
                  </div>
                </div>

                {battle.reward_luminios > 0 && (
                  <div style={{
                    marginTop: '10px',
                    color: '#ffaa00',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}>
                    💎 +{battle.reward_luminios} Luminios
                  </div>
                )}
              </div>

              <button
                onClick={() => onReplayBattle(battle.id)}
                style={{
                  background: `linear-gradient(135deg, ${raceColor}, ${raceColor}CC)`,
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
              >
                📺 {text.replay}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BattleHistory;
