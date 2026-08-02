import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const TOKEN_KEY = 'mbaara_token';

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(){
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function register(email: string, password: string){
  const resp = await api.post('/auth/register', { email, password });
  const token = resp.data?.access_token;
  if (token) await saveToken(token);
  return resp.data;
}

export async function login(email: string, password: string){
  const resp = await api.post('/auth/login', { email, password });
  const token = resp.data?.access_token;
  if (token) await saveToken(token);
  return resp.data;
}
