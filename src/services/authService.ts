import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth'; // адрес нашего бэкенда

export async function registerPlayer(telegram_id: number, username: string) {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      telegram_id,
      username,
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    throw error;
  }
}
