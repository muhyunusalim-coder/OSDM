import { create } from 'zustand';
import { AuthUser, UserRole } from '../../types';
import { getAuthToken, setAuthToken, logoutFromBackend } from '../../services/dataService';

// Ensure legacy localStorage keys are permanently removed
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kgb_auth_session');
    localStorage.removeItem('kgb_user_nip');
  }
} catch (e) {
  // Ignore
}

interface AppState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  userNip: string | null;
  userRole: UserRole;
  token: string | null;
  login: (user: AuthUser, token?: string) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: !!getAuthToken(),
  user: null,
  userNip: null,
  userRole: 'pegawai',
  token: getAuthToken(),

  login: (user: AuthUser, token?: string) => {
    if (token) {
      setAuthToken(token);
    }
    set({
      isAuthenticated: true,
      user,
      userNip: user.nip,
      userRole: user.role,
      token: token || getAuthToken(),
    });
  },

  logout: () => {
    logoutFromBackend();
    set({
      isAuthenticated: false,
      user: null,
      userNip: null,
      userRole: 'pegawai',
      token: null,
    });
  },

  setUser: (user: AuthUser | null) => {
    if (user) {
      set({
        isAuthenticated: true,
        user,
        userNip: user.nip,
        userRole: user.role,
      });
    } else {
      set({
        isAuthenticated: false,
        user: null,
        userNip: null,
        userRole: 'pegawai',
      });
    }
  },
}));
