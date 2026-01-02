import { create } from 'zustand';
import { ArsipPekerjaan } from '@/types';
import { mockArsipPekerjaan } from '@/mocks/data';

interface ArsipStore {
  items: ArsipPekerjaan[];
  isLoading: boolean;
  error: string | null;
  
  fetchItems: () => void;
  addItem: (item: Omit<ArsipPekerjaan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<ArsipPekerjaan>) => void;
  deleteItem: (id: string) => void;
  getById: (id: string) => ArsipPekerjaan | undefined;
}

export const useArsipStore = create<ArsipStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: () => {
    set({ isLoading: true });
    setTimeout(() => {
      set({ items: mockArsipPekerjaan, isLoading: false });
    }, 300);
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
