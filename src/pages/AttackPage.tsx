import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AttackPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [totalPerHour, setTotalPerHour] = useState({ totalCccPerHour: 0, totalCsPerHour: 0 });

  const calculateTotalPerHour = useCallback(async () => {
    if (!player || !player.drones || !player.telegram_id) return { ccc: 0, cs: 0, ton: 0 };
    try {
      const dronesData = await axios.get(`${API_URL}/api/shop/drones/${player.telegram_id}`).then(res => res.data);
      const totalCccPerHour = player.drones.reduce((sum: number, d: any) => {
        const drone = dronesData.find((item: any) => item.id === d.id && item.system === d.system);
        return sum + (drone?.cccPerDay ? drone.cccPerDay / 24 : 0);
      }, 0);
      return { ccc: Number(totalCccPerHour.toFixed(5)), cs: 0, ton: 0 };
    } catch (err) {
      console.error('Error fetching drones for total per hour:', err);
      return { ccc: 0, cs: 0, ton: 0 };
    }
  }, [player?.drones, player?.telegram_id]);

  useEffect(() => {
    const fetchTotalPerHour = async () => {
      const { ccc: totalCccPerHour } = await calculateTotalPerHour();
      setTotalPerHour({ totalCccPerHour, totalCsPerHour: 0 });
    };
    fetchTotalPerHour();
  }, [calculateTotalPerHour]);

  const colorStyle = player?.color || '#00f0ff';

  return (
    <div
      style={{
        backgroundImage: `url(/assets/cosmo-bg-${currentSystem}.png)`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px',
        position: 'relative'
      }}
    >
      {/* Верхняя панель с валютами */}
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />

      {/* Основной контент */}
      <div style={{ marginTop: '80px', paddingBottom: '130px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <h2 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2rem', 
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            ⚔️ {t('attack')}
          </h2>
          
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: `0 0 30px ${colorStyle}30`,
            maxWidth: '400px',
            width: '100%'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚧</div>
            <h3 style={{ 
              color: colorStyle, 
              marginBottom: '15px', 
              fontSize: '1.5rem' 
            }}>
              {t('under_construction')}
            </h3>
            <p style={{ 
              color: '#ccc', 
              lineHeight: '1.6',
              fontSize: '1rem'
            }}>
              Режим атак находится в разработке.<br/>
              Скоро здесь появятся эпические космические сражения!
            </p>
            
            <div style={{ 
              marginTop: '30px', 
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              border: `1px solid ${colorStyle}50`
            }}>
              <p style={{ color: colorStyle, fontWeight: 'bold', marginBottom: '10px' }}>
                🌟 Ожидайте в будущих обновлениях:
              </p>
              <ul style={{ 
                textAlign: 'left', 
                color: '#ccc',
                lineHeight: '1.8',
                listStyle: 'none',
                padding: 0
              }}>
                <li>🚀 PvP сражения между игроками</li>
                <li>🛡️ Защита своих ресурсов</li>
                <li>💥 Атаки на чужие астероиды</li>
                <li>🏆 Рейтинговая система</li>
                <li>⚡ Специальные боевые дроны</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default AttackPage;