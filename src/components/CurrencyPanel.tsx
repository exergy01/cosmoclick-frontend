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
          📈 {t('per_hour')}: {cccPerHour.toFixed(2)} CCC<br/>
          🌟 {t('per_hour')}: {csPerHour.toFixed(2)} CS
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '1rem' }}>✨ CS: {(typeof player.cs === 'number' ? player.cs : parseFloat(player.cs || '0')).toFixed(5)}</p>
        <p style={{ fontSize: '1rem' }}>💎 TON: {(typeof player.ton === 'number' ? player.ton : parseFloat(player.ton || '0')).toFixed(9)}</p>
      </div>
    </div>
  );
};

export default CurrencyPanel;