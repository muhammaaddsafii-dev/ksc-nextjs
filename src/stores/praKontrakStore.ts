import { create } from 'zustand';
import { PraKontrakNonLelang } from '@/types';
import { mockPraKontrakNonLelang } from '@/mocks/data';

interface PraKontrakStore {
  items: PraKontrakNonLelang[];
  isLoading: boolean;
  error: string | null;
  
  fetchItems: () => void;
  addItem: (item: Omit<PraKontrakNonLelang, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<PraKontrakNonLelang>) => void;
  deleteItem: (id: string) => void;
  getById: (id: string) => PraKontrakNonLelang | undefined;
}

export const usePraKontrakStore = create<PraKontrakStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: () => {
    set({ isLoading: true });
    setTimeout(() => {
      set({ items: mockPraKontrakNonLelang, isLoading: false });
    }, 300);
  },

  addItem: (item) => {
    const newItem: PraKontrakNonLelang = {
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
