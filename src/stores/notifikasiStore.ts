import { create } from 'zustand';
import { Notifikasi } from '@/types';
import notifikasiService from '@/services/notifikasi.service';

interface NotifikasiStore {
  notifikasi: Notifikasi[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifikasi: () => Promise<void>;
  tandaiBaca: (id: string) => Promise<void>;
  tandaiSemuaBaca: () => Promise<void>;
}

export const useNotifikasiStore = create<NotifikasiStore>((set, get) => ({
  notifikasi: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifikasi: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const notifikasi = await notifikasiService.getAll();
      const unreadCount = notifikasi.filter((n) => !n.is_read).length;
      set({ notifikasi, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Gagal memuat notifikasi' });
    }
  },

  tandaiBaca: async (id: string) => {
    set((state) => ({
      notifikasi: state.notifikasi.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(
        0,
        state.unreadCount - (state.notifikasi.find((n) => n.id === id && !n.is_read) ? 1 : 0)
      ),
    }));
    try {
      await notifikasiService.markAsRead(id);
    } catch {
      await get().fetchNotifikasi();
    }
  },

  tandaiSemuaBaca: async () => {
    set((state) => ({
      notifikasi: state.notifikasi.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
    try {
      await notifikasiService.markAllAsRead();
    } catch {
      await get().fetchNotifikasi();
    }
  },
}));
