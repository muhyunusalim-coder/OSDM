import { create } from 'zustand';

interface AppState {
  isAuthenticated: boolean;
  userNip: string | null;
  login: (nip: string) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: localStorage.getItem('kgb_auth_session') === 'true' || sessionStorage.getItem('kgb_auth_session') === 'true',
  userNip: localStorage.getItem('kgb_user_nip') || sessionStorage.getItem('kgb_user_nip') || null,
  login: (nip: string) => {
    try {
      localStorage.setItem('kgb_auth_session', 'true');
      localStorage.setItem('kgb_user_nip', nip);
      sessionStorage.setItem('kgb_auth_session', 'true');
      sessionStorage.setItem('kgb_user_nip', nip);
    } catch (e) {
      console.warn('Error saving login session:', e);
    }
    set({ isAuthenticated: true, userNip: nip });
  },
  logout: () => {
    try {
      localStorage.removeItem('kgb_auth_session');
      localStorage.removeItem('kgb_user_nip');
      sessionStorage.removeItem('kgb_auth_session');
      sessionStorage.removeItem('kgb_user_nip');
    } catch (e) {
      console.warn('Error clearing login session:', e);
    }
    set({ isAuthenticated: false, userNip: null });
  },
}));
