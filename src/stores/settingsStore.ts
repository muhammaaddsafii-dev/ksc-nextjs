import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProfilPerusahaan, AppSettings } from '@/types';
import { mockProfilPerusahaan } from '@/mocks/data';

interface SettingsStore {
  profil: ProfilPerusahaan;
  settings: AppSettings;
  
  updateProfil: (profil: Partial<ProfilPerusahaan>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      profil: mockProfilPerusahaan,
      settings: {
        theme: 'light',
        language: 'id',
        notifikasi: true,
      },

      updateProfil: (updates) => {
        set((state) => ({
          profil: { ...state.profil, ...updates },
        }));
      },

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      toggleTheme: () => {
        const newTheme = get().settings.theme === 'light' ? 'dark' : 'light';
        set((state) => ({
          settings: { ...state.settings, theme: newTheme },
        }));
        
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'ksc-settings',
      onRehydrateStorage: () => (state) => {
        if (state?.settings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
