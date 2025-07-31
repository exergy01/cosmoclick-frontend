// src/components/ToastNotification.tsx
import React, { useEffect, useState } from 'react';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  duration?: number; // Продолжительность отображения тоста (в мс), по умолчанию 3000
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ 
  message, 
  type, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    // Очистка таймера при размонтировании компонента
    return () => clearTimeout(timer);
  }, [duration]);

  const getBackgroundColor = (toastType: string) => {
    switch (toastType) {
      case 'success': return 'rgba(76, 175, 80, 0.9)'; // Зеленый
      case 'error': return 'rgba(244, 67, 54, 0.9)';   // Красный
      case 'warning': return 'rgba(255, 152, 0, 0.9)'; // Оранжевый
      default: return 'rgba(0, 0, 0, 0.9)'; // Черный по умолчанию
    }
  };

  const getBorderColor = (toastType: string) => {
    switch (toastType) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#fff';
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
    <div
      style={{
        background: getBackgroundColor(type),
        border: `2px solid ${getBorderColor(type)}`,
        borderRadius: '15px',
        padding: '15px 20px',
        color: '#fff',
        boxShadow: `0 0 20px ${getBorderColor(type)}50`,
        transition: 'opacity 0.5s ease-out',
        opacity: isVisible ? 1 : 0,
        minWidth: '250px',
        maxWidth: '350px',
        animation: 'slideInRight 0.3s ease-out' // Предполагаем, что @keyframes slideInRight определен глобально
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '1.2rem' }}>{getIcon(type)}</span>
        <span style={{ 
          fontWeight: 'bold',
          textShadow: `0 0 5px ${getBorderColor(type)}`
        }}>
          {message}
        </span>
      </div>
    </div>
  );
};

export default ToastNotification;