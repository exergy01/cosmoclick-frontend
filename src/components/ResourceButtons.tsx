import React, { useState } from 'react';

const ResourceButtons: React.FC = () => {
  const [active, setActive] = useState<string | null>(null);

  const buttons = ['РЕСУРСЫ', 'ДРОНЫ', 'КАРГО'];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginTop: '10px',
      marginBottom: '20px'
    }}>
      {buttons.map((btn) => (
        <button
          key={btn}
          onMouseDown={() => setActive(btn)}
          onMouseUp={() => setActive(null)}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            backgroundColor: active === btn ? '#00f0ff' : 'transparent',
            color: active === btn ? '#001133' : '#00f0ff',
            border: '2px solid #00f0ff',
            fontWeight: 'bold',
            fontSize: '16px',
            boxShadow: active === btn
              ? '0 0 20px #00f0ff'
              : '0 0 8px #00f0ff',
            cursor: 'pointer',
            transition: '0.3s'
          }}
        >
          {btn}
        </button>
      ))}
    </div>
  );
};

export default ResourceButtons;
