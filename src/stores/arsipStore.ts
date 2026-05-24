import { create } from 'zustand';
import { ArsipPekerjaan } from '@/types';
import { arsipService } from '@/services/pekerjaan.service';

interface ArsipStore {
  items: ArsipPekerjaan[];
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  addItem: (item: Omit<ArsipPekerjaan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<ArsipPekerjaan>) => void;
  deleteItem: (id: string) => void;
  getById: (id: string) => ArsipPekerjaan | undefined;
}

export const useArsipStore = create<ArsipStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await arsipService.getAll();
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Gagal memuat data arsip' });
    }
  },

  addItem: (item) => {
    const newItem: ArsipPekerjaan = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ items: [...state.items, newItem] }));
  },

  updateItem: (id, updates) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      ),
    }));
  },

  deleteItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  getById: (id) => {
    return get().items.find((item) => item.id === id);
  },
}));
