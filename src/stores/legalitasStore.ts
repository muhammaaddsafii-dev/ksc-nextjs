import { create } from 'zustand';
import { Legalitas } from '@/types';
import { mockLegalitas } from '@/mocks/data';

interface LegalitasStore {
  items: Legalitas[];
  isLoading: boolean;
  error: string | null;
  
  fetchItems: () => void;
  addItem: (item: Omit<Legalitas, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<Legalitas>) => void;
  deleteItem: (id: string) => void;
  getById: (id: string) => Legalitas | undefined;
}

export const useLegalitasStore = create<LegalitasStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: () => {
    set({ isLoading: true });
    setTimeout(() => {
      set({ items: mockLegalitas, isLoading: false });
    }, 300);
  },

  addItem: (item) => {
    const newItem: Legalitas = {
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
