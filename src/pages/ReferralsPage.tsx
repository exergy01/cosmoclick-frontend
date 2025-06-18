import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

const ReferralsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { player, currentSystem } = usePlayer(); // убрали setPlayer и refreshPlayer
  const [loading, setLoading] = useState(false); // изменили на false, так как данные уже должны быть загружены

  // УБРАЛИ calculateTotalPerHour - теперь CurrencyPanel сам все считает с currentSystem

  // УБРАЛИ useEffect с fetchData - данные загружаются в PlayerContext при старте игры

  const handleShare = () => {
    if (navigator.share && player?.referral_link) {
      navigator.share({
        title: t('share_referral_link'),
        text: `${t('join_cosmo_click')} ${player.referral_link}`,
        url: player.referral_link,
      }).catch(err => console.error('Ошибка share:', err));
    } else {
      console.log('Share failed: referral_link is', player?.referral_link);
      alert(t('share_failed'));
    }
  };

  const handleCopy = () => {
    if (player?.referral_link) {
      navigator.clipboard.writeText(player.referral_link).then(() => {
        alert(t('link_copied'));
      }).catch(err => console.error('Ошибка копирования:', err));
    } else {
      console.log('Copy failed: referral_link is', player?.referral_link);
      alert(t('copy_failed'));
    }
  };

  // Функция для принудительного обновления рефералов (если нужно)
  const refreshReferrals = async () => {
    if (!player?.telegram_id) return;
    
    setLoading(true);
    try {
      const referralsResponse = await axios.get(`${apiUrl}/api/referrals/list/${player.telegram_id}`);
      const honorBoardResponse = await axios.get(`${apiUrl}/api/referrals/honor-board`);
      
      // Здесь нужно будет добавить метод в PlayerContext для обновления только рефералов
      // А не перезаписывать весь объект player
      console.log('Обновленные данные рефералов:', referralsResponse.data);
      console.log('Обновленная доска почета:', honorBoardResponse.data);
      
      // TODO: Добавить updateReferrals в PlayerContext
      // updateReferrals(referralsResponse.data, honorBoardResponse.data);
      
    } catch (err) {
      console.error('Ошибка обновления рефералов:', err);
    } finally {
      setLoading(false);
    }
  };

  const colorStyle = player?.color || '#00f0ff';

  // Показываем загрузку только если нет данных игрока вообще
  if (!player) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>{t('loading')}</div>;
  }

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
      }}
    >
      {/* Верхняя панель с валютами */}
      <CurrencyPanel 
        player={player}
        currentSystem={currentSystem}
        colorStyle={colorStyle}
      />

      <div style={{ marginTop: '150px', paddingBottom: '130px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2.5rem', 
            marginBottom: '30px'
          }}>
            👥 {t('referrals')}
          </h2>
          
          {/* Реферальная ссылка */}
          <div style={{
            margin: '20px auto',
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            boxShadow: `0 0 20px ${colorStyle}30`,
            maxWidth: '500px'
          }}>
            <h3 style={{ color: colorStyle, marginBottom: '15px' }}>🔗 {t('your_referral_link')}</h3>
            <p style={{ 
              wordBreak: 'break-all', 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '10px', 
              borderRadius: '8px',
              fontSize: '0.9rem',
              marginBottom: '15px'
            }}>
              {player?.referral_link || 'Загружается...'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleShare}
                style={{
                  padding: '12px 20px',
                  background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '12px',
                  boxShadow: `0 0 15px ${colorStyle}`,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 0 25px ${colorStyle}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 0 15px ${colorStyle}`;
                }}
              >
                📤 {t('share')}
              </button>
              <button
                onClick={handleCopy}
                style={{
                  padding: '12px 20px',
                  background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '12px',
                  boxShadow: `0 0 15px ${colorStyle}`,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 0 25px ${colorStyle}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 0 15px ${colorStyle}`;
                }}
              >
                📋 {t('copy')}
              </button>
              
              {/* Кнопка обновления (опционально) */}
              <button
                onClick={refreshReferrals}
                disabled={loading}
                style={{
                  padding: '12px 20px',
                  background: loading ? 'rgba(128, 128, 128, 0.3)' : `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${loading ? '#888' : colorStyle}`,
                  borderRadius: '12px',
                  boxShadow: loading ? 'none' : `0 0 15px ${colorStyle}`,
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold'
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = `0 0 25px ${colorStyle}`;
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = loading ? 'none' : `0 0 15px ${colorStyle}`;
                }}
              >
                {loading ? '🔄' : '🔄'} {loading ? 'Обновление...' : 'Обновить'}
              </button>
            </div>
          </div>

          {/* Статистика */}
          <div style={{
            margin: '20px auto',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: `1px solid ${colorStyle}`,
            borderRadius: '15px',
            boxShadow: `0 0 15px ${colorStyle}30`,
            maxWidth: '300px'
          }}>
            <h3 style={{ color: colorStyle, marginBottom: '10px' }}>📊 {t('referral_stats')}</h3>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {t('total_referrals')}: {player?.referrals_count || 0}
            </p>
          </div>
          
          {/* Список рефералов */}
          <div style={{ margin: '20px auto', maxWidth: '600px' }}>
            <h3 style={{ color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, marginBottom: '15px' }}>
              📋 {t('referral_list')}
            </h3>
            {(player?.referrals && player.referrals.length > 0) ? (
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.3)', 
                border: `2px solid ${colorStyle}`, 
                borderRadius: '10px', 
                boxShadow: `0 0 20px ${colorStyle}30`,
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: `${colorStyle}20` }}>
                      <th style={{ border: `1px solid ${colorStyle}`, padding: '10px', color: colorStyle, textShadow: `0 0 5px ${colorStyle}` }}>{t('referral')}</th>
                      <th style={{ border: `1px solid ${colorStyle}`, padding: '10px', color: colorStyle, textShadow: `0 0 5px ${colorStyle}` }}>{t('earned_cs')}</th>
                      <th style={{ border: `1px solid ${colorStyle}`, padding: '10px', color: colorStyle, textShadow: `0 0 5px ${colorStyle}` }}>{t('earned_ton')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {player.referrals.map((ref: any, index: number) => (
                      <tr key={index} style={{ transition: 'background 0.3s ease' }}>
                        <td style={{ border: `1px solid ${colorStyle}`, padding: '10px' }}>
                          {ref.username || `${t('referral')} #${index + 1}`}
                        </td>
                        <td style={{ border: `1px solid ${colorStyle}`, padding: '10px' }}>
                          {ref.cs_earned?.toFixed(2) || '0.00'}
                        </td>
                        <td style={{ border: `1px solid ${colorStyle}`, padding: '10px' }}>
                          {ref.ton_earned?.toFixed(8) || '0.00000000'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.3)', 
                border: `2px solid ${colorStyle}`, 
                borderRadius: '10px', 
                padding: '20px', 
                boxShadow: `0 0 10px ${colorStyle}30`
              }}>
                <p>{t('no_referrals')}</p>
                <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '10px' }}>
                  Пригласите друзей и получайте 100 CS + 0.001 TON за каждого!
                </p>
              </div>
            )}
          </div>

          {/* Доска почета */}
          <div style={{ margin: '20px auto', maxWidth: '600px' }}>
            <h3 style={{ color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, marginBottom: '15px' }}>
              🏆 {t('honor_board')}
            </h3>
            {(player?.honor_board && player.honor_board.length > 0) ? (
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.3)', 
                border: `2px solid ${colorStyle}`, 
                borderRadius: '10px', 
                boxShadow: `0 0 20px ${colorStyle}30`,
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: `${colorStyle}20` }}>
                      <th style={{ border: `1px solid ${colorStyle}`, padding: '10px', color: colorStyle, textShadow: `0 0 5px ${colorStyle}` }}>{t('place')}</th>
                      <th style={{ border: `1px solid ${colorStyle}`, padding: '10px', color: colorStyle, textShadow: `0 0 5px ${colorStyle}` }}>{t('player')}</th>
                      <th style={{ border: `1px solid ${colorStyle}`, padding: '10px', color: colorStyle, textShadow: `0 0 5px ${colorStyle}` }}>{t('referrals_count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {player.honor_board.sort((a: any, b: any) => (b.referrals_count || 0) - (a.referrals_count || 0)).slice(0, 10).map((entry: any, index: number) => (
                      <tr key={index} style={{ 
                        background: entry.telegram_id === player?.telegram_id ? `${colorStyle}20` : 'transparent',
                        transition: 'background 0.3s ease'
                      }}>
                        <td style={{ border: `1px solid ${colorStyle}`, padding: '10px', fontWeight: index < 3 ? 'bold' : 'normal' }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </td>
                        <td style={{ border: `1px solid ${colorStyle}`, padding: '10px' }}>
                          {entry.username || `${t('player')} #${index + 1}`}
                          {entry.telegram_id === player?.telegram_id && ' (Вы)'}
                        </td>
                        <td style={{ border: `1px solid ${colorStyle}`, padding: '10px' }}>
                          {entry.referrals_count || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.3)', 
                border: `2px solid ${colorStyle}`, 
                borderRadius: '10px', 
                padding: '20px', 
                boxShadow: `0 0 10px ${colorStyle}30`
              }}>
                <p>{t('honor_board_empty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default ReferralsPage;