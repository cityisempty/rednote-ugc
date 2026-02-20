import { create } from 'zustand';
import { authApi, LoginRequest, RegisterRequest } from '../api/auth';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
  credits: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateCredits: (credits: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  login: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.login(data);
      const { user, accessToken, refreshToken } = res.data.data;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      set({ user, loading: false, initialized: true });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.register(data);
      const { user, accessToken, refreshToken } = res.data.data;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      set({ user, loading: false, initialized: true });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, initialized: true });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ initialized: true });
      return;
    }
    try {
      const res = await authApi.me();
      set({ user: res.data.data, initialized: true });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, initialized: true });
    }
  },

  updateCredits: (credits) => {
    set((state) => state.user ? { user: { ...state.user, credits } } : {});
  },
}));
