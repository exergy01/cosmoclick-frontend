import React, { useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';

const StartPage: React.FC = () => {
  const { loading } = usePlayer();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100 || !loading) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
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
        color: 'white',
        zIndex: 1,
      }}>
        <div style={{
          width: '200px',
          height: '20px',
          backgroundColor: '#333',
          borderRadius: '10px',
          overflow: 'hidden',
          margin: '0 auto 10px',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#4caf50',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <p style={{
          fontSize: '1.2rem',
          fontWeight: 'bold',
          textShadow: '0 0 5px rgba(0, 0, 0, 0.7)',
        }}>
          Loading... {progress}%
        </p>
      </div>
    </div>
  );
};

export default StartPage;