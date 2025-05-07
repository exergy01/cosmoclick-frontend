import React, { useEffect } from 'react';
import TopBar from '../components/TopBar';
import MainMenu from '../components/MainMenu';
import { usePlayer } from './context/PlayerContext';

const ReferralPage: React.FC = () => {
  const { player, generateReferralLink, getReferralStats, loading, error, setPlayer } = usePlayer();

  useEffect(() => {
    if (player) {
      if (!player.referral_link) {
        generateReferralLink();
      }
      getReferralStats();
    }
  }, [player, generateReferralLink, getReferralStats]);

  const handleRefreshStats = () => {
    // Сбрасываем hasFetchedStats через обновление player
    setPlayer(prev => prev ? { ...prev, referrals_count: undefined } : prev);
    getReferralStats();
  };

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://cosmoclick-backend.onrender.com'
    : 'http://localhost:5000';

  return (
    <div style={{
      backgroundImage: 'url(/backgrounds/cosmo-bg-1.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      backgroundColor: '#000022',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
      color: '#00f0ff'
    }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '90px 10px 130px 10px'
      }}>
        <TopBar />
        <div style={{ marginTop: '10px', width: '90%' }}>
          {loading ? (
            <p style={{ textAlign: 'center', fontSize: '16px' }}>Загрузка...</p>
          ) : error ? (
            <p style={{ textAlign: 'center', fontSize: '16px', color: '#ff5555' }}>{error}</p>
          ) : player ? (
            <div style={{
              padding: '10px',
              marginBottom: '20px',
              backgroundColor: 'rgba(0, 0, 34, 0.8)'
            }}>
              <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>Партнерская программа</h3>
              <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                Приглашайте друзей и получайте бонусы!
              </p>
              {player.referral_link ? (
                <div style={{
                  backgroundColor: 'rgba(0, 0, 34, 0.9)',
                  border: '1px solid #00f0ff',
                  borderRadius: '8px',
                  padding: '8px',
                  marginBottom: '8px',
                  boxShadow: '0 0 5px #00f0ff'
                }}>
                  <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                    Ваша реферальная ссылка:{' '}
                    <a href={player.referral_link} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff' }}>
                      {player.referral_link}
                    </a>
                  </p>
                  <p style={{ fontSize: '14px', marginBottom: '5px' }}>
                    Приглашено друзей: {player.referrals_count || 0}
                  </p>
                  <button
                    onClick={handleRefreshStats}
                    style={{
                      backgroundColor: 'rgba(0, 240, 255, 0.2)',
                      border: '2px solid #00f0ff',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      color: '#00f0ff',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      boxShadow: '0 0 6px #00f0ff',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Обновить статистику
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateReferralLink}
                  style={{
                    backgroundColor: 'rgba(0, 240, 255, 0.2)',
                    border: '2px solid #00f0ff',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#00f0ff',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 0 6px #00f0ff',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Сгенерировать реферальную ссылку
                </button>
              )}
            </div>
          ) : (
            <p style={{ textAlign: 'center', fontSize: '16px' }}>Игрок не загружен</p>
          )}
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: 'transparent',
        boxShadow: 'none',
        borderTop: 'none'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '5px 0',
          backgroundColor: 'rgba(0, 0, 34, 0.9)'
        }}>
          <MainMenu />
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;