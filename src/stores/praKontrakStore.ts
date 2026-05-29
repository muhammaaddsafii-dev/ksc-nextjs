import { create } from 'zustand';
import { NonTender } from '@/types';
import { nonTenderService } from '@/services/pekerjaan.service';

interface NonTenderStore {
  items: NonTender[];
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  addItem: (item: Omit<NonTender, 'id' | 'createdAt' | 'updatedAt'>) => Promise<NonTender>;
  updateItem: (id: string, item: Partial<NonTender>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getById: (id: string) => NonTender | undefined;
}

export const useNonTenderStore = create<NonTenderStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    if (get().isLoading || get().items.length > 0) return;
    set({ isLoading: true, error: null });
    try {
      const items = await nonTenderService.getAll();
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Gagal memuat data non-tender' });
    }
  },

  addItem: async (item) => {
    const created = await nonTenderService.create(item);
    set((state) => ({ items: [...state.items, created] }));
    return created;
  },

  updateItem: async (id, updates) => {
    const updated = await nonTenderService.update(id, updates);
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
    }));
  },

  deleteItem: async (id) => {
    await nonTenderService.delete(id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  getById: (id) => get().items.find((i) => i.id === id),
}));
