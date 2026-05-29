import { create } from 'zustand';
import { Dokumen } from '@/types';
import { dokumenService, mapDokumen } from '@/services/dokumen.service';

interface DokumenStore {
  items: Dokumen[];
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  addItemToList: (item: Dokumen) => void;
  updateItemInList: (item: Dokumen) => void;
  deleteFromList: (id: string) => void;
}

export const useDokumenStore = create<DokumenStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    if (get().isLoading || get().items.length > 0) return;
    set({ isLoading: true, error: null });
    try {
      const rawList = await dokumenService.getAll();
      set({ items: rawList.map(mapDokumen), isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Gagal memuat data dokumen' });
    }
  },

  addItemToList: (item) => set((state) => ({ items: [...state.items, item] })),

  updateItemInList: (item) =>
    set((state) => ({
      items: state.items.map((existing) => (existing.id === item.id ? item : existing)),
    })),

  deleteFromList: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
}));
