import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const API_URL = process.env.REACT_APP_API_URL || 'https://cosmoclick-backend.onrender.com';

const AttackPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [totalPerHour, setTotalPerHour] = useState({ totalCccPerHour: 0, totalCsPerHour: 0 });
  const [hasTestAccess, setHasTestAccess] = useState(false);

  // 💡 НОВЫЙ КОД: Состояние для отслеживания кликов
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTournamentsClick = () => {
    setClickCount(prevCount => prevCount + 1);

    // Сброс счетчика, если новый клик не последовал в течение 500ms
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 500);
  };

  useEffect(() => {
    if (clickCount >= 5) {
      setClickCount(0);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      // 💡 НОВЫЙ КОД: Заглушка для роута
      if (process.env.NODE_ENV === 'development') console.log("Secret function triggered! Redirecting to /pvp");
      navigate('/pvp');
    }
  }, [clickCount, navigate]);

  // Проверка тестового доступа для показа кнопок к играм
  useEffect(() => {
    const checkTestAccess = async () => {
      if (!player?.telegram_id) return;

      try {
        const response = await axios.get(`${API_URL}/api/admin/auth/test-access/${player.telegram_id}`);
        setHasTestAccess(response.data.hasTestAccess);
      } catch (error) {
        console.error('Test access check error:', error);
        setHasTestAccess(false);
      }
    };

    checkTestAccess();
  }, [player?.telegram_id]);

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
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />

      <div style={{ 
        marginTop: '80px', 
        paddingBottom: '130px',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: '20px',
        paddingRight: '20px',
        boxSizing: 'border-box',
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', width: '100%' }}>
          <h2 style={{
            color: colorStyle,
            textShadow: `0 0 10px ${colorStyle}`,
            fontSize: '2rem',
            marginBottom: '30px',
            textAlign: 'center',
            fontWeight: 'bold',
          }}>
            ⚔️ {t('attack_page.attack')}
          </h2>

          {hasTestAccess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', width: '100%', maxWidth: '400px' }}>
              <button
                onClick={() => navigate('/games/cosmic-fleet')}
                style={{
                  background: `linear-gradient(135deg, ${colorStyle}, ${colorStyle}80)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '15px',
                  padding: '20px 40px',
                  color: '#fff',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: `0 5px 20px ${colorStyle}60`,
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 8px 30px ${colorStyle}80`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 5px 20px ${colorStyle}60`;
                }}
              >
                🚀 Cosmic Fleet Commander
              </button>

              <button
                onClick={() => navigate('/games/galactic-empire')}
                style={{
                  background: 'linear-gradient(135deg, #9d4edd, #7b2cbf)',
                  border: '2px solid #c77dff',
                  borderRadius: '15px',
                  padding: '20px 40px',
                  color: '#fff',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 5px 20px rgba(157, 78, 221, 0.6)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(157, 78, 221, 0.8)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 5px 20px rgba(157, 78, 221, 0.6)';
                }}
              >
                🌌 Galactic Empire v2.0
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '10px',
                  background: '#ff006e',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 10px rgba(255, 0, 110, 0.6)',
                }}>
                  BETA
                </span>
              </button>
            </div>
          )}

          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            border: `2px solid ${colorStyle}30`,
            borderRadius: '20px',
            padding: '40px 20px',
            textAlign: 'center',
            boxShadow: `0 0 30px ${colorStyle}30`,
            maxWidth: '400px',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚧</div>
            <h3 style={{ 
              color: colorStyle, 
              marginBottom: '15px', 
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}>
              {t('attack_page.under_construction')}
            </h3>
            <p style={{ 
              color: '#ccc', 
              lineHeight: '1.6',
              fontSize: '1rem',
              maxWidth: '300px',
              margin: '0 auto 20px auto',
            }}>
              {t('attack_page.attack_page_text_1')}<br/>
              {t('attack_page.attack_page_text_2')}
            </p>
            
            <div style={{ 
              marginTop: '30px', 
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              border: `1px solid ${colorStyle}50`,
              textAlign: 'left',
            }}>
              <p style={{ 
                color: colorStyle, 
                fontWeight: 'bold', 
                marginBottom: '10px',
                textAlign: 'center',
              }}>
                {t('attack_page.future_updates_title')}
              </p>
              <ul style={{ 
                textAlign: 'left', 
                color: '#ccc',
                lineHeight: '1.8',
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}>
                <li>{t('attack_page.pve_battles')}</li>
                <li>{t('attack_page.pvp_battles')}</li>
                <li>{t('attack_page.resource_protection')}</li>
                <li>{t('attack_page.rating_system')}</li>
                <li>{t('attack_page.special_ships')}</li>
                <li>{t('attack_page.collect_cs_for_battles')}</li>
                {/* 💡 НОВЫЙ КОД: Элемент с обработчиком кликов, но без визуальных изменений */}
                <li onClick={handleTournamentsClick}>{t('attack_page.tournaments')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default AttackPage;