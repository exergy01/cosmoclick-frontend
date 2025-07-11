 
// cosmic-shells/hooks/useToastNotifications.ts

import { useState, useCallback } from 'react';
import { ToastNotification } from '../types';

export const useToastNotifications = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'warning' = 'success', 
    duration: number = 4000
  ) => {
    const id = Date.now();
    const newToast: ToastNotification = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts
  };
};export {}; 
