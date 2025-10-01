// Базовая конфигурация для всех API запросов
import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// Утилита для повторных запросов
export const fetchWithRetry = async (
  url: string, 
  retries: number = 3, 
  delay: number = 1000, 
  timeout: number = 10000
): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await axios.get(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (err: any) {
      console.log(`Retry ${i + 1} failed for ${url}: ${err.message}`);
      
      // 🔥 ИСПРАВЛЕНО: Не повторяем запросы для HTTP ошибок 4xx (клиентские ошибки)
      if (err.response?.status >= 400 && err.response?.status < 500) {
        console.log(`HTTP ${err.response.status} - не повторяем запрос`);
        throw err; // 🔥 Возвращаем ОРИГИНАЛЬНУЮ ошибку с response.status
      }
      
      if (i === retries - 1) {
        // 🔥 ИСПРАВЛЕНО: Для сетевых ошибок сохраняем оригинальную ошибку если она есть
        if (err.response || err.request) {
          throw err;
        } else {
          throw new Error(`Failed to fetch data: ${err.message}`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};