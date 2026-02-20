import { apiClient } from './client';

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; username: string; password: string }

export const authApi = {
  login: (data: LoginRequest) => apiClient.post('/auth/login', data),
  register: (data: RegisterRequest) => apiClient.post('/auth/register', data),
  me: () => apiClient.get('/auth/me'),
  refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
  logout: () => apiClient.post('/auth/logout'),
};
