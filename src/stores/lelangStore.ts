import { create } from 'zustand';
import { Tender } from '@/types';
import { tenderService } from '@/services/pekerjaan.service';

interface TenderStore {
  items: Tender[];
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  addItem: (item: Omit<Tender, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Tender>;
  updateItem: (id: string, item: Partial<Tender>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getById: (id: string) => Tender | undefined;
}

export const useTenderStore = create<TenderStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    if (get().isLoading || get().items.length > 0) return;
    set({ isLoading: true, error: null });
    try {
      const items = await tenderService.getAll();
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Gagal memuat data tender' });
    }
  },

  addItem: async (item) => {
    const created = await tenderService.create(item);
    set((state) => ({ items: [...state.items, created] }));
    return created;
  },

  updateItem: async (id, updates) => {
    const updated = await tenderService.update(id, updates);
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
    }));
  },

  deleteItem: async (id) => {
    await tenderService.delete(id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  getById: (id) => get().items.find((i) => i.id === id),
}));
