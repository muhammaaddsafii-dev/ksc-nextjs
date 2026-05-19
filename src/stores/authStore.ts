import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  username: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${BASE_URL}/api/auth/token/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const message =
              err?.detail || err?.non_field_errors?.[0] || 'Username atau password salah.';
            set({ isLoading: false, error: message });
            throw new Error(message);
          }

          const data: { access: string; refresh: string } = await response.json();

          set({
            accessToken: data.access,
            refreshToken: data.refresh,
            user: { username },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Set cookie untuk middleware route protection
          if (typeof document !== 'undefined') {
            document.cookie = 'ksc-auth-status=true; path=/; SameSite=Lax';
          }
        } catch (error) {
          if (error instanceof Error && get().error) {
            // already set above
          } else {
            set({ isLoading: false, error: 'Terjadi kesalahan. Coba lagi.' });
          }
          throw error;
        }
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
        // Hapus cookie auth
        if (typeof document !== 'undefined') {
          document.cookie = 'ksc-auth-status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      },

      setAccessToken: (token: string) => {
        set({ accessToken: token });
      },

      clearAuth: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
        // Hapus cookie auth
        if (typeof document !== 'undefined') {
          document.cookie = 'ksc-auth-status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      },

      refreshAccessToken: async (): Promise<string | null> => {
        const currentRefresh = get().refreshToken;
        if (!currentRefresh) {
          get().clearAuth();
          return null;
        }

        try {
          const response = await fetch(`${BASE_URL}/api/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: currentRefresh }),
          });

          if (!response.ok) {
            get().clearAuth();
            return null;
          }

          const data: { access: string } = await response.json();
          set({ accessToken: data.access });
          return data.access;
        } catch {
          get().clearAuth();
          return null;
        }
      },
    }),
    {
      name: 'ksc-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Set cookie saat state di-restore dari localStorage (page refresh)
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated && typeof document !== 'undefined') {
          document.cookie = 'ksc-auth-status=true; path=/; SameSite=Lax';
        }
      },
    }
  )
);
