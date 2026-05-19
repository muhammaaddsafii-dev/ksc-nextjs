import { create } from 'zustand';
import { Alat } from '@/types';
import { alatService, mapAlat } from '@/services/alat.service';

interface AlatStore {
  items: Alat[];
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  addItemToList: (item: Alat) => void;
  updateItemInList: (item: Alat) => void;
  deleteFromList: (id: string) => void;
  getById: (id: string) => Alat | undefined;
}

export const useAlatStore = create<AlatStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const rawList = await alatService.getRawAlat();
      set({ items: rawList.map(mapAlat), isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Gagal memuat data alat' });
    }
  },

  addItemToList: (item: Alat) => {
    set((state) => ({ items: [...state.items, item] }));
  },

  updateItemInList: (item: Alat) => {
    set((state) => ({
      items: state.items.map((existing) => (existing.id === item.id ? item : existing)),
    }));
  },

  deleteFromList: (id: string) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },

  getById: (id: string) => {
    return get().items.find((item) => item.id === id);
  },
}));
