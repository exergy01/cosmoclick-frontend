import { useState } from 'react';

export const useNotifications = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearNotifications = () => {
    setError(null);
    setSuccess(null);
  };

  const showError = (message: string) => {
    setError(message);
    setSuccess(null);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError(null);
  };

  return { error, success, setError, setSuccess, showError, showSuccess, clearNotifications };
};