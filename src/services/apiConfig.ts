// Базовая конфигурация для всех API запросов
import axios from 'axios';

export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cosmoclick-backend.onrender.com'
  : 'http://localhost:5000';

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
      if (i === retries - 1) {
        throw new Error(`Failed to fetch data: ${err.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};