import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const ReferralsPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem, loading } = usePlayer();
  
  // Состояние для всплывающего сообщения
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Проверяем загрузку данных
  useEffect(() => {
    if (player || (!loading && !player)) {
      setIsInitialLoading(false);
    }
  }, [player, loading]);

  // 🔍 РАСШИРЕННАЯ ОТЛАДКА
  console.log('🔍 ПОЛНАЯ ОТЛАДКА РЕФЕРАЛОВ:', {
    player_exists: !!player,
    telegram_id: player?.telegram_id,
    referrals_count: player?.referrals_count,
    referrals_array: player?.referrals,
    referrals_length: player?.referrals?.length,
    honor_board: player?.honor_board,
    honor_board_length: player?.honor_board?.length,
    loading: loading,
    isInitialLoading: isInitialLoading
  });

  // Функция для показа всплывающего сообщения
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 1500);
  };

  // 🔥 ИСПРАВЛЕННАЯ функция поделиться для Telegram
  const handleShare = () => {
    if (!player?.referral_link) {
      showToastMessage('Ссылка недоступна');
      return;
    }

    try {
      // Telegram WebApp - используем специальный метод
      if ((window as any).Telegram?.WebApp) {
        const telegramWebApp = (window as any).Telegram.WebApp;
        
        // Вибрация
        if (telegramWebApp.HapticFeedback) {
          telegramWebApp.HapticFeedback.impactOccurred('light');
        }

        // Пробуем Telegram методы поделиться
        if (telegramWebApp.openTelegramLink) {
          const shareText = encodeURIComponent('Присоединяйся к CosmoClick и зарабатывай космические кристаллы!');
          const shareUrl = encodeURIComponent(player.referral_link);
          telegramWebApp.openTelegramLink(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`);
          showToastMessage('Открываем поделиться');
          return;
        }

        // Альтернатива: открываем в том же окне
        if (telegramWebApp.openLink) {
          const shareText = encodeURIComponent('Присоединяйся к CosmoClick и зарабатывай космические кристаллы!');
          const shareUrl = encodeURIComponent(player.referral_link);
          telegramWebApp.openLink(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`);
          showToastMessage('Открываем поделиться');
          return;
        }
      }

      // Fallback для обычных браузеров
      if (navigator.share) {
        navigator.share({
          title: 'CosmoClick - Космическая игра',
          text: 'Присоединяйся к CosmoClick и зарабатывай космические кристаллы!',
          url: player.referral_link,
        }).then(() => {
          showToastMessage('Поделились успешно');
        }).catch(err => {
          console.error('Web Share API error:', err);
          copyToClipboard(player.referral_link);
        });
      } else {
        // Если ничего не работает - копируем
        copyToClipboard(player.referral_link);
        showToastMessage('Ссылка скопирована (поделиться недоступно)');
      }
    } catch (err) {
      console.error('Share error:', err);
      copyToClipboard(player.referral_link);
      showToastMessage('Ссылка скопирована');
    }
  };

  const copyToClipboard = (text: string) => {
    try {
      // Метод 1: Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToastMessage('Ссылка скопирована');
        }).catch(() => {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    } catch (err) {
      console.error('Copy error:', err);
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showToastMessage('Ссылка скопирована');
      } else {
        showToastMessage('Ошибка копирования');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      showToastMessage('Ошибка копирования');
    }
  };

  const handleCopy = () => {
    if (player?.referral_link) {
      copyToClipboard(player.referral_link);
    } else {
      showToastMessage('Ссылка недоступна');
    }
  };

  const colorStyle = player?.color || '#00f0ff';

  // Проверяем, является ли текущий игрок дефолтным
  const isDefaultPlayer = player?.telegram_id === '1222791281';

  // 🔥 БОЛЕЕ БЕЗОПАСНАЯ обработка рефералов
  const safeReferrals = Array.isArray(player?.referrals) ? player.referrals : [];
  const safeHonorBoard = Array.isArray(player?.honor_board) ? player.honor_board : [];

  // Фильтруем рефералов (убираем дефолтного игрока для всех кроме него самого)
  const filteredReferrals = safeReferrals.filter((ref: any) => 
    isDefaultPlayer || ref.referred_id !== '1222791281'
  );

  // Фильтруем доску почета (убираем дефолтного игрока для всех кроме него самого)
  const filteredHonorBoard = safeHonorBoard.filter((entry: any) => 
    isDefaultPlayer || entry.telegram_id !== '1222791281'
  );

  // 🔥 ПОКАЗЫВАЕМ ЗАГРУЗКУ если данные еще грузятся
  if (isInitialLoading || loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        color: '#fff', 
        textAlign: 'center', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e)',
        flexDirection: 'column'
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '20px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          🚀
        </div>
        <div style={{ fontSize: '1.2rem' }}>
          {t('loading')}...
        </div>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.7; }
            }
          `}
        </style>
      </div>
    );
  }

  // Если игрок не найден после загрузки
  if (!player) {
    return (
      <div style={{ 
        color: '#fff', 
        textAlign: 'center', 
        marginTop: '50px',
        padding: '20px'
      }}>
        <h2>Ошибка загрузки данных</h2>
        <p>Попробуйте перезагрузить страницу</p>
      </div>
    );
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
      {/* Всплывающее сообщение внизу */}
      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '150px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: `linear-gradient(135deg, ${colorStyle}80, ${colorStyle}60)`,
            border: `2px solid ${colorStyle}`,
            borderRadius: '15px',
            padding: '15px 25px',
            boxShadow: `0 0 30px ${colorStyle}`,
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 'bold',
            zIndex: 1000,
            animation: 'slideUpFade 1.5s ease-in-out',
            textAlign: 'center',
            maxWidth: '300px'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* CSS для анимации всплывающего сообщения */}
      <style>
        {`
          @keyframes slideUpFade {
            0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
            20% { opacity: 1; transform: translateX(-50%) translateY(0px); }
            80% { opacity: 1; transform: translateX(-50%) translateY(0px); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
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

          {/* 🔍 ВРЕМЕННЫЙ БЛОК ОТЛАДКИ - покажет что именно приходит в данных */}
          <div style={{
            margin: '10px auto',
            padding: '10px',
            background: 'rgba(255, 165, 0, 0.2)',
            border: '1px solid orange',
            borderRadius: '5px',
            maxWidth: '600px',
            fontSize: '0.8rem',
            textAlign: 'left'
          }}>
            <strong>🔍 ОТЛАДКА:</strong><br/>
            referrals_count: {player?.referrals_count}<br/>
            referrals type: {typeof player?.referrals}<br/>
            referrals length: {player?.referrals?.length}<br/>
            safeReferrals length: {safeReferrals.length}<br/>
            filteredReferrals length: {filteredReferrals.length}<br/>
            honor_board length: {safeHonorBoard.length}
          </div>
          
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
                          {ref.username || ref.first_name || `${t('referral')} #${index + 1}`}
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
                  Приглашайте друзей и получайте от их трат в магазине: 1% в CS + 0.1% в TON!
                </p>
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