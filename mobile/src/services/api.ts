import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'X-Client-Platform': 'mobile' },
});

// Attach auth token to requests if present
api.interceptors.request.use(async (cfg: InternalAxiosRequestConfig) => {
  try {
    const token = await AsyncStorage.getItem('mbaara_token');
    if (token) {
      cfg.headers = cfg.headers ?? {};
      (cfg.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {}
  return cfg;
});

export async function healthCheck() {
  const response = await api.get('/health');
  return response.data;
}

export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

export async function getLessons() {
  const response = await api.get('/lessons');
  return response.data;
}

export async function getProgress() {
  const response = await api.get('/progress');
  return response.data;
}

export async function transcribeAudio(file: FormData) {
  const response = await api.post('/audio/transcribe', file, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function synthesizeAudio(text: string, languageCode?: string) {
  const response = await api.post('/audio/synthesize', { text, language_code: languageCode });
  return response.data;
}
