import React, { useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';

const MIN_LOADING_TIME = 6000; // Жёсткое ограничение 6 секунд

const StartPage: React.FC = () => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const timeProgress = (elapsed / MIN_LOADING_TIME) * 100;
      setDisplayProgress(Math.min(Math.floor(timeProgress), 100));

      if (elapsed < MIN_LOADING_TIME) {
        const timer = setTimeout(updateProgress, 100);
        return () => clearTimeout(timer);
      }
    };

    updateProgress();
  }, [startTime]);

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <img
        src="/backgrounds/startpage_bg.png"
        alt="Game Cover"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1,
        }}
      />
      <div style={{
        textAlign: 'center',
        color: '#00f0ff',
        zIndex: 1,
        marginBottom: '20px',
        width: '90%',
      }}>
        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: 'rgba(0, 0, 34, 0.8)',
          border: '2px solid #00f0ff',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 0 8px #00f0ff',
        }}>
          <div style={{
            height: '100%',
            width: `${displayProgress}%`,
            backgroundColor: '#00f0ff',
            boxShadow: '0 0 10px #00f0ff',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <p style={{
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textShadow: '0 0 5px #00f0ff',
          marginTop: '5px',
        }}>
          Loading... {displayProgress}%
        </p>
      </div>
    </div>
  );
};

export default StartPage;