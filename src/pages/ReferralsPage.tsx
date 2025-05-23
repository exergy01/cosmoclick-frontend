import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { droneData } from '../data/shopDataSystem1';

const ReferralsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { player } = usePlayer();
  const currentSystem = player?.systems?.[0] || 1;

  // Логирование для отладки
  console.log('Player data:', player);
  console.log('Referrals:', player?.referrals);
  console.log('Honor board:', player?.honor_board);

  const handleShare = () => {
    if (navigator.share && player?.referral_link) {
      navigator.share({
        title: 'Поделиться реферальной ссылкой',
        text: `Присоединяйтесь ко мне в CosmoClick! Вот моя реферальная ссылка: ${player.referral_link}`,
        url: player.referral_link,
      }).catch(err => console.error('Share failed:', err));
    } else {
      alert('Поделиться не удалось: ваш браузер не поддерживает эту функцию.');
    }
  };

  const handleCopy = () => {
    if (player?.referral_link) {
      navigator.clipboard.writeText(player.referral_link).then(() => {
        alert('Ссылка скопирована в буфер обмена!');
      }).catch(err => console.error('Copy failed:', err));
    }
  };

  const calculatePerHour = () => {
    if (!player?.drones || player.drones.length === 0) {
      return '0.00';
    }
    const totalCccPerDay = player.drones.reduce((sum: number, d: { id: number; system: number }) => {
      const drone = droneData.find(item => item.id === d.id && item.system === d.system);
      return sum + (drone?.cccPerDay || 0);
    }, 0);
    return (totalCccPerDay / 24).toFixed(2);
  };

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
      {/* Инфопанель */}
      <div
        style={{
          width: '93%',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '3px',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '2px solid #00f0ff',
          borderRadius: '10px',
          boxShadow: '0 0 20px #00f0ff',
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '1.1rem' }}>💠 CCC: {(typeof player?.ccc === 'number' ? player.ccc : parseFloat(player?.ccc || '0')).toFixed(2)}</p>
          <p style={{ fontSize: '1.1rem' }}>📈 В час: {calculatePerHour()}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '1.1rem' }}>✨ CS: {(typeof player?.cs === 'number' ? player.cs : parseFloat(player?.cs || '0')).toFixed(2)}</p>
          <p style={{ fontSize: '1.1rem' }}>💎 TON: {(typeof player?.ton === 'number' ? player.ton : parseFloat(player?.ton || '0')).toFixed(8)}</p>
        </div>
      </div>

      {/* Контент */}
      <div style={{ marginTop: '110px', paddingBottom: '130px', textAlign: 'center' }}>
        <h2>Рефералы</h2>
        <p>Ваша реферальная ссылка: {player?.referral_link || 'Загрузка...'}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '10px 0' }}>
          <button
            onClick={handleShare}
            style={{
              padding: '8px 15px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '2px solid #00f0ff',
              borderRadius: '15px',
              boxShadow: '0 0 10px #00f0ff',
              color: '#fff',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Поделиться
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '8px 15px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '2px solid #00f0ff',
              borderRadius: '15px',
              boxShadow: '0 0 10px #00f0ff',
              color: '#fff',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Копировать
          </button>
        </div>
        <p>Общее количество рефералов: {player?.referrals_count || 0}</p>
        <p>Статистика рефералов</p>
        <div style={{ textAlign: 'center', margin: '20px auto', maxWidth: '600px' }}>
          <h3 style={{ color: '#00f0ff', textShadow: '0 0 10px #00f0ff' }}>Список рефералов</h3>
          {(player?.referrals?.length ?? 0) > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0, 0, 0, 0.5)', border: '2px solid #00f0ff', borderRadius: '10px', boxShadow: '0 0 20px #00f0ff' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #00f0ff', padding: '5px', color: '#00f0ff', textShadow: '0 0 5px #00f0ff' }}>Реферал</th>
                  <th style={{ border: '1px solid #00f0ff', padding: '5px', color: '#00f0ff', textShadow: '0 0 5px #00f0ff' }}>Заработано CS</th>
                  <th style={{ border: '1px solid #00f0ff', padding: '5px', color: '#00f0ff', textShadow: '0 0 5px #00f0ff' }}>Заработано TON</th>
                </tr>
              </thead>
              <tbody>
                {player?.referrals?.map((ref: { telegram_id: string; username: string; cs_earned: number; ton_earned: number }, index: number) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #00f0ff', padding: '5px' }}>{ref.username || `Реферал #${index + 1}`}</td>
                    <td style={{ border: '1px solid #00f0ff', padding: '5px' }}>{ref.cs_earned?.toFixed(2) || '0.00'}</td>
                    <td style={{ border: '1px solid #00f0ff', padding: '5px' }}>{ref.ton_earned?.toFixed(8) || '0.00000000'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ background: 'rgba(0, 0, 0, 0.5)', border: '2px solid #00f0ff', borderRadius: '10px', padding: '10px', boxShadow: '0 0 10px #00f0ff' }}>Рефералов пока нет</p>
          )}
        </div>
        <div style={{ textAlign: 'center', margin: '20px auto', maxWidth: '600px' }}>
          <h3 style={{ color: '#00f0ff', textShadow: '0 0 10px #00f0ff' }}>Доска почёта</h3>
          {(player?.honor_board?.length ?? 0) > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0, 0, 0, 0.5)', border: '2px solid #00f0ff', borderRadius: '10px', boxShadow: '0 0 20px #00f0ff' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #00f0ff', padding: '5px', color: '#00f0ff', textShadow: '0 0 5px #00f0ff' }}>Место</th>
                  <th style={{ border: '1px solid #00f0ff', padding: '5px', color: '#00f0ff', textShadow: '0 0 5px #00f0ff' }}>Игрок</th>
                  <th style={{ border: '1px solid #00f0ff', padding: '5px', color: '#00f0ff', textShadow: '0 0 5px #00f0ff' }}>Количество рефералов</th>
                </tr>
              </thead>
              <tbody>
                {player?.honor_board?.sort((a: { referrals_count: number }, b: { referrals_count: number }) => (b.referrals_count || 0) - (a.referrals_count || 0)).slice(0, 10).map((entry: { telegram_id: string; username?: string; referrals_count: number }, index: number) => (
                  <tr key={index} style={{ background: entry.telegram_id === '2097930691' ? 'rgba(0, 240, 255, 0.2)' : 'transparent' }}>
                    <td style={{ border: '1px solid #00f0ff', padding: '5px' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #00f0ff', padding: '5px' }}>{entry.username || `Игрок #${index + 1}`}</td>
                    <td style={{ border: '1px solid #00f0ff', padding: '5px' }}>{entry.referrals_count || 0}</td>
                  </tr>
                ))}
                {player?.honor_board && player.honor_board.findIndex((e: { telegram_id: string }) => e.telegram_id === '2097930691') >= 10 && (
                  <tr style={{ background: 'rgba(0, 240, 255, 0.2)' }}>
                    <td style={{ border: '1px solid #00f0ff', padding: '5px' }}>
                      {(player.honor_board.findIndex((e: { telegram_id: string }) => e.telegram_id === '2097930691') ?? -1) + 1}
                    </td>
                    <td style={{ border: '1px solid #00f0ff', padding: '5px' }}>{player?.username || 'Вы'}</td>
                    <td style={{ border: '1px solid #00f0ff', padding: '5px' }}>{player?.referrals_count || 0}</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <p style={{ background: 'rgba(0, 0, 0, 0.5)', border: '2px solid #00f0ff', borderRadius: '10px', padding: '10px', boxShadow: '0 0 10px #00f0ff' }}>Доска почёта пуста</p>
          )}
        </div>
      </div>

      {/* Меню */}
      <div
        style={{
          width: '93%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '10px',
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          {[
            { path: '/attack', icon: '⚔️', label: 'Атака' },
            { path: '/exchange', icon: '🔄', label: 'Обмен' },
            { path: '/quests', icon: '🎯', label: 'Задания' }
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                padding: '8px 5px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: location.pathname === path ? '4px solid #00f0ff' : '2px solid #00f0ff',
                borderRadius: '15px',
                boxShadow: location.pathname === path ? '0 0 10px #00f0ff, inset 0 0 10px #00f0ff' : '0 0 10px #00f0ff',
                color: '#fff',
                fontSize: '1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxSizing: 'border-box',
                height: 'auto'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          {[
            { path: '/games', icon: '🎮' },
            { path: '/wallet', icon: '💳' },
            { path: '/main', icon: '🚀' },
            { path: '/ref', icon: '👥' },
            { path: '/alphabet', icon: '📖' }
          ].map(({ path, icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                flex: 1,
                padding: '8px 5px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: location.pathname === path ? '4px solid #00f0ff' : '2px solid #00f0ff',
                borderRadius: '15px',
                boxShadow: location.pathname === path ? '0 0 10px #00f0ff, inset 0 0 10px #00f0ff' : '0 0 10px #00f0ff',
                color: '#fff',
                fontSize: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                boxSizing: 'border-box',
                height: 'auto'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReferralsPage;