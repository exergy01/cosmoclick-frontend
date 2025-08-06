// src/components/ToastNotification.tsx
import React, { useEffect, useState } from 'react';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number;
  colorStyle: string;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  type,
  duration = 3000,
  colorStyle
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const getToastColor = (toastType: string) => {
    switch (toastType) {
      case 'success': return colorStyle;
      case 'error': return '#ef4444';
      case 'warning': return '#ffa500';
      default: return colorStyle;
    }
  };

  const getIcon = (toastType: string) => {
    switch (toastType) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '💬';
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: `2px solid ${getToastColor(type)}`,
          borderRadius: '15px',
          padding: '15px 20px',
          color: '#fff',
          boxShadow: `0 0 20px ${getToastColor(type)}50`,
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>{getIcon(type)}</span>
          <span style={{
            color: getToastColor(type),
            fontWeight: 'bold',
            textShadow: `0 0 10px ${getToastColor(type)}`
          }}>
            {message}
          </span>
        </div>
      </div>
      {/* 🔥 ОПРЕДЕЛЕНИЕ АНИМАЦИИ ПЕРЕНЕСЕНО СЮДА */}
      <style>
        {`
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
        `}
      </style>
    </>
  );
};

export default ToastNotification;