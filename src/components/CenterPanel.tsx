import React from 'react';

const CenterPanel: React.FC = () => {
  return (
    <div style={{
      marginTop: '20px',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      justifyContent: 'center',
      width: '100%',
      paddingRight: '20px'
    }}>
      {/* Сейф */}
      <div style={{
        width: '240px',
        height: '240px',
        backgroundImage: 'url(/images/safe.png)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        filter: 'drop-shadow(0 0 25px #00f0ff)',
        cursor: 'pointer',
        marginBottom: '15px'
      }}>
      </div>

      {/* Счётчик добычи */}
      <div style={{
        fontSize: '36px',
        fontWeight: 'bold',
        fontFamily: 'Cursive, Orbitron, sans-serif',
        fontStyle: 'italic',
        color: '#00f0ff',
        textShadow: '0 0 8px #00f0ff'
      }}>
        0.0080
      </div>
    </div>
  );
};

export default CenterPanel;
