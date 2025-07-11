 
// cosmic-shells/components/CosmicShellsToast.tsx

import React from 'react';
import { ToastNotification } from '../types';

interface CosmicShellsToastProps {
  toasts: ToastNotification[];
  onRemoveToast: (id: number) => void;
  colorStyle: string;
}

const CosmicShellsToast: React.FC<CosmicShellsToastProps> = ({
  toasts,
  onRemoveToast,
  colorStyle
}) => {
  const getToastColor = (type: string) => {
    switch (type) {
      case 'success': return colorStyle;
      case 'error': return '#ef4444';
      case 'warning': return '#ffa500';
      default: return colorStyle;
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '✅';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => onRemoveToast(toast.id)}
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              border: `2px solid ${getToastColor(toast.type)}`,
              borderRadius: '15px',
              padding: '15px 20px',
              color: '#fff',
              boxShadow: `0 0 20px ${getToastColor(toast.type)}50`,
              cursor: 'pointer',
              animation: 'slideInRight 0.3s ease-out',
              minWidth: '250px',
              maxWidth: '350px'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.2rem' }}>{getToastIcon(toast.type)}</span>
              <span style={{ 
                color: getToastColor(toast.type), 
                fontWeight: 'bold',
                textShadow: `0 0 10px ${getToastColor(toast.type)}`
              }}>
                {toast.message}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CSS анимации */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default CosmicShellsToast;export {}; 
