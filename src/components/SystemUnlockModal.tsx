// SystemUnlockModal.tsx - новый компонент
import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';

interface SystemUnlockModalProps {
  systemId: number;
  onUnlock: () => void;
  onCancel: () => void;
}

const SystemUnlockModal: React.FC<SystemUnlockModalProps> = ({ systemId, onUnlock, onCancel }) => {
  const { player, buySystem } = usePlayer();
  const { t } = useTranslation();

  if (!player) return null;

  const systemNames = [
    'Андромеда',
    'Орион', 
    'Млечный Путь', 
    'Туманность Ориона', 
    'Крабовидная Туманность', 
    'Сомбреро', 
    'Туманность Орла'
  ];

  const systemDescriptions = [
    'Начальная система для освоения основ космической добычи. Здесь вы изучите принципы работы с астероидами, дронами и грузовыми отсеками.',
    'Развитая система с улучшенными астероидами и более мощными дронами. Увеличенная добыча CCC откроет новые возможности.',
    'Родная галактика с богатыми ресурсами и передовыми технологиями. Высокая прибыльность и престижные достижения.',
    'Мистическая область космоса с уникальными астероидами. Повышенные риски компенсируются невероятной добычей.',
    'Остатки взорвавшейся звезды содержат редчайшие минералы. Экстремальная добыча для опытных капитанов.',
    'Элитная система в форме галактического диска. Эксклюзивные ресурсы и максимальная прибыль.',
    'Величественная туманность звездообразования. Предел возможностей космической добычи и абсолютное господство.'
  ];

  // Получаем данные о системе из shopData
  const systemData = {
    1: { price: 0, currency: 'cs' },
    2: { price: 150, currency: 'cs' },
    3: { price: 300, currency: 'cs' },
    4: { price: 500, currency: 'cs' },
    5: { price: 15, currency: 'ton' },
    6: { price: 50, currency: 'ton' },
    7: { price: 500, currency: 'ton' }
  };

  const system = systemData[systemId as keyof typeof systemData];
  const canAfford = system.currency === 'cs' ? 
    parseFloat(player.cs.toString()) >= system.price : 
    parseFloat(player.ton.toString()) >= system.price;

  const handleUnlock = async () => {
    try {
      await buySystem(systemId, system.price);
      onUnlock();
    } catch (err) {
      console.error('Failed to unlock system:', err);
    }
  };

  const colorStyle = player.color || '#00f0ff';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 30, 60, 0.95))`,
        border: `3px solid ${colorStyle}`,
        borderRadius: '20px',
        boxShadow: `0 0 30px ${colorStyle}`,
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        color: '#fff'
      }}>
        <h1 style={{
          fontSize: '2rem',
          color: colorStyle,
          textShadow: `0 0 10px ${colorStyle}`,
          marginBottom: '20px'
        }}>
          🌌 Система {systemId}
        </h1>
        
        <h2 style={{
          fontSize: '1.5rem',
          color: '#fff',
          marginBottom: '20px'
        }}>
          {systemNames[systemId - 1]}
        </h2>

        <p style={{
          fontSize: '1.1rem',
          lineHeight: '1.6',
          marginBottom: '30px',
          color: '#ccc'
        }}>
          {systemDescriptions[systemId - 1]}
        </p>

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          border: `1px solid ${colorStyle}`
        }}>
          <h3 style={{ color: colorStyle, marginBottom: '15px' }}>
            Что вас ждет в этой системе:
          </h3>
          <div style={{ textAlign: 'left', color: '#fff' }}>
            <p>🌍 Уникальные астероиды с ценными ресурсами</p>
            <p>🤖 Продвинутые дроны для автоматической добычи</p>
            <p>📦 Вместительные грузовые отсеки</p>
            <p>💎 Конвертация CCC в CS и TON</p>
            <p>🚀 Путь к космическому могуществу</p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
        }}>
          {systemId > 1 && (
            <button
              onClick={onCancel}
              style={{
                padding: '15px 30px',
                background: 'transparent',
                border: `2px solid #666`,
                borderRadius: '10px',
                color: '#666',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#999';
                e.currentTarget.style.color = '#999';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#666';
                e.currentTarget.style.color = '#666';
              }}
            >
              Отмена
            </button>
          )}
          
          <button
            onClick={handleUnlock}
            disabled={!canAfford}
            style={{
              padding: '20px 40px',
              background: canAfford ? 
                `linear-gradient(135deg, ${colorStyle}20, ${colorStyle}40, ${colorStyle}20)` : 
                'linear-gradient(135deg, #44444420, #44444440, #44444420)',
              border: `3px solid ${canAfford ? colorStyle : '#666'}`,
              borderRadius: '15px',
              color: canAfford ? '#fff' : '#999',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: canAfford ? 
                `0 0 30px ${colorStyle}50, inset 0 0 20px ${colorStyle}20` : 
                '0 0 10px #44444450',
              textShadow: canAfford ? `0 0 10px ${colorStyle}` : 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              if (canAfford) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 0 50px ${colorStyle}, inset 0 0 30px ${colorStyle}30`;
                e.currentTarget.style.background = `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`;
              }
            }}
            onMouseLeave={e => {
              if (canAfford) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 0 30px ${colorStyle}50, inset 0 0 20px ${colorStyle}20`;
                e.currentTarget.style.background = `linear-gradient(135deg, ${colorStyle}20, ${colorStyle}40, ${colorStyle}20)`;
              }
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${colorStyle}40, transparent)`,
              animation: canAfford ? 'shimmer 2s infinite' : 'none'
            }} />
            {system.price === 0 ? 
              '🚀 НАЧАТЬ ИГРУ БЕСПЛАТНО!' : 
              `🔓 РАЗБЛОКИРОВАТЬ ЗА ${system.price} ${system.currency.toUpperCase()}`
            }
          </button>
        </div>

        {!canAfford && system.price > 0 && (
          <p style={{
            marginTop: '15px',
            color: '#ff6b6b',
            fontSize: '0.9rem'
          }}>
            Недостаточно {system.currency.toUpperCase()}. 
            У вас: {system.currency === 'cs' ? 
              parseFloat(player.cs.toString()).toFixed(2) : 
              parseFloat(player.ton.toString()).toFixed(6)
            }
          </p>
        )}
      </div>
    </div>
  );
};

export default SystemUnlockModal;