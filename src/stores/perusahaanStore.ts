import { create } from 'zustand';
import { Perusahaan } from '@/types';
import { mockPerusahaan } from '@/mocks/data';

interface PerusahaanStore {
    items: Perusahaan[];
    isLoading: boolean;
    error: string | null;
    fetchItems: () => Promise<void>;
    addItem: (item: Omit<Perusahaan, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateItem: (id: string, item: Partial<Perusahaan>) => void;
    deleteItem: (id: string) => void;
}

export const usePerusahaanStore = create<PerusahaanStore>((set) => ({
    items: [],
    isLoading: false,
    error: null,
    fetchItems: async () => {
        set({ isLoading: true });
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 500));
            set({ items: mockPerusahaan, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch items', isLoading: false });
        }
    },
    addItem: (newItem) => {
        set((state) => ({
            items: [
                ...state.items,
                {
                    ...newItem,
                    id: Math.random().toString(36).substr(2, 9),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
        }));
    },
    updateItem: (id, updatedItem) => {
        set((state) => ({
            items: state.items.map((item) =>
                item.id === id ? { ...item, ...updatedItem, updatedAt: new Date() } : item
            ),
        }));
    },
    deleteItem: (id) => {
        set((state) => ({
            items: state.items.filter((item) => item.id !== id),
        }));
    },
}));
