import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CurrencyPanel from '../components/CurrencyPanel';
import NavigationMenu from '../components/NavigationMenu';

const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5002';

const ReferralsPage: React.FC = () => {
  const { t } = useTranslation();
  const { player, currentSystem, loading, refreshPlayer } = usePlayer();
  
  // Состояние для всплывающего сообщения
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);

  // Проверяем загрузку данных
  useEffect(() => {
    if (player || (!loading && !player)) {
      setIsInitialLoading(false);
    }
  }, [player, loading]);

  // Функция для показа всплывающего сообщения
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 1500);
  };

// 🔥 ФУНКЦИЯ СБОРА РЕФЕРАЛЬНЫХ НАГРАД - ОКОНЧАТЕЛЬНАЯ ВЕРСИЯ
const collectReferralRewards = async () => {
  if (!player?.telegram_id || isCollecting) return;
  
  try {
    setIsCollecting(true);
    
    // Подсчитываем сколько можно собрать
    const safeReferrals = Array.isArray(player?.referrals) ? player.referrals : [];
    const totalCS = safeReferrals.reduce((sum: number, ref: any) => sum + parseFloat(ref.cs_earned || 0), 0);
    const totalTON = safeReferrals.reduce((sum: number, ref: any) => sum + parseFloat(ref.ton_earned || 0), 0);
    
    if (totalCS <= 0 && totalTON <= 0) {
      showToastMessage(t('no_rewards_to_collect'));
      return;
    }
    
    // Отправляем запрос на сбор
    const response = await axios.post(`${apiUrl}/api/referrals/collect-rewards`, {
      telegramId: player.telegram_id
    });
    
    if (response.data.success) {
      const collected = response.data.collected;
      showToastMessage(`${t('collected')}: ${collected.cs.toFixed(2)} CS + ${collected.ton.toFixed(8)} TON`);
      
      // 🔥 ТОЛЬКО ОБНОВЛЯЕМ PLAYER - НИКАКИХ ЛИШНИХ ВЫЗОВОВ!
      if (response.data.player && (window as any).setPlayerGlobal) {
        // Обнуляем награды в рефералах вручную
        const updatedReferrals = (player?.referrals || []).map((ref: any) => ({
          ...ref,
          cs_earned: 0,
          ton_earned: 0
        }));
        
        const updatedPlayer = {
          ...response.data.player,  // новый баланс
          referrals: updatedReferrals,  // рефералы с обнуленными наградами
          honor_board: player?.honor_board || []  // старая доска почета
        };
        (window as any).setPlayerGlobal(updatedPlayer);
      }
    } else {
      showToastMessage(t('error_collecting_rewards'));
    }
    
  } catch (err: any) {
    console.error('Ошибка сбора наград:', err);
    showToastMessage(t('error_collecting_rewards'));
  } finally {
    setIsCollecting(false);
  }
};
  
  // Простая функция копирования
  const copyToClipboard = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showToastMessage(t('link_copied'));
      } else {
        showToastMessage(t('copy_error'));
      }
    } catch (err) {
      showToastMessage(t('copy_error'));
    }
  };

  // 🔥 ПРАВИЛЬНАЯ функция поделиться для Telegram
  const handleShare = () => {
    if (!player?.referral_link) {
      showToastMessage(t('link_unavailable'));
      return;
    }

    try {
      // Вибрация в Telegram
      if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      const telegramWebApp = (window as any).Telegram?.WebApp;
      
      if (telegramWebApp) {
        // Пробуем разные методы поделиться в Telegram
        
        // Метод 1: switchInlineQuery - показывает список чатов
        if (telegramWebApp.switchInlineQuery) {
          try {
            telegramWebApp.switchInlineQuery(`Присоединяйся к CosmoClick! ${player.referral_link}`, ['users', 'groups', 'channels']);
            showToastMessage(t('select_chat_to_share'));
            return;
          } catch (e) {
            console.log('switchInlineQuery failed:', e);
          }
        }
        
        // Метод 2: openTelegramLink - открывает диалог поделиться
        if (telegramWebApp.openTelegramLink) {
          try {
            const shareText = encodeURIComponent('🚀 Присоединяйся к CosmoClick и зарабатывай космические кристаллы!');
            const shareUrl = encodeURIComponent(player.referral_link);
            telegramWebApp.openTelegramLink(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`);
            showToastMessage(t('opening_share_dialog'));
            return;
          } catch (e) {
            console.log('openTelegramLink failed:', e);
          }
        }
        
        // Метод 3: sendData - отправляет данные боту
        if (telegramWebApp.sendData) {
          try {
            telegramWebApp.sendData(JSON.stringify({
              action: 'share_referral',
              link: player.referral_link,
              text: 'Присоединяйся к CosmoClick!'
            }));
            showToastMessage(t('data_sent_to_bot'));
            return;
          } catch (e) {
            console.log('sendData failed:', e);
          }
        }
        
        // Метод 4: openLink - открывает в браузере
        if (telegramWebApp.openLink) {
          try {
            const shareText = encodeURIComponent('🚀 Присоединяйся к CosmoClick и зарабатывай космические кристаллы!');
            const shareUrl = encodeURIComponent(player.referral_link);
            telegramWebApp.openLink(`https://t.me/share/url?url=${shareUrl}&text=${shareText}`);
            showToastMessage(t('opening_in_browser'));
            return;
          } catch (e) {
            console.log('openLink failed:', e);
          }
        }
      }

      // Fallback для обычных браузеров
      if (navigator.share) {
        navigator.share({
          title: 'CosmoClick - Космическая игра',
          text: '🚀 Присоединяйся к CosmoClick и зарабатывай космические кристаллы!',
          url: player.referral_link,
        }).then(() => {
          showToastMessage(t('share_success'));
        }).catch(() => {
          copyToClipboard(player.referral_link);
          showToastMessage(t('link_copied_to_clipboard'));
        });
      } else {
        // Последний fallback - копируем
        copyToClipboard(player.referral_link);
        showToastMessage(t('link_copied_paste_to_chat'));
      }
      
    } catch (err) {
      console.error('Share error:', err);
      copyToClipboard(player.referral_link);
      showToastMessage(t('link_copied'));
    }
  };

  const handleCopy = () => {
    if (!player?.referral_link) {
      showToastMessage(t('link_unavailable'));
      return;
    }
    copyToClipboard(player.referral_link);
  };

  const colorStyle = player?.color || '#00f0ff';

  // Проверяем, является ли текущий игрок дефолтным
  const isDefaultPlayer = player?.telegram_id === '1222791281';

  // Используем данные из player
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

  // Подсчитываем общие награды для кнопки сбора
  const totalRewards = {
    cs: filteredReferrals.reduce((sum: number, ref: any) => sum + parseFloat(ref.cs_earned || 0), 0),
    ton: filteredReferrals.reduce((sum: number, ref: any) => sum + parseFloat(ref.ton_earned || 0), 0)
  };

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
          {t('loading_referrals')}
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
        padding: '20px',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e)'
      }}>
        <h2>{t('data_load_error')}</h2>
        <p>{t('refresh_page')}</p>
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

      <div style={{ marginTop: '80px', paddingBottom: '130px' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2 style={{ 
            color: colorStyle, 
            textShadow: `0 0 10px ${colorStyle}`, 
            fontSize: '2rem', 
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
              {player?.referral_link || t('loading')}
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
                          {entry.telegram_id === player?.telegram_id && ' (あなた)'}
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
          
          {/* Список рефералов с количеством в заголовке */}
          <div style={{ margin: '20px auto', maxWidth: '600px' }}>
            <h3 style={{ color: colorStyle, textShadow: `0 0 10px ${colorStyle}`, marginBottom: '15px' }}>
              📋 {t('referral_list')} ({filteredReferrals.length})
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
                          {ref.cs_earned?.toFixed ? ref.cs_earned.toFixed(2) : parseFloat(ref.cs_earned || 0).toFixed(2)}
                        </td>
                        <td style={{ border: `1px solid ${colorStyle}`, padding: '10px' }}>
                          {ref.ton_earned?.toFixed ? ref.ton_earned.toFixed(8) : parseFloat(ref.ton_earned || 0).toFixed(8)}
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
                  {t('invite_friends_earn')}
                </p>
              </div>
            )}
          </div>

          {/* 🔥 КНОПКА СБОРА НАГРАД - ПЕРЕНЕСЕНА ПОД СПИСОК */}
          {(totalRewards.cs > 0 || totalRewards.ton > 0) && (
            <div style={{
              margin: '20px auto',
              padding: '20px',
              background: 'rgba(0, 200, 0, 0.1)',
              border: `2px solid #00ff00`,
              borderRadius: '15px',
              boxShadow: `0 0 20px #00ff0030`,
              maxWidth: '400px'
            }}>
              <h3 style={{ color: '#00ff00', marginBottom: '15px' }}>💰 {t('available_for_collection')}</h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>
                {totalRewards.cs.toFixed(2)} CS + {totalRewards.ton.toFixed(8)} TON
              </p>
              <button
                onClick={collectReferralRewards}
                disabled={isCollecting}
                style={{
                  padding: '15px 30px',
                  background: isCollecting 
                    ? 'rgba(100, 100, 100, 0.5)' 
                    : `linear-gradient(135deg, #00ff0030, #00ff0060, #00ff0030)`,
                  border: `2px solid #00ff00`,
                  borderRadius: '12px',
                  boxShadow: `0 0 15px #00ff00`,
                  color: '#fff',
                  cursor: isCollecting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  width: '100%'
                }}
              >
                {isCollecting ? '⏳ ' + t('collecting') : `💰 ${t('collect_rewards')}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Нижняя навигация */}
      <NavigationMenu colorStyle={colorStyle} />
    </div>
  );
};

export default ReferralsPage;