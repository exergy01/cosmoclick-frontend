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
  const { player, currentSystem } = usePlayer();
  
  // Состояние для всплывающего сообщения
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);

  // Функция для показа всплывающего сообщения
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 1500);
  };

  const handleShare = () => {
    if (navigator.share && player?.referral_link) {
      navigator.share({
        title: t('share_referral_link'),
        text: `${t('join_cosmo_click')} ${player.referral_link}`,
        url: player.referral_link,
      }).then(() => {
        console.log('Share successful');
      }).catch(err => {
        console.error('Ошибка share:', err);
        // Fallback - копируем в буфер обмена
        if (navigator.clipboard) {
          navigator.clipboard.writeText(player.referral_link).then(() => {
            showToastMessage('Ссылка скопирована');
          }).catch(() => {
            showToastMessage('Ошибка копирования');
          });
        } else {
          showToastMessage('Поделиться недоступно');
        }
      });
    } else {
      console.log('Share API недоступен, копируем в буфер');
      // Fallback для браузеров без поддержки Web Share API
      if (navigator.clipboard && player?.referral_link) {
        navigator.clipboard.writeText(player.referral_link).then(() => {
          showToastMessage('Ссылка скопирована');
        }).catch(() => {
          showToastMessage('Ошибка копирования');
        });
      } else {
        showToastMessage('Поделиться недоступно');
      }
    }
  };

  const handleCopy = () => {
    if (player?.referral_link) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(player.referral_link).then(() => {
          showToastMessage('Ссылка скопирована');
        }).catch(err => {
          console.error('Ошибка копирования:', err);
          showToastMessage('Ошибка копирования');
        });
      } else {
        // Fallback для старых браузеров
        try {
          const textArea = document.createElement('textarea');
          textArea.value = player.referral_link;
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showToastMessage('Ссылка скопирована');
        } catch (err) {
          console.error('Fallback копирование не сработало:', err);
          showToastMessage('Ошибка копирования');
        }
      }
    } else {
      console.log('Copy failed: referral_link is', player?.referral_link);
      showToastMessage('Ссылка недоступна');
    }
  };

  const colorStyle = player?.color || '#00f0ff';

  // Проверяем, является ли текущий игрок дефолтным
  const isDefaultPlayer = player?.telegram_id === '1222791281';

  // Фильтруем рефералов (убираем дефолтного игрока для всех кроме него самого)
  const filteredReferrals = player?.referrals?.filter((ref: any) => 
    isDefaultPlayer || ref.referred_id !== '1222791281'
  ) || [];

  // Фильтруем доску почета (убираем дефолтного игрока для всех кроме него самого)
  const filteredHonorBoard = player?.honor_board?.filter((entry: any) => 
    isDefaultPlayer || entry.telegram_id !== '1222791281'
  ) || [];

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
      {/* Всплывающее сообщение */}
      {showToast && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}60)`,
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '20px 30px',
            boxShadow: `0 0 30px ${colorStyle}`,
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            zIndex: 1000,
            animation: 'fadeInOut 1.5s ease-in-out',
            textAlign: 'center'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* CSS для анимации всплывающего сообщения */}
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          }
        `}
      </style>

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
            
            {/* Кнопки поделиться и скопировать */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '10px', 
              margin: '0 10px'
            }}>
              <button
                onClick={handleShare}
                style={{
                  padding: '12px 10px',
                  background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '12px',
                  boxShadow: `0 0 15px ${colorStyle}`,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  width: '100%'
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
                  padding: '12px 10px',
                  background: `linear-gradient(135deg, ${colorStyle}30, ${colorStyle}60, ${colorStyle}30)`,
                  border: `2px solid ${colorStyle}`,
                  borderRadius: '12px',
                  boxShadow: `0 0 15px ${colorStyle}`,
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  width: '100%'
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
            {(filteredReferrals && filteredReferrals.length > 0) ? (
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
                    {filteredReferrals.map((ref: any, index: number) => (
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
                <p style={{ fontSize: '1rem', color: '#aaa', marginTop: '10px' }}>
                  Пригласите друзей и получайте 1% в CS + 0.1% в TON за покупки друга!
                </p>
              </div>
            )}
          </div>

          {/* Доска почета */}
          <div style={{ margin: '20px auto', maxWidth: '600px' }}>
            <h3 style={{ color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, marginBottom: '15px' }}>
              🏆 {t('honor_board')}
            </h3>
            {(filteredHonorBoard && filteredHonorBoard.length > 0) ? (
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
                    {filteredHonorBoard.sort((a: any, b: any) => (b.referrals_count || 0) - (a.referrals_count || 0)).slice(0, 10).map((entry: any, index: number) => (
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