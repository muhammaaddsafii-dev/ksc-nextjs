import { create } from 'zustand';
import { TenagaAhli, Sertifikat } from '@/types';
import { mockTenagaAhli } from '@/mocks/data';

interface TenagaAhliStore {
  items: TenagaAhli[];
  isLoading: boolean;
  error: string | null;
  
  fetchItems: () => void;
  addItem: (item: Omit<TenagaAhli, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<TenagaAhli>) => void;
  deleteItem: (id: string) => void;
  getById: (id: string) => TenagaAhli | undefined;
  
  addSertifikat: (tenagaAhliId: string, sertifikat: Omit<Sertifikat, 'id'>) => void;
  deleteSertifikat: (tenagaAhliId: string, sertifikatId: string) => void;
}

export const useTenagaAhliStore = create<TenagaAhliStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: () => {
    set({ isLoading: true });
    setTimeout(() => {
      set({ items: mockTenagaAhli, isLoading: false });
    }, 300);
  },

  addItem: (item) => {
    const newItem: TenagaAhli = {
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

  addSertifikat: (tenagaAhliId, sertifikat) => {
    const newSertifikat: Sertifikat = { ...sertifikat, id: Date.now().toString() };
    set((state) => ({
      items: state.items.map((item) =>
        item.id === tenagaAhliId
          ? { ...item, sertifikat: [...item.sertifikat, newSertifikat], updatedAt: new Date() }
          : item
      ),
    }));
  },

  deleteSertifikat: (tenagaAhliId, sertifikatId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === tenagaAhliId
          ? {
              ...item,
              sertifikat: item.sertifikat.filter((s) => s.id !== sertifikatId),
              updatedAt: new Date(),
            }
          : item
      ),
    }));
  },
}));
