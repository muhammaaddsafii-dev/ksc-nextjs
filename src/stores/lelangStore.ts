import { create } from 'zustand';
import { PraKontrakLelang } from '@/types';
import { mockPraKontrakLelang } from '@/mocks/data';

interface LelangStore {
  items: PraKontrakLelang[];
  isLoading: boolean;
  error: string | null;
  
  fetchItems: () => void;
  addItem: (item: Omit<PraKontrakLelang, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<PraKontrakLelang>) => void;
  deleteItem: (id: string) => void;
  getById: (id: string) => PraKontrakLelang | undefined;
}

export const useLelangStore = create<LelangStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: () => {
    set({ isLoading: true });
    setTimeout(() => {
      set({ items: mockPraKontrakLelang, isLoading: false });
    }, 300);
  },

  addItem: (item) => {
    const newItem: PraKontrakLelang = {
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
