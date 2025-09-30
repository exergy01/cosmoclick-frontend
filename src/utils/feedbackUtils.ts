// utils/feedbackUtils.ts - Общие функции для звука и вибрации

// 🪙 Функция для создания звука звона монетки
export const playCoinSound = async () => {
  try {
    // Проверяем поддержку AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.log('🔇 AudioContext не поддерживается');
      return;
    }

    const audioContext = new AudioContextClass();

    // Проверяем состояние контекста
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // 🪙 ЗВОН МОНЕТКИ: несколько быстрых звонков с разными частотами
    const coinSounds = [
      { freq: 800, time: 0 },       // Первый звон
      { freq: 1000, time: 0.08 },   // Второй звон
      { freq: 1200, time: 0.16 },   // Третий звон
      { freq: 900, time: 0.24 }     // Финальный звон
    ];

    coinSounds.forEach(({ freq, time }) => {
      // Создаем отдельный осциллятор для каждого звона
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Настройки для звона монетки
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + time);
      oscillator.type = 'sine';

      // Быстрое затухание для эффекта "звона"
      const startTime = audioContext.currentTime + time;
      const duration = 0.15;

      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      // Подключение
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Воспроизведение
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });

    console.log('🪙 Звон монетки воспроизведен');
  } catch (error) {
    console.log('🔇 Звук недоступен:', error);
  }
};

// 📳 Функция для максимально сильной вибрации
export const triggerStrongVibration = () => {
  try {
    console.log('📳 Попытка сильной вибрации...');

    // Используем type assertion для обхода TypeScript проблемы
    const telegramWebApp = (window as any).Telegram?.WebApp;

    // Telegram WebApp API для вибрации
    if (telegramWebApp?.HapticFeedback) {
      // 💥 МАКСИМАЛЬНАЯ ВИБРАЦИЯ: серия heavy импульсов
      telegramWebApp.HapticFeedback.impactOccurred('heavy');
      console.log('📳 Первая сильная вибрация через Telegram WebApp');

      // 🎉 ДОПОЛНИТЕЛЬНЫЕ ИМПУЛЬСЫ для максимального эффекта
      setTimeout(() => {
        telegramWebApp.HapticFeedback.impactOccurred('heavy');
        console.log('📳 Вторая сильная вибрация');
      }, 100);

      setTimeout(() => {
        telegramWebApp.HapticFeedback.notificationOccurred('success');
        console.log('📳 Нотификация успеха');
      }, 200);

      setTimeout(() => {
        telegramWebApp.HapticFeedback.impactOccurred('heavy');
        console.log('📳 Финальная сильная вибрация');
      }, 300);

      return;
    }

    // Резервный вариант для обычных браузеров - МАКСИМАЛЬНАЯ вибрация
    if ('vibrate' in navigator) {
      // 🚨 СУПЕР МОЩНАЯ ВИБРАЦИЯ: длинные импульсы, много раз
      const vibrated = navigator.vibrate([300, 100, 300, 100, 300, 100, 400]);
      console.log('📳 МАКСИМАЛЬНАЯ вибрация через Navigator API:', vibrated);
      return;
    }

    console.log('📳 Вибрация недоступна');
  } catch (error) {
    console.log('📳 Ошибка вибрации:', error);
  }
};

// 🎉 Комбинированная функция для полного feedback (звук + вибрация)
export const triggerSuccessFeedback = async () => {
  // Мгновенная вибрация
  triggerStrongVibration();

  // Звук с небольшой задержкой для лучшего эффекта
  setTimeout(async () => {
    await playCoinSound();
  }, 100);
};