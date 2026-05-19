import { create } from 'zustand';
import { TenagaAhli } from '@/types';
import { tenagaAhliService } from '@/services/tenagaAhli.service';

interface TenagaAhliStore {
  items: TenagaAhli[];
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addItemToList: (item: TenagaAhli) => void;
  updateItemInList: (item: TenagaAhli) => void;
  getById: (id: string) => TenagaAhli | undefined;
}

export const useTenagaAhliStore = create<TenagaAhliStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await tenagaAhliService.getAll();
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Gagal memuat data tenaga ahli' });
    }
  },

  deleteItem: async (id: string) => {
    await tenagaAhliService.delete(id);
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  addItemToList: (item: TenagaAhli) => {
    set((state) => ({ items: [...state.items, item] }));
  },

  updateItemInList: (item: TenagaAhli) => {
    set((state) => ({
      items: state.items.map((existing) =>
        existing.id === item.id ? item : existing
      ),
    }));
  },

  getById: (id: string) => {
    return get().items.find((item) => item.id === id);
  },
}));
