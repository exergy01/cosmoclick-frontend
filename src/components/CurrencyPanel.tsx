import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface CurrencyPanelProps {
  player: any;
  currentSystem: number;
  colorStyle: string;
}

const CurrencyPanel: React.FC<CurrencyPanelProps> = ({ player, currentSystem, colorStyle }) => {
  const { t } = useTranslation();
  
  if (!player) {
    return null;
  }

  // 🎯 МЕМОИЗИРОВАННАЯ СКОРОСТЬ CCC ПО ВСЕМ СИСТЕМАМ 1-3
  const cccSpeedPerSecond = useMemo(() => {
    if (!player?.drones) {
      return 0;
    }
    
    let totalCccPerSecond = 0;
    
    // Проходим по системам 1-3 и считаем из реальных данных дронов
    [1, 2, 3].forEach(system => {
      const systemDrones = player.drones.filter((d: any) => d.system === system);
      const totalCccPerDay = systemDrones.reduce((sum: any, d: any) => sum + (d.cccPerDay || 0), 0);
      
      // Базовая скорость в CCC/секунду
      const baseSpeed = totalCccPerDay / (24 * 60 * 60);
      
      // 🎉 БОНУС: +1% за полную коллекцию дронов (15 штук)
      if (systemDrones.length === 15) {
        totalCccPerSecond += baseSpeed * 1.01; // +1%
      } else {
        totalCccPerSecond += baseSpeed;
      }
    });
    
    return totalCccPerSecond;
  }, [player?.drones]);

  // 🎯 МЕМОИЗИРОВАННАЯ СКОРОСТЬ CS ПО СИСТЕМЕ 4
  const csSpeedPerSecond = useMemo(() => {
    // ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЕ ДАННЫЕ ИЗ mining_speed_data
    return player?.mining_speed_data?.[4] || 0;
  }, [player?.mining_speed_data]);

  // Рассчитываем скорости в час
  const cccPerHour = cccSpeedPerSecond * 3600;
  const csPerHour = csSpeedPerSecond * 3600;

  // 👑 Проверяем премиум статус игрока
  const premiumStatus = useMemo(() => {
    if (!player) return { hasPremium: false };

    // Проверяем постоянный премиум
    if (player.premium_no_ads_forever) {
      return {
        hasPremium: true,
        type: 'forever'
      };
    }

    // Проверяем временный премиум
    if (player.premium_no_ads_until) {
      const now = new Date();
      const premiumUntil = new Date(player.premium_no_ads_until);

      if (premiumUntil > now) {
        const daysLeft = Math.ceil((premiumUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          hasPremium: true,
          type: 'temporary',
          daysLeft: daysLeft
        };
      }
    }

    return { hasPremium: false };
  }, [player?.premium_no_ads_forever, player?.premium_no_ads_until]);

  return (
    <div style={{ 
      width: '93%', 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '3px', 
      background: 'rgba(0, 0, 0, 0.5)', 
      border: `2px solid ${colorStyle}`, 
      borderRadius: '10px', 
      boxShadow: `0 0 20px ${colorStyle}`, 
      position: 'fixed', 
      top: 0, 
      left: '50%', 
      transform: 'translateX(-50%)', 
      zIndex: 100 
    }}>
      <div style={{ textAlign: 'left' }}>
        <p style={{ fontSize: '1rem' }}>
          💠 CCC: {(typeof player.ccc === 'number' ? player.ccc : parseFloat(player.ccc || '0')).toFixed(5)}<br/>
          📈 CCC {t('per_hour')}: {cccPerHour.toFixed(2)} <br/>
          📈 <strong>CS {t('per_hour')}: {csPerHour.toFixed(2)} </strong>
        </p>
      </div>
      <div style={{ textAlign: 'right', position: 'relative' }}>
        {/* 👑 КОРОНА VIP СТАТУСА */}
        {premiumStatus?.hasPremium && (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            fontSize: '1.2rem',
            textShadow: '0 0 10px #FFD700',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            zIndex: 10
          }}>
            👑
            {premiumStatus.type === 'temporary' && premiumStatus.daysLeft && (
              <span style={{
                fontSize: '0.6rem',
                color: '#FFD700',
                fontWeight: 'bold'
              }}>
                {premiumStatus.daysLeft}д
              </span>
            )}
          </div>
        )}

        {/* 🎨 СИММЕТРИЧНО: один <p> с <br/> как слева */}
        <p style={{ fontSize: '1rem' }}>
          ✨ CS: {(typeof player.cs === 'number' ? player.cs : parseFloat(player.cs || '0')).toFixed(5)}<br/>
          💎 TON: {(typeof player.ton === 'number' ? player.ton : parseFloat(player.ton || '0')).toFixed(9)}<br/>
          ⭐ Stars: {(player.telegram_stars || 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default CurrencyPanel;