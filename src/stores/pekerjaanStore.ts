import { create } from 'zustand';
import { Pekerjaan, TahapanKerja, AnggaranItem, Adendum } from '@/types';
import { mockPekerjaan } from '@/mocks/data';

interface PekerjaanStore {
  items: Pekerjaan[];
  isLoading: boolean;
  error: string | null;
  
  fetchItems: () => void;
  addItem: (item: Omit<Pekerjaan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<Pekerjaan>) => void;
  deleteItem: (id: string) => void;
  getById: (id: string) => Pekerjaan | undefined;
  
  // Tahapan
  addTahapan: (pekerjaanId: string, tahapan: Omit<TahapanKerja, 'id'>) => void;
  updateTahapan: (pekerjaanId: string, tahapanId: string, updates: Partial<TahapanKerja>) => void;
  deleteTahapan: (pekerjaanId: string, tahapanId: string) => void;
  
  // Anggaran
  addAnggaran: (pekerjaanId: string, anggaran: Omit<AnggaranItem, 'id'>) => void;
  updateAnggaran: (pekerjaanId: string, anggaranId: string, updates: Partial<AnggaranItem>) => void;
  deleteAnggaran: (pekerjaanId: string, anggaranId: string) => void;
  
  // Adendum
  addAdendum: (pekerjaanId: string, adendum: Omit<Adendum, 'id'>) => void;
}

export const usePekerjaanStore = create<PekerjaanStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: () => {
    set({ isLoading: true });
    setTimeout(() => {
      set({ items: mockPekerjaan, isLoading: false });
    }, 300);
  },

  addItem: (item) => {
    const newItem: Pekerjaan = {
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

  addTahapan: (pekerjaanId, tahapan) => {
    const newTahapan: TahapanKerja = { ...tahapan, id: Date.now().toString() };
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? { ...item, tahapan: [...item.tahapan, newTahapan], updatedAt: new Date() }
          : item
      ),
    }));
  },

  updateTahapan: (pekerjaanId, tahapanId, updates) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? {
              ...item,
              tahapan: item.tahapan.map((t) =>
                t.id === tahapanId ? { ...t, ...updates } : t
              ),
              updatedAt: new Date(),
            }
          : item
      ),
    }));
  },

  deleteTahapan: (pekerjaanId, tahapanId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? {
              ...item,
              tahapan: item.tahapan.filter((t) => t.id !== tahapanId),
              updatedAt: new Date(),
            }
          : item
      ),
    }));
  },

  addAnggaran: (pekerjaanId, anggaran) => {
    const newAnggaran: AnggaranItem = { ...anggaran, id: Date.now().toString() };
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? { ...item, anggaran: [...item.anggaran, newAnggaran], updatedAt: new Date() }
          : item
      ),
    }));
  },

  updateAnggaran: (pekerjaanId, anggaranId, updates) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? {
              ...item,
              anggaran: item.anggaran.map((a) =>
                a.id === anggaranId ? { ...a, ...updates } : a
              ),
              updatedAt: new Date(),
            }
          : item
      ),
    }));
  },

  deleteAnggaran: (pekerjaanId, anggaranId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? {
              ...item,
              anggaran: item.anggaran.filter((a) => a.id !== anggaranId),
              updatedAt: new Date(),
            }
          : item
      ),
    }));
  },

  addAdendum: (pekerjaanId, adendum) => {
    const newAdendum: Adendum = { ...adendum, id: Date.now().toString() };
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? { ...item, adendum: [...item.adendum, newAdendum], updatedAt: new Date() }
          : item
      ),
    }));
  },
}));
