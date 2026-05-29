import { create } from 'zustand';
import { Perusahaan } from '@/types';
import { perusahaanService, PerusahaanPayload } from '@/services/perusahaan.service';

interface PerusahaanStore {
  items: Perusahaan[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (payload: PerusahaanPayload) => Promise<Perusahaan>;
  updateItem: (id: string, payload: PerusahaanPayload) => Promise<Perusahaan>;
  deleteItem: (id: string) => Promise<void>;
}

export const usePerusahaanStore = create<PerusahaanStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    if (get().isLoading || get().items.length > 0) return;
    set({ isLoading: true, error: null });
    try {
      const items = await perusahaanService.getAll();
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Gagal memuat data perusahaan' });
    }
  },

  addItem: async (payload: PerusahaanPayload) => {
    const item = await perusahaanService.create(payload);
    set((state) => ({ items: [...state.items, item] }));
    return item;
  },

  updateItem: async (id: string, payload: PerusahaanPayload) => {
    const item = await perusahaanService.update(id, payload);
    set((state) => ({
      items: state.items.map((existing) => (existing.id === id ? item : existing)),
    }));
    return item;
  },

  deleteItem: async (id: string) => {
    await perusahaanService.delete(id);
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
}));
