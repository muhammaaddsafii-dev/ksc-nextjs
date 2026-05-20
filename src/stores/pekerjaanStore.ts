import { create } from 'zustand';
import { Pekerjaan, TahapanKerja, AnggaranItem, Adendum } from '@/types';
import { activePekerjaanService } from '@/services/pekerjaan.service';

interface PekerjaanStore {
  items: Pekerjaan[];
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  addItem: (item: Omit<Pekerjaan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Pekerjaan>;
  updateItem: (id: string, item: Partial<Pekerjaan>) => Promise<Pekerjaan>;
  deleteItem: (id: string) => Promise<void>;
  getById: (id: string) => Pekerjaan | undefined;

  // Tahapan — local-only helpers (used by hooks but not persisted separately)
  addTahapan: (pekerjaanId: string, tahapan: Omit<TahapanKerja, 'id'>) => void;
  updateTahapan: (pekerjaanId: string, tahapanId: string, updates: Partial<TahapanKerja>) => void;
  deleteTahapan: (pekerjaanId: string, tahapanId: string) => void;

  // Anggaran — local-only (no backend equivalent)
  addAnggaran: (pekerjaanId: string, anggaran: Omit<AnggaranItem, 'id'>) => void;
  updateAnggaran: (pekerjaanId: string, anggaranId: string, updates: Partial<AnggaranItem>) => void;
  deleteAnggaran: (pekerjaanId: string, anggaranId: string) => void;

  // Adendum — local-only (backend adendum is per-tahapan, not per-pekerjaan)
  addAdendum: (pekerjaanId: string, adendum: Omit<Adendum, 'id'>) => void;
}

export const usePekerjaanStore = create<PekerjaanStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await activePekerjaanService.getAll();
      set({ items, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Gagal memuat data pekerjaan' });
    }
  },

  addItem: async (item) => {
    const created = await activePekerjaanService.create(item);
    set((state) => ({ items: [...state.items, created] }));
    return created;
  },

  updateItem: async (id, updates) => {
    const updated = await activePekerjaanService.update(id, updates);
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
    }));
    return updated;
  },

  deleteItem: async (id) => {
    await activePekerjaanService.delete(id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  getById: (id) => get().items.find((i) => i.id === id),

  // Local state helpers for tahapan (form-level only, committed via updateItem)
  addTahapan: (pekerjaanId, tahapan) => {
    const newTahapan: TahapanKerja = { ...tahapan, id: Date.now().toString() };
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? { ...item, tahapan: [...item.tahapan, newTahapan] }
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
            }
          : item
      ),
    }));
  },

  deleteTahapan: (pekerjaanId, tahapanId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? { ...item, tahapan: item.tahapan.filter((t) => t.id !== tahapanId) }
          : item
      ),
    }));
  },

  addAnggaran: (pekerjaanId, anggaran) => {
    const newAnggaran: AnggaranItem = { ...anggaran, id: Date.now().toString() };
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? { ...item, anggaran: [...item.anggaran, newAnggaran] }
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
            }
          : item
      ),
    }));
  },

  deleteAnggaran: (pekerjaanId, anggaranId) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? { ...item, anggaran: item.anggaran.filter((a) => a.id !== anggaranId) }
          : item
      ),
    }));
  },

  addAdendum: (pekerjaanId, adendum) => {
    const newAdendum: Adendum = { ...adendum, id: Date.now().toString() };
    set((state) => ({
      items: state.items.map((item) =>
        item.id === pekerjaanId
          ? { ...item, adendum: [...item.adendum, newAdendum] }
          : item
      ),
    }));
  },
}));
